import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { projectDir } from "@/lib/projects";

interface BuildJob {
  status: "running" | "done" | "error";
  output: string;
  error?: string;
}

const jobs = new Map<string, BuildJob>();

export function getBuildJob(projectId: string): BuildJob | null {
  return jobs.get(projectId) ?? null;
}

export function isBuildDone(projectId: string): boolean {
  const distIndex = path.join(projectDir(projectId), "presentation", "dist", "index.html");
  return fs.existsSync(distIndex);
}

export function startBuild(projectId: string): void {
  if (jobs.get(projectId)?.status === "running") return;

  const job: BuildJob = { status: "running", output: "" };
  jobs.set(projectId, job);

  const cwd = path.join(projectDir(projectId), "presentation");

  const proc = spawn("npm", ["run", "build"], {
    cwd,
    env: { ...process.env },
  });

  const MAX_OUTPUT = 500_000; // 500KB cap
  proc.stdout.on("data", (d: Buffer) => { if (job.output.length < MAX_OUTPUT) job.output += d.toString(); });
  proc.stderr.on("data", (d: Buffer) => { if (job.output.length < MAX_OUTPUT) job.output += d.toString(); });

  // Safety timeout: kill build if it runs > 10 minutes
  const timeout = setTimeout(() => {
    proc.kill("SIGTERM");
    if (job.status === "running") {
      job.status = "error";
      job.error = "build timed out after 10 minutes";
    }
  }, 600_000);

  proc.on("close", (code) => {
    clearTimeout(timeout);
    if (code !== 0) {
      job.status = "error";
      job.error = `build exited ${code}`;
      return;
    }
    job.status = "done";
  });

  proc.on("error", (err) => {
    clearTimeout(timeout);
    job.status = "error";
    job.error = err.message;
  });
}
