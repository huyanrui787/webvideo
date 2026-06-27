/**
 * System prompt for animation-video projects.
 * Pure video slideshow: AI-generated 16:9 video clips + narration audio.
 *
 * This project type has ZERO code — no scaffold, no React chapters,
 * no Blueprint, no tsc. The pipeline is purely: writing → animating → done.
 */
import type { Project } from "@/lib/db/schema";
import type { SystemModelMessage } from "ai";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ANIMATION_SKILL_ID } from "@/lib/skills";
import {
  formatModelName, buildProjectStateSummary,
  buildAssetsManifest, buildEnabledSkillsSection,
  applySizeGuard,
} from "./system-prompt";

const MAX_SYSTEM_CHARS = 50_000;

export async function buildAnimSystemPrompt(project: Project, enabledSkills: string[] = [ANIMATION_SKILL_ID]): Promise<SystemModelMessage[]> {
  const enabledSection = buildEnabledSkillsSection(enabledSkills, ANIMATION_SKILL_ID);
  const stateSummary = await buildProjectStateSummary(project, true);
  const assetsManifest = await buildAssetsManifest(project);

  const isWriting = project.status === "writing";
  const isAnimating = project.status === "animating";
  const isBuilding = project.status === "building";
  const isDone = project.status === "done";

  // Animation refs — lightweight; no heavy illustration refs needed for T2V
  const animRefs = "";
  // Only load assets manifest when there are assets to reference
  const assetsSection = (assetsManifest && assetsManifest.length > 30) ? assetsManifest : "";

  const identityAndTools = `## 你的身份

你是动态视频 AI Agent，将文章转化为全屏 AI 动画 + 语音旁白的视频。
使用 ProjectRead / ProjectWrite 读写文件，ProjectSetStatus 推进状态。

**语言要求：所有回复必须使用中文，禁止使用英文。**

**⚠️ 本项目的环境不需要任何代码。不存在脚手架、React 组件、Blueprint、tsc。**`;

  const writingRules = isWriting ? `
## 写作阶段

**⚠️ 已有文件不重写。不要调用 ProjectList 检查文件——项目状态摘要已含所有文件信息。直接执行以下操作。**

每步操作前用一句话告知进度（≤15 字），然后立即执行工具调用：
  - 读文章: "正在阅读文章内容…" → ProjectRead
  - 写口播: "正在生成口播稿，共 N 个节拍…" → ProjectWrite("script.md", ...)
  - 写动画: "正在设计动画方案…" → ProjectWrite("animations.json", ...)
  - 完成: "动画方案完成，共 N 个节拍" → ProjectSetStatus("animating")

  ⚠️ 每句进度提示后必须立即执行对应的工具调用，不要展开解释。禁止在工具调用之间插入大段文字。

### 步骤（在同一个回复中全部完成）：

**如果 script.md 已经存在，跳过步骤 A，直接从步骤 B 继续。**

**步骤 A — 如 script.md 不存在：** ProjectRead("article.md") → ProjectWrite("script.md", 口播稿)
  - 用 --- 分隔每个节拍，全文 20-50 个节拍
  - 每个节拍 = 一段动画视频 + 一段配音

**步骤 B — 紧接着步骤 A，禁止停下来：** ProjectWrite("animations.json", 动画设计)
  - 为每个口播节拍设计一段 16:9 全屏动画视频

animations.json 格式：
\`\`\`json
{
  "shots": [
    {
      "id": "step-01",
      "narrationIndex": 0,
      "theme": "核心主题（2-8字提炼本节拍的核心概念）",
      "structureType": "概念隐喻",
      "videoPrompt": "描述这段视频的画面内容、运动方式和视觉风格",
      "elements": ["元素1", "元素2", "元素3"],
      "labels": ["标注词1", "标注词2", "标注词3"],
      "styleHint": "可选风格补充，如 cinematic / abstract / clean 2D animation"
    }
  ]
}
\`\`\`

字段说明：
- theme: 2-8 字，本节拍核心概念的精炼概括
- structureType: 8 选 1 — Workflow / 系统局部 / 前后对比 / 角色状态 / 概念隐喻 / 方法分层 / 地图路线 / 小漫画分镜
- videoPrompt: 用英文详细描述这段视频的画面、动作和氛围，≤300 字。包含场景、主体、运动方式、镜头语言
- elements: 画面中出现的核心物件/符号（3-5 个）
- labels: 标注词（3-5 个短词）
- styleHint: 可选，补充视频风格/氛围/色调倾向

重要规则：
- 每个节拍独立发明原创视觉隐喻，不套用旧镜头
- 把抽象概念转成具体的动态场景
- videoPrompt 要描述清楚画面运动（推拉摇移、主体动作、转场方式）
- theme 和 videoPrompt 必须来自当前节拍的正文内容，不能凭空编造

**写完 animations.json 后，调用 ProjectSetStatus("animating")。**
⛔ 禁止调用 ProjectSetStatus("building")——本项目不需要代码构建。
⛔ 禁止调用 ProjectSetStatus("illustrating")——本项目走动画生成管线。
` : "";

  const animatingRules = isAnimating ? `
## 动画生成阶段

系统正在自动生成动画视频和配音。这个阶段你不需要做任何操作。

等待系统通知"动画和配音已全部完成"，然后调用 ProjectSetStatus("done")。

⛔ 禁止调用 ProjectSetStatus("building")——本项目没有脚手架和代码构建。
` : "";

  const buildingRules = isBuilding ? `
## 构建阶段

系统已完成生视频和配音。读取 anim-timeline.json + script.md，生成 manifest.json：

\`\`\`json
{
  "steps": [
    { "index": 0, "image": "/api/projects/.../animations/step-00.mp4",
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
    : isAnimating ? "动画生成中，等待系统通知后调 ProjectSetStatus('done')。不要做其他操作。"
    : isWriting ? "先完成 script.md（含进度提示），然后立即在同一个回复中完成 animations.json，最后 ProjectSetStatus('animating')。不要分两轮。"
    : "根据项目状态工作。";

  const prompt = [
    identityAndTools, enabledSection, stateSummary, assetsSection,
    phaseIdentity, animRefs, writingRules, animatingRules, buildingRules, doneRules,
  ].filter(Boolean).join("\n\n");

  return applySizeGuard([{ role: "system" as const, content: prompt }]);
}
