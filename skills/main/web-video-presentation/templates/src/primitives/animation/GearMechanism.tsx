import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface GearMechanismProps { gears?: number; color?: string; size?: number; speed?: number; stepTime?: number; className?: string; style?: CSSProperties; }

function gearPath(teeth: number, outerR: number, innerR: number): string {
  const parts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a1 = (i / teeth) * Math.PI * 2;
    const a2 = ((i + 0.5) / teeth) * Math.PI * 2;
    const a3 = ((i + 1) / teeth) * Math.PI * 2;
    parts.push(`M ${Math.cos(a1) * innerR} ${Math.sin(a1) * innerR}`);
    parts.push(`L ${Math.cos(a1) * outerR} ${Math.sin(a1) * outerR}`);
    parts.push(`L ${Math.cos(a2) * outerR} ${Math.sin(a2) * outerR}`);
    parts.push(`L ${Math.cos(a2) * innerR} ${Math.sin(a2) * innerR}`);
    parts.push(`L ${Math.cos(a3) * innerR} ${Math.sin(a3) * innerR}`);
  }
  return parts.join(" ");
}

export function GearMechanism({ gears = 2, color = "var(--accent)", size = 160, speed = 1, stepTime, className, style }: GearMechanismProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ repeat: -1 });
    tlRef.current = tl;

    const gear1 = svg.querySelector("#gear-1") as SVGGElement;
    const gear2 = svg.querySelector("#gear-2") as SVGGElement;

    // Gear 1: 10 teeth → 360°/10s = 36°/s
    tl.to(gear1, { rotation: 360, duration: 10 / speed, ease: "none", transformOrigin: "60px 70px" }, 0);
    // Gear 2: 6 teeth → counter-rotate at 10/6 speed
    tl.to(gear2, { rotation: -360, duration: 6 / speed, ease: "none", transformOrigin: "115px 55px" }, 0);

    return () => { tl.kill(); };
  }, [speed]);

  useEffect(() => { if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime % (tlRef.current.duration() || 1)); }, [stepTime]);

  return (
    <svg ref={svgRef} width={size} height={size * 0.7} viewBox="0 0 180 120" className={className} style={style}>
      <g id="gear-1">
        <path d={gearPath(10, 30, 22)} fill="none" stroke={color} strokeWidth={2} transform="translate(60, 70)" />
        <circle cx="60" cy="70" r="10" fill="none" stroke={color} strokeWidth={1.5} />
        <circle cx="60" cy="70" r="3" fill={color} />
      </g>
      {gears >= 2 && (
        <g id="gear-2">
          <path d={gearPath(6, 22, 16)} fill="none" stroke={color} strokeWidth={2} transform="translate(115, 55)" />
          <circle cx="115" cy="55" r="8" fill="none" stroke={color} strokeWidth={1.5} />
          <circle cx="115" cy="55" r="2.5" fill={color} />
        </g>
      )}
      {gears >= 3 && (
        <g id="gear-3">
          <path d={gearPath(8, 18, 12)} fill="none" stroke={color} strokeWidth={2} transform="translate(130, 85)" />
          <circle cx="130" cy="85" r="6" fill="none" stroke={color} strokeWidth={1.5} />
          <circle cx="130" cy="85" r="2" fill={color} />
        </g>
      )}
    </svg>
  );
}
