import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface VolcanoProps { color?: string; size?: number; duration?: number; delay?: number; stepTime?: number; className?: string; style?: CSSProperties; }

export function Volcano({ color = "var(--accent)", size = 240, duration = 4.5, delay = 0, stepTime, className, style }: VolcanoProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.width = 280; canvas.height = 240;
    const ctx = canvas.getContext("2d")!;
    const tl = gsap.timeline({ delay, repeat: -1, repeatDelay: 2.5 });
    tlRef.current = tl;

    const smoke = svg.querySelector("#vc-smoke") as SVGCircleElement;
    const cracks = svg.querySelectorAll(".vc-crack");
    const lavaInside = svg.querySelector("#vc-lava-inside") as SVGCircleElement;
    const eruption = svg.querySelector("#vc-eruption") as SVGGElement;
    const ashCloud = svg.querySelector("#vc-ash-cloud") as SVGCircleElement;
    const lavaFlow = svg.querySelector("#vc-lava-flow") as SVGPathElement;
    const plants = svg.querySelectorAll(".vc-plant");

    // Phase 1: Gentle smoke (0→1.5s)
    tl.fromTo(smoke, { scale: 0.8, opacity: 0.3 }, { scale: 3, opacity: 0.6, duration: 1.5, ease: "power2.out", transformOrigin: "140px 80px" }, 0);

    // Phase 2: Ground rumbles, cracks appear (1.2→2s)
    tl.to(svg.querySelector("#vc-mountain")!, { y: 1, duration: 0.1, yoyo: true, repeat: 5 }, 1.2);
    cracks.forEach((crack, i) => {
      tl.fromTo(crack, { scale: 0, opacity: 0, transformOrigin: "140px 160px" }, { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }, 1.5 + i * 0.15);
    });

    // Lava glow inside crater (1.5→2.5s)
    tl.fromTo(lavaInside, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 1, ease: "power2.in", transformOrigin: "140px 80px" }, 1.5);

    // Phase 3: ERUPTION (2.5→3.5s)
    tl.fromTo(eruption, { scaleY: 0, opacity: 0, transformOrigin: "140px 80px" }, { scaleY: 1, opacity: 1, duration: 0.4, ease: "power3.out" }, 2.5);
    tl.to(ashCloud, { scale: 8, opacity: 0.2, duration: 1.5, ease: "power2.out", transformOrigin: "140px 80px" }, 2.6);

    // Lava flows down (2.8→4s)
    tl.fromTo(lavaFlow, { attr: { d: "M 140 80 L 140 80" } }, { attr: { d: "M 130 90 Q 100 120 60 170 L 80 175 Q 110 140 140 110" }, duration: 1.5, ease: "power2.out" }, 2.8);

    // Phase 4: Regrowth — plants appear at the base (3.5→4.5s)
    plants.forEach((plant, i) => {
      tl.fromTo(plant, { scale: 0, opacity: 0 }, { scale: 1, opacity: 0.7, duration: 0.5, ease: "back.out(2)" }, 3.8 + i * 0.25);
    });

    // Particle effects via canvas
    const fireParticles = Array.from({ length: 40 }, () => ({ x: 140, y: 80, vx: (Math.random() - 0.5) * 4, vy: -(Math.random() * 5 + 3), life: 0, color: Math.random() > 0.5 ? color : "#ff4500" }));
    const particleAnim = { erupting: false };
    tl.set(particleAnim, { erupting: true }, 2.4);
    tl.set(particleAnim, { erupting: false }, 3.5);

    const drawFire = () => {
      ctx.clearRect(0, 0, 280, 240);
      if (!particleAnim.erupting) return;
      fireParticles.forEach((p) => {
        p.y += p.vy * 0.5;
        p.x += p.vx;
        p.life += 0.02;
        if (p.life > 1 || p.y > 240) { p.y = 80; p.x = 140 + (Math.random() - 0.5) * 10; p.life = 0; p.vy = -(Math.random() * 5 + 3); }
        ctx.globalAlpha = 1 - p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 * (1 - p.life), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };
    gsap.ticker.add(drawFire);

    return () => { tl.kill(); gsap.ticker.remove(drawFire); };
  }, [duration, delay]);

  useEffect(() => { if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime % (tlRef.current.duration() || 1)); }, [stepTime]);

  return (
    <div className={className} style={{ position: "relative", width: size, height: size * 0.85, ...style }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2 }} />
      <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 280 240" style={{ position: "relative", zIndex: 1 }}>
        {/* Sky gradient */}
        <defs>
          <linearGradient id="vc-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a0a14" />
            <stop offset="100%" stopColor="#1a1a2e" />
          </linearGradient>
        </defs>
        <rect width="280" height="240" fill="url(#vc-sky)" />

        {/* Mountain */}
        <path id="vc-mountain" d="M 40 180 L 140 50 L 240 180 Z" fill="#1a1a24" stroke={color} strokeWidth={1.5} opacity={0.5} />

        {/* Smoke */}
        <circle id="vc-smoke" cx="140" cy="65" r="12" fill="var(--text-mute)" opacity={0.2} />

        {/* Cracks */}
        {[[120, 130, -30], [160, 140, 30], [100, 160, -45], [180, 155, 20]].map(([x, y, angle], i) => (
          <line key={i} className="vc-crack" x1={Number(x)} y1={Number(y)} x2={Number(x) + 15} y2={Number(y) + 15} stroke={color} strokeWidth={1.5} opacity={0} style={{transformOrigin:" + x + "px " + y + "px}} />
        ))}

        {/* Lava glow */}
        <circle id="vc-lava-inside" cx="140" cy="80" r="18" fill={color} opacity={0} />
        <circle cx="140" cy="80" r="30" fill={`${color}44`} opacity={0} />

        {/* Eruption column */}
        <g id="vc-eruption" transform="translate(140, 80)" opacity={0}>
          <path d="M -8 0 Q 0 -60 10 0" fill={color} opacity={0.8} />
          <path d="M -4 0 Q 4 -40 6 0" fill="#ff4500" opacity={0.6} />
          <circle cx="0" cy="-70" r="10" fill={`${color}44`} />
        </g>

        {/* Ash cloud */}
        <circle id="vc-ash-cloud" cx="140" cy="60" r="25" fill="#333" opacity={0} />

        {/* Lava flow */}
        <path id="vc-lava-flow" d="M 140 80 L 140 80" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" opacity={0.7} />

        {/* Regrowth plants */}
        {[[60, 175], [75, 178], [200, 172], [220, 176]].map(([x, y], i) => (
          <g key={i} className="vc-plant" transform={`translate(${x}, ${y})`} opacity={0}>
            <line x1="0" y1="0" x2="0" y2="-12" stroke="#10b981" strokeWidth={1.5} />
            <ellipse cx={i % 2 === 0 ? -4 : 4} cy={-8} rx="4" ry="2" fill="#10b981" opacity={0.6} />
          </g>
        ))}
      </svg>
    </div>
  );
}
