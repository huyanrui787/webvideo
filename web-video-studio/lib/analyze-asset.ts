import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const VISION_MODEL = "claude-haiku-4-5-20251001";
const CAPTION_PROMPT =
  "用一句话（15字以内）描述这张图片的视觉主体和用途，中文，不加标点，不加引号";

/** Find the ffmpeg binary — prefer @ffmpeg-installer path, fall back to system ffmpeg. */
function findFfmpeg(): string {
  try {
    // Resolve at runtime via Node's module resolution, not bundled by Turbopack
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = eval("require")("@ffmpeg-installer/ffmpeg");
    if (mod?.path && fs.existsSync(mod.path)) return mod.path;
  } catch { /* fall through */ }
  return "ffmpeg"; // system PATH
}

function findFfprobe(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = eval("require")("@ffmpeg-installer/ffmpeg");
    // @ffmpeg-installer doesn't bundle ffprobe, try same dir
    const dir = path.dirname(mod?.path ?? "");
    const probe = path.join(dir, "ffprobe");
    if (fs.existsSync(probe)) return probe;
  } catch { /* fall through */ }
  return "ffprobe";
}

// ─── Image ────────────────────────────────────────────────────────────────────

export async function analyzeImage(filePath: string): Promise<string> {
  const buf = fs.readFileSync(filePath);
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "jpg";
  const mediaType = ext === "png" ? "image/png"
    : ext === "webp" ? "image/webp"
    : ext === "gif" ? "image/gif"
    : "image/jpeg";

  const { text } = await generateText({
    model: anthropic(VISION_MODEL),
    messages: [
      {
        role: "user",
        content: [
          { type: "image", image: buf, mediaType: mediaType },
          { type: "text", text: CAPTION_PROMPT },
        ],
      },
    ],
  });

  return text.trim().replace(/[。，！？""'']/g, "");
}

// ─── Video ────────────────────────────────────────────────────────────────────

function extractCoverFrame(videoPath: string): Promise<string> {
  const tmpFile = path.join(os.tmpdir(), `cover_${Date.now()}.jpg`);
  const ffmpeg = findFfmpeg();
  return new Promise((resolve, reject) => {
    execFile(ffmpeg, ["-ss", "1", "-i", videoPath, "-frames:v", "1", "-y", tmpFile], (err) => {
      if (err) return reject(err);
      resolve(tmpFile);
    });
  });
}

function probeDuration(videoPath: string): Promise<number> {
  const ffprobe = findFfprobe();
  return new Promise((resolve) => {
    execFile(
      ffprobe,
      ["-v", "quiet", "-print_format", "json", "-show_format", videoPath],
      (err, stdout) => {
        if (err) { resolve(0); return; }
        try {
          const meta = JSON.parse(stdout);
          resolve(parseFloat(meta?.format?.duration ?? "0") || 0);
        } catch { resolve(0); }
      }
    );
  });
}

export interface VideoAnalysis {
  caption: string;
  durationSec: number;
}

export async function analyzeVideo(filePath: string): Promise<VideoAnalysis> {
  const [coverPath, durationSec] = await Promise.all([
    extractCoverFrame(filePath),
    probeDuration(filePath),
  ]);

  let caption = "";
  try {
    caption = await analyzeImage(coverPath);
  } finally {
    try { fs.unlinkSync(coverPath); } catch { /* ignore */ }
  }

  return { caption, durationSec: Math.round(durationSec) };
}

// ─── Unified entry point ──────────────────────────────────────────────────────

export interface AssetAnalysis {
  caption: string;
  durationSec?: number;
}

export async function analyzeAsset(
  filePath: string,
  type: "image" | "video"
): Promise<AssetAnalysis> {
  if (type === "image") {
    const caption = await analyzeImage(filePath);
    return { caption };
  } else {
    return analyzeVideo(filePath);
  }
}
