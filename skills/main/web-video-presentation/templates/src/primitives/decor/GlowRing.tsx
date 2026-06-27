import { useEffect, useRef, type CSSProperties } from "react";
import { gsap } from "gsap";

interface GlowRingProps {
  color?: string; size?: number; pulseSpeed?: number;
  className?: string; style?: CSSProperties; stepTime?: number;
}

export function GlowRing({ color = "var(--accent)", size = 200, pulseSpeed = 2, className, style, stepTime }: GlowRingProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.to(ref.current, {
      boxShadow: `0 0 ${size * 0.3}px ${color}, 0 0 ${size * 0.6}px ${color}`,
      scale: 1.05,
      duration: 1 / pulseSpeed,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  }, [color, size, pulseSpeed]);

  return (
    <div ref={ref} className={className} style={{
      position: "absolute",
      width: size, height: size,
      borderRadius: "50%",
      background: "transparent",
      border: `2px solid ${color}`,
      boxShadow: `0 0 ${size * 0.2}px ${color}`,
      opacity: 0.6,
      ...style,
    }} />
  );
}
