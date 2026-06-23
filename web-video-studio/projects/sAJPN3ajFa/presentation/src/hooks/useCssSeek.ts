import { useEffect, useRef } from "react";

/**
 * Seek all CSS @keyframe animations inside `containerRef` to time `t` (seconds).
 *
 * Technique (same as HyperFrames runtime):
 *   animation-play-state: paused
 *   animation-delay: -${t_relative}s
 *
 * Where t_relative = t - element's own data-anim-start (or 0 if not set).
 * With `animation-fill-mode: both` (already on all chapter animations),
 * the element is frozen at the exact keyframe state for time t.
 *
 * CSS `transition`-based animations (MaskReveal) cannot be seeked this way.
 * Those elements are handled by passing `seekMode=true` to MaskReveal,
 * which skips the transition and immediately applies the end state if t > delay.
 */
export function useCssSeek(
  containerRef: React.RefObject<HTMLElement | null>,
  t: number | null, // null = not in seek mode
) {
  const prevT = useRef<number | null>(null);

  useEffect(() => {
    if (t === null) {
      // Exit seek mode: restore play state
      if (prevT.current !== null) {
        const els = containerRef.current?.querySelectorAll<HTMLElement>("*") ?? [];
        for (const el of els) {
          el.style.removeProperty("animation-play-state");
          el.style.removeProperty("animation-delay");
        }
        prevT.current = null;
      }
      return;
    }

    prevT.current = t;
    const container = containerRef.current;
    if (!container) return;

    // Small rAF delay so React has finished rendering the step's DOM
    const id = requestAnimationFrame(() => {
      const els = container.querySelectorAll<HTMLElement>("*");
      for (const el of els) {
        const style = window.getComputedStyle(el);
        const animName = style.animationName;
        if (!animName || animName === "none") continue;

        const durationStr = style.animationDuration; // e.g. "0.9s"
        const delayStr = style.animationDelay;       // e.g. "0.2s, 300ms"

        const durations = parseTimes(durationStr);
        const delays = parseTimes(delayStr);

        // Build new negative delays: -(t - originalDelay) clamped to [-(dur), 0]
        const newDelays = durations.map((dur, i) => {
          const origDelay = delays[i] ?? 0;
          const elapsed = t - origDelay;
          if (elapsed <= 0) return origDelay; // animation hasn't started yet → keep original positive delay
          const seekDelay = -(Math.min(elapsed, dur));
          return seekDelay;
        });

        el.style.animationDelay = newDelays.map(s => `${s.toFixed(4)}s`).join(", ");
        el.style.animationPlayState = "paused";
      }
    });

    return () => cancelAnimationFrame(id);
  }, [t, containerRef]);
}

/** Parse a CSS time string like "0.9s, 300ms, 1.4s" → array of seconds */
function parseTimes(str: string): number[] {
  return str.split(",").map(s => {
    const v = s.trim();
    if (v.endsWith("ms")) return parseFloat(v) / 1000;
    if (v.endsWith("s")) return parseFloat(v);
    return 0;
  });
}
