import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface PaperPlaneProps { color?: string; size?: number; message?: string; duration?: number; delay?: number; stepTime?: number; className?: string; style?: CSSProperties; }

export function PaperPlane({ color = "var(--accent)", size = 240, message = "", duration = 4.5, delay = 0, stepTime, className, style }: PaperPlaneProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ delay, repeat: -1, repeatDelay: 1.5 });
    tlRef.current = tl;

    const paper = svg.querySelector("#pp-paper") as SVGGElement;
    const plane = svg.querySelector("#pp-plane") as SVGGElement;
    const cloud1 = svg.querySelector("#pp-cloud1") as SVGGElement;
    const cloud2 = svg.querySelector("#pp-cloud2") as SVGGElement;
    const hand = svg.querySelector("#pp-hand") as SVGGElement;
    const text = svg.querySelector("#pp-text") as SVGTextElement;

    // Phase 1: Paper folds into plane
    tl.fromTo(paper, { scale: 1.3, opacity: 0.5 }, { scale: 0.1, opacity: 0, duration: 0.8, ease: "power2.in", transformOrigin: "100px 80px" }, 0);
    tl.fromTo(plane, { scale: 0, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(2)", transformOrigin: "100px 80px" }, 0.6);

    // Phase 2: Plane flies
    tl.to(plane, { x: 140, y: -60, rotation: 10, duration: 1.2, ease: "power2.out", transformOrigin: "100px 80px" }, 1.2);
    // Loop!
    tl.to(plane, { y: -80, rotation: -15, duration: 0.4, ease: "power2.inOut" }, 2.4);
    tl.to(plane, { y: -60, x: 180, rotation: 0, duration: 0.6, ease: "power2.out" }, 2.8);

    // Clouds float
    tl.to(cloud1, { x: -80, duration: 4.5, ease: "none" }, 0);
    tl.to(cloud2, { x: -60, duration: 4, ease: "none" }, 0.5);

    // Phase 3: Hand catches
    tl.fromTo(hand, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, 3.2);
    tl.to(plane, { x: 60, y: 40, rotation: -5, scale: 0.4, duration: 0.6, ease: "power2.in" }, 3.0);
    tl.to(plane, { opacity: 0, duration: 0.2 }, 3.6);

    // Phase 4: Message revealed
    if (message) {
      tl.fromTo(text, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 3.8);
    }

    return () => { tl.kill(); };
  }, [duration, delay, message]);

  useEffect(() => { if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime % (tlRef.current.duration() || 1)); }, [stepTime]);

  return (
    <svg ref={svgRef} width={size} height={size * 0.8} viewBox="0 0 280 200" className={className} style={style}>
      {/* Clouds */}
      <g id="pp-cloud1" transform="translate(200, 30)">
        <ellipse cx="30" cy="15" rx="35" ry="14" fill="var(--text-mute)" opacity={0.1} />
        <ellipse cx="50" cy="10" rx="30" ry="12" fill="var(--text-mute)" opacity={0.08} />
      </g>
      <g id="pp-cloud2" transform="translate(240, 50)">
        <ellipse cx="20" cy="10" rx="25" ry="10" fill="var(--text-mute)" opacity={0.08} />
      </g>

      {/* Paper (initial) */}
      <g id="pp-paper" transform="translate(100, 80)">
        <rect x="-20" y="-12" width="40" height="24" rx="1" fill="#fff" fillOpacity={0.9} stroke={color} strokeWidth={1.5} transform="rotate(-5)" />
        <line x1="-12" y1="-5" x2="12" y2="-5" stroke={color} strokeWidth={0.5} opacity={0.3} transform="rotate(-5)" />
        <line x1="-12" y1="0" x2="8" y2="0" stroke={color} strokeWidth={0.5} opacity={0.3} transform="rotate(-5)" />
      </g>

      {/* Paper Plane */}
      <g id="pp-plane" transform="translate(100, 80)">
        <path d="M 0 0 L -25 12 L -10 5 L 0 8 L 10 5 L 25 12 Z" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
        <line x1="0" y1="0" x2="0" y2="8" stroke={color} strokeWidth={0.8} opacity={0.4} />
      </g>

      {/* Hand */}
      <g id="pp-hand" transform="translate(160, 150)" opacity={0}>
        <rect x="-15" y="-5" width="30" height="30" rx="6" fill={color} fillOpacity={0.1} stroke={color} strokeWidth={1.5} />
        {[-10, -3, 4].map((dx) => (
          <rect key={dx} x={dx} y="-18" width="5" height="14" rx="3" fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1} />
        ))}
        <line x1="-15" y1="12" x2="-20" y2="22" stroke={color} strokeWidth={4} strokeLinecap="round" />
      </g>

      {/* Message */}
      {message && (
        <text id="pp-text" x="140" y="175" textAnchor="middle" fontSize={14} fontWeight={600} fill={color} opacity={0}>
          {message}
        </text>
      )}
    </svg>
  );
}
