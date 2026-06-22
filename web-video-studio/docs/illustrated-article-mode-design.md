# 图文排版长文模式 — 产品方案

> 2026-06-21 · v1.0

---

## 一、定位与核心概念

### 1.1 什么是"图文排版长文"

一种新的内容生产模式：上传一篇文章 → AI 分析认知锚点 → 生成 4-8 张小黑插画 → 将插画嵌入原文合适位置 → 输出完整的图文排版长文 → 一键导出，发布公众号。

**一句话定义：** 给文章配上小黑插画，排好版，直接拿去发公众号。

### 1.2 与现有两种模式的三角关系

```
                    ┌──────────────────────┐
                    │   文章讲解 (video)     │
                    │   代码动效 · 动态PPT   │
                    │   React/TSX · 截图    │
                    └──────────────────────┘
                           ↑ 需要写代码
                           │
              ┌────────────┴────────────┐
              │       共用基础设施        │
              │  项目系统 · AI Agent     │
              │  图片生成 · 素材库       │
              └────────────┬────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ↓                                     ↓
┌──────────────────┐                ┌──────────────────┐
│  绘图视频         │                │  图文排版长文 ★   │
│  插画+语音→视频   │                │  插画+排版→长文   │
│  Ken Burns 动效   │                │  静态排版 · 阅读  │
│  ffmpeg 合成      │                │  HTML/Markdown    │
└──────────────────┘                └──────────────────┘
   每 step 1 张图                      每篇文章 4-8 张图
   与音频同步                          与段落对齐
   产出: mp4                           产出: 排版长文
```

| 维度 | 绘图视频 | 图文排版长文 |
|------|---------|-------------|
| **目标平台** | B站/YouTube/抖音 | 微信公众号/知乎/Notion |
| **产出格式** | mp4 视频 | 排版好的 HTML/富文本 |
| **插图数量** | 每 step 1 张（10-30 张） | 每篇 4-8 张 |
| **插图粒度** | 每句话/每个节拍 | 每个核心观点/认知锚点 |
| **配音** | 必须（TTS） | 不需要 |
| **动效** | Ken Burns + 转场 | 静态图 |
| **核心技术** | ffmpeg 合成 | 排版引擎 + 导出 |
| **用户心智** | "做视频" | "写文章" |

### 1.3 为什么做这个

**视频模式的天花板：** 不是所有内容都适合做视频。文字阅读在信息密度、检索效率、深度理解方面有不可替代的优势。很多创作者的核心诉求是"写好一篇文章"而不是"做一个视频"。

**当前痛点：** 创作者写公众号文章时，配图要么找图库（风格不统一）、要么自己画（太慢）、要么不配图（阅读体验差）。小黑插画正好填补这个空白——统一视觉语言、自动匹配内容、一键排版导出。

**复用程度极高：** 相比绘图视频需要音频+渲染两套重型管线，图文排版模式几乎不需要新基础设施。图片生成管线完全复用，新增的只是排版引擎和导出功能。

---

## 二、复用现有基础设施分析

### 2.1 可直接复用的

| 现有模块 | 复用方式 | 改动 |
|---------|---------|------|
| 项目系统 (projects CRUD) | 新增 projectType | 无改动 |
| 用户认证 (JWT) | 完全复用 | 无改动 |
| 图片生成 (lib/fal.ts) | 完全复用 | 无改动 |
| 图片 prompt 组装 (lib/illustration-prompt.ts) | 完全复用 | 无改动 |
| 素材库 (library assets) | 复用 | 无改动 |
| DB schema 基础 | 复用 projects + illustration_shots 表 | 无需新表 |
| AI Agent 框架 | 新增阶段指引 | 加一个 case |
| Agent 工具 | 复用 | 加一个导出工具 |
| 项目文件系统 | 复用，存在 assets/illustrations/ | 无改动 |
| 前端组件 (project-card, article-uploader 等) | 微调 | 加类型标签 |

### 2.2 不需要的

| 模块 | 原因 |
|------|------|
| Vite/React 脚手架 (lib/scaffold.ts) | 不需要 presentation/ |
| Vite 构建 (lib/build.ts) | 不需要 |
| Playwright 截图渲染 | 不需要 |
| ffmpeg 渲染 worker | 不需要 |
| TTS/音频合成 | 不需要 |
| 音频工作台 (audio-workbench) | 不需要 |
| 语音选择器 | 不需要 |

### 2.3 需要新建的

| 模块 | 用途 |
|------|------|
| `lib/article-layout.ts` | 排版引擎：分析文章 → 找到最佳插画插入位置 → 生成排版结构 |
| `lib/article-export.ts` | 导出引擎：排版结构 → WeChat HTML / Markdown / 纯文本 |
| `components/article-layout-editor.tsx` | 可视化排版编辑器：拖拽调整插图位置 |
| `components/article-export-panel.tsx` | 导出面板：预览 + 选择格式 + 复制/下载 |
| `app/api/projects/[id]/articles/layout/route.ts` | API：保存/读取排版配置 |
| `app/api/projects/[id]/articles/export/route.ts` | API：触发生成导出内容 |

---

## 三、数据模型设计

### 3.1 仅需一个新增表

```sql
CREATE TABLE article_layouts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE REFERENCES projects(id),
  blocks TEXT NOT NULL DEFAULT '[]',  -- JSON: LayoutBlock[]
  theme_config TEXT NOT NULL DEFAULT '{}',  -- JSON: 排版主题配置
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### 3.2 排版块数据结构

```typescript
type BlockType = "paragraph" | "heading" | "illustration" | "divider" | "quote";

interface LayoutBlock {
  id: string;
  type: BlockType;
  // For paragraph / heading / quote blocks:
  content?: string;        // markdown text
  // For illustration blocks:
  shotId?: string;         // FK → illustration_shots.id
  illustrationUrl?: string;
  caption?: string;        // 图片说明文字
  width?: "full" | "wide" | "normal";  // 图片宽度档次
  // Common:
  spacingBefore?: "normal" | "large" | "none";
}
```

### 3.3 排版主题配置

```typescript
interface ArticleThemeConfig {
  fontFamily: string;       // "system" | "serif" | "sans"
  fontSize: number;         // 15-18px
  lineHeight: number;       // 1.6-2.0
  paragraphSpacing: number; // 0.5-1.5em
  headingStyle: "bold" | "colored" | "underlined";
  imageWidth: "full-bleed" | "contained";  // 图片是否撑满宽度
  accentColor: string;      // "#000000"
  backgroundColor: string;  // "#ffffff"
}
```

### 3.4 projects 表不需要新增字段

`projectType: "illustrated-article"` 即可。

---

## 四、工作流状态机

```
writing → plan_checkpoint → illustrating → typesetting → done
```

对比现有：

```
绘图视频：     writing → plan_checkpoint → illustrating → audio_checkpoint → done
图文排版长文：  writing → plan_checkpoint → illustrating → typesetting → done
文章讲解：      writing → plan_checkpoint → illustration_planning → building → audio_checkpoint → done
```

`typesetting` 是新状态，替代了音频合成阶段。

### 各阶段详细设计

#### Phase 1-2：writing + plan_checkpoint（与现有相同）

- 用户上传文章 → AI 读取
- 产出 `script.md` + `outline.md`（但 script 不是口播稿，而是"精修版正文"）
- 确认计划

#### Phase 3：illustrating — 插画生成（与绘图视频相同，但粒度不同）

关键区别：绘图视频是每个 step 一张，图文排版是每篇文章总共 4-8 张。

AI 选点策略：
- 选文章中最核心的 4-8 个认知锚点
- 优先选"不看图就理解成本很高"的位置
- 第一张通常是"全文核心概念"的隐喻图
- 每张对应一个自然段落区间的核心观点

**产出：** 图片 + `illustration_shots` 表中的记录

#### Phase 4：typesetting — 排版（新）

```
子流程：
1. 读取 article.md（原文） + illustration_shots（已生成图）
2. AI 分析每个 shot 对应的最佳插入位置
3. 生成 LayoutBlock[] 排版结构
4. 用户在可视化编辑器中预览 + 微调
5. 确认排版 → 导出
```

**产出：** `article_layouts` 表记录 + 可导出的排版内容

#### Phase 5：done — 导出

- 预览最终效果
- 选择导出格式
- 一键复制/下载

---

## 五、排版引擎设计

### 5.1 自动排版算法

```
输入: article.md (Markdown 原文) + illustration_shots[] (已生成图)
输出: LayoutBlock[]

算法:
1. 将 article.md 解析为段落块：按 #标题 / 空行 / >引用 分割
   → paragraphs: Array<{ type, content, startIndex }>

2. 为每个 illustration_shot 找到最佳插入位置:
   - 根据 shot.coreIdea 与各段落内容的语义匹配度评分
   - 优先插入到"观点刚提出来，还没深入解释"的位置
   - 避免插入到列表中间
   - 两张图之间至少隔 2 个自然段落

3. 合并段落 + 插入插图:
   → 按顺序排列: [段1, 段2, 图1, 段3, 段4, 段5, 图2, ...]

4. 在文章顶部插入"首图"（全文核心概念图）
5. 在文章末尾可选插入"总结图"
```

### 5.2 手动微调

排版编辑器允许：
- 拖拽插图到任意两个段落之间
- 删除某张插图（从排版中移除，图文件保留）
- 调整图片宽度（全宽/标准/缩略）
- 编辑图片说明文字
- 预览整体排版效果

---

## 六、导出引擎设计

### 6.1 支持格式

| 格式 | 用途 | 实现 |
|------|------|------|
| **微信公众号 HTML** | 直接粘贴到公众号编辑器 | 内联 style，img 用 data URI 或 CDN URL |
| **Markdown** | 发布到知乎/Notion/GitHub | 标准 MD + 图片 URL |
| **纯 HTML** | 自建博客/网页 | 完整 HTML 页面 |
| **PDF** | 离线分发/打印 | Puppeteer 打印 |

### 6.2 微信公众号导出细节

```
特殊约束：
- 图片必须使用 https 公网 URL（不能用 localhost）
- 不支持自定义字体（只能用系统字体）
- 不支持 CSS class，必须内联 style
- 段落间距用 margin-bottom，不用 gap
- 图片宽度建议 ≤ 640px（公众号默认宽度）
- 不支持 SVG，必须 PNG/JPG
- 颜色只能用 #RRGGBB 格式

生成逻辑：
1. 遍历 LayoutBlock[]
2. 每个块转为 <section style="..."> 内联 HTML
3. 图片用 <img src="CDN_URL" style="width:100%; display:block;">
4. 段落用 <p style="font-size:16px; line-height:1.8; color:#333; margin-bottom:1.2em;">
5. 标题用 <h2 style="font-size:20px; font-weight:bold; margin:2em 0 1em;">
6. 引用用 <blockquote style="border-left:3px solid #ddd; padding-left:1em; color:#666;">
7. 最终输出一个可复制的 HTML 字符串
```

### 6.3 导出前处理

```
导出前自动：
1. 将 illustration asset URL 从 /api/projects/... 代理路径
   转换为绝对公网 URL（需上传到 CDN 或使用已上传的远程 URL）
2. 或者：使用 data URI 内嵌图片（适合图片不大的场景）
3. 验证所有图片可访问
```

---

## 七、前端组件设计

### 7.1 排版编辑器（新建）

**文件：`components/article-layout-editor.tsx`**

```
┌──────────────────────────────────────────────────┐
│ 图文排版                                    [导出]│
├──────────────┬───────────────────────────────────┤
│              │                                   │
│  插画库       │  排版预览（实时）                  │
│  (右侧可折叠) │                                   │
│              │  ──── 大标题 ────                  │
│  ┌────┐      │                                   │
│  │ 图1│ 拖→  │  段落文字段落文字段落文字            │
│  └────┘      │  段落文字段落文字...                │
│  ┌────┐      │                                   │
│  │ 图2│      │  ┌──────────────┐                 │
│  └────┘      │  │   插图 #1    │                 │
│  ┌────┐      │  │  说明文字    │                 │
│  │ 图3│      │  └──────────────┘                 │
│  └────┘      │                                   │
│              │  段落文字段落文字...                │
│  ┌────┐      │                                   │
│  │ 图4│      │  ┌──────────────┐                 │
│  └────┘      │  │   插图 #2    │                 │
│              │  └──────────────┘                 │
│              │                                   │
│ [+添加分页线] │  ──── 小标题 ────                  │
│              │                                   │
│              │  段落文字...                       │
│              │                                   │
└──────────────┴───────────────────────────────────┘
```

核心交互：
- **左侧插画库**：已生成的插画缩略图列表，可拖拽到右侧预览区
- **右侧排版预览**：实时渲染的排版效果，插画可上下拖动换位
- **每张插画**：可编辑说明文字、切换宽度（全宽/标准/窄）
- **导出按钮**：弹出导出面板

### 7.2 导出面板（新建）

**文件：`components/article-export-panel.tsx`**

```
┌─────────────────────────────────────┐
│ 导出图文排版                          │
├─────────────────────────────────────┤
│ 格式:                               │
│ ○ 微信公众号 HTML  (推荐)            │
│ ○ Markdown                          │
│ ○ 纯 HTML 页面                      │
│                                     │
│ 图片处理:                            │
│ ○ 使用远程 URL (需要上传到 CDN)       │
│ ○ 内嵌 Data URI  (图片 < 500KB 推荐) │
│                                     │
│ 预览区:                              │
│ ┌───────────────────────────────┐   │
│ │  [完整排版预览]                │   │
│ │  (按公众号宽度模拟)            │   │
│ └───────────────────────────────┘   │
│                                     │
│ [复制到剪贴板]  [下载 HTML]  [取消]   │
└─────────────────────────────────────┘
```

### 7.3 现有组件改动

**project-card.tsx**：新增一个卡片类型：
```typescript
{
  id: "illustrated-article",
  icon: (/* 文章+图片 SVG */),
  label: "图文排版",
  desc: "用小黑插画给文章配图排版，导出公众号长文",
}
```

---

## 八、AI Agent 提示词变更

### 8.1 新增阶段指引（system-prompt.ts）

```typescript
case "typesetting":
  return `图文排版阶段。用户的文章和插画已就绪。

步骤：
1. ProjectRead("article.md") 读取原文
2. 分析文章结构，找到最佳插图插入位置
3. 生成排版方案，输出到 article_layouts 表
4. 用户确认后 ProjectSetStatus("done")

排版原则：
- 首图放在文章开头（全文核心概念图）
- 每张图配一句简短说明（≤20 字）
- 两张图之间至少隔 2 个自然段
- 数据/流程/对比类内容优先配图
- 列表和引用块内不插图
- 图宽默认"全宽"（微信风格），特殊需求可缩窄`;
```

### 8.2 新增信号格式

```json
{"type":"typesetting_complete","data":{"blockCount":42,"illustrationCount":6}}
```

---

## 九、API 设计

### 9.1 排版 API

```
POST   /api/projects/[id]/articles/layout
  Body: { blocks: LayoutBlock[], themeConfig?: ArticleThemeConfig }
  → 保存排版结构到 article_layouts 表

GET    /api/projects/[id]/articles/layout
  → 读取当前排版结构

POST   /api/projects/[id]/articles/export
  Body: { format: "wechat" | "markdown" | "html", imageMode: "url" | "datauri" }
  → 生成导出内容并返回

GET    /api/projects/[id]/articles/preview
  → 返回完整 HTML 预览页（公众号宽度模拟）
```

### 9.2 现有 API 变更

- `POST /api/projects` — 新增 projectType 枚举值
- `POST /api/projects/[id]/illustrations/plan` — 复用（shot 粒度不同）
- `POST /api/projects/[id]/illustrations/generate` — 完全复用
- `GET /api/projects/[id]/illustrations/status` — 完全复用

---

## 十、文件清单

```
新建文件（7 个）:
  lib/article-layout.ts                   # 排版引擎（分析+插入）
  lib/article-export.ts                   # 导出引擎（HTML/MD/PDF）
  components/article-layout-editor.tsx    # 排版编辑器
  components/article-export-panel.tsx     # 导出面板
  app/api/projects/[id]/articles/
    ├── layout/route.ts                   # CRUD 排版
    ├── export/route.ts                   # 触发生成导出
    └── preview/route.ts                  # 预览页
  scripts/test-article-layout.ts          # 测试

修改文件（4 个）:
  lib/db/schema.ts                        # + article_layouts 表, + ProjectType, + ProjectStatus
  lib/db/migrations/0002_article_layouts.sql
  lib/agent/tools.ts                      # ProjectSetStatus enum 加 typesetting
  lib/agent/system-prompt.ts             # typesetting case + 指引
  components/project-card.tsx             # 类型标签
```

---

## 十一、实施路线

### Phase A1 — 核心闭环（1-2 天）

| # | 任务 |
|---|------|
| 1 | Schema：`ProjectType` 加 `illustrated-article`，`ProjectStatus` 加 `typesetting`，新建 `article_layouts` 表 |
| 2 | Migration SQL + 执行 |
| 3 | `lib/article-layout.ts`：自动排版引擎（Markdown 解析 + 插画插入） |
| 4 | API：`POST/GET articles/layout` |
| 5 | Agent：tools + system-prompt 扩展 |
| 6 | `project-card.tsx` 类型扩展 |

### Phase A2 — 导出 + 编辑器（2-3 天）

| # | 任务 |
|---|------|
| 7 | `lib/article-export.ts`：WeChat HTML / Markdown / HTML 三种导出 |
| 8 | `components/article-layout-editor.tsx`：可视化拖拽排版 |
| 9 | `components/article-export-panel.tsx`：格式选择 + 复制下载 |
| 10 | API：`POST articles/export` + `GET articles/preview` |
| 11 | 端到端测试 |

### Phase A3 — 高级（后续）

- CDN 图片上传（支持外网访问）
- PDF 导出
- 自定义排版主题
- 多文章合集导出
- 定时发布公众号

---

## 十二、与绘图视频模式的关系

两个模式共享核心能力，但使用场景不同：

| 共享层 | 差异层 |
|--------|--------|
| 图片生成管线 | 排版 vs 时间轴 |
| Shot 规划逻辑（DB 表） | 4-8 张 vs 10-30 张 |
| 小黑 Skill 集成 | 静态发布 vs 动态播放 |
| Project 生命周期 | 导出 HTML vs 渲染 mp4 |

**一句话：** 同一套 AI 插图能力，两个消费场景——视频创作和文章出版。
