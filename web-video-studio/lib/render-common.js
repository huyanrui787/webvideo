/**
 * Render Common — shared utilities for all render workers.
 *
 * Used by: render-worker.js, render-worker-v2.js, render-worker-illust.js
 * Eliminates ~400 lines of duplicated code across the three workers.
 */

const { execFileSync } = require("child_process");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const Ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

Ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// ═══════════════════════════════════════════════════════════════════════════════
// Resolution presets
// ═══════════════════════════════════════════════════════════════════════════════

const RESOLUTION_PRESETS = {
  preview: { width: 1280, height: 720, crf: 23 },
  standard: { width: 1920, height: 1080, crf: 18 },
  high: { width: 2560, height: 1440, crf: 16 },
  ultra: { width: 3840, height: 2160, crf: 14 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Status file
// ═══════════════════════════════════════════════════════════════════════════════

function writeStatus(statusFile, obj) {
  fs.writeFileSync(statusFile, JSON.stringify({ ...obj, updatedAt: Date.now() }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// MP3 duration probe
// ═══════════════════════════════════════════════════════════════════════════════

function getMp3Duration(filePath) {
  return new Promise((resolve) => {
    try {
      // Primary: ffprobe JSON (structured, reliable)
      try {
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
        execFileSync(
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

// ═══════════════════════════════════════════════════════════════════════════════
// Duration estimation (language-aware)
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// SRT subtitles
// ═══════════════════════════════════════════════════════════════════════════════

function toSrtTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${pad3(ms)}`;
}
function pad2(n) { return String(n).padStart(2, "0"); }
function pad3(n) { return String(n).padStart(3, "0"); }

/**
 * Build an SRT subtitle file from timeline entries.
 * @param {Array<{ chapterId: string, stepIdx: number, durationSec: number, narration?: string }>} timeline
 * @param {Array<{ chapterId: string, stepIdx: number, text: string }>} narrations
 * @param {string} outPath - output .srt file path
 * @returns {string|null} path to SRT file, or null if empty
 */
function buildSrt(timeline, narrations, outPath) {
  if (!narrations || narrations.length === 0) return null;
  const lookup = new Map();
  for (const n of narrations) lookup.set(`${n.chapterId}::${n.stepIdx}`, n.text);

  const lines = [];
  let cursor = 0, idx = 1;
  for (const seg of timeline) {
    const text = lookup.get(`${seg.chapterId}::${seg.stepIdx}`) ?? seg.narration ?? "";
    if (text) {
      lines.push(String(idx++));
      lines.push(`${toSrtTime(cursor)} --> ${toSrtTime(cursor + (seg.durationSec || seg.duration))}`);
      lines.push(text);
      lines.push("");
    }
    cursor += (seg.durationSec || seg.duration);
  }
  if (idx === 1) return null;
  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
  return outPath;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Audio concat (MP3s + silence gaps)
// ═══════════════════════════════════════════════════════════════════════════════

function concatAudioWithSilence(timeline, outPath, workDir) {
  const tmpDir = path.join(workDir, ".render-audio-tmp");
  fs.mkdirSync(tmpDir, { recursive: true });
  const listFile = path.join(workDir, ".render-audio-list.txt");

  return new Promise(async (resolve, reject) => {
    try {
      // Generate silence files for each unique silent duration needed
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
          segFiles.push(await getSilenceFile(seg.durationSec || seg.duration || 1.5));
        }
      }

      const lines = segFiles.map((f) => `file '${f.replace(/\\/g, "/").replace(/'/g, "\\'")}'`);
      fs.writeFileSync(listFile, lines.join("\n") + "\n");

      Ffmpeg()
        .input(listFile)
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

// ═══════════════════════════════════════════════════════════════════════════════
// Video concat (list of files → single mp4)
// ═══════════════════════════════════════════════════════════════════════════════

function concatClips(clipFiles, outPath, workDir) {
  if (clipFiles.length === 1) {
    fs.copyFileSync(clipFiles[0], outPath);
    return Promise.resolve(outPath);
  }

  const listFile = path.join(workDir, ".render-clips-list.txt");
  const lines = clipFiles.map(
    (f) => `file '${f.replace(/\\/g, "/").replace(/'/g, "\\'")}'`
  );
  fs.writeFileSync(listFile, lines.join("\n") + "\n");

  return new Promise((resolve, reject) => {
    Ffmpeg()
      .input(listFile)
      .inputOptions(["-f concat", "-safe 0"])
      .videoCodec("copy")
      .output(outPath)
      .on("end", () => resolve(outPath))
      .on("error", reject)
      .run();
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Cleanup temp files
// ═══════════════════════════════════════════════════════════════════════════════

function cleanupTempFiles(workDir, patterns) {
  const temps = (patterns || [
    ".render-video-tmp",
    ".render-audio-tmp",
    ".render-audio.aac",
    ".render-audio-list.txt",
    ".render-clips-list.txt",
    ".render-subtitles.srt",
    ".render-concat.mp4",
  ]).map((p) => path.join(workDir, p));

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

// ═══════════════════════════════════════════════════════════════════════════════
// Health check for dev server
// ═══════════════════════════════════════════════════════════════════════════════

async function healthCheck(port, retries = 3, delayMs = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`http://localhost:${port}/`, { method: "HEAD" });
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, delayMs));
  }
  throw new Error(`Dev server not reachable at http://localhost:${port} after ${retries} retries`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Chromium launch (shared browser args)
// ═══════════════════════════════════════════════════════════════════════════════

const CHROMIUM_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--autoplay-policy=no-user-gesture-required",
  "--use-gl=egl",
  "--enable-gpu-rasterization",
  "--disable-background-timer-throttling",
];

async function launchChromium(chromium) {
  return chromium.launch({ headless: true, args: CHROMIUM_ARGS });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Merge video + audio → mp4
// ═══════════════════════════════════════════════════════════════════════════════

function mergeVideoAudio(webmPath, audioPath, outPath, crf = 18) {
  return new Promise((resolve, reject) => {
    let cmd = Ffmpeg().input(webmPath);
    const hasAudio = audioPath && fs.existsSync(audioPath);
    if (hasAudio) cmd = cmd.input(audioPath);

    cmd
      .videoCodec("libx264")
      .outputOptions([
        `-crf ${crf}`,
        "-preset fast",
        "-pix_fmt yuv420p",
        "-movflags +faststart",
        ...(hasAudio ? ["-c:a aac", "-map 0:v:0", "-map 1:a:0", "-shortest"] : []),
      ])
      .output(outPath)
      .on("end", resolve)
      .on("error", (err) => reject(new Error(`ffmpeg merge failed: ${err.message}`)))
      .run();
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Narrations loader from chapters/
// ═══════════════════════════════════════════════════════════════════════════════

function loadNarrations(chaptersDir) {
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

// ═══════════════════════════════════════════════════════════════════════════════
// Chapter list from registry
// ═══════════════════════════════════════════════════════════════════════════════

function getChapterIds(presDir) {
  const chaptersFile = path.join(presDir, "src/registry/chapters.ts");
  if (!fs.existsSync(chaptersFile)) return [];
  const src = fs.readFileSync(chaptersFile, "utf-8");
  const idRe = /\{\s*id:\s*"([^"]+)"/g;
  const ids = [];
  let m;
  while ((m = idRe.exec(src)) !== null) ids.push(m[1]);
  return ids;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Constants
  RESOLUTION_PRESETS,
  CHROMIUM_ARGS,
  // I/O
  writeStatus,
  healthCheck,
  cleanupTempFiles,
  // Duration
  getMp3Duration,
  estimateSilentDuration,
  // SRT
  toSrtTime,
  buildSrt,
  // Video/Audio
  concatAudioWithSilence,
  concatClips,
  mergeVideoAudio,
  launchChromium,
  // Data loading
  loadNarrations,
  getChapterIds,
  // ffmpeg
  ffmpegInstaller,
  Ffmpeg,
};
