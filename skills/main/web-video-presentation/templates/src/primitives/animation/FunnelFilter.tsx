import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface FunnelFilterProps { particleCount?: number; stages?: number; color?: string; size?: number; duration?: number; delay?: number; stepTime?: number; className?: string; style?: CSSProperties; }

export function FunnelFilter({ particleCount = 60, stages = 3, color = "var(--accent)", size = 240, duration = 4, delay = 0, stepTime, className, style }: FunnelFilterProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.width = 300; canvas.height = 280;
    const ctx = canvas.getContext("2d")!;
    const tl = gsap.timeline({ delay, repeat: -1, repeatDelay: 2 });
    tlRef.current = tl;

    const funnel = svg.querySelector("#ff-funnel") as SVGPathElement;
    const goldParticles = svg.querySelectorAll(".ff-gold");
    const stageLabels = svg.querySelectorAll(".ff-stage");

    // Stage 1: All particles fall into funnel
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      x: 20 + (i / particleCount) * 260,
      y: -10 - Math.random() * 20,
      color: i % 10 < 3 ? "#f59e0b" : i % 3 === 0 ? "#3b82f6" : i % 3 === 1 ? "#ef4444" : "#8b5cf6",
      delay: i * 0.02,
    }));

    const drawFrame = (tOffset: number) => {
      ctx.clearRect(0, 0, 300, 280);
      particles.forEach((p) => {
        const elapsed = Math.max(0, (tOffset - p.delay));
        if (elapsed < 0) return;
        const phase = Math.min(elapsed / 2.5, 1); // 0→1 over 2.5s
        const x = p.x;
        const funnelTopY = 60 + phase * 130; // y goes from top to funnel exit
        const funnelX = 150 + (x - 150) * (1 - phase * 0.8); // converge to center
        const y = 20 + (funnelTopY - 20) * phase;
        const size = 2.5 * (1 - phase * 0.3);
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(funnelX, Math.min(y, 190), size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // Funnel highlight pulse
    tl.to(funnel, { strokeWidth: 3, duration: 0.3, yoyo: true, repeat: 1 }, 0);

    // Stage labels appear
    stageLabels.forEach((label, i) => {
      tl.fromTo(label, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3 }, i * 0.8 + 0.5);
    });

    // Gold particles at bottom
    goldParticles.forEach((gp, i) => {
      tl.fromTo(gp, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(3)" }, 2.5 + i * 0.3);
      tl.to(gp, { scale: 1.2, yoyo: true, repeat: -1, duration: 0.8 }, 3 + i * 0.3);
    });

    // Animate particles via canvas
    const animObj = { t: 0 };
    tl.to(animObj, { t: duration, duration, ease: "none", onUpdate: () => { drawFrame(animObj.t); } }, 0);

    return () => { tl.kill(); };
  }, [particleCount, stages, duration, delay]);

  useEffect(() => { if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime % (tlRef.current.duration() || 1)); }, [stepTime]);

  return (
    <div className={className} style={{ position: "relative", width: size, height: size, ...style }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 300 280" style={{ position: "relative", zIndex: 1 }}>
        {/* Funnel */}
        <path id="ff-funnel" d="M 80 40 L 40 130 L 120 130 M 220 40 L 260 130 L 180 130" fill="none" stroke="var(--text-mute)" strokeWidth={2} opacity={0.5} />
        <path d="M 120 130 L 60 200 L 240 200 L 180 130" fill="none" stroke="var(--text-mute)" strokeWidth={2} opacity={0.5} />
        {/* Bottom tube */}
        <line x1="100" y1="200" x2="100" y2="240" stroke="var(--text-mute)" strokeWidth={2} opacity={0.5} />
        <line x1="200" y1="200" x2="200" y2="240" stroke="var(--text-mute)" strokeWidth={2} opacity={0.5} />
        {/* Gold output particles */}
        <circle className="ff-gold" cx="100" cy="245" r="6" fill={color} />
        <circle className="ff-gold" cx="150" cy="250" r="7" fill={color} />
        <circle className="ff-gold" cx="200" cy="245" r="5" fill={color} />
        {/* Stage labels */}
        {["筛选", "过滤", "精华"].map((t, i) => (
          <text key={i} className="ff-stage" x="260" y={100 + i * 40} fontSize={12} fontFamily="var(--font-mono)" fill="var(--text-mute)">{t}</text>
        ))}
      </svg>
    </div>
  );
}
