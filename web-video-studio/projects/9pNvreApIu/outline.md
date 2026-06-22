# YouMind 1.0 开发计划

## 第一章 coldopen — 一眼 AI 的问题（钩子）

信息池：
- 痛点：通用 Agent 产出千篇一律，相同句式、配色、节奏，"一眼 AI"
- YouMind 在六大创作能力中沉淀了审美标准和创作 know-how
- 六大方向：写作、生图、音视频、幻灯片、网页、学习

- step 1 (~4s) — 黑屏中央打字提问："AI 做出来的东西，一眼就能认出来？"
- step 2 (~4s) — 屏幕铺满重复的"AI 味"卡片网格，统一句式/配色，强调千篇一律
- step 3 (~4s) — YouMind 1.0 标题登场，副标题"让创作不再一眼 AI"
- step 4 (~5s) — 六大创作能力放射状排列：写作、生图、音视频、幻灯片、网页、学习

## 第二章 writing — 写作能力升级

信息池：
- 写作是最高频创作场景
- 六种题材 Skill：Essay、Story、Professional、Technical、Emails & Letters、Marketing
- AI 自动判断写什么，加载对应 Skill，按题材标准采集/构思/产出
- 段落级精准改动：选中一段/一句/一词，AI 只改选段，"指哪儿打哪儿"
- 素材：邮件写作界面 7d6JLmI3_C.jpg、精准改动界面 nZuF7h56PD.jpg

- step 1 (~4s) — "写作：最高频的创作场景"标题进场
- step 2 (~6s) — 六种写作题材卡片依次亮起：Essay / Story / Professional / Technical / Emails & Letters / Marketing
- step 3 (~5s) — 展示 Emails & Letters Skill 自动运行界面（素材 7d6JLmI3_C.jpg），说明 AI 自动判断题材
- step 4 (~5s) — 段落精准改动演示：选中一个词高亮，AI 只改这一段（素材 nZuF7h56PD.jpg），"指哪打哪"

## 第三章 image — 生图 & 幻灯片编辑器

信息池：
- 旧痛点：出图后不好改，换背景/删元素/调角落都得重跑
- 1.0 新增图片编辑器，点击图片唤起工具栏
- 框选要改部分或描述需求，支持编辑文本、快速编辑、裁剪、擦除
- 编辑器同样上线幻灯片，新增背景移除，可单独调每页元素和布局
- 素材：图片编辑器 WVtp7By1Vf.jpg、幻灯片编辑器 jKsQvjfLSh.jpg

- step 1 (~4s) — 标题"生图：出图后改不动？"+ 旧流程整张重跑示意
- step 2 (~5s) — 新增图片编辑器，点击图片唤起工具栏（素材 WVtp7By1Vf.jpg）
- step 3 (~5s) — 编辑能力列表：编辑文本、快速编辑、裁剪、擦除，框选即改
- step 4 (~5s) — 编辑器搬到幻灯片，新增背景移除，单独调每页（素材 jKsQvjfLSh.jpg）

## 第四章 cast — 音视频与 Cast

信息池：
- 智能成片：幻灯片点 "One-click video creation" 变讲解视频
- 流程：每页生成脚本→生成音频→音轨整合回幻灯片
- 可调背景音乐、人声、字幕、转场，可改单页脚本重生成
- Cast = 把视频制作拆成步骤、每步可控调整
- 视频信息密度最高、门槛最高：脚本/分镜/素材/配音/剪辑/配乐缺一不可
- 例子：生成 15s 头戴式耳机广告片
- Create cast 流程：脚本→参考素材→分镜画面→配音音轨→组装成片，每步确认
- 支持真人肖像作 Seedance 2.0 角色参考 + 真人声音克隆
- 素材：智能成片 676SZL0hIP.jpg、成片调整 LNluCDc97L.jpg、Create cast 唤起 qKjzA44Yol.jpg、Storyboard r-Ztbpm4JO.jpg、分镜音轨 dH_fCcF8Yd.jpg

- step 1 (~4s) — 标题"音视频：智能成片"，幻灯片 → 视频转化示意
- step 2 (~5s) — 智能成片三步流程：每页脚本 → 生成音频 → 整合音轨（素材 676SZL0hIP.jpg）
- step 3 (~5s) — 可调项：背景音乐/人声/字幕/转场，单页可改（素材 LNluCDc97L.jpg）
- step 4 (~5s) — Cast 概念：把视频制作拆成可控步骤；视频门槛最高，脚本/分镜/配音缺一不可
- step 5 (~5s) — 案例：15s 耳机广告，Create cast 唤起（素材 qKjzA44Yol.jpg）
- step 6 (~6s) — Create cast 流程链：脚本→素材→分镜→配音→成片，每步确认（素材 r-Ztbpm4JO.jpg + dH_fCcF8Yd.jpg）
- step 7 (~5s) — 真人肖像作角色参考 + 声音克隆，用自己的形象和声音出镜

## 第五章 web_learn — 网页动态策展 & 学习

信息池：
- 网页痛点：每加内容都得手动更新重发布
- 动态策展：用 @ 选中整个 Board，后续加内容网页自动同步
- 适用场景：作品集、资料库、博客/内容合集、灵感板
- 例子：工程师 Dancang 每日 AI 日报定时任务，自动更新到网页
- 学习（Learn & Research）：多来源采集、交叉验证、生成结构化笔记/报告
- 旧限制：只能读搜索引擎摘要和静态快照，登录/动态加载/反爬页面失效
- 1.0 接入 Browser Use，开启浏览器权限后可直接操作浏览器、登录、读实时内容
- 素材：AI 日报网页 W5a88sKALR.jpg、浏览器权限 Q9L_OTfKth.jpg

- step 1 (~4s) — 标题"网页：动态策展"，旧痛点手动更新重发
- step 2 (~5s) — @ 选中 Board，加内容网页自动同步示意
- step 3 (~5s) — 四种场景：作品集/资料库/博客/灵感板，AI 日报案例（素材 W5a88sKALR.jpg）
- step 4 (~5s) — 学习 Agent：旧限制只能读摘要快照，登录/动态页失效
- step 5 (~5s) — 接入 Browser Use，直接操作浏览器读实时内容（素材 Q9L_OTfKth.jpg）

## 第六章 skill_sprite — 激励计划 & 精灵

信息池：
- 创作者激励计划：把工作流打包成 Skill，用积分定价，上架技能广场赚奖励金
- 自然语言编排，不懂代码也能把认知产品化
- 技能广场已上架超 2000 个 Skill，有创作者赚到第一笔 2000 美元
- 精灵 Sprite：大多数 AI 是任务型（给指令→完成→结束）
- 创作是连续的，带着个人/品牌/项目烙印；新对话什么都不记得
- 精灵有长期记忆文档 Memory 和可编辑灵魂文档 Soul
- 精灵驻留每个 Board 工作区，能调用各项 Agent 能力
- 精灵可接 Telegram 和微信
- 任务=一次性创作，精灵=长期搭档
- 素材：收益统计 8f9-G74es9.jpg、Board 唤起精灵 4CAIJ-Xh6E.jpg、链接 IM 9VVdOjtfZ8.jpg

- step 1 (~4s) — 标题"创作者激励计划"，工作流 → Skill 打包
- step 2 (~5s) — 积分定价、上架技能广场赚奖励金；自然语言编排，不懂代码也能
- step 3 (~5s) — 数据：超 2000 个 Skill，第一笔 2000 美元收入（素材 8f9-G74es9.jpg，Counter 动效）
- step 4 (~5s) — 任务型 AI 的局限：给指令→完成→结束，创作却是连续的
- step 5 (~5s) — 精灵 Sprite：Memory 记忆 + Soul 灵魂文档，知道你是谁（素材 4CAIJ-Xh6E.jpg）
- step 6 (~5s) — 精灵接 Telegram 和微信，随手发想法（素材 9VVdOjtfZ8.jpg）；任务 vs 精灵对比

## 第七章 platform_outro — 多端、API 与结尾

信息池：
- iOS 移动端已上线，从 X/YouTube 分享内容自动沉淀进 Board，广场找 Skill 一键调用
- Android 版和桌面端即将见面
- YouMind API：让 Codex、Claude Code 等 Agent 读取 YouMind 内容、使用创作能力
- Connector 反向连接 Notion、Linear、Slack 等读取内容
- 打通 X 文章和微信公众号后台，一键发草稿箱无需二次排版
- 两年前概念太多上手难；1.0 让创作链路从输入到加工到输出更顺
- IPO 方法论：Input → Process → Output
- 结尾："欢迎你来，也谢谢你还在，大胆创作"
- 素材：API Key 界面 08yojXZB4M.jpg、Connector cIMhf48nQw.jpg、移动端 dzHnrwwmz3.jpg

- step 1 (~4s) — iOS 端上线，从 X/YouTube 分享进 Board（素材 dzHnrwwmz3.jpg）
- step 2 (~4s) — 安卓 + 桌面端即将见面，全平台覆盖
- step 3 (~5s) — YouMind API：外部 Agent（Claude Code 等）读取内容（素材 08yojXZB4M.jpg）
- step 4 (~5s) — Connector 连 Notion/Slack；一键发公众号和 X 草稿箱（素材 cIMhf48nQw.jpg）
- step 5 (~5s) — IPO 方法论：Input → Process → Output 流程图
- step 6 (~5s) — 结尾标题"欢迎你来，谢谢你还在 · 大胆创作"
