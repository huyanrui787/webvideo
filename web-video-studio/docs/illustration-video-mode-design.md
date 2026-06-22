# 绘图视频模式 — 完整产品方案

> 2026-06-21 · v2.0 · 细化版

---

## 目录

1. [定位与核心概念](#一)
2. [现有系统集成分析](#二)
3. [数据模型设计](#三)
4. [API 设计](#四)
5. [Agent 系统提示词变更](#五)
6. [Agent 工具变更](#六)
7. [前端组件设计](#七)
8. [渲染 Worker 设计](#八)
9. [时间轴格式规范](#九)
10. [端到端数据流](#十)
11. [与现有模式共存策略](#十一)
12. [实施路线](#十二)

---

## <a id="一"></a>一、定位与核心概念

### 1.1 什么是"绘图视频"

一种新的视频制作模式：画面不是前端代码绘制的动态视觉，而是 AI 生成的纯插画。每张插画与对应 step 的口播语音同步，通过 Ken Burns 效果（缓速平移缩放）和淡入淡出转场形成视频。

**一句话：** 把一篇文章的认知锚点变成小黑插画，按章节 step 节奏切画、配音、合成视频。

### 1.2 与现有模式的本质区别

| 维度 | 现有「文章讲解」 | 新模式「绘图视频」 |
|------|-----------------|-------------------|
| 画面来源 | React/TSX/CSS/Canvas 实时渲染 | AI 生成的 PNG 插画 |
| 动效方式 | Reveal/Stagger/Counter/DrawPath 等 JS 动画 | Ken Burns + crossfade |
| 开发方式 | AI 写章节 TSX 代码 → tsc 验证 | AI 规划 shot → 生成插画 → 时间轴编排 |
| 视觉风格 | 取决于主题 token | 统一小黑手绘风 |
| 适合内容 | 数据故事、代码讲解、产品演示 | 方法论、认知讲解、概念图解、叙事文章 |
| Dev server | 需要 Vite HMR | 不需要 |
| 预览方式 | 浏览器实时渲染 | 图片轮播播放器 |

### 1.3 用户价值

- **零代码**：不需要 AI 写 React/CSS，只需要 AI 画图
- **视觉一致**：小黑 IP 保证整套视频风格统一，无代码质量参差
- **内容匹配**：特别适合抽象内容的图解表达
- **更快迭代**：省去「写代码 → tsc 验证 → 修改」的循环

---

## <a id="二"></a>二、现有系统集成分析

### 2.1 当前状态机

```
writing → plan_checkpoint → illustration_planning → building → audio_checkpoint → done
```

关键事实：
- `illustration_planning` 状态 **只在 DB schema 中存在**，但 Agent 的 `ProjectSetStatus` 工具 **不允许设置它**（tools.ts 的 enum 中没有）。说明它是由 Studio UI 代码直接写入的中间状态。
- 当 `status === "illustration_planning"` 时，Agent 被指示规划一个 shot list，然后在消息末尾输出 `illustration_checkpoint` JSON 信号。UI 收到后展示 `IllustrationCheckpointCard`。
- 当前生成的是 4-8 张**辅助插图**，用于在章节 TSX 代码中引用。

### 2.2 新模式对状态机的改动

```
（现有）writing → plan_checkpoint → illustration_planning → building → audio_checkpoint → done
（新增）writing → plan_checkpoint → illustrating → audio_checkpoint → done
```

`illustrating` 不是 `illustration_planning` 的重命名，而是一个**全新的独立状态**：
- `illustration_planning`：为 building 阶段规划辅助插图（保留不变）
- `illustrating`：绘图视频的主生产阶段（新增）

两者**不会在同一个项目中共存**——项目类型决定了走哪条分支。

### 2.3 需要修改的文件清单

```
数据库：
  lib/db/schema.ts                    ← ProjectStatus + ProjectType 枚举扩展
                                        + illustration_shots 表定义
  lib/db/migrations/                  ← 新增 migration

Agent 层：
  lib/agent/tools.ts                  ← ProjectSetStatus enum 扩展
  lib/agent/system-prompt.ts          ← getStatusGuidance() 新增 "illustrating" case

API 层：
  app/api/projects/[id]/illustrate/   ← 新建（plan + generate + status）
  app/api/projects/[id]/render/route.ts  ← 扩展（支持 illustrate 模式触发）

渲染层：
  lib/render.ts                       ← startRender() 增加模式判断
  lib/render-worker-illust.js         ← 新建（插图渲染 worker）

前端：
  app/page.tsx                        ← 新建项目时可选 illustration-video
  components/project-card.tsx         ← 新增类型卡片 + 标签
  components/illustration-checkpoint-card.tsx  ← 升级为双模式
  components/illust-timeline-editor.tsx  ← 新建（时间轴编辑器）
  components/illust-player.tsx        ← 新建（预览播放器）
  components/chapter-progress-panel.tsx   ← 适配 illustrating 状态
  components/playback-bar.tsx         ← 识别 illustration-video 模式
```

---

## <a id="三"></a>三、数据模型设计

### 3.1 Drizzle Schema 变更

**文件：`lib/db/schema.ts`**

```typescript
// ─── 枚举扩展 ───────────────────────────────────────────────────────

export type ProjectStatus =
  | "writing"
  | "plan_checkpoint"
  | "illustration_planning"   // 现有：building 前的辅助插图规划
  | "building"
  | "illustrating"            // ★ 新增：绘图视频主生产阶段
  | "audio_checkpoint"
  | "done";

export type ProjectType =
  | "article"
  | "data-story"
  | "code-tour"
  | "product-demo"
  | "timeline-story"
  | "illustration-video";     // ★ 新增

// ─── 新增表 ──────────────────────────────────────────────────────────

export type ShotStatus =
  | "pending"
  | "prompting"     // AI 正在构思 prompt
  | "generating"    // 图片生成中（DashScope 异步任务）
  | "done"
  | "error";

export type StructureType =
  | "Workflow"
  | "系统局部"
  | "前后对比"
  | "角色状态"
  | "概念隐喻"
  | "方法分层"
  | "地图路线"
  | "小漫画分镜";

export const illustrationShots = sqliteTable("illustration_shots", {
  id: text("id").primaryKey(),                     // nanoid
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  chapterId: text("chapter_id").notNull(),          // 对应 outline 的章节 id
  stepIdx: integer("step_idx").notNull().default(0), // 本章内的 step 索引（0-based）
  theme: text("theme").notNull(),                   // 中文主题，如 "信息过载痛点"
  structureType: text("structure_type")
    .$type<StructureType>()
    .notNull(),
  coreIdea: text("core_idea").notNull(),            // 核心含义（中文，20-40 字）
  xiaoheiAction: text("xiaohei_action"),           // 小黑动作描述
  elements: text("elements").notNull().default("[]"),   // JSON string[]
  labels: text("labels").notNull().default("[]"),       // JSON string[]
  promptEn: text("prompt_en"),                     // 发送给 DashScope 的英文 prompt
  assetFilename: text("asset_filename"),           // 保存的文件名
  assetUrl: text("asset_url"),                     // 可访问的 URL（/api 代理或远程）
  generationStatus: text("generation_status")
    .$type<ShotStatus>()
    .notNull()
    .default("pending"),
  generationError: text("generation_error"),       // 失败原因
  kenBurnsScale: integer("ken_burns_scale"),       // 目标缩放 %，如 103 = 1.03×
  kenBurnsPanX: integer("ken_burns_pan_x").default(0),  // 水平平移 px
  kenBurnsPanY: integer("ken_burns_pan_y").default(0),  // 垂直平移 px
  sortOrder: integer("sort_order").notNull().default(0), // 全局排序
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type IllustrationShot = typeof illustrationShots.$inferSelect;
export type NewIllustrationShot = typeof illustrationShots.$inferInsert;

// ─── projects 表现有字段不变，无需新增列 ──────────────────────────
// illustration_style 等偏好可通过 theme 字段承载（如 theme="ian-xiaohei"）
```

### 3.2 projects 表现有字段的复用

| 字段 | 绘图视频模式下的含义 |
|------|-------------------|
| `theme` | 插画风格，值为 `"ian-xiaohei"`（未来可扩展） |
| `orientation` | 始终 `"landscape"`（16:9） |
| `devMode` | 不使用（无代码构建并行概念），可置 null |
| `ttsProvider` | 与现有相同（minimax / openai） |
| `ttsVoice` | 与现有相同 |
| `model` | AI 对话使用的模型（与现有相同） |

### 3.3 文件系统约定

```
projects/<id>/
├── article.md                          # 原始内容
├── script.md                           # 口播稿
├── outline.md                          # 章节计划
├── rhythm.md                           # 节奏蓝图（可选）
├── assets/
│   ├── illustrations/                  # ★ 插画文件
│   │   ├── coldopen-01-input-chaos.png
│   │   ├── coldopen-02-filter-funnel.png
│   │   ├── why-matter-01-before-after.png
│   │   └── ...
│   └── meta.json                       # 现有：素材元数据
├── illust-timeline.json                # ★ 渲染时间轴（见第九节）
├── presentation/
│   ├── public/audio/<chapter>/<N>.mp3  # TTS 音频（与现有相同）
│   └── audio-segments.json             # 音频片段索引
├── .render-status.json                 # 渲染状态（与现有相同）
└── render.mp4                          # 最终产物
```

注意：绘图视频 **不需要** `presentation/src/`、`presentation/package.json`、`node_modules` 等 Vite 项目文件。但保留 `presentation/public/audio/` 目录是因为音频合成脚本（`extract-narrations.ts` + `synthesize-audio.sh`）依赖此路径约定。

---

## <a id="四"></a>四、API 设计

### 4.1 现有 API 无需修改

以下 API 对绘图视频模式完全适用，不需要任何改动：

- `POST /api/projects` — 创建项目（传 `projectType: "illustration-video"`）
- `GET /api/projects` — 列表
- `GET /api/projects/[id]` — 详情
- `POST /api/auth/*` — 认证
- `GET/POST /api/voices/*` — 语音
- `GET/POST /api/themes/*` — 主题
- `POST /api/projects/[id]/chat` — AI 对话（核心复用）

### 4.2 新增 API 路由

所有新增路由在 `app/api/projects/[id]/illustrations/` 下：

#### `POST /api/projects/[id]/illustrations/plan`

AI 分析 outline.md 并生成 shot list 后调用。接受前端或 Agent 提交的 shot plan。

```typescript
// Request
{
  shots: Array<{
    chapterId: string;
    stepIdx: number;
    theme: string;
    structureType: StructureType;
    coreIdea: string;
    xiaoheiAction: string;
    elements: string[];
    labels: string[];
  }>
}

// Response 201
{
  ok: true,
  shotCount: 12,
  shots: Array<{ id: string; ... }>  // 插入后的完整 shot 记录
}
```

实现逻辑：
1. 清空该项目已有的 `illustration_shots`（允许重新规划）
2. 批量插入新的 shot 记录（`generation_status: "pending"`）
3. 返回完整记录

#### `POST /api/projects/[id]/illustrations/generate`

批量生成插画。

```typescript
// Request
{
  shotIds?: string[];    // 指定生成哪些（默认：全部 pending 的）
  concurrency?: number;  // 并行数，默认 2
}

// Response 200
{
  ok: true,
  jobId: string,         // 用于轮询
  totalShots: 12,
  status: "generating"
}
```

实现逻辑：
1. 查询 `generation_status = "pending"` 的 shot
2. 对每个 shot，组装英文 prompt（见 4.3）
3. 并行调用 `lib/fal.ts` 的 `generateImage()`（DashScope wanx-v1）
4. 下载生成的 PNG 到 `assets/illustrations/`
5. 更新 shot 的 `assetFilename`、`assetUrl`、`generationStatus`
6. 轮询期间返回进展

生成过程中的 prompt 组装逻辑（服务端）：

```typescript
// lib/illustration-prompt.ts（新建）
import type { IllustrationShot } from "@/lib/db/schema";

export function buildImagePrompt(shot: IllustrationShot): string {
  const elements = JSON.parse(shot.elements) as string[];
  const labels = JSON.parse(shot.labels) as string[];

  return `Generate one standalone 16:9 horizontal Chinese article illustration.

Visual DNA:
Pure white background. Minimalist black hand-drawn line art. Slightly wobbly pen
lines. Lots of empty white space. Sparse red/orange/blue handwritten Chinese
annotations. Clean absurd product-sketch feeling. No gradients, no shadows, no
paper texture, no complex background, no commercial vector style, no PPT
infographic look, no cute mascot poster, no children's illustration, no realistic UI.

Recurring IP character required:
小黑, a small solid-black absurd creature with white dot eyes, tiny thin legs,
blank serious expression, slightly uneven hand-drawn body shape. 小黑 must
perform the core conceptual action, not decorate the scene. Make 小黑 serious,
deadpan, and slightly bizarre, not cute.

Theme: ${shot.theme}
Structure type: ${shot.structureType}
Core idea: ${shot.coreIdea}
Composition: ${shot.xiaoheiAction}
Elements: ${elements.join(" / ")}
Chinese handwritten labels: ${labels.join(" / ")}
Color use: Black line art + red/orange/blue sparse annotations.

Constraints: One core structure only. Main subject 40-60% of frame. At least 35%
empty white space. Max 5-8 short Chinese handwritten labels. No title in corner.
No structure type label. No formal chart. No reused examples.`;
}
```

#### `GET /api/projects/[id]/illustrations/status`

```typescript
// Response 200
{
  totalShots: 12,
  doneCount: 8,
  errorCount: 1,
  pendingCount: 3,
  shots: Array<{
    id: string;
    chapterId: string;
    stepIdx: number;
    theme: string;
    generationStatus: ShotStatus;
    assetUrl?: string;
    generationError?: string;
  }>
}
```

#### `POST /api/projects/[id]/illustrations/render`

触发插图渲染。

```typescript
// Request
{}  // 无需参数

// Response 200
{
  ok: true,
  message: "渲染已启动"
}
```

实现：调用 `startIllustRender(projectId)` → 在 `lib/render.ts` 中新增函数，spawn `render-worker-illust.js`。

#### `PATCH /api/projects/[id]/illustrations/[shotId]`

单张修改（用于时间轴编辑器）。

```typescript
// Request
{
  kenBurnsScale?: number;
  kenBurnsPanX?: number;
  kenBurnsPanY?: number;
  sortOrder?: number;
  // 也可以重新生成单张
  regenerate?: boolean;
}

// Response 200
{ ok: true, shot: {...} }
```

### 4.3 DashScope 调用参数

现有 `lib/fal.ts` 的 `generateImage()` 直接适配：

```typescript
// 当前参数
{
  model: "wanx-v1",
  input: { prompt: buildImagePrompt(shot) },
  parameters: {
    style: "<sketch>",      // 手绘风格 — 匹配小黑
    size: "1280*720",       // 16:9
    n: 1,
  },
}
```

### 4.4 现有 API 的微调

`POST /api/projects/[id]/chat` — Agent 对话接口。当 `projectType === "illustration-video"` 且 `status === "plan_checkpoint"` 时，用户确认后 UI 应将 status 设为 `"illustrating"`（而非 `"building"`），Agent 在下一轮对话中根据新的 status 进入 illustrating 阶段。

---

## <a id="五"></a>五、Agent 系统提示词变更

### 5.1 `lib/agent/system-prompt.ts` 具体变更

**文件：`lib/agent/system-prompt.ts`**

#### 变更 1：`buildSystemPrompt()` 中的 `isBuilding` 判断

```typescript
// 现有
const isBuilding = project.status === "building"
  || project.status === "audio_checkpoint"
  || project.status === "done";

// 改为
const isBuilding = project.status === "building"
  || project.status === "audio_checkpoint"
  || project.status === "done";

const isIllustrating = project.status === "illustrating";  // ★ 新增
```

#### 变更 2：新增 `illustratingRules`

```typescript
const illustratingRules = isIllustrating ? `
## 绘图视频规则（小黑插图模式）

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
- 每个 step 对应 1 张插画（1:1 对齐）
- 优先选 cognitive anchor moment（认知转折、抽象概念具象化）
- 为当前文章发明新隐喻，不复用旧案例

代码约束：
- **不需要写 React 代码**，不需要 presentation/src/
- 产出是图片文件 + illust-timeline.json
- 图片保存到 assets/illustrations/

生成流程：
1. 先输出 shot plan 让用户确认
2. 确认后调用 API 逐批生成
3. 生成完后输出 illust-timeline.json
` : "";
```

#### 变更 3：`getStatusGuidance()` 新增 case

```typescript
case "illustrating": {
  const skillRoot = process.cwd().replace(/\/web-video-studio$/, "")
    + "/web-video-presentation";

  return `绘图视频插图生成阶段。

步骤：
1. ProjectRead("outline.md") 读取章节计划
2. 为每个 step 设计一张小黑风格插画。
   参考 ${skillRoot}/references/ILLUSTRATION-VIDEO-CRAFT.md（如果存在）
   否则遵循内置规则：
   - 每个 step 1 张，不合并
   - 8 种结构类型中为每张选最合适的一个
   - 相邻 step 结构类型要有变化
   - 为当前文章发明新隐喻
3. 输出 shot plan 供用户确认（消息中列出每张的主题、结构类型、核心含义、小黑动作）
4. 用户确认后，输出 illustration_generate JSON 信号，Studio 会调用生成 API
5. 生成完成后，ProjectWrite("illust-timeline.json", timeline) 写入时间轴
6. 全部完成后 ProjectSetStatus("audio_checkpoint")

illust-timeline.json 格式：
\`\`\`json
[
  {
    "chapterId": "coldopen",
    "stepIdx": 0,
    "illustration": "coldopen-01-input-chaos.png",
    "durationSec": 5.2,
    "kenBurns": { "scale": 1.03, "panX": 0, "panY": 0 }
  }
]
\`\`\`

durationSec 默认填 5.0（实际时长在 TTS 合成后由音频文件决定）。
kenBurns 默认填 { "scale": 1.03, "panX": 0, "panY": 0 }。`;
}

case "illustration_planning":
  // 现有逻辑保持不变（为 building 模式规划辅助插图）
```

#### 变更 4：结构化信号扩展

```typescript
// 在 signals 变量中新增（isIllustrating 时启用）：

${isIllustrating ? `
全部 shot 规划完成后输出：
\`\`\`json
{"type":"illustration_generate","data":{"shotCount":12,"chapters":["coldopen","why-matter","method","summary"]}}
\`\`\`

全部插画生成 + timeline 写入完成后输出：
\`\`\`json
{"type":"illustration_complete","data":{"shotCount":12,"chapters":6}}
\`\`\`
` : ""}
```

---

## <a id="六"></a>六、Agent 工具变更

### 6.1 `lib/agent/tools.ts` 具体变更

#### 变更 1：`ProjectSetStatus` enum 扩展

```typescript
// 现有
ProjectSetStatus: tool({
  // ...
  inputSchema: z.object({
    status: z.enum([
      "writing",
      "plan_checkpoint",
      "building",
      "audio_checkpoint",
      "done",
    ]),
  }),
}),

// 改为
ProjectSetStatus: tool({
  // ...
  inputSchema: z.object({
    status: z.enum([
      "writing",
      "plan_checkpoint",
      "illustration_planning",  // 现有，补充到 enum
      "building",
      "illustrating",            // ★ 新增
      "audio_checkpoint",
      "done",
    ]),
  }),
}),
```

#### 变更 2：新增 `ProjectSetTimeline` 工具（可选，提升体验）

```typescript
ProjectSetTimeline: tool({
  description: "Write the illustration timeline JSON for rendering",
  inputSchema: z.object({
    segments: z.array(z.object({
      chapterId: z.string(),
      stepIdx: z.number(),
      illustration: z.string(),   // filename in assets/illustrations/
      durationSec: z.number(),
      kenBurns: z.object({
        scale: z.number(),
        panX: z.number(),
        panY: z.number(),
      }).optional(),
    })),
  }),
  execute: async ({ segments }) => {
    writeProjectFile(projectId, "illust-timeline.json",
      JSON.stringify(segments, null, 2));
    return { success: true, segmentCount: segments.length };
  },
}),
```

---

## <a id="七"></a>七、前端组件设计

### 7.1 项目卡片扩展

**文件：`components/project-card.tsx`**（仅需新增 3 处）

```typescript
// 1. TYPE_LABELS 新增
const TYPE_LABELS: Record<ProjectType, string> = {
  // ...existing
  "illustration-video": "绘图视频",
};

// 2. PROJECT_TYPES 数组新增
{
  id: "illustration-video",
  icon: (/* 画笔/插画 SVG icon */),
  label: "绘图视频",
  desc: "用小黑手绘插画图解文章内容",
},

// 3. STATUS_LABELS + STATUS_COLORS 新增
const STATUS_LABELS: Record<Project["status"], string> = {
  // ...existing
  illustrating: "插画生成中",
};
```

### 7.2 插图时间轴编辑器（新建）

**文件：`components/illust-timeline-editor.tsx`**

```
┌─────────────────────────────────────────────────────┐
│ 插图时间轴                        [预览] [渲染] [×] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─ 第1章：冷开场 ─────────────────────────────────┐ │
│ │                                                  │ │
│ │  #1  ┌──────────┐  #2  ┌──────────┐  #3  ┌─────┐│ │
│ │ 4.2s │  缩略图  │ 5.1s │  缩略图  │ 3.8s │ ... ││ │
│ │      │ ████     │      │ ████     │      │     ││ │
│ │      │ ████     │      │ ████     │      │     ││ │
│ │      └──────────┘      └──────────┘      └─────┘│ │
│ │  KB: subtle          KB: moderate       KB: off │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ 第2章：为什么重要 ─────────────────────────────┐ │
│ │  ...                                             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [添加章节]  [全部重置 KB]  [导出 timeline.json]     │
└─────────────────────────────────────────────────────┘
```

组件状态与交互：

| 状态 | 描述 |
|------|------|
| **加载中** | 从 `/api/projects/[id]/illustrations/status` 获取 shot 列表 |
| **空状态** | 尚无 shot plan，显示 "等待 AI 规划插图..." |
| **编辑中** | 正常展示，支持拖拽排序、点击修改 KB 参数 |
| **生成中** | 部分 shot 显示 spinner overlay，不可拖拽 |
| **生成完成** | 全部 done，可渲染 |

每张 shot 卡片的交互：
- **点击**：放大预览 + 显示完整信息（theme, coreIdea, xiaoheiAction, labels）
- **右键/长按**：重新生成此张
- **拖动**：调整在本章内的顺序（→ 更新 sort_order）
- **底部三个点**：KB 预设选择（subtle / moderate / dramatic / off）

Ken Burns 预设：

| 预设 | scale | panX | panY | 效果 |
|------|-------|------|------|------|
| off | 1.00 | 0 | 0 | 完全静止（低端内容不推荐） |
| subtle | 1.03 | 0 | 0 | 几乎不可察觉的缓速 zoom in（推荐） |
| moderate | 1.06 | ±15 | ±10 | 明显的平移缩放 |
| dramatic | 1.10 | ±40 | ±25 | 强烈的运动感 |

### 7.3 插图播放器（新建）

**文件：`components/illust-player.tsx`**

用于在项目详情页**内嵌预览**绘图视频，不需要 Vite dev server。

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                                                      │
│                   ┌──────────┐                       │
│                   │ 当前插画  │                       │
│                   │ (16:9)   │                       │
│                   │          │                       │
│                   │  Ken Burns│                       │
│                   │  动画    │                       │
│                   └──────────┘                       │
│                                                      │
│  字幕：小黑正在用漏斗过滤混乱的输入信息...            │
│                                                      │
├──────────────────────────────────────────────────────┤
│  ▶/⏸  00:12 / 03:45  ───○────────────  🔊  [⚙]   │
└──────────────────────────────────────────────────────┘
```

组件 Props：

```typescript
interface IllustPlayerProps {
  projectId: string;
  timeline: IllustTimelineSegment[];  // 来自 illust-timeline.json
  audioSegments?: AudioSegment[];     // 来自 audio-segments.json
  subtitles?: Subtitle[];            // 来自 narrations
}
```

核心逻辑：
```typescript
// 基于 requestAnimationFrame 的播放循环
function useIllustPlayer(timeline: Segment[]) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [progress, setProgress] = useState(0); // 0-1 within current segment
  const [playing, setPlaying] = useState(false);

  // 构建累积时间查找表
  const lookup = useMemo(() => buildTimeLookup(timeline), [timeline]);

  // rAF 循环
  useEffect(() => {
    if (!playing) return;
    let raf: number;
    const startTime = performance.now();

    const tick = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const seg = findSegment(lookup, elapsed);
      setCurrentIdx(seg.index);
      setProgress(seg.progress);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  return { currentIdx, progress, playing, setPlaying };
}
```

状态：

| 状态 | 展示 |
|------|------|
| **无 timeline** | 提示"尚未生成时间轴" |
| **无图片** | 占位灰色区域 + "插画生成中..." |
| **无音频** | 正常图片轮播（手动或自动），无声音 |
| **有音频有图** | 同步播放 |
| **播放中** | Ken Burns CSS transform 动画 + 字幕逐句出现 |
| **暂停** | 静态图 |
| **已完成** | 显示"播放完毕"，可重新播放 |

Ken Burns CSS 实现（性能远优于 ffmpeg zoompan 预览）：

```css
.illust-player .ken-burns-subtle {
  animation: kb-subtle 5s linear forwards;
}
@keyframes kb-subtle {
  from { transform: scale(1.0); }
  to   { transform: scale(1.03); }
}

.illust-player .ken-burns-moderate {
  animation: kb-moderate 5s linear forwards;
}
@keyframes kb-moderate {
  from { transform: scale(1.0) translate(0, 0); }
  to   { transform: scale(1.06) translate(-15px, -10px); }
}
```

### 7.4 现有组件升级

#### `illustration-checkpoint-card.tsx`

重构为双模式：

```typescript
interface IllustrationCheckpointCardProps {
  mode: "auxiliary" | "main";  // ★ 新增 mode 参数
  projectId: string;
  // auxiliary mode 的参数（现有）
  shotList?: ShotItem[];
  onConfirmed?: (illustrations: IllustrationResult[]) => void;
  onSkipped?: () => void;
  // main mode 的参数（新增）
  totalSteps?: number;
  onStartGenerating?: () => void;
}
```

**auxiliary mode**（现有行为）：
- 显示 4-8 张辅助插图的 shot list
- 用户点"生成插图"→ 批量生成 → 确认 → 进入 building

**main mode**（新行为）：
- 显示每个 step 对应的 shot 列表（可能很多，需要分组折叠按章节）
- 用户点"开始生成"→ 批量生成 → 确认 → 进入 audio_checkpoint
- 进度条显示 `doneCount / totalShots`

#### `chapter-progress-panel.tsx`

当 `status === "illustrating"` 时：
- 显示每个章节的插画生成进度（而非代码构建进度）
- 每个章节一行：`章节名  ████████░░  5/8 张完成`

#### `playback-bar.tsx`

当 `projectType === "illustration-video"` 时：
- 切换到 `<IllustPlayer>` 预览
- 隐藏"在新标签页打开演示"按钮（无 Vite dev server）

---

## <a id="八"></a>八、渲染 Worker 设计

### 8.1 入口：`lib/render.ts` 扩展

```typescript
// lib/render.ts 新增

export function startIllustRender(projectId: string): void {
  const existing = getRenderJob(projectId);
  if (existing?.status === "running") return;

  const f = statusFile(projectId);
  fs.writeFileSync(f, JSON.stringify({
    status: "running",
    progress: "启动插图渲染…",
    updatedAt: Date.now(),
  }));

  const WORKER_ILLUST = path.join(process.cwd(), "lib/render-worker-illust.js");
  const PROJECTS_ROOT = path.join(process.cwd(), "projects");

  const { spawn } = require("child_process") as typeof import("child_process");
  const child = spawn(
    process.execPath,
    [WORKER_ILLUST, projectId, PROJECTS_ROOT],
    { detached: true, stdio: "ignore" }
  );
  child.unref();
}
```

调用时机：
- `POST /api/projects/[id]/illustrations/render` 调用 `startIllustRender()`
- 或者在项目 `done` 状态下，用户在 UI 点击"渲染"按钮

### 8.2 `lib/render-worker-illust.js` 完整设计

```javascript
/**
 * Standalone illustration-video render worker.
 *
 * Strategy:
 *   1. Read illust-timeline.json for image→step mapping
 *   2. Read audio-segments.json + probe mp3 durations for real timing
 *   3. For each segment: still-image → video clip (Ken Burns via zoompan or static)
 *   4. Concat all video clips → single mp4
 *   5. Merge with concatenated audio track
 *   6. Burn subtitles from narrations
 *
 * Usage: node render-worker-illust.js <projectId> <projectsRoot>
 */

const { execFileSync, spawnSync } = require("child_process");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const Ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

Ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const [, , projectId, projectsRoot] = process.argv;
const projDir = path.join(projectsRoot, projectId);
const assetsDir = path.join(projDir, "assets/illustrations");
const audioDir = path.join(projDir, "presentation/public/audio");
const statusFile = path.join(projDir, ".render-status.json");
const timelineFile = path.join(projDir, "illust-timeline.json");
const clipsDir = path.join(projDir, ".render-clips");
const mergedAudio = path.join(projDir, ".render-audio.aac");
const outputPath = path.join(projDir, "render.mp4");

const FPS = 30;

// ─── helpers ──────────────────────────────────────────────────────────

function writeStatus(obj) {
  fs.writeFileSync(statusFile,
    JSON.stringify({ ...obj, updatedAt: Date.now() }));
}

/** Get mp3 duration via ffmpeg -i stderr parse */
function getMp3Duration(filePath) {
  return new Promise((resolve) => {
    try {
      let stderr = "";
      try {
        execFileSync(ffmpegInstaller.path, ["-i", filePath],
          { stdio: ["pipe", "pipe", "pipe"] });
      } catch (e) { stderr = e.stderr?.toString() ?? ""; }
      const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      resolve(m ? parseInt(m[1])*3600 + parseInt(m[2])*60 + parseFloat(m[3]) : 5.0);
    } catch { resolve(5.0); }
  });
}

/** Format seconds to SRT timestamp */
function toSrtTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${pad3(ms)}`;
}
function pad2(n) { return String(n).padStart(2, "0"); }
function pad3(n) { return String(n).padStart(3, "0"); }

// ─── Ken Burns filter string ──────────────────────────────────────────

/**
 * Build ffmpeg zoompan filter for Ken Burns effect.
 * @param {number} scale  Target scale (1.0 = no zoom, 1.03+ = zoom in)
 * @param {number} panX   Horizontal pan in pixels
 * @param {number} panY   Vertical pan in pixels
 * @param {number} durationSec
 * @returns {string} ffmpeg filter string
 */
function buildZoompanFilter(scale, panX, panY, durationSec) {
  const totalFrames = Math.ceil(durationSec * FPS);

  // If no Ken Burns: simple loop → static video
  if (scale <= 1.0 && panX === 0 && panY === 0) {
    // Use fps filter + shortest, simplest path
    return null; // handled differently
  }

  // Per-frame increment
  const zoomInc = (scale - 1.0) / totalFrames;
  const panXInc = panX / totalFrames;
  const panYInc = panY / totalFrames;

  // zoompan expression
  // z: current zoom level, starts at 1.0
  // x, y: pan center, starts at iw/2, ih/2
  return [
    `scale=8000:-1`,
    `zoompan=` +
      `z='min(zoom+${zoomInc.toFixed(6)},${scale.toFixed(3)})':` +
      `x='iw/2-(iw/zoom/2)+${panXInc.toFixed(3)}*on':` +
      `y='ih/2-(ih/zoom/2)+${panYInc.toFixed(3)}*on':` +
      `d=${totalFrames}:s=1920x1080:fps=${FPS}`
  ].join(",");
}

// ─── Single image → video clip ────────────────────────────────────────

/**
 * Render one illustration to a video clip (with optional audio).
 */
function imageToClip(imagePath, durationSec, kenBurns, mp3Path, outputPath) {
  return new Promise((resolve, reject) => {
    const hasKB = kenBurns
      && (kenBurns.scale > 1.0 || kenBurns.panX !== 0 || kenBurns.panY !== 0);

    let cmd = Ffmpeg()
      .input(imagePath)
      .inputOptions(["-loop 1"]);

    if (hasKB) {
      const vf = buildZoompanFilter(
        kenBurns.scale, kenBurns.panX, kenBurns.panY, durationSec);
      cmd = cmd.videoFilters(vf);
    }

    cmd
      .duration(durationSec)
      .fps(FPS)
      .videoCodec("libx264")
      .outputOptions([
        "-crf 18",
        "-preset fast",
        "-pix_fmt yuv420p",
        "-movflags +faststart",
      ])
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(new Error(`clip failed: ${err.message}`)))
      .run();
  });
}

// ─── Audio concat ─────────────────────────────────────────────────────

function concatAudio(segments, outPath) {
  const withAudio = segments.filter(s => s.mp3Path);
  if (withAudio.length === 0) return Promise.resolve(false);

  const listFile = path.join(projDir, ".render-audio-list.txt");
  const lines = [];
  for (const seg of segments) {
    if (seg.mp3Path) {
      lines.push(`file '${seg.mp3Path.replace(/\\/g, "/").replace(/'/g, "\\'")}'`);
      lines.push(`duration ${seg.durationSec.toFixed(4)}`);
    }
  }
  fs.writeFileSync(listFile, lines.join("\n") + "\n");

  return new Promise((resolve, reject) => {
    Ffmpeg()
      .input(listFile)
      .inputOptions(["-f concat", "-safe 0"])
      .audioCodec("aac")
      .audioBitrate("192k")
      .output(outPath)
      .on("end", () => resolve(true))
      .on("error", reject)
      .run();
  });
}

// ─── Clips concat ─────────────────────────────────────────────────────

function concatClips(clipFiles, outPath) {
  if (clipFiles.length === 1) {
    fs.copyFileSync(clipFiles[0], outPath);
    return Promise.resolve(outPath);
  }

  const listFile = path.join(projDir, ".render-clips-list.txt");
  const lines = clipFiles.map(f =>
    `file '${f.replace(/\\/g, "/").replace(/'/g, "\\'")}'`);
  fs.writeFileSync(listFile, lines.join("\n") + "\n");

  return new Promise((resolve, reject) => {
    Ffmpeg()
      .input(listFile)
      .inputOptions(["-f concat", "-safe 0"])
      .videoCodec("copy")
      .output(outPath)
      .on("end", () => resolve(outPath))
      .on("error", reject)
      .run();
  });
}

// ─── Final mux (video + audio + subtitles) ────────────────────────────

function muxWithAudioAndSubtitles(videoPath, audioPath, srtPath, output) {
  return new Promise((resolve, reject) => {
    let cmd = Ffmpeg().input(videoPath);

    if (audioPath && fs.existsSync(audioPath)) {
      cmd = cmd.input(audioPath);
    }

    const vfParts = [];
    if (srtPath && fs.existsSync(srtPath)) {
      const escaped = srtPath.replace(/\\/g, "/").replace(/:/g, "\\:");
      vfParts.push(
        `subtitles='${escaped}':force_style='FontSize=28,PrimaryColour=&HFFFFFF,OutlineColour=&H80000000,Outline=2,Shadow=1,Alignment=2,MarginV=40'`
      );
    }

    cmd
      .videoCodec("libx264")
      .outputOptions([
        "-crf 18",
        "-preset fast",
        "-pix_fmt yuv420p",
        "-movflags +faststart",
        ...(vfParts.length > 0 ? [`-vf ${vfParts.join(",")}`] : []),
        ...(audioPath && fs.existsSync(audioPath) ? ["-c:a aac", "-shortest"] : []),
      ])
      .output(output)
      .on("end", () => resolve(output))
      .on("error", (err) => reject(new Error(`mux failed: ${err.message}`)))
      .run();
  });
}

// ─── SRT generation ───────────────────────────────────────────────────

function buildSrt(timeline) {
  // timeline segments already have narration texts embedded
  // or we read them from illust-timeline.json's optional "narration" field

  let idx = 1;
  let cursor = 0;
  const lines = [];

  for (const seg of timeline) {
    const text = seg.narration || "";
    const start = cursor;
    const end = cursor + seg.durationSec;
    if (text) {
      lines.push(String(idx++));
      lines.push(`${toSrtTime(start)} --> ${toSrtTime(end)}`);
      lines.push(text);
      lines.push("");
    }
    cursor = end;
  }

  if (idx === 1) return null;
  const srtPath = path.join(projDir, ".render-subtitles.srt");
  fs.writeFileSync(srtPath, lines.join("\n"), "utf-8");
  return srtPath;
}

// ─── Main ─────────────────────────────────────────────────────────────

async function run() {
  // 1. Read timeline
  if (!fs.existsSync(timelineFile)) {
    writeStatus({ status: "error", error: "illust-timeline.json not found" });
    process.exit(1);
  }

  const timeline = JSON.parse(fs.readFileSync(timelineFile, "utf-8"));

  // 2. Match audio files
  const audioSegmentsFile = path.join(projDir, "presentation/audio-segments.json");
  let audioSegments = [];
  if (fs.existsSync(audioSegmentsFile)) {
    audioSegments = JSON.parse(fs.readFileSync(audioSegmentsFile, "utf-8"));
  }

  // Build audio lookup: chapter+step → mp3 path
  const audioLookup = new Map();
  for (const s of audioSegments) {
    const mp3 = path.join(audioDir, s.audio);
    if (fs.existsSync(mp3)) {
      audioLookup.set(`${s.chapter}::${s.step - 1}`, mp3);
    }
  }

  // Merge: timeline gets real durations from audio
  const merged = await Promise.all(timeline.map(async (seg) => {
    const key = `${seg.chapterId}::${seg.stepIdx}`;
    const mp3Path = audioLookup.get(key) || null;
    let durationSec = seg.durationSec || 5.0;
    if (mp3Path) {
      durationSec = await getMp3Duration(mp3Path);
    }
    return {
      ...seg,
      mp3Path,
      durationSec,
      kenBurns: seg.kenBurns || { scale: 1.0, panX: 0, panY: 0 },
    };
  }));

  const totalDuration = merged.reduce((s, t) => s + t.durationSec, 0);
  const totalSegments = merged.length;

  // 3. Render each image to a clip
  fs.mkdirSync(clipsDir, { recursive: true });
  writeStatus({
    status: "running",
    progress: `渲染 ${totalSegments} 个片段…`,
    totalDuration,
    totalSegments,
  });

  const clipFiles = [];
  for (let i = 0; i < merged.length; i++) {
    const seg = merged[i];
    const imagePath = path.join(assetsDir, seg.illustration);
    if (!fs.existsSync(imagePath)) {
      writeStatus({
        status: "error",
        error: `图片不存在: ${seg.illustration}`,
      });
      process.exit(1);
    }

    const clipPath = path.join(clipsDir, `${String(i).padStart(4, "0")}.mp4`);
    await imageToClip(
      imagePath,
      seg.durationSec,
      seg.kenBurns,
      seg.mp3Path,
      clipPath
    );
    clipFiles.push(clipPath);

    if (i % 5 === 0 || i === merged.length - 1) {
      const pct = Math.round((i / merged.length) * 100);
      writeStatus({
        status: "running",
        progress: `渲染片段 ${i + 1}/${totalSegments} (${pct}%)…`,
        totalDuration,
        totalSegments,
        segmentsDone: i + 1,
      });
    }
  }

  // 4. Concat all clips
  writeStatus({
    status: "running",
    progress: "拼接视频片段…",
    totalDuration,
    totalSegments,
  });
  const concatenatedVideo = path.join(projDir, ".render-concat.mp4");
  await concatClips(clipFiles, concatenatedVideo);

  // 5. Merge audio
  let hasAudio = false;
  try {
    hasAudio = await concatAudio(merged, mergedAudio);
  } catch (e) {
    console.error("Audio concat failed:", e.message);
  }

  // 6. Build SRT
  const srtPath = buildSrt(merged);

  // 7. Final mux
  writeStatus({
    status: "running",
    progress: "合成最终视频…",
    totalDuration,
    totalSegments,
  });
  await muxWithAudioAndSubtitles(
    concatenatedVideo,
    hasAudio ? mergedAudio : null,
    srtPath,
    outputPath
  );

  // 8. Cleanup
  fs.rmSync(clipsDir, { recursive: true, force: true });
  if (fs.existsSync(concatenatedVideo)) fs.unlinkSync(concatenatedVideo);
  if (fs.existsSync(mergedAudio)) fs.unlinkSync(mergedAudio);

  writeStatus({
    status: "done",
    progress: `完成 (${totalDuration.toFixed(1)}s, ${totalSegments} 片段${hasAudio ? "，含音频" : ""})`,
    outputFile: "render.mp4",
    totalDuration,
    totalSegments,
  });
}

run().catch((err) => {
  writeStatus({
    status: "error",
    error: String(err?.message ?? err),
    progress: String(err?.message ?? err),
  });
  // Cleanup clips dir
  try { fs.rmSync(clipsDir, { recursive: true, force: true }); } catch {}
  process.exit(1);
});
```

---

## <a id="九"></a>九、时间轴格式规范

### 9.1 `illust-timeline.json` 完整 Schema

```typescript
// Zod schema for validation
const IllustTimelineSchema = z.array(z.object({
  chapterId: z.string(),          // "coldopen"
  stepIdx: z.number().int().min(0), // 0
  illustration: z.string(),       // "coldopen-01-input-chaos.png"
  narration: z.string().optional(), // 口播文本（可选，用于生成字幕）
  durationSec: z.number().positive(), // 5.2
  kenBurns: z.object({
    scale: z.number().min(1.0).max(1.15).default(1.0),  // 1.03
    panX: z.number().min(-50).max(50).default(0),        // 0
    panY: z.number().min(-30).max(30).default(0),        // -10
  }).optional(),
}));
```

### 9.2 示例

```json
[
  {
    "chapterId": "coldopen",
    "stepIdx": 0,
    "illustration": "coldopen-01-input-chaos.png",
    "narration": "你有没有想过，为什么每天接收那么多信息，记住的却那么少？",
    "durationSec": 5.2,
    "kenBurns": { "scale": 1.03, "panX": 0, "panY": 0 }
  },
  {
    "chapterId": "coldopen",
    "stepIdx": 1,
    "illustration": "coldopen-02-filter-funnel.png",
    "narration": "就像一个大漏斗，我们的大脑其实一直在过滤。",
    "durationSec": 4.8,
    "kenBurns": { "scale": 1.05, "panX": 0, "panY": -15 }
  },
  {
    "chapterId": "coldopen",
    "stepIdx": 2,
    "illustration": "coldopen-03-drain-output.png",
    "narration": "但问题是，很多时候我们连漏斗的方向都搞反了。",
    "durationSec": 6.1,
    "kenBurns": { "scale": 1.0, "panX": 0, "panY": 0 }
  },
  {
    "chapterId": "why-matter",
    "stepIdx": 0,
    "illustration": "why-matter-01-brain-blackbox.png",
    "narration": "认知心理学里有个概念叫注意力过滤模型。",
    "durationSec": 5.5,
    "kenBurns": { "scale": 1.04, "panX": 10, "panY": 0 }
  }
]
```

---

## <a id="十"></a>十、端到端数据流

### 10.1 项目创建 → 内容编写

```
用户                  UI                       API                    Agent
 │                     │                        │                       │
 │ 新建绘图视频项目     │                        │                       │
 │────────────────────→│                        │                       │
 │                     │ POST /api/projects      │                       │
 │                     │ {projectType:"illus-    │                       │
 │                     │  tration-video"}        │                       │
 │                     │───────────────────────→│                       │
 │                     │←───────────────────────│                       │
 │                     │ 201 {id,status:"writing"}│                      │
 │                     │                        │                       │
 │ 上传文章             │                        │                       │
 │────────────────────→│                        │                       │
 │                     │ PUT article.md          │                       │
 │                     │───────────────────────→│                       │
 │                     │                        │ POST /chat            │
 │                     │                        │ {message:"生成内容"}   │
 │                     │                        │──────────────────────→│
 │                     │                        │                       │ AI:读取article
 │                     │                        │                       │ →写script.md
 │                     │                        │                       │ →写outline.md
 │                     │                        │                       │ →输出plan_
 │                     │                        │                       │   checkpoint
 │                     │                        │←──────────────────────│
 │                     │                        │ streaming parts       │
 │ 查看 plan checkpoint│                        │                       │
 │←────────────────────│                        │                       │
 │ 确认计划             │                        │                       │
 │────────────────────→│                        │                       │
 │                     │ PATCH status:           │                       │
 │                     │   "illustrating"        │                       │
 │                     │───────────────────────→│                       │
```

### 10.2 插画规划 + 生成

```
UI                               API                          Agent
 │                                 │                             │
 │ status="illustrating"           │                             │
 │─────────────────────────────→   │                             │
 │                                 │ POST /chat                  │
 │                                 │─────────────────────────────→│
 │                                 │                             │ AI:读取outline
 │                                 │                             │ →为每step规划
 │                                 │                             │  shot设计
 │                                 │←─────────────────────────────│
 │                                 │ streaming: shot plan 文本    │
 │ 展示 shot plan 列表             │                             │
 │←────────────────────────────────│                             │
 │                                 │                             │
 │ 用户确认 shot plan              │                             │
 │─────────────────────────────→   │                             │
 │                                 │ POST /illustrations/plan    │
 │                                 │ {shots:[...]}               │
 │                                 │──────────────────────→ DB   │
 │                                 │←────────────────────── OK   │
 │                                 │                             │
 │                                 │ POST /illustrations/generate│
 │                                 │ {shotIds:[...]}             │
 │                                 │──────────────────────→      │
 │                                 │   ↓ 并行调用 DashScope       │
 │                                 │   ↓ 下载 PNG                │
 │                                 │   ↓ 更新 DB shot 状态       │
 │                                 │                             │
 │ 轮询进度                        │                             │
 │←── GET /illustrations/status ──→│                             │
 │ 显示生成进度 (doneCount/total)  │                             │
 │                                 │                             │
 │ 全部生成完成                    │                             │
 │←────────────────────────────────│                             │
 │                                 │                             │
 │ 用户点"继续"                    │ AI 输出 illustration_complete│
 │─────────────────────────────→   │ 信号 → status→audio_checkpoint
 │                                 │ 同时写入 illust-timeline.json
```

### 10.3 音频合成 + 渲染

```
UI                               API                       Worker
 │                                 │                          │
 │ status="audio_checkpoint"       │                          │
 │ 用户在 AudioWorkbench           │                          │
 │ 选择语音 + 合成 TTS             │                          │
 │─────────────────────────────→   │                          │
 │                                 │ synthesize → mp3 files    │
 │                                 │ → audio-segments.json     │
 │                                 │                          │
 │ 用户点击"渲染"                  │                          │
 │─────────────────────────────→   │                          │
 │                                 │ POST /illustrations/     │
 │                                 │   render                 │
 │                                 │──────────────────────────→│
 │                                 │                  startIllustRender()
 │                                 │                  spawn worker
 │                                 │                          │
 │ 轮询 .render-status.json        │                          │
 │←── GET /render/status ─────────→│                          │
 │                                 │                          │ render-worker-illust
 │                                 │                          │ 1.读timeline.json
 │                                 │                          │ 2.匹配音频时长
 │                                 │                          │ 3.逐张→视频片段
 │                                 │                          │ 4.concat片段
 │                                 │                          │ 5.合并音频+字幕
 │                                 │                          │ 6.→ render.mp4
 │                                 │                          │
 │ 渲染完成                        │                          │
 │←── 下载/播放 render.mp4 ────────→│                          │
```

### 10.4 错误处理路径

| 阶段 | 错误 | 处理 |
|------|------|------|
| 生成插画 | DashScope 返回低质量图 | qa-checklist 自动检测，标记 error，支持"重新生成此张" |
| 生成插画 | DashScope API 超时 | 重试 2 次，仍失败则标记 error，用户可手动重试 |
| 生成插画 | 单张失败 | 不影响其他张，`generationStatus: "error"`，单独 regenerate |
| 渲染 | 某张图片缺失 | render worker 报错退出，status → error，提示缺失文件 |
| 渲染 | 音频文件格式异常 | concatAudio 捕获异常，继续无音频渲染 |
| 渲染 | 磁盘空间不足 | Worker 在写文件时捕获 ENOSPC，status → error |
| 整体 | 用户不想用小黑风格 | 未来 Phase M3 支持切换风格，当前仅支持 ian-xiaohei |

---

## <a id="十一"></a>十一、与现有模式共存策略

### 11.1 状态机互不干扰

```
                 ┌──→ illustration_planning → building → audio_checkpoint → done
                 │    (现有：文章讲解/数据故事/代码讲解/产品演示/时间线叙事)
writing → plan_checkpoint
                 │
                 └──→ illustrating → audio_checkpoint → done
                      (新增：绘图视频)
```

分支由 `projectType` 决定：
- 5 种现有类型 → 走现有分支
- `"illustration-video"` → 走新分支

### 11.2 Agent 对话中的模式识别

`system-prompt.ts` 的 `getStatusGuidance()` 在判断阶段时，先检查 `projectType`：

```typescript
function getStatusGuidance(status, theme, devMode, projectType) {
  // illustration-video 模式的分支
  if (projectType === "illustration-video") {
    switch (status) {
      case "writing": return /* 现有的 writing 逻辑（复用） */;
      case "plan_checkpoint": return /* 现有的 plan_checkpoint 逻辑（复用） */;
      case "illustrating": return /* 新的 illustrating 逻辑 */;
      case "audio_checkpoint": return /* 简化的 audio_checkpoint（无配乐推荐） */;
      case "done": return /* 现有的 done 逻辑 */;
    }
  }
  // 现有模式
  switch (status) { /* ...现有逻辑不变 */ }
}
```

### 11.3 前端路由

项目详情页 `app/projects/[id]/page.tsx` 根据 `projectType` 渲染不同工作台：

```
if projectType === "illustration-video":
  渲染 <IllustVideoWorkbench>
    - ArticleUploader (复用)
    - IllustTimelineEditor (新建)
    - IllustPlayer (新建)
    - AudioWorkbench (复用)
else:
  渲染 <ExistingWorkbench>
    - ArticleUploader
    - ChapterProgressPanel
    - ThemePickerPanel
    - AudioWorkbench
```

---

## <a id="十二"></a>十二、实施路线

### Phase M1 — 核心闭环 (3-4 天)

| # | 任务 | 文件 | 预计 |
|---|------|------|------|
| 1 | Schema: 扩展 `ProjectStatus` + `ProjectType` + 新增 `illustrationShots` 表 | `lib/db/schema.ts` | 0.5d |
| 2 | Migration: 创建 migration SQL | `lib/db/migrations/` | 0.25d |
| 3 | Tools: `ProjectSetStatus` enum 扩展 + 新增 `ProjectSetTimeline` | `lib/agent/tools.ts` | 0.25d |
| 4 | System prompt: 新增 `illustrating` case + `illustratingRules` | `lib/agent/system-prompt.ts` | 0.5d |
| 5 | API: `POST/GET /illustrations/*` 4 个路由 | `app/api/projects/[id]/illustrations/` | 1d |
| 6 | Prompt builder: 从 shot → DashScope prompt | `lib/illustration-prompt.ts`（新建） | 0.25d |
| 7 | Render entry: `startIllustRender()` | `lib/render.ts` | 0.25d |
| 8 | Render worker: `render-worker-illust.js` 基础版（无 Ken Burns） | `lib/render-worker-illust.js`（新建） | 1d |
| 9 | Component: `project-card.tsx` 扩展 | `components/project-card.tsx` | 0.25d |
| 10 | Component: `illust-timeline-editor.tsx` 基础版 | `components/illust-timeline-editor.tsx`（新建） | 1d |
| 11 | Component: `IllustrationCheckpointCard` main mode | `components/illustration-checkpoint-card.tsx` | 0.5d |
| 12 | Integration test: 创建项目 → AI规划 → 生成 → 渲染 → 下载 mp4 | 手动 | 0.5d |

**M1 交付物：** 用户可以从零创建绘图视频项目，AI 规划 shot、生成插画、合成带音频的 mp4，完整闭环可用。

### Phase M2 — 体验完善 (3-4 天)

| # | 任务 |
|---|------|
| 13 | Ken Burns zoompan filter（已在 worker 设计中预留，实现即可） |
| 14 | `IllustPlayer` 内嵌预览（CSS Ken Burns + 音频同步） |
| 15 | 字幕烧录（从 narrations 生成 SRT） |
| 16 | 时间轴编辑器拖拽排序 + KB 预设选择 |
| 17 | 单张重新生成功能 |
| 18 | qa-checklist 自动检查（集成 ian-xiaohei-illustrations） |

### Phase M3 — 高级特性 (后续)

- 多风格支持
- 转场效果（crossfade / slide / zoom）
- BGM 自动推荐与混音
- 标注元素动画（在 Ken Burns 上叠加标签出现）
- 竖屏适配（9:16 短视频）

---

## 附录 A：文件清单总览

```
新建文件（7 个）：
  lib/illustration-prompt.ts              # Prompt 组装工具
  lib/render-worker-illust.js             # 插图渲染 worker
  app/api/projects/[id]/illustrations/
    ├── plan/route.ts                     # POST shot plan
    ├── generate/route.ts                 # POST 批量生成
    ├── status/route.ts                   # GET 进度
    └── render/route.ts                   # POST 触发渲染
  components/illust-timeline-editor.tsx   # 时间轴编辑器
  components/illust-player.tsx            # 预览播放器

修改文件（7 个）：
  lib/db/schema.ts                        # 枚举 + illustration_shots 表
  lib/db/migrations/0001_illustration.sql # 新增 migration
  lib/agent/tools.ts                      # status enum + ProjectSetTimeline
  lib/agent/system-prompt.ts             # illustrating case + rules
  lib/render.ts                           # startIllustRender()
  components/project-card.tsx             # type label + card
  components/illustration-checkpoint-card.tsx  # main mode
```

## 附录 B：与 ian-xiaohei-illustrations 的边界

| 职责 | 谁负责 |
|------|--------|
| 小黑 IP 定义、视觉 DNA | `ian-xiaohei-illustrations` Skill（不变） |
| 构图模式选择 + 隐喻生成 | `ian-xiaohei-illustrations` Skill（不变） |
| 风格 QA | `ian-xiaohei-illustrations` qa-checklist（复用） |
| 生成英文 prompt | `lib/illustration-prompt.ts`（新建，组装 Skill 模板） |
| 图片生成 API 调用 | `lib/fal.ts` generateImage()（现有，不变） |
| Shot → step 映射 | `illustration_shots` 表 + `illust-timeline.json`（新建） |
| 时间轴编辑 | `illust-timeline-editor.tsx`（新建） |
| 视频合成 | `render-worker-illust.js`（新建） |
