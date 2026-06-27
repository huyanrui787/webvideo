---
name: "Web Video Studio"
description: "知识类短视频创作者的 AI 生产工具 — 极简、克制、不被察觉的设计"
colors:
  primary: "#d97706"
  primary-hover: "#b45309"
  ink: "#0a0a0c"
  ink-soft: "#1a1a1d"
  paper: "#f7f7f8"
  paper-soft: "#efeff1"
  surface-dim: "#0f0f11"
  surface: "#171719"
  surface-bright: "#1e1e20"
  tile: "#ffffff"
  border: "rgba(255,255,255,0.07)"
  border-strong: "rgba(255,255,255,0.12)"
  text-primary: "rgba(255,255,255,0.92)"
  text-secondary: "rgba(255,255,255,0.55)"
  text-tertiary: "rgba(255,255,255,0.35)"
  text-quaternary: "rgba(255,255,255,0.20)"
  text-disabled: "rgba(255,255,255,0.12)"
  overlay: "rgba(0,0,0,0.70)"
  green: "#4ade80"
  amber: "#fbbf24"
  red: "#f87171"
  blue: "#60a5fa"
typography:
  display:
    fontFamily: "'Source Serif 4', 'Noto Serif SC', Georgia, serif"
    fontSize: "clamp(2.25rem, 6vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Source Serif 4', 'Noto Serif SC', Georgia, serif"
    fontSize: "clamp(1.5rem, 4vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Arial, Helvetica, 'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Arial, Helvetica, 'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Arial, Helvetica, 'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.02em"
  mono:
    fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', monospace"
    fontSize: "0.8em"
    fontWeight: 400
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
  "3xl": "48px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.tile}"
    rounded: "{rounded.lg}"
    padding: "8px 20px"
  button-primary-hover:
    backgroundColor: "{colors.ink-soft}"
  button-primary-active:
    backgroundColor: "{colors.ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-ghost-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
  button-landing:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "14px 40px"
  button-landing-hover:
    backgroundColor: "{colors.primary-hover}"
  input:
    backgroundColor: "rgba(255,255,255,0.04)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.tile}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "20px"
  card-landing:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "24px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
  nav-item-active:
    backgroundColor: "rgba(99,102,241,0.15)"
    textColor: "{colors.text-primary}"
  nav-item-hover:
    backgroundColor: "{colors.surface-bright}"
    textColor: "{colors.text-primary}"
  badge:
    backgroundColor: "rgba(99,102,241,0.15)"
    textColor: "#818cf8"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: Web Video Studio

## 1. Overview

**Creative North Star: "白描画室"**

Web Video Studio 的设计语言像一间白描画室——没有多余的颜色，没有装饰性的炫技。黑白灰的精确层级构筑空间，排版承载信息节奏，颜色只在传递功能信号时出现。每一像素都有存在的理由。

这不是"极简主义"作为风格标签，而是作为工作伦理：工具隐退，让创作者的内容占据视觉焦点。安静，但有明确的美学立场。用间距和字重说话，而非颜色和动画。

系统明确拒绝 AI 生成式设计的通病：没有渐变文字、没有紫蓝光晕、没有毛玻璃卡片、没有Inter字体、没有嵌套卡片。如果你看一眼界面后想到"这是 AI 做的"，那就失败了。

**Key Characteristics:**
- 单色基底 + 单一纯色强调（indigo），无渐变
- 衬线标题 + 系统无衬线正文，用排版建立信息层级
- 暗色/亮色双主题，暗色为默认
- 5 级文字透明度阶梯，精确控制信息密度
- 极平的表面层级——阴影仅用于模态框和悬停反馈
- 12px 主圆角，16px 营销卡片圆角

## 2. Colors

**The One Accent Rule.** 系统只有一个强调色：solid indigo（#6366f1）。它出现于导航活动态、功能图标、徽章、和落地页主 CTA 按钮。占比不超过任何屏幕的 5%。它的稀有就是它的力量。

### Primary
- **Indigo** (#6366f1): 唯一的强调色。导航活动态背景（15% 不透明度）、图标、落地页主按钮。hover 时变亮至 #818cf8。暗色模式下用于徽章文字，亮色模式下用于按钮背景。
- **Indigo Soft** (rgba(99,102,241,0.15)): 导航活动态、徽章背景。永远不透明度 15%，不随主题变化。

### Neutral — Dark (default)
- **Ink** (#0a0a0c): 页面基底。最暗层，不可逾越。body background。
- **Ink-Soft** (#1a1a1d): 主按钮 hover 态。
- **Sidebar** (#0f0f12): 侧边栏背景，略亮于基底以区分导航区。
- **Surface Dim** (#0f0f11): 第一层浮起表面（`bg-surface`）。
- **Surface** (#171719): 第二层浮起表面（`bg-surface-2`）。AI 消息气泡、悬停态背景。
- **Surface Bright** (#1e1e20): 第三层浮起表面（`bg-surface-3`）。用户消息气泡、选中态。
- **Modal** (#111114): 模态框、下拉菜单背景。
- **Tile** (#ffffff): 纯白——仅用于暗色主题下的主要按钮文字（`accent-text`）和亮色主题下的模态框背景。不存在于暗色表面。

### Neutral — Light
- **Paper** (#f7f7f8): 亮色主题页面基底。
- **Paper-Soft** (#efeff1): 亮色主题侧边栏。
- 亮色表面层级对应：`rgba(0,0,0,0.02)` → `rgba(0,0,0,0.04)` → `rgba(0,0,0,0.06)`。比暗色更紧密，因为亮色下人眼对细微差异更敏感。

### Text (5-tier opacity ramp)
| Tier | Dark | Light | Role |
|------|------|-------|------|
| t1 | rgba(255,255,255,0.92) | rgba(0,0,0,0.88) | 正文、标题、主要信息 |
| t2 | rgba(255,255,255,0.55) | rgba(0,0,0,0.55) | 辅助文字、描述、次要导航 |
| t3 | rgba(255,255,255,0.35) | rgba(0,0,0,0.38) | 占位符、时间戳、元数据 |
| t4 | rgba(255,255,255,0.20) | rgba(0,0,0,0.22) | 禁用态、装饰性文字 |
| muted | rgba(255,255,255,0.12) | rgba(0,0,0,0.12) | 分割线、极淡背景文字 |

**The Four-and-a-Half Rule.** t1 到 muted 之间有 4 层有意义的信息层级 + 1 层几乎消失的底噪。不要跳过层级（比如从 t1 直接跳到 t3），这会让信息架构变平。

### Status
- **Green** (#4ade80): 完成、成功、已发布。用于 checklist 勾选、完成态文字。
- **Amber** (#fbbf24): 警告、待审核、需要关注。用于 warning 态按钮和标签。
- **Red** (#f87171): 错误、危险、删除。hover 时加深背景至 rgba(248,113,113,0.08)。
- **Blue** (#60a5fa): 信息、进行中、AI 流式输出指示点。

### Named Rules
**The Zero Gradient Rule.** 系统禁用 CSS gradient。按钮、背景、文字、阴影——全部纯色。这是与「AI 味」切割的最强制约。落地页 hero 中的 `bg-gradient-to-r from-indigo-500 to-violet-600` 替换为 `bg-indigo`。`bg-clip-text text-transparent` 渐变文字替换为 solid `text-t1`。

**The No Glow Rule.** 禁用 `box-shadow` 带颜色扩散（如 `shadow-indigo-500/30`）。阴影只能是中性黑/白。CTA 按钮的 `shadow-xl shadow-indigo-500/30` 替换为 `shadow-sm`。

## 3. Typography

**Display Font:** Source Serif 4 (with Noto Serif SC for Chinese, Georgia fallback)
**Body Font:** Arial → Helvetica → PingFang SC → Microsoft YaHei → sans-serif
**Mono Font:** SF Mono → Cascadia Code → Fira Code → monospace

**Character:** 衬线标题带来「白描」的人文质感——克制、精确、有呼吸。系统无衬线正文保持中性高效，不做风格声明。两者之间的张力就是个性：标题有态度，正文完全透明。

### Hierarchy
- **Display** (600, clamp(2.25rem, 6vw, 4.5rem), line-height 1.1): 落地页 hero 标题。每页最多出现一次。letter-spacing: -0.02em（不超过 -0.04em 的地板）。
- **Headline** (600, clamp(1.5rem, 4vw, 2.25rem), line-height 1.2): 区域标题（H2）。letter-spacing: -0.01em。
- **Title** (600, 1.125rem, line-height 1.3): 卡片标题、模态框标题、面板头。无负 letter-spacing。
- **Body** (400, 0.875rem, line-height 1.6): 正文、描述、聊天消息。最大行长 65-75ch。
- **Label** (500, 0.75rem, letter-spacing 0.02em): 按钮文字、标签、导航项。全部小写或首字母大写，不禁用全大写。
- **Mono** (400, 0.8em): 代码块、文件名、技术标识。仅用于技术内容，不用于 UI 标签。

### Named Rules
**The Two-Font Rule.** 每个页面最多两种字体（衬线标题 + 无衬线正文）。不在同一页面混用两种无衬线、或两种衬线。Mono 作为功能字体不计数。

**The Display Floor.** 标题 letter-spacing 不低于 -0.04em。超过这个值字母粘连，读起来局促而非「设计感」。

## 4. Elevation

系统是**扁平的**。表面层级通过背景色亮度区分（`surface-dim` → `surface` → `surface-bright`），而非阴影。这就是暗色/亮色双主题中 3 层 `bg-surface` 的用途。

阴影仅用于三种情况：
- 模态框（`shadow-2xl`）——与页面其余部分的最大分离
- 卡片悬停（`shadow-sm` → `hover:shadow-md`）——微妙的抬升反馈
- 下拉菜单（`0 16px 48px rgba(0,0,0,0.5)`）——确保在复杂布局上方可读

### Shadow Vocabulary
- **ambient-xs** (`box-shadow: 0 1px 2px rgba(0,0,0,0.04)`): 卡片默认态。弱到几乎看不见。
- **ambient-sm** (`box-shadow: 0 2px 8px rgba(0,0,0,0.08)`): 卡片悬停态。
- **elevated** (`box-shadow: 0 16px 48px rgba(0,0,0,0.5)`): 下拉菜单。
- **overlay** (`box-shadow: 0 24px 80px rgba(0,0,0,0.8)`): 模态框。

### Named Rules
**The Flat-by-Default Rule.** 表面在静止状态下是平的。阴影仅作为悬停或浮层状态的响应出现。永远不用阴影做装饰。

## 5. Components

### Buttons

- **Shape:** 12px radius（应用内按钮），16px radius（落地页主 CTA）。按压态 `scale(0.95)`。
- **Primary (app):** 纯黑/纯白背景（`--text`），反色文字（`--bg-base`）。`font-weight: 500`，`padding: 8px 20px`。无阴影。Hover: `opacity: 0.9`。
- **Ghost:** 透明背景，`text-t2` 文字色。Hover: `bg-surface-2` + `text-t1`。
- **Primary (landing):** `bg-indigo` (#6366f1) 纯色，白色文字。`padding: 14px 40px`。Hover: `bg-indigo-400` (#818cf8)。**无 glow shadow。**
- **Danger:** 红色文字 `#f87171`，透明背景，红色边框 1px (25% opacity)。Hover: 红色背景 8% opacity。
- **Disabled:** `opacity: 0.4`，`cursor: not-allowed`。

### Chips / Badges
- **Style:** `border-radius: 9999px`（全圆角），`padding: 2px 10px`，`font-size: 0.75rem`。
- **Accent:** `bg-indigo/15` + `text-indigo-400`。
- **Neutral:** `bg-surface-3` + `text-t2`。
- **Status:** 绿色/琥珀色/红色文字，对应背景 15% opacity。

### Cards
- **App cards (project-card):** 12px radius，`bg-modal`，`border: 1px solid --border`，`padding: 20px`。`shadow-sm` → hover `shadow-md`。
- **Landing cards:** 16px radius，`bg-surface`，`border: 1px solid --border`，`padding: 24px`。无默认阴影。
- **Message bubbles:** 16px radius，上角收窄至 4px 以指示说话者方向。用户气泡 `bg-surface-3`，AI 气泡 `bg-surface-2`。

### Inputs / Fields
- **Style:** 12px radius，`bg-input-bg`（4% white overlay），`border: 1px solid --input-border`，`padding: 8px 12px`。
- **Focus:** 边框颜色变为 `--accent`，无 ring。聊天输入框例外：`focus:ring-2 focus:ring-input-focus`。
- **Placeholder:** `--input-placeholder` 颜色（22%/28% opacity）。必须通过 4.5:1 对比度。

### Navigation
- **Sidebar:** 224px 固定宽度，`bg-sidebar` 区分于页面基底。右边缘 `1px solid --border`。
- **Nav items:** 12px radius，`padding: 10px 12px`，`font-size: 14px`。默认 `text-t2`。Hover: `bg-surface-2` + `text-t1`。
- **Active:** `bg-indigo/15` + `text-t1` + `font-weight: 500`。右侧 `1px × 16px` indigo-400 竖条指示器。
- **Top nav (landing):** 滚动前透明，滚动后 `bg-base/95` + `backdrop-blur-xl` + 底部边框。高 64px。

### Dialog / Modal
- **Overlay:** `rgba(0,0,0,0.7)` 暗色 / `rgba(0,0,0,0.4)` 亮色。
- **Sheet:** 16px radius，`bg-modal`，`padding: 24px`，`shadow-2xl`。最大宽度 384px（`max-w-sm`）。

## 6. Do's and Don'ts

### Do:
- **Do** 使用 5 级文字透明度阶梯（t1→muted）建立信息层级。每一级有明确的语义角色。
- **Do** 使用 12px 作为应用内组件的主圆角，16px 用于落地页卡片。保持一致性。
- **Do** 用表面背景色（`surface-dim` / `surface` / `surface-bright`）区分层级，而非阴影。
- **Do** 保持唯一的强调色 indigo 占比低于任何屏幕的 5%。它的力量来自稀有。
- **Do** 使用 `text-wrap: balance` 在 h1-h3 上，`text-wrap: pretty` 在长文本上。
- **Do** 在暗色主题下正文行宽控制在 65-75ch。
- **Do** 每个动画提供 `prefers-reduced-motion` 降级方案。
- **Do** 落地页标题使用 Source Serif，让它说话。正文使用系统无衬线，让它消失。

### Don't:
- **Don't** 使用 CSS gradient。任何地方。按钮、背景、文字、阴影——全纯色。这是与「AI 味」切割的最强制约。
- **Don't** 使用 `background-clip: text` 渐变文字。Hero 标题用 solid `text-t1`。
- **Don't** 使用带颜色的 box-shadow glow（`shadow-indigo-500/30`）。阴影只能是中性黑。
- **Don't** 使用 Inter、Roboto、Geist——任何「AI 默认字体」。正文用系统字体栈，标题用 Source Serif。
- **Don't** 嵌套卡片。扁平布局优于卡片套卡片。
- **Don't** 使用毛玻璃（`backdrop-blur` + 半透明背景）作为装饰。仅导航栏使用 `backdrop-blur`，且只为功能（滚动后的可读性），不为风格。
- **Don't** 灰色文字放在有色背景上。用背景色同色相的深色代替。
- **Don't** 使用大于 16px 的卡片圆角。24px+ 的圆角是 AI 味标志。
- **Don't** 使用 `border-left` 大于 1px 的彩色侧边条做装饰。
- **Don't** 在每段上方放全大写小字 eyebrow（"ABOUT" / "FEATURES" / "PRICING"）。
- **Don't** 用数字编号（01 / 02 / 03）装饰每个区域标题。除非内容确实是序列。
