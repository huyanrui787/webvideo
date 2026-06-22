import type { CSSProperties } from "react";
import { useSeekableCanvas } from "../canvas/useSeekableCanvas";

export interface CircuitNode {
  id: string;
  x: number;  // 0–1920
  y: number;  // 0–1080
  type?: "ic" | "resistor" | "capacitor" | "dot";
  label?: string;
}

export interface CircuitWire {
  from: string;
  to: string;
  /** Path points (intermediate corners). Default: straight line */
  via?: { x: number; y: number }[];
}

interface CircuitFlowProps {
  nodes: CircuitNode[];
  wires: CircuitWire[];
  /** Animation duration for wires to draw. Default: 2 */
  duration?: number;
  delay?: number;
  /** Show animated current particles on wires. Default: true */
  showCurrent?: boolean;
  color?: string;
  accentColor?: string;
  stepTime?: number;
  style?: CSSProperties;
  className?: string;
}

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Animated circuit diagram with flowing current particles.
 *
 * Usage:
 *   <CircuitFlow
 *     nodes={[
 *       { id: "cpu", x: 960, y: 540, type: "ic", label: "CPU" },
 *       { id: "mem", x: 600, y: 300, type: "ic", label: "RAM" },
 *       { id: "gpu", x: 1320, y: 300, type: "ic", label: "GPU" },
 *     ]}
 *     wires={[
 *       { from: "cpu", to: "mem" },
 *       { from: "cpu", to: "gpu" },
 *     ]}
 *     stepTime={stepTime}
 *   />
 */
export function CircuitFlow({
  nodes,
  wires,
  duration = 2,
  delay = 0,
  showCurrent = true,
  color = "rgba(100,220,180,0.7)",
  accentColor = "#10b981",
  stepTime,
  style,
  className,
}: CircuitFlowProps) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const ref = useSeekableCanvas(
    (ctx, t, w, h) => {
      const scaleX = w / 1920, scaleY = h / 1080;
      const progress = Math.min(1, t / duration);

      function sx(x: number) { return x * scaleX; }
      function sy(y: number) { return y * scaleY; }

      // Draw wires
      wires.forEach((wire, wi) => {
        const from = nodeMap.get(wire.from);
        const to = nodeMap.get(wire.to);
        if (!from || !to) return;

        const pts = [
          { x: from.x, y: from.y },
          ...(wire.via ?? []),
          { x: to.x, y: to.y },
        ];

        // Calculate total wire length for progress
        let totalLen = 0;
        for (let i = 1; i < pts.length; i++) {
          const dx = pts[i].x - pts[i-1].x, dy = pts[i].y - pts[i-1].y;
          totalLen += Math.sqrt(dx*dx + dy*dy);
        }

        const drawLen = totalLen * progress;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 * scaleX;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // PCB-style: prefer orthogonal paths
        ctx.beginPath();
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 8;
        let drawn = 0;
        let started = false;
        for (let i = 1; i < pts.length; i++) {
          const dx = pts[i].x - pts[i-1].x, dy = pts[i].y - pts[i-1].y;
          const segLen = Math.sqrt(dx*dx + dy*dy);
          if (drawn + segLen <= drawLen) {
            if (!started) { ctx.moveTo(sx(pts[i-1].x), sy(pts[i-1].y)); started = true; }
            ctx.lineTo(sx(pts[i].x), sy(pts[i].y));
            drawn += segLen;
          } else {
            const frac = (drawLen - drawn) / segLen;
            if (!started) { ctx.moveTo(sx(pts[i-1].x), sy(pts[i-1].y)); started = true; }
            ctx.lineTo(sx(pts[i-1].x + dx * frac), sy(pts[i-1].y + dy * frac));
            break;
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Current particles
        if (showCurrent && progress > 0.3) {
          const pCount = 4;
          for (let p = 0; p < pCount; p++) {
            const phase = (hash(wi * 13 + p * 7) + t * 0.4) % 1;
            const targetLen = phase * totalLen;
            let traveled = 0;
            let px = pts[0].x, py = pts[0].y;
            for (let i = 1; i < pts.length; i++) {
              const dx = pts[i].x - pts[i-1].x, dy = pts[i].y - pts[i-1].y;
              const segLen = Math.sqrt(dx*dx + dy*dy);
              if (traveled + segLen >= targetLen) {
                const f = (targetLen - traveled) / segLen;
                px = pts[i-1].x + dx * f;
                py = pts[i-1].y + dy * f;
                break;
              }
              traveled += segLen;
            }
            if (targetLen <= drawLen) {
              ctx.beginPath();
              ctx.arc(sx(px), sy(py), 3 * scaleX, 0, Math.PI * 2);
              ctx.fillStyle = accentColor;
              ctx.globalAlpha = 0.9;
              ctx.fill();
              ctx.globalAlpha = 1;
            }
          }
        }
      });

      // Draw nodes
      nodes.forEach((node) => {
        const x = sx(node.x), y = sy(node.y);
        const type = node.type ?? "dot";

        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.5 * scaleX;
        ctx.fillStyle = "#0d1f1a";

        if (type === "ic") {
          const hw = 50 * scaleX, hh = 30 * scaleY;
          ctx.shadowColor = accentColor;
          ctx.shadowBlur = 12;
          ctx.strokeRect(x - hw, y - hh, hw * 2, hh * 2);
          ctx.fillRect(x - hw, y - hh, hw * 2, hh * 2);
          ctx.shadowBlur = 0;
          if (node.label) {
            ctx.fillStyle = accentColor;
            ctx.font = `bold ${14 * scaleX}px monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(node.label, x, y);
          }
        } else if (type === "resistor") {
          const hw = 30 * scaleX, hh = 10 * scaleY;
          ctx.beginPath();
          ctx.rect(x - hw, y - hh, hw * 2, hh * 2);
          ctx.stroke();
          ctx.fill();
        } else if (type === "capacitor") {
          ctx.beginPath();
          ctx.moveTo(x - 8 * scaleX, y - 15 * scaleY);
          ctx.lineTo(x - 8 * scaleX, y + 15 * scaleY);
          ctx.moveTo(x + 8 * scaleX, y - 15 * scaleY);
          ctx.lineTo(x + 8 * scaleX, y + 15 * scaleY);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, 5 * scaleX, 0, Math.PI * 2);
          ctx.fillStyle = accentColor;
          ctx.fill();
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
