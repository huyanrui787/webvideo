/**
 * Direct animation generation — bypasses the chat/AI signal pipeline.
 * Usage: npx tsx scripts/generate-animations.ts <projectId>
 *
 * Features:
 * - Auto-retry up to 3 times per failed shot
 * - Failed shots marked as "error" in DB with error message
 * - Outputs full timeline (all shots, including errors) with stepIdx-based audio
 * - Uses T2V provider adapter for video generation
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { db } from "../lib/db";
import { animationShots, projects } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { getAudioFileDuration, estimateDuration } from "../lib/audio-utils";
import { projectDir } from "../lib/projects";

const projectId = process.argv[2];
if (!projectId) {
  console.error("Usage: npx tsx scripts/generate-animations.ts <projectId>");
  process.exit(1);
}

const MAX_RETRIES = 3;
const CONCURRENCY = 5; // Lower concurrency for video generation (more resource-intensive)
const RETRY_DELAY_MS = 3000;

const REPO_ROOT = path.resolve(projectDir(""), "..");
const T2V_PROVIDERS_DIR = path.join(REPO_ROOT, "scripts", "t2v-providers");

function resolveProvider(): string {
  // Env var → check provider dir → fallback to stub
  const name = process.env.T2V_PROVIDER || "stub";
  const scriptPath = path.join(T2V_PROVIDERS_DIR, `${name}.sh`);
  if (fs.existsSync(scriptPath)) return scriptPath;
  const stubPath = path.join(T2V_PROVIDERS_DIR, "stub.sh");
  if (fs.existsSync(stubPath)) return stubPath;
  throw new Error(`No T2V provider found: ${scriptPath} (and stub.sh missing)`);
}

async function main() {
  const pDir = projectDir(projectId);
  const animPath = path.join(pDir, "animations.json");

  // ── PID lock: prevent duplicate instances ─────────────────────────
  const lockFile = path.join(pDir, ".gen-anim-lock");
  if (fs.existsSync(lockFile)) {
    try {
      const pid = parseInt(fs.readFileSync(lockFile, "utf-8").trim(), 10);
      process.kill(pid, 0);
      console.log(`Another instance (PID ${pid}) is already running. Exiting.`);
      process.exit(0);
    } catch {
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

  // 1. Read animations.json
  if (!fs.existsSync(animPath)) {
    console.error("animations.json not found at", animPath);
    process.exit(1);
  }
  const animData = JSON.parse(fs.readFileSync(animPath, "utf-8"));
  const shotsFromFile = animData.shots ?? [];
  console.log(`Found ${shotsFromFile.length} shots in animations.json`);

  // 2. Check DB — import if needed
  const existing = await db
    .select({ id: animationShots.id })
    .from(animationShots)
    .where(eq(animationShots.projectId, projectId));

  if (existing.length === 0) {
    const { nanoid } = await import("nanoid");
    const now = Math.floor(Date.now() / 1000);
    const records = shotsFromFile.map((s: any, i: number) => ({
      id: nanoid(),
      projectId,
      chapterId: s.chapterId ?? s.chapter ?? "",
      stepIdx: s.stepIdx ?? s.narrationIndex ?? (() => { const m = String(s.id ?? "").match(/step-(\d+)/); return m ? parseInt(m[1], 10) - 1 : i; })(),
      theme: s.theme ?? "cinematic",
      structureType: (s.structureType ?? s.structure ?? s.composition ?? "concept-metaphor") as any,
      videoPrompt: (s.videoPrompt ?? s.coreIdea ?? s.description ?? "").slice(0, 300),
      elements: JSON.stringify(s.elements ?? []),
      labels: JSON.stringify(s.labels ?? s.annotations ?? []),
      styleHint: s.styleHint ?? null,
      videoStyle: s.videoStyle ?? null,
      sortOrder: i,
      generationStatus: "pending" as const,
      createdAt: now,
    }));
    await db.insert(animationShots).values(records);
    console.log(`Imported ${records.length} shots to DB`);
  } else {
    console.log(`${existing.length} shots already in DB, skipping import`);
  }

  // 3. Fetch shots from DB
  const shots = await db
    .select()
    .from(animationShots)
    .where(eq(animationShots.projectId, projectId))
    .orderBy(animationShots.sortOrder);

  // ── Validate DB against animations.json ─────────────────────────
  let needsReimport = shots.length !== shotsFromFile.length;
  if (!needsReimport) {
    for (let i = 0; i < shotsFromFile.length; i++) {
      const dbShot = shots.find(s => s.sortOrder === i);
      const filePrompt = (shotsFromFile[i].videoPrompt ?? shotsFromFile[i].coreIdea ?? "").slice(0, 300);
      if (!dbShot || (dbShot.videoPrompt ?? "").slice(0, 300) !== filePrompt) {
        needsReimport = true;
        break;
      }
    }
  }
  if (needsReimport) {
    console.log("DB mismatch with animations.json — re-importing...");
    await db.delete(animationShots).where(eq(animationShots.projectId, projectId));
    const { nanoid: ni } = await import("nanoid");
    const now = Math.floor(Date.now() / 1000);
    const records = shotsFromFile.map((s: any, i: number) => ({
      id: ni(), projectId,
      chapterId: s.chapterId ?? s.chapter ?? "",
      stepIdx: s.stepIdx ?? s.narrationIndex ?? (() => { const m = String(s.id ?? "").match(/step-(\d+)/); return m ? parseInt(m[1], 10) - 1 : i; })(),
      theme: s.theme ?? "cinematic",
      structureType: (s.structureType ?? s.structure ?? s.composition ?? "concept-metaphor") as any,
      videoPrompt: (s.videoPrompt ?? s.coreIdea ?? s.description ?? "").slice(0, 300),
      elements: JSON.stringify(s.elements ?? []),
      labels: JSON.stringify(s.labels ?? s.annotations ?? []),
      styleHint: s.styleHint ?? null,
      videoStyle: s.videoStyle ?? null,
      sortOrder: i, generationStatus: "pending" as const, createdAt: now,
    }));
    await db.insert(animationShots).values(records);
    console.log(`Re-imported ${records.length} shots`);
    // Reload from DB
    const reloaded = await db.select().from(animationShots).where(eq(animationShots.projectId, projectId)).orderBy(animationShots.sortOrder);
    shots.length = 0; shots.push(...reloaded);
  }

  // ── Clean up orphan video files ──────────────────────────────────
  const validStepNums = new Set(shots.map(s => s.stepIdx + 1));
  const assetsDir = path.join(pDir, "assets", "animations");
  if (fs.existsSync(assetsDir)) {
    for (const f of fs.readdirSync(assetsDir)) {
      const m = f.match(/^step-(\d+)\.mp4$/);
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
    await rebuildTimeline(shots);
    process.exit(0);
  }

  // 4. Generate videos with retry
  fs.mkdirSync(assetsDir, { recursive: true });
  const providerScript = resolveProvider();
  console.log(`Using T2V provider: ${providerScript}`);

  let errors = 0;
  let offset = 0;

  while (offset < pending.length) {
    const batch = pending.slice(offset, offset + CONCURRENCY);
    console.log(`\nBatch ${Math.floor(offset / CONCURRENCY) + 1}: ${batch.length} shots (${offset + 1}-${Math.min(offset + CONCURRENCY, pending.length)}/${pending.length})`);

    const results = await Promise.allSettled(batch.map(async (shot) => {
      const prompt = shot.videoPrompt || "cinematic video";
      let lastError: Error | null = null;

      // Estimate duration from script segments
      let durationSec = 8;
      const scriptPath = path.join(pDir, "script.md");
      if (fs.existsSync(scriptPath)) {
        const script = fs.readFileSync(scriptPath, "utf-8");
        const segments = script.split("---").map(s => s.trim()).filter(Boolean);
        const segIdx = shot.stepIdx;
        if (segIdx >= 0 && segIdx < segments.length) {
          durationSec = estimateDuration(segments[segIdx]);
        }
      }

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 1) {
          const delay = RETRY_DELAY_MS + Math.random() * 2000;
          console.log(`  ⏳ Retry ${attempt}/${MAX_RETRIES} for ${shot.id.slice(0, 12)}... (wait ${Math.round(delay)}ms)`);
          await new Promise(r => setTimeout(r, delay));
        }

        await db.update(animationShots).set({ generationStatus: "generating", promptEn: prompt }).where(eq(animationShots.id, shot.id));

        try {
          const filename = `step-${String(shot.stepIdx + 1).padStart(2, "0")}.mp4`;
          const outputPath = path.join(assetsDir, filename);
          const durationStr = String(Math.round(durationSec * 10) / 10);

          // Call the T2V provider
          const proc = spawnSync("bash", [providerScript], {
            env: {
              ...process.env,
              PROMPT: prompt,
              OUTPUT_PATH: outputPath,
              DURATION_SEC: durationStr,
            },
            stdio: ["ignore", "pipe", "pipe"],
            timeout: 600_000,
          });

          if (proc.status !== 0 || !fs.existsSync(outputPath)) {
            const errMsg = proc.stderr?.toString()?.trim() || `exit ${proc.status}`;
            throw new Error(errMsg);
          }

          const stat = fs.statSync(outputPath);
          const assetUrl = `/api/projects/${projectId}/assets/${encodeURIComponent(`animations/${filename}`)}`;
          await db.update(animationShots).set({
            generationStatus: "done",
            assetFilename: filename,
            assetUrl,
          }).where(eq(animationShots.id, shot.id));

          console.log(`  ✅ ${shot.id.slice(0, 12)}... (${(stat.size / 1024).toFixed(0)}KB, ${durationSec}s)`);
          return { shotId: shot.id, chapterId: shot.chapterId, stepIdx: shot.stepIdx, assetUrl, size: stat.size };
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.log(`  Attempt ${attempt} failed: ${lastError.message}`);
        }
      }

      // All retries exhausted — mark as error
      const errMsg = lastError?.message ?? "Unknown error";
      await db.update(animationShots).set({
        generationStatus: "error",
        generationError: errMsg,
      }).where(eq(animationShots.id, shot.id));

      console.error(`  ❌ ${shot.id.slice(0, 12)}... FAILED after ${MAX_RETRIES} attempts: ${errMsg}`);
      return null;
    }));

    for (const r of results) {
      if (r.status === "rejected") errors++;
      else if (r.status === "fulfilled" && !r.value) errors++;
    }
    offset += CONCURRENCY;
  }

  // 5. Reload ALL shots from DB
  const allShots = await db
    .select()
    .from(animationShots)
    .where(eq(animationShots.projectId, projectId))
    .orderBy(animationShots.sortOrder);

  // 6. Build full timeline
  const generatedCount = allShots.filter(s => s.generationStatus === "done").length;
  if (generatedCount > 0) {
    await rebuildTimeline(allShots);
  } else {
    const genStarted = path.join(pDir, ".gen-anim-started");
    if (fs.existsSync(genStarted)) fs.unlinkSync(genStarted);
    console.log(`\n⚠️ No videos generated. Removed .gen-anim-started to allow retry.`);
  }

  console.log(`\n✅ Complete: ${generatedCount} generated, ${errors} errors (after ${MAX_RETRIES} retries)`);
}

/**
 * Rebuild anim-timeline.json from ALL DB shots (including errors).
 */
async function rebuildTimeline(allShots: Array<{ id: string; chapterId: string; stepIdx: number; generationStatus: string; assetUrl: string | null; generationError: string | null }>) {
  const pDir = projectDir(projectId);
  const audioDir = path.join(pDir, "presentation", "public", "audio");

  // Build audio lookup by global index
  const audioByIndex = new Map<number, string>();
  const stepDir = path.join(audioDir, "step");
  if (fs.existsSync(stepDir)) {
    const files = fs.readdirSync(stepDir);
    for (const f of files) {
      const match = f.match(/^(\d+)\.mp3$/);
      if (match) {
        const idx = parseInt(match[1]) - 1;
        audioByIndex.set(idx, `step/${f}`);
      }
    }
  }

  // Read script segments for duration fallback
  const script = fs.existsSync(path.join(pDir, "script.md"))
    ? fs.readFileSync(path.join(pDir, "script.md"), "utf-8") : "";
  const segments = script.split("---").map(s => s.trim()).filter(Boolean).map(s => s.replace(/^\[.*?\]\s*/, "").trim());

  const timeline = allShots.map((shot) => {
    const audioFile = audioByIndex.get(shot.stepIdx);
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

  const tlPath = path.join(pDir, "anim-timeline.json");
  fs.writeFileSync(tlPath, JSON.stringify({ timeline, generatedAt: Date.now() }, null, 2));

  // Also generate manifest.json
  generateManifest(pDir, projectId, timeline, audioByIndex);

  const withAudio = timeline.filter(e => e.mp3Path).length;
  const withVideo = timeline.filter(e => e.assetUrl).length;
  const failed = timeline.filter(e => e.status === "error").length;
  console.log(`Timeline written: ${withVideo} with videos, ${withAudio} with audio, ${failed} errors`);
}

/**
 * Generate manifest.json from the full timeline.
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

    let durationSec = entry.durationSec ?? 5;
    if (durationSec <= 0 || durationSec === 5) {
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
      error: entry.status === "error" ? (entry.error || "Video generation failed") : undefined,
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
