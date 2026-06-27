/**
 * System prompt for standard video projects.
 * Imports shared utilities from system-prompt.ts, adds video-specific rules.
 */
import type { Project } from "@/lib/db/schema";
import type { SystemModelMessage } from "ai";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { MAIN_SKILL_ID } from "@/lib/skills";
import { getMainSkillDir } from "@/lib/env";
import {
  resolveSkillPath, formatModelName, readRef,
  buildProjectStateSummary, buildWritingRefs, buildBuildingRefs,
  buildEnabledSkillsSection, buildAssetsManifest, applySizeGuard,
} from "./system-prompt";

const MAX_SYSTEM_CHARS = 50_000;

export async function buildVideoSystemPrompt(project: Project, enabledSkills: string[] = [MAIN_SKILL_ID]): Promise<SystemModelMessage[]> {
  const projDir = path.join(getMainSkillDir(), "..", "..", "projects", project.id);
  const presDir = path.join(projDir, "presentation");

  const enabledSection = buildEnabledSkillsSection(enabledSkills, MAIN_SKILL_ID);

  // ── User prefs ──────────────────────────────────────────────────────
  let illustrationsEnabled = true;
  try {
    const u = await db.select({ illustrationsEnabled: users.illustrationsEnabled })
      .from(users).where(eq(users.id, project.userId)).limit(1);
    if (u.length > 0) illustrationsEnabled = u[0].illustrationsEnabled !== "false";
  } catch {}

  // ── State ───────────────────────────────────────────────────────────
  const stateSummary = await buildProjectStateSummary(project);
  const assetsManifest = await buildAssetsManifest(project);

  const isWriting = project.status === "writing";
  const isBuilding = project.status === "building";
  const isDone = project.status === "done";

  // ── Skill refs (load only for current phase, not all at once) ───────
  const writingRefs = isWriting ? buildWritingRefs(MAIN_SKILL_ID) : "";
  const buildingRefs = isBuilding ? buildBuildingRefs(MAIN_SKILL_ID) : "";

  // ── Tools ───────────────────────────────────────────────────────────
  const identityAndTools = `## 你的身份

你是 Web Video Studio 的 AI 视频制作 Agent。你的任务是根据用户的文章，完成从写作到构建的全流程视频制作。

## 工具约束

使用 ProjectRead / ProjectWrite / ProjectList 读写项目文件，使用 Bash 执行 shell 命令。
使用 ProjectSetStatus 推进项目状态，使用 ProjectSetChapters 批量提交章节 Blueprint。
使用 ValidateBlueprint 校验 Blueprint JSON，使用 CompileChapter 编译单个章节。
使用 SkillReferenceRead 读取参考文档。`;

  // ── Writing rules ───────────────────────────────────────────────────
  const writingRules = isWriting ? `
## 口播稿规则
- B站风格，口语化，每句≤20字
- --- 分隔每个口播节拍
- 开头有钩子，无 AI 味

## Outline 规则 — 每章必须声明 primitives
- 按 script.md 的 --- 切节拍，每3~8步一章
- 每章首段列信息池（从 article 抽的数字/案例/引用）
- **每章标题后必须声明 4 行元数据：**
\`\`\`
chapter_type: <10种之一>
visual_strategy: <物理意象 + 动作描述>
primitives: [实际Primitive名1, 实际Primitive名2, ...]
decor: [装饰Primitive名]
\`\`\`
primitives 必须用 PRIMITIVES.md 的真实名称。场景→primitive 速查：
数据增长→BarRace/Counter，指数爆发→Volcano/RocketLaunch，进度→LiquidPour/Gauge，
冲突→Storm2Calm/DominoEffect，时间→Hourglass/CalendarFlip，筛选→FunnelFilter，
关系→Constellation/NetworkGraph，概念→HologramReveal/PaperPlane，人物→StickMan/CowCharacter/FaceMorph，
氛围→ParticleField/WaveForm，数字→BigNumber/Counter，金句→PullQuote

${writingRefs}

写完后调 ProjectSetStatus("building")。不要输出 plan_checkpoint、不要等确认。
` : "";

  // ── Building rules ──────────────────────────────────────────────────
  const buildingRules = isBuilding ? `
## 章节构建方案：Blueprint 积木系统（★ 不要手写代码！）

**优先使用 ProjectSetChapters 一次性批量提交所有章节的 Blueprint JSON 数组。**
系统自动完成：逐个验证 → 并行编译 TSX/CSS/narrations → 写文件 → tsc。

### composed 模式 — 5 种布局 × 42 种 primitive
详细选型参考 PRIMITIVES.md（完整 params）和 EXAMPLES/composed-blueprints/（示例）。
每个 step 必须 ≥ 3 distinct primitive（Reveal/Stagger 不计入），且同时含文字+非文字元素。

${buildingRefs}

绝不要手工写 presentation/src/chapters/ 下的文件！
` : "";

  // ── Done rules ──────────────────────────────────────────────────────
  const doneRules = isDone ? `
## 轻量修改模式
项目已完成构建。只做定向修改，不要重建已完成章节。
` : "";

  // ── Phase identity ──────────────────────────────────────────────────
  const phaseIdentity = isBuilding
    ? "你当前处于构建阶段。只构建 outline 中缺失的章节。"
    : isWriting
    ? "你当前处于写作阶段。产出 rhythm.md / script.md / outline.md。全部完成后调 ProjectSetStatus('building')，不要输出 plan_checkpoint、不要等确认。"
    : isDone
    ? "项目已完成。只做轻量修改。"
    : "根据项目状态工作。";

  // ── Assemble ────────────────────────────────────────────────────────
  const prompt = [
    identityAndTools,
    enabledSection,
    stateSummary,
    assetsManifest,
    phaseIdentity,
    writingRules,
    buildingRules,
    doneRules,
    RED_LINES,
    // writingRefs/buildingRefs already inside writingRules/buildingRules
  ].filter(Boolean).join("\n\n");

  return applySizeGuard([
    { role: "system" as const, content: prompt },
  ]);
}

const RED_LINES = `
## 绝对红线
- 不要反问用户、不要问用户任何问题。直接行动。
- 绝不要手工写 presentation/src/chapters/ 下的 TSX/CSS 文件
- 绝不要手工编辑 presentation/src/registry/chapters.ts
- 一句话带过即可，不要冗长解释。完成后直接输出 JSON 或调用工具。
`;
