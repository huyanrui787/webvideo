import { type CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface GaugeProps {
  /** Current value (0–max). Default: 0 */
  value?: number;
  /** Maximum value. Default: 100 */
  max?: number;
  /** Label shown inside the gauge. Default: "" */
  label?: string;
  /** Unit string, e.g. "rpm", "mA". Default: "" */
  unit?: string;
  /** Arc color. Default: "var(--accent)" */
  color?: string;
  /** Track color. Default: "rgba(255,255,255,0.1)" */
  trackColor?: string;
  /** Start angle in degrees (0 = right). Default: 135 (bottom-left) */
  startAngle?: number;
  /** Sweep angle in degrees. Default: 270 */
  sweepAngle?: number;
  /** Animation duration in seconds. Default: 1.2 */
  duration?: number;
  delay?: number;
  stepTime?: number;
  className?: string;
  style?: CSSProperties;
  size?: number;
}

/**
 * SVG arc gauge / dial.
 *
 * Usage:
 *   <Gauge value={75} max={100} unit="%" label="CPU" stepTime={stepTime} />
 *   <Gauge value={3.6} max={10} unit="mA" label="电流" color="var(--accent)" />
 */
export function Gauge({
  value = 0,
  max = 100,
  label = "",
  unit = "",
  color = "var(--accent)",
  trackColor = "rgba(255,255,255,0.12)",
  startAngle = 135,
  sweepAngle = 270,
  duration = 1.2,
  delay = 0,
  stepTime,
  className,
  style,
  size = 220,
}: GaugeProps) {
  const arcRef = useRef<SVGPathElement>(null);
  const needleRef = useRef<SVGLineElement>(null);
  const valueRef = useRef<SVGTextElement>(null);

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const strokeW = size * 0.065;

  function angleToRad(deg: number) { return (deg * Math.PI) / 180; }

  function describeArc(fraction: number) {
    const start = angleToRad(startAngle);
    const end = angleToRad(startAngle + sweepAngle * fraction);
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = sweepAngle * fraction > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  const trackPath = describeArc(1);
  const fraction = Math.min(1, Math.max(0, value / max));

  useEffect(() => {
    const arc = arcRef.current;
    const needle = needleRef.current;
    const valText = valueRef.current;
    if (!arc || !needle || !valText) return;

    if (stepTime !== undefined) {
      const elapsed = Math.max(0, stepTime - delay);
      const p = elapsed >= duration ? 1 : elapsed / duration;
      const eased = 1 - Math.pow(1 - p, 2);
      const f = fraction * eased;
      arc.setAttribute("d", describeArc(f));
      const na = startAngle + sweepAngle * f;
      needle.setAttribute("transform", `rotate(${na}, ${cx}, ${cy})`);
      valText.textContent = (value * eased).toFixed(value < 10 ? 1 : 0);
      return;
    }

    const proxy = { f: 0, v: 0 };
    arc.setAttribute("d", describeArc(0));
    needle.setAttribute("transform", `rotate(${startAngle}, ${cx}, ${cy})`);
    valText.textContent = "0";

    gsap.to(proxy, {
      f: fraction,
      v: value,
      duration,
      delay,
      ease: "power2.out",
      onUpdate: () => {
        arc.setAttribute("d", describeArc(proxy.f));
        const na = startAngle + sweepAngle * proxy.f;
        needle.setAttribute("transform", `rotate(${na}, ${cx}, ${cy})`);
        valText.textContent = proxy.v.toFixed(value < 10 ? 1 : 0);
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepTime, value]);

  const needleLen = r * 0.82;
  const needleBase = angleToRad(startAngle);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={style}
    >
      {/* Track */}
      <path d={trackPath} fill="none" stroke={trackColor} strokeWidth={strokeW} strokeLinecap="round" />
      {/* Value arc */}
      <path ref={arcRef} d={describeArc(0)} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
      {/* Needle */}
      <line
        ref={needleRef}
        x1={cx}
        y1={cy}
        x2={cx + Math.cos(needleBase) * needleLen}
        y2={cy + Math.sin(needleBase) * needleLen}
        stroke={color}
        strokeWidth={strokeW * 0.25}
        strokeLinecap="round"
        transform={`rotate(${startAngle}, ${cx}, ${cy})`}
      />
      <circle cx={cx} cy={cy} r={strokeW * 0.5} fill={color} />
      {/* Value text */}
      <text
        ref={valueRef}
        x={cx}
        y={cy + size * 0.08}
        textAnchor="middle"
        fill="currentColor"
        fontSize={size * 0.16}
        fontWeight="700"
        fontFamily="var(--font-mono, monospace)"
      >
        0
      </text>
      {unit && (
        <text x={cx} y={cy + size * 0.22} textAnchor="middle" fill={color} fontSize={size * 0.09} fontFamily="var(--font-mono, monospace)">
          {unit}
        </text>
      )}
      {label && (
        <text x={cx} y={cy + size * 0.42} textAnchor="middle" fill="currentColor" fontSize={size * 0.09} opacity={0.6}>
          {label}
        </text>
      )}
    </svg>
  );
}
