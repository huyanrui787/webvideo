import { NextResponse } from "next/server";
import { projectDir } from "@/lib/projects";
import { requireProjectAccess } from "@/lib/api-helpers";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

interface SynthJob {
  status: "running" | "done" | "error";
  lines: string[];
  total: number;
  completed: number;
  lastLine?: string;
}

const jobs = new Map<string, SynthJob>();

function statusFilePath(id: string): string {
  return path.join(projectDir(id), "presentation", ".synth-status.json");
}

function readStatusFile(id: string): { status: string; completed: number; total: number } | null {
  try {
    const p = statusFilePath(id);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch { return null; }
}

function writeStatusFile(id: string, data: object) {
  try { fs.writeFileSync(statusFilePath(id), JSON.stringify(data)); } catch { /* ignore */ }
}

export function getSynthJob(projectId: string): SynthJob | null {
  return jobs.get(projectId) ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // In-memory job takes priority (currently running)
  const job = jobs.get(id);
  if (job) return NextResponse.json(job);

  // Check persisted status file (survives Next.js restarts)
  const persisted = readStatusFile(id);
  if (persisted) return NextResponse.json(persisted);

  // Fallback: check if audio files already exist
  const audioDir = path.join(projectDir(id), "presentation/public/audio");
  const exists = fs.existsSync(audioDir) && fs.readdirSync(audioDir).length > 0;
  return NextResponse.json({ status: exists ? "done" : "idle" });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error: accessError } = await requireProjectAccess(req, id);
  if (accessError) return accessError;

  const body = await req.json().catch(() => ({}));
  const { provider, action, voice, force, chapterId } = body;

  if (action === "extract") {
    const presDir = path.join(projectDir(id), "presentation");
    const result = await runCmd("npm", ["run", "extract-narrations"], presDir);
    if (result.code !== 0) {
      return NextResponse.json({ ok: false, error: result.stderr || result.stdout }, { status: 500 });
    }
    const segPath = path.join(presDir, "audio-segments.json");
    const segments = fs.existsSync(segPath)
      ? JSON.parse(fs.readFileSync(segPath, "utf-8"))
      : [];
    return NextResponse.json({ ok: true, segments, output: result.stdout });
  }

  // ── Per-chapter synthesis ──────────────────────────────────────────────
  if (action === "synthesize-chapter" && chapterId) {
    const presDir = path.join(projectDir(id), "presentation");
    const segPath = path.join(presDir, "audio-segments.json");

    // First run extract to get fresh segments
    const extractResult = await runCmd("npm", ["run", "extract-narrations"], presDir);
    if (extractResult.code !== 0) {
      return NextResponse.json({ ok: false, error: extractResult.stderr || extractResult.stdout }, { status: 500 });
    }

    // Filter to just the target chapter
    if (!fs.existsSync(segPath)) {
      return NextResponse.json({ ok: false, error: "no segments file after extract" }, { status: 500 });
    }
    const allSegments = JSON.parse(fs.readFileSync(segPath, "utf-8"));
    const chapterSegments = allSegments.filter((s: any) => s.chapter === chapterId);

    if (chapterSegments.length === 0) {
      return NextResponse.json({ ok: true, skipped: true, reason: `no segments for chapter ${chapterId}` });
    }

    // Swap in chapter-only segments file so synthesize-audio only processes this chapter.
    // Use per-chapter bak file to avoid races between concurrent chapter syntheses.
    const bakPath = segPath + `.bak-${chapterId}`;
    try { fs.copyFileSync(segPath, bakPath); } catch { /* ok */ }
    fs.writeFileSync(segPath, JSON.stringify(chapterSegments, null, 2));

    // Run synthesis
    const job: SynthJob = { status: "running", lines: [], total: chapterSegments.length, completed: 0 };
    jobs.set(id, job);
    writeStatusFile(id, { status: "running", completed: 0, total: chapterSegments.length });

    const env: NodeJS.ProcessEnv = { ...process.env };
    if (provider) env.PRESENTATION_TTS = provider;
    if (voice)    env.PRESENTATION_TTS_VOICE = voice;

    const args = ["run", "synthesize-audio"];
    if (force) args.push("--", "--force");

    const proc = spawn("npm", args, {
      cwd: presDir,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    (proc.stdout as NodeJS.ReadableStream).on("data", (d: Buffer) => {
      const line = d.toString().trim();
      if (!line) return;
      job.lines.push(line);
      const m = line.match(/\[\s*(\d+)\/(\d+)\]/);
      if (m) {
        job.completed = parseInt(m[1]);
        job.total = parseInt(m[2]);
        writeStatusFile(id, { status: "running", completed: job.completed, total: job.total });
      }
    });

    (proc.stderr as NodeJS.ReadableStream).on("data", (d: Buffer) => {
      const line = d.toString().trim();
      if (line) job.lines.push(line);
    });

    const handleClose = (code: any) => {
      job.status = code === 0 ? "done" : "error";
      writeStatusFile(id, {
        status: job.status,
        completed: job.completed,
        total: job.total,
        lastLine: job.lines[job.lines.length - 1] ?? "",
      });

      // Restore full segments.json by re-extracting from registry (idempotent, always correct)
      runCmd("npm", ["run", "extract-narrations"], presDir)
        .then(() => {
          try { if (fs.existsSync(bakPath)) fs.unlinkSync(bakPath); } catch { /* ignore */ }
        })
        .catch(() => { /* best effort */ });

      // Keep in-memory job for a minute, then remove
      setTimeout(() => jobs.delete(id), 60_000);
    };
    proc.on("close", handleClose);

    return NextResponse.json({ status: "running", chapterId, segmentCount: chapterSegments.length });
  }

  // ── Full synthesis (original behavior) ─────────────────────────────────
  // Start async TTS synthesis
  const presDir = path.join(projectDir(id), "presentation");
  const job: SynthJob = { status: "running", lines: [], total: 0, completed: 0 };
  jobs.set(id, job);
  writeStatusFile(id, { status: "running", completed: 0, total: 0 });

  const env: NodeJS.ProcessEnv = { ...process.env };

  if (provider) env.PRESENTATION_TTS = provider;
  if (voice)    env.PRESENTATION_TTS_VOICE = voice;

  const args = ["run", "synthesize-audio"];
  if (force) args.push("--", "--force");

  const proc = spawn("npm", args, {
    cwd: presDir,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  (proc.stdout as NodeJS.ReadableStream).on("data", (d: Buffer) => {
    const line = d.toString().trim();
    if (!line) return;
    job.lines.push(line);
    const m = line.match(/\[\s*(\d+)\/(\d+)\]/);
    if (m) {
      job.completed = parseInt(m[1]);
      job.total = parseInt(m[2]);
      writeStatusFile(id, { status: "running", completed: job.completed, total: job.total });
    }
  });

  (proc.stderr as NodeJS.ReadableStream).on("data", (d: Buffer) => {
    const line = d.toString().trim();
    if (line) job.lines.push(line);
  });

  proc.on("close", (code: number | null) => {
    job.status = code === 0 ? "done" : "error";
    writeStatusFile(id, {
      status: job.status,
      completed: job.completed,
      total: job.total,
      lastLine: job.lines[job.lines.length - 1] ?? "",
    });
    // Keep in-memory job for a minute, then remove
    setTimeout(() => jobs.delete(id), 60_000);
  });

  return NextResponse.json({ status: "running" });
}

function runCmd(
  cmd: string,
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { cwd });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.on("close", (code) => resolve({ stdout, stderr, code }));
    setTimeout(() => { proc.kill(); resolve({ stdout, stderr, code: -1 }); }, 180_000);
  });
}
