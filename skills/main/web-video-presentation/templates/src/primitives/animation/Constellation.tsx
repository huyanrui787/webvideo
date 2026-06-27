import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface ConstellationProps { stars?: number; color?: string; size?: number; duration?: number; delay?: number; stepTime?: number; className?: string; style?: CSSProperties; }

function hash(n: number) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

export function Constellation({ stars = 8, color = "var(--accent)", size = 200, duration = 3, delay = 0, stepTime, className, style }: ConstellationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ delay });
    tlRef.current = tl;

    const starEls = svg.querySelectorAll(".const-star");
    const lines = svg.querySelectorAll(".const-line");

    // Stars fade in with stagger
    starEls.forEach((star, i) => {
      tl.fromTo(star, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, i * (duration / stars / 2));
      // Subtle pulse
      tl.to(star, { opacity: 0.6, yoyo: true, repeat: -1, duration: 1 + hash(i) * 2, ease: "sine.inOut" }, i * 0.2);
    });

    // Lines connect sequentially with DrawSVG
    lines.forEach((line, i) => {
      const length = (line as SVGLineElement).getTotalLength?.() ?? 100;
      tl.fromTo(line, { strokeDasharray: length, strokeDashoffset: length },
        { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" }, duration * 0.3 + i * (duration / stars / 3));
    });

    return () => { tl.kill(); };
  }, [stars, duration, delay]);

  useEffect(() => { if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime); }, [stepTime]);

  // Generate star positions
  const points = Array.from({ length: stars }, (_, i) => ({
    x: 30 + hash(i * 7) * 140,
    y: 20 + hash(i * 13) * 80,
  }));

  return (
    <svg ref={svgRef} width={size} height={size * 0.6} viewBox="0 0 200 120" className={className} style={style}>
      {/* Connection lines (MST edges — connect nearest neighbors) */}
      {points.map((p, i) => {
        // Simple greedy: connect each to the next closest unconnected
        if (i === 0) return null;
        let closest = 0, minDist = Infinity;
        for (let j = 0; j < i; j++) {
          const dx = p.x - points[j].x, dy = p.y - points[j].y;
          const d = dx * dx + dy * dy;
          if (d < minDist) { minDist = d; closest = j; }
        }
        return <line key={i} className="const-line" x1={points[closest].x} y1={points[closest].y} x2={p.x} y2={p.y} stroke={color} strokeWidth={1.2} opacity={0.4} />;
      })}
      {/* Stars */}
      {points.map((p, i) => (
        <g key={i} className="const-star">
          <circle cx={p.x} cy={p.y} r={3 + hash(i * 17) * 2} fill={color} opacity={0.9} />
          <circle cx={p.x} cy={p.y} r={8 + hash(i * 19) * 4} fill={color} opacity={0.1} />
        </g>
      ))}
    </svg>
  );
}
