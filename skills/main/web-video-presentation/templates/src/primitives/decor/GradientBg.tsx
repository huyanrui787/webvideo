import type { CSSProperties } from "react";

interface GradientBgProps {
  from?: string; to?: string; direction?: "to-b" | "to-r" | "to-br" | "to-t";
  opacity?: number; className?: string; style?: CSSProperties;
}
const DIR_MAP: Record<string, string> = { "to-b": "to bottom", "to-r": "to right", "to-br": "to bottom right", "to-t": "to top" };

export function GradientBg({ from = "var(--accent)", to = "transparent", direction = "to-b", opacity = 0.15, className, style }: GradientBgProps) {
  return (
    <div className={className} style={{
      position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
      background: `linear-gradient(${DIR_MAP[direction] ?? "to bottom"}, ${from}, ${to})`,
      opacity, ...style,
    }} />
  );
}
