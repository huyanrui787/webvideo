import type { CSSProperties } from "react";
import { useSeekableCanvas } from "../canvas/useSeekableCanvas";

export interface LinePoint {
  x: number;   // arbitrary domain value (will be normalized)
  y: number;
  label?: string;
}

export interface LineSeries {
  points: LinePoint[];
  label?: string;
  color?: string;
  /** Fill area under line. Default: true */
  fill?: boolean;
}

interface ChartLineProps {
  series: LineSeries[];
  duration?: number;
  delay?: number;
  showDots?: boolean;
  showLabels?: boolean;
  showAxis?: boolean;
  stepTime?: number;
  style?: CSSProperties;
  className?: string;
}

const DEFAULT_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

/**
 * Animated line chart. Supports multiple series, fill areas, dots.
 *
 * Usage:
 *   <ChartLine
 *     series={[{
 *       label: "收入",
 *       color: "#3b82f6",
 *       points: [
 *         { x: 0, y: 12 }, { x: 1, y: 28 }, { x: 2, y: 45 },
 *         { x: 3, y: 38 }, { x: 4, y: 67 }, { x: 5, y: 89 },
 *       ],
 *     }]}
 *     stepTime={stepTime}
 *   />
 */
export function ChartLine({
  series,
  duration = 1.4,
  delay = 0,
  showDots = true,
  showLabels = true,
  showAxis = true,
  stepTime,
  style,
  className,
}: ChartLineProps) {
  // Compute global extents
  const allX = series.flatMap((s) => s.points.map((p) => p.x));
  const allY = series.flatMap((s) => s.points.map((p) => p.y));
  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = Math.min(0, Math.min(...allY));
  const maxY = Math.max(...allY) * 1.1;

  const ref = useSeekableCanvas(
    (ctx, t, w, h) => {
      const progress = t <= 0 ? 0 : t >= duration ? 1 : t / duration;
      const eased = 1 - Math.pow(1 - progress, 2);

      const pad = { t: h * 0.1, r: w * 0.06, b: h * 0.15, l: w * 0.09 };
      const cw = w - pad.l - pad.r;
      const ch = h - pad.t - pad.b;

      const toPixel = (px: number, py: number) => ({
        x: pad.l + ((px - minX) / (maxX - minX || 1)) * cw,
        y: pad.t + (1 - (py - minY) / (maxY - minY || 1)) * ch,
      });

      if (showAxis) {
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.l, pad.t);
        ctx.lineTo(pad.l, pad.t + ch);
        ctx.lineTo(pad.l + cw, pad.t + ch);
        ctx.stroke();

        // X-axis labels from first series
        if (series[0]?.points && showLabels) {
          ctx.fillStyle = "rgba(255,255,255,0.45)";
          ctx.font = `${w * 0.022}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          series[0].points.forEach((p) => {
            if (p.label) {
              const { x } = toPixel(p.x, 0);
              ctx.fillText(p.label, x, pad.t + ch + 8);
            }
          });
        }
      }

      series.forEach((ser, si) => {
        const color = ser.color ?? DEFAULT_COLORS[si % DEFAULT_COLORS.length];
        const pts = ser.points;
        if (!pts.length) return;

        // Draw up to progress fraction of points
        const visibleLen = Math.max(1, Math.floor(pts.length * eased));
        const partial = (pts.length * eased) - Math.floor(pts.length * eased);

        ctx.strokeStyle = color;
        ctx.lineWidth = w * 0.003;
        ctx.lineJoin = "round";
        ctx.globalAlpha = 0.95;

        // Build path
        ctx.beginPath();
        pts.slice(0, visibleLen + 1).forEach((p, i) => {
          let { x, y } = toPixel(p.x, p.y);
          // Interpolate last visible segment
          if (i === visibleLen && i < pts.length - 1 && partial > 0) {
            const prev = toPixel(pts[i - 1]?.x ?? p.x, pts[i - 1]?.y ?? p.y);
            x = prev.x + (x - prev.x) * partial;
            y = prev.y + (y - prev.y) * partial;
          }
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Fill under line
        if (ser.fill !== false) {
          const baseLine = pad.t + ch;
          const firstPt = toPixel(pts[0].x, pts[0].y);
          const lastPt = toPixel(pts[Math.min(visibleLen, pts.length - 1)].x, pts[Math.min(visibleLen, pts.length - 1)].y);

          const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
          grad.addColorStop(0, color + "40");
          grad.addColorStop(1, color + "05");

          ctx.globalAlpha = 0.4;
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(firstPt.x, baseLine);
          pts.slice(0, visibleLen + 1).forEach((p, i) => {
            let { x, y } = toPixel(p.x, p.y);
            if (i === visibleLen && i < pts.length - 1 && partial > 0) {
              const prev = toPixel(pts[i - 1]?.x ?? p.x, pts[i - 1]?.y ?? p.y);
              x = prev.x + (x - prev.x) * partial;
              y = prev.y + (y - prev.y) * partial;
            }
            ctx.lineTo(x, y);
          });
          ctx.lineTo(lastPt.x, baseLine);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 0.95;
        }

        // Dots
        if (showDots) {
          pts.slice(0, visibleLen).forEach((p) => {
            const { x, y } = toPixel(p.x, p.y);
            ctx.beginPath();
            ctx.arc(x, y, w * 0.006, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
          });
        }
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
