import path from "path";
import fs from "fs";
import { projectDir } from "@/lib/projects";
import { getProjectsDir, getRenderWorkerPath } from "@/lib/env";

export type RenderStatus = "idle" | "running" | "done" | "error";

export interface RenderJob {
  status: RenderStatus;
  progress: string;
  outputFile?: string;
  error?: string;
  totalFrames?: number;
  totalDuration?: number;
  framesDone?: number;
  updatedAt?: number;
}

const PROJECTS_ROOT = getProjectsDir();
const WORKER = getRenderWorkerPath();

function statusFile(projectId: string): string {
  return path.join(projectDir(projectId), ".render-status.json");
}

export function getRenderJob(projectId: string): RenderJob | null {
  const f = statusFile(projectId);
  if (!fs.existsSync(f)) return null;
  try {
    return JSON.parse(fs.readFileSync(f, "utf-8")) as RenderJob;
  } catch {
    return null;
  }
}

export function startRender(projectId: string, port: number): void {
  const existing = getRenderJob(projectId);
  if (existing?.status === "running") return;

  // Write initial status synchronously so the API can return immediately
  const f = statusFile(projectId);
  fs.writeFileSync(f, JSON.stringify({ status: "running", progress: "启动中…", updatedAt: Date.now() }));

  // Spawn detached worker — survives page close / Next.js restart
  const { spawn } = require("child_process") as typeof import("child_process");
  const child = spawn(
    process.execPath,
    [WORKER, projectId, String(port), PROJECTS_ROOT],
    { detached: true, stdio: "ignore" }
  );
  child.unref();
}

export function cancelRender(projectId: string): void {
  // Best-effort: find the worker PID from the node process list
  // Status file will be cleaned up on next startRender
  const f = statusFile(projectId);
  if (fs.existsSync(f)) {
    fs.writeFileSync(f, JSON.stringify({ status: "idle", progress: "", updatedAt: Date.now() }));
  }
}

const WORKER_ILLUST = path.join(path.dirname(getRenderWorkerPath()), "render-worker-illust.js");

/** Start an illustration-video render (Ken Burns + audio → mp4) */
export function startIllustRender(projectId: string): void {
  const existing = getRenderJob(projectId);
  if (existing?.status === "running") return;

  const f = statusFile(projectId);
  fs.writeFileSync(f, JSON.stringify({
    status: "running",
    progress: "启动插图渲染…",
    updatedAt: Date.now(),
  }));

  const { spawn } = require("child_process") as typeof import("child_process");
  const child = spawn(
    process.execPath,
    [WORKER_ILLUST, projectId, PROJECTS_ROOT],
    { detached: true, stdio: "ignore" }
  );
  child.unref();
}
