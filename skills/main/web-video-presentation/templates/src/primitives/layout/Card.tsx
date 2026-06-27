import type { CSSProperties, ReactNode } from "react";

interface CardProps {
  padding?: "none" | "sm" | "md" | "lg"; border?: boolean; shadow?: boolean;
  className?: string; style?: CSSProperties; children?: ReactNode;
}
const PAD_MAP: Record<string, string> = { none: "0", sm: "var(--space-3)", md: "var(--space-5)", lg: "var(--space-8)" };

export function Card({ padding = "md", border = true, shadow = true, className, style, children }: CardProps) {
  return (
    <div className={className} style={{
      padding: PAD_MAP[padding] ?? PAD_MAP.md,
      borderRadius: "var(--radius-lg)",
      border: border ? "1px solid var(--bd)" : "none",
      boxShadow: shadow ? "var(--shadow-md)" : "none",
      background: "var(--surface)",
      ...style,
    }}>
      {children}
    </div>
  );
}
