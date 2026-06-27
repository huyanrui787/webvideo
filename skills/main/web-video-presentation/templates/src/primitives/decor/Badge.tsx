import type { CSSProperties } from "react";

interface BadgeProps {
  text: string; color?: string; size?: "sm" | "md";
  className?: string; style?: CSSProperties;
}
const SIZE_MAP: Record<string, { fontSize: string; padding: string }> = {
  sm: { fontSize: "var(--text-xs, 11px)", padding: "1px 6px" },
  md: { fontSize: "var(--text-kicker, 14px)", padding: "2px 10px" },
};

export function Badge({ text, color = "var(--accent)", size = "md", className, style }: BadgeProps) {
  const sz = SIZE_MAP[size] ?? SIZE_MAP.md;
  return (
    <span className={className} style={{
      display: "inline-block",
      fontSize: sz.fontSize, padding: sz.padding,
      borderRadius: "99px",
      background: color, color: "#fff",
      fontFamily: "var(--font-mono)",
      fontWeight: 600,
      ...style,
    }}>
      {text}
    </span>
  );
}
