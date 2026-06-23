/**
 * Render Worker v2 — segmented chapter recording with render caching.
 *
 * Records each chapter independently, then concatenates. Failed chapters
 * only need re-recording, not the entire presentation.
 *
 * Caching: each chapter's recording is cached by a hash of its source files
 * (TSX, CSS, narrations, audio durations). If no source changes, re-recording
 * is skipped — the cached webm is reused.
 *
 * Usage: node render-worker-v2.js <projectId> <port> <projectsRoot> [--parallel=N] [--resolution=standard] [--no-cache]
 */

const { chromium } = require("playwright");
const { createHash } = require("crypto");
const path = require("path");
const fs = require("fs");
const {
  RESOLUTION_PRESETS, writeStatus, getChapterIds, launchChromium,
  healthCheck, cleanupTempFiles, concatClips, mergeVideoAudio,
} = require("./render-common");

// ── Parse args ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const projectId = args[0];
const port = parseInt(args[1], 10);
const projectsRoot = args[2];
const parallelFlag = args.find((a) => a.startsWith("--parallel="));
const resolutionFlag = args.find((a) => a.startsWith("--resolution="));
const noCacheFlag = args.includes("--no-cache");
const parallelCount = parallelFlag ? parseInt(parallelFlag.split("=")[1], 10) : 1;
const resolution = resolutionFlag ? resolutionFlag.split("=")[1] : "standard";
const preset = RESOLUTION_PRESETS[resolution] || RESOLUTION_PRESETS.standard;

const projDir = path.join(projectsRoot, projectId);
const presDir = path.join(projDir, "presentation");
const statusFile = path.join(projDir, ".render-status.json");
const cacheDir = path.join(projDir, ".render-cache");
const outputFile = "render.mp4";
const outputPath = path.join(projDir, outputFile);

// ── Render cache ───────────────────────────────────────────────────────────

function chapterHash(chapterId) {
  const hash = createHash("sha256");
  const chapterDir = path.join(presDir, "src/chapters", chapterId);

  // Hash all source files for this chapter
  const files = ["narrations.ts"];
  const tsx = fs.readdirSync(chapterDir).find((f) => f.endsWith(".tsx"));
  const css = fs.readdirSync(chapterDir).find((f) => f.endsWith(".css"));
  if (tsx) files.push(tsx);
  if (css) files.push(css);

  for (const f of files) {
    const filePath = path.join(chapterDir, f);
    if (fs.existsSync(filePath)) {
      hash.update(fs.readFileSync(filePath));
    }
  }

  // Also hash step durations from chapters.ts to catch timing changes
  const chaptersFile = path.join(presDir, "src/registry/chapters.ts");
  if (fs.existsSync(chaptersFile)) {
    const src = fs.readFileSync(chaptersFile, "utf-8");
    // Extract step durations for this chapter specifically
    const re = new RegExp(`id:\\s*["']${chapterId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][\\s\\S]*?stepDurations:\\s*\\[([^\\]]+)\\]`, "m");
    const match = src.match(re);
    if (match) hash.update(match[1]);
  }

  // Include resolution in hash (different resolutions = different cache entries)
  hash.update(resolution);

  return hash.digest("hex").slice(0, 16);
}

function getCachedWebm(chapterId) {
  if (noCacheFlag) return null;
  const chash = chapterHash(chapterId);
  const cachedPath = path.join(cacheDir, chapterId, `${chash}.webm`);
  const metaPath = path.join(cacheDir, chapterId, `${chash}.meta.json`);

  if (fs.existsSync(cachedPath) && fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      return { path: cachedPath, meta };
    } catch {
      return null;
    }
  }
  return null;
}

function saveToCache(chapterId, webmPath) {
  if (noCacheFlag) return;
  const chash = chapterHash(chapterId);
  const chDir = path.join(cacheDir, chapterId);
  fs.mkdirSync(chDir, { recursive: true });

  const destPath = path.join(chDir, `${chash}.webm`);
  const metaPath = path.join(chDir, `${chash}.meta.json`);

  fs.copyFileSync(webmPath, destPath);
  fs.writeFileSync(metaPath, JSON.stringify({
    chapterId,
    hash: chash,
    resolution,
    preset: { width: preset.width, height: preset.height },
    cachedAt: Date.now(),
  }));

  // Cleanup old cache entries for this chapter (keep last 3)
  try {
    const entries = fs.readdirSync(chDir)
      .filter((f) => f.endsWith(".webm"))
      .map((f) => ({ name: f, mtime: fs.statSync(path.join(chDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    for (const entry of entries.slice(3)) {
      const base = entry.name.replace(".webm", "");
      fs.unlinkSync(path.join(chDir, entry.name));
      const meta = path.join(chDir, `${base}.meta.json`);
      if (fs.existsSync(meta)) fs.unlinkSync(meta);
    }
  } catch { /* best-effort cleanup */ }
}

// ── Chapter list ───────────────────────────────────────────────────────────

// ── Record one chapter ─────────────────────────────────────────────────────

async function recordChapter(chapterId, chapterIdx, totalChapters) {
  // ── Check render cache first ────────────────────────────────────────
  const cached = getCachedWebm(chapterId);
  if (cached) {
    writeStatus(statusFile, {
      status: "running",
      progress: `章节 ${chapterIdx + 1}/${totalChapters}: ${chapterId} (缓存命中)…`,
    });
    return { path: cached.path, cached: true };
  }

  const tmpDir = path.join(projDir, ".render-chapter-tmp", chapterId);
  fs.mkdirSync(tmpDir, { recursive: true });

  const browser = await launchChromium(chromium);

  try {
    const context = await browser.newContext({
      viewport: { width: preset.width, height: preset.height },
      recordVideo: {
        dir: tmpDir,
        size: { width: preset.width, height: preset.height },
      },
    });

    const page = await context.newPage();
    await page.addInitScript(() => {
      try { new AudioContext().resume(); } catch {}
    });

    // Health check before recording this chapter
    await healthCheck(port, 2, 2000);
    const url = `http://localhost:${port}/?render=1&auto=1&chapter=${chapterId}`;

    // Load presentation scoped to this chapter
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await new Promise((r) => setTimeout(r, 1000));

    writeStatus(statusFile, {
      status: "running",
      progress: `录制章节 ${chapterIdx + 1}/${totalChapters}: ${chapterId}…`,
    });

    // Wait for chapter completion
    await page.waitForFunction(
      () => (window).__chapterDone === true,
      { timeout: 7200000, polling: 1000 }
    );

    await new Promise((r) => setTimeout(r, 1500));
    const video = page.video();
    await page.close();
    await context.close();

    const webmPath = await video?.path();
    if (!webmPath || !fs.existsSync(webmPath)) {
      throw new Error(`Chapter ${chapterId}: no video produced`);
    }

    // Copy to temp holding dir
    const destPath = path.join(projDir, ".render-chapter-tmp", `${chapterId}.webm`);
    fs.copyFileSync(webmPath, destPath);
    fs.rmSync(tmpDir, { recursive: true, force: true });

    // Save to render cache for future runs
    saveToCache(chapterId, destPath);

    writeStatus(statusFile, {
      status: "running",
      progress: `完成章节 ${chapterIdx + 1}/${totalChapters}: ${chapterId}`,
    });

    return { path: destPath, cached: false };
  } finally {
    await browser.close();
  }
}

// ── Concat chapters ────────────────────────────────────────────────────────

function concatChapters(chapterPaths, outPath) {
  // Final concat with h264 encoding for MP4 output (shared mergeVideoAudio for consistency)
  const listPath = path.join(projDir, ".render-chapter-list.txt");
  const lines = chapterPaths.map((f) => `file '${f.replace(/\\/g, "/")}'`);
  fs.writeFileSync(listPath, lines.join("\n") + "\n");

  const { Ffmpeg } = require("./render-common");
  return new Promise((resolve, reject) => {
    Ffmpeg()
      .input(listPath)
      .inputOptions(["-f concat", "-safe 0"])
      .videoCodec("libx264")
      .outputOptions([
        `-crf ${preset.crf}`,
        "-preset fast",
        "-pix_fmt yuv420p",
        "-movflags +faststart",
      ])
      .output(outPath)
      .on("end", resolve)
      .on("error", (err) => reject(new Error(`concat failed: ${err.message}`)))
      .run();
  });
}

// ── Main ───────────────────────────────────────────────────────────────────

async function run() {
  const chapterIds = getChapterIds(presDir);
  if (chapterIds.length === 0) {
    writeStatus(statusFile, { status: "error", error: "No chapters found" });
    return;
  }

  let cacheHits = 0;
  let cacheMisses = 0;

  writeStatus(statusFile, { status: "running", progress: `开始分段录制 ${chapterIds.length} 章…` });

  // Record chapters sequentially (or in parallel batches)
  const chapterPaths = [];
  const batchSize = Math.min(parallelCount, chapterIds.length);

  for (let i = 0; i < chapterIds.length; i += batchSize) {
    const batch = chapterIds.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((id, j) => recordChapter(id, i + j, chapterIds.length))
    );
    for (const r of results) {
      chapterPaths.push(r.path);
      if (r.cached) cacheHits++; else cacheMisses++;
    }
  }

  // Concat all chapters
  writeStatus(statusFile, { status: "running", progress: "拼接章节视频…" });
  await concatChapters(chapterPaths, outputPath);

  // Cleanup
  cleanupTempFiles(projDir);

  writeStatus(statusFile, {
    status: "done",
    progress: `完成 (${chapterIds.length} 章, ${cacheHits} 缓存命中, ${cacheMisses} 录制, ${resolution})`,
    outputFile,
    cacheStats: { hits: cacheHits, misses: cacheMisses, total: chapterIds.length },
  });
}

run().catch((err) => {
  writeStatus(statusFile, { status: "error", error: String(err?.message ?? err) });
  process.exit(1);
});
