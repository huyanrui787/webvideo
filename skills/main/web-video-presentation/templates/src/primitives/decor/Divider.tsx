import type { CSSProperties } from "react";

interface DividerProps {
  direction?: "horizontal" | "vertical"; style?: "solid" | "dashed" | "gradient";
  color?: string; className?: string; styleProp?: CSSProperties;
}

export function Divider({ direction = "horizontal", style: lineStyle = "solid", color = "var(--accent)", className, styleProp }: DividerProps) {
  const isH = direction === "horizontal";
  const borderStyle = lineStyle === "dashed" ? "dashed" : "solid";
  const bg = lineStyle === "gradient"
    ? `linear-gradient(${isH ? "90deg" : "180deg"}, transparent, ${color}, transparent)`
    : undefined;

  return (
    <div className={className} style={{
      width: isH ? "100%" : 2,
      height: isH ? 2 : "100%",
      minHeight: isH ? undefined : 40,
      background: bg ?? (lineStyle === "dashed" ? "transparent" : color),
      border: lineStyle === "dashed" && !bg ? `${isH ? "1px 0 0 0" : "0 0 0 1px"} ${borderStyle} ${color}` : undefined,
      opacity: bg ? 1 : 0.3,
      ...styleProp,
    }} />
  );
}
