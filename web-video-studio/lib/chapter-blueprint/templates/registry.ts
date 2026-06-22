/**
 * Template Registry — auto-discovers all template modules and provides
 * lookup/dispatch for the compiler. To add a new template, just drop a
 * file exporting a TemplateDefinition into this directory.
 */

import type { TemplateDefinition } from "./types";
import { heroTitleTemplate } from "./hero-title";
import { stepRevealTemplate } from "./step-reveal";
import { dataSpotlightTemplate } from "./data-spotlight";
import { sideBySideTemplate } from "./side-by-side";
import { flowDiagramTemplate } from "./flow-diagram";
import { codeShowcaseTemplate } from "./code-showcase";
import { quoteCardTemplate } from "./quote-card";
import { gridGalleryTemplate } from "./grid-gallery";
import { timelineTemplate } from "./timeline";
import { comparisonTableTemplate } from "./comparison-table";
import { beforeAfterTemplate } from "./before-after";
import { anatomyTemplate } from "./anatomy";
import { progressBarTemplate } from "./progress-bar";
import { testimonialTemplate } from "./testimonial";

/** Map of template ID → definition */
const registry = new Map<string, TemplateDefinition>();

// Register all built-in templates
const BUILTIN_TEMPLATES: TemplateDefinition[] = [
  heroTitleTemplate,
  stepRevealTemplate,
  dataSpotlightTemplate,
  sideBySideTemplate,
  flowDiagramTemplate,
  codeShowcaseTemplate,
  quoteCardTemplate,
  gridGalleryTemplate,
  timelineTemplate,
  comparisonTableTemplate,
  beforeAfterTemplate,
  anatomyTemplate,
  progressBarTemplate,
  testimonialTemplate,
];

for (const tpl of BUILTIN_TEMPLATES) {
  registry.set(tpl.id, tpl);
}

/** Get a template definition by ID. Throws if not found. */
export function getTemplate(id: string): TemplateDefinition {
  const tpl = registry.get(id);
  if (!tpl) throw new Error(`Template "${id}" not found in registry. Available: ${[...registry.keys()].join(", ")}`);
  return tpl;
}

/** Check if a template ID is registered */
export function hasTemplate(id: string): boolean {
  return registry.has(id);
}

/** List all registered template IDs */
export function listTemplateIds(): string[] {
  return [...registry.keys()];
}

/** List all registered template definitions */
export function listTemplates(): TemplateDefinition[] {
  return [...registry.values()];
}

/**
 * Register a custom/external template at runtime.
 * Useful for plugin systems or user-defined templates.
 */
export function registerTemplate(tpl: TemplateDefinition): void {
  if (registry.has(tpl.id)) {
    console.warn(`Template "${tpl.id}" is being overwritten by registerTemplate()`);
  }
  registry.set(tpl.id, tpl);
}

/** Get the CSS blocks for all used templates in a set of template IDs */
export function collectTemplateCSS(templateIds: Set<string>): string[] {
  const blocks: string[] = [];
  for (const id of templateIds) {
    const tpl = registry.get(id);
    if (tpl?.chapterCSS) blocks.push(tpl.chapterCSS);
  }
  return blocks;
}

/** Required imports for a specific template */
export function getTemplateImports(id: string): string[] {
  return getTemplate(id).generate({ slots: {}, stepIdx: 0, chapterClass: "" }).imports;
}
