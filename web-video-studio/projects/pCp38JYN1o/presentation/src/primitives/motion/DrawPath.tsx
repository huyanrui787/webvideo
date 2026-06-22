import { useEffect, useRef, type SVGAttributes } from "react";
import { gsap } from "gsap";

interface DrawPathProps extends SVGAttributes<SVGPathElement> {
  d: string;
  /** Stroke color. Default: "var(--accent)" */
  color?: string;
  strokeWidth?: number;
  /** Total animation duration in seconds. Default: 1.2 */
  duration?: number;
  /** Delay before drawing starts. Default: 0 */
  delay?: number;
  ease?: string;
  stepTime?: number;
  /** viewBox of the wrapping SVG. Default: "0 0 1920 1080" */
  viewBox?: string;
  /** Fill for the SVG container. Default: "none" */
  fill?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Draws an SVG path stroke-by-stroke, like a pen tracing the line.
 * Wraps the path in a full-stage SVG by default.
 *
 * Usage:
 *   <DrawPath
 *     d="M 200 540 L 960 540 L 1720 540"
 *     color="var(--accent)"
 *     duration={1.4}
 *     stepTime={stepTime}
 *   />
 *
 * For complex diagrams, use multiple <DrawPath> inside your own <svg>.
 */
export function DrawPath({
  d,
  color = "var(--accent)",
  strokeWidth = 3,
  duration = 1.2,
  delay = 0,
  ease = "power2.inOut",
  stepTime,
  viewBox = "0 0 1920 1080",
  fill = "none",
  className,
  style,
  ...svgPathProps
}: DrawPathProps) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);

    if (stepTime !== undefined) {
      // Seek mode: compute offset instantly
      const elapsed = stepTime - delay;
      const progress = elapsed <= 0 ? 0 : elapsed >= duration ? 1 : elapsed / duration;
      const eased = 1 - Math.pow(1 - progress, 3); // power3.out approx
      path.style.strokeDashoffset = String(length * (1 - eased));
      return;
    }

    // Interactive mode
    path.style.strokeDashoffset = String(length);
    const tween = gsap.to(path, {
      strokeDashoffset: 0,
      duration,
      delay,
      ease,
      clearProps: "strokeDashoffset,strokeDasharray",
    });
    return () => { tween.kill(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepTime]);

  return (
    <svg
      viewBox={viewBox}
      fill={fill}
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", ...style }}
    >
      <path
        ref={pathRef}
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        {...svgPathProps}
      />
    </svg>
  );
}
