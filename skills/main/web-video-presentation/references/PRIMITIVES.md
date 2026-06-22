# 视觉积木手册（PRIMITIVES）

> 构造 blueprint 时从这里选积木。所有积木通过 `mode: "composed"` 的 `regions.content` 引用，编译器自动生成代码，不需要手写 TSX。
> **注意**：Reveal 通过 animations 系统使用（编译器的 region 动画会自动包裹 Reveal），不需要放在 content 中。

---

## 快速选型：你要表达什么？

| 表达意图 | 用什么 | Blueprint 写法 |
|---------|--------|---------------|
| 一个大数字冲击 | Counter | `{primitive: "Counter", params: {to: 300000, unit: "km/s"}}` |
| 元素滑入出场 | animations 系统 | `"animations": [{"target": "region", "effect": "slideUp"}]` |
| 逐个揭示 | Stagger（作为 content 的第一个元素） | `[{primitive: "Stagger", params: {interval: 0.15}}, {primitive: "Counter", ...}, ...]` |
| 流程/架构/关系图 | NetworkGraph | `{primitive: "NetworkGraph", params: {nodes: [...], edges: [...], visibleNodes: 5}}` |
| 波形/信号/频谱 | WaveForm | `{primitive: "WaveForm", params: {variant: "pulse"}}` |
| 终端风格逐字打印 | TypeWriter | `{primitive: "TypeWriter", params: {text: "...", speed: 30}}` |
| 粒子背景氛围 | ParticleField | `{primitive: "ParticleField", params: {behavior: "flow"}}` |
| SVG 路径自绘 | DrawPath | `{primitive: "DrawPath", params: {d: "M 0 540 L 1920 540"}}` |
| 图片/视频嵌入 | MediaFrame | `{primitive: "MediaFrame", params: {src: "/api/projects/...", fit: "cover"}}` |
| 代码块展示 | CodeBlock | `{primitive: "CodeBlock", params: {code: "...", language: "python"}}` |
| 图表 | DataChart | `{primitive: "DataChart", params: {type: "bar", data: [...]}}` |

---

## 各 Primitive 的完整 params

### Counter — 数字滚动

| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| to | number | 必填 | 目标数值 |
| from | number | 0 | 起始数值 |
| unit | string | "" | 单位后缀，如 "ms"、"%"、"x" |
| prefix | string | "" | 前缀，如 "$"、"¥" |
| duration | number | 1.2 | 动画时长（秒） |
| decimals | number | 0 | 小数位数 |
| delay | number | 0 | 延迟（秒） |

### Reveal — 入场动画

| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| from | "up"\|"down"\|"left"\|"right"\|"none" | "up" | 入场方向 |
| delay | number | 0 | 延迟（秒） |
| duration | number | 0.7 | 时长（秒） |
| distance | number | 32 | 位移距离 px |

### Stagger — 子元素逐个出现

> 在 composed 模式中：作为 region.content 数组的**第一个元素**时，自动包裹其后的所有 primitive。

| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| interval | number | 0.12 | 子元素间隔（秒） |
| delay | number | 0 | 首个元素延迟（秒） |
| duration | number | 0.6 | 每个元素的动画时长 |
| from | "up"\|"down"\|"left"\|"right"\|"none" | "up" | 入场方向 |

### NetworkGraph — 节点网络图

| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| nodes | {id, label, x?, y?, highlight?}[] | 必填 | 节点列表 |
| edges | {from, to, label?}[] | [] | 边列表 |
| visibleNodes | number | nodes.length | 逐步揭示节点数 |
| edgeColor | string | "var(--rule)" | 边颜色 token |
| accentColor | string | "var(--accent)" | 高亮节点颜色 |

### WaveForm — 波形

| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| variant | "sine"\|"pulse"\|"noise"\|"bars" | "sine" | 波形类型 |
| cycles | number | 2 | 周期数 |
| amplitude | number | 0.15 | 振幅（相对高度） |
| color | string | "var(--accent)" | 波形颜色 token |

### ParticleField — 粒子场

| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| behavior | "flow"\|"converge"\|"scatter"\|"orbit" | "flow" | 粒子行为 |
| count | number | 300 | 粒子数量 |
| color | string | "var(--accent)" | 粒子颜色 token |
| speed | number | 1 | 速度倍率 |

### TypeWriter — 逐字打印

| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| text | string | 必填 | 显示文本（支持 \n 换行） |
| speed | number | 50 | 打字速度 ms/字 |
| delay | number | 0 | 延迟（秒） |
| cursor | boolean | true | 是否显示光标 |

### DrawPath — SVG 路径自绘

| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| d | string | 必填 | SVG path data |
| color | string | "var(--accent)" | 线条颜色 |
| strokeWidth | number | 2 | 线宽 |
| duration | number | 1.2 | 动画时长（秒） |

### MediaFrame — 图片/视频容器

| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| src | string | 必填 | 资源 URL |
| fit | "cover"\|"contain"\|"fill" | "cover" | 适配方式 |
| aspectRatio | string | "16/9" | 宽高比 |

### CodeBlock — 代码展示

| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| code | string | 必填 | 代码内容 |
| language | string | "" | 语言标识 |

### DataChart — 图表

| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| type | "bar"\|"line"\|"pie" | 必填 | 图表类型 |
| data | object | 必填 | 图表数据 |

---

## 布局模式

### 居中单栏（center）— 标题 / 金句 / 核心观点

```
mode: "composed"
layout: "center"
regions:
  main:
    content: [{primitive: "Reveal", params: {from: "up"}}]
```

### 左右分屏（split）— 对比 / VS / 左理论右实例

```
mode: "composed"
layout: "split"
regions:
  left:
    content: [{primitive: "Reveal", params: {from: "left"}}]
  right:
    content: [{primitive: "Reveal", params: {from: "right"}}]
```

### 垂直堆叠（stack）— 步骤列表 / 要点排列

```
mode: "composed"
layout: "stack"
regions:
  step1:
    content: [{primitive: "Stagger"}] | [{primitive: "Reveal", params: {from: "up"}}]
  step2:
    content: [{primitive: "Reveal", params: {from: "up", delay: 0.3}}]
```

### CSS Grid（grid）— 数据仪表盘 / 复杂版面

```
mode: "composed"
layout: "grid"
gridTemplate: "1fr 2fr"   ← CSS Grid 定义
regions:
  number:
    content: [{primitive: "Counter", params: {to: 99.5, unit: "%"}}]
    gridArea: "1/1"        ← CSS grid-area
  context:
    content: [{primitive: "Reveal", params: {from: "right"}}]
    gridArea: "1/2"
```

### 绝对定位（absolute）— 精确布局

```
mode: "composed"
layout: "absolute"
regions:
  overlay:
    content: [{primitive: "Counter", params: {to: 42}}]
    style: {position: "absolute", top: "10%", left: "50%"}
```

---

## 动画

每个 region 可配置 `animations`，6 种入场效果：

| effect | 视觉效果 |
|--------|---------|
| fadeIn | 纯淡入（无位移） |
| slideUp | 从下方滑入 ↑ |
| slideDown | 从上方滑入 ↓ |
| slideLeft | 从右侧滑入 ← |
| slideRight | 从左侧滑入 → |
| scaleIn | 缩放弹入 |

```json
"animations": [
  {"target": "title-area", "effect": "slideUp", "delay": 0.2, "duration": 0.8},
  {"target": "data-area", "effect": "fadeIn", "delay": 0.6, "duration": 0.6}
]
```

---

## 完整 Blueprint 示例

### 数据冲击型（grid + Counter + Reveal）

适合 data-proof 章节，大数字 + 上下文。

```json
{
  "mode": "composed",
  "layout": "grid",
  "gridTemplate": "2fr 1fr",
  "regions": {
    "big-number": {
      "content": [{"primitive": "Counter", "params": {"to": 99.5, "unit": "%", "duration": 1.5}}],
      "gridArea": "1/1"
    },
    "context": {
      "content": [{"primitive": "Reveal", "params": {"from": "right"}}],
      "gridArea": "1/2"
    }
  },
  "animations": [
    {"target": "big-number", "effect": "scaleIn", "delay": 0.2, "duration": 0.8},
    {"target": "context", "effect": "slideRight", "delay": 0.6, "duration": 0.6}
  ]
}
```

### 叙事分屏型（split + Reveal × 2）

适合 comparison 章节，左右对比。

```json
{
  "mode": "composed",
  "layout": "split",
  "regions": {
    "left": {
      "content": [{"primitive": "Reveal", "params": {"from": "left", "delay": 0.2}}]
    },
    "right": {
      "content": [{"primitive": "Reveal", "params": {"from": "right", "delay": 0.5}}]
    }
  },
  "animations": [
    {"target": "left", "effect": "slideRight", "delay": 0, "duration": 0.7},
    {"target": "right", "effect": "slideLeft", "delay": 0.3, "duration": 0.7}
  ]
}
```

### 流程动画型（stack + NetworkGraph + Stagger）

适合 process-flow 章节，节点逐渐揭示。

```json
{
  "mode": "composed",
  "layout": "stack",
  "regions": {
    "graph": {
      "content": [{"primitive": "NetworkGraph", "params": {
        "nodes": [
          {"id": "a", "label": "步骤一"},
          {"id": "b", "label": "步骤二"},
          {"id": "c", "label": "步骤三"}
        ],
        "edges": [
          {"from": "a", "to": "b"},
          {"from": "b", "to": "c"}
        ],
        "visibleNodes": 3
      }}]
    },
    "steps": {
      "content": [{"primitive": "Stagger"}]
    }
  }
}
```
