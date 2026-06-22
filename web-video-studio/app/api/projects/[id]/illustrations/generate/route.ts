import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { illustrationShots } from "@/lib/db/schema";
import { requireProjectAccess } from "@/lib/api-helpers";
import { eq, and, inArray } from "drizzle-orm";
import { buildImagePrompt } from "@/lib/illustration-prompt";
import { generateImage } from "@/lib/fal";
import { projectDir } from "@/lib/projects";
import fs from "fs";
import path from "path";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const { project, error } = await requireProjectAccess(req, projectId);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const shotIds: string[] | undefined = body.shotIds;
  const concurrency = body.concurrency ?? 2;

  // Query pending shots
  const conditions = [eq(illustrationShots.projectId, projectId)];
  if (shotIds && shotIds.length > 0) {
    conditions.push(inArray(illustrationShots.id, shotIds));
  } else {
    conditions.push(eq(illustrationShots.generationStatus, "pending"));
  }

  const shots = await db
    .select()
    .from(illustrationShots)
    .where(and(...conditions))
    .orderBy(illustrationShots.sortOrder);

  if (shots.length === 0) {
    return NextResponse.json({ ok: true, message: "No pending shots", totalShots: 0 });
  }

  // Mark all as prompting
  const shotIdsAll = shots.map((s) => s.id);
  await db
    .update(illustrationShots)
    .set({ generationStatus: "prompting" })
    .where(inArray(illustrationShots.id, shotIdsAll));

  // Generate in batches with concurrency limit
  const results: Array<{ id: string; status: "done" | "error"; error?: string }> = [];

  for (let i = 0; i < shots.length; i += concurrency) {
    const batch = shots.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (shot) => {
        try {
          const prompt = buildImagePrompt(shot);

          // Update prompt in DB
          await db
            .update(illustrationShots)
            .set({ generationStatus: "generating", promptEn: prompt })
            .where(eq(illustrationShots.id, shot.id));

          // Call DashScope
          const result = await generateImage({ prompt });

          // Download and save to project assets
          const ext = ".png";
          const filename = `${shot.chapterId}-${String(shot.stepIdx).padStart(2, "0")}-${shot.id.slice(0, 6)}${ext}`;
          const relativePath = `assets/illustrations/${filename}`;

          // Download the image
          const imageRes = await fetch(result.imageUrl);
          if (!imageRes.ok) throw new Error(`Download failed: ${imageRes.status}`);
          const buffer = Buffer.from(await imageRes.arrayBuffer());

          // Save binary to project assets
          const fullPath = path.join(projectDir(projectId), relativePath);
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });
          fs.writeFileSync(fullPath, buffer);

          // Update DB
          await db
            .update(illustrationShots)
            .set({
              generationStatus: "done",
              assetFilename: filename,
              assetUrl: `/api/projects/${projectId}/assets/${encodeURIComponent(`illustrations/${filename}`)}`,
            })
            .where(eq(illustrationShots.id, shot.id));

          return { id: shot.id, status: "done" as const };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          await db
            .update(illustrationShots)
            .set({ generationStatus: "error", generationError: msg })
            .where(eq(illustrationShots.id, shot.id));
          return { id: shot.id, status: "error" as const, error: msg };
        }
      })
    );

    for (const r of batchResults) {
      results.push(r.status === "fulfilled" ? r.value : { id: "", status: "error", error: r.reason?.message });
    }
  }

  const doneCount = results.filter((r) => r.status === "done").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    ok: true,
    totalShots: shots.length,
    doneCount,
    errorCount,
    results,
  });
}
