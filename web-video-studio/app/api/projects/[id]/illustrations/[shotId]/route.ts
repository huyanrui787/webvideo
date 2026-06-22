import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { illustrationShots } from "@/lib/db/schema";
import { requireProjectAccess } from "@/lib/api-helpers";
import { eq, and } from "drizzle-orm";
import { buildImagePrompt } from "@/lib/illustration-prompt";
import { generateImage } from "@/lib/fal";
import { projectDir } from "@/lib/projects";
import fs from "fs";
import path from "path";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; shotId: string }> }
) {
  const { id: projectId, shotId } = await params;
  const { project, error } = await requireProjectAccess(req, projectId);
  if (error) return error;

  const body = await req.json();

  // ─── Regenerate mode ─────────────────────────────────────────────────

  if (body.regenerate) {
    const shot = await db
      .select()
      .from(illustrationShots)
      .where(and(eq(illustrationShots.id, shotId), eq(illustrationShots.projectId, projectId)))
      .limit(1)
      .then((rows) => rows[0]);

    if (!shot) {
      return NextResponse.json({ error: "Shot not found" }, { status: 404 });
    }

    // Build prompt
    const prompt = buildImagePrompt(shot);
    await db
      .update(illustrationShots)
      .set({ generationStatus: "generating", generationError: null, promptEn: prompt })
      .where(eq(illustrationShots.id, shotId));

    try {
      const result = await generateImage({ prompt });

      const filename = `${shot.chapterId}-${String(shot.stepIdx).padStart(2, "0")}-${shot.id.slice(0, 6)}.png`;
      const relativePath = `assets/illustrations/${filename}`;

      const imageRes = await fetch(result.imageUrl);
      if (!imageRes.ok) throw new Error(`Download failed: ${imageRes.status}`);
      const buffer = Buffer.from(await imageRes.arrayBuffer());

      const fullPath = path.join(projectDir(projectId), relativePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, buffer);

      await db
        .update(illustrationShots)
        .set({
          generationStatus: "done",
          generationError: null,
          assetFilename: filename,
          assetUrl: `/api/projects/${projectId}/assets/${encodeURIComponent(`illustrations/${filename}`)}`,
        })
        .where(eq(illustrationShots.id, shotId));

      return NextResponse.json({ ok: true, shot: { ...shot, assetUrl: `/api/projects/${projectId}/assets/${encodeURIComponent(`illustrations/${filename}`)}`, generationStatus: "done" } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await db
        .update(illustrationShots)
        .set({ generationStatus: "error", generationError: msg })
        .where(eq(illustrationShots.id, shotId));
      return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
  }

  // ─── Update metadata (KB params, sort order) ───────────────────────

  const updates: Record<string, unknown> = {};
  if (body.kenBurnsScale !== undefined) updates.kenBurnsScale = body.kenBurnsScale;
  if (body.kenBurnsPanX !== undefined) updates.kenBurnsPanX = body.kenBurnsPanX;
  if (body.kenBurnsPanY !== undefined) updates.kenBurnsPanY = body.kenBurnsPanY;
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await db
    .update(illustrationShots)
    .set(updates)
    .where(and(eq(illustrationShots.id, shotId), eq(illustrationShots.projectId, projectId)));

  const updated = await db
    .select()
    .from(illustrationShots)
    .where(eq(illustrationShots.id, shotId))
    .limit(1)
    .then((rows) => rows[0]);

  return NextResponse.json({ ok: true, shot: updated });
}
