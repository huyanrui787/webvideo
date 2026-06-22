"use client";
// showcase-effects/chart-bar/code.tsx
// Copy this component into your chapter file (alongside the shared helpers below).
// Usage: import and render <ChartBarDemo /> in your chapter step.
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


export function ChartBarDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  const bars = [
    { l: "2020", v: 42, c: "#3b82f6" }, { l: "2021", v: 68, c: "#6366f1" },
    { l: "2022", v: 55, c: "#8b5cf6" }, { l: "2023", v: 91, c: "#a855f7" },
    { l: "2024", v: 78, c: "#d946ef" },
  ];
  const max = 100;
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const progress = Math.min(1, t / 1.2);
    const eased = 1 - Math.pow(1 - progress, 3);
    const pad = { t: h * 0.12, r: w * 0.05, b: h * 0.2, l: w * 0.08 };
    const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
    const slotW = cw / bars.length, barW = slotW * 0.65;
    ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ch); ctx.lineTo(pad.l + cw, pad.t + ch); ctx.stroke();
    bars.forEach((b, i) => {
      const frac = (b.v / max) * eased;
      const x = pad.l + i * slotW + slotW * 0.175;
      const bh = ch * frac; const y = pad.t + ch - bh;
      const grad = ctx.createLinearGradient(x, y, x, y + bh);
      grad.addColorStop(0, b.c); grad.addColorStop(1, b.c + "66");
      ctx.fillStyle = grad; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.roundRect(x, y, barW, bh, [3, 3, 0, 0]); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.font = `${w * 0.038}px sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(b.l, x + barW / 2, pad.t + ch + 6);
      if (progress > 0.5) { ctx.fillStyle = "#fff"; ctx.textBaseline = "bottom"; ctx.fillText(String(Math.round(b.v * eased)), x + barW / 2, y - 3); }
    });
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

export default ChartBarDemo;
