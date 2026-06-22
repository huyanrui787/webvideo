/**
 * Render Worker v2 — segmented chapter recording.
 *
 * Records each chapter independently, then concatenates. Failed chapters
 * only need re-recording, not the entire presentation.
 *
 * Usage: node render-worker-v2.js <projectId> <port> <projectsRoot> [--parallel=N] [--resolution=standard]
 */

const { chromium } = require("playwright");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const Ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const os = require("os");

Ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// ── Resolution presets ─────────────────────────────────────────────────────

const RESOLUTION_PRESETS = {
  preview: { width: 1280, height: 720, crf: 23 },
  standard: { width: 1920, height: 1080, crf: 18 },
  high: { width: 2560, height: 1440, crf: 16 },
  ultra: { width: 3840, height: 2160, crf: 14 },
};

// ── Parse args ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const projectId = args[0];
const port = parseInt(args[1], 10);
const projectsRoot = args[2];
const parallelFlag = args.find((a) => a.startsWith("--parallel="));
const resolutionFlag = args.find((a) => a.startsWith("--resolution="));
const parallelCount = parallelFlag ? parseInt(parallelFlag.split("=")[1], 10) : 1;
const resolution = resolutionFlag ? resolutionFlag.split("=")[1] : "standard";
const preset = RESOLUTION_PRESETS[resolution] || RESOLUTION_PRESETS.standard;

const projDir = path.join(projectsRoot, projectId);
const presDir = path.join(projDir, "presentation");
const audioDir = path.join(presDir, "public/audio");
const statusFile = path.join(projDir, ".render-status.json");
const outputFile = "render.mp4";
const outputPath = path.join(projDir, outputFile);

function writeStatus(obj) {
  fs.writeFileSync(statusFile, JSON.stringify({ ...obj, updatedAt: Date.now() }));
}

// ── Chapter list ───────────────────────────────────────────────────────────

function getChapterIds() {
  const chaptersFile = path.join(presDir, "src/registry/chapters.ts");
  if (!fs.existsSync(chaptersFile)) return [];
  const src = fs.readFileSync(chaptersFile, "utf-8");
  const idRe = /\{\s*id:\s*"([^"]+)"/g;
  const ids = [];
  let m;
  while ((m = idRe.exec(src)) !== null) ids.push(m[1]);
  return ids;
}

// ── Record one chapter ─────────────────────────────────────────────────────

async function recordChapter(chapterId, chapterIdx, totalChapters) {
  const tmpDir = path.join(projDir, ".render-chapter-tmp", chapterId);
  fs.mkdirSync(tmpDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox", "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required",
      "--use-gl=egl", "--enable-gpu-rasterization",
      "--disable-background-timer-throttling",
    ],
  });

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

    // Load presentation scoped to this chapter
    const url = `http://localhost:${port}/?render=1&auto=1&chapter=${chapterId}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await new Promise((r) => setTimeout(r, 1000));

    writeStatus({
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

    writeStatus({
      status: "running",
      progress: `完成章节 ${chapterIdx + 1}/${totalChapters}: ${chapterId}`,
    });

    return destPath;
  } finally {
    await browser.close();
  }
}

// ── Concat chapters ────────────────────────────────────────────────────────

function concatChapters(chapterPaths, outPath) {
  return new Promise((resolve, reject) => {
    // Write concat list
    const listPath = path.join(projDir, ".render-chapter-list.txt");
    const lines = chapterPaths.map((f) => `file '${f.replace(/\\/g, "/")}'`);
    fs.writeFileSync(listPath, lines.join("\n") + "\n");

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
  const chapterIds = getChapterIds();
  if (chapterIds.length === 0) {
    writeStatus({ status: "error", error: "No chapters found" });
    return;
  }

  writeStatus({ status: "running", progress: `开始分段录制 ${chapterIds.length} 章…` });

  // Record chapters sequentially (or in parallel batches)
  const chapterPaths = [];
  const batchSize = Math.min(parallelCount, chapterIds.length);

  for (let i = 0; i < chapterIds.length; i += batchSize) {
    const batch = chapterIds.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((id, j) => recordChapter(id, i + j, chapterIds.length))
    );
    chapterPaths.push(...results);
  }

  // Concat all chapters
  writeStatus({ status: "running", progress: "拼接章节视频…" });
  await concatChapters(chapterPaths, outputPath);

  // Cleanup
  const tmpDir = path.join(projDir, ".render-chapter-tmp");
  fs.rmSync(tmpDir, { recursive: true, force: true });

  writeStatus({
    status: "done",
    progress: `完成 (${chapterIds.length} 章, ${resolution})`,
    outputFile,
  });
}

run().catch((err) => {
  writeStatus({ status: "error", error: String(err?.message ?? err) });
  process.exit(1);
});
