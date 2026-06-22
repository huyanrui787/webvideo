/**
 * Chapter Blueprint System
 *
 * Three-tier architecture for AI-generated video chapters:
 *   Tier 1 (template): Pick a template, fill content slots → 80% of use cases
 *   Tier 2 (composed): Assemble primitives → 15% of use cases
 *   Tier 3 (custom):   Hand-written JSX/CSS escape hatch → 5% of use cases
 *
 * Usage:
 *   import { validateBlueprint, compileChapter } from "@/lib/chapter-blueprint";
 *
 *   const { validated, result } = validateBlueprint(rawJson);
 *   if (!validated) throw new Error(formatValidationResult(result));
 *   const generated = compileChapter(validated);
 *   // Write generated.tsx, generated.css, generated.narrations to disk
 */

export {
  ChapterBlueprint,
  ChapterStepDef,
  LayoutDef,
  TemplateLayout,
  ComposedLayout,
  CustomLayout,
  StyleOverrides,
  TEMPLATE_IDS,
  PRIMITIVE_IDS,
  getSlotSchema,
} from "./types";

export type {
  ChapterBlueprint as ChapterBlueprintType,
  ChapterStepDef as ChapterStepDefType,
  TemplateId,
  PrimitiveId,
  TemplateLayout as TemplateLayoutType,
  ComposedLayout as ComposedLayoutType,
  CustomLayout as CustomLayoutType,
  HeroTitleSlots,
  StepRevealSlots,
  StepRevealItem,
  DataSpotlightSlots,
  SideBySideSlots,
  SideBySidePanel,
  FlowDiagramSlots,
  FlowNode,
  CodeShowcaseSlots,
  CodeAnnotation,
  QuoteCardSlots,
  GridGallerySlots,
  GridItem,
  MediaRef,
} from "./types";

// Template registry — public API for extensibility
export {
  getTemplate,
  hasTemplate,
  listTemplateIds,
  listTemplates,
  registerTemplate,
  collectTemplateCSS,
  getTemplateImports,
} from "./templates/registry";

export type {
  TemplateDefinition,
  TemplateContext,
  TemplateOutput,
} from "./templates/types";

export {
  compileChapter,
  compileRegistry,
  type GeneratedChapter,
} from "./compiler";

export {
  validateBlueprint,
  validateGenerated,
  formatValidationResult,
  type ValidationResult,
  type ValidationIssue,
} from "./validator";
