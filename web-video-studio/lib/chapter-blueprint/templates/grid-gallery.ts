/**
 * grid-gallery — Responsive image/media grid
 * Variants: cols-2, cols-3 (default), cols-4
 */
import { z } from "zod";
import type { TemplateDefinition, TemplateContext, TemplateOutput } from "./types";
import { MediaRef } from "../types";
import { escHtml, styleOverridesToProp, extraClasses, bgClass, mediaToJsx } from "./utils";

export const GridItem = z.object({
  media: MediaRef,
  caption: z.string().optional(),
  tag: z.string().optional(),
});

export const GridGallerySlots = z.object({
  items: z.array(GridItem).min(2).max(12),
  columns: z.number().int().min(2).max(4).default(3),
  gap: z.enum(["sm", "md", "lg"]).default("md"),
});

function generate(ctx: TemplateContext): TemplateOutput {
  const s = ctx.slots;
  const variant = ctx.variant ?? `cols-${s.columns || 3}`;
  const items: any[] = s.items ?? [];
  const ov = ctx.overrides;
  const lines: string[] = [];

  lines.push(`<div className="ch-grid ch-grid--${variant}${bgClass(ov)}${extraClasses(ov)}"${styleOverridesToProp(ov)}>`);
  const gapToken = s.gap === "sm" ? "4" : s.gap === "lg" ? "7" : "5";
  lines.push(`  <div className="ch-grid-inner" style={{ "--grid-cols": ${s.columns || 3}, "--grid-gap": "var(--space-${gapToken})" } as React.CSSProperties}>`);
  items.forEach((item: any, i: number) => {
    lines.push(`    <Stagger index={${i}} delay={0.15} stepTime={0.5}>`);
    lines.push(`      <div className="ch-grid-item">`);
    lines.push(`        ${mediaToJsx(item.media, "        ")}`);
    if (item.caption || item.tag) {
      lines.push(`        <div className="ch-grid-item-info">`);
      if (item.tag) lines.push(`          <span className="ch-grid-item-tag label-mono">${escHtml(item.tag)}</span>`);
      if (item.caption) lines.push(`          <span className="ch-grid-item-caption">${escHtml(item.caption)}</span>`);
      lines.push(`        </div>`);
    }
    lines.push(`      </div>`);
    lines.push(`    </Stagger>`);
  });
  lines.push(`  </div>`);
  lines.push(`</div>`);

  return { jsx: lines.join("\n"), css: "", imports: ["Stagger"] };
}

export const gridGalleryTemplate: TemplateDefinition = {
  id: "grid-gallery",
  description: "Image/media grid with configurable columns and stagger animation",
  variants: ["cols-2", "cols-3", "cols-4"],
  slots: GridGallerySlots,
  generate,
  chapterCSS: `.ch-grid { flex: 1; display: flex; align-items: center; justify-content: center; padding: var(--stage-pad-y) var(--stage-pad-x); }
.ch-grid-inner { display: grid; grid-template-columns: repeat(var(--grid-cols, 3), 1fr); gap: var(--grid-gap, var(--space-5)); width: 100%; max-width: 1100px; }
.ch-grid-item { display: flex; flex-direction: column; gap: var(--space-2); }
.ch-grid-item img { width: 100%; aspect-ratio: 16/9; object-fit: contain; border-radius: 8px; background: white; }
.ch-grid-item-info { display: flex; flex-direction: column; gap: var(--space-1); }
.ch-grid-item-tag { color: var(--accent); }
.ch-grid-item-caption { font-size: var(--t-small); color: var(--text-2); }`,
};
