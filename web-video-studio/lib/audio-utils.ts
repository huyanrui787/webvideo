/**
 * Audio duration utilities.
 * Measures actual MP3 duration using available system tools,
 * falls back to text-based estimation.
 */

import { execSync } from "child_process";
import fs from "fs";

/**
 * Get the actual duration of an MP3 file in seconds.
 *
 * Detection chain:
 *   1. ffprobe (cross-platform, most accurate)
 *   2. macOS `mdls` (built-in Spotlight metadata)
 *   3. Text-based estimation (no file / no tools available)
 *
 * @param mp3Path  Absolute path to the MP3 file
 * @param textFallback  Narration text for estimation when file can't be read
 */
export function getAudioFileDuration(mp3Path: string, textFallback?: string): number {
  if (!fs.existsSync(mp3Path)) {
    return textFallback ? estimateDuration(textFallback) : 5;
  }

  // ── 1. ffprobe (cross-platform) ─────────────────────────
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${mp3Path}"`,
      { timeout: 5000, encoding: "utf-8" },
    ).trim();
    const n = parseFloat(out);
    if (n > 0) return Math.round(n * 10) / 10; // round to 1 decimal
  } catch {
    // ffprobe not available
  }

  // ── 2. macOS Spotlight metadata ─────────────────────────
  try {
    const out = execSync(
      `mdls -name kMDItemDurationSeconds "${mp3Path}"`,
      { timeout: 5000, encoding: "utf-8" },
    ).trim();
    const m = out.match(/=\s*([\d.]+)/);
    if (m) {
      const n = parseFloat(m[1]);
      if (n > 0) return Math.round(n * 10) / 10;
    }
  } catch {
    // Not macOS or mdls unavailable
  }

  // ── 3. Fallback ─────────────────────────────────────────
  return textFallback ? estimateDuration(textFallback) : 5;
}

/**
 * Estimate narration duration from text.
 * Useful as fallback when audio file hasn't been synthesized yet.
 *
 * Rate assumptions:
 *   - Chinese characters: ~3.5 chars / sec
 *   - English words:      ~4  words / sec
 *   - Punctuation pauses: ~0.3 sec each
 *   - Minimum:            3 sec
 */
export function estimateDuration(text: string): number {
  const cjkLen = (text.match(/[一-鿿]/g) || []).length;
  const wordCount = (text.match(/[a-zA-Z0-9]+/g) || []).length;
  const pauseCount = (text.match(/[，。！？、；：""''（）,.!?;:]/g) || []).length;
  const dur = cjkLen / 3.5 + wordCount / 4 + pauseCount * 0.3 + 0.5;
  return Math.max(3, Math.ceil(dur));
}
