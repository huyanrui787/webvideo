/**
 * step-reveal — Sequential step list with stagger-reveal
 * Variants: numbered (default), cards, icons
 */
import { z } from "zod";
import type { TemplateDefinition, TemplateContext, TemplateOutput } from "./types";
import { MediaRef } from "../types";
import { escHtml, styleOverridesToProp, extraClasses, bgClass, mediaToJsx } from "./utils";

export const StepRevealItem = z.object({
  heading: z.string(),
  body: z.string().optional(),
  media: MediaRef.optional(),
  badge: z.string().optional(),
});

export const StepRevealSlots = z.object({
  hook: z.object({
    type: z.enum(["stat", "quote", "question"]),
    content: z.string(),
    label: z.string().optional(),
  }).optional().describe("Opening hook before the step list"),
  steps: z.array(StepRevealItem).min(1).max(8).describe("Each step = one reveal item"),
});

function generate(ctx: TemplateContext): TemplateOutput {
  const s = ctx.slots;
  const variant = ctx.variant ?? "numbered";
  const steps: any[] = s.steps ?? [];
  const ov = ctx.overrides;
  const lines: string[] = [];

  lines.push(`<div className="ch-steps ch-steps--${variant}${bgClass(ov)}${extraClasses(ov)}"${styleOverridesToProp(ov)}>`);

  if (s.hook) {
    lines.push(`  <div className="ch-steps-hook">`);
    lines.push(`    <Reveal from="up" delay={0.1} stepTime={0.8}>`);
    lines.push(`      <span className="ch-steps-hook-${s.hook.type}">${escHtml(s.hook.content)}</span>`);
    if (s.hook.label) lines.push(`      <span className="label-mono">${escHtml(s.hook.label)}</span>`);
    lines.push(`    </Reveal>`);
    lines.push(`  </div>`);
  }

  lines.push(`  <div className="ch-steps-list">`);
  steps.forEach((item: any, i: number) => {
    const revealDelay = 0.2 + i * 0.15;
    lines.push(`    <Stagger index={${i}} delay={${revealDelay.toFixed(2)}} stepTime={0.7}>`);
    lines.push(`      <div className="ch-step-item">`);
    if (variant === "numbered") lines.push(`        <span className="ch-step-num">${String(i + 1).padStart(2, "0")}</span>`);
    lines.push(`        <div className="ch-step-body">`);
    if (item.badge) lines.push(`          <span className="ch-step-badge">${escHtml(item.badge)}</span>`);
    lines.push(`          <h3 className="ch-step-heading">${escHtml(item.heading)}</h3>`);
    if (item.body) lines.push(`          <p className="ch-step-text">${escHtml(item.body)}</p>`);
    lines.push(`        </div>`);
    if (item.media) lines.push(`        <div className="ch-step-media">${mediaToJsx(item.media, "          ")}</div>`);
    lines.push(`      </div>`);
    lines.push(`    </Stagger>`);
  });
  lines.push(`  </div>`);
  lines.push(`</div>`);

  return { jsx: lines.join("\n"), css: "", imports: ["Reveal", "Stagger"] };
}

export const stepRevealTemplate: TemplateDefinition = {
  id: "step-reveal",
  description: "Numbered/sequential list with staggered reveal animation",
  variants: ["numbered", "cards", "icons"],
  slots: StepRevealSlots,
  generate,
  chapterCSS: `.ch-steps { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: var(--stage-pad-y) var(--stage-pad-x); gap: var(--space-6); }
.ch-steps-hook { margin-bottom: var(--space-5); }
.ch-steps-hook-stat { font-size: var(--t-display-1); color: var(--accent); display: block; }
.ch-steps-hook-quote { font-size: var(--t-h1); font-style: italic; display: block; }
.ch-steps-hook-question { font-size: var(--t-h1); font-weight: 600; display: block; }
.ch-steps-list { display: flex; flex-direction: column; gap: var(--space-5); }
.ch-step-item { display: flex; gap: var(--space-5); align-items: flex-start; }
.ch-step-num { font-family: var(--font-mono); font-size: var(--t-display-2); color: var(--accent); line-height: 0.9; min-width: 2ch; }
.ch-step-body { flex: 1; display: flex; flex-direction: column; gap: var(--space-2); }
.ch-step-badge { display: inline-block; padding: 2px var(--space-3); background: var(--accent); color: #fff; border-radius: 4px; font-size: var(--t-small); align-self: flex-start; }
.ch-step-heading { font-size: var(--t-h2); margin: 0; }
.ch-step-text { font-family: var(--font-body); font-size: var(--t-body); color: var(--text-2); max-width: 56ch; margin: 0; }
.ch-step-media { flex-shrink: 0; margin-top: var(--space-2); }
.ch-step-media img { border-radius: 8px; }`,
};
