"use client";
// showcase-effects/draw-path/code.tsx
// Copy this component into your chapter file (alongside the shared helpers below).
// Usage: import and render <DrawPathDemo /> in your chapter step.
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


export function DrawPathDemo() {
  const pathRef = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  useRaf((t) => {
    [pathRef, path2Ref].forEach((r, ri) => {
      const p = r.current; if (!p) return;
      const len = p.getTotalLength?.() ?? 400;
      const delay = ri * 0.5; const dur = 1.8;
      const elapsed = Math.max(0, t - delay); const progress = elapsed >= dur ? 1 : elapsed / dur;
      const eased = 1 - Math.pow(1 - progress, 3);
      p.style.strokeDasharray = String(len); p.style.strokeDashoffset = String(len * (1 - eased));
    });
  });
  return (
    <svg viewBox="0 0 400 250" className="absolute inset-0 w-full h-full" fill="none">
      <path ref={pathRef} d="M 20 180 Q 100 40 200 125 Q 300 210 380 70" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
      <path ref={path2Ref} d="M 20 200 L 100 200 L 100 80 L 200 80 L 200 160 L 300 160 L 300 50 L 380 50" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default DrawPathDemo;
