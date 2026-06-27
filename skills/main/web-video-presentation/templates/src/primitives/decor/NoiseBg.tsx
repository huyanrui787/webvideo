import type { CSSProperties } from "react";

interface NoiseBgProps { opacity?: number; className?: string; style?: CSSProperties; }

export function NoiseBg({ opacity = 0.05, className, style }: NoiseBgProps) {
  return (
    <div className={className} style={{
      position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
      opacity,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat",
      ...style,
    }} />
  );
}
