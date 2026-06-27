import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface HologramRevealProps { color?: string; size?: number; shape?: "cube" | "sphere" | "diamond"; duration?: number; delay?: number; stepTime?: number; className?: string; style?: CSSProperties; }

export function HologramReveal({ color = "var(--accent)", size = 220, shape = "cube", duration = 4.5, delay = 0, stepTime, className, style }: HologramRevealProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ delay, repeat: -1, repeatDelay: 2 });
    tlRef.current = tl;

    const base = svg.querySelector("#hr-base") as SVGEllipseElement;
    const gridLines = svg.querySelectorAll(".hr-grid");
    const lasers = svg.querySelectorAll(".hr-laser");
    const object = svg.querySelector("#hr-object") as SVGGElement;
    const particles = svg.querySelectorAll(".hr-particle");
    const label = svg.querySelector("#hr-label") as SVGTextElement;

    // Base lights up
    tl.fromTo(base, { fill: `${color}00` }, { fill: `${color}33`, duration: 0.4 }, 0);
    tl.to(base, { rx: 80, ry: 15, duration: 0.5, ease: "power2.out" }, 0);

    // Grid lines rise from base
    gridLines.forEach((line, i) => {
      tl.fromTo(line, { scaleY: 0, transformOrigin: "bottom" }, { scaleY: 1, duration: 0.5, ease: "power2.out" }, 0.2 + i * 0.1);
    });

    // Lasers shoot from base edges to center
    lasers.forEach((laser, i) => {
      tl.fromTo(laser, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }, 0.8 + i * 0.15);
    });

    // Object materializes
    tl.fromTo(object, { scale: 0, opacity: 0, transformOrigin: "140px 100px" }, { scale: 1, opacity: 1, duration: 1, ease: "elastic.out(1, 0.5)" }, 1.5);
    // Rotating
    tl.to(object, { rotation: 360, duration: 8, ease: "none", repeat: -1, transformOrigin: "140px 100px" }, 2.5);

    // Orbit particles
    particles.forEach((p, i) => {
      tl.fromTo(p, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, 2.0 + i * 0.15);
      // Orbit animation
      gsap.to(p, { rotation: 360, duration: 3 + i, ease: "none", repeat: -1, transformOrigin: "140px 100px" });
    });

    // Label
    if (label) {
      tl.fromTo(label, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 3.0);
    }

    return () => { tl.kill(); };
  }, [shape, duration, delay]);

  useEffect(() => { if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime % (tlRef.current.duration() || 1)); }, [stepTime]);

  return (
    <svg ref={svgRef} width={size} height={size * 0.9} viewBox="0 0 280 220" className={className} style={style}>
      {/* Base platform */}
      <ellipse id="hr-base" cx="140" cy="170" rx="70" ry="10" fill={`${color}22`} stroke={color} strokeWidth={2} />

      {/* Grid lines rising from base */}
      {[-40, -20, 0, 20, 40].map((x, i) => (
        <line key={i} className="hr-grid" x1={140 + x} y1="170" x2={140 + x} y2="40" stroke={color} strokeWidth={0.5} opacity={0.15} />
      ))}
      {[15, 30, 45, 60].map((y, i) => (
        <line key={`h${i}`} className="hr-grid" x1="100" y1={170 - y * 2.5} x2="180" y2={170 - y * 2.5} stroke={color} strokeWidth={0.5} opacity={0.1} />
      ))}

      {/* Lasers — 4 beams from base corners to center */}
      {[[70, 170], [210, 170], [140, 180]].map(([bx, by], i) => (
        <line key={i} className="hr-laser" x1={bx} y1={by} x2={140} y2={100} stroke={color} strokeWidth={1} opacity={0.3} strokeDasharray="4,4" />
      ))}

      {/* Object — simplified cube, sphere, or diamond */}
      <g id="hr-object" transform="translate(140, 100)">
        {shape === "cube" ? (
          <>
            <rect x="-30" y="-30" width="60" height="60" rx="2" fill="none" stroke={color} strokeWidth={2} />
            <rect x="-18" y="-18" width="36" height="36" rx="1" fill="none" stroke={color} strokeWidth={1} opacity={0.5} />
            <line x1="-30" y1="-30" x2="-18" y2="-18" stroke={color} strokeWidth={1} opacity={0.3} />
            <line x1="30" y1="-30" x2="18" y2="-18" stroke={color} strokeWidth={1} opacity={0.3} />
            <line x1="-30" y1="30" x2="-18" y2="18" stroke={color} strokeWidth={1} opacity={0.3} />
            <line x1="30" y1="30" x2="18" y2="18" stroke={color} strokeWidth={1} opacity={0.3} />
          </>
        ) : shape === "sphere" ? (
          <>
            <circle cx="0" cy="0" r="30" fill="none" stroke={color} strokeWidth={2} />
            <ellipse cx="0" cy="0" rx="30" ry="10" fill="none" stroke={color} strokeWidth={1} opacity={0.4} />
            <ellipse cx="0" cy="0" rx="10" ry="30" fill="none" stroke={color} strokeWidth={1} opacity={0.4} />
            <circle cx="0" cy="0" r="3" fill={color} opacity={0.8} />
          </>
        ) : (
          <polygon points="0,-35 35,0 0,35 -35,0" fill="none" stroke={color} strokeWidth={2} />
        )}
      </g>

      {/* Orbit particles */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2;
        const r = 45;
        return (
          <circle key={i} className="hr-particle"
            cx={140 + Math.cos(angle) * r} cy={100 + Math.sin(angle) * r} r={2.5}
            fill={color} opacity={0.6} />
        );
      })}

      {/* Label */}
      <text id="hr-label" x="140" y="200" textAnchor="middle" fontSize={12} fontFamily="var(--font-mono)" fill={color} opacity={0}>全息投影</text>
    </svg>
  );
}
