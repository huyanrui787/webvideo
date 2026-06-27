import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface BarProps { data: { label: string; value: number; color?: string }[]; showLabels?: boolean; duration?: number; delay?: number; stepTime?: number; className?: string; style?: CSSProperties; }

export function BarRace({ data, showLabels = true, duration = 2, delay = 0, stepTime, className, style }: BarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const el = ref.current; if (!el || data.length === 0) return;
    const maxVal = Math.max(...data.map((d) => d.value));
    const tl = gsap.timeline({ delay });
    tlRef.current = tl;

    const bars = el.querySelectorAll(".bar-race-bar");
    const labels = el.querySelectorAll(".bar-race-label");
    const values = el.querySelectorAll(".bar-race-value");

    bars.forEach((bar, i) => {
      const pct = (data[i].value / maxVal) * 100;
      tl.fromTo(bar, { width: "0%" }, { width: `${pct}%`, duration, ease: "expo.out" }, i * 0.08);
      if (labels[i]) tl.fromTo(labels[i], { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.4 }, i * 0.08);
      if (values[i]) tl.fromTo(values[i], { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, duration * 0.7 + i * 0.05);
    });

    return () => { tl.kill(); };
  }, [data, duration, delay]);

  useEffect(() => {
    if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime);
  }, [stepTime]);

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div ref={ref} className={className} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, ...style }}>
      {data.map((d, i) => (
        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {showLabels && <span className="bar-race-label" style={{ width: 72, fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-mute)", textAlign: "right", flexShrink: 0 }}>{d.label}</span>}
          <div style={{ flex: 1, height: 24, background: "var(--surface)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
            <div className="bar-race-bar" style={{ height: "100%", borderRadius: 4, background: d.color ?? (i === 0 ? "var(--accent)" : `hsl(${210 + i * 40}, 70%, 55%)`), width: "0%" }} />
          </div>
          <span className="bar-race-value" style={{ width: 48, fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text)", flexShrink: 0 }}>{d.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
