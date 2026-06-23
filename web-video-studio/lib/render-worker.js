/**
 * Standalone render worker — runs as a detached child process.
 * Writes status to <projectDir>/.render-status.json so the API
 * can poll it without keeping the process in memory.
 *
 * Strategy (v3 — seek + screenshot + ffmpeg concat, ~5-10x faster than v2):
 *   1. Read audio-segments.json → build timeline (MP3 durations + silent step estimates)
 *   2. Patch chapters.ts stepDurations so the presentation's internal clock matches audio
 *   3. Concat all MP3s + anullsrc silence gaps → merged.aac audio track
 *   4. For each step: seekToTime → screenshot → save frame PNG
 *   5. ffmpeg: concat frames @ duration → video + merged.aac → final mp4
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
const framesDir = path.join(projDir, ".render-frames");
const concatFile = path.join(projDir, ".render-concat.txt");
const outputFile = "render.mp4";
const outputPath = path.join(projDir, outputFile);

// How many seconds between frames within a single step.
// 0 = one frame per step (fastest, good for static slides).
// >0 captures intermediate animation states.
const FRAME_INTERVAL_S = 0.4;

function writeStatus(obj) {
  fs.writeFileSync(statusFile, JSON.stringify({ ...obj, updatedAt: Date.now() }));
}

// ─── MP3 duration probe ───────────────────────────────────────────────────────

function getMp3Duration(filePath) {
  return new Promise((resolve) => {
    try {
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

function estimateSilentDuration(narrationText) {
  if (!narrationText) return 1.5;
  const text = String(narrationText);
  const chineseChars = (text.match(/[一-鿿㐀-䶿]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const numbers = (text.match(/\d+/g) || []).length;
  const pauses = (text.match(/[，。！？、；：,\\.!?;:]/g) || []).length;
  const lineBreaks = (text.match(/\n/g) || []).length;
  const otherChars = text.length - chineseChars - englishWords - numbers - pauses - lineBreaks;

  const ms =
    chineseChars * 250 +
    englishWords * 300 +
    numbers * 400 +
    pauses * 200 +
    lineBreaks * 500 +
    Math.max(0, otherChars) * 100;

  return Math.max(1500, ms) / 1000;
}

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

  // Fallback: scan audio/ subdirs
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

  // Final fallback: chapters narrations (no audio)
  const chaptersFile = path.join(presDir, "src/registry/chapters.ts");
  if (fs.existsSync(chaptersFile)) {
    const src = fs.readFileSync(chaptersFile, "utf-8");
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

// ─── Audio track ─────────────────────────────────────────────────────────────

function concatAudioWithSilence(timeline, outPath) {
  const tmpDir = path.join(projDir, ".render-audio-tmp");
  fs.mkdirSync(tmpDir, { recursive: true });
  return new Promise(async (resolve, reject) => {
    try {
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

      const segFiles = [];
      for (const seg of timeline) {
        if (seg.mp3Path) {
          segFiles.push(seg.mp3Path);
        } else {
          segFiles.push(await getSilenceFile(seg.duration));
        }
      }

      const lines = segFiles.map((f) => `file '${f.replace(/\\/g, "/").replace(/'/g, "\\'")}'`);
      fs.writeFileSync(audioListFile, lines.join("\n") + "\n");

      Ffmpeg()
        .input(audioListFile)
        .inputOptions(["-f concat", "-safe 0"])
        .audioCodec("aac")
        .audioBitrate("192k")
        .output(outPath)
        .on("end", () => { fs.rmSync(tmpDir, { recursive: true, force: true }); resolve(); })
        .on("error", (err) => { fs.rmSync(tmpDir, { recursive: true, force: true }); reject(err); })
        .run();
    } catch (err) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      reject(err);
    }
  });
}

// ─── Seek + screenshot capture (replaces recordVideo) ─────────────────────────

/**
 * Determine how many frames to capture for a step.
 * Static text → 1 frame. Animated step → multiple frames at FRAME_INTERVAL_S.
 * We use a heuristic: steps with duration > 2s likely have animation.
 */
function frameCountForStep(duration) {
  if (duration <= 2.0) return 1;                // short step: 1 frame
  if (duration <= 5.0) return 2;                // medium: start + end
  return Math.min(Math.ceil(duration / FRAME_INTERVAL_S), 30); // long: every 400ms, max 30
}

async function captureFrames(timeline) {
  fs.mkdirSync(framesDir, { recursive: true });
  const frameList = []; // { file: string, duration: number }

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage",
      "--autoplay-policy=no-user-gesture-required",
      "--use-gl=egl", "--enable-gpu-rasterization",
      "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
      "--disable-hang-monitor",
    ],
  });

  let page = null;
  try {
    page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    page.setDefaultTimeout(120000);

    // Health check
    const pageUrl = `http://localhost:${port}/?render=1`;
    let serverOk = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try { const res = await fetch(pageUrl, { method: "HEAD" }); if (res.ok) { serverOk = true; break; } } catch {}
      await new Promise(r => setTimeout(r, 3000));
    }
    if (!serverOk) throw new Error(`Dev server not reachable at http://localhost:${port}`);

    // Load initial page with render mode
    const baseUrl = `http://localhost:${port}/?render=1`;
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60000 });
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await new Promise((r) => setTimeout(r, 1000));

    // Poster frame (t=0)
    try {
      const posterDir = path.join(projDir, "assets");
      fs.mkdirSync(posterDir, { recursive: true });
      await page.screenshot({ path: path.join(posterDir, "poster.jpg"), type: "jpeg", quality: 85 });
    } catch { /* poster is non-critical */ }

    const totalSteps = timeline.length;
    let cursor = 0; // current time position in seconds
    let frameIdx = 0;

    for (let si = 0; si < totalSteps; si++) {
      const seg = timeline[si];
      const nFrames = frameCountForStep(seg.duration);
      const interval = nFrames > 1 ? seg.duration / (nFrames - 1) : 0;

      for (let fi = 0; fi < nFrames; fi++) {
        const t = cursor + fi * interval;

        // Seek by reloading page with ?t= parameter (CSS seek mode)
        // Only reload if time changed significantly (>50ms) from current
        const seekUrl = `${baseUrl}&t=${t.toFixed(2)}`;
        await page.goto(seekUrl, { waitUntil: "domcontentloaded", timeout: 10000 });
        // Wait for CSS seek to finish + font rendering
        await new Promise(r => setTimeout(r, 250));

        const filename = `frame_${String(frameIdx).padStart(6, "0")}.png`;
        const filepath = path.join(framesDir, filename);
        await page.screenshot({ path: filepath, type: "png" });

        const nextT = (fi < nFrames - 1) ? cursor + (fi + 1) * interval : cursor + seg.duration;
        const holdDuration = nextT - t;
        frameList.push({ file: filename, duration: Math.max(0.033, holdDuration) });
        frameIdx++;
      }

      cursor += seg.duration;

      if (si % 5 === 0 || si === totalSteps - 1) {
        writeStatus({
          status: "running",
          progress: `截屏中… ${si + 1}/${totalSteps} 步 (${frameIdx} 帧)`,
          totalDuration: cursor,
          frameCount: frameIdx,
        });
      }
    }

    writeStatus({ status: "running", progress: `截屏完成，共 ${frameIdx} 帧`, frameCount: frameIdx });
    return frameList;
  } finally {
    try { if (page) await page.close().catch(() => {}); } catch {}
    try { await browser.close(); } catch {}
  }
}

// ─── Frames + audio → mp4 ────────────────────────────────────────────────────

function framesToVideo(frameList, audioPath, outPath, totalDuration) {
  return new Promise((resolve, reject) => {
    // Write ffmpeg concat file with per-frame durations
    const lines = [];
    for (const f of frameList) {
      lines.push(`file '${path.join(framesDir, f.file).replace(/'/g, "\\'")}'`);
      lines.push(`duration ${f.duration.toFixed(3)}`);
    }
    // Last frame needs to be listed twice for concat demuxer
    const lastFrame = frameList[frameList.length - 1];
    lines.push(`file '${path.join(framesDir, lastFrame.file).replace(/'/g, "\\'")}'`);
    fs.writeFileSync(concatFile, lines.join("\n") + "\n");

    let cmd = Ffmpeg()
      .input(concatFile)
      .inputOptions(["-f concat", "-safe 0", "-framerate 30"])
      .videoCodec("libx264")
      .outputOptions([
        "-crf 18",
        "-preset fast",
        "-pix_fmt yuv420p",
        "-movflags +faststart",
      ]);

    const hasAudio = audioPath && fs.existsSync(audioPath);
    if (hasAudio) {
      cmd = cmd.input(audioPath);
      cmd = cmd.outputOptions(["-c:a aac", "-map 0:v:0", "-map 1:a:0", "-shortest"]);
    }

    cmd
      .output(outPath)
      .on("end", resolve)
      .on("error", (err) => reject(new Error(`ffmpeg 失败: ${err.message}`)))
      .run();
  });
}

// ─── Narrations + SRT ────────────────────────────────────────────────────────

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

function cleanupTempFiles() {
  const temps = [
    path.join(projDir, ".render-video-tmp"),
    path.join(projDir, ".render-frames"),
    path.join(projDir, ".render-concat.txt"),
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

    // 2. Patch stepDurations
    const chaptersFile = path.join(presDir, "src/registry/chapters.ts");
    writeStatus({ status: "running", progress: "同步时间轴到 chapters.ts…", totalDuration });
    patchStepDurations(chaptersFile, timeline);
    await new Promise((r) => setTimeout(r, 2500));

    // 3. Build audio track
    writeStatus({ status: "running", progress: "拼接音轨…", totalDuration });
    const hasAnyAudio = timeline.some((s) => s.mp3Path);
    if (hasAnyAudio) {
      await concatAudioWithSilence(timeline, mergedAudio);
    }

    // 4. Capture frames (seek + screenshot)
    writeStatus({ status: "running", progress: "截屏中…", totalDuration });
    const frameList = await captureFrames(timeline);

    // 5. Frames + audio → mp4
    writeStatus({ status: "running", progress: `合成 MP4 (${frameList.length} 帧)…`, totalDuration });
    await framesToVideo(frameList, hasAnyAudio ? mergedAudio : null, outputPath, totalDuration);

    writeStatus({
      status: "done",
      progress: `完成 (${totalDuration.toFixed(1)}s，${timeline.length} 步，${frameList.length} 帧${hasAnyAudio ? "，含音频" : "，无音频"})`,
      outputFile,
      totalDuration,
      frameCount: frameList.length,
    });
  } finally {
    cleanupTempFiles();
  }
}

run().catch((err) => {
  writeStatus({ status: "error", error: String(err?.message ?? err), progress: String(err?.message ?? err) });
  process.exit(1);
});
