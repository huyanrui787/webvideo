import type { CSSProperties } from "react";

interface HeadlineProps {
  text: string;
  scale?: "hero" | "data" | "quote" | "sub" | "body" | "kicker";
  className?: string;
  style?: CSSProperties;
}
const SCALE_MAP: Record<string, string> = {
  hero: "var(--text-hero, 88px)", data: "var(--text-data, 120px)",
  quote: "var(--text-quote, 48px)", sub: "var(--text-sub, 28px)",
  body: "var(--text-step, 20px)", kicker: "var(--text-kicker, 14px)",
};
export function Headline({ text, scale = "hero", className, style }: HeadlineProps) {
  return <h1 className={className} style={{ fontSize: SCALE_MAP[scale] ?? SCALE_MAP.hero, fontWeight: 700, lineHeight: 1.2, ...style }}>{text}</h1>;
}
