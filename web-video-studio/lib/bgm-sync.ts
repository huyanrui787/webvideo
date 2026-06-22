/**
 * BGM Sync — beat-aware timing for video chapters.
 *
 * Provides:
 *   - Beat snapping: quantize step/chapter start times to nearest beat
 *   - Energy curve: derive visual energy level from audio amplitude envelope
 *   - Tempo map: BPM-aware timeline alignment
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Beat Utilities
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate beat duration in seconds from BPM.
 */
export function beatDurationSec(bpm: number): number {
  return 60 / bpm;
}

/**
 * Snap a timestamp to the nearest beat.
 * @param timeSec absolute time in seconds
 * @param bpm beats per minute
 * @param offsetBeats initial beat offset
 */
export function snapToBeat(timeSec: number, bpm: number, offsetBeats: number = 0): number {
  const beatSec = beatDurationSec(bpm);
  const beatIndex = Math.round((timeSec / beatSec) - offsetBeats);
  return (beatIndex + offsetBeats) * beatSec;
}

/**
 * Snap all step start times in a chapter to the nearest beat.
 */
export function snapChapterToBeat(
  stepDurations: number[],
  chapterStartSec: number,
  bpm: number,
  offsetBeats: number = 0
): number[] {
  let cursor = chapterStartSec;
  return stepDurations.map((dur) => {
    const snapped = snapToBeat(cursor, bpm, offsetBeats);
    // Ensure monotonic: if snap moves backwards, keep original
    const start = Math.max(snapped, cursor - beatDurationSec(bpm) / 2);
    cursor = start + dur;
    return start;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Energy Curve
// ═══════════════════════════════════════════════════════════════════════════════

export type EnergyLevel = "calm" | "moderate" | "high" | "peak";

/**
 * Derive an energy level from a normalized amplitude value [0, 1].
 */
export function energyFromAmplitude(amplitude: number): EnergyLevel {
  if (amplitude < 0.25) return "calm";
  if (amplitude < 0.5) return "moderate";
  if (amplitude < 0.75) return "high";
  return "peak";
}

/**
 * Build an energy curve from an array of amplitude samples.
 * Returns one energy level per sample (typically one per step).
 */
export function buildEnergyCurve(
  amplitudes: number[],
  smoothingWindow: number = 2
): EnergyLevel[] {
  const curve: EnergyLevel[] = [];
  for (let i = 0; i < amplitudes.length; i++) {
    // Simple moving average
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - smoothingWindow); j <= Math.min(amplitudes.length - 1, i + smoothingWindow); j++) {
      sum += amplitudes[j];
      count++;
    }
    const smoothed = sum / count;
    curve.push(energyFromAmplitude(smoothed));
  }
  return curve;
}

/**
 * Map an energy level to recommended animation parameters.
 */
export function energyToAnimation(energy: EnergyLevel): {
  revealDuration: number;
  staggerDelay: number;
  motionEasing: string;
} {
  switch (energy) {
    case "calm":
      return { revealDuration: 1.0, staggerDelay: 0.2, motionEasing: "var(--motion-gentle)" };
    case "moderate":
      return { revealDuration: 0.7, staggerDelay: 0.15, motionEasing: "var(--motion-smooth)" };
    case "high":
      return { revealDuration: 0.5, staggerDelay: 0.1, motionEasing: "var(--motion-snappy)" };
    case "peak":
      return { revealDuration: 0.35, staggerDelay: 0.06, motionEasing: "var(--motion-snappy)" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Timeline Alignment
// ═══════════════════════════════════════════════════════════════════════════════

export interface BGMTimelineEntry {
  chapterId: string;
  stepIdx: number;
  originalStartSec: number;
  snappedStartSec: number;
  durationSec: number;
  energy: EnergyLevel;
}

/**
 * Build a beat-aligned timeline from raw step durations + BGM config.
 */
export function buildAlignedTimeline(
  chapters: Array<{
    chapterId: string;
    stepDurations: number[];
    bgmSync?: { bpm?: number; beatAlign?: string; offsetBeats?: number };
  }>,
  bpm: number,
  offsetBeats: number = 0
): BGMTimelineEntry[] {
  const timeline: BGMTimelineEntry[] = [];
  let cursor = 0.0;

  for (const ch of chapters) {
    const chBpm = ch.bgmSync?.bpm ?? bpm;
    const chOffset = ch.bgmSync?.offsetBeats ?? offsetBeats;
    const align = ch.bgmSync?.beatAlign ?? "off";

    for (let si = 0; si < ch.stepDurations.length; si++) {
      const dur = ch.stepDurations[si];
      let start = cursor;

      // Snap to beat if chapter-level or step-level alignment is on
      if (align === "chapter" || align === "step") {
        start = snapToBeat(cursor, chBpm, chOffset);
      }

      timeline.push({
        chapterId: ch.chapterId,
        stepIdx: si,
        originalStartSec: cursor,
        snappedStartSec: start,
        durationSec: dur,
        energy: "moderate", // default; can be overridden from energy curve
      });

      cursor = start + dur;
    }
  }

  return timeline;
}

/**
 * Convert aligned timeline to an array of accumulated start times for chapters.ts injection.
 */
export function timelineToStepDurations(
  timeline: BGMTimelineEntry[]
): Map<string, number[]> {
  const byChapter = new Map<string, number[]>();

  for (const entry of timeline) {
    const durations = byChapter.get(entry.chapterId) || [];
    durations[entry.stepIdx] = entry.durationSec;
    byChapter.set(entry.chapterId, durations);
  }

  return byChapter;
}
