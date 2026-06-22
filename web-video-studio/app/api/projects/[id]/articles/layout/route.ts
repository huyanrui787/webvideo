import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articleLayouts } from "@/lib/db/schema";
import { requireProjectAccess } from "@/lib/api-helpers";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const { project, error } = await requireProjectAccess(req, projectId);
  if (error) return error;

  const row = await db
    .select()
    .from(articleLayouts)
    .where(eq(articleLayouts.projectId, projectId))
    .limit(1)
    .then((rows) => rows[0]);

  return NextResponse.json({
    blocks: row ? JSON.parse(row.blocks) : [],
    themeConfig: row ? JSON.parse(row.themeConfig) : {},
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const { project, error } = await requireProjectAccess(req, projectId);
  if (error) return error;

  const body = await req.json();
  const blocks = body.blocks;
  const themeConfig = body.themeConfig ?? {};

  if (!Array.isArray(blocks)) {
    return NextResponse.json({ error: "blocks array required" }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);

  // Upsert
  const existing = await db
    .select({ id: articleLayouts.id })
    .from(articleLayouts)
    .where(eq(articleLayouts.projectId, projectId))
    .limit(1)
    .then((rows) => rows[0]);

  if (existing) {
    await db
      .update(articleLayouts)
      .set({
        blocks: JSON.stringify(blocks),
        themeConfig: JSON.stringify(themeConfig),
        updatedAt: now,
      })
      .where(eq(articleLayouts.id, existing.id));
  } else {
    await db.insert(articleLayouts).values({
      id: nanoid(),
      projectId,
      blocks: JSON.stringify(blocks),
      themeConfig: JSON.stringify(themeConfig),
      createdAt: now,
      updatedAt: now,
    });
  }

  return NextResponse.json({ ok: true, blockCount: blocks.length });
}
