import { execSync, execFile } from "child_process";
import net from "net";
import fs from "fs";
import path from "path";
import { publishProjectEvent } from "@/lib/events";
import { projectDir } from "@/lib/projects";

interface DevServerEntry {
  pid: number;
  port: number;
}

interface PidFileMeta {
  projectId: string;
  port: number;
  pid: number;
  startedAt: number;
}

function pidFilePath(projectId: string): string {
  return path.join(projectDir(projectId), "presentation", ".vite.pid");
}

function readPidFile(projectId: string): PidFileMeta | null {
  try {
    const raw = fs.readFileSync(pidFilePath(projectId), "utf-8");
    const meta = JSON.parse(raw) as PidFileMeta;
    if (meta.projectId !== projectId) return null;
    return meta;
  } catch {
    return null;
  }
}

function writePidFile(projectId: string, pid: number, port: number): void {
  const meta: PidFileMeta = { projectId, port, pid, startedAt: Date.now() };
  try { fs.writeFileSync(pidFilePath(projectId), JSON.stringify(meta)); } catch { /* ignore */ }
}

function removePidFile(projectId: string): void {
  try { fs.unlinkSync(pidFilePath(projectId)); } catch { /* ignore */ }
}

function isProcessAlive(pid: number): boolean {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

/** Verify the tracked entry is still alive using the PID file. */
function isEntryValid(projectId: string, entry: DevServerEntry): boolean {
  const meta = readPidFile(projectId);
  if (!meta) return false;
  if (meta.port !== entry.port) return false;
  return isProcessAlive(meta.pid);
}

const servers = new Map<string, DevServerEntry>();

const BASE_PORT = 5200;
const MAX_PORT = 5799;

/** Check if a port is accepting TCP connections on any loopback address. */
function isPortOpen(port: number): Promise<boolean> {
  function tryConnect(host: string): Promise<boolean> {
    return new Promise((resolve) => {
      const sock = net.createConnection({ port, host });
      sock.setTimeout(400);
      sock.on("connect", () => { sock.destroy(); resolve(true); });
      sock.on("error", () => resolve(false));
      sock.on("timeout", () => { sock.destroy(); resolve(false); });
    });
  }
  // macOS: `localhost` resolves to ::1 (IPv6), try both
  return tryConnect("127.0.0.1").then(ok => ok ? true : tryConnect("::1"));
}

/**
 * Recover a running Vite process for this project from its PID file.
 * Used to restore state after Next.js restarts.
 */
function findPortForProject(projectId: string): { port: number; pid: number } | null {
  const meta = readPidFile(projectId);
  if (!meta) return null;
  if (!isProcessAlive(meta.pid)) {
    removePidFile(projectId);
    return null;
  }
  return { port: meta.port, pid: meta.pid };
}

export function getDevServer(projectId: string): { port: number; ready: boolean } | null {
  const entry = servers.get(projectId);
  if (entry) {
    if (isEntryValid(projectId, entry)) return { port: entry.port, ready: true };
    servers.delete(projectId);
  }

  // Map was reset (e.g. Next.js hot-reload) — recover from PID file
  const found = findPortForProject(projectId);
  if (found) {
    servers.set(projectId, { pid: found.pid, port: found.port });
    publishProjectEvent(projectId, "dev-server", { port: found.port, ready: true });
    return { port: found.port, ready: true };
  }

  return null;
}

/** Build a Set of busy ports in our range — single lsof call for efficiency */
function getBusyPortsInRange(): Set<number> {
  const busy = new Set<number>();
  try {
    const out = execSync(`lsof -iTCP:${BASE_PORT}-${MAX_PORT} -sTCP:LISTEN -n -P 2>/dev/null`, { encoding: "utf-8" }).trim();
    for (const line of out.split("\n").slice(1)) {
      const parts = line.trim().split(/\s+/);
      const addr = parts[8] ?? "";
      const m = addr.match(/:(\d+)$/);
      if (m) busy.add(parseInt(m[1]));
    }
  } catch { /* lsof may not be available */ }
  return busy;
}

async function allocatePort(): Promise<number> {
  const usedByUs = new Set([...servers.values()].map((s) => s.port));
  const busy = getBusyPortsInRange();

  for (let port = BASE_PORT; port <= MAX_PORT; port++) {
    if (usedByUs.has(port)) continue;
    if (!busy.has(port)) return port;
  }

  // Kill zombie processes not tracked in our map and retry
  const trackedPorts = new Set([...servers.values()].map((s) => s.port));
  for (const port of busy) {
    if (!trackedPorts.has(port)) {
      try {
        const pid = parseInt(execSync(`lsof -ti :${port} -sTCP:LISTEN 2>/dev/null`, { encoding: "utf-8" }).trim());
        if (pid) process.kill(pid, "SIGTERM");
      } catch {}
    }
  }

  await new Promise((r) => setTimeout(r, 500));
  const busyAfter = getBusyPortsInRange();

  for (let port = BASE_PORT; port <= MAX_PORT; port++) {
    if (usedByUs.has(port)) continue;
    if (!busyAfter.has(port)) return port;
  }

  throw new Error("No available ports in range 5200–5799");
}

export async function startDevServer(projectId: string): Promise<{ port: number }> {
  // If already tracked, verify the process is still alive
  const existing = servers.get(projectId);
  if (existing) {
    if (isEntryValid(projectId, existing) && await isPortOpen(existing.port)) {
      return { port: existing.port };
    }
    servers.delete(projectId);
  }

  // Check PID file for a surviving process (e.g. after Next.js restart)
  const found = findPortForProject(projectId);
  if (found && await isPortOpen(found.port)) {
    servers.set(projectId, { pid: found.pid, port: found.port });
    return { port: found.port };
  }

  const port = await allocatePort();
  const cwd = path.join(projectDir(projectId), "presentation");
  const logFile = path.join(cwd, ".vite-dev.log");

  const cmd = `nohup npm run dev -- --port ${port} --strictPort --host 127.0.0.1 > ${logFile} 2>&1 &`;

  await new Promise<void>((resolve, reject) => {
    execFile("sh", ["-c", cmd], { cwd }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Poll until vite is actually accepting connections (up to 30s)
  const ready = await new Promise<boolean>((resolve) => {
    const start = Date.now();
    const check = async () => {
      if (await isPortOpen(port)) { resolve(true); return; }
      if (Date.now() - start < 30_000) setTimeout(check, 600);
      else resolve(false);
    };
    setTimeout(check, 1500);
  });

  if (!ready) {
    let logTail = "";
    try { logTail = execSync(`tail -25 "${logFile}" 2>/dev/null`, { encoding: "utf-8" }); } catch { /* ignore */ }
    throw new Error(`Vite 启动超时（30s）。日志：\n${logTail}`);
  }

  // Find the PID and write PID file
  let pid = 0;
  try {
    const out = execSync(`lsof -ti :${port}`, { encoding: "utf-8" }).trim();
    pid = parseInt(out.split("\n")[0]) || 0;
  } catch { /* ignore */ }

  writePidFile(projectId, pid, port);
  servers.set(projectId, { pid, port });
  publishProjectEvent(projectId, "dev-server", { port, ready: true });
  return { port };
}

export function stopDevServer(projectId: string): void {
  const entry = servers.get(projectId);
  // Resolve PID from memory or PID file
  let pid = entry?.pid ?? 0;
  if (!pid) {
    const meta = readPidFile(projectId);
    pid = meta?.pid ?? 0;
  }
  if (pid) {
    try { execSync(`kill ${pid} 2>/dev/null || true`); } catch { /* ignore */ }
  }
  servers.delete(projectId);
  crashCount.delete(projectId);
  removePidFile(projectId);
  publishProjectEvent(projectId, "dev-server", { port: null, ready: false });
}

// ─── Auto-restart on crash ──────────────────────────────────────────────────────

const crashCount = new Map<string, number>();
const MAX_CRASH_RESTARTS = 3;

/**
 * Attempt to restart a dev server that crashed. Returns the new port, or null
 * if max restarts exceeded or the project has no presentation/ dir.
 */
async function restartDevServer(projectId: string): Promise<{ port: number } | null> {
  const count = crashCount.get(projectId) ?? 0;
  if (count >= MAX_CRASH_RESTARTS) {
    publishProjectEvent(projectId, "dev-server", { port: null, ready: false, error: "max restart attempts reached" });
    return null;
  }

  const presDir = path.join(projectDir(projectId), "presentation");
  if (!fs.existsSync(presDir)) return null;

  try {
    crashCount.set(projectId, count + 1);
    const result = await startDevServer(projectId);
    crashCount.set(projectId, 0);
    return result;
  } catch {
    publishProjectEvent(projectId, "dev-server", { port: null, ready: false, error: "restart failed" });
    return null;
  }
}

function getCrashCount(projectId: string): number {
  return crashCount.get(projectId) ?? 0;
}

// ─── Startup orphan cleanup ─────────────────────────────────────────────────────
// Kill leftover Vite processes from a previous server instance.
// Only runs when CLEANUP_ORPHAN_VITE=true (opt-in, prevents killing other dev servers on shared machines).
(function cleanupOrphanViteProcesses() {
  if (process.env.CLEANUP_ORPHAN_VITE !== "true") return;
  try {
    const out = execSync(
      "lsof -iTCP:5200-5799 -sTCP:LISTEN -n -P -t 2>/dev/null",
      { encoding: "utf-8" }
    ).trim();
    if (!out) return;
    const pids = out.split("\n").filter(Boolean);
    for (const pid of pids) {
      // Verify the process belongs to this project (cwd contains our projects path)
      try {
        const procCwd = execSync(`lsof -p ${pid} -Fn 2>/dev/null | grep '^fcwd' | sed 's/^fcwd//'`, { encoding: "utf-8" }).trim();
        const projectsRoot = require("./projects").projectDir("").replace(/\/$/, "");
        if (!procCwd.startsWith(projectsRoot)) continue; // Not our project → skip
      } catch { continue; }
      try { process.kill(parseInt(pid), "SIGTERM"); } catch { /* ignore */ }
    }
  } catch { /* lsof not available or no orphans */ }
})();
