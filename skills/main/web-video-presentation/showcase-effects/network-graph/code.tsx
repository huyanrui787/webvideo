"use client";
// showcase-effects/network-graph/code.tsx
// Copy this component into your chapter file (alongside the shared helpers below).
// Usage: import and render <NetworkDemo /> in your chapter step.
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


export function NetworkDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  const nodes = [
    { x: 0.5, y: 0.5, label: "Core", highlight: true },
    { x: 0.2, y: 0.25 }, { x: 0.8, y: 0.25 },
    { x: 0.15, y: 0.7 }, { x: 0.85, y: 0.7 },
    { x: 0.5, y: 0.15 }, { x: 0.5, y: 0.85 },
  ];
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const visible = Math.min(nodes.length, Math.floor(t * 1.5) + 1);
    for (let i = 1; i < visible; i++) {
      const from = nodes[0], to = nodes[i];
      ctx.strokeStyle = "rgba(100,200,255,0.3)"; ctx.lineWidth = 1.5 * devicePixelRatio;
      ctx.beginPath(); ctx.moveTo(from.x * w, from.y * h); ctx.lineTo(to.x * w, to.y * h); ctx.stroke();
    }
    nodes.slice(0, visible).forEach((n, i) => {
      const r = (i === 0 ? 14 : 8) * devicePixelRatio;
      ctx.beginPath(); ctx.arc(n.x * w, n.y * h, r, 0, Math.PI * 2);
      ctx.fillStyle = n.highlight ? "#f59e0b" : "#3b82f6"; ctx.fill();
      if (n.label) {
        ctx.fillStyle = "#fff"; ctx.font = `bold ${11 * devicePixelRatio}px sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(n.label, n.x * w, n.y * h);
      }
    });
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

export default NetworkDemo;
