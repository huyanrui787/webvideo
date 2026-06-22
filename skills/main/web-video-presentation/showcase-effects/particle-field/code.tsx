"use client";
// showcase-effects/particle-field/code.tsx
// Copy this component into your chapter file (alongside the shared helpers below).
// Usage: import and render <ParticleDemo /> in your chapter step.
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


export function ParticleDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 200; i++) {
      const seed = i * 7919;
      const angle = (hash(seed + Math.floor(t * 0.5) * 0.01) * 2 - 1) * Math.PI * 2;
      let x = ((hash(seed) * w + Math.cos(angle) * 0.8 * t * 60)) % w;
      let y = ((hash(seed + 1) * h + Math.sin(angle) * 0.8 * t * 60)) % h;
      if (x < 0) x += w; if (y < 0) y += h;
      ctx.globalAlpha = 0.4 + hash(seed + 2) * 0.4;
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath(); ctx.arc(x, y, (1 + hash(seed + 9)) * devicePixelRatio, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

export default ParticleDemo;
