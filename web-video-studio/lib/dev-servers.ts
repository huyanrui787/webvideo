import { execSync, execFile } from "child_process";
import net from "net";
import fs from "fs";
import path from "path";
import { publishProjectEvent } from "@/lib/events";
import { projectDir } from "@/lib/projects";

interface DevServerEntry { pid: number; port: number; }

interface PidFileMeta {
  projectId: string;
  port: number;
  pid: number;
  startedAt: number;
}

function pidFilePath(projectId: string): string {
  return path.join(projectDir(projectId), "presentation", ".vite.pid");
}

/** Validate a parsed PID file object has all required fields with correct types */
function isValidPidFileMeta(o: unknown): o is PidFileMeta {
  if (!o || typeof o !== "object") return false;
  const m = o as Record<string, unknown>;
  return typeof m.projectId === "string"
    && typeof m.port === "number"
    && typeof m.pid === "number"
    && typeof m.startedAt === "number";
}

function readPidFile(projectId: string): PidFileMeta | null {
  try {
    const raw = fs.readFileSync(pidFilePath(projectId), "utf-8");
    const parsed = JSON.parse(raw);
    if (!isValidPidFileMeta(parsed)) {
      console.warn(`[dev-servers] Corrupted PID file for ${projectId}, ignoring`);
      return null;
    }
    if (parsed.projectId !== projectId) return null;
    return parsed;
  } catch (err: any) {
    // Only warn on unexpected errors (not file-not-found)
    if (err?.code !== "ENOENT") console.warn(`[dev-servers] PID file read error for ${projectId}:`, err.message);
    return null;
  }
}

function writePidFile(projectId: string, pid: number, port: number): void {
  if (!pid || pid <= 0) {
    console.error(`[dev-servers] Refusing to write PID file with pid=${pid} for ${projectId}`);
    return;
  }
  const meta: PidFileMeta = { projectId, port, pid, startedAt: Date.now() };
  try {
    fs.mkdirSync(path.dirname(pidFilePath(projectId)), { recursive: true });
    fs.writeFileSync(pidFilePath(projectId), JSON.stringify(meta));
  } catch (err: any) {
    console.error(`[dev-servers] Failed to write PID file for ${projectId}:`, err.message);
  }
}

function removePidFile(projectId: string): void {
  try { fs.unlinkSync(pidFilePath(projectId)); } catch { /* best-effort */ }
}

function isProcessAlive(pid: number): boolean {
  if (!pid || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function isEntryValid(projectId: string, entry: DevServerEntry): boolean {
  const meta = readPidFile(projectId);
  if (!meta) return false;
  if (meta.port !== entry.port) return false;
  return isProcessAlive(meta.pid);
}

const servers = new Map<string, DevServerEntry>();
// Mutex: prevent concurrent startDevServer calls for the same project
const startingLocks = new Map<string, Promise<{ port: number }>>();

const BASE_PORT = 5200;
const MAX_PORT = 5799;

// ── Port utilities ──────────────────────────────────────────────────────────

function isPortOpen(port: number, timeoutMs = 800): Promise<boolean> {
  function tryConnect(host: string): Promise<boolean> {
    return new Promise((resolve) => {
      const sock = net.createConnection({ port, host });
      sock.setTimeout(timeoutMs);
      sock.on("connect", () => { sock.destroy(); resolve(true); });
      sock.on("error", () => resolve(false));
      sock.on("timeout", () => { sock.destroy(); resolve(false); });
    });
  }
  return tryConnect("127.0.0.1").then(ok => ok ? true : tryConnect("::1"));
}

function getBusyPortsInRange(): Set<number> {
  const busy = new Set<number>();
  try {
    const out = execSync(
      `lsof -iTCP:${BASE_PORT}-${MAX_PORT} -sTCP:LISTEN -n -P 2>/dev/null`,
      { encoding: "utf-8" }
    ).trim();
    for (const line of out.split("\n").slice(1)) {
      // lsof format: COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
      // The NAME column (last) contains host:port
      const parts = line.trim().split(/\s+/);
      const nameCol = parts[parts.length - 1] ?? ""; // Last column, not fixed index
      const m = nameCol.match(/:(\d+)$/);
      if (m) busy.add(parseInt(m[1]));
    }
  } catch { /* lsof may not be available */ }
  return busy;
}

/** Find the PID of a process listening on a port. Retries up to 5 times. */
function findPidForPort(port: number): number {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const out = execSync(`lsof -ti :${port} -sTCP:LISTEN 2>/dev/null`, { encoding: "utf-8" }).trim();
      const pid = parseInt(out.split("\n")[0] || "0", 10);
      if (pid > 0) return pid;
    } catch { /* keep trying */ }
    if (attempt < 4) {
      // Brief sleep between retries (synchronous — acceptable in this async context)
      Atomics.wait?.(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
    }
  }
  return 0;
}

/** Scan busy ports for an orphaned Vite belonging to this project */
function findOrphanPort(projectId: string): { port: number; pid: number } | null {
  const presCwd = path.join(projectDir(projectId), "presentation");
  const busy = getBusyPortsInRange();
  for (const busyPort of busy) {
    try {
      const pid = parseInt(
        execSync(`lsof -ti :${busyPort} -sTCP:LISTEN 2>/dev/null`, { encoding: "utf-8" }).trim()
      );
      if (!pid) continue;
      const procCwd = execSync(
        `lsof -p ${pid} -Fn 2>/dev/null | grep '^fcwd' | sed 's/^fcwd//'`,
        { encoding: "utf-8" }
      ).trim();
      if (procCwd === presCwd) return { port: busyPort, pid };
    } catch { /* keep scanning */ }
  }
  return null;
}

async function allocatePort(): Promise<number> {
  const usedByUs = new Set([...servers.values()].map((s) => s.port));
  const busy = getBusyPortsInRange();

  for (let port = BASE_PORT; port <= MAX_PORT; port++) {
    if (usedByUs.has(port)) continue;
    if (!busy.has(port)) return port;
  }

  // No free ports — clean up zombie processes tracked by us that are dead
  for (const [id, entry] of servers) {
    if (!isProcessAlive(entry.pid)) {
      servers.delete(id);
      usedByUs.delete(entry.port);
    }
  }

  // Recheck after cleanup
  for (let port = BASE_PORT; port <= MAX_PORT; port++) {
    if (!busy.has(port)) return port;
  }

  throw new Error("No available ports in range 5200–5799. All ports busy.");
}

// ── Public API ──────────────────────────────────────────────────────────────

export function getDevServer(projectId: string): { port: number; ready: boolean } | null {
  const entry = servers.get(projectId);
  if (entry) {
    if (isEntryValid(projectId, entry)) return { port: entry.port, ready: true };
    servers.delete(projectId);
  }

  // Recover from PID file (survives Next.js hot-reload)
  const meta = readPidFile(projectId);
  if (meta && isProcessAlive(meta.pid)) {
    servers.set(projectId, { pid: meta.pid, port: meta.port });
    publishProjectEvent(projectId, "dev-server", { port: meta.port, ready: true });
    return { port: meta.port, ready: true };
  }
  if (meta && !isProcessAlive(meta.pid)) {
    removePidFile(projectId);
  }

  // Scan for orphan (PID file lost but process still alive)
  const orphan = findOrphanPort(projectId);
  if (orphan) {
    writePidFile(projectId, orphan.pid, orphan.port);
    servers.set(projectId, { pid: orphan.pid, port: orphan.port });
    publishProjectEvent(projectId, "dev-server", { port: orphan.port, ready: true });
    return { port: orphan.port, ready: true };
  }

  return null;
}

export async function startDevServer(projectId: string): Promise<{ port: number }> {
  // Mutex: serialize concurrent calls for the same project
  const existingLock = startingLocks.get(projectId);
  if (existingLock) return existingLock;

  const promise = (async () => {
    try {
      // Check in-memory
      const existing = servers.get(projectId);
      if (existing) {
        if (isEntryValid(projectId, existing) && await isPortOpen(existing.port)) {
          return { port: existing.port };
        }
        servers.delete(projectId);
      }

      // Check PID file
      const meta = readPidFile(projectId);
      if (meta && isProcessAlive(meta.pid) && await isPortOpen(meta.port)) {
        servers.set(projectId, { pid: meta.pid, port: meta.port });
        publishProjectEvent(projectId, "dev-server", { port: meta.port, ready: true });
        return { port: meta.port };
      }
      if (meta && !isProcessAlive(meta.pid)) removePidFile(projectId);

      // Scan for orphan
      const orphan = findOrphanPort(projectId);
      if (orphan && await isPortOpen(orphan.port)) {
        writePidFile(projectId, orphan.pid, orphan.port);
        servers.set(projectId, { pid: orphan.pid, port: orphan.port });
        publishProjectEvent(projectId, "dev-server", { port: orphan.port, ready: true });
        return { port: orphan.port };
      }

      // Allocate port and start
      const port = await allocatePort();
      const cwd = path.join(projectDir(projectId), "presentation");
      const logFile = path.join(cwd, ".vite-dev.log");
      const viteBin = path.join(cwd, "node_modules", ".bin", "vite");

      if (!fs.existsSync(viteBin)) {
        throw new Error(`Vite binary not found at ${viteBin}. Run scaffold first.`);
      }

      const cmd = `nohup "${viteBin}" --port ${port} --strictPort --host 127.0.0.1 > "${logFile}" 2>&1 &`;
      await new Promise<void>((resolve, reject) => {
        execFile("sh", ["-c", cmd], { cwd }, (err) => {
          if (err) reject(err); else resolve();
        });
      });

      // Poll for readiness (up to 30s)
      const ready = await new Promise<boolean>((resolve) => {
        const start = Date.now();
        const check = async () => {
          if (await isPortOpen(port)) { resolve(true); return; }
          if (Date.now() - start < 30_000) setTimeout(check, 600);
          else resolve(false);
        };
        // Start checking sooner (200ms instead of 1500ms)
        setTimeout(check, 200);
      });

      if (!ready) {
        let logTail = "";
        try {
          logTail = execSync(`tail -25 "${logFile}" 2>/dev/null`, { encoding: "utf-8" });
        } catch { /* ignore */ }
        throw new Error(`Vite 启动超时（30s）。日志：\n${logTail}`);
      }

      // Find PID with retries
      const pid = findPidForPort(port);
      if (!pid || pid <= 0) {
        console.error(`[dev-servers] Could not determine PID for port ${port} — Vite may be orphaned`);
      }

      writePidFile(projectId, pid || 0, port);
      servers.set(projectId, { pid: pid || 0, port });
      publishProjectEvent(projectId, "dev-server", { port, ready: true });
      return { port };
    } finally {
      startingLocks.delete(projectId);
    }
  })();

  startingLocks.set(projectId, promise);
  return promise;
}

export function stopDevServer(projectId: string): void {
  const entry = servers.get(projectId);
  let pid = entry?.pid ?? 0;
  if (!pid) {
    const meta = readPidFile(projectId);
    pid = meta?.pid ?? 0;
  }
  if (pid && pid > 0) {
    try { process.kill(pid, "SIGTERM"); } catch { /* already dead */ }
  }
  servers.delete(projectId);
  crashCount.delete(projectId);
  removePidFile(projectId);
  publishProjectEvent(projectId, "dev-server", { port: null, ready: false });
}

// ─── Auto-restart on crash ──────────────────────────────────────────────────

const crashCount = new Map<string, number>();
const MAX_CRASH_RESTARTS = 3;

export async function restartDevServer(projectId: string): Promise<{ port: number } | null> {
  const count = crashCount.get(projectId) ?? 0;
  if (count >= MAX_CRASH_RESTARTS) {
    publishProjectEvent(projectId, "dev-server", {
      port: null, ready: false,
      error: `已达最大重启次数 (${MAX_CRASH_RESTARTS})，请手动排查`,
    });
    return null;
  }

  const presDir = path.join(projectDir(projectId), "presentation");
  if (!fs.existsSync(presDir)) return null;

  try {
    crashCount.set(projectId, count + 1);
    const result = await startDevServer(projectId);
    crashCount.set(projectId, 0); // reset on success
    return result;
  } catch {
    publishProjectEvent(projectId, "dev-server", {
      port: null, ready: false,
      error: `自动重启失败 (${count + 1}/${MAX_CRASH_RESTARTS})`,
    });
    return null;
  }
}

export function getCrashCount(projectId: string): number {
  return crashCount.get(projectId) ?? 0;
}

export function resetCrashCount(projectId: string): void {
  crashCount.delete(projectId);
}

// ─── Startup orphan cleanup ─────────────────────────────────────────────────

(function cleanupOrphanViteProcesses() {
  if (process.env.CLEANUP_ORPHAN_VITE !== "true") return;
  try {
    const projectsRoot = projectDir("");
    if (!projectsRoot) return;
    const out = execSync(
      "lsof -iTCP:5200-5799 -sTCP:LISTEN -n -P -t 2>/dev/null",
      { encoding: "utf-8" }
    ).trim();
    if (!out) return;
    for (const pidStr of out.split("\n").filter(Boolean)) {
      const pid = parseInt(pidStr, 10);
      if (!pid) continue;
      try {
        const procCwd = execSync(
          `lsof -p ${pid} -Fn 2>/dev/null | grep '^fcwd' | sed 's/^fcwd//'`,
          { encoding: "utf-8" }
        ).trim();
        if (procCwd.startsWith(projectsRoot)) {
          try { process.kill(pid, "SIGTERM"); } catch { /* ignore */ }
        }
      } catch { continue; }
    }
  } catch { /* lsof not available or no orphans */ }
})();
