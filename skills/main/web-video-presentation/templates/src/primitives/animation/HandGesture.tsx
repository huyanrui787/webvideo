import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface HandGestureProps { gesture?: "thumbsUp" | "counting" | "okSign" | "pointing" | "clap" | "wave"; num?: number; color?: string; size?: number; duration?: number; delay?: number; stepTime?: number; className?: string; style?: CSSProperties; }

export function HandGesture({ gesture = "thumbsUp", num = 5, color = "var(--accent)", size = 120, duration = 2, delay = 0, stepTime, className, style }: HandGestureProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ delay });
    tlRef.current = tl;

    const palm = svg.querySelector("#palm") as SVGRectElement;
    const fingers = svg.querySelectorAll(".finger");
    const thumb = svg.querySelector("#thumb") as SVGLineElement;
    const thumbTip = svg.querySelector("#thumb-tip") as SVGLineElement;

    switch (gesture) {
      case "thumbsUp": {
        // Fingers curl into palm, thumb extends up
        fingers.forEach((f) => tl.to(f, { scaleY: 0.3, duration: 0.4, transformOrigin: "50% 100%", ease: "power2.in" }, 0));
        tl.to(thumb, { rotation: -30, duration: 0.3, transformOrigin: "80px 70px" }, 0.4);
        tl.to(thumbTip, { rotation: -30, duration: 0.3, transformOrigin: "80px 50px" }, 0.5);
        break;
      }
      case "counting": {
        // Fingers extend one by one
        fingers.forEach((f, i) => {
          tl.fromTo(f, { scaleY: 0.2 }, { scaleY: 1, duration: 0.25, transformOrigin: "50% 100%", ease: "back.out(2)" }, i * (duration / num));
        });
        break;
      }
      case "pointing": {
        fingers.forEach((f, i) => {
          if (i === 0) tl.to(f, { scaleY: 1.1, rotation: -5, duration: 0.3, transformOrigin: "50% 100%" }, 0);
          else tl.to(f, { scaleY: 0.3, duration: 0.3, transformOrigin: "50% 100%", ease: "power2.in" }, 0);
        });
        break;
      }
      case "okSign": {
        fingers.forEach((f, i) => {
          if (i <= 2) tl.to(f, { scaleY: 1, rotation: 0, duration: 0.3 }, 0);
          else tl.to(f, { scaleY: 0.2, duration: 0.3, transformOrigin: "50% 100%" }, 0);
        });
        tl.to(thumb, { rotation: 10, duration: 0.2, transformOrigin: "80px 70px" }, 0.2);
        tl.to(thumbTip, { rotation: -20, duration: 0.2, transformOrigin: "80px 50px" }, 0.3);
        break;
      }
      case "clap": {
        // Two hand copies — one from left, one from right, meet in center
        const hand = svg.querySelector("#hand-group") as SVGGElement;
        tl.fromTo(hand, { x: 0 }, { x: 0, duration: 0.5 }, 0);
        tl.fromTo(hand, { scale: 1 }, { scale: 0.95, duration: 0.15, yoyo: true, repeat: 5 }, 0.3);
        break;
      }
      case "wave": {
        fingers.forEach((f, i) => {
          tl.to(f, { rotation: -15, duration: 0.2, yoyo: true, repeat: 7, transformOrigin: "50% 80%", delay: i * 0.1 }, 0);
        });
        break;
      }
    }

    return () => { tl.kill(); };
  }, [gesture, num, duration, delay]);

  useEffect(() => { if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime); }, [stepTime]);

  const fingerData = [
    { x: 68, y: 28, h: 35 }, // index
    { x: 80, y: 26, h: 38 }, // middle
    { x: 92, y: 28, h: 33 }, // ring
    { x: 104, y: 32, h: 28 }, // pinky
  ];

  return (
    <svg ref={svgRef} width={size} height={size * 0.9} viewBox="0 0 160 120" className={className} style={style}>
      <g id="hand-group">
        {/* Palm */}
        <rect id="palm" x="55" y="55" width="70" height="45" rx="10" fill={color} opacity={0.15} stroke={color} strokeWidth={2} />
        {/* Fingers */}
        {fingerData.map((f, i) => (
          <rect key={i} className="finger" x={f.x - 4} y={f.y} width="8" height={f.h} rx="4" fill={color} opacity={0.2} stroke={color} strokeWidth={1.5} />
        ))}
        {/* Thumb */}
        <line id="thumb" x1="80" y1="70" x2="55" y2="60" stroke={color} strokeWidth={6} strokeLinecap="round" />
        <line id="thumb-tip" x1="55" y1="60" x2="48" y2="55" stroke={color} strokeWidth={5} strokeLinecap="round" />
      </g>
    </svg>
  );
}
