import type { CSSProperties } from "react";
import { useSeekableCanvas } from "../canvas/useSeekableCanvas";

interface LineDrawProps { title?: string; color?: string; size?: number; duration?: number; stepTime?: number; className?: string; style?: CSSProperties; }
function hash(n:number){const x=Math.sin(n*127.1)*43758.5453;return x-Math.floor(x);}

export function LineDraw({ title = "ARCHITECTURE", color = "#00c8ff", size = 260, duration = 3.5, stepTime, className, style }: LineDrawProps) {
  const ref = useSeekableCanvas((ctx, t, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const progress = Math.min(1, t / duration);
    // Title
    ctx.fillStyle = color; ctx.font = `bold ${w*0.042}px monospace`; ctx.textAlign = "left";
    ctx.fillText(title, w*0.04, h*0.12);
    // Draw boxes + connecting lines progressively
    const boxes = [
      { x: 0.08, y: 0.35, w: 0.18, h: 0.15, label: "入口" },
      { x: 0.35, y: 0.25, w: 0.22, h: 0.15, label: "处理层" },
      { x: 0.35, y: 0.55, w: 0.22, h: 0.15, label: "缓存层" },
      { x: 0.68, y: 0.35, w: 0.24, h: 0.15, label: "输出" },
    ];
    const totalSteps = boxes.length + 3; // boxes + 3 connecting lines
    const boxStart = 0.15; const boxStep = (1 - boxStart) / boxes.length;
    const lineStart = boxStart + boxes.length * boxStep * 0.5;

    // Lines first (behind boxes)
    const lines = [
      [0, 1], [0, 2], [1, 3], [2, 3],
    ];
    lines.forEach(([a, b], li) => {
      const lp = Math.max(0, Math.min(1, (progress - boxStart - li * 0.05) / 0.4));
      if (lp <= 0) return;
      const ba = boxes[a], bb = boxes[b];
      const x1 = (ba.x + ba.w) * w, y1 = (ba.y + ba.h / 2) * h;
      const x2 = bb.x * w, y2 = (bb.y + bb.h / 2) * h;
      const ex = x1 + (x2 - x1) * lp, ey = y1 + (y2 - y1) * lp;
      ctx.strokeStyle = `${color}66`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex, ey); ctx.stroke();
    });

    // Boxes
    boxes.forEach((box, bi) => {
      const bp = Math.max(0, Math.min(1, (progress - bi * 0.1) / 0.3));
      if (bp <= 0) return;
      const bx = box.x * w, by = box.y * h, bw = box.w * w, bh = box.h * h;
      ctx.globalAlpha = bp;
      ctx.fillStyle = `${color}15`; ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, [6]); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = `${w*0.024}px monospace`; ctx.textAlign = "center";
      ctx.fillText(box.label, bx + bw / 2, by + bh / 2 + w * 0.008);
      ctx.globalAlpha = 1;
    });
  });
  const canvasH = size * 0.65;
  return <canvas ref={ref} width={size} height={canvasH} className={className} style={{ background: "#0a0a14", width: size, height: canvasH, ...style }} />;
}
