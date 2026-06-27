# 视觉积木手册（PRIMITIVES v2）

> 42 种 primitive，5 种布局。composed 模式唯一入口。
> Reveal 通过 animations 系统使用（编译器自动包裹），Stagger 作为 content 数组第一个元素包裹后续 primitive。
> 容器 primitive (Grid/FlexRow/FlexCol/Split/Card/BorderBox) 用 `children` 数组嵌套子区域。

---

## 快速选型

| 意图 | Primitive | 示例 params |
|------|-----------|-------------|
| 大标题 | Headline | `{text:"标题", scale:"hero"}` |
| 正文 | Body | `{text:"段落内容"}` |
| 标签 | Kicker | `{text:"标签"}` |
| 金句 | PullQuote | `{text:"引文", attribution:"来源"}` |
| 打字机 | TypeWriter | `{text:"逐字打印", speed:60}` |
| 数字滚动 | Counter | `{to:99.5, unit:"%", duration:1.5}` |
| 统计卡 | StatCard | `{value:"2048", label:"Token数", trend:"up"}` |
| 大数字 | BigNumber | `{value:"1179万", label:"毕业生"}` |
| 柱状图 | BarChart | `{data:[{label:"A",value:42}]}` |
| 折线图 | LineChart | `{series:[{label:"趋势",points:[{x:0,y:10}]}]}` |
| 饼图 | PieChart | `{slices:[{value:30,label:"A"}]}` |
| 仪表盘 | Gauge | `{value:75, max:100, label:"CPU"}` |
| 图片 | ImageFrame | `{src:"/api/...", fit:"cover"}` |
| 视频 | VideoFrame | `{src:"/api/...", autoplay:true}` |
| 头像 | Avatar | `{src:"/api/...", size:64}` |
| Lottie | LottiePlayer | `{src:"/anim.json", loop:true}` |
| 分割线 | Divider | `{direction:"horizontal"}` |
| 徽章 | Badge | `{text:"NEW", color:"var(--accent)"}` |
| 渐变背景 | GradientBg | `{from:"var(--accent)", opacity:0.1}` |
| 噪点 | NoiseBg | `{opacity:0.05}` |
| 图案 | PatternBg | `{pattern:"dots", opacity:0.08}` |
| 发光环 | GlowRing | `{size:200, pulseSpeed:2}` |
| 路径自绘 | DrawPath | `{d:"M0 540 L1920 540"}` |
| 粒子场 | ParticleField | `{behavior:"flow", count:80}` |
| 波形 | WaveForm | `{variant:"pulse", cycles:2}` |
| 磁场 | MagneticField | `{lineCount:12}` |
| 电路流 | CircuitFlow | `{nodes:[{id:"a",x:100,y:200}]}` |
| 文字发光 | TextGlow | `{text:"标题"}` |
| 节点图 | NetworkGraph | `{nodes:[{id,label,icon?}]}` |
| 时间线 | TimelineItem | `{date:"2024", heading:"事件"}` |
| 流程箭头 | ProcessArrow | `{steps:[{label:"步骤1"}]}` |
| 韦恩图 | VennDiagram | `{sets:[{label:"A",size:100}]}` |
| 3D 地球 | GeoGlobe | `{}` |
| 容器 Grid | Grid | `{columns:2, gap:"md", children:[...]}` |
| 容器 Flex | FlexRow/FlexCol | `{gap:"md", children:[...]}` |
| 容器 Split | Split | `{ratio:"1fr 1fr", children:[...]}` |
| 容器 Card | Card | `{padding:"md", children:[...]}` |
| 入场 | Reveal | `{from:"up", delay:0}` |
| 逐个 | Stagger | `{interval:0.12, from:"up"}` |

---

## 完整 params 参考

### 文字类

**Headline** — 大标题
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| text | string | 必填 | 标题文字 |
| scale | hero/data/quote/sub/body/kicker | hero | 字号层级 |

**Body** — 正文
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| text | string | 必填 | 正文内容 |
| align | left/center/right | left | 对齐方式 |

**Kicker** — 小标签
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| text | string | 必填 | 标签文字 |
| color | string | var(--accent) | 颜色 |

**PullQuote** — 引用
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| text | string | 必填 | 引文 |
| attribution | string | — | 署名 |
| context | string | — | 出处 |

**Caption** — 说明文字
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| text | string | 必填 | 说明 |

**TypeWriter** — 打字机
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| text | string | 必填 | 文字内容 |
| speed | number | 60 | 打字速度（ms/字） |
| cursor | boolean | true | 显示光标 |
| scale | hero/data/quote/sub/body/kicker | body | 字号层级 |

### 数据类

**Counter** — 数字滚动
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| to | number | 必填 | 目标数值 |
| from | number | 0 | 起始值 |
| unit | string | "" | 单位 |
| prefix | string | "" | 前缀 |
| duration | number | 1.2 | 动画时长(s) |
| decimals | number | 0 | 小数位 |
| delay | number | 0 | 延迟(s) |

**StatCard** — 统计卡片
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| value | string | 必填 | 数值 |
| label | string | 必填 | 标签 |
| trend | up/down/neutral | — | 趋势箭头 |

**BigNumber** — 静态大数字
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| value | string | 必填 | 数值 |
| unit | string | "" | 单位 |
| label | string | "" | 标签 |

**BarChart** — 柱状图
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| data | [{label, value, color?}] | 必填 | 数据 |
| showLabels | boolean | true | 显示标签 |
| duration | number | 1.4 | 动画时长 |

**LineChart** — 折线图
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| series | [{label, points:[{x,y}], color?}] | 必填 | 数据系列 |
| duration | number | 1.5 | 动画时长 |

**PieChart** — 饼图
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| slices | [{value, label?, color?}] | 必填 | 切片 |
| innerRadius | number | 0 | 内径(0=饼图,>0=环形图) |
| showLabels | boolean | true | 显示标签 |
| duration | number | 1.4 | 动画时长 |

**Gauge** — SVG 仪表
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| value | number | 0 | 当前值 |
| max | number | 100 | 最大值 |
| label | string | "" | 标签 |
| unit | string | "" | 单位 |
| color | string | var(--accent) | 弧线颜色 |
| duration | number | 1.2 | 动画时长 |

### 媒体类

**ImageFrame** — 图片
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| src | string | 必填 | 图片 URL |
| fit | contain/cover | cover | 适应方式 |
| rounded | boolean | true | 圆角 |
| shadow | boolean | false | 阴影 |

**VideoFrame** — 视频
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| src | string | 必填 | 视频 URL |
| fit | contain/cover | cover | 适应方式 |
| autoplay | boolean | true | 自动播放 |

**Avatar** — 头像
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| src | string | 必填 | 图片 URL |
| size | number | 64 | 尺寸(px) |
| shape | circle/square | circle | 形状 |

**LottiePlayer** — Lottie 动画
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| src | string | 必填 | JSON URL |
| loop | boolean | true | 循环 |
| speed | number | 1 | 播放速度 |
| clipDuration | number | 3 | 片段时长(s) |

### 布局容器

容器 primitive 使用 `children` 数组嵌套子区域定义。每个 child 的结构与顶层 region 相同：`{ content: PrimitiveCall | PrimitiveCall[], gridArea?, flex?, style? }`

**Grid** — CSS Grid
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| columns | 1-4 | 2 | 列数 |
| gap | sm/md/lg | md | 间距 |
| align | start/center/end/stretch | center | 对齐 |
| children | RegionDef[] | 必填 | 子区域 |

**FlexRow / FlexCol** — Flex 容器
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| gap | sm/md/lg | md | 间距 |
| align | start/center/end/stretch | center | 对齐 |
| children | RegionDef[] | 必填 | 子区域 |

**Split** — 左右分栏
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| ratio | string | "1fr 1fr" | 比例 |
| divider | none/vs/arrow/line | line | 分割线 |
| leftLabel | string | — | 左侧标签 |
| rightLabel | string | — | 右侧标签 |
| children | RegionDef[] | 必填 | 子区域(前2个=左/右) |

**Card** — 卡片
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| padding | none/sm/md/lg | md | 内边距 |
| border | boolean | true | 边框 |
| shadow | boolean | true | 阴影 |
| children | RegionDef[] | 必填 | 子区域 |

### 装饰类

**Divider** — 分割线
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| direction | horizontal/vertical | horizontal | 方向 |
| style | solid/dashed/gradient | solid | 线型 |
| color | string | var(--accent) | 颜色 |

**Badge** — 徽章
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| text | string | 必填 | 文字 |
| color | string | var(--accent) | 颜色 |
| size | sm/md | md | 大小 |

**BorderBox** — 边框盒
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| borderWidth | number | 2 | 边框宽 |
| borderColor | string | var(--accent) | 边框色 |
| padding | none/sm/md/lg | md | 内边距 |
| children | RegionDef[] | 必填 | 子区域 |

**GradientBg** — 渐变背景
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| from | string | var(--accent) | 起始色 |
| to | string | transparent | 结束色 |
| direction | to-b/to-r/to-br/to-t | to-b | 方向 |
| opacity | 0-1 | 0.15 | 透明度 |

**NoiseBg** — 噪点纹理
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| opacity | 0-1 | 0.05 | 透明度 |

**PatternBg** — 图案背景
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| pattern | dots/grid/diagonal/crosshatch | dots | 图案 |
| opacity | 0-1 | 0.08 | 透明度 |
| color | string | var(--accent) | 颜色 |

**GlowRing** — 发光环
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| color | string | var(--accent) | 颜色 |
| size | number | 200 | 尺寸(px) |
| pulseSpeed | number | 2 | 脉冲频率 |

### 动画/SVG 类

**DrawPath** — SVG 路径自绘
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| d | string | 必填 | SVG path data |
| strokeWidth | number | 3 | 线宽 |
| color | string | var(--accent) | 颜色 |
| duration | number | 2 | 动画时长 |

**ParticleField** — 粒子场
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| behavior | flow/burst/orbit/rain | flow | 行为模式 |
| count | number | 80 | 粒子数 |
| color | string | var(--accent) | 颜色 |
| speed | number | 1 | 速度倍率 |

**WaveForm** — 波形
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| variant | sine/pulse/noise/bars | sine | 波形类型 |
| cycles | number | 2 | 周期数 |
| amplitude | number | 0.15 | 振幅 |
| color | string | var(--accent) | 颜色 |

**MagneticField** — 磁场
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| lineCount | number | 12 | 磁力线数 |
| showParticles | boolean | true | 显示粒子 |
| color | string | — | 线条色 |
| accentColor | string | — | 强调色 |

**CircuitFlow** — 电路流动画
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| nodes | [{id, x, y, type?, label?}] | 必填 | 节点 |
| wires | [{from, to, via?}] | 必填 | 连线 |
| showCurrent | boolean | true | 电流粒子 |
| duration | number | 2 | 动画时长 |

**TextGlow** — 文字发光
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| text | string | 必填 | 文字 |
| color | string | var(--accent) | 发光色 |
| intensity | number | 1 | 强度 |

**SvgReveal** — SVG 揭示
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| drawPath | string | — | 路径数据 |
| duration | number | 1.5 | 动画时长 |

### 图表/图示类

**NetworkGraph** — 节点关系图
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| nodes | [{id, label, description?, icon?, highlight?}] | 必填 | 节点 |
| edges | [{from, to, label?}] | — | 边 |
| visibleNodes | number | nodes.length | 逐步揭示 |
| layout | horizontal/vertical/radial | horizontal | 布局方向 |

**TimelineItem** — 时间线条目
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| date | string | 必填 | 日期 |
| heading | string | 必填 | 标题 |
| body | string | — | 描述 |
| highlight | boolean | false | 高亮 |

**ProcessArrow** — 流程箭头
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| steps | [{label, description?}] | 必填 | 步骤 |
| direction | horizontal/vertical | horizontal | 方向 |

**VennDiagram** — 韦恩图
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| sets | [{label, size, color?, items?}] | 必填 | 集合(2-4个) |

**GeoGlobe** — 3D 地球
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| highlightRegions | string[] | — | 高亮区域 |
| rotationSpeed | number | 0.3 | 旋转速度 |

### 包装器

**Reveal** — 入场动画（通过 animations 系统使用，不在 content 中）
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| from | up/down/left/right/none | up | 方向 |
| delay | number | 0 | 延迟(s) |
| duration | number | 0.7 | 时长(s) |
| distance | number | 32 | 位移(px) |

**Stagger** — 逐个出现（作为 region.content 数组第一个元素）
| Param | 类型 | 默认 | 说明 |
|-------|------|------|------|
| interval | number | 0.12 | 间隔(s) |
| delay | number | 0 | 首元素延迟 |
| duration | number | 0.6 | 每元素时长 |
| from | up/down/left/right/none | up | 方向 |
