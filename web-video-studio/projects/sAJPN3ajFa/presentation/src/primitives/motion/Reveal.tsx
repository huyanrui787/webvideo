import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap } from "gsap";

type Direction = "up" | "down" | "left" | "right" | "none";

interface RevealProps {
  children: ReactNode;
  /** Which direction the element enters from. Default: "up" */
  from?: Direction;
  /** Delay in seconds before animation starts. Default: 0 */
  delay?: number;
  /** Animation duration in seconds. Default: 0.7 */
  duration?: number;
  /** GSAP ease string. Default: "power3.out" */
  ease?: string;
  /** Distance of the translate in px. Default: 32 */
  distance?: number;
  /** Seconds elapsed within the current step (seek/render mode). */
  stepTime?: number;
  className?: string;
  style?: CSSProperties;
}

const OFFSETS: Record<Direction, { x: number; y: number }> = {
  up:    { x: 0,  y: 32  },
  down:  { x: 0,  y: -32 },
  left:  { x: 32, y: 0   },
  right: { x: -32,y: 0   },
  none:  { x: 0,  y: 0   },
};

/**
 * Entrance animation: element rises/slides in from `from` direction.
 * In seek mode (stepTime provided), instantly shows the end state if
 * enough time has elapsed, bypassing GSAP entirely.
 *
 * Usage:
 *   <Reveal from="up" delay={0.2} stepTime={stepTime}>
 *     <h1>Title</h1>
 *   </Reveal>
 */
export function Reveal({
  children,
  from = "up",
  delay = 0,
  duration = 0.7,
  ease = "power3.out",
  distance,
  stepTime,
  className,
  style,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const offset = OFFSETS[from];
  const dx = distance !== undefined ? (from === "right" ? -distance : from === "left" ? distance : 0) : offset.x;
  const dy = distance !== undefined ? (from === "down" ? -distance : from === "up" ? distance : 0) : offset.y;

  // Seek mode: compute instantaneous state
  const isSeek = stepTime !== undefined;
  if (isSeek) {
    const elapsed = stepTime - delay;
    const done = elapsed >= duration;
    const progress = done ? 1 : elapsed <= 0 ? 0 : elapsed / duration;
    // Simple linear approximation for seek (close enough for frame rendering)
    const seekStyle: CSSProperties = {
      opacity: progress,
      transform: `translate(${dx * (1 - progress)}px, ${dy * (1 - progress)}px)`,
      ...style,
    };
    return <div className={className} style={seekStyle}>{children}</div>;
  }

  // Interactive mode: GSAP animation with fallback
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    // Fallback: if GSAP fails or takes >3s, force-show
    const fallback = setTimeout(() => { el.style.opacity = "1"; el.style.transform = "none"; }, 3000);
    try {
      gsap.fromTo(
        el,
        { opacity: 0, x: dx, y: dy },
        { opacity: 1, x: 0, y: 0, duration, delay, ease, clearProps: "transform,opacity", onComplete: () => clearTimeout(fallback) },
      );
    } catch {
      el.style.opacity = "1"; el.style.transform = "none";
      clearTimeout(fallback);
    }
    return () => clearTimeout(fallback);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} className={className} style={{ opacity: 0, ...style }}>
      {children}
    </div>
  );
}
