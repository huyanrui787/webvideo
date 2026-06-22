"use client";
// showcase-effects/geo-globe/code.tsx
// Copy this component into your chapter file (alongside the shared helpers below).
// Usage: import and render <GeoGlobeDemo /> in your chapter step.
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


export function GeoGlobeDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  const LANDS: number[][] = [
    [-140,60],[-125,50],[-80,45],[-75,45],[-70,25],[-90,15],[-85,10],[-77,8],[-80,25],[-104,19],[-117,32],[-124,45],[-140,60],[999,999],
    [-10,36],[5,36],[15,38],[28,40],[36,36],[28,46],[14,48],[6,47],[-2,47],[-5,44],[-10,44],[-10,36],[999,999],
    [-18,15],[-15,12],[-14,9],[-8,5],[2,5],[9,4],[15,0],[22,-6],[30,-10],[35,-18],[35,-25],[30,-32],[18,-30],[12,-18],[8,4],[0,6],[-3,5],[-18,15],[999,999],
    [28,40],[36,36],[42,37],[50,26],[60,22],[68,24],[72,22],[80,20],[100,5],[104,10],[110,18],[120,22],[130,32],[136,35],[140,38],[136,55],[115,53],[100,50],[80,50],[60,44],[44,36],[36,36],[999,999],
    [114,-22],[120,-20],[130,-12],[140,-18],[150,-22],[152,-30],[146,-40],[132,-35],[118,-26],[114,-22],[999,999],
  ];
  function project(lon: number, lat: number, rot: number, cx: number, cy: number, r: number) {
    const lr = ((lon + rot) * Math.PI) / 180, latr = (lat * Math.PI) / 180;
    const cl = Math.cos(latr);
    return { x: cx + r * cl * Math.sin(lr), y: cy - r * Math.sin(latr), v: cl * Math.cos(lr) > 0 };
  }
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height, cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) * 0.42; const rot = t * 6;
    ctx.clearRect(0, 0, w, h);
    const grd = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    grd.addColorStop(0, "#1a3050"); grd.addColorStop(1, "#050d18");
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
    const atm = ctx.createRadialGradient(cx, cy, r * 0.95, cx, cy, r * 1.08);
    atm.addColorStop(0, "rgba(80,140,255,0.3)"); atm.addColorStop(1, "transparent");
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.08, 0, Math.PI * 2); ctx.fillStyle = atm; ctx.fill();
    ctx.strokeStyle = "rgba(100,180,255,0.07)"; ctx.lineWidth = 0.8;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath(); let f = true;
      for (let lon = -180; lon <= 180; lon += 4) { const p = project(lon, lat, rot, cx, cy, r); if (!p.v) { f = true; continue; } f ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); f = false; }
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(100,200,255,0.6)"; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.7;
    ctx.beginPath(); let seg = true;
    for (const [lon, lat] of LANDS) {
      if (lon === 999) { seg = true; continue; }
      const p = project(lon, lat, rot, cx, cy, r);
      if (!p.v) { seg = true; continue; }
      seg ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); seg = false;
    }
    ctx.stroke(); ctx.globalAlpha = 1;
    const routePts: [number,number][] = [];
    for (let i = 0; i <= 40; i++) { const f = i / 40; routePts.push([116 + (-74 - 116) * f, 40]); }
    const routeProgress = Math.min(1, t * 0.4);
    const vis = Math.floor(routePts.length * routeProgress);
    ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2; ctx.globalAlpha = 0.9; ctx.setLineDash([6, 4]);
    ctx.beginPath(); let rf = true;
    routePts.slice(0, vis).forEach(([lon, lat]) => {
      const p = project(lon, lat, rot, cx, cy, r); if (!p.v) { rf = true; return; }
      rf ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); rf = false;
    });
    ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    [[116, 40, "北京"], [-74, 40, "纽约"]].forEach(([lon, lat, label], mi) => {
      const p = project(lon as number, lat as number, rot, cx, cy, r); if (!p.v) return;
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fillStyle = "#f59e0b"; ctx.fill();
      if (mi === 0 || routeProgress > 0.9) {
        ctx.fillStyle = "#fff"; ctx.font = `bold ${10 * devicePixelRatio}px sans-serif`;
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillText(label as string, p.x + 6, p.y);
      }
    });
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(100,180,255,0.3)"; ctx.lineWidth = 1.5; ctx.stroke();
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

export default GeoGlobeDemo;
