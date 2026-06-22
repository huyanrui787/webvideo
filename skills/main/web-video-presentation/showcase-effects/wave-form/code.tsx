"use client";
// showcase-effects/wave-form/code.tsx
// Copy this component into your chapter file (alongside the shared helpers below).
// Usage: import and render <WaveDemo /> in your chapter step.
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


export function WaveDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const cy = h / 2, amp = h * 0.2;
    const phase = t * Math.PI * 2;
    ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 2 * devicePixelRatio;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) { const y = cy + Math.sin(x / w * 4 * Math.PI + phase) * amp; x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    const n = 32;
    for (let i = 0; i < n; i++) {
      const bAmp = (hash(i * 17 + Math.floor(t * 12)) * 0.6 + 0.2) * amp * 1.5;
      const x = (i / n) * w; const bw = w / n * 0.7;
      ctx.fillStyle = `hsl(${200 + i * 3}, 80%, 60%)`; ctx.globalAlpha = 0.7;
      ctx.fillRect(x, cy - bAmp, bw, bAmp * 2);
    }
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

export default WaveDemo;
