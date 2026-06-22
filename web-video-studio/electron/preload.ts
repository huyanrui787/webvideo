/**
 * Electron preload script — exposes a minimal, safe API to the renderer process
 * via contextBridge. The renderer (Next.js app) can access these APIs through
 * `window.electronAPI`.
 */

import { contextBridge, ipcRenderer } from "electron";

export interface BootstrapChecks {
  ok: boolean;
  checks: {
    playwright: { ok: boolean; detail: string };
    ffmpeg: { ok: boolean; detail: string };
    sqlite: { ok: boolean; detail: string };
    skills: { ok: boolean; detail: string };
    database: { ok: boolean; detail: string };
  };
}

export interface ElectronAPI {
  /** Get the app version string. */
  getAppVersion: () => Promise<string>;
  /** Open a native directory picker dialog. Returns the selected path or null. */
  selectDirectory: () => Promise<string | null>;
  /** Get app-level paths (appData, skillsRoot, etc.). */
  getAppPaths: () => Promise<{
    appData: string;
    skillsRoot: string;
    isPackaged: boolean;
  }>;
  /** Run environment bootstrap checks (Playwright, ffmpeg, etc.). */
  runBootstrapChecks: () => Promise<BootstrapChecks>;
  /** Install Playwright Chromium (requires network). */
  installPlaywrightChromium: () => Promise<{ ok: boolean; message: string }>;
}

contextBridge.exposeInMainWorld("electronAPI", {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  getAppPaths: () => ipcRenderer.invoke("get-app-paths"),
  runBootstrapChecks: () => ipcRenderer.invoke("run-bootstrap-checks"),
  installPlaywrightChromium: () => ipcRenderer.invoke("install-playwright-chromium"),
} satisfies ElectronAPI);
