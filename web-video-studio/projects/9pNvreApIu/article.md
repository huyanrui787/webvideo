一、创作能力全面升级
创作能力是 YouMind 的立身之本。YouMind 的创作能力覆盖写作、生图、音视频、幻灯片、网页、学习六大方向。虽然绝大多数的通用 Agent 也具备同样的能力，但它们产出的成果通常千篇一律，相同的句式、配色、节奏……往往“一眼 AI”。
YouMind 在这六个创作能力中，都沉淀了这个领域的审美标准和创作 know-how，让用户在 YouMind 里产出的作品，比通用 AI 的水准更高。在 1.0 版本中，我们又对这六大能力都做了进一步的优化。
写作：内置题材 Skill & 段落精准修改
写作是 YouMind 上最高频的创作场景。我们研究了不同领域的写作人群，根据他们的工作流、行为习惯和对文字内容创作的要求，总结归纳出 6 种常见的写作题材：Essay、Story、Professional、Technical、Emails & Letters、Marketing，并分别沉淀成了内置 Skill。
写作 Agent 会自动判断用户在写什么，加载对应 Skill，并按这个题材的标准去采集资料、构思、产出。不论是观点文章、还是剧本小说，学术或商务写作，YouMind 都知道这个题材该怎么写、好在哪里，并最终作用于用户的内容产出。

![de5b843e26c21c29148ddf588b769500.png](/api/projects/9pNvreApIu/assets/7d6JLmI3_C.jpg)
根据用户写作意图自动运行 Emails & Letters 内置 Skill
另外，在 1.0 里我们还对段落级精准改动做了优化。选中一段、一句、甚至某个词，AI 就会精准定位并只对选段做修改，真正实现“指哪儿打哪儿”。

![截屏2026-06-11 09.59.19.png](/api/projects/9pNvreApIu/assets/nZuF7h56PD.jpg)
精准改动到词
生图 & 幻灯片：新增编辑器
1.0 之前，YouMind 的生图效果已经很不错了。但有一个用户反复提的痛点：出图之后不好改。想换个背景、移除一个元素、调整一个角落，都得重新跑。
所以在 1.0 里我们新增了图片编辑器。点击图片即可唤起编辑工具栏。只需框选你想修改的部分，或描述你的需求，即可完成编辑文本、快速编辑、裁剪、擦除等。

![Screenshot 2026-06-10 at 9.57.44 AM.png](/api/projects/9pNvreApIu/assets/WVtp7By1Vf.jpg)
编辑器功能同样也上线了到了幻灯片。幻灯片是基于生图模型产出的，所以之前最大的痛点也是无法对生成的元素做精准调整。1.0 中幻灯片编辑器不仅和图片编辑器一样，能够修改文本、快速编辑、裁剪、擦除，还增加了背景移除，让你可以单独调整每一页的元素和布局。

![Screenshot 2026-06-10 at 2.59.31 PM.png](/api/projects/9pNvreApIu/assets/jKsQvjfLSh.jpg)
音视频：智能成片、Cast、支持人脸参考生视频 & 声音克隆
YouMind 1.0 还支持将做好的幻灯片智能成片、快速做成讲解类视频。点击幻灯片左上角的“One-click video creation”，YouMind 会先根据幻灯片内容，为每页生成脚本文档。接着根据脚本文档生成对应的音频，并将音轨整合回幻灯片中形成讲解视频。

![Screenshot 2026-06-10 at 3.02.26 PM.png](/api/projects/9pNvreApIu/assets/676SZL0hIP.jpg)
用户可以自由调整背景音乐、讲解人声、字幕、转场等。并支持对单页的脚本进行修改、再次生成对应的讲解音频。

![CleanShot 2026-06-10 at 15.03.38@2x.png](/api/projects/9pNvreApIu/assets/LNluCDc97L.jpg)
一键智能成片流程
这样把视频制作的流程拆解为步骤、并允许用户对每一步都能进行可控调整的做法，我们在 YouMind 1.0 里称之为 Cast。
视频是一种信息密度极高的内容形式，相应的，制作门槛也最高。作出一个水准尚可的视频，脚本、分镜、素材、配音、剪辑、配乐缺一不可。
这就是 Cast 存在的意义。跳出讲解类视频智能成片的场景，如果用户想用模型，如 Seedance 2.0 生成一段视频，可以在「任务」对话框中唤起「Create cast」技能，简单描述你想制作的视频内容，如：生成一段15s 的头戴式耳机广告片。

![截屏2026-06-10 16.45.56.png](/api/projects/9pNvreApIu/assets/qKjzA44Yol.jpg)
接着，YouMind 会依次为你生成广告片的脚本、参考素材、分镜画面、配音音轨，并在每一步请你进行确认、允许你做相应调整，最后将确认好的物料组装成片。

![截屏2026-06-10 16.50.57.png](/api/projects/9pNvreApIu/assets/r-Ztbpm4JO.jpg)
Create cast 技能做视频的流程演示：生成 Storyboard 脚本

![截屏2026-06-10 16.51.14.png](/api/projects/9pNvreApIu/assets/dH_fCcF8Yd.jpg)
Create cast 技能做视频的流程演示：生成分镜、音轨、组装成片
同时，在 YouMind 1.0 版本中，我们已经允许用户上传真人肖像作为 Seedance 2.0 视频生成的角色参考，并支持用真人声音进行音色克隆，这意味着你可以用自己的形象和声音出镜，让视频内容更具个人辨识度和真实感。
网页：动态策展，实现自动更新
很多用户用 YouMind 做网页都是为了呈现自己 Board 里的内容。但难点在于后续维护。每次新增一篇文章、一张作品图、一条资料链接，都得手动用 Agent 更新到网页中、再发布一遍。
所以在 1.0 里，网页新增了“动态策展”的能力。用户做网页时可以用 @ 来选中整个 Board；之后继续往 Board 里添加内容，网页也会自动同步展示，无需反复手动更新页面。网页的动态策展适合多种场景用途：
作品集：设计师把新作品丢进 Board，主页自动更新

资料库：课程资料、行业报告、参考链接持续补充

博客 / 内容合集：每周笔记、文章可自动整理成可展示页面

灵感板：装修、旅行、选题、设计参考统一展示

比如，YouMind 工程师 Dancang 有一个每日获取 AI 信息源的定时任务，每天会自动帮他总结一篇日报存入 Board 中，他选中该 Board 做了个网页，后续生成的日报都会自动更新到页面里。

![Screenshot 2026-06-10 at 3.43.22 PM.png](/api/projects/9pNvreApIu/assets/W5a88sKALR.jpg)
网页跟随 Board 内容自动更新
学习：接入 Browser Use，读取实时浏览器内容
学习（Learn & Research）是 YouMind 里用于深度学习与调研的 Agent。它能帮你从多个来源采集信息、交叉验证、生成结构化的学习笔记或研究报告。
但之前有个限制：Agent 只能读取搜索引擎返回的网页摘要和静态快照，遇到需要登录、动态加载、或者有反爬机制的页面就失效了。
所以 1.0 里，学习 Agent 接入了 Browser Use。把插件升级到最新版后，在「任务」对话中开启浏览器权限，Agent 就可以直接操作浏览器、允许用户登陆、读取页面实时内容、动态加载数据等。

![CleanShot 2026-06-10 at 15.59.36@2x.png](/api/projects/9pNvreApIu/assets/Q9L_OTfKth.jpg)

二、YouMind Skill：创作者激励计划
YouMind 一直支持创作者把工作流沉淀成 Skill（技能）。但很长一段时间，Skill 的价值是隐藏的。一方面，很多 Skill 是基于创作者多年的专业经验打磨而成，他们并不愿意免费直接公开出来。另一方面，除了内容本身，创作者也需要更多可以变现的途径。
所以今年五月份，YouMind 就开启了创作者激励计划。创作者可以用积分给 Skill 定价，上架 YouMind 技能广场、赚取奖励金。创作者激励计划的详细规则与玩法请见 @YouMind Skills 可以帮你赚钱啦。
YouMind Skill 让创作者得以把一段专业判断、一套工作流、一种问题拆解方式打包成可执行、可复用、可定价的产品，并且 YouMind Skill 是用自然语言编排的，这就意味着不懂代码也能把认知产品化。
目前，YouMind 技能广场已上架超过 2000 个创作 Skills。并且，已经有创作者凭自己的 Skill，赚到在 YouMind 上的第一笔 2000 美元收入。

![35619.png](/api/projects/9pNvreApIu/assets/8f9-G74es9.jpg)
三、精灵（Sprite）：长期创作搭档
大多数 AI 产品是任务型的：你给指令，它完成，对话结束。这个设计对单次任务很高效，但这并不完全契合创作场景。
一方面，创作是连续的。你这次写的文章、做的视频，带着你这个人、这个品牌、和这个项目的长期烙印。但每开一个新的 AI 对话，它又什么都不记得了，得反复教它认识你。
其次，创作也不总是目标导向的。很多时候你只是听到一段播客，或者读到一篇有启发的文章，当下或许你并没有明确的创作意图，但你就是想聊聊、发散一下思维。这个时候用户需要的是一个更开放的存在，陪你把那些隐隐约约的想法揉一揉、晃一晃。
所以 YouMind 1.0 里有了精灵（Sprite）。
精灵有长期的记忆文档（Memory） 和可编辑的灵魂文档（Soul），它知道你是谁、在意什么、最近在做什么；记得你写过的东西、聊过的想法、表达过的偏好。
精灵可以调用任务中的各项 Agent 能力，它驻留在每个 Board 的工作区里，需要时它也可以像任务一样帮你干活儿。

![截屏2026-06-10 17.12.41.png](/api/projects/9pNvreApIu/assets/4CAIJ-Xh6E.jpg)
Board 内唤起精灵
精灵也能接到 Telegram 和微信。如果看到一篇好文章想聊两句、或者突然冒出一个想法，可以在通讯软件里发给精灵，它能更及时、更便捷的回应。

![截屏2026-06-10 17.15.09.png](/api/projects/9pNvreApIu/assets/9VVdOjtfZ8.jpg)
链接精灵至 IM
简单来说：任务（Task） 是有目标的一次性创作工作，精灵（Sprite）是长期的创作伙伴。

四、移动端 + 桌面端：YouMind 走出网页
YouMind 最新 iOS 移动端已经上线。用户从 X、YouTube 看到好的内容可以直接分享给精灵，自动沉淀进 Board；也能在广场上找到各类 Skill，安装后一键调用；保证 YouMind 可以随时在线，记录灵感、推进任务、定时跟进。创作的整条链路都能在手机上完成。

![IMG_6032.png](/api/projects/9pNvreApIu/assets/dzHnrwwmz3.jpg)
另外，Android 版移动端 和 YouMind 桌面端也即将与大家见面。

五、YouMind API：让你的 Agent 操作 YouMind
如果你把 YouMind 作为知识库，希望 Codex、Claude Code 等 Coding agent能够读取 YouMind 里的内容；或者你习惯使用 OpenClaw，将希望把 YouMind 的创作能力引入 ClawBot，那么可以直接将下面这段 Prompt 复制给你的 Agent，它会引导你生成一个 YouMind API Key，如此，Agent 就能在 YouMind 工作区中读取内容、并使用 YouMind 的各项创作能力。
   Read https://youmind.com/skill.md and follow the instructions to use YouMind. 
 
If you can install skills, run: 
npx skills add https://github.com/YouMind-OpenLab/skills --skill youmind 
 

![截屏2026-06-11 10.30.31.png](/api/projects/9pNvreApIu/assets/08yojXZB4M.jpg)
用 API 将外部 Agent 连接到 YouMind
反过来，如果你有大量历史资料、或沟通上下文沉淀在 Notion、Linear、Slack 等，也可以通过 YouMind Connector 连接到这些应用、读取内容。

![截屏2026-06-11 10.44.14.png](/api/projects/9pNvreApIu/assets/cIMhf48nQw.jpg)
同时，为了让用户从“创作到发布”的链路更流畅，YouMind 打通了 X 文章和微信公众号的后台，用户可以一键将 YouMind 里的文稿发送到 X 文章 和 微信公众号的草稿箱，且无需二次排版。

![截屏2026-06-11 12.08.35.png](/api/projects/9pNvreApIu/assets/e0hQCTxmXZ.jpg)
将 YouMind 文档发送至微信公众号草稿箱

![截屏2026-06-11 12.08.42.png](/api/projects/9pNvreApIu/assets/6di2oQ3QhH.jpg)
将 YouMind 文档发送至 X 文章草稿箱
欢迎你来，谢谢你还在
两年前的 YouMind，是一个概念太多、上手成本不低的工具。两年后的 YouMind 1.0，是一个让创作链路从输入到加工到输出、每一步都更加顺畅的创作空间。
我们依然秉持着 Input → Process → Output （IPO）的创作方法论，在每一次迭代中给出恰到好处的支持，让你的创作工作流更加愉悦。
两年了，欢迎你来到 YouMind，也谢谢你还在这里，和 YouMind 一起，
大胆创作。

喜欢作者
6人喜欢

![头像](/api/projects/9pNvreApIu/assets/RGduYk4rOV.jpg)

![头像](/api/projects/9pNvreApIu/assets/7BCpQHRW2R.jpg)

![头像](/api/projects/9pNvreApIu/assets/gm8DRjmyTe.jpg)

![头像](/api/projects/9pNvreApIu/assets/sKBcdX3F33.jpg)

![头像](/api/projects/9pNvreApIu/assets/O0m0rYq63v.jpg)

![头像](/api/projects/9pNvreApIu/assets/Bqr4FMZMH6.jpg)

阅读 3515

YouMind 1.0

​