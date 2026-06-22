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

export function WaveDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const cy = h / 2, amp = h * 0.2;
    const phase = t * Math.PI * 2;
    ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 2 * devicePixelRatio;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) { const y = cy + Math.sin(x / w * 4 * Math.PI + phase) * amp; x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    const n = 32;
    for (let i = 0; i < n; i++) {
      const bAmp = (hash(i * 17 + Math.floor(t * 12)) * 0.6 + 0.2) * amp * 1.5;
      const x = (i / n) * w; const bw = w / n * 0.7;
      ctx.fillStyle = `hsl(${200 + i * 3}, 80%, 60%)`; ctx.globalAlpha = 0.7;
      ctx.fillRect(x, cy - bAmp, bw, bAmp * 2);
    }
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

export function NetworkDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  const nodes = [
    { x: 0.5, y: 0.5, label: "Core", highlight: true },
    { x: 0.2, y: 0.25 }, { x: 0.8, y: 0.25 },
    { x: 0.15, y: 0.7 }, { x: 0.85, y: 0.7 },
    { x: 0.5, y: 0.15 }, { x: 0.5, y: 0.85 },
  ];
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const visible = Math.min(nodes.length, Math.floor(t * 1.5) + 1);
    for (let i = 1; i < visible; i++) {
      const from = nodes[0], to = nodes[i];
      ctx.strokeStyle = "rgba(100,200,255,0.3)"; ctx.lineWidth = 1.5 * devicePixelRatio;
      ctx.beginPath(); ctx.moveTo(from.x * w, from.y * h); ctx.lineTo(to.x * w, to.y * h); ctx.stroke();
    }
    nodes.slice(0, visible).forEach((n, i) => {
      const r = (i === 0 ? 14 : 8) * devicePixelRatio;
      ctx.beginPath(); ctx.arc(n.x * w, n.y * h, r, 0, Math.PI * 2);
      ctx.fillStyle = n.highlight ? "#f59e0b" : "#3b82f6"; ctx.fill();
      if (n.label) {
        ctx.fillStyle = "#fff"; ctx.font = `bold ${11 * devicePixelRatio}px sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(n.label, n.x * w, n.y * h);
      }
    });
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

export function ChartPieDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  const slices = [
    { v: 42, label: "USA", color: "#3b82f6" }, { v: 18, label: "CHN", color: "#ef4444" },
    { v: 12, label: "EU", color: "#10b981" }, { v: 8, label: "JPN", color: "#f59e0b" },
    { v: 20, label: "Others", color: "#8b5cf6" },
  ];
  const total = slices.reduce((s, d) => s + d.v, 0);
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const progress = Math.min(1, t / 1.4);
    const eased = 1 - Math.pow(1 - progress, 3);
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.38, ir = r * 0.55;
    let angle = -Math.PI / 2;
    slices.forEach((s) => {
      const frac = s.v / total;
      const end = angle + frac * eased * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + ir * Math.cos(angle), cy + ir * Math.sin(angle));
      ctx.arc(cx, cy, r, angle, end); ctx.arc(cx, cy, ir, end, angle, true);
      ctx.closePath(); ctx.fillStyle = s.color; ctx.globalAlpha = 0.9; ctx.fill();
      if (progress > 0.9 && s.label) {
        const mid = angle + (end - angle) / 2;
        const lr = r * 0.77;
        ctx.globalAlpha = (progress - 0.9) / 0.1;
        ctx.fillStyle = "#fff"; ctx.font = `bold ${w * 0.045}px sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(s.label, cx + lr * Math.cos(mid), cy + lr * Math.sin(mid));
      }
      angle = end;
    });
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

export function ChartBarDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  const bars = [
    { l: "2020", v: 42, c: "#3b82f6" }, { l: "2021", v: 68, c: "#6366f1" },
    { l: "2022", v: 55, c: "#8b5cf6" }, { l: "2023", v: 91, c: "#a855f7" },
    { l: "2024", v: 78, c: "#d946ef" },
  ];
  const max = 100;
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const progress = Math.min(1, t / 1.2);
    const eased = 1 - Math.pow(1 - progress, 3);
    const pad = { t: h * 0.12, r: w * 0.05, b: h * 0.2, l: w * 0.08 };
    const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
    const slotW = cw / bars.length, barW = slotW * 0.65;
    ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ch); ctx.lineTo(pad.l + cw, pad.t + ch); ctx.stroke();
    bars.forEach((b, i) => {
      const frac = (b.v / max) * eased;
      const x = pad.l + i * slotW + slotW * 0.175;
      const bh = ch * frac; const y = pad.t + ch - bh;
      const grad = ctx.createLinearGradient(x, y, x, y + bh);
      grad.addColorStop(0, b.c); grad.addColorStop(1, b.c + "66");
      ctx.fillStyle = grad; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.roundRect(x, y, barW, bh, [3, 3, 0, 0]); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.font = `${w * 0.038}px sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(b.l, x + barW / 2, pad.t + ch + 6);
      if (progress > 0.5) { ctx.fillStyle = "#fff"; ctx.textBaseline = "bottom"; ctx.fillText(String(Math.round(b.v * eased)), x + barW / 2, y - 3); }
    });
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

export function ChartLineDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  const pts = [12, 28, 22, 45, 38, 67, 55, 89, 76, 95];
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const progress = Math.min(1, t / 1.4);
    const pad = { t: h * 0.12, r: w * 0.06, b: h * 0.15, l: w * 0.08 };
    const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
    const maxY = 100;
    const toX = (i: number) => pad.l + (i / (pts.length - 1)) * cw;
    const toY = (v: number) => pad.t + (1 - v / maxY) * ch;
    ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ch); ctx.lineTo(pad.l + cw, pad.t + ch); ctx.stroke();
    [25, 50, 75].forEach((v) => { ctx.beginPath(); ctx.moveTo(pad.l, toY(v)); ctx.lineTo(pad.l + cw, toY(v)); ctx.stroke(); });
    const visLen = Math.max(1, Math.floor(pts.length * progress));
    const partial = (pts.length * progress) - visLen;
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
    grad.addColorStop(0, "#3b82f640"); grad.addColorStop(1, "#3b82f605");
    ctx.fillStyle = grad; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(toX(0), pad.t + ch);
    for (let i = 0; i <= visLen; i++) {
      let x = toX(i), y = toY(pts[i] ?? pts[pts.length - 1]);
      if (i === visLen && i < pts.length - 1 && partial > 0) { x = toX(i - 1) + (toX(i) - toX(i - 1)) * partial; y = toY(pts[i - 1]) + (toY(pts[i]) - toY(pts[i - 1])) * partial; }
      ctx.lineTo(x, y);
    }
    ctx.lineTo(toX(Math.min(visLen, pts.length - 1)), pad.t + ch); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 2.5 * devicePixelRatio; ctx.globalAlpha = 1;
    ctx.beginPath();
    for (let i = 0; i <= visLen; i++) {
      let x = toX(i), y = toY(pts[i] ?? pts[pts.length - 1]);
      if (i === visLen && i < pts.length - 1 && partial > 0) { x = toX(i - 1) + (toX(i) - toX(i - 1)) * partial; y = toY(pts[i - 1]) + (toY(pts[i]) - toY(pts[i - 1])) * partial; }
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (let i = 0; i < visLen; i++) { ctx.beginPath(); ctx.arc(toX(i), toY(pts[i]), 4 * devicePixelRatio, 0, Math.PI * 2); ctx.fillStyle = "#3b82f6"; ctx.fill(); }
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

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

export function CircuitDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const nodes = [
      { x: 0.5, y: 0.5, label: "CPU" }, { x: 0.2, y: 0.3, label: "RAM" },
      { x: 0.8, y: 0.3, label: "GPU" }, { x: 0.2, y: 0.7, label: "SSD" }, { x: 0.8, y: 0.7, label: "NET" },
    ];
    const wires = [[0,1],[0,2],[0,3],[0,4]];
    const progress = Math.min(1, t / 2);
    const accentColor = "#10b981";
    wires.forEach(([fi, ti]) => {
      const from = nodes[fi], to = nodes[ti];
      const pts = [{x:from.x*w,y:from.y*h},{x:to.x*w,y:to.y*h}];
      const len = Math.sqrt((pts[1].x-pts[0].x)**2+(pts[1].y-pts[0].y)**2);
      const dl = len * progress;
      ctx.strokeStyle = "rgba(100,220,180,0.7)"; ctx.lineWidth = 2;
      ctx.shadowColor = accentColor; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      const dx = pts[1].x-pts[0].x, dy = pts[1].y-pts[0].y;
      if (dl >= len) ctx.lineTo(pts[1].x, pts[1].y);
      else ctx.lineTo(pts[0].x + dx * (dl/len), pts[0].y + dy * (dl/len));
      ctx.stroke(); ctx.shadowBlur = 0;
      if (progress > 0.3) {
        for (let p = 0; p < 3; p++) {
          const phase = (hash(fi*13+p*7) + t * 0.5) % 1;
          if (phase * len > dl) return;
          const px = pts[0].x + dx * phase, py = pts[0].y + dy * phase;
          ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI*2);
          ctx.fillStyle = accentColor; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
        }
      }
    });
    nodes.forEach((n) => {
      const x = n.x*w, y = n.y*h; const hw = 35, hh = 18;
      ctx.strokeStyle = accentColor; ctx.lineWidth = 1.5; ctx.fillStyle = "#0d1f1a";
      ctx.shadowColor = accentColor; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.roundRect(x-hw, y-hh, hw*2, hh*2, [3]); ctx.stroke(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = accentColor; ctx.font = `bold ${10}px monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(n.label, x, y);
    });
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

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

export function FlowChartDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  const nodes = [
    { id: 0, x: 0.15, y: 0.5, label: "节点 1", sub: "10.0.0.1" },
    { id: 1, x: 0.4,  y: 0.5, label: "节点 2", sub: "20.0.0.3" },
    { id: 2, x: 0.65, y: 0.5, label: "节点 3", sub: "30.0.0.8" },
    { id: 3, x: 0.88, y: 0.5, label: "超时", sub: "TTL耗尽", error: true },
  ];
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const progress = Math.min(1, t / 2.5);
    const visEdges = Math.floor(progress * (nodes.length - 1) + 1);
    ctx.fillStyle = "rgba(0,255,180,0.15)"; ctx.fillRect(0, 0, w, h * 0.22);
    ctx.fillStyle = "#00ffb4"; ctx.font = `bold ${w*0.028}px monospace`; ctx.textAlign = "left";
    ctx.fillText("$ traceroute 8.8.8.8", w*0.04, h*0.12);
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = `${w*0.022}px monospace`;
    ["1 ms  10.0.0.1", "1 ms  20.0.0.3", "* * *  TTL 耗尽，返回 ICMP Time Exceeded"].slice(0, Math.floor(progress * 3 + 0.3)).forEach((r, i) => ctx.fillText(r, w*0.04, h*0.12 + (i+1)*h*0.07));
    for (let i = 0; i < Math.min(visEdges - 1, nodes.length - 1); i++) {
      const from = nodes[i], to = nodes[i+1];
      const fx = from.x*w, fy = from.y*h, tx2 = to.x*w, ty = to.y*h;
      const edgeP = Math.min(1, (progress * (nodes.length-1) - i));
      const ex = fx + (tx2 - fx) * edgeP, ey = fy + (ty - fy) * edgeP;
      ctx.strokeStyle = to.error ? "#ef4444" : "#00ffb4"; ctx.lineWidth = 2; ctx.setLineDash([6, 3]);
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
      if (edgeP > 0.9) {
        const angle = Math.atan2(ty - fy, tx2 - fx);
        ctx.beginPath(); ctx.moveTo(tx2, ty);
        ctx.lineTo(tx2 - 10*Math.cos(angle-0.4), ty - 10*Math.sin(angle-0.4));
        ctx.lineTo(tx2 - 10*Math.cos(angle+0.4), ty - 10*Math.sin(angle+0.4));
        ctx.closePath(); ctx.fillStyle = to.error ? "#ef4444" : "#00ffb4"; ctx.fill();
      }
      const pp = ((t * 1.2) % 1);
      if (pp < edgeP) { ctx.beginPath(); ctx.arc(fx+(tx2-fx)*pp, fy+(ty-fy)*pp, 4, 0, Math.PI*2); ctx.fillStyle = "#f59e0b"; ctx.globalAlpha=0.9; ctx.fill(); ctx.globalAlpha=1; }
    }
    nodes.forEach((n, i) => {
      if (i >= visEdges + (i === 0 ? 0 : -1) + 1) return;
      const x = n.x*w, y = n.y*h; const hw = w*0.1, hh = h*0.1;
      ctx.fillStyle = n.error ? "rgba(239,68,68,0.2)" : "rgba(0,255,180,0.1)";
      ctx.strokeStyle = n.error ? "#ef4444" : "#00ffb4"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(x-hw, y-hh, hw*2, hh*2, [6]); ctx.fill(); ctx.stroke();
      ctx.fillStyle = n.error ? "#ef4444" : "#00ffb4";
      ctx.font = `bold ${w*0.028}px monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(n.label, x, y - h*0.02);
      ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.font = `${w*0.022}px monospace`;
      ctx.fillText(n.sub, x, y + h*0.04);
    });
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" style={{ background: "#030d0a" }} />;
}

export function LoadingDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const cx = w/2, cy = h*0.42, r = Math.min(w,h)*0.25;
    [1.4, 1.25, 1.1].forEach((scale, i) => { ctx.beginPath(); ctx.arc(cx, cy, r*scale, 0, Math.PI*2); ctx.strokeStyle = `rgba(0,200,255,${0.06 + i*0.04})`; ctx.lineWidth = 1; ctx.stroke(); });
    for (let i = 0; i < 8; i++) { const a = (i/8)*Math.PI*2 + t*1.5; ctx.beginPath(); ctx.arc(cx, cy, r*1.18, a, a+0.3); ctx.strokeStyle = `rgba(0,200,255,${0.15 + (i%2)*0.15})`; ctx.lineWidth = 3; ctx.stroke(); }
    const fullP = t > 5 ? 1 : (Math.sin(t*0.6 - Math.PI/2)*0.5+0.5);
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + fullP*Math.PI*2);
    const grad = ctx.createLinearGradient(cx-r,cy,cx+r,cy); grad.addColorStop(0, "#00c8ff"); grad.addColorStop(1, "#0066ff");
    ctx.strokeStyle = grad; ctx.lineWidth = 8; ctx.lineCap="round"; ctx.stroke(); ctx.lineCap="butt";
    ctx.beginPath(); ctx.arc(cx,cy,r*0.3,0,Math.PI*2); ctx.fillStyle = "rgba(0,100,180,0.3)"; ctx.fill();
    ctx.strokeStyle="rgba(0,200,255,0.4)"; ctx.lineWidth=1.5; ctx.stroke();
    const pct = Math.round(fullP*100);
    ctx.fillStyle="#00c8ff"; ctx.font=`bold ${w*0.065}px monospace`; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(`${pct}%`, cx, cy);
    const statusY = cy + r*1.55;
    ctx.fillStyle = pct===100 ? "rgba(0,255,150,0.15)" : "rgba(0,100,200,0.15)";
    ctx.beginPath(); ctx.roundRect(cx-r*1.1, statusY-h*0.07, r*2.2, h*0.13, [4]); ctx.fill();
    ctx.strokeStyle = pct===100?"#00ff96":"rgba(0,200,255,0.4)"; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle = pct===100?"#00ff96":"#00c8ff"; ctx.font=`bold ${w*0.028}px monospace`; ctx.textBaseline="middle";
    ctx.fillText(pct===100?"系统就绪 (SYSTEM READY)":"初始化中...", cx, statusY);
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" style={{ background: "#020810" }} />;
}

export function StickFigureDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  function drawFigure(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string, phase: number, pose: "walk"|"reach" = "walk") {
    ctx.strokeStyle = color; ctx.lineWidth = scale*0.06; ctx.lineCap="round";
    const h2 = scale*0.28, hw = scale*0.15;
    ctx.beginPath(); ctx.arc(x, y - scale*0.72, scale*0.14, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y-scale*0.58); ctx.lineTo(x, y-scale*0.2); ctx.stroke();
    if (pose === "walk") {
      const s = Math.sin(phase), c2 = Math.cos(phase);
      ctx.beginPath(); ctx.moveTo(x, y-scale*0.48); ctx.lineTo(x+hw*s*0.8, y-scale*0.28+hw*0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y-scale*0.48); ctx.lineTo(x-hw*s*0.8, y-scale*0.28+hw*0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y-scale*0.2); ctx.lineTo(x+hw*c2*0.7, y); ctx.lineTo(x+hw*c2*0.5, y+h2*0.8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y-scale*0.2); ctx.lineTo(x-hw*c2*0.7, y); ctx.lineTo(x-hw*c2*0.5, y+h2*0.8); ctx.stroke();
    } else {
      const stretch = Math.min(1, phase);
      ctx.beginPath(); ctx.moveTo(x, y-scale*0.48); ctx.lineTo(x+scale*0.4*stretch, y-scale*0.58+scale*0.1*(1-stretch)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y-scale*0.48); ctx.lineTo(x-scale*0.2, y-scale*0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y-scale*0.2); ctx.lineTo(x+scale*0.1, y+h2*0.5); ctx.lineTo(x+scale*0.15, y+h2*1.0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y-scale*0.2); ctx.lineTo(x-scale*0.1, y+h2*0.5); ctx.lineTo(x-scale*0.05, y+h2*1.0); ctx.stroke();
    }
  }
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const ground = h*0.72;
    ctx.strokeStyle="rgba(255,255,255,0.15)"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,ground); ctx.lineTo(w,ground); ctx.stroke();
    ctx.fillStyle="rgba(255,255,255,0.5)"; ctx.font=`${w*0.028}px sans-serif`; ctx.textAlign="center";
    ctx.fillText("技能：隔空取物 (Telekinesis)", w/2, h*0.12);
    const walkX = (t * w * 0.08) % (w * 1.1) - w*0.05;
    drawFigure(ctx, walkX, ground, h*0.38, "#00d4ff", t * 4, "walk");
    const reachPhase = (Math.sin(t*1.2)+1)*0.5;
    drawFigure(ctx, w*0.72, ground, h*0.42, "#ff6eb0", reachPhase, "reach");
    const floatY = ground - h*0.55 - Math.sin(t*2)*h*0.04;
    const floatX = w*0.48 + Math.sin(t*0.8)*w*0.03;
    ctx.beginPath(); ctx.arc(floatX, floatY, h*0.04, 0, Math.PI*2); ctx.fillStyle="#f59e0b"; ctx.globalAlpha=0.9; ctx.fill(); ctx.globalAlpha=1;
    ctx.strokeStyle="#f59e0b44"; ctx.lineWidth=1; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(floatX, floatY); ctx.lineTo(w*0.72-h*0.06, ground-h*0.38*0.48); ctx.stroke(); ctx.setLineDash([]);
    for (let i = 0; i < 4; i++) {
      const ang = t*2 + i*Math.PI/2;
      ctx.beginPath(); ctx.arc(floatX, floatY, h*0.07+i*h*0.025, ang, ang+0.6);
      ctx.strokeStyle=`rgba(245,158,11,${0.4-i*0.08})`; ctx.lineWidth=1.5; ctx.stroke();
    }
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" style={{ background: "#050510" }} />;
}

export function MoonPhaseDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const sx = hash(i*7)*w, sy = hash(i*13)*h;
      const blink = 0.3 + 0.4*Math.sin(t*1.5 + hash(i)*10);
      ctx.beginPath(); ctx.arc(sx, sy, hash(i*3)*1.5+0.5, 0, Math.PI*2); ctx.fillStyle=`rgba(255,255,255,${blink})`; ctx.fill();
    }
    const cx = w*0.52, cy = h*0.48, r = Math.min(w,h)*0.33;
    const phase = (t*0.15) % 1;
    const moonGrad = ctx.createRadialGradient(cx-r*0.25, cy-r*0.25, r*0.05, cx, cy, r);
    moonGrad.addColorStop(0, "#e8e8d0"); moonGrad.addColorStop(0.6, "#c8c8b0"); moonGrad.addColorStop(1, "#707060");
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fillStyle=moonGrad; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.clip();
    const shadowFrac = phase < 0.5 ? 1 - phase*4 : (phase - 0.5)*4 - 1;
    const shadowX = cx + shadowFrac * r;
    const shadowGrad = ctx.createRadialGradient(shadowX, cy, 0, shadowX, cy, r*1.5);
    shadowGrad.addColorStop(0, "rgba(5,5,20,0.98)"); shadowGrad.addColorStop(1, "rgba(5,5,20,0.85)");
    ctx.beginPath();
    if (phase < 0.5) { ctx.arc(cx, cy, r, Math.PI/2, -Math.PI/2, false); const rx = shadowFrac * r; ctx.ellipse(cx, cy, Math.abs(rx), r, 0, -Math.PI/2, Math.PI/2, rx > 0); }
    else { ctx.arc(cx, cy, r, -Math.PI/2, Math.PI/2, false); const rx = -shadowFrac * r; ctx.ellipse(cx, cy, Math.abs(rx), r, 0, Math.PI/2, -Math.PI/2, rx > 0); }
    ctx.closePath(); ctx.fillStyle=shadowGrad; ctx.fill(); ctx.restore();
    const illumination = Math.round(Math.abs(Math.sin(phase*Math.PI))*100);
    const age = Math.round(phase*29.5);
    const phaseName = phase<0.1?"新月":phase<0.3?"峨眉月":phase<0.45?"上弦月":phase<0.55?"满月":phase<0.7?"渐亏凸月":"下弦月";
    ctx.fillStyle="rgba(0,80,160,0.4)"; ctx.beginPath(); ctx.roundRect(w*0.02, h*0.04, w*0.28, h*0.38, [6]); ctx.fill();
    ctx.strokeStyle="rgba(0,150,255,0.3)"; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle="#00aaff"; ctx.font=`bold ${w*0.025}px monospace`; ctx.textAlign="left"; ctx.fillText("DATA LOG:", w*0.04, h*0.12);
    ctx.fillStyle="rgba(255,255,255,0.7)"; ctx.font=`${w*0.022}px monospace`;
    [`Illumination: ${illumination}%`, `Age: ${age}/29.5 days`, `Phase: ${phaseName}`].forEach((line, i) => ctx.fillText(line, w*0.04, h*0.18+i*h*0.06));
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" style={{ background: "#020210" }} />;
}

export function LineDrawDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const progress = Math.min(1, t / 3);
    ctx.fillStyle="#00c8ff"; ctx.font=`bold ${w*0.038}px monospace`; ctx.textAlign="left";
    ctx.fillText("E ARCHITECTURE", w*0.04, h*0.12);
    const dcx = w*0.52, dcy = h*0.65;
    [0.38, 0.26, 0.16].forEach((frac, i) => {
      const r = Math.min(w,h)*frac*0.5;
      const circP = Math.max(0, Math.min(1, (progress - i*0.15 - 0.2) / 0.4));
      if (circP <= 0) return;
      ctx.beginPath(); ctx.arc(dcx, dcy, r, -Math.PI/2, -Math.PI/2 + circP*Math.PI*2);
      ctx.strokeStyle=`rgba(0,200,255,${0.3+i*0.1})`; ctx.lineWidth=1.5; ctx.stroke();
    });
    if (progress > 0.5) {
      for (let i = 0; i < 6; i++) {
        const ang = (i/6)*Math.PI*2 - Math.PI/2;
        const r2 = Math.min(w,h)*0.38*0.5*((progress-0.5)/0.5);
        ctx.beginPath(); ctx.moveTo(dcx, dcy); ctx.lineTo(dcx + r2*Math.cos(ang), dcy + r2*Math.sin(ang));
        ctx.strokeStyle="rgba(0,200,255,0.15)"; ctx.lineWidth=0.8; ctx.stroke();
      }
    }
    if (progress > 0.7) {
      const items = ["Engine: V8 JavaScript", "Rendering: Blink", "Multi-process Arch"];
      ctx.fillStyle="rgba(0,50,30,0.4)"; ctx.beginPath(); ctx.roundRect(w*0.67, h*0.52, w*0.3, h*0.35, [4]); ctx.fill();
      ctx.fillStyle="#00ffb4"; ctx.font=`bold ${w*0.02}px monospace`; ctx.textAlign="left"; ctx.fillText("CORE COMPONENTS", w*0.68, h*0.58);
      items.slice(0, Math.ceil(((progress-0.7)/0.3)*3)).forEach((item, i) => {
        ctx.fillStyle="rgba(0,255,100,0.7)"; ctx.font=`${w*0.019}px monospace`; ctx.fillText(`> ${item}`, w*0.68, h*0.64+i*h*0.075);
      });
    }
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" style={{ background: "#030a05" }} />;
}

export function GameDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle="#1a1a2e"; ctx.fillRect(0,0,w,h);
    ctx.fillStyle="#111"; ctx.fillRect(0,0,w,h*0.1);
    ctx.fillStyle="#f59e0b"; ctx.font=`bold ${w*0.035}px monospace`; ctx.textAlign="left";
    ctx.fillText("LE CITY: NEO", w*0.04, h*0.07);
    const cols=7, rows=8, tileW=w/cols, tileH=(h*0.9)/rows, oy = h*0.1;
    const layout=[[1,1,1,1,1,1,1],[1,0,0,0,1,0,1],[1,0,1,0,0,0,1],[1,0,1,0,1,0,1],[1,0,0,0,0,0,1],[1,0,1,1,0,1,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]];
    layout.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        const x = ci*tileW, y = oy+ri*tileH;
        ctx.fillStyle = cell ? "#8b6040" : (ri===3&&ci>=1&&ci<=5) ? "#2d5a27" : "#555560";
        ctx.fillRect(x+1, y+1, tileW-2, tileH-2);
        if (cell) { ctx.fillStyle="rgba(255,220,150,0.15)"; ctx.fillRect(x+1,y+1,tileW-2,tileH*0.3); }
      });
    });
    const py = Math.floor(1.5 + Math.sin(t*1.5)*0.49 + 0.5)*2 + 1;
    const playerX = (3+0.5)*tileW, playerY = oy+(Math.min(6,Math.max(1,py))+0.5)*tileH;
    const pg = ctx.createRadialGradient(playerX, playerY, 0, playerX, playerY, tileW*0.8);
    pg.addColorStop(0,"rgba(245,200,0,0.4)"); pg.addColorStop(1,"transparent");
    ctx.beginPath(); ctx.arc(playerX, playerY, tileW*0.8, 0, Math.PI*2); ctx.fillStyle=pg; ctx.fill();
    ctx.beginPath(); ctx.arc(playerX, playerY, tileW*0.28, 0, Math.PI*2); ctx.fillStyle="#f59e0b"; ctx.fill();
    ctx.strokeStyle="#fff"; ctx.lineWidth=1.5; ctx.stroke();
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

export function EditorialDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useRaf((t) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const bgGrad = ctx.createRadialGradient(w*0.6, h*0.4, h*0.1, w*0.6, h*0.4, h*0.8);
    bgGrad.addColorStop(0, "#1a2a5e"); bgGrad.addColorStop(0.5, "#0d0d2b"); bgGrad.addColorStop(1, "#050510");
    ctx.fillStyle=bgGrad; ctx.fillRect(0,0,w,h);
    for (let i = 0; i < 80; i++) {
      const sx=hash(i*11)*w, sy=hash(i*17)*h;
      ctx.beginPath(); ctx.arc(sx,sy,hash(i)*1.2,0,Math.PI*2); ctx.fillStyle=`rgba(255,255,255,${0.2+hash(i*3)*0.5})`; ctx.fill();
    }
    const titleP = Math.min(1, t/1.2);
    ctx.fillStyle=`rgba(255,255,255,${titleP})`;
    ctx.font=`bold ${w*0.14}px sans-serif`; ctx.textAlign="center";
    ctx.fillText("三体", w*0.5, h*0.52);
    if (titleP > 0.6) {
      ctx.fillStyle=`rgba(255,255,255,${(titleP-0.6)/0.4*0.55})`;
      ctx.font=`${w*0.025}px sans-serif`;
      ctx.fillText('"给时光以生命，给岁月以文明。"', w*0.5, h*0.64);
    }
    if (titleP > 0.8) {
      const bp = (titleP-0.8)/0.2;
      ctx.globalAlpha=bp;
      ctx.fillStyle="#3b82f6"; ctx.beginPath(); ctx.roundRect(w*0.29, h*0.72, w*0.2, h*0.08, [24]); ctx.fill();
      ctx.fillStyle="#fff"; ctx.font=`bold ${w*0.028}px sans-serif`; ctx.fillText("开启探索", w*0.39, h*0.765);
      ctx.fillStyle="rgba(255,255,255,0.1)"; ctx.strokeStyle="rgba(255,255,255,0.3)"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.roundRect(w*0.51, h*0.72, w*0.2, h*0.08, [24]); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#fff"; ctx.fillText("了解作者", w*0.61, h*0.765);
      ctx.globalAlpha=1;
    }
  });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}
