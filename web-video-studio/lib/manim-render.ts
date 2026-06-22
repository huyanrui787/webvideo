// ═══════════════════════════════════════════════════════════════════════════════
// Manim render engine — spawns Python/manim CLI, merges output via FFmpeg
// ═══════════════════════════════════════════════════════════════════════════════

import { spawn, execSync } from "child_process";
import path from "path";
import fs from "fs";
import { projectDir } from "@/lib/projects";
import { getManimPythonPath, getManimCliPath, getDataDir } from "@/lib/env";

// Configurable Python runtime. Set MANIM_PYTHON_PATH to a venv Python binary.
// Falls back to the project-adjacent venv: ../manim-venv/bin/python
const MANIM_PYTHON = getManimPythonPath();
const MANIM_CLI = getManimCliPath();

// ─── Install detection ─────────────────────────────────────────────────────────

let _manimAvailable: boolean | null = null;

export function isManimInstalled(): boolean {
  if (_manimAvailable !== null) return _manimAvailable;
  try {
    const out = execSync(`"${MANIM_PYTHON}" -c "import manim; print(manim.__version__)"`, {
      stdio: "pipe",
      timeout: 10_000,
    }).toString().trim();
    _manimAvailable = !!out;
    console.log(`[manim] detected version ${out} at ${MANIM_PYTHON}`);
  } catch {
    _manimAvailable = false;
    console.warn(`[manim] not found. Check: ${MANIM_PYTHON} -c "import manim"`);
  }
  return _manimAvailable;
}

// ─── Scene render ──────────────────────────────────────────────────────────────

export interface ManimRenderJob {
  status: "running" | "done" | "error";
  sceneFile: string;
  outputFile?: string;
  error?: string;
  progress: string;
}

const renderJobs = new Map<string, ManimRenderJob>();

function getManimRenderJob(jobId: string): ManimRenderJob | null {
  return renderJobs.get(jobId) ?? null;
}

/**
 * Render a single Manim scene to MP4.
 * Returns a jobId for polling via getManimRenderJob.
 */
export function renderManimScene(
  projectId: string,
  sceneFile: string,    // relative to project's manim_project/ dir
  sceneName: string,    // Python class name
  quality: "l" | "m" | "h" = "m",
): string {
  const jobId = `${projectId}-${sceneName}-${Date.now()}`;
  const manimDir = path.join(projectDir(projectId), "manim_project");
  const outputDir = path.join(manimDir, "output");
  fs.mkdirSync(outputDir, { recursive: true });

  const job: ManimRenderJob = {
    status: "running",
    sceneFile,
    progress: "启动中…",
  };
  renderJobs.set(jobId, job);

  const qualityFlag = quality === "h" ? "-qh" : quality === "l" ? "-ql" : "-qm";
  const scenePath = path.join(manimDir, sceneFile);

  if (!fs.existsSync(scenePath)) {
    job.status = "error";
    job.error = `Scene file not found: ${scenePath}`;
    return jobId;
  }

  const proc = spawn(MANIM_CLI, [
    qualityFlag,
    "--format=mp4",
    scenePath,
    sceneName,
  ], {
    cwd: manimDir,
    env: { ...process.env },
  });

  let output = "";
  proc.stdout.on("data", (d: Buffer) => {
    const text = d.toString();
    output += text;
    if (output.length > 500_000) output = output.slice(-200_000); // cap
    job.progress = text.split("\n").filter(Boolean).pop() ?? "渲染中…";
  });
  proc.stderr.on("data", (d: Buffer) => {
    output += d.toString();
    if (output.length > 500_000) output = output.slice(-200_000);
  });

  // Timeout: 10 minutes per scene
  const timeout = setTimeout(() => {
    proc.kill("SIGTERM");
    if (job.status === "running") {
      job.status = "error";
      job.error = "场景渲染超时（10分钟）";
    }
  }, 600_000);

  proc.on("close", (code) => {
    clearTimeout(timeout);
    if (job.status === "error") return; // timeout already set error

    if (code !== 0) {
      job.status = "error";
      job.error = output.slice(-1000) || `manim exited ${code}`;
      return;
    }

    // Find the output file. Manim writes to: media/videos/{sceneFile}/{quality}/SceneName.mp4
    const baseName = path.basename(sceneFile, ".py");
    const possiblePaths = [
      path.join(manimDir, "media", "videos", baseName, quality === "h" ? "1080p60" : quality === "l" ? "480p15" : "720p30", `${sceneName}.mp4`),
      path.join(manimDir, "media", "videos", `${sceneName}.mp4`),
    ];

    let found = false;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        const dest = path.join(outputDir, `${sceneName}.mp4`);
        fs.copyFileSync(p, dest);
        job.outputFile = dest;
        job.status = "done";
        found = true;
        break;
      }
    }

    if (!found) {
      job.status = "error";
      job.error = "渲染完成但找不到输出文件: " + output.slice(-500);
    }
  });

  proc.on("error", (err) => {
    clearTimeout(timeout);
    job.status = "error";
    job.error = err.message;
  });

  return jobId;
}

// ─── Video merge (FFmpeg concat) ───────────────────────────────────────────────

/**
 * Merge multiple MP4 files into a single video via FFmpeg concat.
 * Requires ffmpeg to be available (bundled via @ffmpeg-installer/ffmpeg).
 */
function mergeManimVideos(
  projectId: string,
  videoFiles: string[],  // absolute paths, in order
  outputName: string = "final",
): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(projectDir(projectId), "manim_project", "output");
    const outputPath = path.join(outputDir, `${outputName}.mp4`);

    // Build concat file list
    const concatList = videoFiles.map((f) => `file '${f}'`).join("\n");
    const listPath = path.join(outputDir, ".concat-list.txt");
    fs.writeFileSync(listPath, concatList);

    const proc = spawn("ffmpeg", [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", listPath,
      "-c", "copy",
      outputPath,
    ], {
      env: { ...process.env },
    });

    let stderr = "";
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

    const timeout = setTimeout(() => {
      proc.kill("SIGTERM");
      reject(new Error("视频合并超时（5分钟）"));
    }, 300_000);

    proc.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        // Clean up concat list
        try { fs.unlinkSync(listPath); } catch { /* ignore */ }
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg concat failed: ${stderr.slice(-500)}`));
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// ─── Python syntax check ───────────────────────────────────────────────────────

/**
 * Quick syntax check of Python code. Returns null if OK, error message if not.
 */
export function checkPythonSyntax(code: string): string | null {
  // Write to temp file, then use py_compile for safe validation
  const tmpDir = path.join(getDataDir(), "manim-tmp");
  const tmpFile = path.join(tmpDir, `.syntax_check_${Date.now()}.py`);
  try {
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(tmpFile, code, "utf-8");
    execSync(`"${MANIM_PYTHON}" -m py_compile "${tmpFile}"`, {
      stdio: "pipe",
      timeout: 5_000,
    });
    return null;
  } catch (e: any) {
    return e.stderr?.toString()?.slice(0, 500) ?? e.message ?? "Syntax error";
  } finally {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    try { fs.unlinkSync(tmpFile + "c"); } catch { /* ignore .pyc cache */ }
  }
}

/**
 * Validate that a .py file imports from manim (basic sanity check).
 */
export function validateManimImports(code: string): string | null {
  const hasManimImport = /from\s+manim\s+import|import\s+manim/.test(code);
  if (!hasManimImport) {
    return "Missing 'from manim import ...' — 文件未导入 Manim 库";
  }
  const hasSceneClass = /class\s+\w+\s*\(\s*Scene\s*\)/.test(code);
  if (!hasSceneClass) {
    return "Missing Scene class — 文件未定义继承自 Scene 的类";
  }
  const hasConstruct = /def\s+construct\s*\(/.test(code);
  if (!hasConstruct) {
    return "Missing construct() method — Scene 类缺少 construct 方法";
  }
  return null;
}
