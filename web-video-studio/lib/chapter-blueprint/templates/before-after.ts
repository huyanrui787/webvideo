/**
 * before-after — Side-by-side before/after visual comparison
 * Variants: horizontal (default), vertical (for tall images)
 */
import { z } from "zod";
import type { TemplateDefinition, TemplateContext, TemplateOutput } from "./types";
import { MediaRef } from "../types";
import { escHtml, styleOverridesToProp, extraClasses, bgClass, mediaToJsx } from "./utils";

export const BeforeAfterSlots = z.object({
  before: z.object({
    media: MediaRef.describe("Before-state image/video"),
    label: z.string().default("Before").describe("Label badge text"),
    caption: z.string().optional().describe("Short description underneath"),
  }),
  after: z.object({
    media: MediaRef.describe("After-state image/video"),
    label: z.string().default("After").describe("Label badge text"),
    caption: z.string().optional(),
  }),
  metric: z.object({
    value: z.string(),
    label: z.string(),
  }).optional().describe("Improvement metric to display between the two states"),
});

function generate(ctx: TemplateContext): TemplateOutput {
  const s = ctx.slots;
  const variant = ctx.variant ?? "horizontal";
  const ov = ctx.overrides;
  const before: any = s.before;
  const after: any = s.after;
  const metric = s.metric;
  const lines: string[] = [];

  lines.push(`<div className="ch-before-after ch-before-after--${variant}${bgClass(ov)}${extraClasses(ov)}"${styleOverridesToProp(ov)}>`);

  // Before panel
  lines.push(`  <div className="ch-before-after-panel">`);
  lines.push(`    <Reveal from="left" delay={0.2} stepTime={0.8}>`);
  lines.push(`      <span className="ch-before-after-badge ch-before-after-badge--before">${escHtml(before.label)}</span>`);
  lines.push(`      <div className="ch-before-after-media">${mediaToJsx(before.media, "        ")}</div>`);
  if (before.caption) lines.push(`      <p className="ch-before-after-caption">${escHtml(before.caption)}</p>`);
  lines.push(`    </Reveal>`);
  lines.push(`  </div>`);

  // Arrow / metric in middle
  lines.push(`  <div className="ch-before-after-divider">`);
  if (metric) {
    lines.push(`    <Reveal from="up" delay={0.6} stepTime={0.6}>`);
    lines.push(`      <div className="ch-before-after-metric">`);
    lines.push(`        <span className="ch-before-after-metric-value">${escHtml(metric.value)}</span>`);
    lines.push(`        <span className="ch-before-after-metric-label">${escHtml(metric.label)}</span>`);
    lines.push(`      </div>`);
    lines.push(`    </Reveal>`);
  } else {
    lines.push(`    <div className="ch-before-after-arrow">→</div>`);
  }
  lines.push(`  </div>`);

  // After panel
  lines.push(`  <div className="ch-before-after-panel">`);
  lines.push(`    <Reveal from="right" delay={0.4} stepTime={0.8}>`);
  lines.push(`      <span className="ch-before-after-badge ch-before-after-badge--after">${escHtml(after.label)}</span>`);
  lines.push(`      <div className="ch-before-after-media">${mediaToJsx(after.media, "        ")}</div>`);
  if (after.caption) lines.push(`      <p className="ch-before-after-caption">${escHtml(after.caption)}</p>`);
  lines.push(`    </Reveal>`);
  lines.push(`  </div>`);

  lines.push(`</div>`);
  return { jsx: lines.join("\n"), css: "", imports: ["Reveal"] };
}

export const beforeAfterTemplate: TemplateDefinition = {
  id: "before-after",
  description: "Before/after visual comparison with metric highlight",
  variants: ["horizontal", "vertical"],
  slots: BeforeAfterSlots,
  generate,
  chapterCSS: `.ch-before-after { flex: 1; display: flex; align-items: center; justify-content: center; gap: var(--space-6); padding: var(--stage-pad-y) var(--stage-pad-x); }
.ch-before-after--vertical { flex-direction: column; gap: var(--space-4); }
.ch-before-after-panel { flex: 1; display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }
.ch-before-after-badge { display: inline-block; padding: 2px var(--space-3); border-radius: 4px; font-size: var(--t-small); font-weight: 600; }
.ch-before-after-badge--before { background: var(--text-2); color: #fff; opacity: 0.7; }
.ch-before-after-badge--after { background: var(--accent); color: #fff; }
.ch-before-after-media { width: 100%; border-radius: var(--radius-md); overflow: hidden; }
.ch-before-after-media img, .ch-before-after-media video { width: 100%; height: auto; }
.ch-before-after-caption { font-size: var(--t-small); color: var(--text-2); margin: 0; }
.ch-before-after-divider { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ch-before-after-arrow { font-size: var(--t-display-2); color: var(--accent); }
.ch-before-after-metric { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); padding: var(--space-4); background: color-mix(in srgb, var(--accent) 10%, transparent); border-radius: 12px; }
.ch-before-after-metric-value { font-family: var(--font-mono); font-size: var(--t-display-2); color: var(--accent); line-height: 1; }
.ch-before-after-metric-label { font-size: var(--t-small); color: var(--text-2); }`,
};
