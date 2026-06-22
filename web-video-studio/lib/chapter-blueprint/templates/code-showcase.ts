/**
 * code-showcase — Code block with syntax highlighting and annotations
 * Variants: single-file (default), diff, side-by-side
 */
import { z } from "zod";
import type { TemplateDefinition, TemplateContext, TemplateOutput } from "./types";
import { MediaRef } from "../types";
import { escHtml, escAttr, escTemplate, styleOverridesToProp, extraClasses, bgClass, mediaToJsx } from "./utils";

export const CodeAnnotation = z.object({
  lines: z.string().describe("Line range, e.g. '3-7' or '12'"),
  text: z.string().describe("Annotation text"),
  position: z.enum(["right", "bottom"]).default("right"),
});

export const CodeShowcaseSlots = z.object({
  code: z.string().describe("The code snippet (plain text)"),
  language: z.string().default("typescript"),
  filename: z.string().optional(),
  highlights: z.array(z.string()).optional().describe("Line ranges to highlight, e.g. ['3-7', '12']"),
  annotations: z.array(CodeAnnotation).optional(),
  output: MediaRef.optional().describe("Screenshot/GIF of the running result"),
});

function generate(ctx: TemplateContext): TemplateOutput {
  const s = ctx.slots;
  const variant = ctx.variant ?? "single-file";
  const ov = ctx.overrides;
  const lines: string[] = [];

  lines.push(`<div className="ch-code ch-code--${variant}${bgClass(ov)}${extraClasses(ov)}"${styleOverridesToProp(ov)}>`);

  if (s.filename) {
    lines.push(`  <div className="ch-code-header">`);
    lines.push(`    <span className="ch-code-filename label-mono">${escHtml(s.filename)}</span>`);
    lines.push(`    <span className="ch-code-lang label-mono">${escHtml(s.language)}</span>`);
    lines.push(`  </div>`);
  }

  const highlights = s.highlights?.length
    ? `[${(s.highlights as string[]).map((h: string) => `"${h}"`).join(", ")}]`
    : "[]";
  lines.push(`  <CodeBlock code={\`${escTemplate(s.code)}\`} language="${escAttr(s.language)}" highlights={${highlights}} />`);

  if (s.annotations?.length) {
    lines.push(`  <div className="ch-code-annotations">`);
    s.annotations.forEach((ann: any, i: number) => {
      lines.push(`    <Reveal from="${ann.position === "bottom" ? "up" : "right"}" delay={${(0.5 + i * 0.3).toFixed(1)}} stepTime={0.6}>`);
      lines.push(`      <div className="ch-code-annotation ch-code-annotation--${ann.position}">`);
      lines.push(`        <span className="label-mono">${escHtml(ann.lines)}</span>`);
      lines.push(`        <span>${escHtml(ann.text)}</span>`);
      lines.push(`      </div>`);
      lines.push(`    </Reveal>`);
    });
    lines.push(`  </div>`);
  }

  if (s.output) lines.push(`  <div className="ch-code-output">${mediaToJsx(s.output, "    ")}</div>`);
  lines.push(`</div>`);

  return { jsx: lines.join("\n"), css: "", imports: ["CodeBlock", "Reveal"] };
}

export const codeShowcaseTemplate: TemplateDefinition = {
  id: "code-showcase",
  description: "Code block with optional syntax highlighting, annotations, and output preview",
  variants: ["single-file", "diff", "side-by-side"],
  slots: CodeShowcaseSlots,
  generate,
  chapterCSS: `.ch-code { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: var(--stage-pad-y) var(--stage-pad-x); gap: var(--space-5); }
.ch-code-header { display: flex; justify-content: space-between; align-items: center; }
.ch-code-filename { color: var(--accent); }
.ch-code-annotations { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-4); }
.ch-code-annotation { display: flex; gap: var(--space-3); align-items: baseline; }
.ch-code-output { margin-top: var(--space-5); }
.ch-code-output img { max-width: 100%; border-radius: var(--radius-md); }`,
};
