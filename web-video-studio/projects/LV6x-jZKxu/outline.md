# 开发计划：介绍一下 Harness 工程

## 项目概要
- **类型**：论证型科普视频（约 360s / 6 分钟）
- **情绪弧**：悬念 → 铺垫 → 颠覆 → 证明 → 对比 → 释放 → 收束
- **主题**：midnight-press
- **画面方向**：landscape (16:9)

---

## 章节计划

### 第 1 章 · the-bomb-squad (hook · ~10s · 1 步)
**目标**：用"发布日=拆弹现场"的紧张画面制造悬念认同
- **chapter_type**：hook
- **visual_strategy**：暗色调 + 红色警示元素，营造紧迫感；一条脉冲线暗示不稳定
- **primitives**：Counter（倒计时数字）、Reveal（标语弹出）
- **infoPool**：发布日紧张氛围、拆弹隐喻
- **情绪线**：紧张 → 好奇

### 第 2 章 · the-wild-horse (build · ~80s · 3 步)
**目标**：解释 Harness 名字的双关 + 四大痛点堆积"失控感"
- **chapter_type**：build
- **visual_strategy**：从马具实物 → 软件失控的视觉隐喻（碎片化 UI 拼凑感）
- **primitives**：Stagger（四大痛点逐个弹出）、MediaFrame（Harness Logo）、Reveal
- **infoPool**：Harness 名字双关、传统交付四大痛点（脚本满天飞/环境谜题/审批迷宫/成本黑盒）
- **情绪线**：认知建立 → 焦虑累积

### 第 3 章 · ai-pilot (turn · ~60s · 3 步)
**目标**：颠覆——AI 驱动智能流水线，金丝雀发布+自动回滚+渐进式推进
- **chapter_type**：turn
- **visual_strategy**：切换为冷静有序的科技蓝调；流水线可视化流动，节点逐步点亮
- **primitives**：FlowDiagram（流水线节点图）、Counter（健康指标）、Reveal
- **infoPool**：金丝雀发布、自动回滚、渐进式推进、声明式 YAML 模板、模块化组件
- **情绪线**：焦虑 → 豁然开朗

### 第 4 章 · cost-and-flags (data · ~65s · 3 步)
**目标**：实锤——云成本管理 + 特性开关两大模块具体能力
- **chapter_type**：data
- **visual_strategy**：split 布局——左边云成本数字对比，右边特性开关可视化
- **primitives**：Counter（成本数字滚动）、DataChart（成本对比图）、MediaFrame（开关 UI）
- **infoPool**：闲置检测、规格优化、自动休眠；特性开关解耦部署与发布
- **情绪线**：惊讶 → 信服

### 第 5 章 · smart-vs-manual (build · ~60s · 3 步)
**目标**：Harness vs 传统工具对比——"智能相机 vs 手动相机"
- **chapter_type**：build
- **visual_strategy**：side-by-side 对比布局，左侧传统工具灰色调，右侧 Harness 高亮
- **primitives**：Stagger（对比项逐条）、Reveal、MediaFrame
- **infoPool**：治理策略、可视化管道、秘密管理、GitOps；Jenkins/Spinnaker/GitLab CI 局限
- **情绪线**：理解差距 → 倾向选择

### 第 6 章 · three-stories (release · ~55s · 3 步)
**目标**：三个真实场景故事释放情绪——金融自动回滚、SaaS 降本 40%、电商暗发布
- **chapter_type**：release
- **visual_strategy**：三卡片轮流放大，每张卡片对应一个场景；温暖叙事色调
- **primitives**：Stagger（卡片入场）、Counter（40% 降本数字）、Reveal
- **infoPool**：金融公司 2 分钟自动回滚、SaaS 降本 40%、电商大促暗发布零回滚
- **情绪线**：代入 → 共鸣 → 信任

### 第 7 章 · the-reins (close · ~30s · 1 步)
**目标**：回到"马具"比喻——控制力=安全感，记忆锚点闭合
- **chapter_type**：close
- **visual_strategy**：hero-title 模式居中收缩，渐暗聚光在一个马具剪影上
- **primitives**：Reveal（核心金句弹出）
- **infoPool**："控制力=安全感"记忆锚点、智能马具隐喻闭合
- **情绪线**：释放 → 回味

---

## 全局设计约束
- 所有数字数据用 Counter primitive 动画呈现
- 章节过渡用暗化 + 标题卡
- 配色：暗底（#0a0a0f）+ 暖金高亮（#f0b429）+ 科技蓝（#3b82f6）
- 字体：标题用加粗无衬线，正文用等宽/无衬线混合
