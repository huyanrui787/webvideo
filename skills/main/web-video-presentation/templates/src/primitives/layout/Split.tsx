import type { CSSProperties, ReactNode } from "react";

interface SplitProps {
  ratio?: string; divider?: "none" | "vs" | "arrow" | "line";
  leftLabel?: string; rightLabel?: string;
  className?: string; style?: CSSProperties; children?: ReactNode;
}

export function Split({ ratio = "1fr 1fr", divider = "line", leftLabel, rightLabel, className, style, children }: SplitProps) {
  const childArray = Array.isArray(children) ? children : [children].filter(Boolean);
  const left = childArray[0];
  const right = childArray[1];

  return (
    <div className={className} style={{ display: "flex", flexDirection: "row", width: "100%", height: "100%", alignItems: "stretch", ...style }}>
      {left && (
        <div style={{ flex: ratio.split(" ")[0], display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--space-6)" }}>
          {leftLabel && <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-kicker, 14px)", color: "var(--accent)", marginBottom: "var(--space-2)" }}>{leftLabel}</span>}
          {left}
        </div>
      )}
      {divider !== "none" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 var(--space-3)" }}>
          {divider === "line" && <div style={{ width: 2, height: "60%", background: "var(--accent)", opacity: 0.3, borderRadius: 1 }} />}
          {divider === "vs" && <span style={{ fontFamily: "var(--font-display-cn)", fontSize: "var(--text-sub, 28px)", fontWeight: 700, color: "var(--accent)" }}>VS</span>}
          {divider === "arrow" && <span style={{ fontSize: "var(--text-sub, 28px)", color: "var(--accent)" }}>→</span>}
        </div>
      )}
      {right && (
        <div style={{ flex: ratio.split(" ")[1] ?? "1fr", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--space-6)" }}>
          {rightLabel && <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-kicker, 14px)", color: "var(--accent)", marginBottom: "var(--space-2)" }}>{rightLabel}</span>}
          {right}
        </div>
      )}
    </div>
  );
}
