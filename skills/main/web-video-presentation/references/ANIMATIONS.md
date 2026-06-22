# 动画系统参考（ANIMATIONS）

> Composed 模式的动画系统。在 Blueprint 的 `animations` 数组中声明。

---

## 6 种入场效果

| effect | 视觉效果 | 适用场景 |
|--------|---------|---------|
| fadeIn | 纯淡入（无位移） | 柔和过渡、背景元素 |
| slideUp | 从下方滑入 ↑ | 底部呼出、信息浮现 |
| slideDown | 从上方滑入 ↓ | 顶部通知、标题进入 |
| slideLeft | 从右侧滑入 ← | 右侧内容、时间线推进 |
| slideRight | 从左侧滑入 → | 左侧内容、面板滑入 |
| scaleIn | 缩放弹入 | 核心数据、强调元素 |

---

## 动画参数

```json
{
  "target": "region-name",    // region 名称
  "effect": "slideUp",        // 效果
  "delay": 0.2,               // 延迟（秒）
  "duration": 0.8             // 时长（秒）
}
```

---

## 缓动预设（使用主题 token）

| Token | 贝塞尔曲线 | 气质 |
|-------|-----------|------|
| `var(--motion-snappy)` | (0.2, 0.8, 0.2, 1) | 干脆利落 |
| `var(--motion-smooth)` | (0.4, 0, 0.2, 1) | 平滑自然 |
| `var(--motion-gentle)` | (0.6, 0, 0.4, 1) | 舒缓优雅 |
| `var(--motion-spring)` | (0.34, 1.56, 0.64, 1) | 弹性活泼 |
| `var(--motion-linear)` | linear | 机械精密 |

选择缓动时参考主题的 `motionProfile.defaultEasing`。

---

## Stagger 用法

`Stagger` 不是动画效果，而是一个**包装器**，让子元素逐个出现：

```json
{
  "primitive": "Stagger",
  "params": {
    "interval": 0.12,    // 子元素间隔（秒）
    "delay": 0,           // 首个延迟
    "duration": 0.6,      // 每个元素动画时长
    "from": "up"          // 入场方向
  }
}
```

在 composed 模式中，`Stagger` 作为 region.content 的第一个元素时，自动包裹其后的所有 primitives。

---

## 设计原则

1. 不同 step 的主导动作应该不一样 — 避免全场同一种动画
2. 动画时长 ≤ 口播时长（字数÷4 ≈ 秒数）
3. 不要在一步里对所有元素用同一种动画 — 制造视觉层次
4. **禁止** 整章 N 步全用 fade（AI 味）
5. **禁止** 每步都挂持续呼吸/闪烁效果
