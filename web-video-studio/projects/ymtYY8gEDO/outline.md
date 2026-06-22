# Video Outline

> **主题**：`midnight-press`——暗色终端美学 + 代码编辑感，像深夜终端里的一场技术对谈
> **总时长**：约 6 分 30 秒（口播 ~2400 字 ÷ 5 字/秒 ≈ 480s，含停顿）
> **章节数**：8 章 / 50 步
> **节拍弧**：质疑 → 铺垫 → 颠覆 → 证明 → 行动（论证型）

---

## 1. coldopen — 住在终端里的 AI 程序员（[hook] · 7 steps · ~40s）

chapter_type: hero-hook
visual_strategy: 深夜终端窗口从纯黑背景中渐显，红色报错信息滚动制造焦虑感，口播「这个人真来了」时终端清屏，暖橙色 Claude Code 字样从光标位置打出，像黑暗中的第一道光
primitives: [Terminal, TypewriterText, GlowEffect, HeroText]

**信息池**（chapter agent 按需挂角标 / 副标 / mono cue）：
- 产品名：Claude Code —— 来源 article §1
- 开发商：Anthropic —— 来源 article §1
- 启动方式：终端输入 `claude` —— 来源 article §1
- 定位：命令行 AI 编程代理（agent），非插件非网页 —— 来源 article §1
- 能力关键词：读文件、写代码、跑测试、重构模块 —— 来源 article §1

**开发计划**：

- step 1 (~5s) — 纯黑背景，终端窗口从中央渐显，满屏红色报错信息快速滚动
- step 2 (~5s) — 报错定格，光标在底部闪烁，画面外传来一句「能不能来个人直接把活儿干了」
- step 3 (~6s) — 终端清屏，一行大字「Claude Code」从光标位置逐字打出，带暖橙色微光
- step 4 (~6s) — 终端内打出 `$ claude` 回车，系统响应，光标等待输入
- step 5 (~6s) — 终端内逐字打出：「帮我把这个接口的错误处理重写一下」，下方文件列表快速滚动
- step 6 (~6s) — 代码 diff 视图弹出：左侧红色删除行、右侧绿色新增行，快速切换
- step 7 (~6s) — 画面拉远，终端缩小居中，四角暗角压下，底部小字「Anthropic」

口播节选：
> 你有没有过这种经历？深夜赶项目，满屏报错。你一边改 Bug 一边切出去查文档，心里想：能不能来个人直接把活儿干了。现在，这个人真来了。它叫 Claude Code，住在你的终端里。

---

## 2. capabilities — 不止写代码，更是全能管家（[build] · 8 steps · ~63s）

chapter_type: list-reveal
visual_strategy: 四个能力卡片像终端 tab 依次从左侧弹出（stagger 入场），每个 tab 带图标+简短关键词，口播到哪个能力时对应 tab 高亮放大、其余半透明收缩，最后全部展开并列
primitives: [TabBar, IconBadge, StaggerReveal, HighlightPulse]

**信息池**（chapter agent 按需挂角标 / 副标 / mono cue）：
- 能力 1 — Bug 修复：翻组件代码、查状态管理、git 查历史 —— 来源 article §2
- 能力 2 — 代码理解：追踪调用链、自然语言总结认证逻辑 —— 来源 article §2
- 能力 3 — 重构迁移：jQuery→React、JS→TS、自动分析依赖、分步重构 —— 来源 article §2
- 能力 4 — 写测试：自动生成单元测试/集成测试、搭测试框架 —— 来源 article §2
- 能力 5 — Git 操作：提交、创建 PR、写 commit message —— 来源 article §2
- 覆盖率数字：90% —— 来源 article §2

**开发计划**：

- step 1 (~7s) — 画面切换，四个暗色 tab 标签在终端风格窗口顶部排开：「Bug 修复」「代码理解」「重构迁移」「写测试 + Git」
- step 2 (~8s) — 第一个 tab「Bug 修复」高亮弹出，下方显示追踪路径：组件代码 → 状态管理 → git blame，节点依次连接
- step 3 (~7s) — 追踪路径末端出现绿色对勾，底部小字「改完还告诉你原因」
- step 4 (~8s) — 第二个 tab「代码理解」高亮，调用链树状图展开：路由 → 中间件 → 数据库查询，节点依次点亮
- step 5 (~8s) — 树状图收拢，变形为一段自然语言中文总结，像技术文档片段
- step 6 (~9s) — 第三个 tab「重构迁移」高亮，左侧 jQuery 代码块 → 箭头 → 右侧 React 组件，箭头标注「自动分析依赖」
- step 7 (~9s) — 第四个 tab「写测试 + Git」高亮，覆盖率仪表盘 0%→90%，下方 Git 提交记录列表弹出
- step 8 (~7s) — 四个 tab 全部点亮平铺，底部俏皮标注「除了不能帮你喝咖啡」

口播节选：
> 第一，修 Bug。第二，啃老项目——它追踪调用链，用大白话给你总结。第三，重构迁移，jQuery 转 React，下个指令就行。第四，写测试。还有 Git 操作，全都包了。

---

## 3. vs-copilot — 两种不同路线（[turn] · 7 steps · ~57s）

chapter_type: comparison
visual_strategy: 屏幕垂直中分线，左侧 Copilot 以 IDE 内联灰色补全框样式呈现（小、局部、低姿态），右侧 Claude Code 以全屏终端样式呈现（大、全局、主动），口播「坐你旁边的同事」时右半区扩大挤压左半区，底部浮现小字「二者不互斥」
primitives: [SplitScreen, ScaleShift, ComparisonCard, InlineGhostText]

**信息池**（chapter agent 按需挂角标 / 副标 / mono cue）：
- Copilot 定位：IDE 内联补全、"输入法增强"、低延迟、局部工作 —— 来源 article §4
- Claude Code 定位：终端代理、"坐你旁边的同事"、跨文件、全局操作 —— 来源 article §4
- 关键差异 1：IDE vs 终端（终端 = Git + 构建 + 部署的总控台）—— 来源 article §4
- 关键差异 2：代码补全 → 任务自动化的跃进 —— 来源 article §4
- 互补使用：平时 Copilot 加速，大任务切 Claude Code —— 来源 article §4

**开发计划**：

- step 1 (~7s) — 画面中央大字：「这不就是 Copilot 吗？」，随即被一道斜线划掉
- step 2 (~8s) — 屏幕左右分屏。左侧 IDE 编辑器内光标处弹出灰色补全框；右侧全屏终端命令行活跃
- step 3 (~8s) — 左侧标注「输入法增强」在单文件内闪烁；右侧标注「坐你旁边的同事」跨多文件快速跳转
- step 4 (~8s) — 右侧 Claude Code 区域放大挤压左侧。底部标注运行环境对比：「IDE 内」vs「终端内 Git · 构建 · 部署」
- step 5 (~10s) — 右侧终端内依次闪现 Git commit → npm build → 部署脚本，强调终端是总控台
- step 6 (~8s) — 画面恢复平衡，左右之间出现双向箭头，文字「从代码补全 → 到任务自动化」
- step 7 (~8s) — 底部浮现暖色小字：「二者不互斥。平时 Copilot 加速，大任务 Claude Code 搞定」

口播节选：
> Copilot 是输入法增强，在编辑器里猜你下一句。Claude Code 是坐你旁边的同事，口头交代任务，它自己规划、跨文件操作。终端是总控台，Git、构建、部署全在这儿。

---

## 4. how-it-works — 看懂整个项目的大脑（[data] · 7 steps · ~61s）

chapter_type: concept-model
visual_strategy: 感知-行动循环用环形箭头 SVG 呈现，七个节点沿环形排列，口播每推进一个阶段对应节点亮起并连线到下一节点，环形中心显示当前操作的代码文件缩略图，整个环形有微弱的呼吸式光晕
primitives: [CycleDiagram, NodeReveal, ArrowFlow, CodeThumbnail]

**信息池**（chapter agent 按需挂角标 / 副标 / mono cue）：
- 核心技术：Claude 系列模型、超长文本处理、上下文窗口（可装几本厚书）—— 来源 article §3
- 扫描内容：项目结构、配置文件、最近文件改动 —— 来源 article §3
- 工作循环 7 步：接到任务 → 搜索相关文件 → 读取代码 → 分析问题 → 直接编辑文件 → 运行命令验证 → 根据输出调整 —— 来源 article §3
- 交互方式：每步用中文/英文报告，关键操作需用户批准 —— 来源 article §3
- 比喻：「像一个实习生——聪明、干活快，但需要你把关」—— 来源 article §3

**开发计划**：

- step 1 (~8s) — 项目目录树从画面中央展开，文件夹逐层打开，文件列表向下滚动——代表自动扫描
- step 2 (~9s) — 目录树收缩成小图标，飞入一个巨大矩形「上下文窗口」中。窗口内密布代码片段、配置项、改动记录
- step 3 (~8s) — 窗口旁标注「可容纳数本厚书」。一道光束从窗口射出，照亮下方一行提问文字
- step 4 (~9s) — 环形箭头图出现，7 节点均匀分布。节点 1「接到任务」亮起，环中心显示用户指令文字
- step 5 (~10s) — 节点依次点亮：搜索 → 读取 → 分析 → 编辑，环中心代码缩略图同步变化（文件列表→代码高亮→diff视图）
- step 6 (~9s) — 最后两节点点亮：验证 → 调整。环闭合，中心出现绿色 ✓，随即又开始新循环
- step 7 (~8s) — 环缩小到左上角，画面主体文字：「每一步用中文报告，关键操作等你批准」，底部小字「像一个实习生——聪明、干活快，但需要你把关」

口播节选：
> 启动时自动扫描代码目录，把关键信息塞进上下文窗口——能装下好几本厚书。工作循环：接到任务→搜索→读取→分析→编辑→验证→根据输出调整。每一步都报告给你。

---

## 5. safety — 把代码交给 AI，靠谱吗？（[release] · 6 steps · ~41s）

chapter_type: list-reveal
visual_strategy: 三层同心圆盾牌从外向内逐层收缩亮起，每层标注一个安全机制，口播到哪层哪层从暗灰变为暖金，三层全亮后盾牌中心出现锁孔图标，整体呼吸式微动
primitives: [ShieldLayers, ConcentricReveal, LabelBadge, LockIcon]

**信息池**（chapter agent 按需挂角标 / 副标 / mono cue）：
- 安全机制 1 — 权限控制：危险操作暂停征求许可，可设定三级（直接做/通知/禁止）—— 来源 article §5
- 安全机制 2 — 透明化：每个动作有日志，可像 Git diff 一样审查，不行就回退 —— 来源 article §5
- 安全机制 3 — 内置行为准则：不确定时必须提问，不能做假设 —— 来源 article §5
- 坦诚限制：复杂业务逻辑可能误解，生成代码需审查 —— 来源 article §5

**开发计划**：

- step 1 (~6s) — 画面大字：「万一它删库跑路怎么办？」，文字微微颤抖，随即被下方浮现的盾牌图标镇住
- step 2 (~7s) — 最外层盾牌环亮起，文字「权限控制」浮现。环内展示操作确认弹窗，三个开关：允许/通知/禁止
- step 3 (~7s) — 中层盾牌环亮起，文字「透明日志」浮现。环内展示 Git diff 式修改记录，红绿行对比
- step 4 (~7s) — 内层盾牌环亮起，文字「行为准则」浮现。环内一行规则：「不确定时必须提问，不能做假设」
- step 5 (~7s) — 三层全亮暖金色。盾牌中心出现锁孔图标，底部文字：「每一步你都看得见，管得住」
- step 6 (~7s) — 画面柔和过渡，一行小字：「当然它不完美。复杂逻辑可能误解，但你有完全的审查权」

口播节选：
> 危险操作会暂停征求你的许可。每个动作都有日志，不行就回退。它还有一份内置行为准则——不确定时必须提问，不能做假设。每一步你都看得见、管得住。

---

## 6. real-example — 一个真实的开发场景（[build] · 8 steps · ~55s）

chapter_type: process-flow
visual_strategy: 终端窗口模拟完整操作流程，命令行逐行打字机打出，代码 diff 以红绿高亮，每步操作后短暂停顿让观众看清变化，底部显示步骤进度条
primitives: [Terminal, TypewriterText, CodeDiff, StepProgress]

**信息池**（chapter agent 按需挂角标 / 副标 / mono cue）：
- 场景：接手 Express 旧后端项目 —— 来源 article §6
- 目标文件：`routes/userRoutes.js` —— 来源 article §6
- 问题：错误处理用 `console.log` 凑合 —— 来源 article §6
- 目标：统一改成 `next(error)` + winston 日志 —— 来源 article §6
- 工具链：`npm test`、Git commit —— 来源 article §6
- 时间感受：全程两三分钟，随时可喊停 —— 来源 article §6

**开发计划**：

- step 1 (~6s) — 终端窗口打开，显示 `~/old-express-project/`，`ls` 列出文件
- step 2 (~6s) — 光标处逐字打出用户指令：「帮我把 routes/userRoutes.js 里的错误处理重构一下」
- step 3 (~8s) — 终端切换分析模式：文件内容展开，`console.log` 行被红色高亮标记
- step 4 (~7s) — 改动计划列表弹出（3 条），每条前有 checkbox，逐条打勾确认
- step 5 (~8s) — 代码 diff 视图：左侧红色 `console.log(error)` → 右侧绿色 `next(error)` + winston，多行快速切换
- step 6 (~8s) — 终端自动执行 `npm test`，测试结果滚动：绿色 ✓ 逐个通过
- step 7 (~7s) — Git 提交预览弹出：commit message 已写好，分支名、变更数一目了然
- step 8 (~5s) — 画面定格，计时器「~2 min」，底部文字：「全程目击，随时喊停」

口播节选：
> 打开终端，敲 claude，说帮我把错误处理重构一下。它会先读文件，分析改动位置，列出计划让你确认。确认后飞速改代码，主动跑 npm test。不通过继续改，直到通过。

---

## 7. dev-evolution — 开发者角色的进化（[build] · 4 steps · ~32s）

chapter_type: concept-model
visual_strategy: 从左到右进化箭头 SVG，左侧锤子扳手交叉（工匠图标）→ 箭头中段「写代码的动作」淡出、「解决问题」淡入 → 右侧指挥棒图标，箭头路径上代码片段从手敲动画变为闪电自动生成
primitives: [EvolutionArrow, IconTransform, TextMorph, AutoGenerate]

**信息池**（chapter agent 按需挂角标 / 副标 / mono cue）：
- 趋势判断：从自动化「写代码的动作」走向自动化「解决问题」—— 来源 article §7
- 对老手：增幅器——重复实现细节外包，专注架构和决策 —— 来源 article §7
- 对新手：导师+执行者——读 AI 写的代码、看 AI 调试来成长 —— 来源 article §7
- 新核心技能：清晰描述需求、审查 AI 产出、与 AI 高效协作 —— 来源 article §7

**开发计划**：

- step 1 (~7s) — 左侧锤子扳手交叉图标（工匠），右侧指挥棒图标（指挥官），中间粗箭头连接
- step 2 (~8s) — 箭头中段「写代码的动作」淡出，「解决问题」淡入。箭头旁代码从手敲动画变为闪电自动生成
- step 3 (~8s) — 画面分上下：上方「老手 → 增幅器」带简短描述，下方「新手 → 导师+执行者」带简短描述
- step 4 (~9s) — 三行核心技能依次浮现：「清晰描述需求」「审查 AI 产出」「与 AI 高效协作」，每行前有闪烁光标

口播节选：
> 从自动化写代码的动作，走向自动化解决问题。对老手是增幅器，对新手是导师加执行者。学会清晰描述需求、审查 AI 产出、与 AI 协作——下一代开发者的核心技能。

---

## 8. close — 你的下一个同事（[close] · 3 steps · ~18s）

chapter_type: close-cta
visual_strategy: 终端光标最后一行闪烁，逐字打出 `claude` 命令后回车，屏幕从四周向中心缓缓暗下，中央只留一行白字「你的下一个同事，住在终端里」，随后白字淡出至全黑
primitives: [Terminal, TypewriterText, FadeToBlack, HeroText]

**信息池**（chapter agent 按需挂角标 / 副标 / mono cue）：
- 核心金句：「你的下一个同事，可能就住在终端里」—— 来源 article 结语
- CTA：打开终端试试 —— 来源 article 结语
- 情感锚点：「指挥官式的开发感觉」—— 来源 article 结语

**开发计划**：

- step 1 (~5s) — 终端窗口居中，光标闪烁，逐字打出 `$ claude`，回车
- step 2 (~5s) — 屏幕从四周向中心缓缓暗下，中央浮现白字：「你的下一个同事，住在终端里」
- step 3 (~8s) — 白字保持后淡出，全黑画面，底部极淡小字：「Anthropic — Claude Code」

口播节选：
> 你的下一个同事，可能就住在终端里。打开终端，跟这位新伙伴打个招呼。那种指挥官式的感觉，试一次你就懂了。

---

## 自检

- [x] 每个 step 都是单一句屏幕内容描述，无动画行/手段行
- [x] 无 step 写了具体毫秒/秒数（除 ~Ts 口播估时）
- [x] article.md 无 `![](url)` 图片，无需 `[img:]` 标注
- [x] 每章首段有信息池 block，≥3 条，每条带来源标注
- [x] step 总估时：40+63+57+61+41+55+32+18 = 367s ≈ 6分7秒，与声明总时长 6分30秒误差 <10%
- [x] 每章 3~8 step（最小 close 3步，最大 capabilities 和 real-example 各 8步）
- [x] 素材清单分章节列出，⚠️ 标注待提供项

## 素材清单

### 1. coldopen
- ⚠️ Claude Code 品牌色/logo 参考（待提供）
- ⚠️ 终端报错截图素材（待提供，可用代码模拟）

### 2. capabilities
- ⚠️ 各能力图标素材（待提供，可用 SVG 图标代替）

### 3. vs-copilot
- ⚠️ Copilot IDE 补全截图参考（待提供，可用 UI 模拟）

### 4. how-it-works
- ⚠️ 无外部素材依赖，全部 SVG 绘制

### 5. safety
- ⚠️ 无外部素材依赖，全部 SVG 绘制

### 6. real-example
- ⚠️ Express 项目示例代码（待提供，可用模拟代码）

### 7. dev-evolution
- ⚠️ 无外部素材依赖，全部 SVG 绘制

### 8. close
- ⚠️ 无外部素材依赖
