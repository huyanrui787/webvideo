import type { CSSProperties } from "react";
import { useSeekableCanvas } from "./useSeekableCanvas";

interface ParticleFieldProps {
  /** Number of particles. Default: 300 */
  count?: number;
  /**
   * "flow"    — particles drift with Perlin-like noise field
   * "converge"— particles fly in from edges and converge to center
   * "scatter" — particles explode outward from center
   * "orbit"   — particles orbit a central attractor
   */
  behavior?: "flow" | "converge" | "scatter" | "orbit";
  /** Particle color. Default: "var(--accent)" resolved at runtime */
  color?: string;
  /** Particle radius. Default: 2 */
  radius?: number;
  /** Animation speed multiplier. Default: 1 */
  speed?: number;
  stepTime?: number;
  style?: CSSProperties;
  className?: string;
}

// Deterministic pseudo-random: same seed → same sequence every render
function hash(n: number): number {
  let x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

function resolveColor(color: string): string {
  if (!color.startsWith("var(")) return color;
  if (typeof document === "undefined") return "#888";
  const prop = color.match(/var\(([^)]+)\)/)?.[1] ?? "";
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim() || "#888";
}

/**
 * Full-stage Canvas particle system. Fully deterministic — same stepTime
 * always renders the same frame, compatible with seek-based rendering.
 *
 * Usage:
 *   <ParticleField behavior="flow" count={400} stepTime={stepTime} />
 *   <ParticleField behavior="converge" color="var(--accent)" stepTime={stepTime} />
 */
export function ParticleField({
  count = 300,
  behavior = "flow",
  color = "var(--accent)",
  radius = 2,
  speed = 1,
  stepTime,
  style,
  className,
}: ParticleFieldProps) {
  const ref = useSeekableCanvas(
    (ctx, t, w, h) => {
      const resolvedColor = resolveColor(color);
      const s = t * speed;

      for (let i = 0; i < count; i++) {
        const seed = i * 7919;
        const baseX = hash(seed) * w;
        const baseY = hash(seed + 1) * h;

        let x: number, y: number, alpha: number;

        if (behavior === "flow") {
          // Noise-driven flow field (deterministic, no Perlin needed)
          const angle = (hash(seed + Math.floor(s * 0.5) * 0.01) * 2 - 1) * Math.PI * 2;
          const vx = Math.cos(angle) * 0.8 * speed;
          const vy = Math.sin(angle) * 0.8 * speed;
          x = (baseX + vx * s * 60) % w;
          y = (baseY + vy * s * 60) % h;
          if (x < 0) x += w;
          if (y < 0) y += h;
          alpha = 0.4 + hash(seed + 2) * 0.4;

        } else if (behavior === "converge") {
          const progress = Math.min(1, s * 0.5);
          const eased = 1 - Math.pow(1 - progress, 3);
          x = baseX + (w / 2 - baseX) * eased;
          y = baseY + (h / 2 - baseY) * eased;
          alpha = 0.2 + eased * 0.7;

        } else if (behavior === "scatter") {
          const progress = Math.min(1, s * 0.4);
          const angle2 = hash(seed + 3) * Math.PI * 2;
          const dist = hash(seed + 4) * Math.max(w, h) * progress;
          x = w / 2 + Math.cos(angle2) * dist;
          y = h / 2 + Math.sin(angle2) * dist;
          alpha = Math.max(0, 1 - progress * 0.8);

        } else { // orbit
          const orbitRadius = (hash(seed + 5) * 0.35 + 0.1) * Math.min(w, h);
          const phase = hash(seed + 6) * Math.PI * 2;
          const angSpeed = (hash(seed + 7) * 0.5 + 0.3) * speed;
          x = w / 2 + Math.cos(phase + s * angSpeed) * orbitRadius;
          y = h / 2 + Math.sin(phase + s * angSpeed) * orbitRadius * 0.6;
          alpha = 0.3 + hash(seed + 8) * 0.5;
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = resolvedColor;
        ctx.beginPath();
        ctx.arc(x, y, radius * (0.5 + hash(seed + 9) * 0.8), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    { stepTime },
  );

  return (
    <canvas
      ref={ref}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}
