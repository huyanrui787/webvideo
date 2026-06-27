import { getModel } from "@/lib/model-provider";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import { writeProjectFile } from "@/lib/projects";
import { requireProjectAccess } from "@/lib/api-helpers";

export const maxDuration = 120;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error: accessError } = await requireProjectAccess(req, id);
  if (accessError) return accessError;

  let topic: string;
  try {
    ({ topic } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!topic?.trim()) {
    return NextResponse.json({ error: "topic required" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = streamText({
          model: getModel("deepseek-v4-pro"),
          system: `你是一位擅长知识科普的内容创作者。根据用户给出的主题，写一篇适合制作成视频演示的中文科普文章。

要求：
- 长度：1500~3000 字
- 结构清晰，分 4~8 个小节，每节有明确标题
- 语言生动，口语化，适合转成口播稿
- 每个小节聚焦一个核心概念，避免大段堆砌
- 结尾有简短总结或升华
- 直接输出 Markdown 格式正文，不要前言、不要解释`,
          prompt: `主题：${topic.trim()}`,
        });

        let fullText = "";
        for await (const chunk of result.textStream) {
          fullText += chunk;
          controller.enqueue(encoder.encode(chunk));
        }

        if (!fullText.trim()) {
          controller.enqueue(encoder.encode("[错误] AI 未生成任何内容，请重试。"));
        } else {
          try {
            writeProjectFile(id, "article.md", fullText);
          } catch (err) {
            console.error(`[generate-article] write failed for ${id}:`, (err as Error).message);
          }
        }
      } catch (err) {
        const msg = `[错误] 生成失败：${err instanceof Error ? err.message : "未知错误"}`;
        controller.enqueue(encoder.encode(msg));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
