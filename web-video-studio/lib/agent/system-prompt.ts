import type { Project } from "@/lib/db/schema";
import type { SystemModelMessage } from "ai";
import fs from "fs";
import path from "path";
import { projectDir, readAssetMeta } from "@/lib/projects";
import { db } from "@/lib/db";
import { projectAssetRefs, libraryAssets, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { listAllSkills, MAIN_SKILL_ID, getSkill, readSkillRef, type Skill } from "@/lib/skills";
import { getMainSkillDir } from "@/lib/env";

function resolveSkillPath(skillId: string): string {
  const s = getSkill(skillId);
  return s ? s.path : getMainSkillDir();
}

const MEDIA_EXTS = new Set(["jpg","jpeg","png","webp","svg","gif","mp4","webm","mov"]);

/** Shared model display name formatter — used by all prompt builders */
function formatModelName(model: string): string {
  if (model.startsWith("claude-"))
    return `Claude ${model.replace("claude-", "").replace(/-/g, " ")}`;
  if (model.startsWith("deepseek-"))
    return `DeepSeek ${model.replace("deepseek-", "").replace(/-/g, " ").replace("v4 pro", "V4 Pro").replace("v4 flash", "V4 Flash").replace("chat", "V3").replace("reasoner", "R1")}`;
  return model;
}

/** Repeated prohibitions shared across all phases */
const RED_LINES = {
  noAskUser: "不要反问用户、不要问用户任何问题。直接行动。",
  noChapterCode: "绝不要手工写 presentation/src/chapters/ 下的 TSX/CSS 文件！绝不要手工编辑 presentation/src/registry/chapters.ts！",
  noExtraTalk: "一句话带过即可，不要冗长解释。完成后直接输出 JSON 或调用工具。",
} as const;

function readRef(skillId: string, filename: string): string {
  return readSkillRef(skillId, filename);
}

/** 项目状态摘要 — 告诉 AI 已经完成了什么，还有什么待做 */
async function buildProjectStateSummary(project: Project): Promise<string> {
  const projDir = projectDir(project.id);
  const presDir = path.join(projDir, "presentation");
  const chaptersDir = path.join(presDir, "src", "chapters");

  const checks: string[] = [];

  // Writing phase
  const hasArticle = fs.existsSync(path.join(projDir, "article.md"));
  const hasScript = fs.existsSync(path.join(projDir, "script.md"));
  const hasOutline = fs.existsSync(path.join(projDir, "outline.md"));
  const writingDone = hasArticle && hasScript && hasOutline;
  checks.push(`写作阶段: ${writingDone ? "✅ 已完成" : "❌ 未完成"}`
    + (!writingDone ? ` [${!hasArticle ? "缺article " : ""}${!hasScript ? "缺script " : ""}${!hasOutline ? "缺outline" : ""}]` : ""));

  // Building phase
  let builtCount = 0;
  let outlineCount = 0;
  if (hasOutline) {
    try {
      const outline = fs.readFileSync(path.join(projDir, "outline.md"), "utf-8");
      outlineCount = (outline.match(/^## \d+\./gm) || []).length;
    } catch (err: any) { console.warn("[system-prompt] Failed to read outline:", err?.message ?? err); }
  }
  if (fs.existsSync(chaptersDir)) {
    try {
      const dirs = fs.readdirSync(chaptersDir).filter(d =>
        !d.startsWith(".") && !d.startsWith("__") && d !== "01-example"
      );
      builtCount = dirs.length;
    } catch (err: any) { console.warn("[system-prompt] Failed to read chapters dir:", err?.message ?? err); }
  }
  const buildingDone = outlineCount > 0 && builtCount >= outlineCount;
  checks.push(`构建阶段: ${buildingDone ? `✅ 已完成 (${builtCount}/${outlineCount}章)` : builtCount > 0 ? `🔄 进行中 (${builtCount}/${outlineCount}章)` : "⬜ 未开始"}`);

  // Audio phase
  const hasAudio = fs.existsSync(path.join(presDir, "public", "audio"));
  const hasAudioSegments = fs.existsSync(path.join(presDir, "audio-segments.json"));
  const audioDone = hasAudio || hasAudioSegments;
  checks.push(`音频合成: ${audioDone ? "✅ 已完成" : "⬜ 未开始"}`);

  // Render phase
  const hasRender = fs.existsSync(path.join(projDir, "render.mp4"));
  checks.push(`渲染: ${hasRender ? "✅ 已完成" : "⬜ 未开始"}`);

  const summary = `## 📊 项目进度

${checks.join("\n")}

**当前阶段**: ${project.status === "done" ? "已完成 — 系统已自动标记完成。你可以修改内容、回答提问、建议录制视频，但不要重建已有章节。" : project.status === "building" ? "构建中 — " + (buildingDone ? "所有章节已构建，系统将自动标记为 done。" : `继续为 outline 中的剩余章节生成 Blueprint（${builtCount}/${outlineCount} 已完成）。`) : project.status === "plan_checkpoint" ? "等待用户确认 — 用户在审阅章节计划，确认后系统会自动进入构建阶段。" : project.status === "writing" ? "写作中 — 产出 rhythm.md / script.md / outline.md。完成后输出 plan_checkpoint JSON 等待用户确认。" : project.status}

**自动流程**:
- 写作完成后 → 调用 ProjectSetStatus("building") → ⚡系统自动触发脚手架 → 进入构建阶段
- 所有章节构建完毕 → ⚡系统自动标记 done（不需要你手动调）
- 你的职责：写作完成后调 ProjectSetStatus("building")；构建时提交 Blueprint；构建完成后的 done 由系统自动设置

**重要原则**: 对比「项目进度」与对话历史——如果进度显示已完成但对话显示刚做完，说明这之前的工作已经完成，不要重复执行。直接告知用户当前状态并等待指令。`;

  return summary;
}

/** 写作阶段参考文件 — RHYTHM-DESIGN 内联（格式核心），其余路径引用 */
function buildWritingRefs(skillId: string): string {
  const skillPath = resolveSkillPath(skillId);
  const rhythm = readRef(skillId, "RHYTHM-DESIGN.md");
  const hasScript = readRef(skillId, "SCRIPT-STYLE.md");
  const hasOutline = readRef(skillId, "OUTLINE-FORMAT.md");
  if (!rhythm && !hasScript && !hasOutline) return "";
  const parts: string[] = [];
  if (rhythm) {
    parts.push(`## 参考文档（内联）：RHYTHM-DESIGN.md\n\n${rhythm}`);
  }
  const lazyFiles = [];
  if (hasScript) lazyFiles.push(`- \`${skillPath}/references/SCRIPT-STYLE.md\` — 脚本写作风格指南`);
  if (hasOutline) lazyFiles.push(`- \`${skillPath}/references/OUTLINE-FORMAT.md\` — 大纲格式规范`);
  if (lazyFiles.length > 0) {
    parts.push(`## 参考文档（按需加载）\n\n写作前用 ProjectRead 加载：\n${lazyFiles.join("\n")}`);
  }
  return "\n" + parts.join("\n\n") + "\n";
}

/** 构建阶段参考文件 — 改为路径引用，AI 用 ProjectRead 按需加载 */
function buildBuildingRefs(skillId: string): string {
  const skillPath = resolveSkillPath(skillId);
  const files = [
    { name: "CHAPTER-CRAFT.md", desc: "章节制作规则（十条原则、决策树、反AI味）" },
    { name: "PRIMITIVES.md", desc: "Primitive 选型表（Counter/Reveal/NetworkGraph 等完整 params）" },
  ].filter((f) => readRef(skillId, f.name));
  if (files.length === 0) return "";
  const lines = files.map((f) => `- \`${skillPath}/references/${f.name}\` — ${f.desc}`);
  return `
## 参考文档（按需加载）

构建章节前，用 ProjectRead 加载以下文件获取完整规则：
${lines.join("\n")}

不要一次性全读——只在需要时才 ProjectRead 对应文件。
`;
}

const XIAOHEI_SKILL_ID = "ian-xiaohei-illustrations";

/** 插图阶段参考文件 — 小黑 IP、构图方法论、QA 检查清单 */
function buildIllustrationRefs(): string {
  const ip = readSkillRef(XIAOHEI_SKILL_ID, "xiaohei-ip.md");
  const comp = readSkillRef(XIAOHEI_SKILL_ID, "composition-patterns.md");
  const qa = readSkillRef(XIAOHEI_SKILL_ID, "qa-checklist.md");
  if (!ip && !comp && !qa) return "";
  return `
---
## 参考文档：小黑 IP 形象与动作库（xiaohei-ip.md）

${ip}

---
## 参考文档：构图方法论与原创隐喻生成（composition-patterns.md）

${comp}

---
## 参考文档：插图质量检查清单（qa-checklist.md）

${qa}
`;
}

function buildEnabledSkillsSection(enabledIds: string[], mainSkillId: string): string {
  const all = listAllSkills();
  const byId = new Map(all.map((s) => [s.id, s]));
  const enabled = enabledIds
    .map((id) => byId.get(id))
    .filter((s): s is Skill => !!s);

  if (enabled.length === 0) return "";

  const lines = enabled.map((s) => {
    const tag = s.id === mainSkillId ? " [主 skill · 不可关]" : "";
    const ver = s.version ? ` (v${s.version})` : "";
    const cat = s.category ? ` · ${s.category}` : "";

    // List available reference files for auxiliary skills so AI can discover them
    let refsHint = "";
    if (s.id !== mainSkillId && s.refsDir) {
      try {
        const files = fs.readdirSync(s.refsDir).filter((f) => f.endsWith(".md"));
        if (files.length > 0) {
          refsHint = `\n  可用参考文件: ${files.map((f) => `\`${f}\``).join(", ")}`;
        }
      } catch { /* ignore */ }
    }

    return `- **${s.name}**${ver}${cat}${tag}\n  ${s.description}\n  路径: \`${s.path}\`${refsHint}`;
  });

  return `
## 用户启用的 Skills（${enabled.length} 个）

用户已在设置中启用以下 skill。当用户的问题匹配某个 skill 的能力时，主动用 ProjectRead 读取其 SKILL.md（绝对路径），用 skill 的工作流和方法回答。
辅助 skill 的参考文件（references/*.md）已列在下方，可以直接用 ProjectRead 读取绝对路径。

${lines.join("\n\n")}
`;
}

async function buildAssetsManifest(project: Project): Promise<string> {
  const rows: Array<{ file: string; type: string; caption: string; source: string; duration: string }> = [];

  // Local project assets
  const assetsPath = path.join(projectDir(project.id), "assets");
  if (fs.existsSync(assetsPath)) {
    const meta = readAssetMeta(project.id);
    for (const name of fs.readdirSync(assetsPath)) {
      if (name === "meta.json") continue;
      const ext = name.split(".").pop()?.toLowerCase() ?? "";
      if (!MEDIA_EXTS.has(ext)) continue;
      const isImage = ["jpg","jpeg","png","webp","svg","gif"].includes(ext);
      const m = meta[name];
      rows.push({
        file: `/api/projects/${project.id}/assets/${encodeURIComponent(name)}`,
        type: isImage ? "图片" : "视频",
        caption: m?.caption?.trim() || "（分析中）",
        source: "本项目",
        duration: (!isImage && m?.durationSec) ? `${m.durationSec}s` : "",
      });
    }
  }

  // Library refs
  const refs = await db
    .select({
      assetId: libraryAssets.id,
      originalName: libraryAssets.originalName,
      type: libraryAssets.type,
      caption: libraryAssets.caption,
      durationSec: libraryAssets.durationSec,
    })
    .from(projectAssetRefs)
    .innerJoin(libraryAssets, eq(projectAssetRefs.assetId, libraryAssets.id))
    .where(eq(projectAssetRefs.projectId, project.id));

  for (const r of refs) {
    rows.push({
      file: `/api/library/assets/${r.assetId}/file`,
      type: r.type === "image" ? "图片" : "视频",
      caption: r.caption?.trim() || "（分析中）",
      source: "素材库",
      duration: (r.type === "video" && r.durationSec) ? `${r.durationSec}s` : "",
    });
  }

  if (rows.length === 0) return "";

  const lines = rows.map(
    (r) => `| ${r.file} | ${r.type} | ${r.source} | ${r.caption}${r.duration ? ` (${r.duration})` : ""} |`
  );
  return `
## 可用素材（${rows.length} 个）

在生成 script/outline 或章节代码时，优先引用描述与当前章节内容相关的素材。
章节代码中直接使用文件 URL（如 \`<img src="URL" />\` 或 CSS \`background-image: url("URL")\`）。
视频素材可作为独立 step 播放（见章节代码规则中的"视频 step 写法"）。
标注"（分析中）"的素材稍后自动填写描述，暂可跳过。

| 文件 URL | 类型 | 来源 | 描述 |
|----------|------|------|------|
${lines.join("\n")}
`;
}

const MAX_SYSTEM_CHARS = 180_000; // ~45K tokens — safety margin below most provider limits

/** Guard against system prompts exceeding provider context windows */
function applySizeGuard(messages: SystemModelMessage[]): SystemModelMessage[] {
  let totalChars = 0;
  for (const m of messages) {
    totalChars += typeof m.content === "string" ? m.content.length : 0;
  }
  if (totalChars > MAX_SYSTEM_CHARS) {
    const excess = totalChars - MAX_SYSTEM_CHARS + 500;
    // Truncate the last (largest, usually reference files) message
    const last = messages[messages.length - 1];
    if (typeof last.content === "string" && last.content.length > excess) {
      console.warn(
        `system-prompt: ${totalChars} chars exceeds ${MAX_SYSTEM_CHARS}, truncating ${excess} chars`
      );
      last.content = last.content.slice(0, -excess)
        + `\n\n[系统提示词过长，已截断 ${excess} 字符]`;
    }
  }
  return messages;
}

export async function buildSystemPrompt(project: Project, enabledSkills: string[] = [MAIN_SKILL_ID]): Promise<SystemModelMessage[]> {
  // Graphic projects use a completely different prompt
  if (project.projectFormat === "graphic") {
    return buildGraphicSystemPrompt(project, enabledSkills);
  }

  // Manim projects use a math-oriented Python code generation prompt
  if (project.projectFormat === "manim") {
    return buildManimSystemPrompt(project, enabledSkills);
  }

  // Draw projects use a diagram generation prompt
  if (project.projectFormat === "draw") {
    return buildDrawSystemPrompt(project, enabledSkills);
  }

  const mainSkillId = project.mainSkillId ?? MAIN_SKILL_ID;
  const mainSkillPath = resolveSkillPath(mainSkillId);

  const assetsSection = await buildAssetsManifest(project);
  const isBuilding = project.status === "building";
  const isDone = project.status === "done";
  const isWriting = project.status === "writing" || project.status === "plan_checkpoint" || project.status === "illustration_planning";
  const isIllustrating = project.status === "illustrating";
  const isTypesetting = project.status === "typesetting";
  const isIllustMode = project.projectType === "illustration-video" || project.projectType === "illustrated-article";

  // Check if user has illustrations enabled
  let illustrationsEnabled = true;
  if (project.userId) {
    try {
      const u = await db
        .select({ illustrationsEnabled: users.illustrationsEnabled })
        .from(users)
        .where(eq(users.id, project.userId))
        .limit(1)
        .then((rows) => rows[0] ?? null);
      if (u) illustrationsEnabled = u.illustrationsEnabled !== "false";
    } catch { /* keep default */ }
  }

  // ── Project state summary: tell AI what's done vs pending ──────────
  const stateSummary = await buildProjectStateSummary(project);

  const writingRules = isWriting ? `
## 口播稿规则
- B站风格，口语化，每句≤20字
- --- 分隔每个口播节拍
- 开头有钩子，无 AI 味（不用"说白了/本质上/底层逻辑/恰恰/反而"等）
- 信息保留度≥60%

## Outline 规则
- 按 script.md 的 --- 切节拍，每3~8步一章
- 每章首段列信息池（从 article 抽的数字/案例/引用）
- step N (~Ts) — 屏幕内容描述（不写动画，只写屏幕内容）

## Outline 章节类型规则（必须执行）
每章标题后、信息池前，必须声明 3 行元数据（见 CHAPTER-TYPES.md 路由表）：
\`\`\`
chapter_type: <10种类型之一>
visual_strategy: <物理意象 + SVG动作描述，不是方案名称>
primitives: [Primitive1, Primitive2, ...]
\`\`\`
data-proof 章节额外必填：data_shape: {items:[{label,value}], unit:"单位"}

**visual_strategy 写法要求（必须包含意象+动作）：**
× 不合格：visual_strategy: bar-chart-growth（只有名称，没有意象）
× 不合格：visual_strategy: three-node-flywheel（没有具体动作）
✓ 合格：visual_strategy: 增长用竹节SVG从底部逐节生长，每节对应一年数据，口播"五倍"时Counter滚动到最终数字
✓ 合格：visual_strategy: 信息筛选用漏斗SVG，大量粒子落入，底部仅漏出3颗高亮粒子代表高质量内容
✓ 合格：visual_strategy: 天平两端砝码对比，左边逐一加砝码代表SEO指标，口播"重心转移"时天平向右倾斜
写 visual_strategy 时先问：这个概念在现实世界里长什么样？把那个东西画出来、让它动起来。
参考 CHAPTER-CRAFT.md 的「概念→物理场景→SVG动画意象映射表」速查。

章节类型速查（按内容选）：
- 开篇问题/钩子 → hero-hook
- 数字/图表/增长 → data-proof
- 系统/机制/原理 → concept-model
- 步骤/操作/流程 → process-flow
- 清单/要点/特性 → list-reveal
- 故事/人物/案例 → narrative-case
- 对比/横评/before-after → comparison
- 代码/命令行/CLI → technical-demo
- 地图/地区/分布 → geo-spatial
- 结论/总结/收尾 → close-cta
` : "";

  const buildingRules = isBuilding ? `
## 章节构建方案：Blueprint 模板系统（★ 不要手写代码！）

**优先使用 ProjectSetChapters 一次性批量提交所有章节的 Blueprint JSON 数组。**
系统自动完成：逐个验证 → 并行编译 TSX/CSS/narrations → 写文件 → 一次性重建注册表 → 跑一次 tsc。
失败章节用 ProjectSetChapter 单独修正。
校验失败时根据返回的错误信息修改 JSON 重新提交即可。

## 首选：组合模式（mode: "composed"）—— 默认使用

大多数章节应使用组合模式。5 种布局 × 11 种 primitive，任意编排。

**5 种布局**: center（居中）、split（分屏）、stack（堆叠）、grid（CSS Grid）、absolute（绝对定位）
**11 种 Primitive**: Counter（数字滚动）、Reveal（入场）、Stagger（逐个）、NetworkGraph（节点图）、WaveForm（波形）、TypeWriter（打字机）、ParticleField（粒子）、DrawPath（路径）、MediaFrame（媒体）、CodeBlock（代码）、DataChart（图表）

Composed Blueprint 结构：
\`\`\`json
{
  "layout": {
    "mode": "composed",
    "layout": "grid",
    "gridTemplate": "2fr 1fr",
    "regions": {
      "big-number": {
        "content": [{ "primitive": "Counter", "params": { "to": 99.5, "unit": "%" } }],
        "gridArea": "1/1"
      },
      "context": {
        "content": [{ "primitive": "Reveal", "params": { "from": "right" } }],
        "gridArea": "1/2"
      }
    },
    "animations": [{ "target": "big-number", "effect": "scaleIn", "delay": 0.2, "duration": 0.8 }]
  }
}
\`\`\`
参考：PRIMITIVES.md（完整选型表+params）和 EXAMPLES/composed-blueprints/（完整示例）。

---

## 备选：模板模式（mode: "template"）—— 快捷方式，仅结构匹配时用

## 8 个可用模板及槽位

| 模板 | 适用场景 | 必填槽位 | 变体 |
|------|---------|---------|------|
| hero-title | 章节开场、核心观点 | title | centered, left, split |
| step-reveal | 逐条论证、知识拆解 | steps[{heading}] | numbered, icon, timeline |
| data-spotlight | 数据冲击、指标展示 | primaryValue, primaryLabel | single-stat, comparison |
| side-by-side | 前后对比、方案对比 | left{heading}, right{heading} | vs, arrow |
| flow-diagram | 流程、架构、管道 | nodes[{id,label}] | horizontal, vertical |
| code-showcase | 代码讲解 | code | single-file |
| quote-card | 引用、名言 | quote | centered, side, overlay |
| grid-gallery | 多图展示 | items[{media}] | cols-2, cols-3, cols-4 |

详细槽位结构：\`title\`, \`subtitle?\`, \`kicker?\`, \`background?\`, \`steps[].heading\`, \`steps[].body?\`, \`steps[].media?\`, \`primaryValue\`, \`primaryLabel\`, \`context?\`, \`left.heading\`, \`right.heading\`, \`nodes[].id\`, \`nodes[].label\`, \`code\`, \`language?\`, \`quote\`, \`attribution?\`, \`items[].media\`, \`columns\`

## Blueprint JSON 示例

\`\`\`json
{
  "chapterId": "why-matter",
  "title": "为什么需要记忆机制",
  "steps": [
    {
      "narration": "首先我们来看大模型面临的挑战。",
      "layout": {
        "mode": "template", "template": "hero-title", "variant": "centered",
        "slots": { "kicker": "认知瓶颈", "title": "GPT-4 一次只能记住 128k 个 token" },
        "overrides": { "backgroundStyle": "gradient-subtle" }
      }
    },
    {
      "narration": "解决思路是引入外部记忆库。",
      "layout": {
        "mode": "template", "template": "step-reveal", "variant": "numbered",
        "slots": { "steps": [{ "heading": "注意力机制的平方复杂度", "body": "O(n²) 增长" }] }
      }
    }
  ]
}
\`\`\`

**组合模式**（模板不够用）：mode: "composed" + layout + regions，可用 primitives: Reveal, Counter, NetworkGraph, CodeBlock
**自定义模式**（自由度）：mode: "custom" + jsx + css

绝不要手工写 presentation/src/chapters/ 下的 TSX/CSS 文件！
绝不要手工编辑 presentation/src/registry/chapters.ts！
` : "";

  const doneRules = isDone ? `
## 轻量修改模式 — 项目已完成

你现在是修改顾问，不是构建模型。项目文件都在磁盘上，直接读、改、验证即可。

### 常见场景速查

| 用户意图 | 做法 | 需要参考文档？ |
|----------|------|:--:|
| 改数据/文案/样式 | ProjectRead 目标文件 → ProjectWrite 修改 → ProjectShell tsc 验证 | 不需要 |
| 换主题 | ProjectWrite 修改 presentation/src/styles/tokens.css | 不需要 |
| 调整插图顺序/描述 | ProjectRead/Write illust-timeline.json | 不需要 |
| 新增一章 | **需要先加载参考文档**（见下方），然后 ProjectSetChapter 提交 blueprint | 需要 |
| 重建某章 | **需要先加载参考文档**，然后 ProjectSetChapter 提交新 blueprint | 需要 |
| 询问项目内容 | ProjectRead article.md 或 script.md，简短回复 | 不需要 |

### 按需加载参考文档

当用户要求**新增或重建章节**时，先用 ProjectRead 加载以下文件（绝对路径）：
- \`${mainSkillPath}/references/CHAPTER-CRAFT.md\`     — 章节制作规则（十条原则、决策树、反AI味）
- \`${mainSkillPath}/references/PRIMITIVES.md\`        — Primitive 选型表（Counter/Reveal/NetworkGraph 等）
- \`${mainSkillPath}/references/CHAPTER-TYPES.md\`     — 章节类型路由表（10种类型速查）

然后参考已有章节的代码风格（ProjectRead 现有章节文件），用 ProjectSetChapter 提交 blueprint。
不要手写 TSX/CSS — 始终通过 Blueprint 编译器生成代码。

### 现有项目结构

已构建的章节在 presentation/src/chapters/ 目录下，注册表在 presentation/src/registry/chapters.ts。
用 ProjectList("presentation/src/chapters") 查看已有章节列表。
用 ProjectRead 读取具体文件查看内容。

### 行为准则
- ✅ 直接执行修改，不要反问用户「要不要调整」「有没有意见」
- ✅ 修改后跑 tsc 验证，只报告错误
- ✅ 用户闲聊或询问时简短回复，不要扫描项目文件
- ❌ 不要主动建议重建章节
- ❌ 不要输出 JSON 信号
- ❌ 不要调用 ProjectSetStatus
- ❌ 不要调用 ProjectShell 执行 tsc/npm 之外的命令
` : "";

  const illustratingRules = isIllustrating ? `

每张插画规格：
- 16:9 横版（1280×720），纯白背景，黑色手绘线稿
- 小黑是动作主体（不是角落装饰），表情认真、荒诞
- 8 种结构类型选一：Workflow / 系统局部 / 前后对比 / 角色状态 / 概念隐喻 / 方法分层 / 地图路线 / 小漫画分镜
- 红/橙/蓝中文手写标注，≤8 处，每处 2-8 字
- 主体占 40-60%，≥35% 留白
- 每张只表达一个核心认知动作

章节级一致性：
- 同一章内的插画，小黑形象保持一致
- 同一章使用统一的物件隐喻体系
- 相邻 step 的构图类型要有变化（避免重复疲劳）

插图选点原则：
- 每个 step 对应 1 张插画（1:1 对齐）${project.projectType === "illustrated-article" ? '\n- 图文排版模式：全文选 4-8 个认知锚点，不需要每个 step 一张' : ''}
- 优先选 cognitive anchor moment（认知转折、抽象概念具象化）
- 为当前文章发明新隐喻，不复用旧案例

代码约束：
- **${
  project.projectType === "illustrated-article"
    ? "不需要写任何代码，不需要 presentation/src/。产出是图片文件 + article_layouts 排版结构"
    : "不需要写 React 代码，不需要 presentation/src/。产出是图片文件 + illust-timeline.json"
}**
- 图片保存到 assets/illustrations/

生成流程：
1. 先输出 shot plan 让用户确认
2. 确认后输出 illustration_generate JSON 信号（Studio 会调用生成 API）
3. 生成完后${project.projectType === "illustrated-article" ? ' ProjectSetStatus("typesetting")' : ' ProjectWrite("illust-timeline.json", timeline) → ProjectSetStatus("done")'}
4. durationSec 默认填 5.0（实际时长在 TTS 合成后由音频文件决定）
5. kenBurns 默认填 { "scale": 1.03, "panX": 0, "panY": 0 }
` : "";

  const typesettingRules = isTypesetting ? `
## 图文排版阶段

用户的文章和插画已就绪。你的任务是将插画嵌入原文合适位置，生成排版结构。

步骤：
1. ProjectRead("article.md") 读取原文
2. 分析文章结构，为每张插画找到最佳插入位置：
   - 根据 shot.coreIdea 与各段落内容的语义匹配度评分
   - 优先插入到"观点刚提出来，还没深入解释"的位置
   - 避免插入到列表中间
   - 两张图之间至少隔 2 个自然段落
3. 生成 LayoutBlock[] 排版结构，输出到 article_layouts 表
4. 用户确认后 ProjectSetStatus("done")

排版原则：
- 首图放在文章开头（全文核心概念图）
- 每张图配一句简短说明（≤20 字）
- 两张图之间至少隔 2 个自然段
- 数据/流程/对比类内容优先配图
- 列表和引用块内不插图
- 图宽默认"全宽"（微信风格）

## 结构化信号
排版完成后输出：
\`\`\`json
{"type":"typesetting_complete","data":{"blockCount":42,"illustrationCount":6}}
\`\`\`
` : "";

  const signals = isWriting && illustrationsEnabled && !isIllustMode ? `
## 结构化信号格式（JSON 代码块，嵌入消息末尾）

生成完 script+outline 后，在同一轮消息末尾输出：
\`\`\`json
{"type":"illustration_checkpoint","data":{"shotList":[{"id":"why-matter-01","chapterId":"why-matter","stepHint":"step 2 后","theme":"信息过载痛点","structure":"角色状态","coreIdea":"从混乱到清晰的状态转换","xiaoheiAction":"小黑被纸张压垮后用漏斗过滤","elements":["纸张堆","漏斗","干净输出"],"labels":["过载","过滤","清晰"]}]}}
\`\`\`
shotList 为空的简写：\`{"type":"illustration_checkpoint","data":{"shotList":[]}}\`
` : "";

  const mainModel = project.model ?? "deepseek-v4-pro";
  const modelDisplayName = formatModelName(mainModel);

  // ── Stable part (cached): tool rules + phase rules + signals ─────────────
  // This block rarely changes within a session — cache it to save ~90% of its token cost.
  // Block A: Identity + tools + file structure — NEVER changes across phases.
  // Heavily cached. Separated from phase rules so cache survives all status transitions.
  const identityAndTools = `你是 Web Video Studio 的 AI 制作助手，帮用户把内容制作成视频感网页演示。你的底层模型是 ${modelDisplayName}。如果用户问你是什么模型，回答「${modelDisplayName}」。

**语言规则：所有对话消息必须用中文回复，保持简洁。不要用 emoji 列表或 ✅ 逐条汇报已有进度——前文已展示的信息不重述。代码注释和文件内容保持原格式不变。**

## ⚠️ 角色边界（严格遵守 — 违反会产生错误结果）
你的职责随项目阶段不同而变化：

**写作阶段 (writing)**：你是内容规划模型
- 分析文章 → 写 rhythm.md / script.md / outline.md${illustrationsEnabled && !isIllustMode ? ' → 规划插图 shot list' : ''}
- **不要写任何章节代码（presentation/src/chapters/ 下的文件）**

**绘图阶段 (illustrating)**：你是插画规划模型
- 读取 outline.md → 为每个认知锚点设计小黑风格插画 shot plan
- **不要写任何代码**——产出是 shot plan + 图片文件
- 图片由 Studio 调用 API 自动生成，你负责规划和确认

**排版阶段 (typesetting)**：你是排版模型
- 读取 article.md + illustration_shots → 找到最佳插画插入位置 → 生成 LayoutBlock 排版结构
- 产出是 article_layouts 表中的排版数据

**构建阶段 (building)**：你是蓝图生成模型
- 读取 outline.md → 为每章生成 ChapterBlueprint JSON → 通过 ProjectSetChapter 工具提交
- 编译器会自动从 Blueprint 生成 TSX/CSS/narrations 文件
- **不要手工写 TSX/CSS — 用 ProjectSetChapter 提交 Blueprint JSON 即可**

**绝对禁止（所有阶段）**：
- ❌ 不要手工写 presentation/src/chapters/ 下的 .tsx/.css 文件 — 编译器负责生成代码
- ❌ 不要手工编辑 presentation/src/registry/chapters.ts`

  // ── Phase-aware role description ──────────────────────────────────────
  const phaseIdentity = isIllustrating
    ? `**你当前处于绘图阶段。专注为每个 step 规划小黑手绘插画。${project.projectType === "illustrated-article" ? "这是图文排版模式，全文选 4-8 张认知锚点图。" : "每个 step 对应 1 张 16:9 插画。"}**`
    : isTypesetting
      ? "**你当前处于排版阶段。将插画嵌入原文最佳位置，生成公众号可发布的排版长文。**"
      : isBuilding
        ? `**你当前处于构建阶段。你的任务是将 outline.md 中的每章转换为 ChapterBlueprint JSON，通过 ProjectSetChapter 逐章提交。不要等待"编码模型"——你就是蓝图生成模型。**`
        : isDone
          ? "**项目已完成。你是轻量修改顾问，直接读文件、改文件、验证即可。需要新增/重建章节时才加载参考文档。不要主动建议重建。**"
          : isWriting
            ? `**你当前处于写作阶段。专注产出 rhythm.md / script.md / outline.md${isIllustMode ? "。不要写代码——后续进入绘图阶段" : "。不要写任何代码"}。**`
            : `**项目当前处于 ${project.status} 阶段。按下方阶段指南执行。**`;

  const identityAndToolsFinal = identityAndTools + "\n\n" + stateSummary + "\n\n" + phaseIdentity;

  // Rest of Block A (file naming conventions, etc.) — this was part of the
  // original identityAndTools template literal and follows the tools section.
  const blockASuffix = `
**⚠️ 禁止用 ProjectList 探索 Skill 目录（references/、chapter-templates/ 等）**
所有写作规范（RHYTHM-DESIGN、SCRIPT-STYLE、OUTLINE-FORMAT）和构建规范（CHAPTER-CRAFT、PRIMITIVES、CHAPTER-TYPES）已内联在本 system prompt 中。
chapter-templates/ 中的可用模板列表已在「构建阶段」指南里列出。
如需读取具体模板文件，直接用 ProjectRead(\`${mainSkillPath}/chapter-templates/<filename>.tsx\`)。

## 文件命名
与用户对话中使用中文名称，工具调用中使用实际文件名：
| 中文名 | 文件名 | 说明 |
|--------|--------|------|
| 原文 | article.md | 原始内容（只读参考）。文中 \`![描述](URL)\` 表示该位置有图片。 |
| 节奏设计 | rhythm.md | 情绪弧线设计 |
| 口播稿 | script.md | 口播文案，用 --- 分隔节拍 |
| 开发计划 | outline.md | 章节 + 步骤 + 信息池 |
| 插图清单 | illustrations.json | AI 生成的插图规划 |
| 素材 | assets/ | 图片/视频，通过 /api/projects/{id}/assets/<文件名> 引用 |
| 演示项目 | presentation/ | Vite+React+TS（脚手架自动创建）`;

  // Block B: Phase-specific rules + signals — changes per status, cached per phase variant.
  const phaseRules = `${writingRules}${buildingRules}${doneRules}${illustratingRules}${typesettingRules}${signals}`;

  // Block C: Reference files — writing refs or building refs, large but stable per phase.
  // Phase-specific reference docs: only load what's needed for the current phase.
  // Illustration refs (~300 lines of IP content) are only loaded for illustration projects
  // or when actually in the illustration planning/illustrating phase.
  const needIllustrationRefs = isIllustMode || isIllustrating ||
    (isWriting && project.status === "illustration_planning");
  const refsPart = isWriting
    ? buildWritingRefs(mainSkillId) + (needIllustrationRefs ? buildIllustrationRefs() : "")
    : isBuilding ? buildBuildingRefs(mainSkillId)
    : needIllustrationRefs ? buildIllustrationRefs()
    : "";

  // Block D: Dynamic part (NOT cached) — project info + assets + status guidance.
  // Changes per project / per status change.
  const dynamicPart = `## 会话恢复指引

如果对话历史已有操作记录，说明这是恢复的会话。**不要重复执行已完成的操作**，从下一个未完成的步骤继续。**不要用 ProjectList 扫目录再逐条汇报已有文件**——前文已经展示过的信息不需要重复。只需判断当前阶段，继续推进。

## 当前项目
- ID: ${project.id}
- 标题: ${project.title}
- 状态: ${project.status}
- 项目类型: ${project.projectType ?? "article"}
- 主题: ${project.theme ?? "未选择"}
- 开发模式: ${project.devMode ?? "未选择"}
- 画面方向: ${project.orientation ?? "landscape"}
- assets/: 素材目录（图片/视频，用 ProjectList("assets") 查看；章节代码中通过 /api/projects/${project.id}/assets/<文件名> 引用）
${assetsSection}
${buildEnabledSkillsSection(enabledSkills, mainSkillId)}
## 当前阶段
${getStatusGuidance(project.status, project.theme, project.devMode, project.projectType, project.projectFormat ?? "video", illustrationsEnabled)}`;

  // Ordered for optimal Anthropic cache hit rate:
  // Block A (tools+identity) — same for ALL phases, always cached
  // Block B (phase rules) — changes per status, cached per variant
  // Block C (reference files) — writing or building refs, cached per variant
  // Block D (dynamic) — never cached, includes project-specific data
  const blockA = identityAndToolsFinal + blockASuffix;

  const messages: SystemModelMessage[] = [
    {
      role: "system",
      content: blockA,
      providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
    },
    {
      role: "system",
      content: phaseRules,
      providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
    },
  ];

  if (refsPart) {
    messages.push({
      role: "system",
      content: refsPart,
      providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
    });
  }

  messages.push({
    role: "system",
    content: dynamicPart,
  });

  return applySizeGuard(messages);
}

function getStatusGuidance(
  status: string,
  theme: string | null,
  devMode: string | null,
  projectType: string | null,
  projectFormat: string = "video",
  illustrationsEnabled: boolean = true
): string {
  // ── Illustration-video / illustrated-article mode dispatch ──────────
  if (projectType === "illustration-video" || projectType === "illustrated-article") {
    return getIllustStatusGuidance(status, projectType);
  }

  switch (status) {
    case "writing": {
      const isVideo = projectFormat !== "graphic";
      const isProductDemo = projectType === "product-demo";

      if (isProductDemo) {
        return `**已有文件不重写。产品探索已由系统自动完成。直接推进下一步。不要反问用户。**

步骤：
1. ProjectRead("product-exploration.json") 读取探索结果，了解产品功能模块、页面结构、截图素材
2. 根据产品功能模块规划章节结构，ProjectWrite("outline.md", content)
3. 生成产品讲解口播稿（确保与 outline.md 中每章的 narration_text 一致），ProjectWrite("script.md", content)
4. 生成情绪节奏文件，ProjectWrite("rhythm.md", content)
5. **⚠️ 完成以上后，必须调用 ProjectSetStatus("building")，不要只描述。** 调用工具后即可停止，不要再写任何文字。

## ⛔ 红线
- ❌ 不要写任何 presentation/src/chapters/ 下的代码
- ❌ 不要调用 ProjectShell
- ❌ 不要反问用户、不要列出 review 清单、不要停下来等确认
- ❌ 完成步骤5后，不要再说"构建将开始"之类的描述——工具调用本身就是信号
- 你的唯一输出：outline.md → script.md → rhythm.md → ProjectSetStatus("building")
- 每章对应一个产品功能模块，引用 product-exploration.json 中的截图路径`;
      }

      if (isVideo && illustrationsEnabled) {
        return `**已有文件不重写。不需要逐条列出已有文件——直接判断当前阶段，推进下一步。不要反问用户「要不要调整」「有没有意见」——直接执行。**

步骤（仅当文件尚未生成时执行）：
1. ProjectRead("article.md") 读取内容
2. 根据文章类型选情绪弧模板（上方「RHYTHM-DESIGN.md」），ProjectWrite("rhythm.md", content)
3. 生成口播稿，ProjectWrite("script.md", content)
4. 生成 outline，ProjectWrite("outline.md", content)
5. ⚠️ **到此为止，不要继续**。不要规划插图、不要输出 illustration_checkpoint JSON。
   系统检测到 script+outline 就绪后会自动让你进入插图规划阶段。

**Phase 2 — 插图规划**（系统自动触发，你会收到「稿子写好了，帮我配几张插图」指令）：
1. ProjectRead("outline.md") 读取章节计划
2. 规划插图 shot list（4-8 张，可空），**在消息末尾输出 illustration_checkpoint JSON**
3. ⚠️ **不要逐个描述每张插图**。一句话带过即可，然后直接输出 JSON。
4. ⚠️ **不要反问用户**。不要调用 ProjectSetStatus。输出完就停。

## ⛔ 写作阶段红线（违反会被系统拦截）
- ❌ **绝对禁止写 presentation/src/chapters/ 下的任何 .tsx / .css 文件**
- ❌ **绝对禁止调用 ProjectShell 执行 tsc 或任何构建命令**
- ❌ 不要在写作阶段把 outline 里的章节「顺便」实现成代码——进入 building 阶段后由你通过 ProjectSetChapter 完成
- 你的唯一输出：rhythm.md → script.md → outline.md → illustration_checkpoint JSON

主题已默认设置，不要讨论主题。
**绝对禁止**：不要列出 review 清单、不要反问用户、不要停下来等确认。
⚠️ SKILL.md 中的旧 Phase 1 checkpoint 流程已被本系统的自动化流程替代，不要执行。`;
      }
      if (isVideo && !illustrationsEnabled) {
        return `**已有文件不重写。不需要逐条列出已有文件——直接判断当前阶段，推进下一步。不要反问用户「要不要调整」「有没有意见」——直接执行。**

步骤（仅当文件尚未生成时执行）：
1. ProjectRead("article.md") 读取内容
2. 根据文章类型选情绪弧模板（上方「RHYTHM-DESIGN.md」），ProjectWrite("rhythm.md", content)
3. 生成口播稿，ProjectWrite("script.md", content)
4. 生成 outline，ProjectWrite("outline.md", content)
5. **完成后调用 ProjectSetStatus("building")** → ⚡系统自动触发脚手架，然后你进入构建阶段通过 ProjectSetChapters 批量生成蓝图并编译为代码。

**如果所有文件（script.md + outline.md）都已存在**：不要重写、不要反问、不要提议修改。
调用 ProjectSetStatus("building")，简短回复「文件已就绪，进入构建阶段。」然后立即停止。系统会自动触发脚手架。

## ⛔ 写作阶段红线（违反会被系统拦截）
- ❌ **绝对禁止写 presentation/src/chapters/ 下的任何 .tsx / .css 文件**
- ❌ **绝对禁止调用 ProjectShell 执行 tsc 或任何构建命令**
- ❌ 不要在写作阶段把 outline 里的章节「顺便」实现成代码——进入 building 阶段后由你通过 ProjectSetChapter 完成
- ❌ **不要输出 illustration_checkpoint JSON**（插图生成已关闭）
- 你的唯一输出：rhythm.md → script.md → outline.md
- ❌ **不要问用户任何问题**（不要问"要不要调整稿子""要不要改大纲""选哪个主题"等）
- ❌ **不要推荐主题或开发模式**

主题已默认设置，不要讨论主题。
⚠️ SKILL.md 中的旧 Phase 1 checkpoint 流程已被本系统的自动化流程替代，不要执行。`;
      }
      // Graphic format (non-video)
      return `**已有文件不重写。不要反问用户。直接执行。**

步骤（仅当文件尚未生成时执行）：
1. ProjectRead("article.md") 读取内容
2. 生成 cards.json
3. 消息末尾输出 plan_checkpoint JSON 块（含 cardCount、titles、recommendedThemes）
4. ProjectSetStatus("plan_checkpoint")
${projectType && projectType !== "article" ? `\n注意：当前项目类型为「${projectType}」。` : ""}
${projectType === "product-demo" ? `

## 🔍 产品讲解模式

当前项目是「产品演示」，流程与其他类型不同：

1. **先探索**：系统已自动用 Playwright 浏览产品网站，生成 product-exploration.json + 截图
2. **再分析**：用 ProjectRead("product-exploration.json") 读取探索结果，了解产品的页面结构、文字内容、交互元素
3. **写稿子**：按功能模块拆分章节 —— 首页概览 → 核心功能 1 → 核心功能 2 → 特色能力 → 总结
4. **引截图**：每章 outline 中标注引用 exploration 中的截图文件（在素材列表中，以 screenshot- 开头的文件）
5. **章节模板**：用 product-screenshot 模板（Mock 浏览器框 + 截图 + 高亮标注）

**口播风格**：产品介绍 —— 专业、清晰、有说服力，不是 B 站吐槽风格。可以正面介绍产品优势。
**视觉策略**：Mock 浏览器展示截图 + 局部放大高亮 + 功能描述标注
**章节结构**：每章 = 一个产品模块，每 step = 该模块的一个特性点 + 对应截图的标注区域

**禁止**：
- ❌ 不要用 B 站「兄弟们」「说白了」等口语化表达
- ❌ 不要只读文章 —— 要去 project-exploration.json 读取真实的页面内容
- ❌ 不要跳过截图引用 —— 视觉必须基于真实产品截图` : ""}`;
    }

    case "building": {
      return `## 构建阶段 — 批量生成章节蓝图并提交编译

将 outline.md 的所有章节一次性转换为 ChapterBlueprint JSON 数组，通过 **ProjectSetChapters** 批量提交并行编译。

## 工作流程

**第一步 — 检查已有进度：**
1. ProjectRead("outline.md") 读取完整的章节计划
2. ProjectList("presentation/src/chapters") 查看已有章节目录
3. 对比确定哪些章尚未构建（通常全部待构建）

**第二步 — 一次性生成所有蓝图并批量提交：**
1. 为上方的 CHAPTER-TYPES.md / CHAPTER-CRAFT.md / PRIMITIVES.md 提供参考
2. 为每个章节选择视觉方案：
   - **默认用组合模式（mode: "composed"）**：根据 visual_strategy 选择布局和 primitive 组合。参考 PRIMITIVES.md 的选型表和 EXAMPLES/composed-blueprints/ 的完整示例。
   - 如果章节结构恰好匹配某个模板（如纯引用用 quote-card），才用模板模式（mode: "template"）。
3. 将所有 blueprint 放入一个数组，调用 **ProjectSetChapters({ blueprints: [...] })** 一次性提交
   - 系统逐个验证 → 合法的并行编译落盘 → 一次性重建注册表 → 跑一次 tsc
   - 返回结果区分 built（成功）和 failed（失败，附原因）

**第三步 — 处理失败章节：**
- 如果返回结果中有 failed 章节，只对失败的那些调用 **ProjectSetChapter** 单独修正
- 修正后不要再批量提交

**全部完成后：** 简短总结，不要调用 ProjectSetStatus。

## 重要规则
- ✅ **优先使用 ProjectSetChapters 一次性提交所有章节**（一次工具调用完成全部构建）
- ✅ **默认使用 composed 模式**（grid/split/stack/center + Counter/Reveal/Stagger/NetworkGraph 等），模板模式仅作快捷通道
- ✅ 严格按 outline.md 的 chapter_type、visual_strategy、primitives、infoPool 填充 blueprint
- ✅ 注册表自动从磁盘目录重建，无需手动检查
- ✅ 如果批量提交后有 failed 章节，用 ProjectSetChapter 单独修正
- ❌ 不要逐章调用 ProjectSetChapter（除非修正失败的章节）
- ❌ 不要检查或读取 chapters.ts
- ❌ 不要因为 tsc 警告（非本章错误）而重新提交
- ❌ 不要写 presentation/src/chapters/ 下的文件
- ❌ 不要调用 ProjectWrite / ProjectShell / ProjectSetStatus
- ❌ 不要输出 JSON 信号`;
    }
	case "audio":
	case "audio_checkpoint":
	      return `项目构建已完成。语音合成和背景音乐通过顶部工具栏的「语音」「音乐」按钮操作，不走对话流程。

	你的职责：
	- 不要主动提及音频相关话题（除非用户直接提问）
	- 不要输出任何 JSON 信号，不要调用 ProjectSetStatus
	- 如果用户询问音频，引导他们使用工具栏面板`;
	    case "done":
	      return "项目已完成，可以预览播放。\n\n你是轻量修改模式：\n- 简单修改（改数据/文案/样式）→ ProjectRead → ProjectWrite → ProjectShell tsc 验证\n- 新增/重建章节 → 先 ProjectRead 参考文档（CHAPTER-CRAFT.md / PRIMITIVES.md / CHAPTER-TYPES.md），再用 ProjectSetChapter 提交 blueprint\n- 换主题 → 直接 ProjectWrite tokens.css\n- 音频/BGM → 引导用户用工具栏面板操作\n\n不要反问用户、不要输出 JSON 信号、不要调用 ProjectSetStatus。\n不要主动建议重建章节。用户只询问进度/状态时简短回复即可。";

    default:
      return "";
  }
}

// ─── Illustration-video / illustrated-article status guidance ──────────────────

function getIllustStatusGuidance(status: string, projectType: string): string {
  const isArticleMode = projectType === "illustrated-article";

  switch (status) {
    case "writing":
    case "plan_checkpoint":
      return `**已有文件不重写。不要反问用户。直接执行。**

步骤（仅当文件尚未生成时执行）：
1. ProjectRead("article.md") 读取内容
2. 根据文章类型选情绪弧模板，ProjectWrite("rhythm.md", content)
3. 生成口播稿，ProjectWrite("script.md", content)
4. 生成 outline，ProjectWrite("outline.md", content)
5. **完成后调用 ProjectSetStatus("illustrating") 进入插图阶段。**

## ⛔ 写作阶段红线
- ❌ 不要写任何代码文件
- ❌ 不要调用 ProjectShell
- ❌ 不要反问用户"要不要调整""有没有意见"
- ❌ 不要列出 review 清单

主题已默认设置，不要讨论主题。`;

    case "illustrating":
      return `## 小黑插画规划阶段${isArticleMode ? '（图文排版 — 全文 4-8 张）' : '（绘图视频 — 每 step 1 张）'}

你现在的任务是规划插画 shot list。

步骤：
1. ProjectRead("outline.md") 读取章节计划
2. ${isArticleMode
  ? '为全文选 4-8 个认知锚点（不是每个 step 一张），每个锚点设计一张小黑风格插画'
  : '为每个 step 设计一张小黑风格插画（1:1 对齐）'}
3. 参考上方「小黑 IP 形象」和「构图方法论」文档设计每张插画：
   - 8 种结构类型中为每张选最合适的一个
   - 相邻 step 结构类型要有变化
   - 为当前文章发明新隐喻，不复用旧案例
4. 为每张插画填写：
   - theme: 中文主题（如「信息过载痛点」）
   - structureType: 结构类型
   - coreIdea: 核心含义（20-40 字）
   - xiaoheiAction: 小黑动作描述
   - elements: 画面元素列表
   - labels: 中文手写标注列表（≤8 处，每处 2-8 字）
5. 在消息末尾输出 illustration_generate JSON 信号：
   \`\`\`json
   {"type":"illustration_generate","data":{"shotCount":${isArticleMode ? '6' : '图表数量'},"chapters":["coldopen","why-matter",...]}}
   \`\`\`

⚠️ Studio 收到信号后会调用生成 API 批量生成图片。生成完成后你会收到通知。
全部生成后，${isArticleMode
  ? '调用 ProjectSetStatus("typesetting") 进入排版阶段'
  : '用 ProjectWrite("illust-timeline.json", timeline) 写入时间轴，然后 ProjectSetStatus("done")'}

**不要逐个描述每张插画**——一句话带过，直接输出 JSON 信号。
**不要反问用户**——输出完就停。

## illust-timeline.json 格式（仅绘图视频模式）:
\`\`\`json
[
  {
    "chapterId": "coldopen",
    "stepIdx": 0,
    "illustration": "coldopen-01-input-chaos.png",
    "narration": "口播文本（可选，用于字幕）",
    "durationSec": 5.0,
    "kenBurns": { "scale": 1.03, "panX": 0, "panY": 0 }
  }
]
\`\`\`

durationSec 默认填 5.0，kenBurns 默认填 { "scale": 1.03, "panX": 0, "panY": 0 }。`;

    case "typesetting":
      return `## 图文排版阶段

用户的文章和插画已就绪。排版引擎将插画嵌入原文最佳位置。

步骤：
1. ProjectRead("article.md") 读取原文
2. 分析文章段落结构，为每张插画找到最佳插入位置
3. 生成排版结构并保存到 article_layouts 表
4. 在消息末尾输出 typesetting_complete JSON 信号
5. ProjectSetStatus("done")

排版原则：
- 首图放在文章开头（全文核心概念图）
- 每张图配一句简短说明（≤20 字）
- 两张图之间至少隔 2 个自然段
- 数据/流程/对比类内容优先配图
- 列表和引用块内不插图

## 结构化信号
\`\`\`json
{"type":"typesetting_complete","data":{"blockCount":42,"illustrationCount":6}}
\`\`\``;

    case "audio_checkpoint":
      return `项目绘图已完成。语音合成和背景音乐通过顶部工具栏的「语音」「音乐」按钮操作，不走对话流程。

你的职责：
- 不要主动提及音频相关话题（除非用户直接提问）
- 不要输出任何 JSON 信号，不要调用 ProjectSetStatus
- 如果用户询问音频，引导他们使用工具栏面板`;
    case "done":
      return "项目已完成。你是轻量修改顾问。\n\n常见操作：\n- 调整插图顺序/描述 → ProjectRead/Write illust-timeline.json\n- 修改排版 → ProjectRead/Write article_layouts 相关文件\n- 重新生成某张插图 → 引导用户在工具栏面板操作\n\n不要反问用户、不要输出 JSON 信号、不要调用 ProjectSetStatus。简短回复即可。";

    default:
      return "";
  }
}

// ─── Graphic (图文卡片) prompt ────────────────────────────────────────────────

async function buildGraphicSystemPrompt(project: Project, enabledSkills: string[] = [MAIN_SKILL_ID]): Promise<SystemModelMessage[]> {
  const mainSkillId = project.mainSkillId ?? MAIN_SKILL_ID;
  const assetsSection = await buildAssetsManifest(project);
  const status = project.status as string;
  const isWriting = status === "writing" || status === "plan_checkpoint";
  const isBuilding = status === "building" || status === "done";

  const mainModel = project.model ?? "deepseek-v4-pro";
  const gModelDisplayName = mainModel.startsWith("claude-")
    ? `Claude ${mainModel.replace("claude-", "").replace(/-/g, " ")}`
    : mainModel.startsWith("deepseek-")
      ? `DeepSeek ${mainModel.replace("deepseek-", "").replace(/-/g, " ").replace("v4 pro", "V4 Pro").replace("v4 flash", "V4 Flash").replace("chat", "V3").replace("reasoner", "R1")}`
      : mainModel;

  const stablePart = `你是 Web Video Studio 的 AI 图文助手，帮用户把内容制作成竖版知识图解卡片（1080×1920，小红书/公众号风格）。你的底层模型是 ${gModelDisplayName}。如果用户问你是什么模型，回答「${gModelDisplayName}」。

**语言规则：所有对话消息必须用中文回复。代码注释和文件内容保持原格式不变。**

## 可用工具（只用这5个）
- **ProjectRead(path)**: 读取项目目录下的文件
- **ProjectWrite(path, content)**: 写文件（自动创建父目录）
- **ProjectList(dir)**: 列目录内容
- **ProjectShell(cmd, cwd?)**: 执行 bash/npm/npx/tsc/node 命令，cwd 相对项目根目录
- **ProjectSetStatus(status)**: 更新项目状态

## 文件命名（中文名 → 文件名）
- 原文 → article.md（只读参考）
- 卡片数据 → cards.json（卡片列表，含标题/类型/要点）
- assets/: 素材目录
- presentation/: Vite+React+TS 竖版卡片项目（scaffold 后存在）
  - src/cards/registry.ts: 卡片注册表（需要在每张卡片完成后更新）
  - src/cards/<id>/Card.tsx: 每张卡片组件

## 卡片设计规则
- 尺寸固定 1080×1920，position: absolute; inset: 0
- 颜色全部用 var(--accent) / var(--bg) / var(--text) / var(--text-2) / var(--text-3) / var(--surface) 等 tokens
- 字体用 var(--font-body) 等 token
- 不要 import 任何外部动画库
- 每张卡片是独立 React 组件，不依赖 step / stepper
- 可以有轻微 CSS 入场动画（@keyframes），但不强制
- 文字大小：标题 72-96px，正文 36-44px，注释 28-32px

## 卡片类型速查
- cover: 封面卡（标题 + 来源/副标题 + 大图标/图案）
- toc: 目录卡（本期内容预告，编号列表）
- concept: 概念解释（定义 + 图示 + 一句话总结）
- list: 要点列表（3-7条，带序号或图标）
- flow: 流程/机制（箭头流程图、环形图、树形图）
- data: 数据卡（大数字 + 图表 + 说明）
- quote: 引用/金句（大字排版，凸显核心观点）
- comparison: 对比卡（双栏，左右或上下对比）
- summary: 总结卡（回顾要点 + 行动号召）

## 结构化信号格式
${isWriting ? `
分析完文章、生成 cards.json 后输出：
\`\`\`json
{"type":"plan_checkpoint","data":{"cardCount":8,"titles":["封面","目录","机制一","..."],"recommendedThemes":[{"id":"paper-press","score":0.9,"reason":"知识科普风格匹配"},{"id":"monochrome-print","score":0.8,"reason":"严肃内容适配"}]}}
\`\`\`` : ""}${isBuilding ? `
开始构建某张卡片时输出：
\`\`\`json
{"type":"card_status","data":{"cardId":"01-cover","title":"封面","status":"building"}}
\`\`\`

每张卡片构建完成后输出：
\`\`\`json
{"type":"card_review","data":{"cardId":"01-cover","title":"封面","status":"done"}}
\`\`\`

全部卡片完成后输出：
\`\`\`json
{"type":"cards_done","data":{"cardCount":8}}
\`\`\`` : ""}`;

  const dynamicPart = `## 当前项目
- ID: ${project.id}
- 标题: ${project.title}
- 状态: ${project.status}
- 格式: 图文卡片
- 主题: ${project.theme ?? "未选择"}
${assetsSection}
${buildEnabledSkillsSection(enabledSkills, mainSkillId)}
## 当前阶段
${getGraphicStatusGuidance(project.status, project.theme)}`;

  return applySizeGuard([
    {
      role: "system",
      content: stablePart,
      providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
    },
    {
      role: "system",
      content: dynamicPart,
    },
  ]);
}

function getGraphicStatusGuidance(status: string, theme: string | null): string {
  switch (status) {
    case "writing":
      return `用户上传内容后会触发生成请求。如果 cards.json 已在之前对话中生成，则跳过已完成步骤直接汇报进度。步骤（仅当文件尚未生成时执行）：
1. ProjectRead("article.md") 读取内容
2. 分析文章，规划卡片序列（一般 6-12 张）：
   - 第 1 张：封面卡（cover）
   - 第 2 张：目录卡（toc），可选
   - 中间：正文卡（concept/list/flow/data/comparison/quote，按内容选）
   - 最后：总结卡（summary）
3. 生成 cards.json，每条包含：
   {
     "id": "01-cover",
     "type": "cover",
     "title": "卡片标题",
     "summary": "这张卡片的核心内容一句话",
     "keyPoints": ["要点1", "要点2"]
   }
   ProjectWrite("cards.json", JSON.stringify(cards, null, 2))
4. 消息末尾输出 plan_checkpoint JSON 块（含 cardCount、titles、recommendedThemes）
5. ProjectSetStatus("plan_checkpoint")

推荐主题以「知识科普」「信息密度」为标准，优先推荐：paper-press / monochrome-print / newsroom / swiss-data-dashboard / blueprint`;

    case "plan_checkpoint":
      return `等待用户在 Plan Checkpoint 确认主题。如用户要调整卡片结构，直接修改 cards.json 即可。`;

    case "building": {
      return `主题 ${theme ?? "未知"}，开始逐张构建卡片。

⚠️ 开始前先检查已有进度：
- ProjectList("presentation/src/cards") 查看已有卡片
- ProjectRead("presentation/src/cards/registry.ts") 看已注册卡片
- 已存在的卡片**不要重写**，从未完成的继续

构建步骤：
1. ProjectRead("cards.json") 读取卡片列表
2. 对每一张**尚未完成**的卡片：
   a. 输出 card_status building 信号
   b. 实现卡片组件：
      - ProjectWrite("presentation/src/cards/<id>/Card.tsx", ...)
      - 颜色全部用 token var(--accent) 等，不要写死颜色
      - 尺寸 position:absolute;inset:0，内容自由布局
   c. ProjectWrite("presentation/src/cards/registry.ts", ...) 注册本卡片：
      import { CardDef } from "./types";
      import Card01 from "./01-cover/Card";
      // ... 所有已完成的卡片
      export const CARDS: CardDef[] = [{ id: "01-cover", title: "封面", Component: Card01 }, ...];
   d. ProjectShell("npx tsc --noEmit -p tsconfig.app.json", "presentation") 验证
   e. 输出 card_review 信号
   f. **不要停，立刻继续下一张**
3. 全部卡片完成后 ProjectSetStatus("done")，输出 cards_done 信号，告知用户可以预览导出`;
    }

    case "done":
      return "卡片全部完成。用户可在预览里浏览每张卡片，也可导出图片。如有修改需求继续对话。";

    default:
      return "";
  }
}

// ─── Manim (数学动画) prompt ──────────────────────────────────────────────────

async function buildManimSystemPrompt(project: Project, enabledSkills: string[] = [MAIN_SKILL_ID]): Promise<SystemModelMessage[]> {
  const mainSkillId = project.mainSkillId ?? MAIN_SKILL_ID;
  const mainSkillPath = resolveSkillPath(mainSkillId);
  const assetsSection = await buildAssetsManifest(project);
  const mainModel = project.model ?? "deepseek-v4-pro";
  const modelName = formatModelName(mainModel);

  const identityAndTools = `你是 Web Video Studio 的 AI 数学视频制作助手，帮用户将数学/物理/算法内容制作成 3Blue1Brown 风格动画。你的底层模型是 ${modelName}。

**语言规则：所有消息用中文。代码内容保持原格式不变。**

## ⚠️ 环境已就绪 — 不要做任何安装检测
- \`manim\` 和 \`python3\` 命令已配置在 PATH 中，直接用
- **绝对禁止**：❌ pip install / ❌ brew install / ❌ 检查 python 版本 / ❌ which manim
- 直接写代码 + 语法检查 + manim 渲染预览，不要纠结环境

## 角色边界
你负责将数学文章翻译成 Manim Python 代码。渲染由独立的 CLI 引擎处理。

## 可用工具
- **ProjectRead(path)**: 读取项目或 Skill 文件
- **ProjectWrite(path, content)**: 写文件
- **ProjectList(dir)**: 列目录
- **ProjectShell(cmd, cwd?)**: 执行 bash/python3/manim。允许：\`python3\`、\`manim\`、\`bash\`
- **ProjectSetStatus(status)**: 更新项目状态

## 文件命名（中文名 → 文件名）
- 原文 → article.md → 口播稿 → script.md → 开发计划 → outline.md → manim_project/scene_NN.py → manim_project/output/*.mp4`;

  const manimRules = `## 口播稿规则
B站风格，口语化，每句≤20字。--- 分隔每个节拍。

## Manim 场景规划 (outline.md)
按口播节拍划为 4-8 个场景。每场景一个 Python 文件 scene_NN.py。
每场景包含：标题、步数、数学概念、视觉策略、mobject 建议。

## Manim 代码规范
- API: \`from manim import *\`(ManimCE v0.20)
- 场景类: \`class SceneNN(Scene):\`, 实现 \`construct()\`
- 分辨率: 1920×1080
- 颜色: BLUE, RED, YELLOW, GREEN, ORANGE, WHITE, GREY
- 公式: \`MathTex(r"...", font_size=48)\`
- 中文: \`Text("中文", font_size=36, font="PingFang SC")\`
- 坐标轴: \`Axes(x_range, y_range, x_length=10, y_length=6)\`
- 动画: \`self.play(Create(mob))\` + \`self.wait(1)\`
- 函数曲线: \`axes.plot(lambda x: ..., color=BLUE)\`
- 定位: \`.to_edge(UP)\`, \`.next_to(other, DOWN)\`
- 3D: \`ThreeDScene\` + \`self.set_camera_orientation(phi=60*DEGREES, theta=-45*DEGREES)\`
- 语法检查: \`python3 -c "import ast; ast.parse(open('scene_NN.py').read())"\`

## 结构化信号
写作完成: \`{"type":"manim_checkpoint","data":{"sceneCount":6,"scenes":[...]}}\`
每场景完成: \`{"type":"scene_done","data":{"sceneId":"01","status":"done"}}\``;

  const dynamicPart = `## 当前项目
- ID: ${project.id}
- 标题: ${project.title}
- 状态: ${project.status}
- 格式: Manim 数学动画
- 主题: ${project.theme ?? "未选择"}
${assetsSection}
${buildEnabledSkillsSection(enabledSkills, mainSkillId)}
## 当前阶段
${getManimStatusGuidance(project.status)}`;

  return applySizeGuard([
    { role: "system", content: identityAndTools, providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } } },
    { role: "system", content: manimRules, providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } } },
    { role: "system", content: dynamicPart },
  ] as SystemModelMessage[]);
}

function getManimStatusGuidance(status: string): string {
  switch (status) {
    case "writing":
      return `**已有文件不重写。不要反问用户。直接执行。**
步骤（仅当文件未生成时）：
1. ProjectRead("article.md") 读取内容
2. 生成口播稿 ProjectWrite("script.md")
3. 规划场景 4-8 个，ProjectWrite("outline.md")
4. 消息末尾输出 manim_checkpoint JSON
5. ProjectSetStatus("building")
⚠️ 写作阶段不要生成 .py 代码。`;

    case "building":
      return `## 场景代码生成
按 outline.md 的场景列表逐个生成：
1. ProjectWrite("manim_project/scene_NN.py", code) — 完整的 Manim Scene 类
2. ProjectShell("python3 -c 'import ast; ast.parse(open(\\\"manim_project/scene_NN.py\\\").read())'") — 语法检查
3. 输出 scene_done JSON 信号
4. 继续下一个
禁止：❌ 不要执行 manim render ❌ 不要生成 React/TSX ❌ 不要 npm/npx/tsc
全部完成后 ProjectSetStatus("done")`;

    case "done":
      return "项目已完成。渲染由系统自动触发。如用户有问题可继续解答。";

    default:
      return "";
  }
}

// ─── Draw (智能绘图) prompt ───────────────────────────────────────────────────

async function buildDrawSystemPrompt(project: Project, enabledSkills: string[] = [MAIN_SKILL_ID]): Promise<SystemModelMessage[]> {
  const mainSkillId = project.mainSkillId ?? MAIN_SKILL_ID;
  const mainSkillPath = resolveSkillPath(mainSkillId);
  const mainModel = project.model ?? "deepseek-v4-pro";
  const modelName = formatModelName(mainModel);

  const identityAndTools = `你是 Web Video Studio 的 AI 智能绘图助手，帮用户用自然语言生成专业图表。底层模型 ${modelName}。

**语言规则：所有消息用中文。图表代码保持原格式。**

## 三大绘图引擎
| 引擎 | 格式 | 风格 | 适用场景 |
|------|------|------|----------|
| **Mermaid** | 文本 (.mmd) | Markdown 原生 | 技术文档、快速出图 |
| **Draw.io** | XML (.drawio) | 专业框图 | 正式架构图、汇报 |
| **Excalidraw** | JSON (.excalidraw) | 手绘质感 | 博客配图、创意 |

## 可用工具
- **ProjectRead(path)**: 读取文件
- **ProjectWrite(path, content)**: 写文件
- **ProjectList(dir)**: 列目录
- **ProjectShell(cmd, cwd?)**: 执行命令

## 图表输出目录
diagrams/diagram-NN-{slug}.mmd (或 .drawio / .excalidraw)
diagrams/diagram-manifest.json 列出所有图表

## 工作流
1. 理解需求：分析用户描述，确定图表类型
2. 选择引擎：技术文档→Mermaid，架构图→Draw.io，手绘→Excalidraw
3. 生成代码：用 ProjectWrite 保存图表文件
4. 更新清单：写入 diagrams/diagram-manifest.json`;

  const drawRules = `## Mermaid 优先策略
- Mermaid 语法最简洁，AI 生成准确率最高
- 节点 ≤15 个，层级 ≤4 层
- 用 subgraph 对相关内容分组
- 每个节点和箭头有文字标签
- 颜色简洁，用英文小写 color 名

## Mermaid 常用语法
\`\`\`mermaid
flowchart TD
    A[开始] --> B{判断}
    B -->|是| C[操作]
    B -->|否| D[跳过]
\`\`\`

## 节点形状
[矩形] (圆角) {菱形} ((圆形)) [[子程序]] [(数据库)]

## 图表清单格式
\`\`\`json
{
  "diagrams": [
    {"id":"01","title":"系统架构图","engine":"mermaid","file":"diagram-01-architecture.mmd"}
  ]
}
\`\`\``;

  const dynamicPart = `## 当前项目
- ID: ${project.id}
- 标题: ${project.title}
- 格式: 智能绘图
${buildEnabledSkillsSection(enabledSkills, mainSkillId)}
## 当前阶段
${getDrawStatusGuidance(project.status)}`;

  return applySizeGuard([
    { role: "system", content: identityAndTools, providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } } },
    { role: "system", content: drawRules, providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } } },
    { role: "system", content: dynamicPart },
  ] as SystemModelMessage[]);
}

function getDrawStatusGuidance(status: string): string {
  switch (status) {
    case "writing":
      return `**已有图表不重写。不要反问用户。直接执行。**
步骤：
1. 理解用户的图表需求（类型、节点、关系）
2. 选择合适的引擎（Mermaid / Draw.io / Excalidraw）
3. 生成完整代码
4. ProjectWrite("diagrams/diagram-01-{slug}.mmd", code)
5. ProjectWrite("diagrams/diagram-manifest.json", manifest)
6. 给用户展示图表内容和说明
可以一次生成多张图表`;
    case "done":
      return "项目已完成。如用户需要修改或新增图表，继续对话即可。";
    default:
      return "";
  }
}
