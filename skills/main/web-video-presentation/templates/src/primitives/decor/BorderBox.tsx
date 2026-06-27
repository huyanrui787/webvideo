import type { CSSProperties, ReactNode } from "react";

interface BorderBoxProps {
  borderWidth?: number; borderColor?: string; padding?: "none" | "sm" | "md" | "lg";
  className?: string; style?: CSSProperties; children?: ReactNode;
}
const PAD_MAP: Record<string, string> = { none: "0", sm: "var(--space-3)", md: "var(--space-5)", lg: "var(--space-8)" };

export function BorderBox({ borderWidth = 2, borderColor = "var(--accent)", padding = "md", className, style, children }: BorderBoxProps) {
  return (
    <div className={className} style={{
      border: `${borderWidth}px solid ${borderColor}`,
      borderRadius: "var(--radius-md)",
      padding: PAD_MAP[padding] ?? PAD_MAP.md,
      ...style,
    }}>
      {children}
    </div>
  );
}
