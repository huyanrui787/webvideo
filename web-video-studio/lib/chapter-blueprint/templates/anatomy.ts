/**
 * anatomy — Product/UI/system anatomy with positioned labels on a background image
 * Variants: callout (default), numbered (numbered pins)
 */
import { z } from "zod";
import type { TemplateDefinition, TemplateContext, TemplateOutput } from "./types";
import { MediaRef } from "../types";
import { escHtml, styleOverridesToProp, extraClasses, bgClass, mediaToJsx } from "./utils";

export const AnatomySlots = z.object({
  mainImage: MediaRef.describe("The base image to annotate (product, screenshot, diagram)"),
  labels: z.array(z.object({
    text: z.string().describe("Annotation text"),
    position: z.enum(["top-left", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left"]).describe("Position relative to the image"),
    connectorLine: z.boolean().default(true).describe("Draw a connector line from label to the image edge"),
  })).min(1).max(8).describe("Positioned annotations on the image"),
});

function generate(ctx: TemplateContext): TemplateOutput {
  const s = ctx.slots;
  const variant = ctx.variant ?? "callout";
  const labels: any[] = s.labels ?? [];
  const ov = ctx.overrides;
  const lines: string[] = [];

  lines.push(`<div className="ch-anatomy ch-anatomy--${variant}${bgClass(ov)}${extraClasses(ov)}"${styleOverridesToProp(ov)}>`);
  lines.push(`  <div className="ch-anatomy-stage">`);

  // Main image
  lines.push(`    <div className="ch-anatomy-image">`);
  lines.push(`      ${mediaToJsx(s.mainImage, "      ")}`);
  lines.push(`    </div>`);

  // Labels positioned absolutely over the image
  labels.forEach((label: any, i: number) => {
    const pos = label.position || "right";
    const hasConnector = label.connectorLine !== false;
    lines.push(`    <Reveal from="up" delay={${(0.3 + i * 0.12).toFixed(2)}} stepTime={0.5}>`);
    lines.push(`    <div className="ch-anatomy-label ch-anatomy-label--${pos}${hasConnector ? " ch-anatomy-label--connected" : ""}">`);
    if (variant === "numbered") {
      lines.push(`      <span className="ch-anatomy-num">${String(i + 1).padStart(2, "0")}</span>`);
    }
    lines.push(`      <span className="ch-anatomy-label-text">${escHtml(label.text)}</span>`);
    if (hasConnector) {
      lines.push(`      <div className="ch-anatomy-connector ch-anatomy-connector--${pos}"></div>`);
    }
    lines.push(`    </div>`);
    lines.push(`    </Reveal>`);
  });

  lines.push(`  </div>`);
  lines.push(`</div>`);
  return { jsx: lines.join("\n"), css: "", imports: ["Reveal"] };
}

export const anatomyTemplate: TemplateDefinition = {
  id: "anatomy",
  description: "Annotated image with positioned callout labels",
  variants: ["callout", "numbered"],
  slots: AnatomySlots,
  generate,
  chapterCSS: `.ch-anatomy { flex: 1; display: flex; align-items: center; justify-content: center; padding: var(--stage-pad-y) var(--stage-pad-x); }
.ch-anatomy-stage { position: relative; display: inline-block; max-width: 90%; max-height: 80vh; }
.ch-anatomy-image { border-radius: var(--radius-md); overflow: hidden; }
.ch-anatomy-image img { display: block; max-width: 100%; max-height: 70vh; object-fit: contain; }
.ch-anatomy-label { position: absolute; display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); background: var(--surface); border: 1px solid var(--accent); border-radius: var(--radius-sm); font-size: var(--t-small); white-space: nowrap; }
.ch-anatomy-num { font-family: var(--font-mono); font-weight: 700; color: var(--accent); }
.ch-anatomy-label-text { color: var(--text); }
.ch-anatomy-label--top-left { top: -12px; left: 12px; transform: translateY(-100%); }
.ch-anatomy-label--top { top: -12px; left: 50%; transform: translate(-50%, -100%); }
.ch-anatomy-label--top-right { top: -12px; right: 12px; transform: translateY(-100%); }
.ch-anatomy-label--right { top: 50%; right: -12px; transform: translate(100%, -50%); }
.ch-anatomy-label--bottom-right { bottom: -12px; right: 12px; transform: translateY(100%); }
.ch-anatomy-label--bottom { bottom: -12px; left: 50%; transform: translate(-50%, 100%); }
.ch-anatomy-label--bottom-left { bottom: -12px; left: 12px; transform: translateY(100%); }
.ch-anatomy-label--left { top: 50%; left: -12px; transform: translate(-100%, -50%); }
.ch-anatomy-connector { position: absolute; background: var(--accent); }
.ch-anatomy-connector--top-left, .ch-anatomy-connector--top, .ch-anatomy-connector--top-right { width: 1px; height: 12px; bottom: -12px; left: 50%; }
.ch-anatomy-connector--bottom-left, .ch-anatomy-connector--bottom, .ch-anatomy-connector--bottom-right { width: 1px; height: 12px; top: -12px; left: 50%; }
.ch-anatomy-connector--left { width: 12px; height: 1px; right: -12px; top: 50%; }
.ch-anatomy-connector--right { width: 12px; height: 1px; left: -12px; top: 50%; }`,
};
