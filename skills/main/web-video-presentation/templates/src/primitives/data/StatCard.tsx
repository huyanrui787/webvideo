import type { CSSProperties } from "react";
interface StatCardProps { value: string; label: string; trend?: "up" | "down" | "neutral"; className?: string; style?: CSSProperties; }
const TREND_ICON: Record<string, string> = { up: "↑", down: "↓", neutral: "→" };
const TREND_COLOR: Record<string, string> = { up: "var(--accent)", down: "#ef4444", neutral: "var(--text-mute)" };
export function StatCard({ value, label, trend, className, style }: StatCardProps) {
  return <div className={className} style={{ textAlign: "center", ...style }}>
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
      <span style={{ fontFamily: "var(--font-display-cn)", fontSize: "var(--text-data, 120px)", fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}>{value}</span>
      {trend && <span style={{ fontSize: "var(--text-sub, 28px)", color: TREND_COLOR[trend] ?? "var(--text-mute)" }}>{TREND_ICON[trend] ?? ""}</span>}
    </div>
    <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-kicker, 14px)", color: "var(--text-mute)", marginTop: "var(--space-2)" }}>{label}</div>
  </div>;
}
