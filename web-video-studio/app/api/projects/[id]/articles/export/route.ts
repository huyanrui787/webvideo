import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articleLayouts } from "@/lib/db/schema";
import { illustrationShots } from "@/lib/db/schema";
import { requireProjectAccess } from "@/lib/api-helpers";
import { eq } from "drizzle-orm";
import type { LayoutBlock } from "@/lib/db/schema";
import { renderToWechatHTML, renderToMarkdown, renderToHTML } from "@/lib/article-export";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const { project, error } = await requireProjectAccess(req, projectId);
  if (error) return error;
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const format: "wechat" | "markdown" | "html" = body.format ?? "wechat";

  // Load layout
  const layoutRow = await db
    .select()
    .from(articleLayouts)
    .where(eq(articleLayouts.projectId, projectId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!layoutRow) {
    return NextResponse.json({ error: "Layout not found. Run typesetting first." }, { status: 404 });
  }

  const blocks: LayoutBlock[] = JSON.parse(layoutRow.blocks);

  // Resolve shot URLs
  const shots = await db
    .select()
    .from(illustrationShots)
    .where(eq(illustrationShots.projectId, projectId));
  const shotMap = new Map(shots.map((s) => [s.id, s]));
  const resolvedBlocks = blocks.map((b) => {
    if (b.type === "illustration" && b.shotId && shotMap.has(b.shotId)) {
      const shot = shotMap.get(b.shotId)!;
      return { ...b, illustrationUrl: shot.assetUrl ?? undefined };
    }
    return b;
  });

  // Generate
  let content: string;
  let contentType: string;
  const title = project.title ?? "";

  switch (format) {
    case "wechat":
      content = renderToWechatHTML(resolvedBlocks, title);
      contentType = "text/html; charset=utf-8";
      break;
    case "markdown":
      content = renderToMarkdown(resolvedBlocks, title);
      contentType = "text/markdown; charset=utf-8";
      break;
    case "html":
    default:
      content = renderToHTML(resolvedBlocks, title);
      contentType = "text/html; charset=utf-8";
      break;
  }

  return NextResponse.json({ ok: true, format, content, contentType });
}
