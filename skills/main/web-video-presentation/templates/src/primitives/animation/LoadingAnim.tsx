import type { CSSProperties } from "react";
import { useSeekableCanvas } from "../canvas/useSeekableCanvas";

interface LoadingAnimProps { value?: number; label?: string; color?: string; size?: number; stepTime?: number; className?: string; style?: CSSProperties; }

export function LoadingAnim({ value = 67, label = "Loading", color = "#00ff88", size = 160, stepTime, className, style }: LoadingAnimProps) {
  const ref = useSeekableCanvas((ctx, t, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.55, r = Math.min(w, h) * 0.35;
    // Track
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `${color}22`; ctx.lineWidth = r * 0.18; ctx.stroke();
    // Fill arc
    const pct = Math.min(value / 100, 1);
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + pct * Math.PI * 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = color; ctx.lineWidth = r * 0.18; ctx.lineCap = "round"; ctx.stroke();
    // Glow dot at leading edge
    const dotX = cx + Math.cos(endAngle) * r, dotY = cy + Math.sin(endAngle) * r;
    ctx.beginPath(); ctx.arc(dotX, dotY, r * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.beginPath(); ctx.arc(dotX, dotY, r * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = `${color}44`; ctx.fill();
    // Center text
    ctx.fillStyle = "#fff"; ctx.font = `bold ${w*0.14}px monospace`; ctx.textAlign = "center";
    ctx.fillText(`${value}%`, cx, cy + w * 0.02);
    // Label
    ctx.fillStyle = `${color}aa`; ctx.font = `${w*0.06}px monospace`;
    ctx.fillText(label, cx, cy + r + w * 0.1);
    // Simulated log lines
    ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = `${w*0.035}px monospace`; ctx.textAlign = "left";
    const logs = ["[OK] Initializing...", "[OK] Loading modules...", "[..] Compiling assets..."];
    logs.forEach((log, i) => {
      ctx.fillText(log, w * 0.08, h * 0.85 + i * w * 0.045);
    });
  });
  return <canvas ref={ref} width={size} height={size * 0.8} className={className} style={{ background: "#0a0a14", width: size, height: size*0.8, ...style }} />;
}
