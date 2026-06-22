/**
 * Electron main process — manages the app lifecycle, starts the Next.js server,
 * creates BrowserWindow(s), and handles IPC.
 */

import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import path from "path";
import fs from "fs";
import { startNextServer, stopNextServer, waitForServer } from "./server";
import { buildAppMenu } from "./menu";
import { loadWindowState, trackWindowState } from "./window-state";
import { runBootstrapChecks, installPlaywrightChromium } from "./bootstrap";

// ── App data path ──────────────────────────────────────────────────────────────

// Set userData BEFORE app is ready so all path resolution uses the right base.
// In development this has no effect — paths fall back to cwd.
// In packaged mode this ensures data goes to ~/Library/Application Support/<name>/
const APP_DATA = path.join(app.getPath("userData"));
process.env.WEBVIDEO_APP_DATA = APP_DATA;

// ── Window management ──────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null;
let nextServerPort = 3100;

/** Get the current main window (for menu actions that need a window ref). */
function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

function createMainWindow(): void {
  const windowState = loadWindowState();

  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 960,
    minHeight: 640,
    title: "WebVideo Studio",
    titleBarStyle: "hiddenInset", // macOS native feel
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for Playwright in render-worker
    },
  });

  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  // Persist window state
  trackWindowState(mainWindow);

  // Load the Next.js app
  const url = `http://localhost:${nextServerPort}`;
  console.log(`[electron] Loading ${url}`);
  mainWindow.loadURL(url);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Open external links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://localhost:${nextServerPort}`)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });
}

// ── App lifecycle ──────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  console.log("[electron] App ready, starting Next.js server...");

  // ── Run bootstrap checks ──────────────────────────────────────────────────
  const bootstrap = runBootstrapChecks(APP_DATA);
  console.log("[electron] Bootstrap:", JSON.stringify(bootstrap.checks, null, 2));
  if (!bootstrap.ok) {
    console.warn("[electron] Some bootstrap checks failed — app may have limited functionality");
  }

  // ── Load API keys from settings store ─────────────────────────────────────
  loadSettingsIntoEnv();

  // Resolve skills root: bundled resources (packaged) or development path
  const skillsRoot = process.env.SKILLS_ROOT?.trim()
    || (app.isPackaged
      ? path.join(process.resourcesPath, "skills")
      : path.resolve(__dirname, "..", "..", "skills"));

  if (!fs.existsSync(skillsRoot)) {
    console.warn(`[electron] Skills root not found: ${skillsRoot}`);
    console.warn("[electron] Set SKILLS_ROOT env var or bundle skills as extraResources.");
  } else {
    process.env.SKILLS_ROOT = skillsRoot;
    console.log(`[electron] Skills root: ${skillsRoot}`);
  }

  // Determine port
  nextServerPort = parseInt(process.env.PORT || process.env.NEXT_PORT || "3100", 10);

  try {
    // Start the Next.js server
    await startNextServer(nextServerPort);
    console.log(`[electron] Next.js server started on port ${nextServerPort}`);

    // Wait for it to be ready
    await waitForServer(nextServerPort, 30_000);
    console.log("[electron] Next.js server is ready");

    // Create the main window first so menu actions have a window reference
    createMainWindow();

    // Build native menu (after window creation so menu actions can access it)
    buildAppMenu(getMainWindow);
  } catch (err) {
    console.error("[electron] Failed to start:", err);
    dialog.showErrorBox(
      "Startup Error",
      `Failed to start the application server:\n${(err as Error).message}`
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

app.on("will-quit", async () => {
  console.log("[electron] Shutting down...");
  await stopNextServer();
});

// ── Settings loader ───────────────────────────────────────────────────────────

/**
 * Load API keys and endpoints from the settings JSON file into process.env.
 * This runs BEFORE the Next.js server starts so the server picks up the keys.
 * We read the file directly (no Next.js module resolution) because we're in
 * the Electron main process.
 */
function loadSettingsIntoEnv(): void {
  const settingsPath = path.join(APP_DATA, "data", "settings.json");
  try {
    if (!fs.existsSync(settingsPath)) {
      console.log("[electron] No settings file found — using env vars only");
      return;
    }
    const raw = fs.readFileSync(settingsPath, "utf-8");
    const settings = JSON.parse(raw);
    const { apiKeys = {}, endpoints = {}, preferences = {} } = settings;

    // API keys → process.env
    if (apiKeys.anthropic) process.env.ANTHROPIC_API_KEY = apiKeys.anthropic;
    if (apiKeys.heygen) process.env.HEYGEN_API_KEY = apiKeys.heygen;
    if (apiKeys.fal) process.env.FAL_KEY = apiKeys.fal;
    if (apiKeys.dashscope) process.env.DASHSCOPE_API_KEY = apiKeys.dashscope;
    if (apiKeys.deepseek) process.env.DEEPSEEK_API_KEY = apiKeys.deepseek;
    if (apiKeys.gptImage) process.env.GPT_IMAGE_KEY = apiKeys.gptImage;
    if (apiKeys.stripe) process.env.STRIPE_SECRET_KEY = apiKeys.stripe;

    // Endpoints
    if (endpoints.anthropicBaseUrl) process.env.ANTHROPIC_BASE_URL = endpoints.anthropicBaseUrl;
    if (endpoints.buildAnthropicBaseUrl) process.env.BUILD_ANTHROPIC_BASE_URL = endpoints.buildAnthropicBaseUrl;
    if (endpoints.gptImageBaseUrl) process.env.GPT_IMAGE_BASE_URL = endpoints.gptImageBaseUrl;

    // Preferences
    if (preferences.mainSkillId) process.env.MAIN_SKILL_ID = preferences.mainSkillId;
    if (preferences.skillsRoot) process.env.SKILLS_ROOT = preferences.skillsRoot;

    console.log("[electron] Settings loaded from", settingsPath);
  } catch (err) {
    console.warn("[electron] Failed to load settings:", (err as Error).message);
  }
}

// ── IPC handlers ───────────────────────────────────────────────────────────────

ipcMain.handle("get-app-version", () => app.getVersion());

ipcMain.handle("select-directory", async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("get-app-paths", () => ({
  appData: APP_DATA,
  skillsRoot: process.env.SKILLS_ROOT || "",
  isPackaged: app.isPackaged,
}));

ipcMain.handle("run-bootstrap-checks", () => {
  return runBootstrapChecks(APP_DATA);
});

ipcMain.handle("install-playwright-chromium", () => {
  return installPlaywrightChromium();
});
