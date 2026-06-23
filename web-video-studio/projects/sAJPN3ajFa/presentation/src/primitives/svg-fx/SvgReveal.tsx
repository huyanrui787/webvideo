import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap } from "gsap";

interface SvgRevealProps {
  children: ReactNode;
  /** Animation duration in seconds. Default: 1.4 */
  duration?: number;
  delay?: number;
  /** Whether to also fade in fill after stroke draw. Default: true */
  fillReveal?: boolean;
  /** Fill animation duration. Default: 0.5 */
  fillDuration?: number;
  stepTime?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Reveals all SVG <path> strokes inside like a pen drawing them.
 * After stroke completes, optionally fades in fill.
 *
 * Usage:
 *   <SvgReveal duration={1.8} stepTime={stepTime}>
 *     <svg viewBox="0 0 200 200">
 *       <path d="M 10 100 C 50 20, 150 20, 190 100" fill="#e63" stroke="#e63" strokeWidth="3"/>
 *     </svg>
 *   </SvgReveal>
 */
export function SvgReveal({
  children,
  duration = 1.4,
  delay = 0,
  fillReveal = true,
  fillDuration = 0.5,
  stepTime,
  className,
  style,
}: SvgRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const paths = Array.from(container.querySelectorAll("path, circle, ellipse, polyline, polygon, line")) as SVGGeometryElement[];
    if (!paths.length) return;

    // Prep: measure each path
    const lengths = paths.map((p) => {
      try { return (p as SVGPathElement).getTotalLength?.() ?? 200; } catch { return 200; }
    });

    if (stepTime !== undefined) {
      // Seek mode
      const elapsed = stepTime - delay;
      paths.forEach((p, i) => {
        const len = lengths[i];
        const progress = elapsed <= 0 ? 0 : elapsed >= duration ? 1 : elapsed / duration;
        const eased = 1 - Math.pow(1 - progress, 3);
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len * (1 - eased));
        if (fillReveal) {
          const fillProgress = Math.max(0, (elapsed - duration) / fillDuration);
          p.style.opacity = String(Math.min(1, fillProgress + (progress < 1 ? 0 : 0)));
          // Keep stroke visible at full opacity, only animate fill via opacity
          const originalFill = (p as SVGElement).getAttribute("data-orig-fill") ?? (p as SVGElement).getAttribute("fill") ?? "none";
          if (originalFill && originalFill !== "none") {
            (p as SVGElement).style.fill = originalFill;
            (p as SVGElement).style.fillOpacity = String(Math.min(1, Math.max(0, fillProgress)));
          }
        }
      });
      return;
    }

    // Interactive mode
    paths.forEach((p, i) => {
      const len = lengths[i];
      const origFill = (p as SVGElement).getAttribute("fill") ?? "none";
      if (origFill !== "none") {
        (p as SVGElement).setAttribute("data-orig-fill", origFill);
        (p as SVGElement).style.fill = "none";
      }
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
    });

    const tl = gsap.timeline({ delay });
    tl.to(paths, {
      strokeDashoffset: 0,
      duration,
      ease: "power2.inOut",
      stagger: duration * 0.05,
    });

    if (fillReveal) {
      paths.forEach((p) => {
        const origFill = (p as SVGElement).getAttribute("data-orig-fill");
        if (origFill && origFill !== "none") {
          tl.to(p, { fill: origFill, duration: fillDuration, ease: "power2.out" }, `>-${fillDuration * 0.5}`);
        }
      });
    }

    return () => { tl.kill(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepTime]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
