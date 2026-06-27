import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { projectDir, writeProjectFile } from "@/lib/projects";
import { loadBrandConfig, compileBrandIntro, compileBrandOutro, isBrandShellEnabled } from "@/lib/brand-shell";
import { repairScaffold } from "@/lib/scaffold-repair";
import { getSkill, MAIN_SKILL_ID } from "@/lib/skills";
import { getMainSkillScriptsDir, getSkillsRoot } from "@/lib/env";
import { publishProjectEvent } from "@/lib/events";

// ─── Audio-only scaffold (for illustration projects) ──────────────
// Copies TTS scripts + installs npm deps, but skips the full Vite template.

const AUDIO_SCAFFOLD_SENTINEL = "scripts/synthesize-audio.sh";

/** Sentinel check: true when audio scaffold is already set up. */
export function isAudioScaffoldReady(projectId: string): boolean {
  return fs.existsSync(path.join(projectDir(projectId), "presentation", AUDIO_SCAFFOLD_SENTINEL));
}

/**
 * Synchronous (awaited) audio scaffold setup.
 * Called by the synthesizer when it detects the scaffold is missing,
 * and by startAudioScaffold for the background-job path.
 */
export async function ensureAudioScaffold(projectId: string): Promise<void> {
  const pDir = projectDir(projectId);
  const presDir = path.join(pDir, "presentation");
  const scriptsDest = path.join(presDir, "scripts");
  const pkgPath = path.join(presDir, "package.json");

  // Already set up — nothing to do
  if (isAudioScaffoldReady(projectId) && fs.existsSync(pkgPath) && fs.existsSync(path.join(presDir, "node_modules"))) {
    return;
  }

  // Find the main skill to get template scripts path
  const mainSkill = getSkill(MAIN_SKILL_ID);
  const skillPath = mainSkill?.path ?? path.join(getSkillsRoot(), "main", MAIN_SKILL_ID);
  const templateScriptsSrc = path.join(skillPath, "templates", "scripts");

  // Ensure directories
  fs.mkdirSync(scriptsDest, { recursive: true });
  fs.mkdirSync(path.join(presDir, "public", "audio"), { recursive: true });

  // Copy template scripts (extract-narrations.ts, synthesize-audio.sh, tts-providers/)
  if (fs.existsSync(templateScriptsSrc)) {
    copyDirSync(templateScriptsSrc, scriptsDest);
  } else {
    throw new Error(`Template scripts not found at ${templateScriptsSrc}`);
  }

  // Create minimal package.json with audio scripts
  const pkg = {
    name: "presentation-audio",
    private: true,
    scripts: {
      "extract-narrations": "tsx scripts/extract-narrations.ts",
      "synthesize-audio": "bash scripts/synthesize-audio.sh",
    },
    dependencies: {
      tsx: "^4.0.0",
    },
  };
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  // npm install
  await runNpmInstall(presDir, () => {});
}

export function startAudioScaffold(projectId: string) {
  // Fast path: already ready
  if (isAudioScaffoldReady(projectId)) {
    publishProjectEvent(projectId, "scaffold", { status: "done" });
    return;
  }

  const job: ScaffoldJob = { status: "running", output: "", startedAt: Date.now() };
  jobs.set(projectId, job);
  writeJobToDisk(projectId, job);
  publishProjectEvent(projectId, "scaffold", { status: job.status });

  // Run asynchronously — delegate to shared implementation
  ensureAudioScaffold(projectId)
    .then(() => {
      job.status = "done";
      job.finishedAt = Date.now();
      writeJobToDisk(projectId, job);
      publishProjectEvent(projectId, "scaffold", { status: job.status });
      console.log(`[scaffold] Audio scaffold done for ${projectId}`);
    })
    .catch((err) => {
      job.status = "error";
      job.error = err instanceof Error ? err.message : String(err);
      job.finishedAt = Date.now();
      writeJobToDisk(projectId, job);
      publishProjectEvent(projectId, "scaffold", { status: job.status, error: job.error });
      console.error(`[scaffold] Audio scaffold failed for ${projectId}:`, job.error);
    });
}

function copyDirSync(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function runNpmInstall(cwd: string, onData: (line: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("npm", ["install", "--prefer-offline"], { cwd, stdio: ["ignore", "pipe", "pipe"] });

    let stderrBuf = "";
    const onLine = (line: string) => {
      onData(line);
      if (line.includes("ERR!")) stderrBuf += line + "\n";
    };

    proc.stdout?.on("data", (d: Buffer) => {
      for (const line of d.toString().split("\n").filter(Boolean)) onLine(line);
    });
    proc.stderr?.on("data", (d: Buffer) => {
      for (const line of d.toString().split("\n").filter(Boolean)) onLine(line);
    });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderrBuf || `npm install exited with code ${code}`));
    });
    proc.on("error", reject);
  });
}

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

// Audio-only scaffold sentinel checked via isAudioScaffoldReady()

/** Check if real chapters (not example/placeholder) exist in the project */
function hasRealChapters(projectId: string): boolean {
  const chaptersDir = path.join(projectDir(projectId), "presentation", "src", "chapters");
  if (!fs.existsSync(chaptersDir)) return false;
  try {
    const dirs = fs.readdirSync(chaptersDir).filter((d) => {
      const stat = fs.statSync(path.join(chaptersDir, d));
      return stat.isDirectory() && !d.startsWith(".") && !d.startsWith("__") && d !== "01-example";
    });
    return dirs.length > 0;
  } catch {
    return false;
  }
}

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
  // If chapters exist beyond the example, it was scaffolded and built upon
  const chaptersDir = path.join(presDir, "src/chapters");
  if (fs.existsSync(chaptersDir)) {
    const dirs = fs.readdirSync(chaptersDir).filter(d =>
      fs.statSync(path.join(chaptersDir, d)).isDirectory() && d !== "01-example"
    );
    if (dirs.length > 0) return true;
  }
  // Check for full Vite scaffold
  if (SCAFFOLD_SENTINEL_FILES.every((f) => fs.existsSync(path.join(presDir, f)))) return true;
  // Check for audio-only scaffold (illustration projects)
  if (isAudioScaffoldReady(projectId)) return true;
  return false;
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
  if (combined.includes("npm err") || (combined.includes("enoent") || combined.includes("ENOENT")) && combined.includes("node_modules"))
    return { type: "npm", message: "npm 依赖安装失败", suggestion: "检查 package.json 和网络，然后重试" };
  if ((combined.includes("vite: command") || combined.includes("vite.config")) && (combined.includes("error") || exitCode !== 0))
    return { type: "vite", message: "Vite 项目创建失败", suggestion: "检查模板文件是否完整，然后重试" };
  if (combined.includes("timeout") || combined.includes("killed"))
    return { type: "timeout", message: "脚手架执行超时", suggestion: "项目较大时可增加超时上限，或检查网络" };
  return { type: "unknown", message: output.slice(-200).trim() || `退出码 ${exitCode}`, suggestion: "查看完整日志排查。若核心文件已存在，可尝试直接启动开发服务器" };
}

export function startScaffold(
  projectId: string,
  theme: string,
  orientation: string = "landscape",
  projectFormat: string = "video",
  mainSkillId: string = MAIN_SKILL_ID
): void {
  // If already done with FULL scaffold, skip — never re-scaffold a working presentation
  // BUT: audio-only scaffold (from TTS auto-trigger) does NOT count for video projects
  if (isScaffolded(projectId)) {
    const presDir = path.join(projectDir(projectId), "presentation");
    const hasFullVite = SCAFFOLD_SENTINEL_FILES.every((f) => fs.existsSync(path.join(presDir, f)));
    if (hasFullVite) {
      publishProjectEvent(projectId, "scaffold", { status: "done" });
      return;
    }
    // Audio-only scaffold exists but full Vite is missing — proceed with full scaffold
  }

  // ── Chapter protection: never overwrite existing real chapters ──────────
  // If the skeleton is damaged (isScaffolded returned false) but real chapters
  // exist on disk, repair only the skeleton — don't wipe chapter code.
  if (hasRealChapters(projectId)) {
    console.log("[scaffold] Skeleton repair: chapters exist, only restoring missing skeleton files");
    try {
      repairScaffold(projectId, theme, orientation, projectFormat, mainSkillId);
    } catch (err) {
      console.warn("[scaffold] Skeleton repair failed, falling through to full scaffold:", err);
    }
    // Even if repair failed, mark scaffold as done since chapters exist
    const job: ScaffoldJob = { status: "done", output: "骨架已修复（章节已保留）", startedAt: Date.now(), finishedAt: Date.now() };
    jobs.set(projectId, job);
    writeJobToDisk(projectId, job);
    publishProjectEvent(projectId, "scaffold", { status: job.status, error: job.error });
    return;
  }

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

    // Add timeout for resume scaffold (same as main scaffold)
    let resumeTimedOut = false;
    const resumeTimer = setTimeout(() => {
      resumeTimedOut = true;
      proc.kill("SIGTERM");
      setTimeout(() => { try { proc.kill("SIGKILL"); } catch {} }, 5000);
      job.status = "error";
      const timeoutErr = parseScaffoldError("timeout", null);
      job.error = timeoutErr.message;
      job.finishedAt = Date.now();
      writeJobToDisk(projectId, job);
      publishProjectEvent(projectId, "scaffold", { status: job.status, error: timeoutErr });
    }, SCAFFOLD_TIMEOUT_MS);

    proc.stdout.on("data", (d: Buffer) => { if (job.output.length < 100_000) job.output += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { if (job.output.length < 100_000) job.output += d.toString(); });

    proc.on("close", (code) => {
      clearTimeout(resumeTimer);
      if (resumeTimedOut) return;
      if (code !== 0) {
        const structuredErr = parseScaffoldError(job.output, code);
        job.status = "error";
        job.error = structuredErr.message;
        job.finishedAt = Date.now();
        writeJobToDisk(projectId, job);
        publishProjectEvent(projectId, "scaffold", { status: job.status, error: structuredErr });
        return;
      }
      // Write completion marker
      fs.writeFileSync(path.join(presDir, ".scaffold-done"), "");

      // Post-scaffold validation: catch broken tokens.css and chapters.css early
      const tokensPath = path.join(presDir, "src", "styles", "tokens.css");
      const chaptersPath = path.join(presDir, "src", "styles", "chapters.css");
      const warnings: string[] = [];
      try {
        const tokensCss = fs.readFileSync(tokensPath, "utf-8");
        if (!tokensCss.includes(":root")) warnings.push("tokens.css missing :root wrapper — theme variables may not apply");
        if (!tokensCss.includes("--text:") || !tokensCss.includes("--accent:") || !tokensCss.includes("--shell:"))
          warnings.push("tokens.css missing required color variables (--text, --accent, --shell)");
        if (!tokensCss.includes("--font-display-cn") || !tokensCss.includes("--font-body"))
          warnings.push("tokens.css missing required font variables");
      } catch { warnings.push("tokens.css unreadable after scaffold"); }
      try {
        const chaptersCss = fs.readFileSync(chaptersPath, "utf-8");
        if (!chaptersCss.includes("ch-composed-region--"))
          warnings.push("chapters.css missing composed region variants — chapters may render with tiny text");
      } catch { warnings.push("chapters.css unreadable after scaffold"); }
      if (warnings.length > 0) {
        job.warnings = warnings;
        console.warn("[scaffold] Post-scaffold warnings for " + projectId + ":", warnings.join("; "));
      }

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
    // Clean up partial scaffold files (node_modules, lock files) but NEVER delete chapters
    const presDir = path.join(projectDir(projectId), "presentation");
    try {
      if (fs.existsSync(presDir) && !isScaffolded(projectId)) {
        const chaptersDir = path.join(presDir, "src/chapters");
        const registryFile = path.join(presDir, "src/registry/chapters.ts");
        // Save chapters if they exist
        const hasChapters = fs.existsSync(chaptersDir) && fs.readdirSync(chaptersDir).length > 0;
        // Only delete non-chapter scaffold artifacts
        const toRemove = ["node_modules", "package-lock.json", ".vite", "dist"];
        for (const item of toRemove) {
          const p = path.join(presDir, item);
          try { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); } catch {}
        }
        if (!hasChapters) {
          // No chapters yet — safe to remove the entire presentation
          fs.rmSync(presDir, { recursive: true, force: true });
        }
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
    // Cap output at 100KB to prevent memory exhaustion
    if (job.output.length < 100_000) job.output += text;
    // Parse structured progress: SCAFFOLD_PROGRESS:stage=npm-install:pct=45
    const m = text.match(/SCAFFOLD_PROGRESS:stage=([^:]+):pct=(\d+)/);
    if (m) {
      const progress = { stage: m[1]!, pct: parseInt(m[2]!, 10) };
      try { fs.writeFileSync(path.join(projectDir(projectId), ".scaffold-progress.json"), JSON.stringify(progress)); } catch {}
      publishProjectEvent(projectId, "scaffold-progress", progress);
    }
  });
  proc.stderr.on("data", (d: Buffer) => {
    const text = d.toString();
    job.output += text;
    publishProjectEvent(projectId, "dev-stderr", { error: text.slice(0, 500) });
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

      // Clean up incomplete scaffold artifacts but NEVER delete chapters
      const presDir = path.join(projectDir(projectId), "presentation");
      try {
        if (fs.existsSync(presDir) && !isScaffolded(projectId)) {
          const cd = path.join(presDir, "src/chapters");
          const hasChapters = fs.existsSync(cd) && fs.readdirSync(cd).length > 0;
          for (const item of ["node_modules", "package-lock.json", ".vite", "dist"]) {
            const p = path.join(presDir, item);
            try { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); } catch {}
          }
          if (!hasChapters) fs.rmSync(presDir, { recursive: true, force: true });
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

    // Prevent scaffold restarts from wiping out existing chapter code.
    const chaptersTs = path.join(presDir, "src/registry/chapters.ts");
    if (fs.existsSync(chaptersTs)) {
      const currentChapters = fs.readFileSync(chaptersTs, "utf-8");
      // Check if chapters.ts has any real chapter imports (non-empty entries)
      const hasChapters = /\{[^}]*id:\s*"[^"]+"/.test(currentChapters);
      if (!hasChapters) {
        fs.writeFileSync(
          chaptersTs,
          `import type { ChapterDef } from "./types";\n\nexport const CHAPTERS: ChapterDef[] = [];\n`
        );
      }
      // else: keep existing chapters — they were built by the AI pipeline
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
    // Guard: don't overwrite if close handler already marked as done/error
    if (job.finishedAt) return;
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
        const cd = path.join(presDir, "src/chapters");
        const hasChapters = fs.existsSync(cd) && fs.readdirSync(cd).length > 0;
        if (!hasChapters) fs.rmSync(presDir, { recursive: true, force: true });
      }
    } catch { /* ignore */ }
  });
}
