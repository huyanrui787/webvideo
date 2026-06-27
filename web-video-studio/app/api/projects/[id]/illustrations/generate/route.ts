import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { illustrationShots } from "@/lib/db/schema";
import { requireProjectAccess } from "@/lib/api-helpers";
import { eq, and, inArray, sql } from "drizzle-orm";
import { buildImagePrompt } from "@/lib/illustration-prompt";
import { generateImage } from "@/lib/image-gen";
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
  const retry = body.retry === true;

  // Auto-import from illustrations.json if DB is empty
  const existingShots = await db
    .select({ id: illustrationShots.id })
    .from(illustrationShots)
    .where(eq(illustrationShots.projectId, projectId))
    .limit(1);

  if (existingShots.length === 0) {
    const illPath = path.join(projectDir(projectId), "illustrations.json");
    if (fs.existsSync(illPath)) {
      try {
        const illData = JSON.parse(fs.readFileSync(illPath, "utf-8"));
        const shotsFromFile = illData.shots ?? [];
        if (shotsFromFile.length > 0) {
          const { nanoid } = await import("nanoid");
          const now = Math.floor(Date.now() / 1000);
          const records = shotsFromFile.map((s: any, i: number) => ({
            id: nanoid(), projectId,
            chapterId: s.chapterId ?? s.chapter ?? "",
            stepIdx: s.stepIdx ?? s.stepHint ?? (() => { const m = String(s.id ?? "").match(/step-(\d+)/); return m ? parseInt(m[1], 10) - 1 : i; })(),
            theme: s.theme ?? "midnight-press",
            structureType: (s.structureType ?? s.structure ?? s.composition ?? "concept-metaphor") as any,
            coreIdea: (s.coreIdea ?? s.anchorMoment ?? s.description ?? "").slice(0, 200),
            xiaoheiAction: s.xiaoheiAction ?? null,
            elements: JSON.stringify(s.elements ?? []),
            labels: JSON.stringify(s.labels ?? s.annotations ?? []),
            styleHint: s.styleHint ?? s.prompt ?? null,
            sortOrder: i,
            generationStatus: "pending" as const,
            createdAt: now,
          }));
          await db.insert(illustrationShots).values(records);
          console.log(`[illustrations/generate] Auto-imported ${records.length} shots from illustrations.json`);
        }
      } catch (err) {
        console.error("[illustrations/generate] Failed to import from illustrations.json:", err);
      }
    }
  }

  // Query pending shots
  const conditions = [eq(illustrationShots.projectId, projectId)];
  if (shotIds && shotIds.length > 0) {
    conditions.push(inArray(illustrationShots.id, shotIds));
  } else if (retry) {
    // Include both pending and previously-failed shots
    conditions.push(
      inArray(illustrationShots.generationStatus, ["pending", "error"])
    );
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
          const prompt = buildImagePrompt(shot, shot.styleHint ?? undefined);

          // Update prompt in DB
          await db
            .update(illustrationShots)
            .set({ generationStatus: "generating", promptEn: prompt })
            .where(eq(illustrationShots.id, shot.id));

          // Call image generation
          const result = await generateImage({ prompt });

          // Save to project assets — use deterministic step-NN naming (consistent with all other paths)
          const filename = `step-${String(shot.stepIdx + 1).padStart(2, "0")}.png`;
          const relativePath = `assets/illustrations/${filename}`;

          const buffer = result.buffer;

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

  // Auto-write illust-timeline.json with real assetUrls
  try {
    const doneShots = shots.filter((s) => results.some((r) => r.id === s.id && r.status === "done"));
    const timelineEntries = doneShots.map((s) => ({
      shotId: s.id,
      chapterId: s.chapterId,
      stepIdx: s.stepIdx,
      assetUrl: s.assetUrl,
    }));
    const timelinePath = path.join(projectDir(projectId), "illust-timeline.json");
    fs.writeFileSync(timelinePath, JSON.stringify({ timeline: timelineEntries, generatedAt: Date.now() }, null, 2));
  } catch { /* best-effort */ }

  return NextResponse.json({
    ok: true,
    totalShots: shots.length,
    doneCount,
    errorCount,
    results,
  });
}
