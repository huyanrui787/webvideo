import type { CSSProperties } from "react";
interface BigNumberProps { value: string; unit?: string; label?: string; className?: string; style?: CSSProperties; }
export function BigNumber({ value, unit = "", label = "", className, style }: BigNumberProps) {
  return <div className={className} style={{ textAlign: "center", ...style }}>
    <div style={{ fontFamily: "var(--font-display-cn)", fontSize: "var(--text-data, 120px)", fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}>{value}<span style={{ fontSize: "var(--text-sub, 28px)", fontWeight: 400 }}>{unit}</span></div>
    {label && <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-kicker, 14px)", color: "var(--text-mute)", marginTop: "var(--space-2)" }}>{label}</div>}
  </div>;
}
