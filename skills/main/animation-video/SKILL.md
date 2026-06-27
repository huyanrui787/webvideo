---
name: animation-video
description: 把文章做成全屏 AI 动画 + 语音旁白的动态视频。流程：文章 → 口播稿 + 动画设计 → 自动生成视频 → 播放清单。不需要写代码，没有脚手架。
---

# Animation Video（动态视频）

把一篇文章转化为 AI 动画 + 语音旁白的视频。纯视频幻灯片，**不需要网页开发、不需要写代码**。

## 适用场景

- "把这篇文章做成动态视频"
- 需要全屏 AI 动画 + 配音的内容
- 纯视觉叙事，不涉及网页交互

## 项目环境

本项目**没有以下设施**：
- ❌ 没有 Vite + React 脚手架
- ❌ 没有 `presentation/src/chapters/` 目录
- ❌ 没有 TypeScript 类型检查
- ❌ 没有 Blueprint 构建系统
- ❌ 没有 Chapter Craft 指南

**唯一需要的文件**：`article.md`、`script.md`、`animations.json`、`manifest.json`。

## 工作流

```
Phase 1 写作（AI 执行）
  读 article.md → 写 script.md（口播稿，--- 分隔节拍，20-50 节拍）
  → 写 animations.json（每节拍一个视频片段设计）
  → ProjectSetStatus("animating")
  ▼
Phase 2 自动生成（系统全自动，AI 不参与）
  系统检测 animations.json
  → 自动调用文生视频 API 生成每段视频 MP4
  → 自动合成配音 MP3
  → 自动生成 anim-timeline.json
  → 自动生成 manifest.json（播放清单）
  ▼
Phase 3 完成（AI 执行）
  系统通知"动画和配音已全部完成"
  → AI 调用 ProjectSetStatus("done")
```

## Phase 1 详解 —— 写作（在同一个回复中一次完成）

**⚠️ 已有文件不重写。在同一个回复中一次性完成以下全部操作。**

不要叙述你的操作过程——直接执行工具调用。

### 步骤 A：如 script.md 不存在，写口播稿
- `ProjectRead("article.md")` 读取原文
- `ProjectWrite("script.md", ...)` 写口播稿
- 用 `---` 分隔每个节拍，全文 20-50 个节拍
- 每个节拍 = 一段动画视频 + 一段配音

### 步骤 B：紧接着步骤 A，写动画设计
- `ProjectWrite("animations.json", ...)` 写动画设计

animations.json 格式和字段说明见系统提示词。

### 步骤 C：推进状态
- 写完 animations.json 后，调用 `ProjectSetStatus("animating")`
- ⛔ **禁止**调用 `ProjectSetStatus("building")` — 本项目没有脚手架和代码构建
- ⛔ **禁止**调用 `ProjectSetStatus("illustrating")` — 本项目走动画生成管线

## Phase 3 详解 —— 完成

系统通知"动画和配音已全部完成，manifest.json 已自动生成"后：
- 调用 `ProjectSetStatus("done")`
- 不需要做其他操作

## 跨阶段规则

- **语言**：所有对话消息用中文
- **已有文件不重写**：每个新回合先检查文件是否存在
- **断点续传**：script.md 已存在 → 跳过步骤 A，直接从步骤 B 继续
- **不要叙述**：不要写"现在开始写"之类的过渡语，直接执行工具调用
- **不要反问**：不要问用户"要不要调整""有没有意见"
