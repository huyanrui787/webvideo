/**
 * Standalone render worker — runs as a detached child process.
 * Writes status to <projectDir>/.render-status.json so the API
 * can poll it without keeping the process in memory.
 *
 * Strategy (v2 — Playwright native recording, ~5-8x faster than screenshot loop):
 *   1. Read audio-segments.json → build timeline (MP3 durations + silent step estimates)
 *   2. Patch chapters.ts stepDurations so the presentation's internal clock matches audio
 *   3. Concat all MP3s + anullsrc silence gaps → merged.aac audio track
 *   4. Playwright recordVideo: open ?render=1&auto=1, wait for __presentationDone
 *   5. ffmpeg: webm (video) + merged.aac (audio) → final mp4
 *
 * Usage: node render-worker.js <projectId> <port> <projectsRoot>
 */

const { chromium } = require("playwright");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const Ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const os = require("os");

Ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const [, , projectId, portStr, projectsRoot] = process.argv;
const port = parseInt(portStr, 10);
const projDir = path.join(projectsRoot, projectId);
const presDir = path.join(projDir, "presentation");
const audioDir = path.join(presDir, "public/audio");
const statusFile = path.join(projDir, ".render-status.json");
const audioListFile = path.join(projDir, ".render-audio-list.txt");
const mergedAudio = path.join(projDir, ".render-audio.aac");
const outputFile = "render.mp4";
const outputPath = path.join(projDir, outputFile);

function writeStatus(obj) {
  fs.writeFileSync(statusFile, JSON.stringify({ ...obj, updatedAt: Date.now() }));
}

// ─── MP3 duration probe ───────────────────────────────────────────────────────

function getMp3Duration(filePath) {
  return new Promise((resolve) => {
    try {
      // Primary: ffprobe JSON (structured, reliable)
      try {
        const { execFileSync } = require("child_process");
        const ffprobePath = path.join(path.dirname(ffmpegInstaller.path), "ffprobe");
        const out = execFileSync(ffprobePath, [
          "-v", "quiet", "-print_format", "json", "-show_format", filePath,
        ], { stdio: ["pipe", "pipe", "pipe"], timeout: 10000 });
        const info = JSON.parse(out.toString());
        const d = parseFloat(info?.format?.duration);
        if (d > 0) { resolve(d); return; }
      } catch { /* fall through */ }

      // Fallback: parse ffmpeg stderr Duration line
      let stderr = "";
      try {
        require("child_process").execFileSync(
          ffmpegInstaller.path, ["-i", filePath],
          { stdio: ["pipe", "pipe", "pipe"] }
        );
      } catch (e) {
        stderr = e.stderr?.toString() ?? "";
      }
      const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (m) {
        const d = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3]);
        resolve(d > 0 ? d : 1.5);
      } else {
        resolve(1.5);
      }
    } catch {
      resolve(1.5);
    }
  });
}

// ─── Timeline builder ─────────────────────────────────────────────────────────

/**
 * Calculate silent-step fallback duration — mirrors App.tsx estimateMs():
 *   Math.max(1500, text.length * 250) ms → converted to seconds
 * MUST stay in sync with the presentation's own estimate so stepDurations
 * and the browser's internal clock agree.
 */
function estimateSilentDuration(narrationText) {
  const ms = Math.max(1500, (narrationText?.length ?? 0) * 250);
  return ms / 1000;
}

/**
 * Build timeline from audio-segments.json (preferred) or audio/ dir scan.
 * Returns: Array<{ chapterId, stepIdx, narration, duration, mp3Path|null }>
 */
async function buildTimeline() {
  const segmentsPath = path.join(presDir, "audio-segments.json");
  if (fs.existsSync(segmentsPath)) {
    const segments = JSON.parse(fs.readFileSync(segmentsPath, "utf-8"));
    return Promise.all(segments.map(async (s) => {
      const mp3 = path.join(audioDir, s.audio);
      const exists = fs.existsSync(mp3);
      const duration = exists
        ? await getMp3Duration(mp3)
        : estimateSilentDuration(s.text ?? "");
      return {
        chapterId: s.chapter,
        stepIdx: s.step - 1,
        narration: s.text ?? "",
        duration,
        mp3Path: exists ? mp3 : null,
      };
    }));
  }

  // Fallback: scan audio/ subdirs (no narration text available → use 1.5s)
  if (fs.existsSync(audioDir)) {
    const timeline = [];
    const chapterDirs = fs.readdirSync(audioDir)
      .filter((d) => fs.statSync(path.join(audioDir, d)).isDirectory())
      .sort();
    for (const chId of chapterDirs) {
      const mp3s = fs.readdirSync(path.join(audioDir, chId))
        .filter((f) => f.endsWith(".mp3"))
        .sort((a, b) => parseInt(a) - parseInt(b));
      for (const mp3name of mp3s) {
        const mp3 = path.join(audioDir, chId, mp3name);
        timeline.push({
          chapterId: chId,
          stepIdx: parseInt(mp3name) - 1,
          narration: "",
          duration: await getMp3Duration(mp3),
          mp3Path: mp3,
        });
      }
    }
    if (timeline.length > 0) return timeline;
  }

  // Final fallback: build timeline from chapter narrations (no audio needed)
  // Parse chapters.ts to get chapter IDs in display order
  const chaptersFile = path.join(presDir, "src/registry/chapters.ts");
  if (fs.existsSync(chaptersFile)) {
    const src = fs.readFileSync(chaptersFile, "utf-8");
    // Extract chapter IDs from the CHAPTERS array entries: { id: "...", ... }
    const idRe = /\{\s*id:\s*"([^"]+)"/g;
    const chapterIds = [];
    let m;
    while ((m = idRe.exec(src)) !== null) chapterIds.push(m[1]);

    if (chapterIds.length > 0) {
      writeStatus({ status: "running", progress: `未找到音频，从 ${chapterIds.length} 章口播稿估算时间轴…` });
      const timeline = [];
      for (const chId of chapterIds) {
        const narrFile = path.join(presDir, "src/chapters", chId, "narrations.ts");
        if (!fs.existsSync(narrFile)) continue;
        const narrSrc = fs.readFileSync(narrFile, "utf-8");
        // Extract string literals (all quote styles) from the narrations array
        const strRe = /["'\`]((?:[^"'`\\]|\\.)*)["'\`]/g;
        let stepIdx = 0;
        while ((m = strRe.exec(narrSrc)) !== null) {
          const text = m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
          timeline.push({
            chapterId: chId,
            stepIdx: stepIdx++,
            narration: text,
            duration: estimateSilentDuration(text),
            mp3Path: null,
          });
        }
      }
      return timeline;
    }
  }

  return [];
}

// ─── Patch chapters.ts stepDurations ─────────────────────────────────────────

function patchStepDurations(chaptersFile, timeline) {
  if (!fs.existsSync(chaptersFile)) return;
  let src = fs.readFileSync(chaptersFile, "utf-8");

  const byChapter = new Map();
  for (const seg of timeline) {
    if (!byChapter.has(seg.chapterId)) byChapter.set(seg.chapterId, []);
    byChapter.get(seg.chapterId).push(seg.duration);
  }

  for (const [chId, durations] of byChapter) {
    const arr = "[" + durations.map((d) => d.toFixed(3)).join(", ") + "]";
    // Escape regex-special characters in chapter ID (e.g. `.` `?` `[` `(`)
    const escId = chId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const replaceRe = new RegExp(
      `(id:\\s*["']${escId}["'][\\s\\S]*?stepDurations:\\s*)\\[[^\\]]*\\]`, "m"
    );
    if (replaceRe.test(src)) {
      src = src.replace(replaceRe, `$1${arr}`);
    } else {
      const insertRe = new RegExp(
        `(id:\\s*["']${escId}["'][\\s\\S]*?narrations:[^,\n]+,?)`, "m"
      );
      src = src.replace(insertRe, `$1\n    stepDurations: ${arr},`);
    }
  }

  fs.writeFileSync(chaptersFile, src, "utf-8");
}

// ─── Audio track: concat MP3s + fill silent steps with anullsrc ──────────────

function concatAudioWithSilence(timeline, outPath) {
  const tmpDir = path.join(projDir, ".render-audio-tmp");
  fs.mkdirSync(tmpDir, { recursive: true });

  return new Promise(async (resolve, reject) => {
    try {
      // Generate a silence file for each unique silent duration needed
      const silenceCache = new Map();
      async function getSilenceFile(duration) {
        const key = duration.toFixed(3);
        if (silenceCache.has(key)) return silenceCache.get(key);
        const silPath = path.join(tmpDir, `silence-${key}.mp3`);
        await new Promise((res, rej) => {
          Ffmpeg()
            .input("anullsrc=channel_layout=stereo:sample_rate=44100")
            .inputOptions(["-f lavfi"])
            .duration(duration)
            .audioCodec("libmp3lame")
            .audioBitrate("192k")
            .output(silPath)
            .on("end", res)
            .on("error", rej)
            .run();
        });
        silenceCache.set(key, silPath);
        return silPath;
      }

      // Build list of audio segments (MP3 or silence)
      const segFiles = [];
      for (const seg of timeline) {
        if (seg.mp3Path) {
          segFiles.push(seg.mp3Path);
        } else {
          segFiles.push(await getSilenceFile(seg.duration));
        }
      }

      // Write concat list
      const lines = segFiles.map((f) => `file '${f.replace(/\\/g, "/").replace(/'/g, "\\'")}'`);
      fs.writeFileSync(audioListFile, lines.join("\n") + "\n");

      // Concat all segments
      Ffmpeg()
        .input(audioListFile)
        .inputOptions(["-f concat", "-safe 0"])
        .audioCodec("aac")
        .audioBitrate("192k")
        .output(outPath)
        .on("end", () => {
          fs.rmSync(tmpDir, { recursive: true, force: true });
          resolve();
        })
        .on("error", (err) => {
          fs.rmSync(tmpDir, { recursive: true, force: true });
          reject(err);
        })
        .run();
    } catch (err) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      reject(err);
    }
  });
}

// ─── Playwright recording ─────────────────────────────────────────────────────

async function recordPresentation(totalDuration) {
  const recordDir = path.join(projDir, ".render-video-tmp");
  fs.mkdirSync(recordDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--autoplay-policy=no-user-gesture-required",
      "--use-gl=egl",
      "--enable-gpu-rasterization",
      "--enable-accelerated-2d-canvas",
      "--enable-accelerated-video-decode",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-hang-monitor",
      "--disable-sync",
      "--disable-default-apps",
      "--disable-extensions",
      "--disable-translate",
      "--disable-features=TranslateUI,AudioServiceOutOfProcess",
      "--font-render-hinting=none",
      "--disable-lcd-text",
    ],
  });

  let context = null;
  let page = null;
  try {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: recordDir,
        size: { width: 1920, height: 1080 },
      },
    });
    context.setDefaultTimeout(7200000); // 2 hours max

    page = await context.newPage();

    // Inject script before page load: unlock audio autoplay for headless Chromium
    await page.addInitScript(() => {
      try {
        const ctx = new AudioContext();
        ctx.resume();
      } catch {}
    });

    // Load with render+auto mode: bypasses AutoStartGate, auto-advances each step
    await page.goto(`http://localhost:${port}/?render=1&auto=1`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    // Wait for fonts to fully load (prevents FOUT on first few frames)
    await page.evaluate(() => document.fonts.ready).catch(() => {});

    // Small settle time for React hydration + first paint
    await new Promise((r) => setTimeout(r, 1000));

    // Capture first frame as poster
    try {
      const posterDir = path.join(projDir, "assets");
      fs.mkdirSync(posterDir, { recursive: true });
      await page.screenshot({
        path: path.join(posterDir, "poster.jpg"),
        type: "jpeg",
        quality: 85,
      });
    } catch { /* poster is non-critical */ }

    writeStatus({ status: "running", progress: "录制中…", totalDuration });

    // Wait for presentation to finish
    const timeoutMs = Math.ceil(totalDuration * 2000) + 120000;
    await page.waitForFunction(
      () => (window).__presentationDone === true,
      { timeout: timeoutMs, polling: 1000 }
    );

    // Small buffer to let the last frame render fully
    await new Promise((r) => setTimeout(r, 1500));

    const video = page.video();
    await page.close();
    page = null;
    await context.close();
    context = null;

    const webmPath = await video?.path();
    if (!webmPath || !fs.existsSync(webmPath)) {
      throw new Error("Playwright did not produce a video file");
    }
    return webmPath;
  } finally {
    // Always clean up — prevent Chromium process leaks
    try { if (page) await page.close().catch(() => {}); } catch {}
    try { if (context) await context.close().catch(() => {}); } catch {}
    try { await browser.close(); } catch {}
  }
}

// ─── ffmpeg merge video + audio → mp4 ────────────────────────────────────────

function mergeVideoAudio(webmPath, audioPath, outPath) {
  return new Promise((resolve, reject) => {
    let cmd = Ffmpeg().input(webmPath);
    const hasAudio = audioPath && fs.existsSync(audioPath);
    if (hasAudio) cmd = cmd.input(audioPath);

    cmd
      .videoCodec("libx264")
      .outputOptions([
        "-crf 18",
        "-preset fast",
        "-pix_fmt yuv420p",
        "-movflags +faststart",
        ...(hasAudio ? ["-c:a aac", "-map 0:v:0", "-map 1:a:0", "-shortest"] : []),
      ])
      .output(outPath)
      .on("end", resolve)
      .on("error", (err) => reject(new Error(`ffmpeg 失败: ${err.message}`)))
      .run();
  });
}

// ─── Narrations loader + SRT builder (unchanged) ─────────────────────────────

function loadNarrations() {
  const chaptersDir = path.join(presDir, "src/chapters");
  if (!fs.existsSync(chaptersDir)) return [];
  const result = [];
  const dirs = fs.readdirSync(chaptersDir)
    .filter((d) => fs.statSync(path.join(chaptersDir, d)).isDirectory())
    .sort();
  for (const dir of dirs) {
    const narFile = path.join(chaptersDir, dir, "narrations.ts");
    if (!fs.existsSync(narFile)) continue;
    const src = fs.readFileSync(narFile, "utf-8");
    const arrayMatch = src.match(/\[([^]*)\]/);
    const texts = [];
    if (arrayMatch) {
      const body = arrayMatch[1];
      const strPat = /`([^`]*)`|"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g;
      let m;
      while ((m = strPat.exec(body)) !== null) {
        const text = (m[1] ?? m[2] ?? m[3] ?? "").replace(/\\n/g, " ").trim();
        if (text) texts.push(text);
      }
    }
    texts.forEach((text, stepIdx) => result.push({ chapterId: dir, stepIdx, text }));
  }
  return result;
}

function toSrtTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${pad3(ms)}`;
}
function pad2(n) { return String(n).padStart(2, "0"); }
function pad3(n) { return String(n).padStart(3, "0"); }

function buildSrt(timeline, narrations) {
  if (narrations.length === 0) return null;
  const lookup = new Map();
  for (const n of narrations) lookup.set(`${n.chapterId}::${n.stepIdx}`, n.text);

  const srtPath = path.join(projDir, ".render-subtitles.srt");
  const lines = [];
  let cursor = 0, idx = 1;
  for (const seg of timeline) {
    const text = lookup.get(`${seg.chapterId}::${seg.stepIdx}`) ?? "";
    if (text) {
      lines.push(String(idx++));
      lines.push(`${toSrtTime(cursor)} --> ${toSrtTime(cursor + seg.duration)}`);
      lines.push(text);
      lines.push("");
    }
    cursor += seg.duration;
  }
  if (idx === 1) return null;
  fs.writeFileSync(srtPath, lines.join("\n"), "utf-8");
  return srtPath;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const MAX_RENDER_RETRIES = 2;
const RETRY_DELAY_MS = 5000;

function cleanupTempFiles() {
  const temps = [
    path.join(projDir, ".render-video-tmp"),
    path.join(projDir, ".render-audio.aac"),
    path.join(projDir, ".render-audio-list.txt"),
    path.join(projDir, ".render-subtitles.srt"),
  ];
  for (const p of temps) {
    try {
      if (fs.existsSync(p)) {
        const stat = fs.statSync(p);
        if (stat.isDirectory()) fs.rmSync(p, { recursive: true, force: true });
        else fs.unlinkSync(p);
      }
    } catch {}
  }
}

async function run() {
  try {
    writeStatus({ status: "running", progress: "分析音频时间轴…" });

  // 1. Build timeline
  const timeline = await buildTimeline();
  if (timeline.length === 0) {
    writeStatus({ status: "error", error: "未找到音频文件或 audio-segments.json", progress: "时间轴为空" });
    return;
  }

  const totalDuration = timeline.reduce((s, t) => s + t.duration, 0);
  writeStatus({ status: "running", progress: `时间轴就绪，共 ${timeline.length} 步，总时长 ${totalDuration.toFixed(1)}s`, totalDuration });

  // 2. Patch stepDurations in chapters.ts so the presentation clock matches audio
  const chaptersFile = path.join(presDir, "src/registry/chapters.ts");
  writeStatus({ status: "running", progress: "同步时间轴到 chapters.ts…", totalDuration });
  patchStepDurations(chaptersFile, timeline);

  // Give Vite HMR a moment to pick up the chapters.ts change
  await new Promise((r) => setTimeout(r, 2500));

  // 3. Build audio track (MP3s + silence gaps)
  writeStatus({ status: "running", progress: "拼接音轨…", totalDuration });
  const hasAnyAudio = timeline.some((s) => s.mp3Path);
  if (hasAnyAudio) {
    await concatAudioWithSilence(timeline, mergedAudio);
  }

  // 4-5. Record + merge with retry
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RENDER_RETRIES; attempt++) {
    try {
      const label = attempt > 1 ? `（重试 ${attempt}/${MAX_RENDER_RETRIES}）` : "";
      writeStatus({ status: "running", progress: `开始录制（预计 ${Math.ceil(totalDuration / 60)} 分钟）…${label}`, totalDuration });
      const webmPath = await recordPresentation(totalDuration);

      writeStatus({ status: "running", progress: "合成 MP4…", totalDuration });
      await mergeVideoAudio(webmPath, hasAnyAudio ? mergedAudio : null, outputPath);

      // Cleanup
      const videoTmpDir = path.dirname(webmPath);
      fs.rmSync(videoTmpDir, { recursive: true, force: true });

      // Success — break out of retry loop
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RENDER_RETRIES) {
        writeStatus({ status: "running", progress: `录制失败：${err.message?.slice(0, 60)} — ${RETRY_DELAY_MS/1000}s 后重试…`, totalDuration });
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }

  if (lastError) throw lastError;

  writeStatus({
    status: "done",
    progress: `完成 (${totalDuration.toFixed(1)}s，${timeline.length} 步${hasAnyAudio ? "，含音频" : "，无音频"})`,
    outputFile,
    totalDuration,
  });
  } finally {
    cleanupTempFiles();
  }
}

run().catch((err) => {
  writeStatus({ status: "error", error: String(err?.message ?? err), progress: String(err?.message ?? err) });
  process.exit(1);
});
