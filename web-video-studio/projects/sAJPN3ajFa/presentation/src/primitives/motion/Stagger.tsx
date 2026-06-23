import { useEffect, useRef, Children, type ReactNode, type CSSProperties } from "react";
import { gsap } from "gsap";

interface StaggerProps {
  children: ReactNode;
  /** Delay between each child, in seconds. Default: 0.12 */
  interval?: number;
  /** Delay before the first child starts, in seconds. Default: 0 */
  delay?: number;
  /** Duration of each child's animation. Default: 0.6 */
  duration?: number;
  /** Entry direction for each child. Default: "up" */
  from?: "up" | "down" | "left" | "right" | "none";
  ease?: string;
  stepTime?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Reveals children one by one with a stagger delay.
 * Each child must be a single element (not a fragment).
 *
 * Usage:
 *   <Stagger interval={0.15} delay={0.3} stepTime={stepTime}>
 *     <div>Item A</div>
 *     <div>Item B</div>
 *     <div>Item C</div>
 *   </Stagger>
 */
export function Stagger({
  children,
  interval = 0.12,
  delay = 0,
  duration = 0.6,
  from = "up",
  ease = "power3.out",
  stepTime,
  className,
  style,
}: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isSeek = stepTime !== undefined;

  const dy = from === "up" ? 24 : from === "down" ? -24 : 0;
  const dx = from === "left" ? 24 : from === "right" ? -24 : 0;

  const items = Children.toArray(children);

  if (isSeek) {
    return (
      <div ref={ref} className={className} style={style}>
        {items.map((child, i) => {
          const childDelay = delay + i * interval;
          const elapsed = stepTime - childDelay;
          const progress = elapsed <= 0 ? 0 : elapsed >= duration ? 1 : elapsed / duration;
          return (
            <div
              key={i}
              style={{
                opacity: progress,
                transform: `translate(${dx * (1 - progress)}px, ${dy * (1 - progress)}px)`,
              }}
            >
              {child}
            </div>
          );
        })}
      </div>
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!ref.current) return;
    const els = Array.from(ref.current.children) as HTMLElement[];
    let cancelled = false;
    // Fallback: if GSAP fails or takes >3s, force-show all children
    const fallback = setTimeout(() => {
      if (cancelled) return;
      els.forEach((el) => { el.style.opacity = "1"; el.style.transform = "none"; });
    }, 3000);
    try {
      gsap.fromTo(
        els,
        { opacity: 0, x: dx, y: dy },
        {
          opacity: 1, x: 0, y: 0,
          duration,
          delay,
          ease,
          stagger: interval,
          clearProps: "transform,opacity",
          onComplete: () => clearTimeout(fallback),
        },
      );
    } catch {
      // GSAP not available — show content immediately
      els.forEach((el) => { el.style.opacity = "1"; el.style.transform = "none"; });
      clearTimeout(fallback);
    }
    return () => { cancelled = true; clearTimeout(fallback); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} className={className} style={style}>
      {items.map((child, i) => (
        <div key={i} style={{ opacity: 0 }}>{child}</div>
      ))}
    </div>
  );
}
