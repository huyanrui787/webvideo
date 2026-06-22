/**
 * Template Definition Types
 *
 * Each template is a standalone module. The compiler dispatches to templates
 * via the registry — no more monolithic switch statement.
 */

import type { z } from "zod";
import type { StyleOverrides, MediaRef } from "../types";

/** Context passed to every template's generate() function */
export interface TemplateContext {
  /** The template's content slots (validated against the template's Zod schema) */
  slots: Record<string, any>;
  /** Template visual variant */
  variant?: string;
  /** Shared style overrides */
  overrides?: StyleOverrides;
  /** 0-based step index within the chapter */
  stepIdx: number;
  /** CSS class slug for the chapter (e.g. "why-matter") */
  chapterClass: string;
}

/** Output from a template's generate() function */
export interface TemplateOutput {
  /** JSX body string for this step (or AST nodes in Phase 2) */
  jsx: string;
  /** Scoped CSS block for this template (emitted once per chapter) */
  css: string;
  /** Component/primitives that must be imported */
  imports: string[];
}

/**
 * A self-contained template definition.
 *
 * To add a new template: create a new file in this directory,
 * export a TemplateDefinition, and the registry auto-discovers it.
 */
export interface TemplateDefinition {
  /** Template ID — must match one of the TEMPLATE_IDS from types.ts */
  id: string;
  /** Human-readable description shown to AI and in UIs */
  description: string;
  /** Available visual variants */
  variants: string[];
  /** Zod schema for validating slots */
  slots: z.ZodObject<any>;
  /** Generate JSX + CSS for one step */
  generate: (ctx: TemplateContext) => TemplateOutput;
  /** Shared CSS block for this template (injected into chapter CSS) */
  chapterCSS: string;
}
