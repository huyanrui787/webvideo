# frontend-slides 营养吸收方案

> 基于对 [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides) (21.9k ⭐) 的深度分析，
> 结合 web-video-studio 现状，提出的产品技术升级方案。

---

## 一、差距总览

| 维度 | frontend-slides | web-video-studio 现状 | 差距 |
|------|----------------|----------------------|------|
| **知识加载** | 渐进式 4 层（Map → Index → Preview → Full Doc） | 单体 SKILL.md 全量加载 | 🔴 大 |
| **主题元数据** | 7 维 mood/tone/formality/density/scheme/best_for/avoid_for | 2 维 mood/bestFor | 🔴 大 |
| **风格发现** | 生成 3 个视觉预览让用户选 | 文字列表选主题 | 🔴 大 |
| **设计文档** | 500 行 design.md = 品牌手册级 | tokens.css 只有值，无理由 | 🟡 中 |
| **反趋同** | 显式 DO NOT USE 清单 + 创意方向指引 | 隐式，分散在各处 | 🟡 中 |
| **模板加载** | 3 级 (index → preview.md → design.md) | 全量加载 23 主题 | 🟡 中 |
| **组件基础设施** | deck-stage.js web component | 自建 stage + iframe protocol | 🟢 小 |
| **动效参考** | effect-to-feeling 映射表 + 代码片段 | 16 个 showcase effects | 🟢 小 |

---

## 二、可直接复用的设计资源

### 2.1 零成本直接接入

以下资源与我们的系统高度兼容，可直接合并或交叉引用：

| 资源 | 来源 | 接入方式 |
|------|------|---------|
| `viewport-base.css` | frontend-slides | 已有类似实现，增强 print stylesheet 和 `prefers-reduced-motion` |
| `animation-patterns.md` 的 effect-to-feeling 表 | frontend-slides | 合并入 `references/ANIMATIONS.md` |
| 10 个 STYLE_PRESETS 的完整 CSS 变量块 | frontend-slides/STYLE_PRESETS.md | 交叉引用到对应主题的 `tokens.css` |
| 34 个 bold template 的 design.md 格式 | frontend-slides/bold-template-pack | 作为我们主题 `design.md` 的模板格式 |
| `deck-stage.js` 的 print 和 noscale 模式 | frontend-slides | 增强我们的渲染管线和 PDF 导出 |
| 反 AI-Slop 设计哲学文本 | frontend-slides/SKILL.md §Design Aesthetics | 直接适配到 SKILL.md 和 CHAPTER-CRAFT.md |

### 2.2 10 个已有对应主题

frontend-slides 的 12 个预设中，10 个在我们项目中已有对等主题：

| frontend-slides Preset | web-video-studio Theme | 对齐度 |
|------------------------|----------------------|--------|
| Bold Signal | `bold-signal` | ✅ 完全对齐 |
| Electric Studio | `electric-studio` | ✅ 完全对齐 |
| Creative Voltage | `creative-voltage` | ✅ 完全对齐 |
| Dark Botanical | `dark-botanical` | ✅ 完全对齐 |
| Neon Cyber | `neon-cyber` | ✅ 完全对齐 |
| Terminal Green | `terminal-green` | ✅ 完全对齐 |
| Notebook Tabs | `warm-keynote` (近似) | ⚠️ 部分对齐 |
| Pastel Geometry | `pastel-dream` | ✅ 对齐 |
| Split Pastel | `split-canvas` | ✅ 对齐 |
| Vintage Editorial | `vintage-editorial` | ✅ 完全对齐 |
| Swiss Modern | `swiss-ikb` / `bauhaus-bold` | ⚠️ 分散在两个主题 |
| Paper & Ink | `newsroom` / `monochrome-print` | ⚠️ 分散在两个主题 |

**行动**：将 frontend-slides 的 CSS 变量块作为对应主题 `design.md` 的「源材料」，增强我们主题文档的深度。

---

## 三、核心升级方案（按优先级排列）

### P0：渐进式知识加载架构 🔴

**现状问题**：SKILL.md 是单体文件，agent 每次加载全部内容，消耗大量 context window。

**方案**：重构为 4 层加载模型。

```
Level 0: SKILL.md (工作流地图, ~100行)
  │ 永远加载：Phase 0-4 总览 + 硬性约束
  │
  ├─ Phase 1 (内容编写) 触发
  │   └─ references/SCRIPT-STYLE.md, OUTLINE-FORMAT.md
  │
  ├─ Phase 2 (主题选择) 触发
  │   ├─ Level 1: themes/selection-index.json (~200行, 23主题元数据)
  │   ├─ Level 2: themes/<id>/preview.md (~30行×3, 仅加载 shortlisted)
  │   └─ Level 3: themes/<id>/design.md (~200行×1, 仅加载选中的)
  │
  ├─ Phase 3 (章节构建) 触发
  │   ├─ references/CHAPTER-CRAFT.md
  │   ├─ references/ANIMATIONS.md
  │   └─ chapter-blueprint/templates/ (14模板)
  │
  └─ Phase 4 (音频/渲染) 触发
      ├─ references/AUDIO.md
      └─ references/RECORDING.md
```

**具体改动**：

1. **新建 `themes/selection-index.json`**（单文件，23 主题 × 8 行 ≈ 200 行）
   ```json
   {
     "themes": [
       {
         "id": "bold-signal",
         "name": "Bold Signal",
         "mood": ["dark", "bold", "hero", "modern"],
         "tone": ["confident", "direct", "punchy"],
         "formality": "medium-low",
         "density": "low",
         "scheme": "dark",
         "bestFor": ["pitch deck", "产品发布", "营销片头"],
         "avoidFor": ["学术报告", "长文阅读型视频"],
         "previewMd": "themes/bold-signal/preview.md",
         "designMd": "themes/bold-signal/design.md"
       }
     ]
   }
   ```

2. **每个主题新增 `preview.md`**（~30 行，用于生成视觉预览）
   - 精简的调色板（4-5 个关键色）
   - 字体角色（display/body/mono）
   - 1-2 个签名元素
   - Preview 生成规则（不渲染模板名、不渲染内部标签）

3. **每个主题新增 `design.md`**（~200 行，品牌手册级设计文档）
   - 格式参考 frontend-slides 的 Signal `design.md`
   - 包含：设计哲学、颜色别名体系、排版角色分离规则、组件词汇表、Do's/Don'ts、CJK 适配

4. **精简 SKILL.md**：从当前的 ~400 行精简为 ~100 行的工作流地图，用 `[file](path)` 引用替代内联内容。

### P1：主题元数据升级为 7 维语义空间 🔴

**现状**：`theme.json` 只有 `mood`（字符串数组）和 `bestFor`（字符串数组）。

**升级后**：

```jsonc
{
  "id": "bold-signal",
  "name": "Bold Signal",
  "nameZh": "焦点信号",
  
  // === 7 维语义空间 ===
  "mood": ["dark", "bold", "hero", "modern", "signal"],
  // 情绪基调：观众看完后的感受
  
  "tone": ["confident", "direct", "punchy", "graphic"],
  // 语气：设计「说话」的方式
  
  "formality": "medium-low",
  // 正式度：high / medium-high / medium / medium-low / low
  // 影响：字体选择范围、装饰元素密度、动画风格
  
  "density": "low",
  // 信息密度：low / medium / high
  // 影响：每步文字量、留白比例、字号层级
  
  "scheme": "dark",
  // 明暗：dark / light / mixed
  
  "bestFor": [
    "pitch deck / 投资人路演",
    "产品发布 / 新品宣传", 
    "大字宣言型章节"
  ],
  // 最佳场景：正向匹配信号
  
  "avoidFor": [
    "学术论文讲解",
    "长文阅读型视频",
    "需要安静克制力的场合"
  ],
  // 应避免的场景：反向过滤信号 ← NEW
  // 这是 frontend-slides 的核心创新之一
  
  // === 动效配置 ===
  "motionProfile": {
    "defaultEasing": "var(--motion-gentle)",
    "duration": "slow",
    "description": "Slow, dramatic reveals — 适合大字宣言型内容"
  },
  
  // === 密度配置 ===
  "densityProfile": {
    "wordsPerStep": "8-15",
    "preferredLayouts": ["hero-title", "quote-card", "side-by-side"],
    "avoidLayouts": ["comparison-table", "grid-gallery"]
  }
}
```

**关键新增字段**：
- `tone`：设计语气（之前隐含在 mood 中，现在独立）
- `formality`：正式度等级（影响字体/装饰/动画风格选择）
- `density`：信息密度（影响每步内容和布局选择）
- `avoidFor`：反向信号（**frontend-slides 的核心创新**）
- `densityProfile`：密度下的布局偏好

### P2：视觉风格发现 🔴

**现状**：用户在 23 个主题的文字列表中选一个。

**方案**：生成 3 个「风格预览章节」让用户做视觉选择。

```
用户输入文章/口播稿
        │
        ▼
Phase 1: 内容分析 → 识别 mood / occasion / audience
        │
        ▼
Phase 2: 风格发现 (新增)
  ├─ 读取 selection-index.json，按 mood → tone → formality 匹配
  ├─ 从 23 主题中 shortlist 3 个候选项：
  │   - 1 个 safe pick（与内容最匹配的稳妥选择）
  │   - 1 个 bold pick（设计感更强的对比选择）  
  │   - 1 个 wildcard（自定义或出人意料的选择）
  ├─ 读取 3 个 preview.md
  ├─ 生成 3 个 HTML 预览文件（每个 = 标题章节的渲染结果）
  ├─ 自动打开 3 个预览
  └─ 用户选择 → 锁定主题
        │
        ▼
Phase 3: 章节构建（使用选定的主题 design.md）
```

**预览混合规则**（直接借鉴 frontend-slides）：

| 场景 | Safe Pick | Bold Pick | Wildcard |
|------|-----------|-----------|----------|
| 保守/高风险 deck | 极简稳妥（如 monochrome-print） | 高正式度 bold（如 indigo-porcelain） | 另一个克制模板或权威感自定义 |
| 创意/表达性 deck | 可读性好的保留选项 | 一个强风格 bold 模板 | 冒险的、场景专属的自定义设计 |
| 技术/产品 | 干净专业（如 electric-studio） | 一个技术感 bold（如 blueprint） | 与 Safe/Bold 都不同的第三个方向 |

### P3：主题 design.md 深化 🟡

**现状**：`tokens.css` 只有 CSS 变量值和简短注释。

**方案**：为 23 个主题各写一份 `design.md`，格式对齐 frontend-slides 的 Signal design.md。

**优先级**：先为核心 6 个主题写完整版，其余 17 个用轻量版。

**核心 6 主题**（使用频率最高）：
1. `bold-signal` — pitch deck 首选
2. `midnight-press` — 默认主题，电影感
3. `newsroom` — 报刊编辑级
4. `electric-studio` — B2B/企业
5. `neon-cyber` — 科技/赛博
6. `monochrome-print` — 安静极简

**design.md 模板**（对齐 Signal 的 9 段结构）：

```markdown
---
version: 1
name: Bold Signal
description: [一句话设计哲学]
colors: { ... }
color-aliases: { ... }
typography: { display: {...}, h1: {...}, body: {...}, ... }
spacing: { ... }
components: { rule: {...}, card: {...}, chrome: {...}, ... }
---

## Frontend Slides Fixed-Stage Policy
[固定画布策略声明]

## Overview
[设计哲学 2-3 段]

## Colors
### Palette（每个色值 + 用途说明）
### Defaults（默认使用规则）

## Typography  
### Font Family（字体角色分离规则）
### Type Scale（完整字号层级表）
### Signature Treatments（非可选签名处理）
### Typography Principles（排版铁律）

## Layout
### Canvas System
### Padding and Gap Scale
### Key Layout Patterns

## Depth and Elevation
[阴影/层级系统说明]

## Do's and Don'ts
[可执行的设计约束清单]

## CJK & International Content
[中文字体配对 + 排版调整]
```

**为什么每个主题需要 design.md**：

1. **AI 需要「为什么」**：`--accent: #ff5722` 不告诉 agent 这个色该用在哪。design.md 说「橙色只用于焦点色卡和数字，不用于正文」。
2. **反趋同需要约束**：没有 design.md，agent 会趋向于把所有主题用得一样（居中标题 + 卡片 + 圆角）。design.md 的 Do's/Don'ts 是护栏。
3. **设计词汇需要定义**：`rule` 是什么？`chrome` 是什么？`kicker` 是什么？这些概念在 design.md 里定义后，agent 才能正确使用。

### P4：反 AI 趋同设计体系 🟡

**方案**：将 frontend-slides 的反趋同哲学系统化地嵌入我们的工作流。

**4.1 在 SKILL.md 新增 Design Aesthetics 章节**

```markdown
## Design Aesthetics（设计美学）

你倾向于收敛到「分布上的平均值」——即所谓的 AI Slop。
在视频视觉设计中，这意味着：

### ❌ 绝对禁止（DO NOT USE）

**字体**：Inter, Roboto, Arial, system fonts 作为 display 字体
**配色**：紫色渐变 + 白色背景、#6366f1 generic indigo
**布局**：所有内容居中 + 圆角卡片 + 统一阴影
**动效**：所有元素同一时间 fadeIn、无层次、无节奏
**装饰**：无目的玻璃态、无意义的投影

### ✅ 鼓励的方向

**字体**：有个性的、独特的字体选择（Fontshare > Google Fonts）
**配色**：主导色 + 锐利强调色（而非均匀分布）
**动效**：一个精心编排的页面加载序列（staggered reveals）
**背景**：CSS 渐变分层、几何图案、氛围营造
**灵感**：从 IDE 主题、文化美学、印刷设计中汲取
```

**4.2 在 CHAPTER-CRAFT.md 新增 Density Philosophy**

```markdown
## 信息密度模式

| 模式 | 适用场景 | 设计行为 |
|------|---------|---------|
| **低密度 / 讲者主导** | 公开演讲、keynote、产品发布 | 每步 1 个想法、大字、强视觉层级、1-3 个要点 |
| **高密度 / 阅读优先** | 报告、文档、异步观看 | 更多自包含内容、数据图表、4-8 个要点 |

基线限制：禁止滚动、禁止溢出、禁止文字小于舒适阅读尺寸。
超出密度模式 → 拆分为更多步骤，而非缩小塞进去。
```

**4.3 每章完工自检增加「反趋同检查」**

在 CHAPTER-CRAFT.md 的完工自检中增加：
- [ ] 是否有至少 1-2 处动起来的视觉演示？（非纯文字）
- [ ] display 字体是否避免了 Inter/Roboto/Arial？
- [ ] 配色是否避免了紫色渐变 + 白色背景？
- [ ] 动效是否有层次节奏（而非全部同时出现）？

### P5：模板加载优化 🟢

**现状**：23 个主题全量在 `THEMES.md` 中列出。

**方案**：
1. 将 `THEMES.md` 改为主题索引（保留关键信息，精简为 ~150 行）
2. 新增 `selection-index.json` 作为 agent 第一层读取的紧凑元数据
3. `preview.md` 作为第二层（生成视觉预览用）
4. `design.md` 作为第三层（生成完整视频用）

---

## 四、提示词 / 语义升级

### 4.1 主题选择从「文字列表」变为「语义匹配」

**Before**（现状）：
> "请从 23 个主题中选择一个。这是主题列表：[23个主题的文字描述]"

**After**（方案）：
> "根据文章的情绪基调（{mood}）和场景（{occasion}），推荐 3 个主题。为每个生成一个标题章节预览。让用户通过视觉比较来选择。"

Agent 的工作流变为：
1. 读 `selection-index.json`（200行） → 按 mood/tone/formality 匹配
2. 读 3 个 `preview.md`（3×30行） → 理解签名元素
3. 生成 3 个 HTML 预览 → 用户视觉选择
4. 读 1 个 `design.md`（200行） → 完整设计系统

**Context 消耗**：200 + 90 + 200 = ~490 行（vs 现状全量加载 23 个主题 = ~600+ 行描述 + CSS tokens）

### 4.2 设计指令从「模糊建议」变为「可执行约束」

**Before**（现状 CHAPTER-CRAFT.md）：
> "配色、字体、节奏都让人放松"

**After**（方案，借鉴 design.md 的 Do's/Don'ts 写法）：
> ```
> 这个主题的设计铁律：
> - 强调色（accent）只出现在：分割线、斜体强调、数字。绝不出现在正文。
> - 正文色 ≠ 纯白，始终用暖白（text-warm）。
> - 分隔只用 1px 发丝线，禁止阴影和圆角卡片。
> - 等宽字体只用于元数据（标签、页码），禁止用于标题或正文。
> ```

### 4.3 新增「密度对话」

借鉴 frontend-slides Phase 1 的 density question：

在 Phase 1 内容发现中，增加一个问题：
> **Q: 密度模式？**
> - 低密度 / 讲者主导 — 大字、少词、电影感、适合录屏口播
> - 高密度 / 阅读优先 — 更多数据、图表、自包含章节、适合异步观看

这个选择影响后续所有设计决策（每步字数、字号层级、布局选择、动画节奏）。

---

## 五、实施路线图

### 第 1 批（本周，P0 核心架构）

| 任务 | 产出 | 工时 |
|------|------|------|
| 新建 `selection-index.json` | 23 主题 × 7 维元数据 | 2h |
| 为核心 6 主题写 `preview.md` | 6 × ~30 行 | 1.5h |
| 为核心 6 主题写 `design.md` | 6 × ~200 行 | 4h |
| 精简 SKILL.md 为工作流地图 | ~100 行 | 1h |
| 新增 Design Aesthetics 章节 | 反趋同清单 | 0.5h |

### 第 2 批（下周，P1 视觉发现）

| 任务 | 产出 | 工时 |
|------|------|------|
| 实现「生成 3 个风格预览」工作流 | Phase 2 改造 | 3h |
| 更新 `theme.json` schema | 增加 tone/formality/density/avoidFor | 0.5h |
| 更新 CHAPTER-CRAFT.md | 增加密度哲学 + 反趋同自检 | 1h |

### 第 3 批（后续，P2 深度化）

| 任务 | 产出 | 工时 |
|------|------|------|
| 为剩余 17 主题写 `preview.md` | 17 × ~30 行 | 3h |
| 为剩余 17 主题写 `design.md`（轻量版） | 17 × ~80 行 | 4h |
| 交叉引用 frontend-slides CSS 变量 | 增强 tokens.css | 2h |

---

## 六、关键设计决策记录

### 决策 1：为什么不在 theme.json 里直接嵌入完整 design.md？

**选择**：保持 `theme.json` 作为轻量元数据入口，`design.md` 作为独立文件。

**理由**：前端 slides 的三级加载模型（index → preview → full doc）的核心前提是：**agent 在第一层只看到紧凑的元数据**。如果 theme.json 包含完整设计文档，就失去了分级加载的意义。

### 决策 2：preview.md 包含什么 vs 不包含什么？

**包含**：调色板（4-5 色）、字体角色（display/body/mono）、1-2 个签名元素、preview 生成规则。

**不包含**：完整颜色别名体系、排版层级表、组件词汇表、Do's/Don'ts —— 这些属于 design.md。

**理由**：preview.md 的目标是让 agent 生成**一个标题章节的预览**，而不是整个视频。30 行的信息密度刚好够用。

### 决策 3：为什么需要 avoidFor 字段？

这是 frontend-slides 最被低估的创新。**正向匹配（bestFor）只能找到「适合的」，反向过滤（avoidFor）才能防止「灾难性的」**。

例如：`neon-cyber` 适合科技产品发布，但如果用户要做「学术论文讲解」，赛博朋克霓虹风格会完全破坏内容的可信度。bestFor 不会明确说不适合学术，但 avoidFor 会。

### 决策 4：design.md 应该多详细？

参考 frontend-slides 的 Signal design.md（529 行）的粒度：
- 每个颜色有**角色说明**（不是「蓝色」，而是「深编辑蓝，暖于午夜，冷于靛蓝。权威而不侵略」）
- 每个排版层级有**用途约束**（不是「大标题 5.2vw」，而是「章节标题或单句声明，绝不用作正文」）
- 组件有**精确的 CSS 规格**（36px × 1px solid gold short rule）
- Do's/Don'ts 是**可验证的**（不是「做好看一点」，而是「强调色只能出现在分割线、斜体强调、数字。绝不用作背景填充。」）

---

## 七、预期收益

| 指标 | 现状 | 目标 |
|------|------|------|
| SKILL.md context 消耗 | ~400 行全量 | ~100 行 + 按需加载 |
| 主题选择准确度 | 用户从 23 个文字中选 | 3 个视觉预览中选 |
| 主题元数据维度 | 2 维 | 7 维 |
| 设计约束可执行性 | 模糊建议 | 可验证约束 |
| 视频风格多样性 | AI 趋同风险 | 显式反趋同护栏 |
| 新增主题成本 | 写 theme.json + tokens.css | + preview.md + design.md |
| CJK 设计覆盖 | 中文字体 fallback | 完整 CJK 排版规则 |
