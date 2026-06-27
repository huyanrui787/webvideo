import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface Storm2CalmProps { color?: string; size?: number; duration?: number; delay?: number; stepTime?: number; className?: string; style?: CSSProperties; }

export function Storm2Calm({ color = "var(--accent)", size = 260, duration = 4.5, delay = 0, stepTime, className, style }: Storm2CalmProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.width = 300; canvas.height = 200;
    const ctx = canvas.getContext("2d")!;
    const tl = gsap.timeline({ delay, repeat: -1, repeatDelay: 2 });
    tlRef.current = tl;

    const lightning = svg.querySelector("#sc-lightning") as SVGPathElement;
    const boat = svg.querySelector("#sc-boat") as SVGGElement;
    const light = svg.querySelector("#sc-light") as SVGCircleElement;
    const sky = svg.querySelector("#sc-sky") as SVGRectElement;

    // Phase 1: Sky darkens (0→1.5s)
    tl.to(sky, { fill: "#0a0a14", duration: 1.5, ease: "power2.in" }, 0);

    // Phase 2: Lightning strikes (1.5→2.5s)
    tl.fromTo(lightning, { opacity: 1 }, { opacity: 1, duration: 0.1 }, 1.5);
    tl.to(lightning, { opacity: 0, duration: 0.05 }, 1.6);
    tl.fromTo(lightning, { opacity: 1 }, { opacity: 1, duration: 0.08 }, 1.8);
    tl.to(lightning, { opacity: 0, duration: 0.05 }, 1.9);
    tl.fromTo(lightning, { opacity: 0.9 }, { opacity: 0.9, duration: 0.06 }, 2.1);
    tl.to(lightning, { opacity: 0, duration: 0.04 }, 2.2);

    // Rain particles via canvas
    const rainDrops = Array.from({ length: 80 }, () => ({ x: Math.random() * 300, y: -Math.random() * 200, speed: 3 + Math.random() * 5, len: 5 + Math.random() * 10 }));
    const rainAnim = { intensity: 0 };
    tl.to(rainAnim, { intensity: 1, duration: 0.5, ease: "power2.in" }, 0.5);
    tl.to(rainAnim, { intensity: 1, duration: 1.5 }, 1.5);
    tl.to(rainAnim, { intensity: 0, duration: 1.5, ease: "power2.out" }, 2.5);

    const drawRain = () => {
      ctx.clearRect(0, 0, 300, 200);
      if (rainAnim.intensity < 0.05) return;
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      rainDrops.forEach((d) => {
        d.y += d.speed * rainAnim.intensity;
        if (d.y > 200) { d.y = -10; d.x = Math.random() * 300; }
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 1, d.y + d.len);
        ctx.stroke();
      });
    };

    // Boat rocks (1.5→3.5s)
    tl.to(boat, { rotation: 8, duration: 0.4, yoyo: true, repeat: 7, transformOrigin: "150px 130px", ease: "sine.inOut" }, 1.5);

    // Phase 3: Light breaks through (2.5→3.5s)
    tl.fromTo(light, { scale: 0, opacity: 0 }, { scale: 1, opacity: 0.8, duration: 1, ease: "power3.out" }, 2.5);
    tl.to(sky, { fill: "#1a1a2e", duration: 1.5, ease: "power2.out" }, 2.5);

    // Phase 4: Calm water, boat settles
    tl.to(boat, { rotation: 0, duration: 0.8, ease: "power2.out" }, 3.5);

    // Render loop
    gsap.ticker.add(drawRain);
    return () => { tl.kill(); gsap.ticker.remove(drawRain); };
  }, [duration, delay]);

  useEffect(() => { if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime % (tlRef.current.duration() || 1)); }, [stepTime]);

  return (
    <div className={className} style={{ position: "relative", width: size, height: size * 0.75, ...style }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2 }} />
      <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 300 200" style={{ position: "relative", zIndex: 1 }}>
        {/* Sky */}
        <rect id="sc-sky" x="0" y="0" width="300" height="200" fill="#1a1a2e" />
        {/* Sea */}
        <path d="M 0 130 Q 75 125 150 130 T 300 130 L 300 200 L 0 200 Z" fill={color} opacity={0.1} />
        <path d="M 0 140 Q 50 135 100 140 T 200 140 T 300 140" fill="none" stroke={color} strokeWidth={1} opacity={0.15} />
        {/* Lightning */}
        <path id="sc-lightning" d="M 180 0 L 160 40 L 175 45 L 150 90 L 170 85 L 155 130" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={0} />
        {/* Boat */}
        <g id="sc-boat" transform="translate(150, 128)">
          <path d="M -20 10 L 20 10 L 12 25 L -12 25 Z" fill="none" stroke={color} strokeWidth={2} />
          <line x1="0" y1="10" x2="0" y2="-15" stroke={color} strokeWidth={1.5} />
          <path d="M 0 -15 L 0 10 L 15 5" fill="none" stroke={color} strokeWidth={1} />
        </g>
        {/* Light beam */}
        <circle id="sc-light" cx="200" cy="60" r="50" fill="url(#sc-light-grad)" opacity={0} />
        <defs>
          <radialGradient id="sc-light-grad">
            <stop offset="0%" stopColor={color} stopOpacity={0.6} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
