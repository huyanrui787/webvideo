/**
 * System prompt for illustration-video projects (v2).
 * Pure slideshow: AI-generated 16:9 images + narration audio.
 *
 * This project type has ZERO code — no scaffold, no React chapters,
 * no Blueprint, no tsc. The pipeline is purely: writing → illustrating → done.
 */
import type { Project } from "@/lib/db/schema";
import type { SystemModelMessage } from "ai";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ILLUSTRATION_SKILL_ID } from "@/lib/skills";
import { getMainSkillDir } from "@/lib/env";
import {
  formatModelName, buildProjectStateSummary,
  buildIllustrationRefs, buildEnabledSkillsSection,
  buildAssetsManifest, applySizeGuard,
} from "./system-prompt";
import { resolveActiveStyle } from "@/lib/illustration-style";

const MAX_SYSTEM_CHARS = 50_000;

export async function buildIllustSystemPrompt(project: Project, enabledSkills: string[] = [ILLUSTRATION_SKILL_ID]): Promise<SystemModelMessage[]> {
  const enabledSection = buildEnabledSkillsSection(enabledSkills, ILLUSTRATION_SKILL_ID);
  const stateSummary = await buildProjectStateSummary(project, true);
  const assetsManifest = await buildAssetsManifest(project);

  const isWriting = project.status === "writing";
  const isIllustrating = project.status === "illustrating";
  const isBuilding = project.status === "building";
  const isDone = project.status === "done";

  // Only load illustration refs (6.6KB) when designing/generating images — not during writing
  const illustRefs = (isIllustrating || isBuilding) ? buildIllustrationRefs() : "";
  // Only load assets manifest when there are assets to reference
  const assetsSection = (assetsManifest && assetsManifest.length > 30) ? assetsManifest : "";

  // Resolve the character name & illustration count from the project's style config
  let characterName = "小黑";
  let illustrationCount = 0;
  try {
    const sc = project.styleConfig ? JSON.parse(project.styleConfig) : null;
    if (sc) {
      if (sc.activePreset && sc.activePreset !== "xiaobei") {
        const resolved = resolveActiveStyle(sc);
        if (resolved) characterName = resolved.characterName;
      }
      if (sc.illustrationCount && typeof sc.illustrationCount === "number") {
        illustrationCount = sc.illustrationCount;
      }
    }
  } catch {}

  const identityAndTools = `## 你的身份

你是绘图视频 AI Agent，将文章转化为全屏 AI 插画 + 语音旁白的视频。
使用 ProjectRead / ProjectWrite 读写文件，ProjectSetStatus 推进状态。

**语言要求：所有回复必须使用中文，禁止使用英文。**

**⚠️ 本项目的环境不需要任何代码。不存在脚手架、React 组件、Blueprint、tsc。**`;

  const writingRules = isWriting ? `
## 写作阶段

**⚠️ 已有文件不重写。不要调用 ProjectList 检查文件——项目状态摘要已含所有文件信息。直接执行以下操作。**

每步操作前用一句话告知进度（≤15 字），然后立即执行工具调用：
	- 读文章: "正在阅读文章内容…" → ProjectRead
	- 写口播: "正在生成口播稿，共 N 个节拍…" → ProjectWrite("script.md", ...)
	- 写插画: "正在设计插画方案…" → ProjectWrite("illustrations.json", ...)
	- 完成: "插画方案完成，共 N 个节拍" → ProjectSetStatus("illustrating")

	⚠️ 每句进度提示后必须立即执行对应的工具调用，不要展开解释。禁止在工具调用之间插入大段文字。

### 步骤（在同一个回复中全部完成）：

**如果 script.md 已经存在，跳过步骤 A，直接从步骤 B 继续。**

**步骤 A — 如 script.md 不存在：** ProjectRead("article.md") → ProjectWrite("script.md", 口播稿)
  - 用 --- 分隔每个节拍${illustrationCount > 0 ? `，全文 ${illustrationCount} 个节拍` : "，全文 20-50 个节拍"}
  - 每个节拍 = 一张插画 + 一段配音

**步骤 B — 紧接着步骤 A，禁止停下来：** ProjectWrite("illustrations.json", 插画设计)
  - 为每个口播节拍设计一张 16:9 全屏插画${illustrationCount > 0 ? `（共 ${illustrationCount} 张）` : ""}

illustrations.json 格式：
\`\`\`json
{
  "shots": [
    {
      "id": "step-01",
      "narrationIndex": 0,
      "theme": "核心主题（2-8字提炼本节拍的核心概念）",
      "structureType": "概念隐喻",
      "coreIdea": "这张图要表达的核心意思，包含具体的视觉隐喻",
      "xiaoheiAction": "${characterName}在画面中的动作（拉/扛/塞/捞/压/称/剪/推/拆/标记…）",
      "elements": ["元素1", "元素2", "元素3"],
      "labels": ["标注词1", "标注词2", "标注词3"],
      "styleHint": "可选风格补充，如 moody editorial / clean absurd sketch / 留白多手绘线条"
    }
  ]
}
\`\`\`

字段说明：
- theme: 2-8 字，本节拍核心概念的精炼概括
- structureType: 8 选 1 — Workflow / 系统局部 / 前后对比 / 角色状态 / 概念隐喻 / 方法分层 / 地图路线 / 小漫画分镜
- coreIdea: 用一句话说清这张图表达什么，含视觉隐喻，≤200 字。核心角色名字叫「${characterName}」，不要用其他名字
- xiaoheiAction: ${characterName}必须执行核心概念动作，不是站旁边装饰
- elements: 画面中出现的核心物件/符号（3-5 个）
- labels: 手写中文标注词（3-5 个短词）
- styleHint: 可选，补充氛围/密度/色调倾向

重要规则：
- 每个节拍独立发明原创隐喻，不套用旧图的构图
- 把抽象概念转成物理动作，系统结构转成低科技物件
- 先确定 structureType，再在该结构约束下设计画面
- theme 和 coreIdea 必须来自当前节拍的正文内容，不能凭空编造

**写完 illustrations.json 后，调用 ProjectSetStatus("illustrating")。**
⛔ 禁止调用 ProjectSetStatus("building")——本项目不需要代码构建。
` : "";

  const illustratingRules = isIllustrating ? `
## 插画生成阶段

系统正在自动生成插画和配音。这个阶段你不需要做任何操作。

等待系统通知"插画和配音已全部完成"，然后调用 ProjectSetStatus("done")。

⛔ 禁止调用 ProjectSetStatus("building")——本项目没有脚手架和代码构建。
` : "";

  const buildingRules = isBuilding ? `
## 构建阶段

系统已完成生图和配音。读取 illust-timeline.json + script.md，生成 manifest.json：

\`\`\`json
{
  "steps": [
    { "index": 0, "image": "/api/projects/.../illustrations/step-00.png",
      "audio": "/api/projects/.../audio/step-00.mp3",
      "text": "口播文本...", "durationSec": 8.0 }
  ]
}
\`\`\`

完成后 ProjectSetStatus("done")。

⛔ 本项目不需要代码。不要写 React 组件、不要写 Blueprint、不要调用 tsc。
   唯一产出：manifest.json。
` : "";

  const doneRules = isDone ? `## 完成\n项目已完成，只做轻量修改。` : "";

  const phaseIdentity = isBuilding ? "生成 manifest.json，完成后 ProjectSetStatus('done')。不要写代码。"
    : isIllustrating ? "插画生成中，等待系统通知后调 ProjectSetStatus('done')。不要做其他操作。"
    : isWriting ? "先完成 script.md（含进度提示），然后立即在同一个回复中完成 illustrations.json，最后 ProjectSetStatus('illustrating')。不要分两轮。"
    : "根据项目状态工作。";

  const prompt = [
    identityAndTools, enabledSection, stateSummary, assetsSection,
    phaseIdentity, illustRefs, writingRules, illustratingRules, buildingRules, doneRules,
  ].filter(Boolean).join("\n\n");

  return applySizeGuard([{ role: "system" as const, content: prompt }]);
}
