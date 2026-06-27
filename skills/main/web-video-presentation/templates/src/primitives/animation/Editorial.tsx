import type { CSSProperties } from "react";
import { useSeekableCanvas } from "../canvas/useSeekableCanvas";

interface EditorialProps { title?: string; subtitle?: string; color?: string; size?: number; stepTime?: number; className?: string; style?: CSSProperties; }

export function Editorial({ title = "BEYOND THE HORIZON", subtitle = "Chapter IV — The Last Transmission", color = "#ff6b35", size = 280, stepTime, className, style }: EditorialProps) {
  const ref = useSeekableCanvas((ctx, t, w, h) => {
    ctx.clearRect(0, 0, w, h);
    // Gradient background bars
    for (let i = 0; i < 5; i++) {
      const bh = h * 0.04, by = h * 0.15 + i * h * 0.08;
      const bw = (0.3 + i * 0.15 + Math.sin(t * 0.3 + i) * 0.05) * w;
      ctx.fillStyle = `${color}${Math.floor(8 + i * 4).toString(16)}`;
      ctx.fillRect(0, by, bw, bh);
    }
    // Title
    ctx.fillStyle = "#fff"; ctx.font = `bold ${w*0.06}px sans-serif`; ctx.textAlign = "left";
    ctx.fillText(title, w * 0.08, h * 0.48);
    // Underline
    ctx.fillStyle = color; ctx.fillRect(w * 0.08, h * 0.5, w * 0.35, 3);
    // Subtitle
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = `${w*0.028}px monospace`;
    ctx.fillText(subtitle, w * 0.08, h * 0.58);
    // Decorative bracket
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.05, h * 0.35); ctx.lineTo(w * 0.03, h * 0.35);
    ctx.lineTo(w * 0.03, h * 0.55); ctx.lineTo(w * 0.05, h * 0.55);
    ctx.stroke();
    // Bottom line
    ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.font = `${w*0.022}px monospace`; ctx.textAlign = "right";
    ctx.fillText("SCI-FI ARCHIVE // 2087", w * 0.95, h * 0.9);
    // Scanning line
    const scanY = ((t * 0.4) % 1) * h;
    ctx.fillStyle = `${color}15`; ctx.fillRect(0, scanY, w, 3);
  });
  const canvasH = size * 0.65;
  return <canvas ref={ref} width={size} height={canvasH} className={className} style={{ background: "#0a0a12", width: size, height: canvasH, ...style }} />;
}
