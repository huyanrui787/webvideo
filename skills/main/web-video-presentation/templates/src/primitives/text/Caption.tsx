import type { CSSProperties } from "react";
interface CaptionProps { text: string; className?: string; style?: CSSProperties; }
export function Caption({ text, className, style }: CaptionProps) {
  return <figcaption className={className} style={{ fontSize: "var(--text-kicker, 14px)", color: "var(--text-mute)", ...style }}>{text}</figcaption>;
}
