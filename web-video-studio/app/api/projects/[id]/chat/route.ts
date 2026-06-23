import {
  streamText,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
  convertToModelMessages,
} from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { deepseek as deepseekProvider } from "@ai-sdk/deepseek";
import { makeAgentTools } from "@/lib/agent/tools";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import { requireProjectAccess } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { tokenUsage, chatMessages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { pruneMessages } from "@/lib/agent/prune-messages";
import { loadSkillContext } from "@/lib/agent/skill-context";
import { logger, reqId } from "@/lib/logger";
import { getSkill, MAIN_SKILL_ID } from "@/lib/skills";
import { projectDir } from "@/lib/projects";
import fs from "fs";
import path from "path";

function getSkillRoot(): string {
  const skill = getSkill(MAIN_SKILL_ID);
  return skill?.path ?? process.cwd().replace(/\/web-video-studio$/, "") + "/web-video-presentation";
}

const DEFAULT_MODEL = "deepseek-v4-pro";

/** Classify stream errors into user-friendly Chinese messages */
function classifyStreamError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  if (lower.includes("401") || lower.includes("unauthorized") || lower.includes("invalid api key"))
    return "AI 服务认证失败，请在设置中检查 API 密钥";
  if (lower.includes("429") || lower.includes("rate limit"))
    return "AI 服务繁忙，请稍后再试。已生成的内容不会丢失。";
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("abort"))
    return "AI 服务响应超时。刷新页面即可恢复，已生成的章节和文件不会丢失。";
  if (lower.includes("502") || lower.includes("503") || lower.includes("proxy") || lower.includes("gateway"))
    return "AI 代理服务异常，请稍后重试。已生成的内容已保存。";
  if (lower.includes("context") && (lower.includes("too long") || lower.includes("exceed") || lower.includes("maximum")))
    return "对话上下文过长，请开始新对话";
  return "连接中断 — 刷新页面即可恢复，已生成的内容不会丢失。";
}

// Anthropic base URL (from env for proxy support, defaults to api.anthropic.com)
const anthropicBaseURL = process.env.ANTHROPIC_BASE_URL || undefined;

/** Choose the right AI provider based on model ID */
function getModel(modelId: string) {
  if (modelId.startsWith("deepseek")) {
    return deepseekProvider(modelId);
  }
  if (modelId.startsWith("claude")) {
    return anthropic(modelId, { baseURL: anthropicBaseURL });
  }
  // Fallback: try Anthropic first
  return anthropic(modelId, { baseURL: anthropicBaseURL });
}

export const maxDuration = 3600; // 1 hour — long writing+building flows need headroom

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.projectId, id))
    .orderBy(asc(chatMessages.createdAt));

  const messages = rows.map((r) => {
    let rawParts: any[] = [];
    try {
      const parsed = JSON.parse(r.parts);
      rawParts = Array.isArray(parsed) ? parsed : [];
    } catch { /* malformed → empty */ }

    // ── Normalize parts to current SDK format ──────────────────────────
    // Old SDK versions stored parts with unexpected fields (state on text parts,
    // tool-<Name> types instead of tool-invocation, etc.). This breaks
    // convertToModelMessages. Clean aggressively.
    const parts = rawParts
      .filter((p: any) => p != null && typeof p === "object")
      .map((p: any) => {
        const type: string = p.type ?? "";
        // Normalize: any "tool-<Name>" type → "tool-invocation"
        if (type.startsWith("tool-") && type !== "tool-invocation") {
          return {
            type: "tool-invocation",
            toolName: p.toolName ?? type.replace("tool-", ""),
            input: p.input ?? null,
            state: p.state ?? "result",
          };
        }
        // Normalize tool-invocation: keep only valid fields
        if (type === "tool-invocation") {
          return {
            type: "tool-invocation",
            toolName: p.toolName ?? "",
            input: p.input ?? null,
            state: p.state ?? "result",
          };
        }
        // Text parts: strip non-text fields (state, toolCallId, etc.)
        if (type === "text") {
          return { type: "text", text: String(p.text ?? "") };
        }
        // Unknown types: try to preserve as text if it has text content
        if (p.text) return { type: "text", text: String(p.text) };
        return null;
      })
      .filter((p: any) => p != null && (p.type === "text" ? (p.text?.length ?? 0) > 0 : true));

    return { id: r.id, role: r.role, parts, createdAt: new Date(r.createdAt * 1000) };
  })
    .filter((m) => m.parts.length > 0)
    .filter((m) => {
      // Drop tool-only assistant messages (no text content)
      if (m.role === "assistant" && m.parts.every((p: any) => (p.type || "").startsWith("tool-"))) return false;
      return true;
    })
    .filter((m, i, arr) => {
      // Drop consecutive duplicate user messages
      if (m.role !== "user" || i === 0) return true;
      const prev = arr[i - 1];
      if (prev?.role !== "user") return true;
      const thisText = m.parts.filter((p: any) => p.type === "text").map((p: any) => p.text ?? "").join("");
      const prevText = prev.parts.filter((p: any) => p.type === "text").map((p: any) => p.text ?? "").join("");
      return thisText !== prevText;
    });

  return Response.json({ messages });
}

/** Read completed chapter ids using the path declared in the Skill manifest. */
function getCompletedChapterIds(projectId: string): Set<string> {
  const skillCtx = loadSkillContext(getSkillRoot());
  if (!skillCtx.chapterDirPattern) return new Set();
  const chaptersDir = path.join(projectDir(projectId), skillCtx.chapterDirPattern);
  if (!fs.existsSync(chaptersDir)) return new Set();
  try {
    return new Set(
      fs.readdirSync(chaptersDir).filter((d) =>
        fs.statSync(path.join(chaptersDir, d)).isDirectory()
      )
    );
  } catch {
    return new Set();
  }
}

/**
 * Detect the chapter currently being built.
 * We look for the last `chapter_status building` signal in the message history.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectActiveChapter(messages: any[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;
    const parts = msg.parts ?? [];
    for (const part of parts) {
      const text: string = part.text ?? "";
      // Look for chapter_status building signal in text
      const m = text.match(/"type"\s*:\s*"chapter_status"[\s\S]*?"chapterId"\s*:\s*"([^"]+)"[\s\S]*?"status"\s*:\s*"building"/);
      if (m) return m[1];
    }
  }
  return null;
}

/** Best-effort DB persistence — failure must not break the stream */
async function persistUsageBestEffort(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any,
  projectId: string,
  model: string,
  assistantMsgId: string,
  accumulatedParts: Array<{ type: string; text?: string; toolName?: string; input?: unknown; state?: string }>,
) {
  try {
    const usage = await result.totalUsage;
    const inputTokens = usage?.inputTokens ?? 0;
    const outputTokens = usage?.outputTokens ?? 0;
    if (inputTokens > 0 || outputTokens > 0) {
      await db.insert(tokenUsage).values({
        id: nanoid(10),
        projectId,
        model,
        inputTokens,
        outputTokens,
      });
    }
  } catch (e) {
    logger.warn("Token usage write failed", { projectId, model });
  }

  try {
    // Capture the full assistant response including tool calls from the last step
    const steps = await result.steps;
    const lastStep = steps?.[steps.length - 1];
    const responseMessages = await result.response?.messages;

    // If nothing was saved incrementally, capture the final text + tools now
    if (accumulatedParts.length === 0) {
      const textContent = await result.text;
      if (textContent) accumulatedParts.push({ type: "text", text: textContent });
      if (lastStep?.toolCalls) {
        for (const tc of lastStep.toolCalls) {
          accumulatedParts.push({ type: "tool-invocation", toolName: tc.toolName, input: tc.input, state: "result" });
        }
      }
    }

    if (accumulatedParts.length > 0) {
      await db.insert(chatMessages).values({
        id: assistantMsgId,
        projectId,
        role: "assistant",
        parts: JSON.stringify(accumulatedParts),
      }).onConflictDoUpdate({ target: chatMessages.id, set: { parts: JSON.stringify(accumulatedParts) } });
    }
  } catch (e) {
    logger.warn("Message persist failed", { projectId });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { project, error } = await requireProjectAccess(req, id);
  if (error) return error;
  if (!project) return new Response("Project not found", { status: 404 });

  const model = project.model ?? DEFAULT_MODEL;

  const { messages } = await req.json();

  // Persist any new messages that aren't already in the DB.
  const existingIds = new Set(
    (
      await db
        .select({ id: chatMessages.id })
        .from(chatMessages)
        .where(eq(chatMessages.projectId, id))
    ).map((r) => r.id)
  );

  for (const msg of messages) {
    if (!existingIds.has(msg.id) && (msg.role === "user" || msg.role === "assistant")) {
      const parts = (msg.parts ?? []).filter(
        (p: { type?: string }) => p.type === "text" || String(p.type ?? "").startsWith("tool-")
      );
      if (parts.length === 0 && msg.role === "user") {
        const text = typeof msg.content === "string" ? msg.content : "";
        if (text) parts.push({ type: "text", text });
      }
      if (parts.length > 0) {
        await db.insert(chatMessages).values({
          id: msg.id,
          projectId: id,
          role: msg.role,
          parts: JSON.stringify(parts),
        }).onConflictDoNothing();
      }
    }
  }

  // ── Smart context pruning ──────────────────────────────────────────────────
  // Only prune when there's enough history to matter (>3 messages)
  // and we're in a tool-heavy phase (building / done).
  const shouldPrune = messages.length > 3 && (
    project.status === "building" ||
    project.status === "done"
  );

  const prunedMessages = shouldPrune
    ? pruneMessages(messages, {
        status: project.status,
        completedChapterIds: getCompletedChapterIds(id),
        activeChapterId: detectActiveChapter(messages),
        skill: loadSkillContext(getSkillRoot()),
      })
    : messages;

  // Single message ID for this AI response — incremental + final persistence share it
  const assistantMsgId = nanoid(12);
  // Accumulate full parts across all steps for upsert
  const accumulatedParts: Array<{ type: string; text?: string; toolName?: string; input?: unknown; state?: string }> = [];

  // DeepSeek provider does not support tool-call content blocks in message history.
  // Strip tool-invocation parts before conversion — the tool results have already
  // been executed and their effects are reflected in the conversation (files written,
  // status changed). Keeping them in history causes AI_InvalidPromptError.
  const supportsToolHistory = !model.startsWith("deepseek");
  const cleanMessages = supportsToolHistory
    ? prunedMessages
    : prunedMessages.map((m: any) => ({
        ...m,
        parts: (m.parts || []).filter((p: any) => {
          const t = p.type || "";
          return t === "text" || t === "image" || t === "file";
        }),
      }));

  const modelMessages = await convertToModelMessages(cleanMessages);

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      try {
        const result = streamText({
          model: getModel(model),
          system: await buildSystemPrompt(project),
          messages: modelMessages,
          tools: makeAgentTools(id),
          stopWhen: stepCountIs(500),
          maxRetries: 2,
          timeout: 600_000,
          maxOutputTokens: 131_072,
          onStepFinish: ({ finishReason, text, toolCalls }) => {
            if (finishReason && finishReason !== "stop") {
              logger.debug("Step finished", { finishReason, toolCalls: toolCalls?.length ?? 0, textLen: text?.length ?? 0, projectId: id });
            }
            // ── Incremental persistence: accumulate parts, upsert same message ID ──
            // Each step appends to accumulatedParts, then upserts the full message.
            // If the stream dies mid-response, the DB has all steps completed so far.
            if (text) accumulatedParts.push({ type: "text", text });
            if (toolCalls) {
              for (const tc of toolCalls) {
                accumulatedParts.push({ type: "tool-invocation", toolName: tc.toolName, input: tc.input, state: "result" });
              }
            }
            if (accumulatedParts.length > 0) {
              db.insert(chatMessages).values({
                id: assistantMsgId,
                projectId: id,
                role: "assistant",
                parts: JSON.stringify(accumulatedParts),
              }).onConflictDoUpdate({ target: chatMessages.id, set: { parts: JSON.stringify(accumulatedParts) } }).catch(() => {});
            }
          },
          onFinish: (event) => {
            const reason = event.finishReason;
            const steps = event.steps?.length ?? 0;
            const usage = event.totalUsage;
            if (reason !== "stop") {
              logger.warn("Stream finished with non-stop reason", { reason, steps, inputTokens: usage?.inputTokens, outputTokens: usage?.outputTokens, projectId: id });
            }
          },
        });

        writer.merge(result.toUIMessageStream());

        // DB writes are best-effort — they must not break the stream
        persistUsageBestEffort(result, id, model, assistantMsgId, accumulatedParts);
      } catch (error) {
        logger.error("Stream execute failed", { projectId: id, model });
        throw error;
      }
    },
    onError: (error) => classifyStreamError(error),
  });

  return createUIMessageStreamResponse({ stream });
}
