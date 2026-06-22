import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { projectDir, writeProjectFile } from "@/lib/projects";
import { loadBrandConfig, compileBrandIntro, compileBrandOutro, isBrandShellEnabled } from "@/lib/brand-shell";
import { getSkill, MAIN_SKILL_ID } from "@/lib/skills";
import { getMainSkillScriptsDir } from "@/lib/env";
import { publishProjectEvent } from "@/lib/events";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface ScaffoldJob {
  status: "running" | "done" | "error";
  output: string;
  error?: string;
  startedAt: number;
  finishedAt?: number;
}

// In-memory job registry (backed by disk for persistence across restarts)
const jobs = new Map<string, ScaffoldJob>();

// ── Disk persistence ─────────────────────────────────────────────────────────────

const JOB_FILE = ".scaffold-job.json";

function readJobFromDisk(projectId: string): ScaffoldJob | null {
  try {
    const filePath = path.join(projectDir(projectId), JOB_FILE);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as ScaffoldJob;
  } catch (err: any) {
    console.warn("[scaffold] readJobFromDisk failed:", err?.message ?? err);
    return null;
  }
}

function writeJobToDisk(projectId: string, job: ScaffoldJob): void {
  try {
    const filePath = path.join(projectDir(projectId), JOB_FILE);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(job));
  } catch (err: any) { console.warn("[scaffold] writeJobToDisk failed:", err?.message ?? err); }
}

function removeJobFile(projectId: string): void {
  try {
    const filePath = path.join(projectDir(projectId), JOB_FILE);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch { /* ignore */ }
}

// ── API ───────────────────────────────────────────────────────────────────────────

export function getScaffoldJob(projectId: string): ScaffoldJob | null {
  const mem = jobs.get(projectId);
  if (mem) return mem;

  // Recover from disk (survives server restart)
  const disk = readJobFromDisk(projectId);
  if (disk) {
    // If it was "running" on disk but the process is gone, treat as error
    if (disk.status === "running") {
      // Can't verify process — stale "running" means something went wrong
      disk.status = "error";
      disk.error = "进程丢失（服务器可能重启了）";
    }
    jobs.set(projectId, disk);
    return disk;
  }
  return null;
}

// Key files that must exist for a scaffold to be considered complete.
const SCAFFOLD_SENTINEL_FILES = [
  "src/styles/tokens.css",
  "src/primitives/index.ts",
  "src/PrimitivePreview.tsx",
  "src/config/stage.ts",
  "src/components/VisualFrame.tsx",
  "node_modules/gsap",
  "node_modules/.bin/vite",
];

export function isScaffolded(projectId: string): boolean {
  const presDir = path.join(projectDir(projectId), "presentation");
  // Check for manim format first (no Vite+React scaffold needed)
  const formatFile = path.join(presDir, ".format");
  if (fs.existsSync(formatFile)) {
    try {
      const fmt = fs.readFileSync(formatFile, "utf-8").trim();
      if (fmt === "manim") {
        return fs.existsSync(path.join(projectDir(projectId), "manim_project"));
      }
      if (fmt === "draw") {
        return fs.existsSync(path.join(projectDir(projectId), "diagrams"));
      }
    } catch (err: any) { console.warn("[scaffold] isScaffolded: failed to read .format file:", err?.message ?? err); }
  }
  // Also check the explicit completion marker (written by scaffold.sh on success)
  if (fs.existsSync(path.join(presDir, ".scaffold-done"))) {
    return true;
  }
  return SCAFFOLD_SENTINEL_FILES.every((f) => fs.existsSync(path.join(presDir, f)));
}

function resolveScriptsDir(mainSkillId: string): string {
  const skill = getSkill(mainSkillId);
  return skill?.scriptsDir ?? getMainSkillScriptsDir();
}

// ── Scaffold timeout (5 minutes) ─────────────────────────────────────────────────

const SCAFFOLD_TIMEOUT_MS = 300_000;

// NOTE: No auto-chain from scaffold → build.
// Chapters are compiled by AI tools (ProjectSetChapter/ProjectSetChapters) which
// write files and run tsc directly. The background build job (startParallelBuild)
// is only used when blueprints are explicitly submitted via the API or UI.

// ── Error parsing ─────────────────────────────────────────────────────────────

/** Parse scaffold output to produce structured error info */
function parseScaffoldError(output: string, exitCode: number | null): {
  type: "network" | "npm" | "vite" | "disk" | "timeout" | "unknown";
  message: string;
  suggestion: string;
} {
  const combined = output.toLowerCase();
  if (combined.includes("econnreset") || combined.includes("enotfound") || combined.includes("etimedout"))
    return { type: "network", message: "网络连接失败", suggestion: "检查网络连接，然后重试" };
  if (combined.includes("enospc") || combined.includes("disk"))
    return { type: "disk", message: "磁盘空间不足", suggestion: "清理磁盘空间后重试" };
  if (combined.includes("npm err") || combined.includes("enoent") && combined.includes("node_modules"))
    return { type: "npm", message: "npm 依赖安装失败", suggestion: "检查 package.json 和网络，然后重试" };
  if (combined.includes("vite") && (combined.includes("error") || exitCode !== 0))
    return { type: "vite", message: "Vite 项目创建失败", suggestion: "检查模板文件是否完整，然后重试" };
  if (combined.includes("timeout") || combined.includes("killed"))
    return { type: "timeout", message: "脚手架执行超时", suggestion: "项目较大时可增加超时上限，或检查网络" };
  return { type: "unknown", message: output.slice(-200).trim() || `退出码 ${exitCode}`, suggestion: "查看完整日志排查，或跳过脚手架尝试直接启动" };
}

export function startScaffold(
  projectId: string,
  theme: string,
  orientation: string = "landscape",
  projectFormat: string = "video",
  mainSkillId: string = MAIN_SKILL_ID
): void {
  // If already done, skip
  if (isScaffolded(projectId)) return;

  // If a job is actively running, don't start another
  const existing = jobs.get(projectId);
  if (existing?.status === "running") return;

  // Manim projects: no shell script needed
  if (projectFormat === "manim") {
    const manimDir = path.join(projectDir(projectId), "manim_project");
    fs.mkdirSync(path.join(manimDir, "output"), { recursive: true });
    fs.writeFileSync(path.join(manimDir, ".gitkeep"), "");
    const presDir = path.join(projectDir(projectId), "presentation");
    fs.mkdirSync(presDir, { recursive: true });
    fs.writeFileSync(path.join(presDir, ".format"), "manim");
    const job: ScaffoldJob = { status: "done", output: "", startedAt: Date.now(), finishedAt: Date.now() };
    jobs.set(projectId, job);
    writeJobToDisk(projectId, job);
    publishProjectEvent(projectId, "scaffold", { status: job.status, error: job.error });
    // scaffold complete
    return;
  }

  // Draw projects: no shell script — just create diagrams directory
  if (projectFormat === "draw") {
    const drawDir = path.join(projectDir(projectId), "diagrams");
    fs.mkdirSync(drawDir, { recursive: true });
    const presDir = path.join(projectDir(projectId), "presentation");
    fs.mkdirSync(presDir, { recursive: true });
    fs.writeFileSync(path.join(presDir, ".format"), "draw");
    const job: ScaffoldJob = { status: "done", output: "", startedAt: Date.now(), finishedAt: Date.now() };
    jobs.set(projectId, job);
    writeJobToDisk(projectId, job);
    publishProjectEvent(projectId, "scaffold", { status: job.status, error: job.error });
    return;
  }

  // Resume projects: copy base-resume template directly (no shell script needed)
  if (projectFormat === "resume") {
    const scriptsDir = resolveScriptsDir(mainSkillId);
    const resumeScript = path.join(scriptsDir, "scaffold-resume.sh");
    const presDir = path.join(projectDir(projectId), "presentation");
    fs.mkdirSync(presDir, { recursive: true });
    fs.writeFileSync(path.join(presDir, ".format"), "resume");

    const args = [resumeScript, "./presentation"];
    const job: ScaffoldJob = { status: "running", output: "", startedAt: Date.now() };
    jobs.set(projectId, job);
    writeJobToDisk(projectId, job);
    publishProjectEvent(projectId, "scaffold", { status: job.status, error: job.error });

    const proc = spawn("bash", args, {
      cwd: projectDir(projectId),
      env: { ...process.env },
    });

    proc.stdout.on("data", (d: Buffer) => { job.output += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { job.output += d.toString(); });

    proc.on("close", (code) => {
      if (code !== 0) {
        job.status = "error";
        job.error = `resume scaffold 退出码 ${code}`;
        job.finishedAt = Date.now();
        writeJobToDisk(projectId, job);
    publishProjectEvent(projectId, "scaffold", { status: job.status, error: job.error });
        return;
      }
      // Write completion marker
      fs.writeFileSync(path.join(presDir, ".scaffold-done"), "");
      job.status = "done";
      job.finishedAt = Date.now();
      writeJobToDisk(projectId, job);
    publishProjectEvent(projectId, "scaffold", { status: job.status, error: job.error });
      // scaffold complete
    });

    proc.on("error", (err) => {
      job.status = "error";
      job.error = err.message;
      job.finishedAt = Date.now();
      writeJobToDisk(projectId, job);
    publishProjectEvent(projectId, "scaffold", { status: job.status, error: job.error });
    });
    return;
  }

  const scriptsDir = resolveScriptsDir(mainSkillId);
  const isGraphic = projectFormat === "graphic";
  const scriptPath = isGraphic
    ? path.join(scriptsDir, "scaffold-graphic.sh")
    : path.join(scriptsDir, "scaffold.sh");

  const args = isGraphic
    ? [scriptPath, "./presentation", `--theme=${theme}`]
    : [scriptPath, "./presentation", `--theme=${theme}`, `--orientation=${orientation}`];

  const job: ScaffoldJob = { status: "running", output: "", startedAt: Date.now() };
  jobs.set(projectId, job);
  writeJobToDisk(projectId, job);

  const proc = spawn("bash", args, {
    cwd: projectDir(projectId),
    env: { ...process.env },
  });

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    proc.kill("SIGTERM"); // graceful first
    setTimeout(() => { try { proc.kill("SIGKILL"); } catch {} }, 5000); // force after 5s
    // Clean up partial files so next attempt starts fresh
    const presDir = path.join(projectDir(projectId), "presentation");
    try {
      if (fs.existsSync(presDir) && !isScaffolded(projectId)) {
        fs.rmSync(presDir, { recursive: true, force: true });
      }
    } catch { /* ignore */ }
    job.status = "error";
    job.error = `脚手架超时（${SCAFFOLD_TIMEOUT_MS / 1000}s）`;
    const timeoutErr = parseScaffoldError("timeout", null);
    job.finishedAt = Date.now();
    writeJobToDisk(projectId, job);
    publishProjectEvent(projectId, "scaffold", { status: job.status, error: timeoutErr });
  }, SCAFFOLD_TIMEOUT_MS);

  proc.stdout.on("data", (d: Buffer) => {
    const text = d.toString();
    job.output += text;
    // Parse structured progress: SCAFFOLD_PROGRESS:stage=npm-install:pct=45
    const m = text.match(/SCAFFOLD_PROGRESS:stage=([^:]+):pct=(\d+)/);
    if (m) {
      const progress = { stage: m[1]!, pct: parseInt(m[2]!, 10) };
      try { fs.writeFileSync(path.join(projectDir(projectId), ".scaffold-progress.json"), JSON.stringify(progress)); } catch {}
      publishProjectEvent(projectId, "scaffold-progress" as any, progress);
    }
  });
  proc.stderr.on("data", (d: Buffer) => {
    const text = d.toString();
    job.output += text;
    publishProjectEvent(projectId, "dev-stderr" as any, { error: text.slice(0, 500) });
  });

  proc.on("close", (code) => {
    clearTimeout(timer);
    if (timedOut) return;

    // Guard: don't overwrite if error handler already fired
    if (job.status === "error") return;

    if (code !== 0) {
      const structuredErr = parseScaffoldError(job.output, code);
      job.status = "error";
      job.error = structuredErr.message;
      job.finishedAt = Date.now();
      writeJobToDisk(projectId, job);
    publishProjectEvent(projectId, "scaffold", { status: job.status, error: structuredErr });

      // Clean up incomplete dir so next attempt starts fresh
      const presDir = path.join(projectDir(projectId), "presentation");
      try {
        if (fs.existsSync(presDir) && !isScaffolded(projectId)) {
          fs.rmSync(presDir, { recursive: true, force: true });
        }
      } catch { /* ignore */ }

      return;
    }

    const presDir = path.join(projectDir(projectId), "presentation");

    if (isGraphic) {
      job.status = "done";
      job.finishedAt = Date.now();
      writeJobToDisk(projectId, job);
    publishProjectEvent(projectId, "scaffold", { status: job.status, error: job.error });
      return;
    }

    // Video projects: remove example chapter directory
    const exampleDir = path.join(presDir, "src/chapters/01-example");
    if (fs.existsSync(exampleDir)) {
      fs.rmSync(exampleDir, { recursive: true });
    }

    // Reset chapters.ts to an empty registry
    const chaptersTs = path.join(presDir, "src/registry/chapters.ts");
    if (fs.existsSync(chaptersTs)) {
      fs.writeFileSync(
        chaptersTs,
        `import type { ChapterDef } from "./types";\n\nexport const CHAPTERS: ChapterDef[] = [];\n`
      );
    }

    // ── Brand shell: compile intro/outro if brand config exists ──────
    // Guard: only compile if primitives dir exists (brand shell TSX imports from it)
    const primitivesDir = path.join(presDir, "src/primitives");
    if (fs.existsSync(primitivesDir)) {
    try {
      if (isBrandShellEnabled(projectId)) {
        const brandConfig = loadBrandConfig(projectId);
        if (brandConfig.intro.enabled) {
          const intro = compileBrandIntro(brandConfig);
          const introDir = `presentation/src/chapters/${intro.chapterId}`;
          writeProjectFile(projectId, `${introDir}/${intro.componentName}.tsx`, intro.tsx);
          writeProjectFile(projectId, `${introDir}/${intro.componentName}.css`, intro.css);
          writeProjectFile(projectId, `${introDir}/narrations.ts`, intro.narrations);
        }
        if (brandConfig.outro.enabled) {
          const outro = compileBrandOutro(brandConfig);
          const outroDir = `presentation/src/chapters/${outro.chapterId}`;
          writeProjectFile(projectId, `${outroDir}/${outro.componentName}.tsx`, outro.tsx);
          writeProjectFile(projectId, `${outroDir}/${outro.componentName}.css`, outro.css);
          writeProjectFile(projectId, `${outroDir}/narrations.ts`, outro.narrations);
        }
      }
    } catch (err) {
      console.warn("[scaffold] Brand shell compilation failed (continuing):", err);
    }
    } // end if primitivesDir exists

    job.status = "done";
    job.finishedAt = Date.now();
    writeJobToDisk(projectId, job);
    publishProjectEvent(projectId, "scaffold", { status: job.status, error: job.error });

    // Auto-chain: if project is in building status, start the parallel build
    // scaffold complete
  });

  proc.on("error", (err) => {
    clearTimeout(timer);
    const structuredErr = parseScaffoldError(err.message, null);
    job.status = "error";
    job.error = structuredErr.message;
    job.finishedAt = Date.now();
    writeJobToDisk(projectId, job);
    publishProjectEvent(projectId, "scaffold", { status: job.status, error: structuredErr });

    // Clean up incomplete dir
    const presDir = path.join(projectDir(projectId), "presentation");
    try {
      if (fs.existsSync(presDir) && !isScaffolded(projectId)) {
        fs.rmSync(presDir, { recursive: true, force: true });
      }
    } catch { /* ignore */ }
  });
}
