import type { CSSProperties } from "react";
interface KickerProps { text: string; color?: string; className?: string; style?: CSSProperties; }
export function Kicker({ text, color = "var(--accent)", className, style }: KickerProps) {
  return <span className={className} style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-kicker, 14px)", color, textTransform: "uppercase", letterSpacing: "0.08em", ...style }}>{text}</span>;
}
