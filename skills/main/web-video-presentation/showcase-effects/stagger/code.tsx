"use client";
// showcase-effects/stagger/code.tsx
// Copy this component into your chapter file (alongside the shared helpers below).
// Usage: import and render <StaggerDemo /> in your chapter step.
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


export function StaggerDemo() {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    const items = ["并行构建", "多章节", "零冲突", "自动汇编", "tsc 验证"];
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % (items.length + 1); setVisible(i === 0 ? 0 : i); }, i === 0 ? 300 : 400);
    return () => clearInterval(t);
  }, []);
  const items = ["🚀 并行构建", "📦 多章节", "🔒 零冲突", "⚙️ 自动汇编", "✅ tsc 验证"];
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4">
      {items.map((item, i) => (
        <div key={item} style={{ opacity: visible > i ? 1 : 0, transform: `translateY(${visible > i ? 0 : 16}px)`, transition: `opacity 0.4s ${i * 0.08}s, transform 0.4s ${i * 0.08}s`, fontSize: 14, color: "#fff", background: "rgba(255,255,255,0.08)", padding: "6px 16px", borderRadius: 20, width: "100%", textAlign: "center" }}>{item}</div>
      ))}
    </div>
  );
}

export default StaggerDemo;
