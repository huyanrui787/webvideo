import { useMemo, useEffect } from "react";
import type { ChapterDef } from "../registry/types";
import { DEFAULT_STEP_DURATION } from "../registry/types";

/**
 * Computes the absolute time (seconds) for every step in the presentation
 * and exposes it on `window` for the headless renderer.
 *
 * Each step occupies [startSec, startSec + duration).
 * `totalDuration` = sum of all step durations.
 *
 * Returns helpers to convert between global time ↔ (chapter, step).
 */
export function useTimeline(chapters: ChapterDef[]) {
  const { boundaries, totalDuration } = useMemo(() => {
    // boundaries[globalIndex] = { chapter, step, startSec, duration }
    const boundaries: Array<{
      chapter: number;
      step: number;
      startSec: number;
      duration: number;
    }> = [];

    let cursor = 0;
    for (let ci = 0; ci < chapters.length; ci++) {
      const ch = chapters[ci]!;
      for (let si = 0; si < ch.narrations.length; si++) {
        const dur = ch.stepDurations?.[si] ?? DEFAULT_STEP_DURATION;
        boundaries.push({ chapter: ci, step: si, startSec: cursor, duration: dur });
        cursor += dur;
      }
    }
    return { boundaries, totalDuration: cursor };
  }, [chapters]);

  /** Find which (chapter, step) owns time `t`, and how far into that step `t` is. */
  function seekToTime(t: number): {
    chapter: number;
    step: number;
    stepTime: number; // seconds elapsed within this step
  } | null {
    if (boundaries.length === 0) return null;
    const clamped = Math.max(0, Math.min(t, totalDuration - 0.001));
    for (let i = boundaries.length - 1; i >= 0; i--) {
      const b = boundaries[i]!;
      if (clamped >= b.startSec) {
        return {
          chapter: b.chapter,
          step: b.step,
          stepTime: clamped - b.startSec,
        };
      }
    }
    return { chapter: 0, step: 0, stepTime: 0 };
  }

  // Expose timing info for the headless renderer
  useEffect(() => {
    const win = window as unknown as Record<string, unknown>;
    win.__hfTotalDuration = totalDuration;
    win.__hfStepBoundaries = boundaries;
  }, [totalDuration, boundaries]);

  return { boundaries, totalDuration, seekToTime };
}
