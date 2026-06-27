import type { CSSProperties } from "react";
interface PullQuoteProps { text: string; attribution?: string; context?: string; className?: string; style?: CSSProperties; }
export function PullQuote({ text, attribution, context, className, style }: PullQuoteProps) {
  return <blockquote className={className} style={{ textAlign: "center", maxWidth: "28ch", ...style }}>
    <span style={{ fontFamily: "Georgia, serif", fontSize: "120px", lineHeight: 0.5, color: "var(--accent)", opacity: 0.2, userSelect: "none", display: "block" }}>"</span>
    <p style={{ fontFamily: "var(--font-display-cn)", fontSize: "var(--text-quote, 48px)", fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{text}</p>
    {attribution && <cite style={{ display: "block", marginTop: "var(--space-4)", fontSize: "var(--text-step-heading, 28px)", fontStyle: "normal" }}>— {attribution}</cite>}
    {context && <p style={{ fontSize: "var(--text-kicker, 14px)", color: "var(--text-mute)", marginTop: "var(--space-2)" }}>{context}</p>}
  </blockquote>;
}
