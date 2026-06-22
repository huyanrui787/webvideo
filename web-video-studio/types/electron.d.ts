/**
 * Type declarations for the Electron preload API exposed to the renderer.
 * Merges with the global Window interface via declaration merging.
 */

interface BootstrapChecks {
  ok: boolean;
  checks: {
    playwright: { ok: boolean; detail: string };
    ffmpeg: { ok: boolean; detail: string };
    sqlite: { ok: boolean; detail: string };
    skills: { ok: boolean; detail: string };
    database: { ok: boolean; detail: string };
  };
}

interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  selectDirectory: () => Promise<string | null>;
  getAppPaths: () => Promise<{
    appData: string;
    skillsRoot: string;
    isPackaged: boolean;
  }>;
  runBootstrapChecks: () => Promise<BootstrapChecks>;
  installPlaywrightChromium: () => Promise<{ ok: boolean; message: string }>;
}

interface Window {
  electronAPI?: ElectronAPI;
}
