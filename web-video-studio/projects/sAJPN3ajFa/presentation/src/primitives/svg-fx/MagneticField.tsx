import type { CSSProperties } from "react";
import { useSeekableCanvas } from "../canvas/useSeekableCanvas";

interface MagneticFieldProps {
  /** Number of field lines per pole. Default: 12 */
  lineCount?: number;
  /** Show animated particles along field lines. Default: true */
  showParticles?: boolean;
  color?: string;
  accentColor?: string;
  stepTime?: number;
  style?: CSSProperties;
  className?: string;
}

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Animated magnetic dipole field visualization.
 *
 * Usage:
 *   <MagneticField lineCount={16} stepTime={stepTime} />
 */
export function MagneticField({
  lineCount = 12,
  showParticles = true,
  color = "rgba(100,200,255,0.5)",
  accentColor = "#f59e0b",
  stepTime,
  style,
  className,
}: MagneticFieldProps) {
  const ref = useSeekableCanvas(
    (ctx, t, w, h) => {
      const cx = w / 2, cy = h / 2;
      const poleGap = w * 0.18;
      const posX = cx + poleGap, negX = cx - poleGap;
      const poleR = h * 0.04;

      const progress = Math.min(1, t * 0.7);

      // Draw field lines using dipole approximation
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = color;

      for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const startAngle = angle;

        ctx.beginPath();
        // Trace field line from positive pole
        let x = posX + Math.cos(startAngle) * poleR * 1.5;
        let y = cy + Math.sin(startAngle) * poleR * 1.5;
        ctx.moveTo(x, y);

        const steps = 80;
        const maxSteps = Math.floor(steps * progress);
        for (let s = 0; s < maxSteps; s++) {
          // Dipole field: B ∝ (3(m·r̂)r̂ - m) / r³
          const dxP = x - posX, dyP = y - cy;
          const dxN = x - negX, dyN = y - cy;
          const rP = Math.sqrt(dxP * dxP + dyP * dyP) + 1;
          const rN = Math.sqrt(dxN * dxN + dyN * dyN) + 1;

          // Field from positive pole
          const bPx = dxP / (rP * rP * rP);
          const bPy = dyP / (rP * rP * rP);
          // Field from negative pole (opposite)
          const bNx = -dxN / (rN * rN * rN);
          const bNy = -dyN / (rN * rN * rN);

          const bx = bPx + bNx, by = bPy + bNy;
          const bLen = Math.sqrt(bx * bx + by * by) + 1e-10;
          const step = Math.min(w * 0.012, 1000 / rP);

          x += (bx / bLen) * step;
          y += (by / bLen) * step;

          ctx.globalAlpha = 0.6 - s / steps * 0.4;
          ctx.lineTo(x, y);

          // Stop near negative pole
          if (Math.sqrt((x - negX) ** 2 + (y - cy) ** 2) < poleR * 2) break;
          // Stop if out of bounds
          if (x < 0 || x > w || y < 0 || y > h) break;
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Particles flowing along field
      if (showParticles && progress > 0.3) {
        const pCount = 40;
        for (let i = 0; i < pCount; i++) {
          const phase = hash(i * 17) + t * (0.3 + hash(i) * 0.4);
          const lineIdx = Math.floor(hash(i * 7) * lineCount);
          const angle = (lineIdx / lineCount) * Math.PI * 2;

          // Approximate position along field line
          let px = posX + Math.cos(angle) * poleR * 1.5;
          let py = cy + Math.sin(angle) * poleR * 1.5;
          const frac = (phase % 1);
          const traceSteps = Math.floor(frac * 60);
          for (let s = 0; s < traceSteps; s++) {
            const dxP = px - posX, dyP = py - cy;
            const dxN = px - negX, dyN = py - cy;
            const rP = Math.sqrt(dxP*dxP + dyP*dyP) + 1;
            const rN = Math.sqrt(dxN*dxN + dyN*dyN) + 1;
            const bx = dxP/(rP**3) - dxN/(rN**3);
            const by = dyP/(rP**3) - dyN/(rN**3);
            const bl = Math.sqrt(bx*bx + by*by) + 1e-10;
            const step = Math.min(w * 0.012, 800 / rP);
            px += (bx/bl) * step; py += (by/bl) * step;
            if (px < 0 || px > w || py < 0 || py > h) break;
            if (Math.sqrt((px-negX)**2 + (py-cy)**2) < poleR*2) break;
          }

          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = accentColor;
          ctx.globalAlpha = 0.7;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Poles
      [[posX, "N", "#ef4444"], [negX, "S", "#3b82f6"]].forEach(([px, label, c]) => {
        const grd = ctx.createRadialGradient(px as number, cy, 0, px as number, cy, poleR * 2);
        grd.addColorStop(0, c as string);
        grd.addColorStop(1, (c as string) + "44");
        ctx.beginPath();
        ctx.arc(px as number, cy, poleR, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = "#fff";
        ctx.font = `bold ${h * 0.04}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label as string, px as number, cy);
      });
    },
    { stepTime },
  );

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", ...style }}
    />
  );
}
