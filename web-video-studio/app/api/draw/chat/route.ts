import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, type LanguageModel } from "ai";

export const maxDuration = 300;

const deepseek = createOpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

function resolveModel(modelId: string): LanguageModel {
  if (modelId.startsWith("claude-")) return anthropic(modelId);
  return deepseek.chat(modelId);
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { messages?: unknown[]; stream?: boolean; model?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, stream = false, model: modelId } = body;
  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 });
  }

  const model = resolveModel(modelId || "deepseek-v4-pro");

  // Convert messages to AI SDK format — filter out unsupported fields
  const aiMessages = messages.map((m: any) => {
    const msg: Record<string, unknown> = { role: m.role };
    if (typeof m.content === "string") {
      msg.content = m.content;
    } else if (Array.isArray(m.content)) {
      // Multimodal content parts — passthrough
      msg.content = m.content;
    } else if (m.content) {
      msg.content = String(m.content);
    }
    return msg;
  });

  if (!stream) {
    // Non-streaming: generate full response
    try {
      const result = await streamText({
        model,
        messages: aiMessages as any,
      });
      let fullContent = "";
      for await (const chunk of result.textStream) {
        fullContent += chunk;
      }
      return NextResponse.json({
        choices: [{ message: { content: fullContent } }],
      });
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message ?? "AI request failed" },
        { status: 500 }
      );
    }
  }

  // Streaming: SSE response
  const encoder = new TextEncoder();

  const streamBody = new ReadableStream({
    async start(controller) {
      try {
        const result = streamText({
          model,
          messages: aiMessages as any,
        });

        for await (const chunk of result.textStream) {
          const sseData =
            `data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e: any) {
        const errData = `data: ${JSON.stringify({ error: e?.message ?? "stream error" })}\n\n`;
        controller.enqueue(encoder.encode(errData));
        controller.close();
      }
    },
  });

  return new Response(streamBody, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
