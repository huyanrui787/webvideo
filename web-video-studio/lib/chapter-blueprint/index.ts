/**
 * Chapter Blueprint System v2
 *
 * Single-tier architecture: composed mode with 5 layouts × 42 primitives.
 * AI outputs JSON Blueprints → compiler generates TSX/CSS/narrations.
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
  StyleOverrides,
  PRIMITIVE_IDS,
  PRIMITIVE_PARAMS,
  PrimitiveCall,
  RegionDef,
  AnimationDef,
  WRAPPER_PRIMS,
  TEXT_PRIMS,
  DECOR_PRIMS,
} from "./types";

export type {
  ChapterBlueprint as ChapterBlueprintType,
  ChapterStepDef as ChapterStepDefType,
  PrimitiveId,
  LayoutDef as LayoutDefType,
  MediaRef,
  RegionDef as RegionDefType,
  PrimitiveCall as PrimitiveCallType,
  AnimationDef as AnimationDefType,
} from "./types";

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
