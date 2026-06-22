import type { ComponentType } from "react";

export interface ChapterStepProps {
  step: number; // 0..(narrations.length - 1)
  /**
   * Seconds elapsed since this step started. Only provided in render/seek mode.
   * Chapters can use it to drive Canvas / GSAP directly. Ignored in interactive mode.
   */
  stepTime?: number;
}

/**
 * One narration entry — the spoken text for that step.
 *
 * Empty string ("") means "no audio for this step" (e.g. silent transition
 * shot). Auto mode falls back to a short estimate when audio is missing or
 * the text is empty.
 */
export type Narration = string;

export interface ChapterDef {
  id: string;
  title: string;
  /**
   * Per-step narration text. **Length === total steps in this chapter.**
   * This is the single source of truth for step count and audio synthesis.
   */
  narrations: Narration[];
  Component: ComponentType<ChapterStepProps>;
  /**
   * Duration (seconds) for each step in rendered/seekable mode.
   * Length must equal narrations.length.
   * If omitted, each step defaults to DEFAULT_STEP_DURATION seconds.
   */
  stepDurations?: number[];
}

/** Fallback step duration used when a chapter doesn't specify stepDurations. */
export const DEFAULT_STEP_DURATION = 3.0;
