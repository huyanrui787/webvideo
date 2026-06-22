"use client";
// showcase-effects/magnetic-field/code.tsx
// Copy this component into your chapter file (alongside the shared helpers below).
// Usage: import and render <MagneticDemo /> in your chapter step.
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


export function MagneticDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height, cx = w / 2, cy = h / 2;
    const pg = w * 0.2; const posX = cx + pg, negX = cx - pg; const poleR = h * 0.05;
    const progress = Math.min(1, t * 0.8);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(100,200,255,0.5)";
    const lineCount = 10;
    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2;
      ctx.beginPath();
      let x = posX + Math.cos(angle) * poleR * 1.5, y = cy + Math.sin(angle) * poleR * 1.5;
      ctx.moveTo(x, y);
      const steps = Math.floor(80 * progress);
      for (let s = 0; s < steps; s++) {
        const dxP = x - posX, dyP = y - cy, dxN = x - negX, dyN = y - cy;
        const rP = Math.sqrt(dxP*dxP + dyP*dyP) + 1, rN = Math.sqrt(dxN*dxN + dyN*dyN) + 1;
        const bx = dxP/(rP**3) - dxN/(rN**3), by = dyP/(rP**3) - dyN/(rN**3);
        const bl = Math.sqrt(bx*bx + by*by) + 1e-10;
        const step = Math.min(w * 0.012, 800 / rP);
        x += (bx/bl) * step; y += (by/bl) * step;
        ctx.globalAlpha = 0.6 - s / 80 * 0.4; ctx.lineTo(x, y);
        if (Math.sqrt((x-negX)**2 + (y-cy)**2) < poleR*2 || x<0||x>w||y<0||y>h) break;
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 30; i++) {
      const phase = hash(i * 17) + t * 0.4; const li = Math.floor(hash(i * 7) * lineCount);
      const ang = (li / lineCount) * Math.PI * 2;
      let px = posX + Math.cos(ang) * poleR * 1.5, py = cy + Math.sin(ang) * poleR * 1.5;
      const tr = Math.floor((phase % 1) * 50);
      for (let s = 0; s < tr; s++) {
        const dxP = px-posX, dyP = py-cy, dxN = px-negX, dyN = py-cy;
        const rP = Math.sqrt(dxP*dxP+dyP*dyP)+1, rN = Math.sqrt(dxN*dxN+dyN*dyN)+1;
        const bx = dxP/(rP**3)-dxN/(rN**3), by = dyP/(rP**3)-dyN/(rN**3);
        const bl = Math.sqrt(bx*bx+by*by)+1e-10;
        px += (bx/bl)*Math.min(w*0.012,800/rP); py += (by/bl)*Math.min(w*0.012,800/rP);
        if (px<0||px>w||py<0||py>h||Math.sqrt((px-negX)**2+(py-cy)**2)<poleR*2) break;
      }
      ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b"; ctx.globalAlpha = 0.8; ctx.fill();
    }
    ctx.globalAlpha = 1;
    [[posX,"N","#ef4444"],[negX,"S","#3b82f6"]].forEach(([px, label, col]) => {
      const g = ctx.createRadialGradient(px as number, cy, 0, px as number, cy, poleR*2);
      g.addColorStop(0, col as string); g.addColorStop(1, (col as string)+"44");
      ctx.beginPath(); ctx.arc(px as number, cy, poleR, 0, Math.PI*2); ctx.fillStyle = g; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff"; ctx.font = `bold ${h*0.05}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(label as string, px as number, cy);
    });
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

export default MagneticDemo;
