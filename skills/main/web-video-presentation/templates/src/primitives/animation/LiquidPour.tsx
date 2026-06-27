import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface LiquidPourProps { value?: number; max?: number; label?: string; unit?: string; color?: string; duration?: number; delay?: number; stepTime?: number; className?: string; style?: CSSProperties; }

export function LiquidPour({ value = 65, max = 100, label = "", unit = "%", color = "var(--accent)", duration = 2, delay = 0, stepTime, className, style }: LiquidPourProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const pct = Math.min(Math.max(value / max, 0), 1);
  const targetY = 170 - pct * 120;

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ delay });
    tlRef.current = tl;

    const liquid = svg.querySelector("#liquid") as SVGPathElement;
    const fillLevel = svg.querySelector("#fill-level") as SVGTextElement;

    // Animate liquid fill
    const startD = `M 40 170 Q 80 172 140 170 L 140 190 L 40 190 Z`;
    const endD = `M 40 ${targetY} Q 80 ${targetY + 3} 140 ${targetY} L 140 190 L 40 190 Z`;
    tl.to(liquid, { attr: { d: endD }, duration, ease: "power2.inOut" }, 0);

    // Wave effect during fill
    const waveTargets = [
      `M 40 ${targetY} Q 80 ${targetY - 4} 140 ${targetY} L 140 190 L 40 190 Z`,
      `M 40 ${targetY} Q 80 ${targetY + 4} 140 ${targetY} L 140 190 L 40 190 Z`,
    ];
    tl.to(liquid, { attr: { d: waveTargets[0] }, duration: 0.3, yoyo: true, repeat: 5, ease: "sine.inOut" }, duration * 0.9);

    // Counter
    if (fillLevel) {
      const counterObj = { v: 0 };
      tl.to(counterObj, { v: value, duration, ease: "power2.out", onUpdate: () => { fillLevel.textContent = Math.round(counterObj.v).toString(); } }, 0);
    }

    return () => { tl.kill(); };
  }, [value, max, targetY, duration, delay]);

  useEffect(() => { if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime); }, [stepTime]);

  return (
    <div style={{ textAlign: "center", ...style }} className={className}>
      <svg ref={svgRef} width="180" height="210" viewBox="0 0 180 210">
        {/* Container */}
        <path d="M 40 50 L 40 190 L 140 190 L 140 50" fill="none" stroke="var(--text-mute)" strokeWidth={2.5} strokeLinejoin="round" />
        {/* Liquid */}
        <path id="liquid" d={`M 40 170 Q 80 172 140 170 L 140 190 L 40 190 Z`} fill={color} opacity={0.6} />
        {/* Tick marks */}
        {[0, 25, 50, 75].map((v) => {
          const y = 170 - (v / 100) * 120;
          return <line key={v} x1={140} y1={y} x2={148} y2={y} stroke="var(--text-mute)" strokeWidth={1} />;
        })}
        {/* Value text */}
        <text id="fill-level" x="90" y="160" textAnchor="middle" fontSize={28} fontWeight={700} fill="var(--text)" stroke="none">0</text>
        <text x="90" y="178" textAnchor="middle" fontSize={13} fill="var(--text-mute)" stroke="none">{unit}</text>
      </svg>
      {label && <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-mute)", marginTop: 4 }}>{label}</div>}
    </div>
  );
}
