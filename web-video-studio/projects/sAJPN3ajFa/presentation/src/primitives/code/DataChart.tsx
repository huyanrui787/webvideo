import type { CSSProperties } from "react";

interface DataChartProps {
  type: "bar" | "line" | "pie";
  data: Record<string, any>;
  stepTime?: number;
  className?: string;
  style?: CSSProperties;
}

/** Placeholder chart component — renders a styled summary. */
export function DataChart({
  type = "bar",
  data = {},
  stepTime: _stepTime,
  className,
  style,
}: DataChartProps) {
  const keys = Object.keys(data ?? {});
  const values = Object.values(data ?? {});
  const maxVal = Math.max(...(values as number[]).map(Number), 1);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        padding: "var(--space-4)",
        borderRadius: "var(--radius-md, 8px)",
        background: "var(--surface-2, rgba(255,255,255,0.06))",
        ...style,
      }}
    >
      {type === "pie" ? (
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {keys.map((k, i) => (
            <span key={i} style={{ fontSize: "var(--text-sm)", color: "var(--text-mute)" }}>
              {k}: {String(values[i])}
            </span>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          {keys.map((k, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <span style={{ width: 80, fontSize: "var(--text-xs)", color: "var(--text-mute)", textAlign: "right" }}>
                {k}
              </span>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--surface-3)" }}>
                <div style={{
                  width: `${(Number(values[i]) / maxVal) * 100}%`,
                  height: "100%",
                  borderRadius: 4,
                  background: "var(--accent)",
                  transition: "width 0.6s ease",
                }} />
              </div>
              <span style={{ fontSize: "var(--text-xs)", width: 40 }}>{String(values[i])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
