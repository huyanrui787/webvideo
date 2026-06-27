import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface RocketLaunchProps { size?: number; color?: string; duration?: number; delay?: number; stepTime?: number; autoPlay?: boolean; className?: string; style?: CSSProperties; }

export function RocketLaunch({ size = 200, color = "var(--accent)", duration = 4, delay = 0, stepTime, autoPlay = true, className, style }: RocketLaunchProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ delay, repeat: autoPlay ? -1 : 0, repeatDelay: 1 });
    tlRef.current = tl;

    const rocket = svg.querySelector("#rocket") as SVGGElement;
    const flame = svg.querySelector("#flame") as SVGGElement;
    const countdown = svg.querySelectorAll(".count-num");
    const stars = svg.querySelectorAll(".bg-star");

    // Countdown 3→2→1
    countdown.forEach((num, i) => {
      tl.fromTo(num, { scale: 2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" }, i * 0.5);
      tl.to(num, { scale: 0.5, opacity: 0, duration: 0.3, ease: "power2.in" }, i * 0.5 + 0.4);
    });

    // Flame ignition
    tl.fromTo(flame, { scaleY: 0, opacity: 0, transformOrigin: "50% 100%" },
      { scaleY: 1, opacity: 1, duration: 0.3, ease: "power2.out" }, 1.8);

    // Liftoff!
    tl.to(rocket, { y: -120, duration: 1.5, ease: "power3.in" }, 2.0);
    tl.to(flame, { scaleX: 1.5, scaleY: 0.6, duration: 0.3, yoyo: true, repeat: 3 }, 2.0);

    // Stars scroll down (sense of speed)
    stars.forEach((star, i) => {
      tl.to(star, { y: 90, duration: 1.5, ease: "power3.in", repeat: 0 }, 2.0 + i * 0.05);
    });

    return () => { tl.kill(); };
  }, [autoPlay, delay, duration]);

  useEffect(() => { if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime % (tlRef.current.duration() || 1)); }, [stepTime]);

  return (
    <svg ref={svgRef} width={size} height={size} viewBox="0 0 200 240" className={className} style={style}>
      {/* Background stars */}
      {Array.from({ length: 20 }).map((_, i) => (
        <circle key={i} className="bg-star" cx={10 + Math.random() * 180} cy={-5 - Math.random() * 40} r={0.5 + Math.random() * 1.5} fill="var(--text-mute)" opacity={0.3 + Math.random() * 0.3} />
      ))}
      {/* Countdown */}
      <text className="count-num" x="100" y="100" textAnchor="middle" fontSize={48} fontWeight={800} fill={color}>3</text>
      <text className="count-num" x="100" y="100" textAnchor="middle" fontSize={48} fontWeight={800} fill={color}>2</text>
      <text className="count-num" x="100" y="100" textAnchor="middle" fontSize={48} fontWeight={800} fill={color}>1</text>
      {/* Rocket */}
      <g id="rocket" transform="translate(100, 170)">
        <path d="M 0 30 L -12 50 L 0 45 L 12 50 Z" fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
        <rect x="-6" y="-30" width="12" height="60" rx="4" fill={color} opacity={0.15} stroke={color} strokeWidth={2} />
        <line x1="-8" y1="-15" x2="8" y2="-15" stroke={color} strokeWidth={1.5} opacity={0.4} />
        <line x1="-5" y1="-5" x2="5" y2="-5" stroke={color} strokeWidth={1.5} opacity={0.3} />
        {/* Window */}
        <circle cx="0" cy="10" r="6" fill="var(--bg)" stroke={color} strokeWidth={1.5} />
      </g>
      {/* Flame */}
      <g id="flame" transform="translate(100, 218)" opacity={0}>
        <path d="M -8 0 Q 0 -30 8 0 Z" fill={color} opacity={0.8} />
        <path d="M -4 0 Q 0 -15 4 0 Z" fill="#fff" opacity={0.6} />
      </g>
    </svg>
  );
}
