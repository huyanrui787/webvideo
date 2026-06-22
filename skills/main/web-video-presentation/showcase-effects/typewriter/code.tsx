"use client";
// showcase-effects/typewriter/code.tsx
// Copy this component into your chapter file (alongside the shared helpers below).
// Usage: import and render <TypeWriterDemo /> in your chapter step.
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


export function TypeWriterDemo() {
  const [text, setText] = useState("");
  const lines = ["$ npm install gsap lottie-web", "> building animations...", "> chunks: 12 / 12", "✓ done in 0.6s ⚡"];
  const fullText = lines.join("\n");
  useRaf((t) => { const chars = Math.min(fullText.length, Math.floor(t * 28)); setText(fullText.slice(0, chars)); });
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <pre style={{ fontSize: 13, color: "#4ade80", fontFamily: "monospace", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
        {text}<span style={{ animation: "blink 1s step-end infinite" }}>█</span>
      </pre>
    </div>
  );
}

export default TypeWriterDemo;
