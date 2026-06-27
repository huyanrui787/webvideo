/**
 * Direct illustration generation — bypasses the chat/AI signal pipeline.
 * Usage: npx tsx scripts/generate-illustrations.ts <projectId>
 *
 * Features:
 * - Auto-retry up to 3 times per failed shot
 * - Failed shots marked as "error" in DB with error message
 * - Outputs full timeline (all shots, including errors) with stepIdx-based audio
 * - No positional offset between images and audio
 */
import fs from "fs";
import path from "path";
import { db } from "../lib/db";
import { illustrationShots, projects } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { buildImagePrompt } from "../lib/illustration-prompt";
import { generateImage } from "../lib/image-gen";
import { getAudioFileDuration, estimateDuration } from "../lib/audio-utils";
import { projectDir } from "../lib/projects";

const projectId = process.argv[2];
if (!projectId) {
  console.error("Usage: npx tsx scripts/generate-illustrations.ts <projectId>");
  process.exit(1);
}

const MAX_RETRIES = 3;
const CONCURRENCY = 20;
const RETRY_DELAY_MS = 1500;

async function main() {
  const pDir = projectDir(projectId);
  const illPath = path.join(pDir, "illustrations.json");

  // ── PID lock: prevent duplicate instances ─────────────────────────
  const lockFile = path.join(pDir, ".gen-lock");
  if (fs.existsSync(lockFile)) {
    try {
      const pid = parseInt(fs.readFileSync(lockFile, "utf-8").trim(), 10);
      // Check if process is still running (kill 0 = test existence)
      process.kill(pid, 0);
      console.log(`Another instance (PID ${pid}) is already running. Exiting.`);
      process.exit(0);
    } catch {
      // Stale lock — clean up
      fs.unlinkSync(lockFile);
    }
  }
  fs.writeFileSync(lockFile, String(process.pid));
  const cleanupLock = () => {
    try { if (fs.existsSync(lockFile) && fs.readFileSync(lockFile, "utf-8").trim() === String(process.pid)) fs.unlinkSync(lockFile); } catch {}
  };
  process.on("exit", cleanupLock);
  process.on("SIGINT", () => { cleanupLock(); process.exit(0); });
  process.on("SIGTERM", () => { cleanupLock(); process.exit(0); });

  // 1. Read illustrations.json
  if (!fs.existsSync(illPath)) {
    console.error("illustrations.json not found at", illPath);
    process.exit(1);
  }
  const illData = JSON.parse(fs.readFileSync(illPath, "utf-8"));
  const shotsFromFile = illData.shots ?? [];
  console.log(`Found ${shotsFromFile.length} shots in illustrations.json`);

  // 2. Check DB — import if needed
  const existing = await db
    .select({ id: illustrationShots.id })
    .from(illustrationShots)
    .where(eq(illustrationShots.projectId, projectId));

  if (existing.length === 0) {
    const { nanoid } = await import("nanoid");
    const now = Math.floor(Date.now() / 1000);
    const records = shotsFromFile.map((s: any, i: number) => ({
      id: nanoid(),
      projectId,
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
    console.log(`Imported ${records.length} shots to DB`);
  } else {
    console.log(`${existing.length} shots already in DB, skipping import`);
  }

  // 3. Fetch pending shots from DB
  const shots = await db
    .select()
    .from(illustrationShots)
    .where(eq(illustrationShots.projectId, projectId))
    .orderBy(illustrationShots.sortOrder);

  // ── Validate DB against illustrations.json ─────────────────────────
  // If AI modified illustrations.json since last import, DB content may be
  // stale — wrong coreIdea per step_idx produces misaligned images.
  let needsReimport = shots.length !== shotsFromFile.length;
  if (!needsReimport) {
    for (let i = 0; i < shotsFromFile.length; i++) {
      const dbShot = shots.find(s => s.sortOrder === i);
      const fileCore = (shotsFromFile[i].coreIdea ?? shotsFromFile[i].anchorMoment ?? shotsFromFile[i].description ?? "").slice(0, 200);
      if (!dbShot || (dbShot.coreIdea ?? "").slice(0, 200) !== fileCore) {
        needsReimport = true;
        break;
      }
    }
  }
  if (needsReimport) {
    console.log("DB mismatch with illustrations.json — re-importing...");
    await db.delete(illustrationShots).where(eq(illustrationShots.projectId, projectId));
    const { nanoid: ni } = await import("nanoid");
    const now = Math.floor(Date.now() / 1000);
    const records = shotsFromFile.map((s: any, i: number) => ({
      id: ni(), projectId,
      chapterId: s.chapterId ?? s.chapter ?? "",
      stepIdx: s.stepIdx ?? s.stepHint ?? (() => { const m = String(s.id ?? "").match(/step-(\d+)/); return m ? parseInt(m[1], 10) - 1 : i; })(),
      theme: s.theme ?? "midnight-press",
      structureType: (s.structureType ?? s.structure ?? s.composition ?? "concept-metaphor") as any,
      coreIdea: (s.coreIdea ?? s.anchorMoment ?? s.description ?? "").slice(0, 200),
      xiaoheiAction: s.xiaoheiAction ?? null,
      elements: JSON.stringify(s.elements ?? []),
      labels: JSON.stringify(s.labels ?? s.annotations ?? []),
      styleHint: s.styleHint ?? s.prompt ?? null,
      sortOrder: i, generationStatus: "pending" as const, createdAt: now,
    }));
    await db.insert(illustrationShots).values(records);
    console.log(`Re-imported ${records.length} shots`);
    // Reload shots from DB
    const reloaded = await db.select().from(illustrationShots).where(eq(illustrationShots.projectId, projectId)).orderBy(illustrationShots.sortOrder);
    shots.length = 0; shots.push(...reloaded);
  }

  // ── Clean up orphan image files ────────────────────────────────────
  const validStepNums = new Set(shots.map(s => s.stepIdx + 1));
  const assetsDir = path.join(pDir, "assets", "illustrations");
  if (fs.existsSync(assetsDir)) {
    for (const f of fs.readdirSync(assetsDir)) {
      const m = f.match(/^step-(\d+)\.png$/);
      if (m && !validStepNums.has(parseInt(m[1], 10))) {
        fs.unlinkSync(path.join(assetsDir, f));
        console.log(`  Cleaned orphan: ${f}`);
      }
    }
  }

  const pending = shots.filter(s => s.generationStatus !== "done");
  console.log(`${pending.length} shots to generate (${shots.length - pending.length} already done)`);

  if (pending.length === 0) {
    console.log("All shots already generated!");
    // Still rebuild timeline in case audio was added later
    await rebuildTimeline(shots);
    process.exit(0);
  }

  // 3b. Load project styleConfig
  const proj = await db
    .select({ styleConfig: projects.styleConfig })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  const styleConfig = proj.length ? JSON.parse(proj[0].styleConfig || "{}") : null;

  // 4. Generate images with retry
  fs.mkdirSync(assetsDir, { recursive: true });

  let errors = 0;
  let offset = 0;

  while (offset < pending.length) {
    const batch = pending.slice(offset, offset + CONCURRENCY);
    console.log(`\nBatch ${Math.floor(offset / CONCURRENCY) + 1}: ${batch.length} shots (${offset + 1}-${Math.min(offset + CONCURRENCY, pending.length)}/${pending.length})`);

    const results = await Promise.allSettled(batch.map(async (shot) => {
      const prompt = buildImagePrompt(shot, shot.styleHint ?? undefined, styleConfig);
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 1) {
          const delay = RETRY_DELAY_MS + Math.random() * 1000;
          console.log(`  ⏳ Retry ${attempt}/${MAX_RETRIES} for ${shot.id.slice(0, 12)}... (wait ${Math.round(delay)}ms)`);
          await new Promise(r => setTimeout(r, delay));
        }

        await db.update(illustrationShots).set({ generationStatus: "generating", promptEn: prompt }).where(eq(illustrationShots.id, shot.id));

        try {
          const result = await generateImage({ prompt });

          // Save with final step-NN name (1-based), no rename phase needed
          const filename = `step-${String(shot.stepIdx + 1).padStart(2, "0")}.png`;
          fs.writeFileSync(path.join(assetsDir, filename), result.buffer);

          const assetUrl = `/api/projects/${projectId}/assets/${encodeURIComponent(`illustrations/${filename}`)}`;
          await db.update(illustrationShots).set({
            generationStatus: "done",
            assetFilename: filename,
            assetUrl,
          }).where(eq(illustrationShots.id, shot.id));

          console.log(`  ✅ ${shot.id.slice(0, 12)}... (${result.buffer.length} bytes)`);
          return { shotId: shot.id, chapterId: shot.chapterId, stepIdx: shot.stepIdx, assetUrl, size: result.buffer.length };
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.log(`  Attempt ${attempt} failed: ${lastError.message}`);
        }
      }

      // All retries exhausted — mark as error
      const errMsg = lastError?.message ?? "Unknown error";
      await db.update(illustrationShots).set({
        generationStatus: "error",
        generationError: errMsg,
      }).where(eq(illustrationShots.id, shot.id));

      console.error(`  ❌ ${shot.id.slice(0, 12)}... FAILED after ${MAX_RETRIES} attempts: ${errMsg}`);
      return null; // Return null for Promise.allSettled — it won't be fulfilled
    }));

    for (const r of results) {
      if (r.status === "rejected") {
        errors++;
      } else if (r.status === "fulfilled" && !r.value) {
        errors++; // All retries exhausted (returned null)
      }
    }
    offset += CONCURRENCY;
  }

  // 5. Reload ALL shots from DB (includes 'error' status shots)
  const allShots = await db
    .select()
    .from(illustrationShots)
    .where(eq(illustrationShots.projectId, projectId))
    .orderBy(illustrationShots.sortOrder);

  // 6. Build full timeline (ALL entries, with stepIdx-based audio matching)
  const generatedCount = allShots.filter(s => s.generationStatus === "done").length;
  if (generatedCount > 0) {
    await rebuildTimeline(allShots);
  } else {
    // No images generated — clean up so pipeline can retry
    const genStarted = path.join(pDir, ".gen-started");
    if (fs.existsSync(genStarted)) fs.unlinkSync(genStarted);
    console.log(`\n⚠️ No images generated. Removed .gen-started to allow retry.`);
  }

  console.log(`\n✅ Complete: ${generatedCount} generated, ${errors} errors (after ${MAX_RETRIES} retries)`);
}

/**
 * Rebuild illust-timeline.json from ALL DB shots (including errors).
 * Uses stepIdx (global position) to match audio, NOT array position.
 */
async function rebuildTimeline(allShots: Array<{ id: string; chapterId: string; stepIdx: number; generationStatus: string; assetUrl: string | null; generationError: string | null }>) {
  const pDir = projectDir(projectId);
  const audioDir = path.join(pDir, "presentation", "public", "audio");

  // Build a lookup of available audio files by global index (1-indexed)
  // step/1.mp3 → global position 0, step/2.mp3 → global position 1, etc.
  const audioByIndex = new Map<number, string>();
  const stepDir = path.join(audioDir, "step");
  if (fs.existsSync(stepDir)) {
    const files = fs.readdirSync(stepDir);
    for (const f of files) {
      const match = f.match(/^(\d+)\.mp3$/);
      if (match) {
        const idx = parseInt(match[1]) - 1; // 1-indexed file → 0-indexed global position
        audioByIndex.set(idx, `step/${f}`);
      }
    }
  }

  // Read script segments for duration fallback
  const script = fs.existsSync(path.join(pDir, "script.md"))
    ? fs.readFileSync(path.join(pDir, "script.md"), "utf-8") : "";
  const segments = script.split("---").map(s => s.trim()).filter(Boolean).map(s => s.replace(/^\[.*?\]\s*/, "").trim());

  const timeline = allShots.map((shot) => {
    const audioFile = audioByIndex.get(shot.stepIdx); // Use GLOBAL stepIdx, not array position

    // Determine actual duration from audio file
    let durationSec = 5;
    const textFallback = (shot.stepIdx >= 0 && shot.stepIdx < segments.length) ? segments[shot.stepIdx] : undefined;
    if (audioFile) {
      const fullPath = path.join(pDir, "presentation", "public", "audio", audioFile);
      durationSec = getAudioFileDuration(fullPath, textFallback);
    } else if (textFallback) {
      durationSec = estimateDuration(textFallback);
    }

    return {
      shotId: shot.id,
      chapterId: shot.chapterId,
      stepIdx: shot.stepIdx,
      assetUrl: shot.generationStatus === "done" ? (shot.assetUrl ?? undefined) : undefined,
      mp3Path: audioFile ?? undefined,
      durationSec,
      status: shot.generationStatus,
      error: shot.generationError ?? undefined,
    };
  });

  const tlPath = path.join(pDir, "illust-timeline.json");
  fs.writeFileSync(tlPath, JSON.stringify({ timeline, generatedAt: Date.now() }, null, 2));

  // Also generate manifest.json so it's available immediately
  generateManifest(pDir, projectId, timeline, audioByIndex);

  const withAudio = timeline.filter(e => e.mp3Path).length;
  const withImage = timeline.filter(e => e.assetUrl).length;
  const failed = timeline.filter(e => e.status === "error").length;
  console.log(`Timeline written: ${withImage} with images, ${withAudio} with audio, ${failed} errors`);
}

/**
 * Generate manifest.json from the full timeline, using stepIdx for audio/text alignment.
 */
function generateManifest(
  pDir: string,
  projectId: string,
  timeline: Array<{ shotId: string; chapterId: string; stepIdx: number; assetUrl?: string; mp3Path?: string; durationSec?: number; status?: string; error?: string }>,
  audioByIndex: Map<number, string>,
) {
  const script = fs.existsSync(path.join(pDir, "script.md"))
    ? fs.readFileSync(path.join(pDir, "script.md"), "utf-8") : "";
  const segments = script.split("---").map(s => s.trim()).filter(Boolean).map(s => s.replace(/^\[.*?\]\s*/, "").trim());

  const steps = timeline.map((entry) => {
    const segIdx = entry.stepIdx;
    const audioFile = audioByIndex.get(segIdx);
    const audioUrl = audioFile
      ? `/api/projects/${projectId}/audio/${audioFile}`
      : undefined;

    // Use actual duration from timeline (measured from audio file), or fallback to text estimation
    let durationSec = entry.durationSec ?? 5;
    if (durationSec <= 0 || durationSec === 5) {
      // Re-measure if not available from timeline entry
      if (audioFile) {
        const fullPath = path.join(pDir, "presentation", "public", "audio", audioFile);
        const textFallback = segIdx >= 0 && segIdx < segments.length ? segments[segIdx] : undefined;
        durationSec = getAudioFileDuration(fullPath, textFallback);
      } else if (segIdx >= 0 && segIdx < segments.length) {
        durationSec = estimateDuration(segments[segIdx]);
      }
    }

    return {
      index: segIdx,
      image: entry.assetUrl || "",
      imageStatus: entry.assetUrl ? "done" : (entry.status || "error"),
      error: entry.status === "error" ? (entry.error || "Image generation failed") : undefined,
      audio: audioUrl,
      text: segIdx >= 0 && segIdx < segments.length ? segments[segIdx] : "",
      durationSec,
    };
  });

  const manifestPath = path.join(pDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify({ steps }, null, 2));
  console.log(`Manifest written: ${steps.length} steps, ${steps.filter((s: any) => s.imageStatus === "error").length} errors`);
}

main().catch(err => { console.error(err); process.exit(1); });
