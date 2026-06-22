import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/api-helpers";
import { projectDir } from "@/lib/projects";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

export interface BgmConfig {
  src: string;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
  trackId?: string;
  trackName?: string;
}

function bgmJsonPath(id: string) {
  return path.join(projectDir(id), "presentation/public/audio/bgm.json");
}

function bgmMp3Path(id: string) {
  return path.join(projectDir(id), "presentation/public/audio/bgm.mp3");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const jsonPath = bgmJsonPath(id);
  const mp3Exists = fs.existsSync(bgmMp3Path(id));
  const aiJob = aiGenJobs.get(id) ?? null;

  if (!fs.existsSync(jsonPath)) {
    return NextResponse.json({ configured: false, aiGen: aiJob });
  }

  const config: BgmConfig = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  return NextResponse.json({ configured: true, config, mp3Exists, aiGen: aiJob });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const jsonPath = bgmJsonPath(id);
  const mp3Path = bgmMp3Path(id);
  if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
  if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);

  return NextResponse.json({ ok: true });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const contentType = req.headers.get("content-type") ?? "";

  // ── Phase C: AI generation ──
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));

    if (body.action === "generate-ai") {
      return handleAiGenerate(id, body);
    }

    // ── Phase A: select built-in track ──
    if (body.trackId) {
      return handleBuiltinTrack(id, body);
    }
  }

  // ── Phase B: user upload (multipart) ──
  if (contentType.includes("multipart/form-data")) {
    return handleUpload(req, id);
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

async function handleBuiltinTrack(
  id: string,
  body: { trackId: string; trackName?: string; volume?: number; fadeIn?: number; fadeOut?: number }
) {
  const studioPublic = path.join(process.cwd(), "public/bgm");
  const srcMp3 = path.join(studioPublic, `${body.trackId}.mp3`);

  if (!fs.existsSync(srcMp3)) {
    return NextResponse.json(
      { error: `Track file not found: ${body.trackId}.mp3. The track needs to be generated first via AI or the file needs to be placed in public/bgm/.` },
      { status: 404 }
    );
  }

  const destMp3 = bgmMp3Path(id);
  fs.mkdirSync(path.dirname(destMp3), { recursive: true });
  fs.copyFileSync(srcMp3, destMp3);

  const config: BgmConfig = {
    src: "/audio/bgm.mp3",
    volume: body.volume ?? 0.28,
    fadeIn: body.fadeIn ?? 1.5,
    fadeOut: body.fadeOut ?? 2.0,
    loop: true,
    trackId: body.trackId,
    trackName: body.trackName,
  };

  fs.writeFileSync(bgmJsonPath(id), JSON.stringify(config, null, 2));
  await ensureBgmHook(id);

  return NextResponse.json({ ok: true, config });
}

async function handleUpload(req: Request, id: string) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const destMp3 = bgmMp3Path(id);
  fs.mkdirSync(path.dirname(destMp3), { recursive: true });

  const arrayBuffer = await file.arrayBuffer();
  fs.writeFileSync(destMp3, Buffer.from(arrayBuffer));

  const volume = parseFloat((formData.get("volume") as string) ?? "0.28");
  const config: BgmConfig = {
    src: "/audio/bgm.mp3",
    volume: Number.isFinite(volume) ? volume : 0.28,
    fadeIn: 1.5,
    fadeOut: 2.0,
    loop: true,
    trackName: file.name,
  };

  fs.writeFileSync(bgmJsonPath(id), JSON.stringify(config, null, 2));
  await ensureBgmHook(id);

  return NextResponse.json({ ok: true, config });
}

interface AiGenerateBody {
  action: "generate-ai";
  prompt?: string;
  mood?: string;
  title?: string;
  volume?: number;
}

interface AiGenJob {
  status: "running" | "done" | "error";
  error?: string;
}
const aiGenJobs = new Map<string, AiGenJob>();

export function getAiGenJob(projectId: string): AiGenJob | null {
  return aiGenJobs.get(projectId) ?? null;
}

async function handleAiGenerate(id: string, body: AiGenerateBody) {
  const existing = aiGenJobs.get(id);
  if (existing?.status === "running") {
    return NextResponse.json({ status: "running" });
  }

  const job: AiGenJob = { status: "running" };
  aiGenJobs.set(id, job);

  const destMp3 = bgmMp3Path(id);
  fs.mkdirSync(path.dirname(destMp3), { recursive: true });

  const moodPromptMap: Record<string, string> = {
    tech: "electronic synthesizer, futuristic, driving beat, cinematic tech",
    corporate: "light piano, strings, professional, calm and focused",
    inspiring: "orchestral, building, uplifting, triumphant",
    storytelling: "acoustic guitar, light percussion, warm, narrative",
    dark: "ambient, dark, atmospheric layers, deep bass",
    upbeat: "marimba, bright, energetic, positive, fun",
  };

  const stylePrompt = body.prompt
    || (body.mood ? moodPromptMap[body.mood] : null)
    || "calm background music, instrumental, suitable for presentation";

  const args = [
    "music", "generate",
    "--prompt", stylePrompt,
    "--instrumental",
    "--use-case", "background music for video presentation",
    "--out", destMp3,
  ];

  const proc = spawn("mmx", args, { stdio: ["ignore", "pipe", "pipe"] });

  proc.on("close", (code) => {
    if (code === 0 && fs.existsSync(destMp3)) {
      job.status = "done";
      const volume = body.volume ?? 0.28;
      const config: BgmConfig = {
        src: "/audio/bgm.mp3",
        volume,
        fadeIn: 1.5,
        fadeOut: 2.0,
        loop: true,
        trackName: body.title ? `AI - ${body.title}` : "AI 生成配乐",
      };
      fs.writeFileSync(bgmJsonPath(id), JSON.stringify(config, null, 2));
      ensureBgmHook(id).catch(() => {});
    } else {
      job.status = "error";
      job.error = "mmx music generate failed";
    }
    setTimeout(() => aiGenJobs.delete(id), 120_000);
  });

  return NextResponse.json({ status: "running" });
}

// ── Inject useBgm into existing presentation ──────────────────────────────────

const BGM_HOOK_IMPORT = `import { useBgm } from "./hooks/useBgm";`;
const BGM_HOOK_CALL = `  useBgm({ autoStarted, paused: playbackPaused, playbackRate: playbackSpeed, isSeekMode });`;

async function ensureBgmHook(projectId: string) {
  const presDir = path.join(projectDir(projectId), "presentation/src");
  if (!fs.existsSync(presDir)) return;

  // Copy hook file if missing
  const hookDest = path.join(presDir, "hooks/useBgm.ts");
  if (!fs.existsSync(hookDest)) {
    const hookSrc = path.join(
      process.cwd().replace(/\/web-video-studio$/, ""),
      "web-video-presentation/templates/src/hooks/useBgm.ts"
    );
    if (fs.existsSync(hookSrc)) {
      fs.copyFileSync(hookSrc, hookDest);
    } else {
      // Write inline if template not found
      fs.writeFileSync(hookDest, BGM_HOOK_SOURCE);
    }
  }

  // Patch App.tsx if not already patched
  const appPath = path.join(presDir, "App.tsx");
  if (!fs.existsSync(appPath)) return;

  let appSrc = fs.readFileSync(appPath, "utf-8");
  if (appSrc.includes("useBgm")) return; // already patched

  // Add import after the last existing hook import
  appSrc = appSrc.replace(
    /^(import \{ useCssSeek \} from "\.\/hooks\/useCssSeek";)/m,
    `$1\n${BGM_HOOK_IMPORT}`
  );

  // Add hook call after useAudioPlayer call
  appSrc = appSrc.replace(
    /(  useAudioPlayer\(\{[\s\S]*?\}\);)/,
    `$1\n${BGM_HOOK_CALL}`
  );

  fs.writeFileSync(appPath, appSrc);
}

const BGM_HOOK_SOURCE = `import { useEffect, useRef } from "react";

interface BgmConfig {
  src: string;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
}

interface Options {
  autoStarted: boolean;
  paused?: boolean;
  playbackRate?: number;
  isSeekMode?: boolean;
}

export function useBgm({
  autoStarted,
  paused = false,
  playbackRate = 1,
  isSeekMode = false,
}: Options) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const configRef = useRef<BgmConfig | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (isSeekMode) return;
    const base = (import.meta as Record<string, unknown>).env
      ? (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL ?? "/"
      : "/";
    fetch(\`\${base}audio/bgm.json\`)
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg: BgmConfig | null) => {
        if (!cfg) return;
        configRef.current = cfg;
        const audio = new Audio(cfg.src.startsWith("/") ? \`\${base}\${cfg.src.slice(1)}\` : cfg.src);
        audio.loop = cfg.loop !== false;
        audio.volume = 0;
        audio.preload = "auto";
        audioRef.current = audio;
        if (autoStarted && !startedRef.current) {
          startedRef.current = true;
          audio.play().then(() => fadeVolume(audio, 0, cfg.volume, cfg.fadeIn)).catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.src = "";
        audioRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeekMode]);

  useEffect(() => {
    if (isSeekMode) return;
    const a = audioRef.current;
    const cfg = configRef.current;
    if (!a || !cfg) return;
    if (autoStarted && !startedRef.current) {
      startedRef.current = true;
      a.play().then(() => fadeVolume(a, 0, cfg.volume, cfg.fadeIn)).catch(() => {});
    }
  }, [autoStarted, isSeekMode]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (paused) {
      a.pause();
    } else if (autoStarted && startedRef.current) {
      a.play().catch(() => {});
    }
  }, [paused, autoStarted]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.playbackRate = playbackRate;
  }, [playbackRate]);
}

function fadeVolume(
  audio: HTMLAudioElement,
  from: number,
  to: number,
  durationSec: number
) {
  if (durationSec <= 0) { audio.volume = to; return; }
  const steps = 30;
  const stepMs = (durationSec * 1000) / steps;
  const delta = (to - from) / steps;
  let current = from;
  audio.volume = from;
  const id = setInterval(() => {
    current += delta;
    audio.volume = Math.max(0, Math.min(1, current));
    if ((delta > 0 && current >= to) || (delta < 0 && current <= to)) {
      audio.volume = to;
      clearInterval(id);
    }
  }, stepMs);
}
`;
