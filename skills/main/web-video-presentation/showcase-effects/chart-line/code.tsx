"use client";
// showcase-effects/chart-line/code.tsx
// Copy this component into your chapter file (alongside the shared helpers below).
// Usage: import and render <ChartLineDemo /> in your chapter step.
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


export function ChartLineDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  const pts = [12, 28, 22, 45, 38, 67, 55, 89, 76, 95];
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const progress = Math.min(1, t / 1.4);
    const pad = { t: h * 0.12, r: w * 0.06, b: h * 0.15, l: w * 0.08 };
    const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
    const maxY = 100;
    const toX = (i: number) => pad.l + (i / (pts.length - 1)) * cw;
    const toY = (v: number) => pad.t + (1 - v / maxY) * ch;
    ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ch); ctx.lineTo(pad.l + cw, pad.t + ch); ctx.stroke();
    [25, 50, 75].forEach((v) => { ctx.beginPath(); ctx.moveTo(pad.l, toY(v)); ctx.lineTo(pad.l + cw, toY(v)); ctx.stroke(); });
    const visLen = Math.max(1, Math.floor(pts.length * progress));
    const partial = (pts.length * progress) - visLen;
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
    grad.addColorStop(0, "#3b82f640"); grad.addColorStop(1, "#3b82f605");
    ctx.fillStyle = grad; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(toX(0), pad.t + ch);
    for (let i = 0; i <= visLen; i++) {
      let x = toX(i), y = toY(pts[i] ?? pts[pts.length - 1]);
      if (i === visLen && i < pts.length - 1 && partial > 0) { x = toX(i - 1) + (toX(i) - toX(i - 1)) * partial; y = toY(pts[i - 1]) + (toY(pts[i]) - toY(pts[i - 1])) * partial; }
      ctx.lineTo(x, y);
    }
    ctx.lineTo(toX(Math.min(visLen, pts.length - 1)), pad.t + ch); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 2.5 * devicePixelRatio; ctx.globalAlpha = 1;
    ctx.beginPath();
    for (let i = 0; i <= visLen; i++) {
      let x = toX(i), y = toY(pts[i] ?? pts[pts.length - 1]);
      if (i === visLen && i < pts.length - 1 && partial > 0) { x = toX(i - 1) + (toX(i) - toX(i - 1)) * partial; y = toY(pts[i - 1]) + (toY(pts[i]) - toY(pts[i - 1])) * partial; }
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (let i = 0; i < visLen; i++) { ctx.beginPath(); ctx.arc(toX(i), toY(pts[i]), 4 * devicePixelRatio, 0, Math.PI * 2); ctx.fillStyle = "#3b82f6"; ctx.fill(); }
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

export default ChartLineDemo;
