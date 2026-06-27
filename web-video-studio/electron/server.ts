/**
 * Next.js server lifecycle management for Electron.
 *
 * In packaged mode: spawns `next start` as a child process.
 * In development: expects Next.js to already be running (npm run dev).
 * The waitForServer helper ensures the server is ready before the window opens.
 */

import { spawn, type ChildProcess } from "child_process";
import path from "path";
import http from "http";
import { app } from "electron";

let serverProcess: ChildProcess | null = null;

/** Start the Next.js server. In development, assumes it's already running. */
export function startNextServer(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    // In development, Next.js is started separately via `npm run dev`
    if (!app.isPackaged) {
      console.log("[server] Development mode — assuming Next.js is already running");
      resolve();
      return;
    }

    // Packaged mode: spawn next start using Electron's bundled Node.js runtime.
    // ELECTRON_RUN_AS_NODE=1 tells Electron to act as a plain Node.js process.
    const nextBin = path.join(__dirname, "..", "node_modules", ".bin", "next");
    console.log(`[server] Starting Next.js (packaged): ${nextBin} start -p ${port}`);

    serverProcess = spawn(
      process.execPath,
      [nextBin, "start", "-p", String(port)],
      {
        cwd: path.join(__dirname, ".."),
        env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", NODE_ENV: "production" },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    serverProcess.stdout?.on("data", (data: Buffer) => {
      console.log(`[next] ${data.toString().trim()}`);
    });

    serverProcess.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg.includes("error") || msg.includes("Error")) {
        console.error(`[next:err] ${msg}`);
      } else {
        console.log(`[next] ${msg}`);
      }
    });

    serverProcess.on("error", (err) => {
      console.error("[server] Next.js process error:", err);
      reject(err);
    });

    serverProcess.on("exit", (code) => {
      console.log(`[server] Next.js process exited with code ${code}`);
      serverProcess = null;
      if (code !== 0 && code !== null) {
        reject(new Error(`Next.js process exited with code ${code}`));
      }
    });

    // Don't wait for process exit — waitForServer handles readiness
    resolve();
  });
}

/** Stop the Next.js server. */
export function stopNextServer(): Promise<void> {
  return new Promise((resolve) => {
    if (!serverProcess) {
      resolve();
      return;
    }
    console.log("[server] Stopping Next.js server...");
    serverProcess.on("exit", () => {
      serverProcess = null;
      resolve();
    });
    serverProcess.kill("SIGTERM");
    // Force kill after 5s
    setTimeout(() => {
      if (serverProcess) {
        serverProcess.kill("SIGKILL");
        serverProcess = null;
      }
      resolve();
    }, 5000);
  });
}

/** Poll the server until it responds or timeout. */
export function waitForServer(
  port: number,
  timeoutMs: number = 30_000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = (): void => {
      http
        .get(`http://localhost:${port}/login`, (res) => {
          // Any response (even 302/404) means the server is up
          res.resume();
          resolve();
        })
        .on("error", () => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error(`Server did not start within ${timeoutMs}ms`));
          } else {
            setTimeout(check, 500);
          }
        });
    };
    check();
  });
}
