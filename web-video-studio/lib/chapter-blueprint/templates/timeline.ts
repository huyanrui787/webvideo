/**
 * timeline — Chronological milestone / roadmap display
 * Variants: horizontal (default), vertical
 */
import { z } from "zod";
import type { TemplateDefinition, TemplateContext, TemplateOutput } from "./types";
import { escHtml, styleOverridesToProp, extraClasses, bgClass } from "./utils";

export const TimelineSlots = z.object({
  items: z.array(z.object({
    date: z.string().describe("Date or label (e.g. '2024 Q1', 'Phase 1')"),
    heading: z.string().describe("Milestone title"),
    body: z.string().optional().describe("Brief description"),
    highlight: z.boolean().default(false).describe("Emphasize this item"),
  })).min(2).max(10).describe("Timeline milestones"),
});

function generate(ctx: TemplateContext): TemplateOutput {
  const s = ctx.slots;
  const variant = ctx.variant ?? "horizontal";
  const items: any[] = s.items ?? [];
  const ov = ctx.overrides;
  const lines: string[] = [];

  lines.push(`<div className="ch-timeline ch-timeline--${variant}${bgClass(ov)}${extraClasses(ov)}"${styleOverridesToProp(ov)}>`);
  lines.push(`  <div className="ch-timeline-track">`);

  items.forEach((item: any, i: number) => {
    const highlight = item.highlight ? " ch-timeline-item--highlight" : "";
    lines.push(`    <Stagger index={${i}} delay={${(0.15 + i * 0.12).toFixed(2)}} stepTime={0.6}>`);
    lines.push(`      <div className="ch-timeline-item${highlight}">`);
    lines.push(`        <div className="ch-timeline-dot"></div>`);
    lines.push(`        <span className="ch-timeline-date">${escHtml(item.date)}</span>`);
    lines.push(`        <h3 className="ch-timeline-heading">${escHtml(item.heading)}</h3>`);
    if (item.body) lines.push(`        <p className="ch-timeline-body">${escHtml(item.body)}</p>`);
    lines.push(`      </div>`);
    lines.push(`    </Stagger>`);
  });

  lines.push(`  </div>`);
  lines.push(`</div>`);

  return { jsx: lines.join("\n"), css: "", imports: ["Stagger"] };
}

export const timelineTemplate: TemplateDefinition = {
  id: "timeline",
  description: "Chronological timeline with milestone dots",
  variants: ["horizontal", "vertical"],
  slots: TimelineSlots,
  generate,
  chapterCSS: `.ch-timeline { flex: 1; display: flex; align-items: center; justify-content: center; padding: var(--stage-pad-y) var(--stage-pad-x); }
.ch-timeline-track { display: flex; gap: var(--space-7); position: relative; }
.ch-timeline-track::before { content: ""; position: absolute; top: 50%; left: 0; right: 0; height: 2px; background: var(--accent); opacity: 0.25; transform: translateY(-50%); }
.ch-timeline--vertical .ch-timeline-track { flex-direction: column; gap: var(--space-5); }
.ch-timeline--vertical .ch-timeline-track::before { top: 0; bottom: 0; left: 50%; width: 2px; height: auto; transform: translateX(-50%); }
.ch-timeline-item { position: relative; text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-2); min-width: 120px; max-width: 200px; }
.ch-timeline--vertical .ch-timeline-item { flex-direction: row; text-align: left; min-width: auto; max-width: none; }
.ch-timeline-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--accent); z-index: 1; flex-shrink: 0; }
.ch-timeline-item--highlight .ch-timeline-dot { width: 16px; height: 16px; box-shadow: 0 0 0 6px color-mix(in srgb, var(--accent) 30%, transparent); }
.ch-timeline-date { font-family: var(--font-mono); font-size: var(--t-small); color: var(--accent); }
.ch-timeline-heading { font-size: var(--t-h3); margin: 0; }
.ch-timeline-item--highlight .ch-timeline-heading { color: var(--accent); }
.ch-timeline-body { font-size: var(--t-small); color: var(--text-2); margin: 0; max-width: 28ch; }`,
};
