import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface HourglassProps { value?: number; color?: string; size?: number; duration?: number; delay?: number; stepTime?: number; className?: string; style?: CSSProperties; }

export function Hourglass({ value = 50, color = "var(--accent)", size = 180, duration = 4, delay = 0, stepTime, className, style }: HourglassProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ delay, repeat: -1, repeatDelay: 1.5 });
    tlRef.current = tl;

    const upperSand = svg.querySelector("#hg-upper-sand") as SVGPathElement;
    const lowerSand = svg.querySelector("#hg-lower-sand") as SVGPathElement;
    const stream = svg.querySelector("#hg-stream") as SVGLineElement;
    const grains = svg.querySelectorAll(".hg-grain");
    const flip = svg.querySelector("#hg-flip") as SVGGElement;

    // Sand flows: upper depletes, lower fills
    const startUpper = "M 80 60 Q 100 120 180 120 L 120 120 Q 100 150 80 60 Z";
    const endUpper = "M 80 60 Q 100 80 130 100 L 120 120 Q 100 150 80 60 Z";
    tl.fromTo(upperSand, { attr: { d: startUpper } }, { attr: { d: endUpper }, duration: duration * 0.6, ease: "power2.in" }, 0);

    const startLower = "M 100 150 Q 100 130 120 120 L 130 140 Z";
    const endLower = "M 100 150 Q 120 180 200 150 L 120 120 Q 100 140 100 150 Z";
    tl.fromTo(lowerSand, { attr: { d: startLower } }, { attr: { d: endLower }, duration: duration * 0.6, ease: "power2.in" }, 0);

    // Stream line
    tl.fromTo(stream, { scaleY: 0, transformOrigin: "center" }, { scaleY: 1, duration: 0.3 }, 0.1);
    tl.to(stream, { scaleY: 0, duration: 0.3 }, duration * 0.55);

    // Individual grains falling
    grains.forEach((grain, i) => {
      tl.fromTo(grain, { y: -10, opacity: 0 }, { y: 60, opacity: 0.8, duration: 0.6, ease: "none" }, i * (duration / 8));
    });

    // Flip animation at end
    tl.to(flip, { rotation: 180, duration: 1, ease: "power2.inOut", transformOrigin: "150px 130px" }, duration * 0.7);
    // Reset sand for new cycle
    tl.set(upperSand, { attr: { d: startUpper } }, duration * 0.8);
    tl.set(lowerSand, { attr: { d: startLower } }, duration * 0.8);

    return () => { tl.kill(); };
  }, [duration, delay]);

  useEffect(() => { if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime % (tlRef.current.duration() || 1)); }, [stepTime]);

  return (
    <svg ref={svgRef} width={size} height={size * 1.1} viewBox="0 0 300 260" className={className} style={style}>
      <g id="hg-flip" transform-origin="150 130">
        {/* Glass */}
        <path d="M 80 60 Q 100 120 180 120 L 120 120 Q 100 150 80 200 L 220 200 Q 200 150 180 130 L 240 120 Q 200 60 80 60 Z" fill="none" stroke="var(--text-mute)" strokeWidth={2.5} strokeLinejoin="round" />
        {/* Frame */}
        <line x1="70" y1="55" x2="230" y2="55" stroke={color} strokeWidth={3} />
        <line x1="70" y1="205" x2="230" y2="205" stroke={color} strokeWidth={3} />
        <line x1="150" y1="55" x2="150" y2="45" stroke={color} strokeWidth={2} />
        <line x1="150" y1="205" x2="150" y2="215" stroke={color} strokeWidth={2} />
        {/* Sand */}
        <path id="hg-upper-sand" d="M 80 60 Q 100 120 180 120 L 120 120 Q 100 150 80 60 Z" fill={color} opacity={0.6} />
        <path id="hg-lower-sand" d="M 100 150 Q 100 130 120 120 L 130 140 Z" fill={color} opacity={0.6} />
        {/* Stream */}
        <line id="hg-stream" x1="150" y1="120" x2="150" y2="140" stroke={color} strokeWidth={2} opacity={0.8} />
        {/* Grains */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <circle key={i} className="hg-grain" cx={150 + (i % 3 - 1) * 2} cy={125} r={1.5} fill={color} />
        ))}
      </g>
    </svg>
  );
}
