"use client";
// showcase-effects/gauge/code.tsx
// Copy this component into your chapter file (alongside the shared helpers below).
// Usage: import and render <GaugeDemo /> in your chapter step.
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


export function GaugeDemo() {
  const ref = useRef<SVGSVGElement>(null);
  const arcRef = useRef<SVGPathElement>(null);
  const needleRef = useRef<SVGLineElement>(null);
  const valRef = useRef<SVGTextElement>(null);
  useRaf((t) => {
    const arc = arcRef.current; const needle = needleRef.current; const val = valRef.current;
    if (!arc || !needle || !val) return;
    const progress = Math.min(1, t / 1.5);
    const eased = 1 - Math.pow(1 - progress, 2);
    const fraction = eased * 0.72;
    const cx = 110, cy = 110, r = 80;
    const start = 135, sweep = 270;
    const endAngle = (start + sweep * fraction) * Math.PI / 180;
    const startRad = start * Math.PI / 180;
    const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
    const large = sweep * fraction > 180 ? 1 : 0;
    arc.setAttribute("d", `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`);
    needle.setAttribute("transform", `rotate(${start + sweep * fraction}, ${cx}, ${cy})`);
    val.textContent = String(Math.round(72 * eased));
  });
  const startRad = 135 * Math.PI / 180;
  const r = 80, cx = 110, cy = 110;
  const trackEnd = (135 + 270) * Math.PI / 180;
  const tx2 = cx + r * Math.cos(trackEnd), ty2 = cy + r * Math.sin(trackEnd);
  return (
    <svg ref={ref} viewBox="0 0 220 220" className="absolute inset-0 w-full h-full" style={{ color: "#fff" }}>
      <path d={`M ${cx + r * Math.cos(startRad)} ${cy + r * Math.sin(startRad)} A ${r} ${r} 0 1 1 ${tx2} ${ty2}`} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="14" strokeLinecap="round" />
      <path ref={arcRef} d="" fill="none" stroke="#f59e0b" strokeWidth="14" strokeLinecap="round" />
      <line ref={needleRef} x1={cx} y1={cy} x2={cx + r * 0.82 * Math.cos(startRad)} y2={cy + r * 0.82 * Math.sin(startRad)} stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" transform={`rotate(135, ${cx}, ${cy})`} />
      <circle cx={cx} cy={cy} r="7" fill="#f59e0b" />
      <text ref={valRef} x={cx} y={cy + 15} textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="monospace">0</text>
      <text x={cx} y={cy + 32} textAnchor="middle" fill="#f59e0b" fontSize="12" fontFamily="monospace">rpm × 100</text>
      <text x={cx} y={cy + 58} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11">引擎转速</text>
    </svg>
  );
}

export default GaugeDemo;
