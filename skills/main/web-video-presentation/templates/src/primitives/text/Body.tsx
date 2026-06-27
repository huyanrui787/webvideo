import type { CSSProperties } from "react";
interface BodyProps { text: string; align?: "left" | "center" | "right"; className?: string; style?: CSSProperties; }
export function Body({ text, align = "left", className, style }: BodyProps) {
  return <p className={className} style={{ textAlign: align, fontSize: "var(--text-step, 20px)", lineHeight: 1.6, color: "var(--text-mute)", maxWidth: "56ch", ...style }}>{text}</p>;
}
