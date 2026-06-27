import type { CSSProperties, ReactNode } from "react";

interface GridProps {
  columns?: number; gap?: "sm" | "md" | "lg"; align?: "start" | "center" | "end" | "stretch";
  className?: string; style?: CSSProperties; children?: ReactNode;
}
const GAP_MAP = { sm: "var(--space-3)", md: "var(--space-5)", lg: "var(--space-8)" };

export function Grid({ columns = 2, gap = "md", align = "center", className, style, children }: GridProps) {
  return (
    <div className={className} style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: GAP_MAP[gap] ?? GAP_MAP.md,
      alignItems: align,
      width: "100%", height: "100%",
      ...style,
    }}>
      {children}
    </div>
  );
}
