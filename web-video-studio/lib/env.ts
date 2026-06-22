/**
 * Unified path resolution for the web-video-studio application.
 *
 * In development (npm run dev), paths are relative to process.cwd() — the
 * web-video-studio/ directory.  In Electron / packaged mode, set the
 * WEBVIDEO_APP_DATA environment variable to the user-data directory
 * (e.g. ~/Library/Application Support/WebVideoStudio/) and all persistent
 * data (database, projects, settings) will be stored there.
 *
 * Skills are a special case: they ship as bundled resources inside the
 * Electron .app bundle, so getSkillsRoot() checks the resources/ directory
 * before falling back to the env var and the development-relative default.
 */

import path from "path";
import fs from "fs";

// ── App data root ───────────────────────────────────────────────────────────

/** The root directory for all persistent application data. */
export function getAppDataDir(): string {
  return process.env.WEBVIDEO_APP_DATA?.trim() || process.cwd();
}

// ── Derived paths ───────────────────────────────────────────────────────────

/** Directory containing the SQLite database file. */
export function getDataDir(): string {
  return path.join(getAppDataDir(), "data");
}

/** Path to the SQLite database file. */
export function getDatabasePath(): string {
  return path.join(getDataDir(), "studio.db");
}

/** Root directory for per-project files (presentation/ Vite projects, assets, etc.). */
export function getProjectsDir(): string {
  return path.join(getAppDataDir(), "projects");
}

/** Root directory for the skills tree. */
export function getSkillsRoot(): string {
  // 1) Explicit env var (development or custom setups)
  if (process.env.SKILLS_ROOT?.trim()) return process.env.SKILLS_ROOT.trim();

  // 2) Bundled inside Electron resources/ (packaged mode)
  const resourcesSkills = path.join(getAppDataDir(), "resources", "skills");
  if (fs.existsSync(resourcesSkills)) return resourcesSkills;

  // 3) Development fallback — sibling of web-video-studio/
  return path.resolve(getAppDataDir(), "..", "skills");
}

/** Convenience: absolute path to the main skill directory. */
export function getMainSkillDir(): string {
  const mainSkillId = process.env.MAIN_SKILL_ID?.trim() || "web-video-presentation";
  return path.join(getSkillsRoot(), "main", mainSkillId);
}

/** Convenience: absolute path to the main skill's scripts/ directory. */
export function getMainSkillScriptsDir(): string {
  return path.join(getMainSkillDir(), "scripts");
}

// ── Server / networking ─────────────────────────────────────────────────────

/** Port the Next.js server listens on. */
function getServerPort(): number {
  return parseInt(process.env.PORT || process.env.NEXT_PORT || "3100", 10);
}

/** Base URL for internal API calls (avoids hardcoded localhost:3100). */
export function getServerBaseUrl(): string {
  return `http://localhost:${getServerPort()}`;
}

// ── External tool paths ─────────────────────────────────────────────────────

/** Path to the Manim Python virtual environment. */
export function getManimVenvDir(): string {
  return (
    process.env.MANIM_VENV_DIR?.trim() ||
    path.resolve(getAppDataDir(), "..", "manim-venv")
  );
}

/** Path to the Manim Python binary. */
export function getManimPythonPath(): string {
  return (
    process.env.MANIM_PYTHON_PATH?.trim() ||
    path.join(getManimVenvDir(), "bin", "python")
  );
}

/** Path to the Manim CLI binary. */
export function getManimCliPath(): string {
  return (
    process.env.MANIM_CLI_PATH?.trim() ||
    path.join(getManimVenvDir(), "bin", "manim")
  );
}

// ── Render worker ───────────────────────────────────────────────────────────

/** Path to the render-worker.js script. */
export function getRenderWorkerPath(): string {
  // In packaged Electron, this is bundled alongside the app
  const bundled = path.join(getAppDataDir(), "lib", "render-worker.js");
  if (fs.existsSync(bundled)) return bundled;
  // Development fallback
  return path.join(getAppDataDir(), "lib", "render-worker.js");
}

/** Path to the snapshot-worker.js script for visual testing. */
export function getSnapshotWorkerPath(): string {
  const bundled = path.join(getAppDataDir(), "lib", "snapshot-worker.js");
  if (fs.existsSync(bundled)) return bundled;
  return path.join(getAppDataDir(), "lib", "snapshot-worker.js");
}

// ── Settings ────────────────────────────────────────────────────────────────

/** Path to the user settings file (API keys, preferences). */
export function getSettingsPath(): string {
  return path.join(getDataDir(), "settings.json");
}

// ── Boot validation ─────────────────────────────────────────────────────────

let _bootValidated = false;

function validateBoot(): void {
  if (_bootValidated) return;
  _bootValidated = true;

  const skillsRoot = getSkillsRoot();
  if (!fs.existsSync(skillsRoot)) {
    console.error(
      `[env] Skills root not found: ${skillsRoot}\n` +
        `  Set SKILLS_ROOT env var or ensure skills/ is bundled as a resource.\n` +
        `  App data dir: ${getAppDataDir()}`
    );
  } else {
    console.log(`[env] Skills root: ${skillsRoot}`);
  }

  // Ensure data directory exists
  const dataDir = getDataDir();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`[env] Created data directory: ${dataDir}`);
  }
}
