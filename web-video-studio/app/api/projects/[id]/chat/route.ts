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
    return "AI 服务繁忙，请稍后再试";
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("abort"))
    return "AI 服务响应超时，请重试";
  if (lower.includes("502") || lower.includes("503") || lower.includes("proxy") || lower.includes("gateway"))
    return "AI 代理服务异常，请稍后重试";
  if (lower.includes("context") && (lower.includes("too long") || lower.includes("exceed") || lower.includes("maximum")))
    return "对话上下文过长，请开始新对话";
  return "连接中断，请重试";
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

export const maxDuration = 600;

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

  const messages = rows.map((r) => ({
    id: r.id,
    role: r.role,
    parts: JSON.parse(r.parts),
    createdAt: new Date(r.createdAt * 1000),
  }));

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

    // Build full parts: text + tool invocations
    const parts: Array<{ type: string; text?: string; toolName?: string; input?: unknown; state?: string }> = [];

    // Add text content if present
    const textContent = await result.text;
    if (textContent) {
      parts.push({ type: "text", text: textContent });
    }

    // Add tool calls from the last step (if any)
    if (lastStep?.toolCalls) {
      for (const tc of lastStep.toolCalls) {
        parts.push({
          type: "tool-invocation",
          toolName: tc.toolName,
          input: tc.input ?? tc.args,
          state: "result",
        });
      }
    }

    if (parts.length > 0) {
      await db.insert(chatMessages).values({
        id: nanoid(12),
        projectId,
        role: "assistant",
        parts: JSON.stringify(parts),
      }).onConflictDoNothing();
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

  const modelMessages = await convertToModelMessages(prunedMessages);

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
        persistUsageBestEffort(result, id, model);
      } catch (error) {
        logger.error("Stream execute failed", { projectId: id, model });
        throw error; // re-throw so createUIMessageStream's onError handles it
      }
    },
    onError: (error) => classifyStreamError(error),
  });

  return createUIMessageStreamResponse({ stream });
}
