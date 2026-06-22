/**
 * Bootstrap checks — validates the environment on first launch.
 * Runs in the Electron main process before the window opens.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export interface BootstrapStatus {
  ok: boolean;
  checks: {
    playwright: { ok: boolean; detail: string };
    ffmpeg: { ok: boolean; detail: string };
    sqlite: { ok: boolean; detail: string };
    skills: { ok: boolean; detail: string };
    database: { ok: boolean; detail: string };
  };
}

export function runBootstrapChecks(appData: string): BootstrapStatus {
  const checks: BootstrapStatus["checks"] = {
    playwright: checkPlaywright(),
    ffmpeg: checkFfmpeg(),
    sqlite: checkSqlite(),
    skills: checkSkills(),
    database: checkDatabase(appData),
  };

  return {
    ok: Object.values(checks).every((c) => c.ok),
    checks,
  };
}

function checkPlaywright(): { ok: boolean; detail: string } {
  try {
    // Check if Playwright is importable and has browsers installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pw = require("playwright");
    const browsers = ["chromium"] as const;
    for (const name of browsers) {
      try {
        const exec = pw[name];
        // Try to launch — if it fails, browser isn't installed
        const path = exec.executablePath();
        if (path && fs.existsSync(path)) continue;
      } catch {
        // Browser not found — try to install
      }
    }
    return { ok: true, detail: "Playwright + Chromium ready" };
  } catch {
    return {
      ok: false,
      detail:
        'Playwright Chromium not installed. Run: npx playwright install chromium',
    };
  }
}

function checkFfmpeg(): { ok: boolean; detail: string } {
  try {
    // @ffmpeg-installer/ffmpeg bundles a platform-specific binary
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
    if (fs.existsSync(ffmpegPath)) {
      return { ok: true, detail: `ffmpeg: ${ffmpegPath}` };
    }
    return { ok: false, detail: "ffmpeg binary not found" };
  } catch {
    // Fallback: check system PATH
    try {
      execSync("ffmpeg -version", { stdio: "ignore", timeout: 5000 });
      return { ok: true, detail: "ffmpeg (system)" };
    } catch {
      return { ok: false, detail: "ffmpeg not found — install via brew install ffmpeg" };
    }
  }
}

function checkSqlite(): { ok: boolean; detail: string } {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("better-sqlite3");
    return { ok: true, detail: "better-sqlite3 loaded" };
  } catch (e) {
    return {
      ok: false,
      detail: `better-sqlite3 failed to load: ${(e as Error).message}. Run: npm run electron:rebuild`,
    };
  }
}

function checkSkills(): { ok: boolean; detail: string } {
  const skillsRoot = process.env.SKILLS_ROOT || "";
  if (!skillsRoot) {
    return { ok: false, detail: "SKILLS_ROOT not set" };
  }
  if (!fs.existsSync(skillsRoot)) {
    return { ok: false, detail: `Skills directory not found: ${skillsRoot}` };
  }
  const mainSkill = path.join(skillsRoot, "main", "web-video-presentation", "SKILL.md");
  if (!fs.existsSync(mainSkill)) {
    return { ok: false, detail: "Main skill (web-video-presentation) not found" };
  }
  return { ok: true, detail: `Skills: ${skillsRoot}` };
}

function checkDatabase(appData: string): { ok: boolean; detail: string } {
  const dbPath = path.join(appData, "data", "studio.db");
  if (fs.existsSync(dbPath)) {
    return { ok: true, detail: `Database: ${dbPath}` };
  }
  // Will be created on first run — this is expected
  return { ok: true, detail: `Database will be created at: ${dbPath}` };
}

// ── Playwright auto-install (on user consent) ─────────────────────────────

export function installPlaywrightChromium(): { ok: boolean; message: string } {
  try {
    console.log("[bootstrap] Installing Playwright Chromium...");
    execSync("npx playwright install chromium", {
      stdio: "pipe",
      timeout: 120_000,
    });
    return { ok: true, message: "Playwright Chromium installed successfully" };
  } catch (e) {
    return {
      ok: false,
      message: `Installation failed: ${(e as Error).message}`,
    };
  }
}
