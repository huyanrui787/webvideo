---
name: web-video-presentation
description: 把文章或口播稿做成 16:9 网页视频演示。流程：文章 → 口播稿 + outline → 网页开发 → 可选音频合成。每次点击推进一个节拍，每步独占整屏。
---

# Web Video Presentation

把一篇文章或口播稿，一步步做成可录屏的"伪装成视频的网页"，可选合成
口播音频。产出物 = Vite + React + TS 项目 + 按章节切分的音频。

## 适用场景

- "我有口播稿 / 一篇文章，帮我做成视频" —— 口播驱动的内容
- 想做 "动态 PPT"
- 16:9 横屏录屏，大字、留白、每屏都要有动效
- 教学 / 产品演示 / keynote 想要电影感
- B 站 / YouTube /抖音视频内容

本 Skill **以方法论 + 协作流程为核心**。脚手架模板提供 token 和原语，
但每个美学决策（配色、字型、动效气质）都应该针对你的主题重新设计 ——
不要照搬。

---

## 设计美学（Design Aesthetics）

你倾向于收敛到「数据分布的平均值」——即所谓的 **AI Slop**。
在视频视觉设计中，这意味着千篇一律的紫粉渐变、Inter/Roboto 字体、
圆角卡片 + 统一阴影的布局。**这些必须主动避免。**

### ❌ 绝对禁止（DO NOT USE）

**字体**：Inter、Roboto、Arial、system fonts 作为 display 字体。
Space Grotesk 虽好，但在 AI 生成内容中已被过度使用，同样避免。

**配色**：紫色渐变 + 白色背景（`#6366f1` generic indigo 系）。
均匀分布的多色盘（没有主导色，每个颜色权重一样）。

**布局**：所有内容居中 + 圆角卡片 + 统一阴影。千篇一律的 hero section。

**动效**：所有元素同一时间 fadeIn（无层次、无节奏）。
无目的的 continuous floating/bobbing。

**装饰**：无目的玻璃态（gratuitous glassmorphism）。
假 SVG 插画（AI 生成的 generic blob shapes）。emoji 作为视觉元素。

### ✅ 鼓励的方向

**字体**：有个性的、独特的字体选择。Fontshare > Google Fonts。
中文优先 Noto Serif SC / Noto Sans SC，按主题气质搭配。

**配色**：**主导色 + 锐利强调色**（而非均匀分布）。
强调色只出现在关键位置：分割线、数字、斜体强调、kicker 标签。
从 IDE 主题、文化美学、印刷设计中汲取灵感。

**动效**：**一个精心编排的页面加载序列**（staggered reveals）
胜过散落的微交互。重点投入标题章的开场动画。

**背景**：CSS 渐变分层、几何图案、噪点纹理营造氛围和深度。
不要默认纯色背景。

**布局**：不对称、网格打破、留白呼吸。
章节之间变换布局节奏（居中 → 左对齐 → 双列 → 全幅）。

### 密度模式（Density Modes）

开工前先确认视频是讲者主导还是阅读优先：

| 模式 | 适用 | 设计行为 |
|------|------|---------|
| **低密度 / 讲者主导** | 公开演讲、keynote、产品发布 | 每步 1 个想法、大字、强视觉层级、1-3 个要点、更多章节、更电影感 |
| **高密度 / 阅读优先** | 报告、文档、异步观看 | 更多自包含内容、数据图表、结构化网格、4-8 个要点、更紧凑 |

基线限制：**禁止滚动、禁止溢出、禁止文字小于舒适阅读尺寸**。
超出密度模式 → 拆分为更多步骤，而非缩小字体塞进去。

---

## 渐进式文件加载指南

本 Skill 采用**按需加载**架构。Agent 只读当前阶段需要的文件，
不要一次性加载全部。

| 阶段 | 加载文件 | 大小 |
|------|---------|------|
| **Phase 0 总览** | SKILL.md（本文件） | ~200 行 |
| **Phase 1 内容编写** | `references/SCRIPT-STYLE.md` + `OUTLINE-FORMAT.md` | ~100+80 行 |
| **Checkpoint Plan 选主题** | **L1**: `themes/selection-index.json`（23 主题 × 8 行元数据） | ~200 行 |
| | **L2**: `themes/<id>/preview.md`（仅 shortlisted 3 个 × ~30 行） | ~90 行 |
| | **L3**: `themes/<id>/design.md`（仅用户选中的 1 个 × ~200 行） | ~200 行 |
| **Phase 2.4 实现单章** | `references/CHAPTER-CRAFT.md` + 当前 theme 的 `design.md` | 核心约束 |
| **Phase 3 音频** | `references/AUDIO.md` | 按需 |
| **Phase 4 录屏** | `references/RECORDING.md` | 按需 |

> **铁律**：不要一次性读取全部 `themes/*/design.md`（23×200=4600 行会撑爆 context）。
> 先读 `selection-index.json` 做语义匹配 → shortlist 3 个 → 读 preview.md → 
> 用户选定后只读 1 个 design.md。主题系统文档参考 `references/THEMES.md`。

---

## 工作流总览

```
Phase 1   内容编写
   1.1  识别用户输入
   1.2  一次产出 script.md + outline.md
        （口播稿 + 开发计划）
   ▼
[Checkpoint Plan]      ← 必须停。一次对齐 5 件事：
                         稿子 / outline / 主题 / 素材 / 开发模式
   ▼
Phase 2   网页开发
   2.1  脚手架（按选定主题）
   2.2  第 1 章 = 主线程 + 完整版本（强制 anchor）
        ▼
        [硬节点] 用户验收第 1 章 ← 不可跳过
        ▼
   2.3  第 2~N 章（按选定模式：A 逐章 / B 顺序 / C 并行）
   ▼
[Checkpoint Audio]     ← 必须停。是否合成音频
   ▼
Phase 3   音频合成（可选）
   ▼
Phase 4   录屏 + 后期
```

工作目录约定（agent 在用户当前目录下创建 / 编辑）：

```
my-video/
├── article.md          # 用户给原文时必有 —— 不删！开发阶段画面信息源
├── script.md           # 必有：保持原文语言的平台化口播稿（决定节拍）
├── outline.md          # 必有：开发计划（章节切分 + 每步内容 + 信息池）
└── presentation/       # 脚手架产出的 Vite + React + TS 项目
    ├── src/chapters/<NN>-<id>/
    │   ├── <Chapter>.tsx     # 视觉实现
    │   ├── <Chapter>.css
    │   └── narrations.ts     # ★ step 数 + 口播文本的唯一真相源
    ├── scripts/
    │   ├── extract-narrations.ts   # 扫所有 narrations.ts → audio-segments.json
    │   ├── synthesize-audio.sh     # provider-agnostic runner（循环 segments）
    │   └── tts-providers/          # 每 provider 一个 .sh（内置 2 个）
    │       ├── README.md           # 三函数契约 + 5 段现成代码片段（11labs / edge-tts / say / azure / gcloud）
    │       ├── minimax.sh          # 默认 provider，用 mmx-cli
    │       └── openai.sh           # 内置 OpenAI TTS（curl + OPENAI_API_KEY）
    ├── audio-segments.json         # extract 产出（合成前 review）
    └── public/audio/<id>/<N>.mp3   # 可选：合成的音频
```

> **关键**：`narrations.ts` 是 step 数和音频合成的**唯一真相源**。
> 章节 `.tsx` 里的 `if (step === N)` 出现的最大 N + 1 必须等于
> `narrations.length`。这保证 5 处地方（script / outline / 章节代码 /
> chapters.ts / 音频文件）永远不会漂。

---

## 硬性自检协议（贯穿整个 Skill）

下面三个产出，每一个**完成后必须走自检 → 修复 → 再汇报 / 推进**：

| 产出 | 自检清单出处 |
|---|---|
| `script.md` | [`SCRIPT-STYLE.md`](references/SCRIPT-STYLE.md) 三层自检（形式 / 风骨 / 念出来） |
| `outline.md` | [`OUTLINE-FORMAT.md`](references/OUTLINE-FORMAT.md) 自检 |
| 单章实现完成 | [`CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md) 完工自检 |

**执行方式**（按能力降级，**优先用更隔离的方式**）：

1. **Agent Teams（最优）**：开一个独立的 reviewer agent，给它"产出文件
   路径 + 对应清单 + 关键上下文"，让它逐项核查并**严格汇报结论**
   （哪几条 pass / 哪几条 fail + 证据 + 改写建议）。
2. **subAgent（次优）**：没有 Teams 能力但能开 subagent 就用 subagent
   走同样流程。
3. **自检（兜底）**：当前 agent 都没有上述能力，就自己**严格逐项**
   核查 —— 不允许目测一遍就放行。

**铁律**：拿到结论后**先按 fail 项把产出改完**，再向用户汇报"做完了
+ 自检结论 + 改了什么"。**直接拿原始结论汇报但不修复 = 违规**。

---

## 各阶段文件读取指南

不同阶段读不同的文件。**长会话里 agent 容易遗忘原则**，特别是
Phase 2.4 的"实现单章"会重复 N 次 —— 每次都要回看核心约束。

| 阶段 | 必读（每次都看） | 一次性看完 / 按需查 |
|---|---|---|
| Phase 1.1-1.2 内容编写 | `references/SCRIPT-STYLE.md` + `references/OUTLINE-FORMAT.md` + `article.md`（用户原文，如有） | —— |
| **Checkpoint Plan 选主题** | —— | `themes/*/theme.json`（动态读全部，列清单 + `bestFor` 推荐 + `descriptionZh`）；`references/THEMES.md`（用户想了解主题系统时） |
| Phase 2.1 脚手架 | —— | SKILL.md 本节看一次 |
| **Phase 2.4 实现单章（×N 次，被 2.2 / 2.3 调用）** | **`references/CHAPTER-CRAFT.md`** 单一入口 —— Part 0 十条原则 / Part 1 开工 5 问 / Part 2 关系→动作决策树 / Part 3 视觉工具箱 / Part 4 时长参考 / Part 5 反 AI 味反模式 / Part 6 代码硬规则（**含 narrations.ts 强制约束**）/ Part 7 完工自检 / Part 8 反馈速查 + 当前主题的 `themes/<id>/theme.json` + 当前章节的 outline.md 段落 + **`article.md` 本章对应段落** + 素材清单 | `references/EXAMPLES/`（结构示意，不是抄袭模板）；`references/THEMES.md` 完整 token 契约 |
| Phase 3 音频合成 | `references/AUDIO.md`（含 narrations.ts → segments.json → 任意 provider 流程，内置 minimax + openai） | `templates/scripts/tts-providers/README.md`（换 provider / 自带 TTS 时） |
| Phase 4 录屏 + 后期 | `references/RECORDING.md`（含 `?auto=1` 自动录屏） | —— |
| 选 / 造 / 切主题 | —— | `references/THEMES.md` |

> **写章节时只读一份 `CHAPTER-CRAFT.md`**。十条原则 / 开工 self-prompting /
> 决策树 / 反 AI 味反模式 / 完工自检全部并入这一份单一入口。`EXAMPLES/`
> **不是必读** —— 先按内容自由设计，卡壳才翻（按 anchor 翻"形"，不要照搬）。

---

## Phase 1 —— 内容编写（一次产出）

### 1.1 识别用户输入

| 用户给的东西 | 该做的 |
|---|---|
| 原始文章（书面语 / 公众号 / 论文 / 博客） | 一次产出 `script.md` + `outline.md`（1.2），过 Checkpoint Plan |
| 直接的口播稿 / 视频脚本 | 落盘成 `script.md`，一次产出 `outline.md`（1.2 简化版），过 Checkpoint Plan |
| 啥都没有，只说"帮我做个 X 主题的视频" | **反问**：先给一段素材或大纲。Skill 不替用户构思内容 |

### 1.2 一次产出 script.md + outline.md

**两份产出物在一次思考中完成**：

1. **生成 `script.md`**：按 [`references/SCRIPT-STYLE.md`](references/SCRIPT-STYLE.md)
   的规则把 article 转成保持原文语言的平台化口播稿。**保留 `article.md` 不删**——它是
   outline 写信息池和章节实现画面时的细节源（双源原则）。
2. **生成 `outline.md`**：按 [`references/OUTLINE-FORMAT.md`](references/OUTLINE-FORMAT.md)
   规则切章节 + 切 step + 每章首段抽**信息池**。

**outline 的边界**（关键）：

| outline 必须写 | outline 不要写 |
|---|---|
| 章节切分 / 每章 step 数 / 估时 | 具体动画类型（blur clear / wipe / 弹簧） |
| 每步屏幕内容（hero / 数据 / 标语 / 列表项） | CSS 实现手段（filter / SVG / clip-path） |
| 章节级**信息池**：从 article 抽的数字 / 引用 / 案例 / 标签 | 时长数值（不写 ~2.5s / 80~120ms） |
| 步级关系名前缀（"反差对照" / "递进列表" / "金句" 等可选 hint） | 持续微动 / 错峰量等微观节奏 |

> **outline 不写动画的理由**：写死动画 = chapter agent 退化为翻译机；
> 留白让 chapter agent 在每步开工时按 [`CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md)
> 的"内容驱动决策树"自由设计，才有真正的视频感。详见
> [`CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md) Part 0 原则 7。

**落盘后必须先走自检再进 Checkpoint Plan**：按上文「硬性自检协议」分别
对 `script.md` / `outline.md` 执行（优先 Agent Teams → subAgent → 自检），
按结论修复完成后再进入 Checkpoint Plan。

---

## Checkpoint Plan —— 5 件事一次对齐（**硬节点**）

`script.md` + `outline.md` 写完后必须停下来。**用户在这一个节点同时确认
5 件事**。

### agent 此时要做的预备工作

**按渐进式加载模型操作，不要一次性读全部主题文件：**

1. **L1**: 读 `themes/selection-index.json` —— 23 主题的 7 维紧凑元数据
   （mood / tone / formality / density / scheme / bestFor / avoidFor）
2. 根据 `script.md` 的内容类型 / 关键词 / 语气 + 密度模式，
   按 **mood → tone → formality** 三维语义匹配，shortlist **3 个**候选主题：
   - **1 个 safe pick**：与内容最匹配的稳妥选择
   - **1 个 bold pick**：设计感更强的对比选择
   - **1 个 wildcard**：出人意料但合理的方向
3. **L2**: 读这 3 个候选的 `themes/<id>/preview.md`（每个 ~30 行），
   理解签名元素和调色板
4. 扫一遍 `outline.md` 末尾"素材清单"部分

**不要**在此时读取任何 `design.md`（L3 留给 Phase 2 用户选定主题后）。

### 总结模板（骨架，agent 按情况填充）

```
内容计划写完，产出文件：
  📄 article.md     {若用户给原文则保留}
  📄 script.md      {X} 字 / ~{T} 分钟
  📄 outline.md     {N} 章 / {M} 步 + 每章信息池 + 末尾素材清单

章节速览：
  1. <id>     <章节标题>    <S> 步 ~<T>s
  2. ...

接下来一次对齐 5 件事：

  1. 稿子 (script.md) 要不要改？
     可以直接编辑文件，或口头告诉我修改方向。

  2. 开发计划 (outline.md) 要不要改？重点看：
     - 章节切分 / step 数 / 估时是否合理（合理判断：每章 30~60s）
     - 每步屏幕内容是否清晰
     - 每章首段「信息池」是否有足够的 article 细节供画面挂
     - 末尾素材清单是否完整

  3. 选哪个主题？我的推荐（按语义匹配）：
     ★ Safe:  <推荐 1：nameZh (id)> — bestFor 命中；<descriptionZh 摘要>
     ★ Bold:  <推荐 2：nameZh (id)> — 设计对比；<descriptionZh 摘要>
     ★ Wild:  <推荐 3：nameZh (id)> — 出人意料但合理；<descriptionZh 摘要>
     其它可选：<列出剩余主题 nameZh + 一句话>
     
     💡 我可以为这 3 个候选生成「风格预览章节」（标题章），
        让你通过视觉比较来选，而不是看文字描述。
        需要我生成预览吗？也可以让我帮你做新主题。

  4. 真素材怎么准备？粗看本视频要的图：<列粗略清单>
     a) 我从 <现有素材路径> 帮你挑   b) 你自己提供   c) 全部 placeholder

  5. 开发模式选哪个？

     **第 1 章无论哪种模式都必须主线程做完 + 用户验收**（强制 anchor）。
     差异在第 2 章及之后：

     A) 默认 · 逐章确认（推荐）
        每章做完都暂停验收 → 风险可控 / 节奏最稳
     B) 第 1 章后顺序开发（不并行）
        第 2~N 章主线程顺序做完后统一验收 → 速度中 / 适合 agent 不支持并行
     C) 第 1 章后并行开发（subagent）
        第 2~N 章用 subagent 并行 → 最快 / 用户控并行数（一次几章）
        ⚠️ 风格各章会有差异（这是预期，主题禁区兜底）
```

收到反馈后：
- 稿子 / outline 要改：直接编辑文件，编辑完 ping 一次（或口头描述 agent 改）
- **主题必须明确**才进入 Phase 2。用户说"主题你帮我选" → 取你推荐的第 1 个，
  **告诉用户你选了什么、为什么**，给反悔机会
- 模式选定 → 进 Phase 2

---

## Phase 2 —— 网页开发

### 2.1 脚手架

```bash
bash <path-to-web-video-presentation>/scripts/scaffold.sh \
  ./presentation \
  --theme=<用户选的主题 id>

bash <path-to-web-video-presentation>/scripts/scaffold.sh --list-themes
```

> 自定义主题 → 先按 [`references/THEMES.md`](references/THEMES.md)
> "创作新主题"流程做一个 `themes/<my-theme>/`，再 `--theme=<my-theme>`。

**脚手架完成后，L3 加载**：读取 `themes/<id>/design.md`（用户选中的那一个，
~200 行）。这是该主题的完整设计系统文档 —— 颜色角色、排版铁律、组件词汇、
Do's/Don'ts。**只读这一个 design.md，不要读其他主题的。**

脚手架带一个 `01-example` demo。在写第一章真实内容前**删掉**：

```bash
rm -rf presentation/src/chapters/01-example
```

并把 `presentation/src/registry/chapters.ts` 里 `EXAMPLE_CHAPTER`
的 import 和数组项移除。

### 2.2 第 1 章 —— 主线程 + 强制验收

**核心**：第 1 章 = 完整版本一次到位（节奏 + 视觉 + 真素材齐全）。
**没有"骨架版"概念** —— 第一章就要做出**用户能直接验收**的样板。

为什么第 1 章必须主线程：

- 它是 [`CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md) 这套指引在**当前
  主题 + 当前题材**下的第一次落地
- 如果指引有盲区 / 主题颜色 / 字体 token 不够用，第 1 章一定会暴露 ——
  这时候有人类反馈就能修指引 / 调主题，**早改成本最低**
- 后续章节（无论顺序 / 并行）都要参考第 1 章的代码模式，所以第 1 章 =
  当次项目的"风格锚点（不强求章节间一致，但单章自身得有完整说服力）"

**做完第 1 章后必须停下来**等用户验收：

```
第 1 章 <id> 做完了，dev server 在 localhost:5173 运行。

验收重点：
  □ 视觉气质对不对？符合 <theme nameZh> 的预期吗？
  □ 节奏对不对？某些步太快 / 太慢 / 信息太薄？
  □ 内容驱动动画是否到位？还是有几步是无脑入场动画？
  □ 双源原则：屏幕画面有没有"口播没念但 article 能挂"的细节？
  □ 反 AI 味检查：紫粉渐变 / 圆角彩色边框 / 假插画 / emoji 是否有？

问题告诉我，我针对性改。OK 了告诉我"继续"，我按选定模式做第 2 章及之后。
```

### 2.3 第 2~N 章 —— 按选定模式

**所有模式下的共同规则**：每章独立按 [`CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md)
开发。**风格不强求章节间完全一致** —— 主题颜色 / 字体 token 兜底视觉
统一，动画 / 节奏 / 视觉演示由章节自由发挥是设计预期。

#### 模式 A · 默认 · 逐章确认

第 2 章做完 → 暂停验收 → OK → 第 3 章 → 暂停 → ... → 第 N 章。**每章
独立验收**，问题随时改，**风险最低，节奏最稳**。**用户不明确选模式时
默认走这个**。

#### 模式 B · 第 1 章后顺序开发

第 2 章 → 第 3 章 → ... → 第 N 章 **主线程顺序做完，最后统一验收**。
速度中等，适合 agent 不支持并行任务的环境。

#### 模式 C · 第 1 章后并行开发（subagent）

用 subagent 把第 2~N 章并行做完，最大并行数由用户控制（"一次 4 章"
/ "一次 2 章"）。**最快，但风格各章会有差异** —— 这是预期，因为：

1. 每个 subagent 看不到别的 subagent 产出，无法机械对齐
2. 章节代码物理分离（每章一个文件夹 / 自己的 CSS 前缀），不会互相
   破坏
3. 主题 token 兜底视觉统一（颜色 / 字体 / hero 数字 / 卡片 / 分割线
   性格 / 装饰），气质不会跑偏
4. **风格不一致 = 人手写视频的呼吸感**（多 voice / 多视角）

并行 subagent 的 prompt 必须包含：

- 当前章节 outline 段落（含信息池）
- `references/CHAPTER-CRAFT.md` 的路径（**单一必读** —— 视觉演示要求 +
  逐步揭示 + 双源原则 + 反 AI 味 + 代码红线 + 完工自检全部在这一份里）
- 当前主题 `theme.json` 的 `descriptionZh` / `mood` / `bestFor`（参考气质
  即可，动画 / 时长 / 字号 / emoji 由 chapter agent 自由决定）
- **第 1 章代码作为"代码风格"参考**（不是"视觉抄袭对象"）
- 硬规则：每章独立 CSS 前缀（`.cd-` / `.mg-` / `.pm-` / ...）；
  不修改 `chapters.ts`；完工跑 `npx tsc --noEmit`

**重要**：无论选哪种模式，**用户随时可以中途切换模式**。第 2 章 OK
后用户说"剩下的并行" / "剩下的逐章" 都行。

### 2.4 实现单章（每章必走）

详细指引见 [`references/CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md) ——
**单一必读入口**，覆盖：视觉演示要求 / 逐步揭示 / 内容取舍 / 双源原则
/ 视频演示基本审美 / 反 AI 味 / 代码红线 / 完工自检。

**核心要点**（CHAPTER-CRAFT.md 详述）：

- **每章必须有 CSS / SVG / Canvas / JS 视觉演示**，禁纯文字章节
- **逐步揭示**：清单 / 列表必须 1 项 = 1 step，禁一次全展示
- **双源原则**：节奏跟口播稿（顺序不能乱），细节回原文章抽（信息池 +
  本章 article 段落）
- **完工自检逐项过**，不达标回去改 —— 按上文「硬性自检协议」执行
  （优先 Agent Teams → subAgent → 自检），**改完再向用户汇报本章交付**

### 2.5 大改后 bump STORAGE_KEY

改动 `chapters.ts`（增加 / 删除 / 重排章节，或某章 `narrations.ts`
长度变化）后，**bump** `presentation/src/hooks/useStepper.ts` 的
`STORAGE_KEY`（如 `v4` → `v5`），避免持久化游标落到不存在的 step 上。

---

## Checkpoint Audio —— 是否合成音频（**硬节点**）

Phase 2 结束后必须停下来，问用户：

```
网页做完，{N} 章 {M} 步，dev server 在 localhost:5173 跑着。

要不要合成音频做"自动播放录屏"？
  ✓ 合成 → 扫所有章节的 narrations.ts 出 audio-segments.json，
           调 TTS provider 合成每步一个 mp3 到 public/audio/。
           合成完后用 ?auto=1 模式可以一镜到底录屏（音视频天然同步）。
           内置两个 provider：
             • minimax (mmx-cli)    —— 默认，中文音色稳
             • openai  (OPENAI_API_KEY) —— curl-based，多数已有 key
           其它后端 (ElevenLabs / edge-tts 免费 / macOS say 离线 /
           Azure / Google) 见 scripts/tts-providers/README.md 的现成片段。
  ✗ 不合成 → 跳过 Phase 3，直接 Phase 4 用手动录屏 + 后期配音。
```

要合成 → Phase 3。不合成 → 直接 Phase 4。

---

## Phase 3 —— 音频合成（可选）

详细流程见 [`references/AUDIO.md`](references/AUDIO.md)。简版：

```bash
cd presentation
npm run extract-narrations   # 扫所有 narrations.ts → audio-segments.json
# 让用户扫一眼 audio-segments.json 确认文本对
npm run synthesize-audio                       # 默认 minimax provider，增量
# 或用内置 openai (要 OPENAI_API_KEY):
PRESENTATION_TTS=openai npm run synthesize-audio
# 或自定义：写一个 scripts/tts-providers/<name>.sh，见该目录的 README.md
```

合成完告诉用户：输出位置 / 总段数 / 哪些段时长异常（太长 = 该 step 拆
分；太短 = 文案太薄）—— 给最后一次校准节奏的机会。然后进入 Phase 4。

---

## Phase 4 —— 录屏 + 后期

详见 [`references/RECORDING.md`](references/RECORDING.md)。两种路径：

| 场景 | 推荐路径 |
|---|---|
| Phase 3 已合成音频 | **Auto 模式一镜到底**：浏览器开 `localhost:5173/?auto=1` → 按 SPACE → 整片自动播完 → 停录 → 裁头尾即成片，**无需后期对音轨** |
| Phase 3 跳过 | 默认 Manual 模式手动点击推进 → 后期任意剪辑工具配音 |

> agent 在 Phase 3 / Checkpoint Audio 后**主动告诉用户**适合的录屏路径。

---

## 十条原则（一句话清单）

完整展开见 [`references/CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md)
Part 0 —— **写章节时回那里查**，下面只是索引。

| # | 原则 | 一句话 |
|---|---|---|
| 1 | 16:9 固定舞台 | 内容 1920×1080 + transform scale，没有响应式 |
| 2 | 全局 step 计数器 | 章节是 step 的纯函数，无定时器 |
| 3 | 每步独占整屏 | `if (step === N) return <FullScene />` |
| 4 | 口播节拍 = step | 一节拍 = 一 step = 一聚焦想法 |
| 5 | 隐藏的边角控件 | 进度条 / 翻页器默认 opacity 0 |
| 6 | 舞台无 chrome | 没有 header / footer / 页码 / 品牌条 |
| 7 | **内容驱动动画** | 先找内在动作，找不到才入场动画兜底；持续微动慎用 |
| 8 | 多点逐个揭示 | 1 项 = 1 step，禁同步 stagger 上 N 项 |
| 9 | 整片同一主题 | 章节间不翻表面色；**颜色 / 字体走 token**，其它尺度章节自由 |
| 10 | 双源原则 | script 定节拍，**article 定画面密度**（落到信息池） |

---

## 常见用户反馈速查

简化表见 [`references/CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md)
Part 8「常见反馈速查」。**关键**：先定位是哪一层（节奏 / 视觉 / 内容
/ 代码），再改最小切片，**不要重做整章**。

---

## 相关资源

按"何时读"标注，避免一次性全读：

| 文件 | 何时读 | 内容 |
|---|---|---|
| [`references/SCRIPT-STYLE.md`](references/SCRIPT-STYLE.md) | Phase 1.2 必读 | 文章 → 口播稿规则、平台变体 |
| [`references/OUTLINE-FORMAT.md`](references/OUTLINE-FORMAT.md) | Phase 1.2 必读 | outline.md 字段 spec、命名约定、章节切分、信息池 |
| [`references/CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md) | **Phase 2.4 每章单一必读入口** | Part 0 十条原则 / Part 1 开工 5 问 / Part 2 关系→动作决策树 / Part 3 视觉工具箱 / Part 4 时长 / Part 5 反 AI 味反模式 / Part 6 代码硬规则 / Part 7 完工自检 / Part 8 反馈速查 |
| [`references/EXAMPLES/`](references/EXAMPLES/) | **可选** —— 看结构 | 章节结构示意（hook / list-reveal / case-tech-review）；**不是抄袭模板** |
| [`references/THEMES.md`](references/THEMES.md) | 选 / 造 / 切主题时 | 完整 token 契约 + 内置主题清单 + 创作流程 |
| [`references/AUDIO.md`](references/AUDIO.md) | Phase 3 才读 | provider-agnostic 音频合成流程、内置 minimax 用法、换 provider 路径、故障排查 |
| [`templates/scripts/tts-providers/README.md`](templates/scripts/tts-providers/README.md) | 换 / 加 TTS provider 时 | 三函数契约 + 内置 2 个 (minimax / openai) + 5 种现成代码片段（ElevenLabs / edge-tts / macOS say / Azure / Google） |
| [`references/RECORDING.md`](references/RECORDING.md) | Phase 4 才读 | 录屏工具 + 后期合成 |
| [`themes/`](themes) | Checkpoint Plan / Phase 1.2 时翻 | 内置主题（每个含 `theme.json` + `tokens.css`） |
| [`scripts/scaffold.sh`](scripts/scaffold.sh) | Phase 2.1 跑一次 | 一键项目脚手架 |
