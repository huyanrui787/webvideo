/**
 * comparison-table — Feature / plan / option comparison table
 * Variants: default (striped rows), highlight-col (one column highlighted)
 */
import { z } from "zod";
import type { TemplateDefinition, TemplateContext, TemplateOutput } from "./types";
import { escHtml, styleOverridesToProp, extraClasses, bgClass } from "./utils";

export const ComparisonTableSlots = z.object({
  headers: z.array(z.string()).min(2).max(5).describe("Column headers (first = label column)"),
  rows: z.array(z.object({
    label: z.string().describe("Row label (feature name)"),
    values: z.array(z.string()).describe("Values for each column, same order as headers"),
    highlight: z.boolean().default(false).describe("Highlight this row"),
  })).min(1).max(15).describe("Table rows"),
  highlightColumn: z.number().int().min(1).max(4).optional().describe("Which column to visually emphasize (1-based, after label)"),
});

function generate(ctx: TemplateContext): TemplateOutput {
  const s = ctx.slots;
  const headers: string[] = s.headers ?? [];
  const rows: any[] = s.rows ?? [];
  const highlightCol = s.highlightColumn;
  const ov = ctx.overrides;
  const lines: string[] = [];

  lines.push(`<div className="ch-comparison-table${bgClass(ov)}${extraClasses(ov)}"${styleOverridesToProp(ov)}>`);

  // Header row
  const gridStyle = `gridTemplateColumns: "repeat(${headers.length}, 1fr)"`;
  lines.push(`  <Stagger index={0} delay={0.1} stepTime={0.5}>`);
  lines.push(`  <div className="ch-comparison-header" style={{ ${gridStyle} }}>`);
  headers.forEach((h: string, ci: number) => {
    const colClass = highlightCol === ci ? " ch-comparison-col--highlight" : "";
    lines.push(`    <div className="ch-comparison-cell ch-comparison-header-cell${colClass}">`);
    lines.push(`      ${escHtml(h)}`);
    lines.push(`    </div>`);
  });
  lines.push(`  </div>`);
  lines.push(`  </Stagger>`);

  // Data rows
  rows.forEach((row: any, ri: number) => {
    const rowClass = row.highlight ? " ch-comparison-row--highlight" : "";
    lines.push(`  <Stagger index={${ri + 1}} delay={${(0.2 + ri * 0.08).toFixed(2)}} stepTime={0.4}>`);
    lines.push(`  <div className="ch-comparison-row${rowClass}" style={{ ${gridStyle} }}>`);

    // Label cell
    lines.push(`    <div className="ch-comparison-cell ch-comparison-label">${escHtml(row.label)}</div>`);

    // Value cells
    (row.values || []).forEach((val: string, ci: number) => {
      const colClass = highlightCol === ci + 1 ? " ch-comparison-col--highlight" : "";
      const valLower = val.toLowerCase();
      let icon = "";
      if (valLower === "true" || valLower === "yes" || valLower === "✓" || valLower === "✔") icon = "✓";
      else if (valLower === "false" || valLower === "no" || valLower === "✗" || valLower === "✘") icon = "—";

      lines.push(`    <div className="ch-comparison-cell ch-comparison-value${colClass}">`);
      if (icon) {
        lines.push(`      <span className="ch-comparison-icon ch-comparison-icon--${icon === "✓" ? "check" : "cross"}">${icon}</span>`);
      } else {
        lines.push(`      <span>${escHtml(val)}</span>`);
      }
      lines.push(`    </div>`);
    });

    lines.push(`  </div>`);
    lines.push(`  </Stagger>`);
  });

  lines.push(`</div>`);
  return { jsx: lines.join("\n"), css: "", imports: ["Stagger"] };
}

export const comparisonTableTemplate: TemplateDefinition = {
  id: "comparison-table",
  description: "Feature comparison table with optional column highlight",
  variants: ["default", "highlight-col"],
  slots: ComparisonTableSlots,
  generate,
  chapterCSS: `.ch-comparison-table { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: var(--stage-pad-y) var(--stage-pad-x); gap: 0; overflow: hidden; }
.ch-comparison-header { display: grid; gap: 0; border-bottom: 2px solid var(--accent); padding-bottom: var(--space-3); margin-bottom: var(--space-2); }
.ch-comparison-row { display: grid; gap: 0; padding: var(--space-2) 0; border-bottom: 1px solid var(--border); }
.ch-comparison-row--highlight { background: color-mix(in srgb, var(--accent) 8%, transparent); }
.ch-comparison-cell { display: flex; align-items: center; padding: var(--space-2) var(--space-3); font-size: var(--t-body); }
.ch-comparison-header-cell { font-weight: 600; font-size: var(--t-h4); color: var(--accent); }
.ch-comparison-col--highlight { background: color-mix(in srgb, var(--accent) 12%, transparent); }
.ch-comparison-label { font-weight: 500; color: var(--text); }
.ch-comparison-value { color: var(--text-2); }
.ch-comparison-icon { font-weight: 700; }
.ch-comparison-icon--check { color: var(--accent); }
.ch-comparison-icon--cross { color: var(--text-2); opacity: 0.4; }`,
};
