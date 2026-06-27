import type { CSSProperties } from "react";
import { useSeekableCanvas } from "../canvas/useSeekableCanvas";
function hash(n:number){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}

interface GameSceneProps { mazeSize?: number; color?: string; size?: number; stepTime?: number; className?: string; style?: CSSProperties; }

export function GameScene({ mazeSize = 12, color = "#0f0", size = 240, stepTime, className, style }: GameSceneProps) {
  const ref = useSeekableCanvas((ctx, t, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cellW = w / mazeSize, cellH = h / mazeSize;
    // Draw maze
    for (let r = 0; r < mazeSize; r++) {
      for (let c = 0; c < mazeSize; c++) {
        const x = c * cellW, y = r * cellH;
        // Walls (simple pseudo-random)
        if (hash(r * mazeSize + c) > 0.6) {
          ctx.fillStyle = `${color}15`; ctx.fillRect(x, y, cellW, cellH);
          if (hash(r * mazeSize + c + 100) > 0.5) {
            ctx.fillStyle = `${color}08`; ctx.fillRect(x, y, cellW, cellH);
          }
        }
        ctx.strokeStyle = `${color}22`; ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cellW, cellH);
      }
    }
    // Player dot walking a path
    const pathLen = mazeSize * 3;
    const pos = ((t * 1.5) % pathLen) / pathLen;
    const pathIdx = Math.floor(pos * mazeSize * 2);
    const px = (pathIdx % mazeSize) * cellW + cellW / 2;
    const py = (Math.floor(pathIdx / mazeSize) % mazeSize) * cellH + cellH / 2;
    // Glow
    ctx.beginPath(); ctx.arc(px, py, cellW * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = `${color}33`; ctx.fill();
    ctx.beginPath(); ctx.arc(px, py, cellW * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    // Trail
    for (let i = 1; i <= 5; i++) {
      const tp = ((t * 1.5 - i * 0.3) % pathLen) / pathLen;
      if (tp < 0) continue;
      const ti = Math.floor(tp * mazeSize * 2);
      const tx = (ti % mazeSize) * cellW + cellW / 2;
      const ty = (Math.floor(ti / mazeSize) % mazeSize) * cellH + cellH / 2;
      ctx.beginPath(); ctx.arc(tx, ty, cellW * 0.06, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.globalAlpha = 1 - i * 0.18; ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} width={size} height={size} className={className} style={{ background: "#020205", width: size, height: size, ...style }} />;
}
