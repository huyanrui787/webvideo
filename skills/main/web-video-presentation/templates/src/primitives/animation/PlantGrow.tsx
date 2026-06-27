import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface PlantGrowProps { stages?: number; color?: string; size?: number; duration?: number; delay?: number; stepTime?: number; className?: string; style?: CSSProperties; }

export function PlantGrow({ stages = 4, color = "var(--accent)", size = 160, duration = 3, delay = 0, stepTime, className, style }: PlantGrowProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ delay });
    tlRef.current = tl;

    const stem = svg.querySelector("#stem") as SVGPathElement;
    const root = svg.querySelector("#root") as SVGPathElement;
    const leaves = svg.querySelectorAll(".leaf");
    const flower = svg.querySelector("#flower") as SVGGElement;

    // Root grow down
    tl.fromTo(root, { attr: { d: "M 80 120 Q 80 120 80 120" } }, { attr: { d: "M 80 120 Q 75 135 70 145 M 80 120 Q 85 135 90 145" }, duration: duration * 0.25, ease: "power2.out" }, 0);

    // Stem grow up
    tl.fromTo(stem, { attr: { d: "M 80 120 Q 80 120 80 120" } }, { attr: { d: "M 80 120 Q 75 80 80 40" }, duration: duration * 0.4, ease: "power2.out" }, duration * 0.15);

    // Leaves unfold
    leaves.forEach((leaf, i) => {
      tl.fromTo(leaf, { scale: 0, rotation: 0, transformOrigin: "50% 50%" }, { scale: 1, rotation: i % 2 === 0 ? -15 : 15, duration: 0.4, ease: "back.out(2)" }, duration * (0.35 + i * 0.12));
    });

    // Flower bloom
    if (stages >= 4) {
      tl.fromTo(flower, { scale: 0, transformOrigin: "80px 40px" }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" }, duration * 0.65);
    }

    return () => { tl.kill(); };
  }, [stages, duration, delay]);

  useEffect(() => { if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime); }, [stepTime]);

  return (
    <svg ref={svgRef} width={size} height={size * 1.1} viewBox="0 0 160 170" className={className} style={style}>
      <path id="root" d="M 80 120 Q 75 135 70 145 M 80 120 Q 85 135 90 145" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <path id="stem" d="M 80 120 Q 75 80 80 40" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <g transform="translate(80, 80)"><ellipse className="leaf" cx="0" cy="0" rx="18" ry="8" fill={color} opacity={0.7} /></g>
      <g transform="translate(80, 60)"><ellipse className="leaf" cx="20" cy="0" rx="18" ry="8" fill={color} opacity={0.6} transform="rotate(-30)" /></g>
      {stages >= 3 && <g transform="translate(80, 55)"><ellipse className="leaf" cx="-18" cy="5" rx="16" ry="7" fill={color} opacity={0.5} transform="rotate(30)" /></g>}
      {stages >= 4 && (
        <g id="flower" transform="translate(80, 40)">
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <ellipse key={angle} cx={0} cy={-8} rx={5} ry={10} fill={color} opacity={0.8} transform={`rotate(${angle})`} />
          ))}
          <circle cx={0} cy={0} r={5} fill="var(--accent2, #f59e0b)" />
        </g>
      )}
    </svg>
  );
}
