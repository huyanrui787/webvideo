import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articleLayouts } from "@/lib/db/schema";
import { illustrationShots } from "@/lib/db/schema";
import { requireProjectAccess } from "@/lib/api-helpers";
import { eq } from "drizzle-orm";
import type { LayoutBlock } from "@/lib/db/schema";
import { renderToHTML } from "@/lib/article-export";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const { project, error } = await requireProjectAccess(req, projectId);
  if (error) return error;
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Load layout
  const layoutRow = await db
    .select()
    .from(articleLayouts)
    .where(eq(articleLayouts.projectId, projectId))
    .limit(1)
    .then((rows) => rows[0]);

  const blocks: LayoutBlock[] = layoutRow ? JSON.parse(layoutRow.blocks) : [];

  // Load shots for image URLs
  const shots = await db
    .select()
    .from(illustrationShots)
    .where(eq(illustrationShots.projectId, projectId));

  // Merge shot asset URLs into layout blocks
  const shotMap = new Map(shots.map((s) => [s.id, s]));
  const resolvedBlocks = blocks.map((b) => {
    if (b.type === "illustration" && b.shotId && shotMap.has(b.shotId)) {
      const shot = shotMap.get(b.shotId)!;
      return { ...b, illustrationUrl: shot.assetUrl ?? undefined };
    }
    return b;
  });

  const html = renderToHTML(resolvedBlocks, project.title);

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
