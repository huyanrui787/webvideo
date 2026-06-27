import type { CSSProperties, ReactNode } from "react";

interface FlexColProps {
  gap?: "sm" | "md" | "lg"; align?: "start" | "center" | "end" | "stretch";
  className?: string; style?: CSSProperties; children?: ReactNode;
}
const GAP_MAP: Record<string, string> = { sm: "var(--space-3)", md: "var(--space-5)", lg: "var(--space-8)" };
const ALIGN_MAP: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };

export function FlexCol({ gap = "md", align = "center", className, style, children }: FlexColProps) {
  return (
    <div className={className} style={{
      display: "flex", flexDirection: "column",
      gap: GAP_MAP[gap] ?? GAP_MAP.md,
      alignItems: ALIGN_MAP[align] ?? "center",
      width: "100%", height: "100%",
      ...style,
    }}>
      {children}
    </div>
  );
}
