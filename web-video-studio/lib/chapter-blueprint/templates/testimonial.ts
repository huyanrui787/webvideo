/**
 * testimonial — Customer testimonial / user review card
 * Variants: centered (default), avatar-left (photo + text side by side)
 */
import { z } from "zod";
import type { TemplateDefinition, TemplateContext, TemplateOutput } from "./types";
import { MediaRef } from "../types";
import { escHtml, styleOverridesToProp, extraClasses, bgClass, mediaToJsx } from "./utils";

export const TestimonialSlots = z.object({
  quote: z.string().describe("The testimonial quote"),
  attribution: z.object({
    name: z.string().describe("Person's name"),
    title: z.string().optional().describe("Title / company"),
  }),
  avatar: MediaRef.optional().describe("Headshot photo"),
  stats: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).max(3).optional().describe("Supporting metrics below the quote"),
});

function generate(ctx: TemplateContext): TemplateOutput {
  const s = ctx.slots;
  const variant = ctx.variant ?? "centered";
  const ov = ctx.overrides;
  const lines: string[] = [];

  lines.push(`<div className="ch-testimonial ch-testimonial--${variant}${bgClass(ov)}${extraClasses(ov)}"${styleOverridesToProp(ov)}>`);

  if (variant === "centered") {
    // Large quote mark
    lines.push(`  <div className="ch-testimonial-quote-mark">"</div>`);
    lines.push(`  <Reveal from="up" delay={0.2} stepTime={0.8}>`);
    lines.push(`    <blockquote className="ch-testimonial-quote">${escHtml(s.quote)}</blockquote>`);
    lines.push(`  </Reveal>`);
    lines.push(`  <Reveal from="up" delay={0.5} stepTime={0.5}>`);
    lines.push(`    <div className="ch-testimonial-attribution">`);
    if (s.avatar) {
      lines.push(`      <div className="ch-testimonial-avatar">${mediaToJsx(s.avatar, "        ")}</div>`);
    }
    lines.push(`      <div>`);
    lines.push(`        <span className="ch-testimonial-name">${escHtml(s.attribution.name)}</span>`);
    if (s.attribution.title) lines.push(`        <span className="ch-testimonial-title">${escHtml(s.attribution.title)}</span>`);
    lines.push(`      </div>`);
    lines.push(`    </div>`);
    lines.push(`  </Reveal>`);
  } else {
    // avatar-left variant: photo on left, quote on right
    lines.push(`  <div className="ch-testimonial-split">`);
    if (s.avatar) {
      lines.push(`    <div className="ch-testimonial-avatar-col">`);
      lines.push(`      <Reveal from="left" delay={0.2} stepTime={0.6}>`);
      lines.push(`        ${mediaToJsx(s.avatar, "        ")}`);
      lines.push(`        <span className="ch-testimonial-name">${escHtml(s.attribution.name)}</span>`);
      if (s.attribution.title) lines.push(`        <span className="ch-testimonial-title">${escHtml(s.attribution.title)}</span>`);
      lines.push(`      </Reveal>`);
      lines.push(`    </div>`);
    }
    lines.push(`    <div className="ch-testimonial-quote-col">`);
    lines.push(`      <Reveal from="right" delay={0.3} stepTime={0.7}>`);
    lines.push(`        <div className="ch-testimonial-quote-mark">"</div>`);
    lines.push(`        <blockquote className="ch-testimonial-quote">${escHtml(s.quote)}</blockquote>`);
    lines.push(`      </Reveal>`);
    lines.push(`    </div>`);
    lines.push(`  </div>`);
  }

  // Stats row
  if (s.stats && s.stats.length > 0) {
    lines.push(`  <div className="ch-testimonial-stats">`);
    s.stats.forEach((stat: any, i: number) => {
      lines.push(`    <Reveal from="up" delay={${(0.8 + i * 0.12).toFixed(2)}} stepTime={0.4}>`);
      lines.push(`    <div className="ch-testimonial-stat">`);
      lines.push(`      <span className="ch-testimonial-stat-value">${escHtml(stat.value)}</span>`);
      lines.push(`      <span className="ch-testimonial-stat-label">${escHtml(stat.label)}</span>`);
      lines.push(`    </div>`);
      lines.push(`    </Reveal>`);
    });
    lines.push(`  </div>`);
  }

  lines.push(`</div>`);
  return { jsx: lines.join("\n"), css: "", imports: ["Reveal"] };
}

export const testimonialTemplate: TemplateDefinition = {
  id: "testimonial",
  description: "Customer testimonial with quote, attribution, and optional stats",
  variants: ["centered", "avatar-left"],
  slots: TestimonialSlots,
  generate,
  chapterCSS: `.ch-testimonial { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-6); padding: var(--stage-pad-y) var(--stage-pad-x); }
.ch-testimonial-quote-mark { font-family: Georgia, serif; font-size: 120px; color: var(--accent); opacity: 0.2; line-height: 0.5; margin-bottom: var(--space-4); user-select: none; }
.ch-testimonial-quote { font-size: var(--t-h2); font-style: italic; line-height: 1.5; text-align: center; max-width: 48ch; margin: 0; color: var(--text); }
.ch-testimonial-attribution { display: flex; align-items: center; gap: var(--space-3); }
.ch-testimonial-avatar { width: 48px; height: 48px; border-radius: 50%; overflow: hidden; flex-shrink: 0; }
.ch-testimonial-avatar img { width: 100%; height: 100%; object-fit: cover; }
.ch-testimonial-name { font-weight: 600; font-size: var(--t-body); display: block; }
.ch-testimonial-title { font-size: var(--t-small); color: var(--text-2); display: block; }
.ch-testimonial-split { display: flex; align-items: center; gap: var(--space-7); }
.ch-testimonial-avatar-col { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); min-width: 120px; }
.ch-testimonial-avatar-col img { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; }
.ch-testimonial-quote-col { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.ch-testimonial-stats { display: flex; gap: var(--space-8); margin-top: var(--space-4); }
.ch-testimonial-stat { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); }
.ch-testimonial-stat-value { font-family: var(--font-mono); font-size: var(--t-h2); color: var(--accent); }
.ch-testimonial-stat-label { font-size: var(--t-small); color: var(--text-2); }`,
};
