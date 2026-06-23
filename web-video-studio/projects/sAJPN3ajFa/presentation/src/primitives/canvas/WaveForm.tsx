import type { CSSProperties } from "react";
import { useSeekableCanvas } from "./useSeekableCanvas";

interface WaveFormProps {
  /**
   * "sine"    — smooth sine wave, good for audio/signal demos
   * "pulse"   — heartbeat / network pulse
   * "noise"   — organic noise wave, good for atmospheric backgrounds
   * "bars"    — frequency spectrum bars (equalizer style)
   */
  variant?: "sine" | "pulse" | "noise" | "bars";
  /** Number of wave cycles visible. Default: 2 */
  cycles?: number;
  /** Wave amplitude as fraction of canvas height. Default: 0.15 */
  amplitude?: number;
  /** Wave frequency in Hz (cycles per second). Default: 1 */
  frequency?: number;
  color?: string;
  strokeWidth?: number;
  /** Number of bars (for "bars" variant). Default: 64 */
  barCount?: number;
  stepTime?: number;
  style?: CSSProperties;
  className?: string;
}

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function resolveVar(color: string): string {
  if (!color.startsWith("var(") || typeof document === "undefined") return color;
  const prop = color.match(/var\(([^)]+)\)/)?.[1] ?? "";
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim() || "#888";
}

/**
 * Animated waveform on Canvas.
 *
 * Usage:
 *   // Audio signal demo
 *   <WaveForm variant="sine" color="var(--accent)" stepTime={stepTime} />
 *
 *   // Server heartbeat
 *   <WaveForm variant="pulse" amplitude={0.25} stepTime={stepTime} />
 *
 *   // Equalizer
 *   <WaveForm variant="bars" barCount={48} stepTime={stepTime} />
 */
export function WaveForm({
  variant = "sine",
  cycles = 2,
  amplitude = 0.15,
  frequency = 1,
  color = "var(--accent)",
  strokeWidth = 3,
  barCount = 64,
  stepTime,
  style,
  className,
}: WaveFormProps) {
  const ref = useSeekableCanvas(
    (ctx, t, w, h) => {
      const c = resolveVar(color);
      const cy = h / 2;
      const amp = h * amplitude;
      const phase = t * frequency * Math.PI * 2;

      ctx.strokeStyle = c;
      ctx.fillStyle = c;
      ctx.lineWidth = strokeWidth;

      if (variant === "sine") {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const px = x / w;
          const y = cy + Math.sin(px * cycles * Math.PI * 2 + phase) * amp;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Faded fill below
        const grad = ctx.createLinearGradient(0, cy - amp, 0, cy + amp);
        grad.addColorStop(0, c.replace(")", ", 0.15)").replace("rgb(", "rgba(").replace("#", "rgba(").padEnd(20));
        grad.addColorStop(1, "transparent");
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.moveTo(0, cy);
        for (let x = 0; x <= w; x += 2) {
          const y = cy + Math.sin((x / w) * cycles * Math.PI * 2 + phase) * amp;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, cy);
        ctx.closePath();
        ctx.fillStyle = c;
        ctx.fill();
        ctx.globalAlpha = 1;

      } else if (variant === "pulse") {
        // Sharp heartbeat pulse
        ctx.beginPath();
        const pulsePeriod = w / cycles;
        for (let x = 0; x <= w; x += 1) {
          const localX = ((x / pulsePeriod + t * frequency) % 1 + 1) % 1;
          let y = cy;
          if (localX < 0.08) y = cy - amp * Math.sin(localX / 0.08 * Math.PI) * 0.3;
          else if (localX < 0.14) y = cy - amp * (1 - (localX - 0.08) / 0.06);
          else if (localX < 0.18) y = cy + amp * 0.6 * ((localX - 0.14) / 0.04);
          else if (localX < 0.22) y = cy + amp * 0.6 * (1 - (localX - 0.18) / 0.04);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();

      } else if (variant === "noise") {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const seed = Math.floor(x / 8) + Math.floor(t * 8);
          const n = (hash(seed) * 2 - 1) * amp;
          const y = cy + n;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();

      } else if (variant === "bars") {
        const barW = (w / barCount) * 0.7;
        const gap = (w / barCount) * 0.3;
        for (let i = 0; i < barCount; i++) {
          const barAmp = (hash(i * 17 + Math.floor(t * 12)) * 0.7 + 0.3) * amp * 2;
          const x = i * (barW + gap) + gap / 2;
          ctx.globalAlpha = 0.8;
          ctx.fillRect(x, cy - barAmp, barW, barAmp * 2);
        }
        ctx.globalAlpha = 1;
      }
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
