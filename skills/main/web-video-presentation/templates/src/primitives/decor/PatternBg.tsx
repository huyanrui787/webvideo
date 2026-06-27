import type { CSSProperties } from "react";

interface PatternBgProps {
  pattern?: "dots" | "grid" | "diagonal" | "crosshatch";
  opacity?: number; color?: string;
  className?: string; style?: CSSProperties;
}

const PATTERNS: Record<string, string> = {
  dots: `radial-gradient(circle, CURRENT 1px, transparent 1px)`,
  grid: `linear-gradient(CURRENT 1px, transparent 1px), linear-gradient(90deg, CURRENT 1px, transparent 1px)`,
  diagonal: `repeating-linear-gradient(45deg, CURRENT, CURRENT 1px, transparent 1px, transparent 8px)`,
  crosshatch: `repeating-linear-gradient(45deg, CURRENT 0.5px, transparent 0.5px, transparent 8px), repeating-linear-gradient(-45deg, CURRENT 0.5px, transparent 0.5px, transparent 8px)`,
};

export function PatternBg({ pattern = "dots", opacity = 0.08, color = "var(--accent)", className, style }: PatternBgProps) {
  const bg = (PATTERNS[pattern] ?? PATTERNS.dots).replace(/CURRENT/g, color);
  return (
    <div className={className} style={{
      position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
      backgroundImage: bg,
      backgroundSize: pattern === "dots" ? "20px 20px" : pattern === "grid" ? "40px 40px" : "16px 16px",
      opacity, ...style,
    }} />
  );
}
