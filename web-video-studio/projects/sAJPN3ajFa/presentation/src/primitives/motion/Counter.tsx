import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";

interface CounterProps {
  /** Start value. Default: 0 */
  from?: number;
  /** End value (required) */
  to: number;
  /** Unit appended after the number, e.g. "ms", "%", "x" */
  unit?: string;
  /** Prefix before the number, e.g. "$", "¥" */
  prefix?: string;
  /** Animation duration in seconds. Default: 1.2 */
  duration?: number;
  /** Delay before starting, in seconds. Default: 0 */
  delay?: number;
  /** Decimal places to show. Default: 0 */
  decimals?: number;
  /** GSAP ease. Default: "power2.out" */
  ease?: string;
  stepTime?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Animated number counter. Rolls from `from` to `to`.
 * In seek mode, instantly shows the value at the given time.
 *
 * Usage:
 *   <Counter to={600} unit="ms" delay={0.4} stepTime={stepTime} />
 *   <Counter from={0} to={99.9} unit="%" decimals={1} stepTime={stepTime} />
 */
export function Counter({
  from = 0,
  to,
  unit = "",
  prefix = "",
  duration = 1.2,
  delay = 0,
  decimals = 0,
  ease = "power2.out",
  stepTime,
  className,
  style,
}: CounterProps) {
  const [display, setDisplay] = useState(from);
  const proxyRef = useRef({ value: from });

  const fmt = (v: number) => v.toFixed(decimals);

  useEffect(() => {
    if (stepTime !== undefined) return; // handled in render path
    const proxy = proxyRef.current;
    proxy.value = from;
    const tween = gsap.to(proxy, {
      value: to,
      duration,
      delay,
      ease,
      onUpdate: () => setDisplay(proxy.value),
      onComplete: () => setDisplay(to),
    });
    return () => { tween.kill(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seek mode: calculate instantaneous value
  if (stepTime !== undefined) {
    const elapsed = stepTime - delay;
    const progress = elapsed <= 0 ? 0 : elapsed >= duration ? 1 : elapsed / duration;
    // Approximate power2.out: 1 - (1-t)^2
    const easedProgress = 1 - Math.pow(1 - progress, 2);
    const val = from + (to - from) * easedProgress;
    return (
      <span className={className} style={style}>
        {prefix}{fmt(val)}{unit}
      </span>
    );
  }

  return (
    <span className={className} style={style}>
      {prefix}{fmt(display)}{unit}
    </span>
  );
}
