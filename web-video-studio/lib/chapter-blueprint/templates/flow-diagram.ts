/**
 * flow-diagram — Animated node-edge network diagram
 * Variants: horizontal (default), vertical, radial
 */
import { z } from "zod";
import type { TemplateDefinition, TemplateContext, TemplateOutput } from "./types";
import { escAttr, styleOverridesToProp, extraClasses, bgClass } from "./utils";

export const FlowNode = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  icon: z.string().optional().describe("Emoji or icon character"),
});

export const FlowDiagramSlots = z.object({
  nodes: z.array(FlowNode).min(2).max(10),
  edges: z.array(z.object({ from: z.string(), to: z.string(), label: z.string().optional() }))
    .optional().describe("If omitted, nodes are connected sequentially"),
  highlightIndex: z.number().int().min(0).optional()
    .describe("Which node to highlight (0-indexed, for step-by-step build)"),
});

function generate(ctx: TemplateContext): TemplateOutput {
  const s = ctx.slots;
  const variant = ctx.variant ?? "horizontal";
  const nodes: any[] = s.nodes ?? [];
  const edges: any[] = s.edges ?? [];
  const ov = ctx.overrides;
  const lines: string[] = [];

  lines.push(`<div className="ch-flow ch-flow--${variant}${bgClass(ov)}${extraClasses(ov)}"${styleOverridesToProp(ov)}>`);

  const visibleCount = s.highlightIndex != null ? s.highlightIndex + 1 : nodes.length;
  lines.push(`  <NetworkGraph`);
  lines.push(`    nodes={[`);
  nodes.forEach((n: any) => {
    lines.push(`      { id: "${escAttr(n.id)}", label: "${escAttr(n.label)}"${n.description ? `, description: "${escAttr(n.description)}"` : ""}${n.icon ? `, icon: "${escAttr(n.icon)}"` : ""} },`);
  });
  lines.push(`    ]}`);
  lines.push(`    edges={[`);
  edges.forEach((e: any) => {
    lines.push(`      { from: "${escAttr(e.from)}", to: "${escAttr(e.to)}"${e.label ? `, label: "${escAttr(e.label)}"` : ""} },`);
  });
  lines.push(`    ]}`);
  lines.push(`    visibleNodes={${visibleCount}}`);
  lines.push(`    stepTime={1.0}`);
  lines.push(`  />`);
  lines.push(`</div>`);

  return { jsx: lines.join("\n"), css: "", imports: ["NetworkGraph"] };
}

export const flowDiagramTemplate: TemplateDefinition = {
  id: "flow-diagram",
  description: "Animated network graph with nodes and edges revealing progressively",
  variants: ["horizontal", "vertical", "radial"],
  slots: FlowDiagramSlots,
  generate,
  chapterCSS: `.ch-flow { flex: 1; display: flex; align-items: center; justify-content: center; padding: var(--stage-pad-y) var(--stage-pad-x); }`,
};
