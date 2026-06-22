/**
 * quote-card — Pull quote with optional attribution and media
 * Variants: centered (default), side, overlay
 */
import { z } from "zod";
import type { TemplateDefinition, TemplateContext, TemplateOutput } from "./types";
import { MediaRef } from "../types";
import { escHtml, styleOverridesToProp, extraClasses, bgClass, mediaToJsx } from "./utils";

export const QuoteCardSlots = z.object({
  quote: z.string().describe("The pull quote text"),
  attribution: z.string().optional().describe("Who said/wrote it"),
  context: z.string().optional().describe("Where it's from or relevance"),
  media: MediaRef.optional().describe("Portrait or decorative image"),
});

function generate(ctx: TemplateContext): TemplateOutput {
  const s = ctx.slots;
  const variant = ctx.variant ?? "centered";
  const ov = ctx.overrides;
  const lines: string[] = [];

  lines.push(`<div className="ch-quote ch-quote--${variant}${bgClass(ov)}${extraClasses(ov)}"${styleOverridesToProp(ov)}>`);
  if (s.media) lines.push(`  <div className="ch-quote-media">${mediaToJsx(s.media, "    ")}</div>`);
  lines.push(`  <blockquote className="ch-quote-text pull-quote">`);
  lines.push(`    <MaskReveal show duration={1100}>`);
  lines.push(`      <span className="serif-cn">${escHtml(s.quote)}</span>`);
  lines.push(`    </MaskReveal>`);
  lines.push(`  </blockquote>`);
  if (s.attribution) lines.push(`  <cite className="ch-quote-attribution">— ${escHtml(s.attribution)}</cite>`);
  if (s.context) lines.push(`  <p className="ch-quote-context label-mono">${escHtml(s.context)}</p>`);
  lines.push(`</div>`);

  return { jsx: lines.join("\n"), css: "", imports: ["MaskReveal"] };
}

export const quoteCardTemplate: TemplateDefinition = {
  id: "quote-card",
  description: "Prominent pull quote with optional portrait and attribution",
  variants: ["centered", "side", "overlay"],
  slots: QuoteCardSlots,
  generate,
  chapterCSS: `.ch-quote { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: var(--stage-pad-y) var(--stage-pad-x); gap: var(--space-5); }
.ch-quote--centered { align-items: center; text-align: center; }
.ch-quote--side { align-items: flex-start; }
.ch-quote--overlay { align-items: center; text-align: center; }
.ch-quote-text { font-size: var(--t-display-2); line-height: 1.15; max-width: 22ch; margin: 0; }
.ch-quote-attribution { font-family: var(--font-body); font-size: var(--t-h3); color: var(--text-2); font-style: normal; }
.ch-quote-context { max-width: 48ch; }
.ch-quote-media { margin-bottom: var(--space-4); }
.ch-quote-media img { width: var(--avatar-size, 120px); height: var(--avatar-size, 120px); border-radius: 50%; object-fit: cover; }`,
};
