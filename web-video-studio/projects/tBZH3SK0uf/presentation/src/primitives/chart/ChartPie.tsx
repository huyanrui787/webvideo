import type { CSSProperties } from "react";
import { useSeekableCanvas } from "../canvas/useSeekableCanvas";

export interface PieSlice {
  value: number;
  label?: string;
  color?: string;
}

interface ChartPieProps {
  slices: PieSlice[];
  /** Default colors cycle through this palette */
  palette?: string[];
  /** Animation duration. Default: 1.4 */
  duration?: number;
  delay?: number;
  /** Show labels. Default: true */
  showLabels?: boolean;
  /** Inner radius ratio for donut style (0 = full pie). Default: 0 */
  innerRadius?: number;
  stepTime?: number;
  style?: CSSProperties;
  className?: string;
}

const DEFAULT_PALETTE = [
  "#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#6366f1",
];

/**
 * Animated pie / donut chart.
 *
 * Usage:
 *   <ChartPie
 *     slices={[
 *       { value: 42, label: "美国", color: "#3b82f6" },
 *       { value: 18, label: "中国", color: "#ef4444" },
 *       { value: 12, label: "欧盟", color: "#10b981" },
 *     ]}
 *     innerRadius={0.55}
 *     stepTime={stepTime}
 *   />
 */
export function ChartPie({
  slices,
  palette = DEFAULT_PALETTE,
  duration = 1.4,
  delay = 0,
  showLabels = true,
  innerRadius = 0,
  stepTime,
  style,
  className,
}: ChartPieProps) {
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;

  const ref = useSeekableCanvas(
    (ctx, t, w, h) => {
      const progress = t <= 0 ? 0 : t >= duration ? 1 : t / duration;
      const eased = 1 - Math.pow(1 - progress, 3);
      const sweep = eased * Math.PI * 2;

      const cx = w / 2, cy = h / 2;
      const r = Math.min(w, h) * 0.38;
      const ir = r * innerRadius;

      let angle = -Math.PI / 2;
      slices.forEach((slice, i) => {
        const frac = slice.value / total;
        const endAngle = angle + frac * sweep;
        const color = slice.color ?? palette[i % palette.length];

        ctx.beginPath();
        ctx.moveTo(innerRadius > 0 ? cx + ir * Math.cos(angle) : cx,
                   innerRadius > 0 ? cy + ir * Math.sin(angle) : cy);
        ctx.arc(cx, cy, r, angle, endAngle);
        if (innerRadius > 0) {
          ctx.arc(cx, cy, ir, endAngle, angle, true);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.fill();

        // Label
        if (showLabels && slice.label && progress > 0.9) {
          const midAngle = angle + (endAngle - angle) / 2;
          const labelR = r * (innerRadius > 0 ? 0.7 + innerRadius * 0.15 : 0.65);
          const lx = cx + labelR * Math.cos(midAngle);
          const ly = cy + labelR * Math.sin(midAngle);
          ctx.globalAlpha = (progress - 0.9) / 0.1;
          ctx.fillStyle = "#fff";
          ctx.font = `bold ${w * 0.025}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(slice.label, lx, ly);
        }

        angle = endAngle;
      });
      ctx.globalAlpha = 1;
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
