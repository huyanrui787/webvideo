# 组合模式 Blueprint 示例

> 这些是 `mode: "composed"` 的完整 ChapterBlueprint JSON 示例。每个示例展示一种视觉模式，
> 你可以参照结构、替换内容来构建自己的章节。

## 示例列表

| 文件 | 视觉模式 | 布局 | 适合 chapter_type |
|------|---------|------|------------------|
| `data-dashboard.json` | 数据冲击：大数字 + 多指标面板 | grid | data-proof |
| `narrative-split.json` | 叙事分屏：左右对比 / 理论 vs 实验 | split | comparison, concept-model |
| `process-flow.json` | 流程动画：网络图 + 逐步揭示 | stack | process-flow, concept-model |

## 使用方法

1. 参照 PRIMITIVES.md 选型表，确定要用的布局和 primitive
2. 选择一个最接近的示例作为模板
3. 替换 chapterId、title、narration 和各 region 的 content
4. 调整 animations 的 delay/duration 适配你的口播节奏

## 关键规则

- 所有视觉积木通过 `regions.content` 引用，**不要手写 TSX**
- 颜色用 CSS 变量：`var(--accent)`、`var(--text)`、`var(--surface-2)` 等
- 动画 delay 与口播节奏匹配：通常 0.2-0.8s
