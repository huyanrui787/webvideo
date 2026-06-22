"use client";
// showcase-effects/svg-reveal/code.tsx
// Copy this component into your chapter file (alongside the shared helpers below).
// Usage: import and render <SvgRevealDemo /> in your chapter step.
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


export function SvgRevealDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const [key, setKey] = useState(0);
  useEffect(() => { const t = setInterval(() => setKey((k) => k + 1), 4000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const container = ref.current; if (!container) return;
    const paths = Array.from(container.querySelectorAll("path")) as SVGPathElement[];
    paths.forEach((p) => {
      const len = p.getTotalLength?.() ?? 200;
      const origFill = p.getAttribute("fill") ?? "none";
      if (origFill !== "none") { p.setAttribute("data-fill", origFill); p.style.fill = "none"; }
      p.style.strokeDasharray = String(len); p.style.strokeDashoffset = String(len); p.style.transition = "none";
    });
    requestAnimationFrame(() => {
      paths.forEach((p, i) => {
        p.style.transition = `stroke-dashoffset 1.4s ${i * 0.1}s cubic-bezier(0.4,0,0.2,1)`;
        p.style.strokeDashoffset = "0";
        const f = p.getAttribute("data-fill");
        if (f) setTimeout(() => { p.style.transition += `, fill 0.5s ${1.2 + i * 0.1}s`; p.style.fill = f; }, 100);
      });
    });
  }, [key]);
  return (
    <div ref={ref} key={key} className="absolute inset-0 w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 200 160" style={{ width: "80%", height: "80%" }}>
        <path d="M 110 10 L 70 85 L 100 85 L 90 150 L 140 70 L 108 70 Z" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="100" cy="80" r="70" fill="none" stroke="rgba(245,158,11,0.3)" strokeWidth="1.5" strokeDasharray="6 4" />
      </svg>
    </div>
  );
}

export default SvgRevealDemo;
