import type { CSSProperties, ReactNode } from "react";

interface Props {
  show: boolean;
  delay?: number;
  duration?: number;
  className?: string;
  children: ReactNode;
  /**
   * Seconds elapsed within the current step (provided by App in seek/render mode).
   * When set, the transition is bypassed and the element is instantly shown/hidden
   * based on whether `stepTime >= delay`.
   */
  stepTime?: number;
}

/**
 * clip-path text wipe. Pair with `.mask-reveal` and `.mask-reveal.in` from
 * animations.css. Use for any text that should appear (not fade).
 *
 * In seek/render mode (stepTime provided), CSS transitions are bypassed —
 * the final state is applied immediately so headless frames are correct.
 */
export function MaskReveal({
  show,
  delay = 0,
  duration,
  className,
  children,
  stepTime,
}: Props) {
  const isSeekMode = stepTime !== undefined;

  // In seek mode: show immediately if enough time has elapsed, ignore transition
  const isIn = isSeekMode
    ? show && stepTime >= delay / 1000
    : show;

  const cls = ["mask-reveal", isIn ? "in" : "", className]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties = isSeekMode
    ? {
        display: "inline-block",
        // Bypass transition entirely — renderer is paused at this frame
        transition: "none",
      }
    : {
        display: "inline-block",
        transitionDelay: show ? `${delay}ms` : "0ms",
        ...(duration ? { transitionDuration: `${duration}ms` } : null),
      };

  return (
    <span className={cls} style={style}>
      {children}
    </span>
  );
}

