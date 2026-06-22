"use client";
// showcase-effects/text-glow/code.tsx
// Copy this component into your chapter file (alongside the shared helpers below).
// Usage: import and render <TextGlowDemo /> in your chapter step.
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


export function TextGlowDemo() {
  const ref = useRef<HTMLDivElement>(null);
  useRaf((t) => {
    const el = ref.current; if (!el) return;
    const pulse = Math.sin(t * 1.5) * 0.5 + 0.5;
    const spread = 15 + pulse * 25;
    el.style.textShadow = `0 0 ${spread}px #f59e0b, 0 0 ${spread * 2}px #f59e0b60, 0 0 ${spread * 3}px #f59e0b20`;
    el.style.filter = `brightness(${1 + pulse * 0.4})`; el.style.opacity = String(Math.min(1, t * 2));
  });
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <div ref={ref} style={{ fontSize: 56, fontWeight: 900, color: "#f59e0b", fontFamily: "monospace", opacity: 0 }}>SvgAnimate</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em" }}>极致创意 · 矢量交互</div>
    </div>
  );
}

export default TextGlowDemo;
