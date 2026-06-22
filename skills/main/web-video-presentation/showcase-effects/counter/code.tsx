"use client";
// showcase-effects/counter/code.tsx
// Copy this component into your chapter file (alongside the shared helpers below).
// Usage: import and render <CounterDemo /> in your chapter step.
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


export function CounterDemo() {
  const ref1 = useRef<HTMLSpanElement>(null);
  const ref2 = useRef<HTMLSpanElement>(null);
  const ref3 = useRef<HTMLSpanElement>(null);
  useRaf((t) => {
    const e = 1 - Math.pow(1 - Math.min(1, t / 1.5), 2);
    if (ref1.current) ref1.current.textContent = String(Math.round(600 * e));
    if (ref2.current) ref2.current.textContent = (99.9 * e).toFixed(1);
    if (ref3.current) ref3.current.textContent = Math.round(1200000 * e).toLocaleString("zh-CN");
  });
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
      <div style={{ fontSize: 52, fontWeight: 900, color: "#f59e0b", fontFamily: "monospace" }}><span ref={ref1}>0</span><span style={{ fontSize: 24 }}>ms</span></div>
      <div style={{ fontSize: 32, color: "#3b82f6", fontFamily: "monospace" }}><span ref={ref2}>0</span><span style={{ fontSize: 18 }}>%</span></div>
      <div style={{ fontSize: 22, color: "#10b981", fontFamily: "monospace" }}>¥<span ref={ref3}>0</span></div>
    </div>
  );
}

export default CounterDemo;
