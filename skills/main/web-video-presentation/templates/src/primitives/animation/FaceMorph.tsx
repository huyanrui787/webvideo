import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface FaceMorphProps { emotion?: "happy" | "surprised" | "thinking" | "sweat" | "angry" | "neutral"; size?: number; color?: string; stepTime?: number; delay?: number; duration?: number; className?: string; style?: CSSProperties; }

export function FaceMorph({ emotion = "happy", size = 120, color = "var(--accent)", stepTime, delay = 0, duration = 1.5, className, style }: FaceMorphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ delay });
    tlRef.current = tl;

    const mouth = svg.querySelector("#mouth") as SVGPathElement;
    const eyeL = svg.querySelector("#eye-l") as SVGEllipseElement;
    const eyeR = svg.querySelector("#eye-r") as SVGEllipseElement;
    const browL = svg.querySelector("#brow-l") as SVGLineElement;
    const browR = svg.querySelector("#brow-r") as SVGLineElement;
    const sweat = svg.querySelector("#sweat") as SVGGElement | null;
    const cheek = svg.querySelector("#cheek") as SVGEllipseElement;
    const bubble = svg.querySelector("#think-bubble") as SVGGElement | null;

    switch (emotion) {
      case "happy":
        tl.to(mouth, { attr: { d: "M 40 65 Q 60 85 80 65" }, duration }, 0);
        tl.to([eyeL, eyeR], { ry: 4, duration }, 0);
        tl.to([browL, browR], { attr: { y1: 28, y2: 28 }, duration }, 0);
        break;
      case "surprised":
        tl.to(mouth, { attr: { d: "M 40 65 Q 60 75 80 65" }, duration }, 0);
        tl.to([eyeL, eyeR], { rx: 8, ry: 10, duration }, 0);
        tl.to([browL, browR], { attr: { y1: 22, y2: 22 }, duration }, 0);
        break;
      case "thinking":
        tl.to([eyeL, eyeR], { attr: { cx: eyeL.getAttribute("cx") === "45" ? "48" : "45" } }, 0);
        tl.to(mouth, { attr: { d: "M 50 65 Q 60 62 70 65" }, duration }, 0);
        if (bubble) tl.fromTo(bubble, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out" }, 0.3);
        break;
      case "sweat":
        if (sweat) {
          tl.fromTo(sweat, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }, 0);
          tl.to(sweat, { y: 15, opacity: 0, duration: 0.8, delay: 0.4 }, 0);
        }
        tl.to(mouth, { attr: { d: "M 45 68 Q 60 62 75 68" }, duration }, 0);
        tl.to([eyeL, eyeR], { ry: 10, duration }, 0);
        break;
      case "angry":
        tl.to(mouth, { attr: { d: "M 45 70 Q 60 60 75 70" }, duration }, 0);
        tl.to([browL], { attr: { x1: 35, y1: 30, x2: 55, y2: 40 }, duration }, 0);
        tl.to([browR], { attr: { x1: 125, y1: 30, x2: 105, y2: 40 }, duration }, 0);
        tl.to(cheek, { fill: "rgba(255,0,0,0.15)", duration }, 0);
        break;
      default: // neutral
        tl.to(mouth, { attr: { d: "M 50 65 Q 60 68 70 65" }, duration }, 0);
        break;
    }
    return () => { tl.kill(); };
  }, [emotion, delay, duration]);

  useEffect(() => {
    if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime);
  }, [stepTime]);

  return (
    <svg ref={svgRef} width={size} height={size} viewBox="0 0 160 120" className={className} style={style}>
      {/* Face outline */}
      <circle cx="80" cy="60" r="50" fill="none" stroke={color} strokeWidth={2.5} />
      {/* Eyes */}
      <ellipse id="eye-l" cx="60" cy="50" rx="5" ry="6" fill={color} />
      <ellipse id="eye-r" cx="100" cy="50" rx="5" ry="6" fill={color} />
      {/* Eyebrows */}
      <line id="brow-l" x1="50" y1="38" x2="70" y2="36" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <line id="brow-r" x1="110" y1="38" x2="90" y2="36" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      {/* Mouth */}
      <path id="mouth" d="M 50 65 Q 60 68 70 65" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      {/* Cheeks */}
      <ellipse id="cheek" cx="80" cy="70" rx="25" ry="15" fill="transparent" />
      {/* Sweat drop */}
      {emotion === "sweat" && (
        <g id="sweat">
          <path d="M 120 20 Q 120 10 125 5 Q 130 10 130 20 Q 130 28 125 28 Q 120 28 120 20Z" fill="var(--accent2, #3b82f6)" stroke="none" />
        </g>
      )}
      {/* Think bubble */}
      {emotion === "thinking" && (
        <g id="think-bubble">
          <circle cx="115" cy="15" r="12" fill="none" stroke={color} strokeWidth={1.5} opacity={0.5} />
          <text x="115" y="19" textAnchor="middle" fontSize="14" fill={color} stroke="none" opacity={0.5}>...</text>
        </g>
      )}
    </svg>
  );
}
