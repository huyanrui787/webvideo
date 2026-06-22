/**
 * Window state persistence — remembers window position and size across sessions.
 */

import { BrowserWindow } from "electron";
import fs from "fs";
import path from "path";

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized?: boolean;
}

const DEFAULT_STATE: WindowState = {
  width: 1400,
  height: 900,
};

function getStatePath(): string {
  // Store alongside settings
  const appData = process.env.WEBVIDEO_APP_DATA || "";
  return path.join(appData, "data", "window-state.json");
}

export function loadWindowState(): WindowState {
  try {
    const p = getStatePath();
    if (fs.existsSync(p)) {
      return { ...DEFAULT_STATE, ...JSON.parse(fs.readFileSync(p, "utf-8")) };
    }
  } catch { /* use defaults */ }
  return { ...DEFAULT_STATE };
}

export function saveWindowState(win: BrowserWindow): void {
  try {
    const bounds = win.getBounds();
    const state: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized: win.isMaximized(),
    };
    const p = getStatePath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(state, null, 2), "utf-8");
  } catch { /* best effort */ }
}

/** Attach save handlers to a BrowserWindow. */
export function trackWindowState(win: BrowserWindow): void {
  win.on("resize", () => saveWindowState(win));
  win.on("move", () => saveWindowState(win));
  win.on("maximize", () => saveWindowState(win));
  win.on("unmaximize", () => saveWindowState(win));
  win.on("close", () => saveWindowState(win));
}
