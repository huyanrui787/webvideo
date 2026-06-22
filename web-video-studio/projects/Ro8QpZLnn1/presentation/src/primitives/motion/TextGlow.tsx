import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap } from "gsap";

interface TextGlowProps {
  children: ReactNode;
  /** Glow color. Default: "var(--accent)" */
  color?: string;
  /** Glow intensity 0–1. Default: 0.8 */
  intensity?: number;
  /** Whether glow pulses continuously. Default: true */
  pulse?: boolean;
  /** Entry animation type. Default: "fade" */
  enter?: "fade" | "scale" | "none";
  duration?: number;
  delay?: number;
  stepTime?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Text with animated neon/glow effect. Wraps any text or heading.
 *
 * Usage:
 *   <TextGlow color="var(--accent)" pulse stepTime={stepTime}>
 *     <h1 style={{ fontSize: 120 }}>600ms</h1>
 *   </TextGlow>
 *
 *   <TextGlow color="#fff" intensity={0.5} enter="scale" stepTime={stepTime}>
 *     <span>LOADING</span>
 *   </TextGlow>
 */
export function TextGlow({
  children,
  color = "var(--accent)",
  intensity = 0.8,
  pulse = true,
  enter = "fade",
  duration = 0.7,
  delay = 0,
  stepTime,
  className,
  style,
}: TextGlowProps) {
  const ref = useRef<HTMLDivElement>(null);

  function resolveColor(c: string) {
    if (!c.startsWith("var(") || typeof document === "undefined") return c;
    const prop = c.match(/var\(([^)]+)\)/)?.[1] ?? "";
    return getComputedStyle(document.documentElement).getPropertyValue(prop).trim() || "#fff";
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const c = resolveColor(color);
    const spread = 20 * intensity;
    const glow = `0 0 ${spread}px ${c}, 0 0 ${spread * 2}px ${c}60, 0 0 ${spread * 4}px ${c}30`;

    if (stepTime !== undefined) {
      const elapsed = Math.max(0, stepTime - delay);
      const p = elapsed >= duration ? 1 : elapsed / duration;
      if (enter === "fade") {
        el.style.opacity = String(p);
        el.style.textShadow = p >= 1 ? glow : "none";
      } else if (enter === "scale") {
        el.style.opacity = String(p);
        el.style.transform = `scale(${0.7 + 0.3 * p})`;
        el.style.textShadow = p >= 1 ? glow : "none";
      } else {
        el.style.textShadow = glow;
      }
      return;
    }

    // Initial state
    if (enter === "fade") { el.style.opacity = "0"; el.style.textShadow = "none"; }
    else if (enter === "scale") { el.style.opacity = "0"; el.style.transform = "scale(0.7)"; }

    const tl = gsap.timeline({ delay });

    if (enter === "fade") {
      tl.to(el, { opacity: 1, duration, ease: "power2.out" });
    } else if (enter === "scale") {
      tl.to(el, { opacity: 1, scale: 1, duration, ease: "back.out(1.7)" });
    }

    // Apply glow after entry
    tl.call(() => { el.style.textShadow = glow; });

    // Pulse loop
    if (pulse) {
      tl.to(el, {
        filter: `brightness(1.3)`,
        duration: 1.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }

    return () => { tl.kill(); el.style.textShadow = ""; el.style.filter = ""; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepTime]);

  return (
    <div ref={ref} className={className} style={{ display: "inline-block", ...style }}>
      {children}
    </div>
  );
}
