/**
 * side-by-side — Left vs Right comparison
 * Variants: vs (default), arrow, none
 */
import { z } from "zod";
import type { TemplateDefinition, TemplateContext, TemplateOutput } from "./types";
import { MediaRef } from "../types";
import { escHtml, styleOverridesToProp, extraClasses, bgClass, mediaToJsx } from "./utils";

export const SideBySidePanel = z.object({
  heading: z.string(),
  body: z.string().optional(),
  media: MediaRef.optional(),
  items: z.array(z.string()).optional().describe("Bullet points"),
});

export const SideBySideSlots = z.object({
  left: SideBySidePanel,
  right: SideBySidePanel,
  leftLabel: z.string().optional(),
  rightLabel: z.string().optional(),
  divider: z.enum(["vs", "arrow", "none"]).default("vs"),
});

function genPanelContent(panel: any, indent: number): string {
  const pad = "  ".repeat(indent);
  const lines: string[] = [];
  lines.push(`${pad}<h3 className="ch-compare-heading">${escHtml(panel.heading)}</h3>`);
  if (panel.body) lines.push(`${pad}<p className="ch-compare-body">${escHtml(panel.body)}</p>`);
  if (panel.items?.length) {
    lines.push(`${pad}<ul className="ch-compare-items">`);
    panel.items.forEach((item: string) => lines.push(`${pad}  <li>${escHtml(item)}</li>`));
    lines.push(`${pad}</ul>`);
  }
  if (panel.media) lines.push(`${pad}<div className="ch-compare-media">${mediaToJsx(panel.media, pad + "  ")}</div>`);
  return lines.join("\n");
}

function generate(ctx: TemplateContext): TemplateOutput {
  const s = ctx.slots;
  const variant = ctx.variant ?? "vs";
  const ov = ctx.overrides;
  const lines: string[] = [];

  lines.push(`<div className="ch-compare ch-compare--${variant}${bgClass(ov)}${extraClasses(ov)}"${styleOverridesToProp(ov)}>`);

  lines.push(`  <div className="ch-compare-panel ch-compare-left">`);
  if (s.leftLabel) lines.push(`    <span className="ch-compare-label label-mono">${escHtml(s.leftLabel)}</span>`);
  lines.push(genPanelContent(s.left, 2));
  lines.push(`  </div>`);

  if (variant !== "none") {
    lines.push(`  <div className="ch-compare-divider"><span>${variant === "vs" ? "VS" : "→"}</span></div>`);
  }

  lines.push(`  <div className="ch-compare-panel ch-compare-right">`);
  if (s.rightLabel) lines.push(`    <span className="ch-compare-label label-mono">${escHtml(s.rightLabel)}</span>`);
  lines.push(genPanelContent(s.right, 2));
  lines.push(`  </div>`);

  lines.push(`</div>`);
  return { jsx: lines.join("\n"), css: "", imports: [] };
}

export const sideBySideTemplate: TemplateDefinition = {
  id: "side-by-side",
  description: "Left vs right comparison panel with optional divider (VS / arrow / none)",
  variants: ["vs", "arrow", "none"],
  slots: SideBySideSlots,
  generate,
  chapterCSS: `.ch-compare { flex: 1; display: flex; align-items: center; justify-content: center; padding: var(--stage-pad-y) var(--stage-pad-x); gap: var(--space-7); }
.ch-compare-panel { flex: 1; display: flex; flex-direction: column; gap: var(--space-4); max-width: 440px; }
.ch-compare-label { display: inline-block; padding: 2px var(--space-3); background: var(--accent); color: #fff; border-radius: 4px; align-self: flex-start; }
.ch-compare-heading { font-size: var(--t-h2); margin: 0; }
.ch-compare-body { font-family: var(--font-body); font-size: var(--t-body); color: var(--text-2); margin: 0; }
.ch-compare-items { margin: 0; padding-left: var(--space-5); display: flex; flex-direction: column; gap: var(--space-2); }
.ch-compare-items li { font-size: var(--t-body); }
.ch-compare-divider { display: flex; align-items: center; justify-content: center; }
.ch-compare-divider span { font-size: var(--t-h1); font-weight: 700; color: var(--accent); }
.ch-compare-media img { max-width: 100%; border-radius: 8px; }`,
};
