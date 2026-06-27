import type { CSSProperties } from "react";
import { useSeekableCanvas } from "../canvas/useSeekableCanvas";

interface FlowChartProps { nodes?: { id:number; label:string; sub?:string; error?:boolean }[]; duration?: number; color?: string; size?: number; stepTime?: number; className?: string; style?: CSSProperties; }

export function FlowChart({ nodes: inputNodes, duration = 2.5, color = "#00ffb4", size = 260, stepTime, className, style }: FlowChartProps) {
  const nodes = inputNodes ?? [
    { id:0, label:"源节点", sub:"10.0.0.1" },
    { id:1, label:"路由A", sub:"20.0.0.3" },
    { id:2, label:"路由B", sub:"30.0.0.8" },
    { id:3, label:"超时", sub:"TTL耗尽", error:true },
  ];
  const ref = useSeekableCanvas((ctx, t, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const progress = Math.min(1, t / duration);
    const visEdges = Math.floor(progress * (nodes.length - 1) + 1);
    ctx.fillStyle = `${color}26`; ctx.fillRect(0, 0, w, h * 0.18);
    ctx.fillStyle = color; ctx.font = `bold ${w*0.028}px monospace`; ctx.textAlign = "left";
    ctx.fillText("$ traceroute", w*0.04, h*0.1);
    nodes.forEach((n, i) => {
      const x = (0.15 + i * 0.25) * w, y = 0.5 * h;
      if (i < visEdges + (i === 0 ? 1 : 0)) {
        ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = n.error ? "#ef4444" : color; ctx.globalAlpha = 0.2; ctx.fill();
        ctx.globalAlpha = 1; ctx.strokeStyle = n.error ? "#ef4444" : color; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = n.error ? "#ef4444" : color; ctx.font = `${w*0.022}px monospace`; ctx.textAlign = "center";
        ctx.fillText(n.label, x, y - 18);
        if (n.sub) { ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = `${w*0.018}px monospace`; ctx.fillText(n.sub, x, y + 28); }
      }
      if (i < nodes.length - 1 && i < visEdges - 1) {
        const nx = (0.15 + (i + 1) * 0.25) * w;
        ctx.strokeStyle = nodes[i + 1].error ? "#ef4444" : color;
        ctx.lineWidth = 2; ctx.setLineDash([6, 3]);
        ctx.beginPath(); ctx.moveTo(x + 14, y); ctx.lineTo(nx - 14, y); ctx.stroke();
        ctx.setLineDash([]);
        const pp = ((t * 1.2) % 1);
        if (pp < 1) {
          ctx.beginPath(); ctx.arc(x + 14 + (nx - x - 28) * pp, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#f59e0b"; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
        }
      }
    });
  });
  const canvasH = size * 0.55;
  return <canvas ref={ref} width={size} height={canvasH} className={className} style={{ background: "#0a0a14", width: size, height: canvasH, ...style }} />;
}
