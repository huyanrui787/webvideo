import type { CSSProperties } from "react";
import { useSeekableCanvas } from "../canvas/useSeekableCanvas";

export interface BarItem {
  label: string;
  value: number;
  color?: string;
}

interface ChartBarProps {
  bars: BarItem[];
  palette?: string[];
  duration?: number;
  delay?: number;
  /** Orientation. Default: "vertical" */
  orientation?: "vertical" | "horizontal";
  /** Show value labels. Default: true */
  showValues?: boolean;
  /** Show axis. Default: true */
  showAxis?: boolean;
  stepTime?: number;
  style?: CSSProperties;
  className?: string;
}

const DEFAULT_PALETTE = [
  "#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#84cc16",
];

/**
 * Animated bar chart (vertical or horizontal).
 *
 * Usage:
 *   <ChartBar
 *     bars={[
 *       { label: "2020", value: 42 },
 *       { label: "2021", value: 68 },
 *       { label: "2022", value: 91 },
 *     ]}
 *     stepTime={stepTime}
 *   />
 */
export function ChartBar({
  bars,
  palette = DEFAULT_PALETTE,
  duration = 1.2,
  delay = 0,
  orientation = "vertical",
  showValues = true,
  showAxis = true,
  stepTime,
  style,
  className,
}: ChartBarProps) {
  const maxVal = Math.max(...bars.map((b) => b.value)) || 1;

  const ref = useSeekableCanvas(
    (ctx, t, w, h) => {
      const progress = t <= 0 ? 0 : t >= duration ? 1 : t / duration;
      const eased = 1 - Math.pow(1 - progress, 3);

      const pad = { t: h * 0.1, r: w * 0.05, b: h * 0.18, l: w * 0.08 };
      const chartW = w - pad.l - pad.r;
      const chartH = h - pad.t - pad.b;
      const n = bars.length;
      const barGap = 0.2;
      const slotW = chartW / n;
      const barW = slotW * (1 - barGap);

      ctx.font = `${w * 0.025}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      if (showAxis) {
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.l, pad.t);
        ctx.lineTo(pad.l, pad.t + chartH);
        ctx.lineTo(pad.l + chartW, pad.t + chartH);
        ctx.stroke();
      }

      bars.forEach((bar, i) => {
        const color = bar.color ?? palette[i % palette.length];
        const frac = (bar.value / maxVal) * eased;

        if (orientation === "vertical") {
          const x = pad.l + i * slotW + slotW * barGap * 0.5;
          const barH = chartH * frac;
          const y = pad.t + chartH - barH;

          const grad = ctx.createLinearGradient(x, y, x, y + barH);
          grad.addColorStop(0, color);
          grad.addColorStop(1, color + "88");
          ctx.fillStyle = grad;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          const rx = barW * 0.08;
          ctx.roundRect(x, y, barW, barH, [rx, rx, 0, 0]);
          ctx.fill();
          ctx.globalAlpha = 1;

          // Label
          ctx.fillStyle = "rgba(255,255,255,0.6)";
          ctx.textBaseline = "top";
          ctx.fillText(bar.label, x + barW / 2, pad.t + chartH + 8);

          // Value
          if (showValues && progress > 0.5) {
            ctx.fillStyle = "#fff";
            ctx.textBaseline = "bottom";
            ctx.fillText(String(Math.round(bar.value * eased)), x + barW / 2, y - 4);
          }
        } else {
          // Horizontal
          const y = pad.t + i * (chartH / n) + (chartH / n) * barGap * 0.5;
          const bH = (chartH / n) * (1 - barGap);
          const barLen = chartW * frac;

          const grad = ctx.createLinearGradient(pad.l, y, pad.l + barLen, y);
          grad.addColorStop(0, color + "88");
          grad.addColorStop(1, color);
          ctx.fillStyle = grad;
          ctx.globalAlpha = 0.9;
          const rx = bH * 0.15;
          ctx.beginPath();
          ctx.roundRect(pad.l, y, barLen, bH, [0, rx, rx, 0]);
          ctx.fill();
          ctx.globalAlpha = 1;

          ctx.fillStyle = "rgba(255,255,255,0.6)";
          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
          ctx.fillText(bar.label, pad.l - 8, y + bH / 2);

          if (showValues && progress > 0.5) {
            ctx.fillStyle = "#fff";
            ctx.textAlign = "left";
            ctx.fillText(String(Math.round(bar.value * eased)), pad.l + barLen + 8, y + bH / 2);
          }
        }
      });
    },
    { stepTime, delay },
  );

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", ...style }}
    />
  );
}
