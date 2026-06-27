import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/api-helpers";
import { projectDir } from "@/lib/projects";
import { uploadToFal, generateLipSync } from "@/lib/image-gen";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AvatarConfig {
  /** fal.ai public URL of the uploaded portrait photo */
  photoUrl: string;
  /** Local filename of the portrait for display */
  photoName: string;
}

export interface AvatarJob {
  status: "idle" | "merging-audio" | "uploading" | "generating" | "downloading" | "done" | "error";
  progress: string;
  videoUrl?: string;
  error?: string;
  chapters?: ChapterJob[];
}

interface ChapterJob {
  id: string;
  status: "pending" | "generating" | "done" | "error";
  videoPath?: string;
}

// ─── In-memory job store ──────────────────────────────────────────────────────

const jobs = new Map<string, AvatarJob>();

export function getAvatarJob(projectId: string): AvatarJob | null {
  return jobs.get(projectId) ?? null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatarDir(id: string) {
  return path.join(projectDir(id), "avatar");
}

function configPath(id: string) {
  return path.join(avatarDir(id), "config.json");
}

function readConfig(id: string): AvatarConfig | null {
  try { return JSON.parse(fs.readFileSync(configPath(id), "utf-8")); }
  catch { return null; }
}

function writeConfig(id: string, cfg: AvatarConfig) {
  fs.mkdirSync(avatarDir(id), { recursive: true });
  fs.writeFileSync(configPath(id), JSON.stringify(cfg, null, 2));
}

/** Merge mp3 files in order using ffmpeg concat demuxer */
function mergeAudio(inputs: string[], output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const listFile = output + ".txt";
    const lines = inputs.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n");
    fs.writeFileSync(listFile, lines);
    const proc = spawn("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", output], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    proc.on("close", (code) => {
      fs.unlinkSync(listFile);
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with ${code}`));
    });
    setTimeout(() => { proc.kill(); reject(new Error("ffmpeg timeout")); }, 120_000);
  });
}

/** Concat mp4 files using ffmpeg concat demuxer */
function concatVideos(inputs: string[], output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const listFile = output + ".txt";
    const lines = inputs.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n");
    fs.writeFileSync(listFile, lines);
    const proc = spawn("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", output], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    proc.on("close", (code) => {
      fs.unlinkSync(listFile);
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg concat exited with ${code}`));
    });
    setTimeout(() => { proc.kill(); reject(new Error("ffmpeg concat timeout")); }, 300_000);
  });
}

/** Download a video from a URL to a local file */
async function downloadVideo(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buf);
}

// ─── GET — status + config ────────────────────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const cfg = readConfig(id);
  const job = getAvatarJob(id);

  // Check for previously completed video
  const finalVideoPath = path.join(avatarDir(id), "final.mp4");
  const hasFinalVideo = fs.existsSync(finalVideoPath);

  return NextResponse.json({
    configured: !!cfg,
    config: cfg,
    job: job ?? { status: hasFinalVideo ? "done" : "idle", progress: "" },
    hasFinalVideo,
  });
}

// ─── DELETE — remove config + video ──────────────────────────────────────────

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const dir = avatarDir(id);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
  jobs.delete(id);

  return NextResponse.json({ ok: true });
}

// ─── POST — upload photo | generate video ─────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const contentType = req.headers.get("content-type") ?? "";

  // ── Upload photo (multipart) ──
  if (contentType.includes("multipart/form-data")) {
    return handlePhotoUpload(req, id);
  }

  const body = await req.json().catch(() => ({}));

  // ── Start generation ──
  if (body.action === "generate") {
    return handleGenerate(id);
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

// ─── Photo upload handler ─────────────────────────────────────────────────────

async function handlePhotoUpload(req: Request, id: string) {
  const formData = await req.formData();
  const file = formData.get("photo") as File | null;
  if (!file) return NextResponse.json({ error: "No photo provided" }, { status: 400 });

  const ext = file.name.endsWith(".png") ? ".png" : ".jpg";
  const localPath = path.join(avatarDir(id), `portrait${ext}`);
  fs.mkdirSync(avatarDir(id), { recursive: true });
  fs.writeFileSync(localPath, Buffer.from(await file.arrayBuffer()));

  try {
    // Upload photo to fal.ai storage to get a public URL
    const photoUrl = await uploadToFal(localPath, file.type || "image/jpeg");
    const cfg: AvatarConfig = { photoUrl, photoName: file.name };
    writeConfig(id, cfg);
    return NextResponse.json({ ok: true, config: cfg });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// ─── Generate handler ─────────────────────────────────────────────────────────

async function handleGenerate(id: string) {
  const cfg = readConfig(id);
  if (!cfg) return NextResponse.json({ error: "No avatar configured" }, { status: 400 });

  const existing = jobs.get(id);
  if (existing?.status === "generating" || existing?.status === "merging-audio" || existing?.status === "uploading" || existing?.status === "downloading") {
    return NextResponse.json({ status: "already-running" });
  }

  // Collect chapter audio files in order from audio-segments.json
  const segmentsPath = path.join(projectDir(id), "presentation/audio-segments.json");
  if (!fs.existsSync(segmentsPath)) {
    return NextResponse.json({ error: "No audio-segments.json found. Run TTS first." }, { status: 400 });
  }

  interface Segment { chapter: string; step: number; text: string; audio: string }
  const segments: Segment[] = JSON.parse(fs.readFileSync(segmentsPath, "utf-8"));

  // Group by chapter, in order
  const chapterMap = new Map<string, Segment[]>();
  for (const s of segments) {
    if (!chapterMap.has(s.chapter)) chapterMap.set(s.chapter, []);
    chapterMap.get(s.chapter)!.push(s);
  }

  const job: AvatarJob = {
    status: "merging-audio",
    progress: "准备音频…",
    chapters: [...chapterMap.keys()].map((id) => ({ id, status: "pending" })),
  };
  jobs.set(id, job);

  // Run async
  runGeneration(id, cfg, chapterMap, job).catch((e) => {
    job.status = "error";
    job.error = String(e);
    job.progress = `错误: ${String(e)}`;
  });

  return NextResponse.json({ status: "started" });
}

async function runGeneration(
  id: string,
  cfg: AvatarConfig,
  chapterMap: Map<string, Array<{ chapter: string; step: number; text: string; audio: string }>>,
  job: AvatarJob
) {
  const audioBase = path.join(projectDir(id), "presentation/public/audio");
  const outDir = avatarDir(id);
  fs.mkdirSync(outDir, { recursive: true });

  const chapterVideoPaths: string[] = [];

  for (const [chapterId, segs] of chapterMap) {
    const chapterJob = job.chapters?.find((c) => c.id === chapterId);

    // ── Merge chapter audio ──
    job.status = "merging-audio";
    job.progress = `合并章节音频: ${chapterId}`;
    if (chapterJob) chapterJob.status = "generating";

    const audioFiles = segs
      .sort((a, b) => a.step - b.step)
      .map((s) => path.join(audioBase, s.audio))
      .filter((f) => fs.existsSync(f));

    if (audioFiles.length === 0) {
      if (chapterJob) chapterJob.status = "error";
      continue;
    }

    const mergedAudio = path.join(outDir, `${chapterId}-merged.mp3`);
    await mergeAudio(audioFiles, mergedAudio);

    // ── Upload audio to fal.ai storage ──
    job.status = "uploading";
    job.progress = `上传音频: ${chapterId}`;

    const audioUrl = await uploadToFal(mergedAudio, "audio/mpeg");

    // ── Generate lip-sync video via fal.ai ──
    job.status = "generating";
    job.progress = `fal.ai 生成中: ${chapterId}`;

    const { videoUrl: falVideoUrl } = await generateLipSync({
      imageUrl: cfg.photoUrl,
      audioUrl,
    });

    // ── Download ──
    job.status = "downloading";
    job.progress = `下载视频: ${chapterId}`;

    const chapterVideoPath = path.join(outDir, `${chapterId}.mp4`);
    await downloadVideo(falVideoUrl, chapterVideoPath);

    if (chapterJob) { chapterJob.status = "done"; chapterJob.videoPath = `avatar/${chapterId}.mp4`; }
    chapterVideoPaths.push(chapterVideoPath);
  }

  if (chapterVideoPaths.length === 0) {
    throw new Error("没有成功生成任何章节视频");
  }

  // ── Concat all chapter videos ──
  job.status = "downloading";
  job.progress = "合并所有章节视频…";

  const finalPath = path.join(outDir, "final.mp4");
  if (chapterVideoPaths.length === 1) {
    fs.copyFileSync(chapterVideoPaths[0], finalPath);
  } else {
    await concatVideos(chapterVideoPaths, finalPath);
  }

  job.status = "done";
  job.progress = "完成";
  job.videoUrl = "avatar/final.mp4";
}
