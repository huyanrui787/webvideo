import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeProjectFile } from "@/lib/projects";

export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { url } = await req.json();

  if (!url?.trim()) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  const project = await db.query.projects.findFirst({
    where: (p, { eq }) => eq(p.id, id),
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Fetch the page with browser-like headers (needed for WeChat)
  let html: string;
  try {
    const res = await fetch(url.trim(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9",
        Referer: "https://mp.weixin.qq.com/",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `无法访问该链接（HTTP ${res.status}）` },
        { status: 400 }
      );
    }
    html = await res.text();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "网络请求失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Truncate to avoid token overload — keep first 80k chars (covers most articles)
  const truncated = html.length > 80000 ? html.slice(0, 80000) : html;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: `你是网页内容提取助手。从 HTML 源码中提取文章正文，输出干净的 Markdown。

规则：
- 只保留文章标题和正文内容，去掉导航、广告、评论、版权声明、分享按钮等无关部分
- 保留原文的段落结构和标题层级
- 图片转为 Markdown 图片语法（保留 src）
- 直接输出 Markdown，不要解释、不要前言`,
    prompt: `请提取以下网页的文章正文：\n\n${truncated}`,
  });

  let fullText = "";
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.textStream) {
        fullText += chunk;
        controller.enqueue(encoder.encode(chunk));
      }
      writeProjectFile(id, "article.md", fullText);
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
