/**
 * hero-title — Hero title page
 * Variants: centered (default), left, split
 */
import { z } from "zod";
import type { TemplateDefinition, TemplateContext, TemplateOutput } from "./types";
import { MediaRef } from "../types";
import { escHtml, styleOverridesToProp, extraClasses, bgClass, mediaToJsx } from "./utils";

export const HeroTitleSlots = z.object({
  kicker: z.string().optional().describe("Small label above the title"),
  title: z.string().describe("Main title text, supports <em> for emphasis"),
  subtitle: z.string().optional().describe("Supporting text below title"),
  background: MediaRef.optional().describe("Background image/video"),
  logo: MediaRef.optional().describe("Small logo/icon"),
});

function generate(ctx: TemplateContext): TemplateOutput {
  const s = ctx.slots;
  const variant = ctx.variant ?? "centered";
  const ov = ctx.overrides;
  const lines: string[] = [];

  const styleProp = styleOverridesToProp(ov);
  const extraCls = extraClasses(ov);
  const bgCls = bgClass(ov);

  lines.push(`<div className="ch-hero ch-hero--${variant}${bgCls}${extraCls}"${styleProp}>`);
  if (s.kicker) lines.push(`  <div className="kicker">${escHtml(s.kicker)}</div>`);
  lines.push(`  <h1 className="ch-hero-title">`);
  lines.push(`    <MaskReveal show duration={900}>`);
  lines.push(`      <span className="serif-cn">${escHtml(s.title)}</span>`);
  lines.push(`    </MaskReveal>`);
  lines.push(`  </h1>`);
  if (s.subtitle) lines.push(`  <p className="ch-hero-sub">${escHtml(s.subtitle)}</p>`);
  if (s.background) {
    lines.push(`  <div className="ch-hero-bg">`);
    lines.push(`    ${mediaToJsx(s.background, "    ")}`);
    lines.push(`  </div>`);
  }
  if (s.logo) lines.push(`  <div className="ch-hero-logo">${mediaToJsx(s.logo, "    ")}</div>`);
  lines.push(`</div>`);

  return { jsx: lines.join("\n"), css: "", imports: ["MaskReveal"] };
}

export const heroTitleTemplate: TemplateDefinition = {
  id: "hero-title",
  description: "Hero title page with kicker, title, subtitle, and optional background/logo",
  variants: ["centered", "left", "split"],
  slots: HeroTitleSlots,
  generate,
  chapterCSS: `.ch-hero { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: var(--space-5); padding: var(--stage-pad-y) var(--stage-pad-x); }
.ch-hero--centered { align-items: center; text-align: center; }
.ch-hero--left { align-items: flex-start; text-align: left; }
.ch-hero--split { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: var(--space-9); }
.ch-hero-title { font-size: var(--t-display-2); line-height: 1.05; margin: 0; max-width: 24ch; }
.ch-hero-sub { font-family: var(--font-body); font-size: var(--t-body); color: var(--text-2); max-width: 56ch; margin: 0; }
.ch-hero-bg { position: absolute; inset: 0; z-index: 0; opacity: 0.3; }
.ch-hero-bg img, .ch-hero-bg video { width: 100%; height: 100%; object-fit: cover; }
.ch-hero-logo { position: absolute; top: var(--space-6); right: var(--space-6); width: 64px; }`,
};
