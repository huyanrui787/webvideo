# 模板槽位速查表（TEMPLATE SLOTS）

> 构建阶段按需用 `ProjectRead` 加载。每个模板的完整槽位定义和用法。

---

## hero-title — 标题页

| 槽位 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kicker | string | ❌ | 标题上方小标签 |
| title | string | ✅ | 主标题，支持 `<em>` 强调 |
| subtitle | string | ❌ | 副标题 |
| background | MediaRef | ❌ | 背景图/视频 |
| logo | MediaRef | ❌ | 小 logo/图标 |

变量：`centered`（居中）、`left`（左对齐）、`split`（左右分栏）

Imports: `MaskReveal`

---

## step-reveal — 步骤列表

| 槽位 | 类型 | 必填 | 说明 |
|------|------|------|------|
| hook | {type, content, label?} | ❌ | 开头钩子（stat/quote/question） |
| steps | StepRevealItem[] | ✅ | 1-8 个步骤 |

StepRevealItem: `{heading, body?, media?, badge?}`

变量：`numbered`（编号）、`cards`（卡片）、`icons`（图标）

Imports: `Reveal`, `Stagger`

---

## data-spotlight — 数据聚焦

| 槽位 | 类型 | 必填 | 说明 |
|------|------|------|------|
| primaryValue | string | ✅ | 大数字（如 "2048 tokens"） |
| primaryLabel | string | ✅ | 数字含义 |
| context | string | ❌ | 1-2 句解释 |
| secondaryValues | {value, label, trend?}[] | ❌ | 最多 4 个对比数据 |
| media | MediaRef | ❌ | 配图/图表 |

变量：`single-stat`、`comparison`、`with-chart`

Imports: `Counter`

---

## side-by-side — 左右对比

| 槽位 | 类型 | 必填 | 说明 |
|------|------|------|------|
| left | SideBySidePanel | ✅ | 左侧面板 |
| right | SideBySidePanel | ✅ | 右侧面板 |
| leftLabel | string | ❌ | 左侧标签 |
| rightLabel | string | ❌ | 右侧标签 |
| divider | "vs"/"arrow"/"none" | ❌ | 分隔符样式 |

SideBySidePanel: `{heading, body?, media?, items?: string[]}`

Imports: 无

---

## flow-diagram — 流程图

| 槽位 | 类型 | 必填 | 说明 |
|------|------|------|------|
| nodes | FlowNode[] | ✅ | 2-10 个节点 |
| edges | {from, to, label?}[] | ❌ | 边，省略则顺序连接 |
| highlightIndex | number | ❌ | 高亮节点索引（0-based） |

FlowNode: `{id, label, description?, icon?}`

Imports: `NetworkGraph`

---

## code-showcase — 代码展示

| 槽位 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | ✅ | 代码内容 |
| language | string | ❌ | 语言（默认 typescript） |
| filename | string | ❌ | 文件名 |
| highlights | string[] | ❌ | 高亮行范围 |
| annotations | CodeAnnotation[] | ❌ | 代码注释 |
| output | MediaRef | ❌ | 运行结果截图 |

Imports: `CodeBlock`, `Reveal`

---

## quote-card — 引用卡

| 槽位 | 类型 | 必填 | 说明 |
|------|------|------|------|
| quote | string | ✅ | 引用文本 |
| attribution | string | ❌ | 出处 |
| context | string | ❌ | 背景说明 |
| media | MediaRef | ❌ | 头像/装饰图 |

Imports: `MaskReveal`

---

## grid-gallery — 图库

| 槽位 | 类型 | 必填 | 说明 |
|------|------|------|------|
| items | GridItem[] | ✅ | 2-12 个图片 |
| columns | number | ❌ | 列数（2-4，默认 3） |
| gap | "sm"/"md"/"lg" | ❌ | 间距 |

GridItem: `{media: MediaRef, caption?, tag?}`

Imports: `Stagger`
