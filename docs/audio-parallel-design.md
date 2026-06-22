# 音频并行化 & 去对话化设计方案

> 目标：配音/BGM 不再放到流水线末尾串行等待，而是在依赖就绪时立即并行启动；音频配置脱离对话流程，仅通过 UI 面板操作。

---

## 一、现状问题

### 问题 1：音频串行等待

```
writing → building(全部章节) → audio_checkpoint → audio(TTS) → done
                                                       └→ bgm 配置
```

- TTS 要等到**所有章节构建完**才开始
- 每章的 `narrations.ts` 在 `ProjectSetChapter` 完成后就已经落盘，但没有任何机制触发 TTS
- 一个 8 章的项目，building 阶段可能跑 3-5 分钟，这段时间音频完全可以并行生成

### 问题 2：音频配置走对话流程

当前 system prompt (`getStatusGuidance`) 里：
- `"audio_checkpoint"` 状态下 AI agent 被要求引导用户
- `"audio"` 状态下 AI agent 还要解释流程
- 但实际上 AudioWorkbench / BgmWorkbench 已经是纯 UI 面板，不需要 AI 参与

→ **对话流程和 UI 面板两套机制并存，互相干扰。**

---

## 二、目标架构

```
writing → building（逐章输出 narrations.ts）
              │
              ├── 每章 narrations.ts 落盘 → 自动触发该章 TTS（后台并行）
              │
              └── 用户随时可打开「语音/BGM」面板配置参数
                  （不阻塞 building，不影响对话）

building 完成 → 用户已有全部音频 → 直接 done（不再有 audio_checkpoint）
```

关键变化：
1. **消除 `audio_checkpoint` / `audio` 状态** — 音频不再是流水线阶段
2. **TTS 变为 per-chapter 后台任务** — 每章构建完成立即触发
3. **BGM 变为始终可用的配置面板** — 不依赖任何阶段
4. **对话不再涉及音频配置** — system prompt 中删除相关指令

---

## 三、详细设计

### 3.1 状态机变更

**删除的状态**：
- `audio_checkpoint` （不再需要）
- `audio` （不再需要）

**保留的状态流转**：
```
writing → plan_checkpoint → illustration_planning → building → done
                                ↘ illustrating → typesetting → done
```

**新增的独立维度**：每章增加 `audioStatus` 字段（存在内存/磁盘，不存 DB）：

```
ChapterAudioStatus:
  - idle       （narrations.ts 尚未生成）
  - pending    （narrations.ts 已就绪，等待 TTS）
  - running    （TTS 正在合成）
  - done       （mp3 已生成）
  - skipped    （用户主动跳过）
  - error      （合成失败，可重试）
```

### 3.2 前端事件流

```
ProjectSetChapter 成功返回
        │
        ▼
前端收到 chat stream 中的 tool-result
        │
        ▼
检测到 "file written: narrations.ts" 信号
        │
        ▼
POST /api/projects/{id}/synthesize
  { action: "synthesize-chapter", chapterId: "xxx" }
        │
        ▼
后台 npm run synthesize-audio -- --chapter=xxx（增量）
        │
        ▼
前端轮询 GET /api/projects/{id}/audio-status → 更新每章状态
```

### 3.3 新增 API

#### `GET /api/projects/{id}/audio-status`

返回每章 + 全局的音频合成状态：

```json
{
  "global": { "total": 8, "done": 3, "running": 1, "pending": 4 },
  "chapters": [
    { "chapterId": "coldopen",  "status": "done",    "mp3": "public/audio/coldopen/0.mp3..." },
    { "chapterId": "why-matter", "status": "running", "progress": "2/4" },
    { "chapterId": "seo-dead",   "status": "pending" }
  ]
}
```

实现：扫描 `presentation/public/audio/` 目录 + 读取 in-memory job map。

#### `POST /api/projects/{id}/synthesize` （修改现有）

新增 action：

| action | 行为 |
|--------|------|
| `extract` | （不变）扫描全部 narrations.ts → audio-segments.json |
| `synthesize-all` | （原默认行为）合成全部章节 |
| `synthesize-chapter` | **新增**：只合成指定章节 `{ chapterId: "xxx" }` |
| `stop` | **新增**：停止当前合成任务 |

后台实现：`npm run synthesize-audio -- --chapter=<dirName>` （需修改 scaffold 模板中的 synthesize-audio.sh 支持 `--chapter` 参数）。

#### `GET /api/projects/{id}/bgm` （不变）

无需修改。BGM 面板已经独立运行。

### 3.4 自动触发机制

**触发点**：前端收到 `ProjectSetChapter` 或 `ProjectSetChapters` 的 tool-result。

在前端 `chat-panel.tsx` 或 `page.tsx` 的 stream 处理中：

```typescript
// 伪代码：在 chat stream handler 中
if (toolName === "ProjectSetChapter" && result.success) {
  // 自动触发该章的 TTS 合成（如果用户已配置语音参数）
  if (userHasConfiguredTts) {
    fetch(`/api/projects/${id}/synthesize`, {
      method: "POST",
      body: JSON.stringify({
        action: "synthesize-chapter",
        chapterId: result.chapterId,
      }),
    });
  }
}
```

**触发条件**：
- 用户已在 AudioWorkbench 中选择音色（`project.ttsVoice` 不为空）
- 项目不是 illustration-video 或 illustrated-article 类型（那些没有 narrations.ts）

如果用户**尚未选择音色**，不自动触发。等用户在面板中选好音色后，面板内提供一个「合成全部待处理章节」按钮。

### 3.5 UI 变化

#### 工具栏（始终可见）

```
[插图时间轴] [图文排版]  │  [语音 🎙] [音乐 🎶] [数字人 🧑]
```

语音按钮旁增加状态指示器：
- 无圆点：尚未配置
- 黄色脉冲：合成中 (3/8)
- 绿色 ✓：全部完成
- 红色 ✗：有失败

#### AudioWorkbench 面板改造

```
┌─────────────────────────────┐
│ 🎙 语音合成                  │
│                             │
│ 音色: [MiniMax / OpenAI]    │
│ 音色列表（现有功能）         │
│                             │
│ ─────────────────────────   │
│ 章节合成状态                 │
│                             │
│ ✓ coldopen    4/4 完成      │
│ ◐ why-matter  2/4 合成中…   │
│ ○ seo-dead     等待中       │
│ ○ conclusion  等待中        │
│                             │
│ [合成全部待处理]  [跳过全部]  │
└─────────────────────────────┘
```

- 面板从「最后阶段才打开」变为「随时可打开」
- 每个章节行的状态实时更新
- 单章可单独重试

#### BgmWorkbench 面板（基本不变）

BGM 完全不依赖 chapter 进度，保持现有设计即可。唯一改动：确保工具栏按钮在所有阶段可见。

### 3.6 System Prompt 清理

从 `lib/agent/system-prompt.ts` 中：

1. **删除** `getStatusGuidance` 中的 `case "audio_checkpoint"` 和 `case "audio"` 分支
2. **删除** `ProjectSetStatus` 的 `audio_checkpoint` / `audio` 枚举值（保留向后兼容）
3. **删除** Phase 3 / Checkpoint Audio 相关的所有指令文本
4. **删除** `"audio"` 和 `"audio_checkpoint"` 出现在 building 判断中的逻辑：
   - `const isBuilding = project.status === "building" || project.status === "audio" || project.status === "done";`
   - 改为 `const isBuilding = project.status === "building" || project.status === "done";`

### 3.7 向后兼容

- DB schema 中 `ProjectStatus` 类型保留 `"audio_checkpoint"` 和 `"audio"` 值（已存项目可能处于这些状态）
- 已有项目若处于 `audio_checkpoint` 状态，在 UI 中正常显示 AudioWorkbench
- `ProjectSetStatus` tool 仍然接受这些值，只是 system prompt 不再引导 AI 使用它们

---

## 四、实施路径

### Phase 1：BGM 去对话化（最小改动，可独立上线）

| 步骤 | 文件 | 改动 |
|------|------|------|
| 1.1 | `app/projects/[id]/page.tsx` | 工具栏中的语音/音乐按钮在**所有阶段**可见（去掉 `project.status` 条件） |
| 1.2 | `lib/agent/system-prompt.ts` | 删除 BGM/音频相关的 checkpoint 指令文本 |
| 1.3 | `lib/db/schema.ts` | `ProjectStatus` 类型保留但 system prompt 不再路由到 audio 分支 |

### Phase 2：TTS 并行化

| 步骤 | 文件 | 改动 |
|------|------|------|
| 2.1 | `app/api/projects/[id]/synthesize/route.ts` | 新增 `synthesize-chapter` action，支持单章合成 |
| 2.2 | `app/api/projects/[id]/audio-status/route.ts` | **新建**：返回 per-chapter 音频状态 |
| 2.3 | `skills/main/web-video-presentation/scripts/synthesize-audio.sh` | 支持 `--chapter=<dir>` 参数，只合成指定章节 |
| 2.4 | `app/projects/[id]/page.tsx` | 收到 `ProjectSetChapter` 成功后自动触发该章 TTS |
| 2.5 | `components/audio-workbench.tsx` | 增加章节级状态列表 + 单章重试按钮 |
| 2.6 | `components/chat-panel.tsx` | tool-result 回调中检测 chapter 构建完成 → 触发 TTS |

### Phase 3：状态机清理

| 步骤 | 文件 | 改动 |
|------|------|------|
| 3.1 | `lib/agent/system-prompt.ts` | 删除 `audio_checkpoint` / `audio` 的 status guidance |
| 3.2 | `lib/agent/tools.ts` | `ProjectSetStatus` 的 schema 中移除 `audio_checkpoint` / `audio`（或标记 deprecated） |
| 3.3 | `app/(main)/projects/` | 列表页状态标签适配 |

---

## 五、并发模型

```
时间轴 →

Chapter 1 (coldopen)   ████████░░░░░░░░  building → TTS ████
Chapter 2 (why-matter) ░░░░████████░░░░░░  building → TTS ████
Chapter 3 (seo-dead)   ░░░░░░░░████████░░  building → TTS ████
Chapter 4 (conclusion) ░░░░░░░░░░░░██████  building → TTS ████
BGM 配置               ██████████████████  随时可操作，不影响任何流程
用户对话               ██████████████████  全程可用，不受音频阻塞
```

- Building 阶段 AI agent 仍在逐章构建（顺序或并行取决于 devMode）
- 每章完成后 TTS 在**后台独立进程**中运行
- 用户在前端看到两套进度条：构建进度 + 音频进度
- 全部完成后自动进入 `done`

---

## 六、风险与注意事项

1. **并发 TTS 调用**：如果 building 很快（并行模式），可能同时跑多个 TTS 进程。需要限制并发数（建议最多 2-3 个并发 TTS 进程）。
2. **TTS provider 限流**：MiniMax API 可能有并发限制，需要在 `synthesize-audio.sh` 或 Node 层加队列。
3. **磁盘空间**：音频文件（.mp3）可能较大，需在项目清理时一并删除。
4. **向后兼容**：已有项目处于 `audio_checkpoint` / `audio` 状态的需要正常工作——前端继续显示 AudioWorkbench，只是不再通过 AI agent 引导。
