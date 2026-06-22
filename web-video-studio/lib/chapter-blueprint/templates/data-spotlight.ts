/**
 * data-spotlight — Big number + supporting stats
 * Variants: single-stat (default), comparison, with-chart
 */
import { z } from "zod";
import type { TemplateDefinition, TemplateContext, TemplateOutput } from "./types";
import { MediaRef } from "../types";
import { escHtml, styleOverridesToProp, extraClasses, bgClass, mediaToJsx } from "./utils";

export const DataSpotlightSlots = z.object({
  primaryValue: z.string().describe("The big number/stat (e.g. '2048 tokens')"),
  primaryLabel: z.string().describe("What the number represents"),
  context: z.string().optional().describe("1-2 sentences explaining significance"),
  secondaryValues: z.array(z.object({
    value: z.string(),
    label: z.string(),
    trend: z.enum(["up", "down", "neutral"]).optional(),
  })).max(4).optional().describe("Secondary comparison stats"),
  media: MediaRef.optional().describe("Supporting chart or diagram"),
});

function generate(ctx: TemplateContext): TemplateOutput {
  const s = ctx.slots;
  const variant = ctx.variant ?? "single-stat";
  const ov = ctx.overrides;
  const lines: string[] = [];

  lines.push(`<div className="ch-data ch-data--${variant}${bgClass(ov)}${extraClasses(ov)}"${styleOverridesToProp(ov)}>`);
  lines.push(`  <div className="ch-data-primary">`);
  lines.push(`    <Counter to={${parseFloat(String(s.primaryValue)) || 0}} delay={0.2} stepTime={1.2} />`);
  lines.push(`    <span className="ch-data-value">${escHtml(s.primaryValue)}</span>`);
  lines.push(`    <span className="ch-data-label label-mono">${escHtml(s.primaryLabel)}</span>`);
  lines.push(`  </div>`);
  if (s.context) lines.push(`  <p className="ch-data-context">${escHtml(s.context)}</p>`);
  if (s.secondaryValues?.length) {
    lines.push(`  <div className="ch-data-secondary">`);
    s.secondaryValues.forEach((sv: any) => {
      const trendIcon = sv.trend === "up" ? "↑" : sv.trend === "down" ? "↓" : "";
      lines.push(`    <div className="ch-data-secondary-item">`);
      lines.push(`      <span className="ch-data-secondary-value">${escHtml(sv.value)}${trendIcon ? ` <span className="trend-${sv.trend}">${trendIcon}</span>` : ""}</span>`);
      lines.push(`      <span className="label-mono">${escHtml(sv.label)}</span>`);
      lines.push(`    </div>`);
    });
    lines.push(`  </div>`);
  }
  if (s.media) lines.push(`  <div className="ch-data-media">${mediaToJsx(s.media, "    ")}</div>`);
  lines.push(`</div>`);

  return { jsx: lines.join("\n"), css: "", imports: ["Counter"] };
}

export const dataSpotlightTemplate: TemplateDefinition = {
  id: "data-spotlight",
  description: "Big number hero with optional supporting comparison stats and chart",
  variants: ["single-stat", "comparison", "with-chart"],
  slots: DataSpotlightSlots,
  generate,
  chapterCSS: `.ch-data { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: var(--stage-pad-y) var(--stage-pad-x); gap: var(--space-5); }
.ch-data-primary { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); }
.ch-data-value { font-size: var(--t-display-1); font-weight: 700; color: var(--accent); }
.ch-data-label { font-size: var(--t-h3); }
.ch-data-context { font-family: var(--font-body); font-size: var(--t-body); color: var(--text-2); max-width: 48ch; text-align: center; margin: 0; }
.ch-data-secondary { display: flex; gap: var(--space-9); margin-top: var(--space-4); }
.ch-data-secondary-item { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); }
.ch-data-secondary-value { font-size: var(--t-h2); font-weight: 600; }
.ch-data-media { margin-top: var(--space-5); }
.ch-data-media img { max-width: 600px; border-radius: 8px; }`,
};
