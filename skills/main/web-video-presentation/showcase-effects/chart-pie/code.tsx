"use client";
// showcase-effects/chart-pie/code.tsx
// Copy this component into your chapter file (alongside the shared helpers below).
// Usage: import and render <ChartPieDemo /> in your chapter step.
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


export function ChartPieDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  const slices = [
    { v: 42, label: "USA", color: "#3b82f6" }, { v: 18, label: "CHN", color: "#ef4444" },
    { v: 12, label: "EU", color: "#10b981" }, { v: 8, label: "JPN", color: "#f59e0b" },
    { v: 20, label: "Others", color: "#8b5cf6" },
  ];
  const total = slices.reduce((s, d) => s + d.v, 0);
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const progress = Math.min(1, t / 1.4);
    const eased = 1 - Math.pow(1 - progress, 3);
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.38, ir = r * 0.55;
    let angle = -Math.PI / 2;
    slices.forEach((s) => {
      const frac = s.v / total;
      const end = angle + frac * eased * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + ir * Math.cos(angle), cy + ir * Math.sin(angle));
      ctx.arc(cx, cy, r, angle, end); ctx.arc(cx, cy, ir, end, angle, true);
      ctx.closePath(); ctx.fillStyle = s.color; ctx.globalAlpha = 0.9; ctx.fill();
      if (progress > 0.9 && s.label) {
        const mid = angle + (end - angle) / 2;
        const lr = r * 0.77;
        ctx.globalAlpha = (progress - 0.9) / 0.1;
        ctx.fillStyle = "#fff"; ctx.font = `bold ${w * 0.045}px sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(s.label, cx + lr * Math.cos(mid), cy + lr * Math.sin(mid));
      }
      angle = end;
    });
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

export default ChartPieDemo;
