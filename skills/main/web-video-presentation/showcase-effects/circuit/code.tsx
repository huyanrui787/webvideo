"use client";
// showcase-effects/circuit/code.tsx
// Copy this component into your chapter file (alongside the shared helpers below).
// Usage: import and render <CircuitDemo /> in your chapter step.
// All animation runs automatically — no props needed.

import { useEffect, useRef } from "react";

"use client";

import { useEffect, useRef, useState } from "react";

// ─── Shared helpers ───────────────────────────────────────────────────────────

export function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function useRaf(cb: (t: number) => void, active = true) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    if (!active) return;
    let startTs: number | null = null;
    let raf: number;
    const loop = (ts: number) => {
      if (!startTs) startTs = ts;
      cbRef.current((ts - startTs) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

// ─── Demo components ──────────────────────────────────────────────────────────


export function CircuitDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const nodes = [
      { x: 0.5, y: 0.5, label: "CPU" }, { x: 0.2, y: 0.3, label: "RAM" },
      { x: 0.8, y: 0.3, label: "GPU" }, { x: 0.2, y: 0.7, label: "SSD" }, { x: 0.8, y: 0.7, label: "NET" },
    ];
    const wires = [[0,1],[0,2],[0,3],[0,4]];
    const progress = Math.min(1, t / 2);
    const accentColor = "#10b981";
    wires.forEach(([fi, ti]) => {
      const from = nodes[fi], to = nodes[ti];
      const pts = [{x:from.x*w,y:from.y*h},{x:to.x*w,y:to.y*h}];
      const len = Math.sqrt((pts[1].x-pts[0].x)**2+(pts[1].y-pts[0].y)**2);
      const dl = len * progress;
      ctx.strokeStyle = "rgba(100,220,180,0.7)"; ctx.lineWidth = 2;
      ctx.shadowColor = accentColor; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      const dx = pts[1].x-pts[0].x, dy = pts[1].y-pts[0].y;
      if (dl >= len) ctx.lineTo(pts[1].x, pts[1].y);
      else ctx.lineTo(pts[0].x + dx * (dl/len), pts[0].y + dy * (dl/len));
      ctx.stroke(); ctx.shadowBlur = 0;
      if (progress > 0.3) {
        for (let p = 0; p < 3; p++) {
          const phase = (hash(fi*13+p*7) + t * 0.5) % 1;
          if (phase * len > dl) return;
          const px = pts[0].x + dx * phase, py = pts[0].y + dy * phase;
          ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI*2);
          ctx.fillStyle = accentColor; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
        }
      }
    });
    nodes.forEach((n) => {
      const x = n.x*w, y = n.y*h; const hw = 35, hh = 18;
      ctx.strokeStyle = accentColor; ctx.lineWidth = 1.5; ctx.fillStyle = "#0d1f1a";
      ctx.shadowColor = accentColor; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.roundRect(x-hw, y-hh, hw*2, hh*2, [3]); ctx.stroke(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = accentColor; ctx.font = `bold ${10}px monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(n.label, x, y);
    });
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

export default CircuitDemo;
