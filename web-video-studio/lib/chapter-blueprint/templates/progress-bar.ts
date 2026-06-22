/**
 * progress-bar — Single progress/achievement indicator
 * Variants: bar (default), radial, milestone
 */
import { z } from "zod";
import type { TemplateDefinition, TemplateContext, TemplateOutput } from "./types";
import { escHtml, styleOverridesToProp, extraClasses, bgClass } from "./utils";

export const ProgressBarSlots = z.object({
  value: z.number().min(0).max(100).describe("Percentage value (0-100)"),
  label: z.string().describe("What is being measured"),
  sublabel: z.string().optional().describe("Additional context below value"),
  target: z.string().optional().describe("Target/goal text (e.g. '目标: 10,000')"),
  microStats: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).max(3).optional().describe("Small companion stats below the bar"),
});

function generate(ctx: TemplateContext): TemplateOutput {
  const s = ctx.slots;
  const variant = ctx.variant ?? "bar";
  const ov = ctx.overrides;
  const value = s.value ?? 0;
  const lines: string[] = [];

  lines.push(`<div className="ch-progress ch-progress--${variant}${bgClass(ov)}${extraClasses(ov)}"${styleOverridesToProp(ov)}>`);

  if (variant === "bar") {
    lines.push(`  <div className="ch-progress-header">`);
    lines.push(`    <Reveal from="up" delay={0.2} stepTime={0.7}>`);
    lines.push(`      <span className="ch-progress-label">${escHtml(s.label)}</span>`);
    lines.push(`      <span className="ch-progress-value">${value}%</span>`);
    lines.push(`    </Reveal>`);
    lines.push(`  </div>`);

    lines.push(`  <div className="ch-progress-track">`);
    lines.push(`    <Reveal from="left" delay={0.5} stepTime={1.0}>`);
    lines.push(`      <div className="ch-progress-fill" style={{ width: "${value}%" }}></div>`);
    lines.push(`    </Reveal>`);
    lines.push(`  </div>`);

    if (s.sublabel || s.target) {
      lines.push(`  <div className="ch-progress-footer">`);
      lines.push(`    <Reveal from="up" delay={0.8} stepTime={0.5}>`);
      if (s.sublabel) lines.push(`      <span className="ch-progress-sub">${escHtml(s.sublabel)}</span>`);
      if (s.target) lines.push(`      <span className="ch-progress-target">${escHtml(s.target)}</span>`);
      lines.push(`    </Reveal>`);
      lines.push(`  </div>`);
    }
  } else if (variant === "radial") {
    // Radial gauge: use CSS conic-gradient
    lines.push(`  <div className="ch-progress-radial">`);
    lines.push(`    <div className="ch-progress-ring" style={{ background: \`conic-gradient(var(--accent) \${${value} * 3.6}deg, transparent \${${value} * 3.6}deg)\` }}>`);
    lines.push(`      <div className="ch-progress-ring-inner">`);
    lines.push(`        <span className="ch-progress-value">${value}%</span>`);
    if (s.label) lines.push(`        <span className="ch-progress-label">${escHtml(s.label)}</span>`);
    lines.push(`      </div>`);
    lines.push(`    </div>`);
    lines.push(`  </div>`);
  }

  // Micro stats
  if (s.microStats && s.microStats.length > 0) {
    lines.push(`  <div className="ch-progress-micros">`);
    s.microStats.forEach((stat: any, i: number) => {
      lines.push(`    <Reveal from="up" delay={${(1.0 + i * 0.15).toFixed(2)}} stepTime={0.4}>`);
      lines.push(`    <div className="ch-progress-micro">`);
      lines.push(`      <span className="ch-progress-micro-value">${escHtml(stat.value)}</span>`);
      lines.push(`      <span className="ch-progress-micro-label">${escHtml(stat.label)}</span>`);
      lines.push(`    </div>`);
      lines.push(`    </Reveal>`);
    });
    lines.push(`  </div>`);
  }

  lines.push(`</div>`);
  return { jsx: lines.join("\n"), css: "", imports: ["Reveal"] };
}

export const progressBarTemplate: TemplateDefinition = {
  id: "progress-bar",
  description: "Progress bar, radial gauge, or milestone indicator",
  variants: ["bar", "radial", "milestone"],
  slots: ProgressBarSlots,
  generate,
  chapterCSS: `.ch-progress { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-6); padding: var(--stage-pad-y) var(--stage-pad-x); }
.ch-progress-header { display: flex; align-items: baseline; gap: var(--space-4); }
.ch-progress-label { font-size: var(--t-h2); font-weight: 600; }
.ch-progress-value { font-family: var(--font-mono); font-size: var(--t-display-1); color: var(--accent); line-height: 1; }
.ch-progress-track { width: 80%; max-width: 640px; height: 8px; background: color-mix(in srgb, var(--accent) 15%, transparent); border-radius: 4px; overflow: hidden; }
.ch-progress-fill { height: 100%; background: var(--accent); border-radius: 4px; transition: width 1s var(--motion-smooth); }
.ch-progress-footer { display: flex; gap: var(--space-5); font-size: var(--t-small); color: var(--text-2); }
.ch-progress-sub { }
.ch-progress-target { font-weight: 500; }
.ch-progress-radial { display: flex; align-items: center; justify-content: center; }
.ch-progress-ring { width: 200px; height: 200px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 8px; }
.ch-progress-ring-inner { width: 100%; height: 100%; border-radius: 50%; background: var(--bg); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-1); }
.ch-progress-micros { display: flex; gap: var(--space-8); }
.ch-progress-micro { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); }
.ch-progress-micro-value { font-family: var(--font-mono); font-size: var(--t-h3); color: var(--accent); }
.ch-progress-micro-label { font-size: var(--t-small); color: var(--text-2); }`,
};
