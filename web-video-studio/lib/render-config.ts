/**
 * Render Configuration — resolution presets and quality settings.
 *
 * Used by both render.ts (API) and render-worker*.js (worker processes).
 */

export interface ResolutionPreset {
  width: number;
  height: number;
  crf: number;
  label: string;
  description: string;
}

export const RESOLUTION_PRESETS: Record<string, ResolutionPreset> = {
  preview: {
    width: 1280,
    height: 720,
    crf: 23,
    label: "预览 720p",
    description: "快速预览，文件小，适合迭代检查",
  },
  standard: {
    width: 1920,
    height: 1080,
    crf: 18,
    label: "标准 1080p",
    description: "默认质量，适合多数交付场景",
  },
  high: {
    width: 2560,
    height: 1440,
    crf: 16,
    label: "高清 1440p",
    description: "高画质，适合重要交付",
  },
  ultra: {
    width: 3840,
    height: 2160,
    crf: 14,
    label: "超清 4K",
    description: "最高质量，文件较大",
  },
};

export const DEFAULT_RESOLUTION = "standard";

/** Get a resolution preset by key, falling back to standard */
export function getResolution(key?: string): ResolutionPreset {
  if (key && RESOLUTION_PRESETS[key]) return RESOLUTION_PRESETS[key]!;
  return RESOLUTION_PRESETS[DEFAULT_RESOLUTION]!;
}

/** List available resolution keys for UI selectors */
export function listResolutions(): Array<{ key: string; label: string; description: string }> {
  return Object.entries(RESOLUTION_PRESETS).map(([key, preset]) => ({
    key,
    label: preset.label,
    description: preset.description,
  }));
}
