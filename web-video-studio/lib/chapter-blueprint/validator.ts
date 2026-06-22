/**
 * Blueprint Validator — 编译前校验
 *
 * 校验层级：
 *   L1: Zod schema 基础校验（类型、必填、格式）
 *   L2: 语义校验（槽位完整性、引用正确性、步骤一致性）
 *   L3: 约束校验（16:9 比例、token 使用、设计规范）
 *
 * 校验结果包含 warnings（不阻塞编译）和 errors（阻塞编译）。
 */

import {
  ChapterBlueprint,
  type ChapterBlueprint as ChapterBlueprintType,
} from "./types";
import { getTemplate } from "./templates/registry";

// ═══════════════════════════════════════════════════════════════════════════════
// Result types
// ═══════════════════════════════════════════════════════════════════════════════

export interface ValidationIssue {
  level: "error" | "warning";
  step: number | null; // null = chapter-level issue
  field: string; // dot-separated path, e.g. "steps[0].layout.slots.title"
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// L1: Zod schema validation
// ═══════════════════════════════════════════════════════════════════════════════

function validateL1(bp: ChapterBlueprintType): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const result = ChapterBlueprint.safeParse(bp);
  if (!result.success) {
    for (const err of result.error.issues) {
      issues.push({
        level: "error",
        step: null,
        field: err.path.join("."),
        message: err.message,
      });
    }
  }

  return issues;
}

// ═══════════════════════════════════════════════════════════════════════════════
// L2: Semantic validation
// ═══════════════════════════════════════════════════════════════════════════════

function validateL2(bp: ChapterBlueprintType): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (let i = 0; i < bp.steps.length; i++) {
    const step = bp.steps[i]!;
    const layout = step.layout;

    if (layout.mode === "template") {
      // Validate that the slots match the template's expected schema (via registry)
      const tpl = getTemplate(layout.template);
      const slotsResult = tpl.slots.safeParse(layout.slots);
      if (!slotsResult.success) {
        for (const err of slotsResult.error.issues) {
          issues.push({
            level: "error",
            step: i,
            field: `steps[${i}].layout.slots.${err.path.join(".")}`,
            message: `Template "${layout.template}": ${err.message}`,
          });
        }
      }
    }

    if (layout.mode === "composed") {
      // Check that all regions referenced by animations exist
      if (layout.animations) {
        for (const anim of layout.animations) {
          if (!(anim.target in layout.regions)) {
            issues.push({
              level: "error",
              step: i,
              field: `steps[${i}].layout.animations`,
              message: `Animation targets region "${anim.target}" which doesn't exist in regions`,
            });
          }
        }
      }

      // Check that grid layout has gridTemplate
      if (layout.layout === "grid" && !layout.gridTemplate) {
        issues.push({
          level: "warning",
          step: i,
          field: `steps[${i}].layout.gridTemplate`,
          message: `Grid layout should specify gridTemplate for reliable positioning`,
        });
      }
    }

    if (layout.mode === "custom") {
      // Basic JSX sanity check
      if (!layout.jsx.trim().startsWith("<")) {
        issues.push({
          level: "warning",
          step: i,
          field: `steps[${i}].layout.jsx`,
          message: `Custom JSX doesn't appear to start with a JSX element — this may fail at runtime`,
        });
      }
    }
  }

  return issues;
}

// ═══════════════════════════════════════════════════════════════════════════════
// L3: Constraint validation (best practices / design system rules)
// ═══════════════════════════════════════════════════════════════════════════════

const HARDCODED_COLORS_RE = /#[0-9a-fA-F]{3,8}(?!\d)/;
const HARDCODED_FONT_RE = /font-family\s*:\s*(?!var\(--font)/;
const DEPRECATED_TOKENS_RE = /var\(--color-|var\(--bg-|var\(--border-/;
const HARDCODED_RADIUS_RE = /border-radius\s*:\s*(?!var\(--r|var\(--radius)/;
const HARDCODED_SHADOW_RE = /box-shadow\s*:\s*(?!var\(--s|var\(--shadow|none)/;
const HARDCODED_MOTION_RE = /cubic-bezier\([^)]+\)(?!\s*;)/;

function validateL3(bp: ChapterBlueprintType): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (let i = 0; i < bp.steps.length; i++) {
    const step = bp.steps[i]!;
    const layout = step.layout;

    // Check for hardcoded colors in custom CSS/JSX
    if (layout.mode === "custom") {
      if (layout.css) {
        if (HARDCODED_COLORS_RE.test(layout.css)) {
          issues.push({
            level: "warning",
            step: i,
            field: `steps[${i}].layout.css`,
            message: `Custom CSS contains hardcoded hex colors. Use var(--token) instead to support theme switching.`,
          });
        }
        if (HARDCODED_FONT_RE.test(layout.css)) {
          issues.push({
            level: "warning",
            step: i,
            field: `steps[${i}].layout.css`,
            message: `Custom CSS contains hardcoded font-family. Use var(--font-*) tokens instead.`,
          });
        }
        if (DEPRECATED_TOKENS_RE.test(layout.css)) {
          issues.push({
            level: "warning",
            step: i,
            field: `steps[${i}].layout.css`,
            message: `CSS references deprecated tokens (var(--color-*), var(--bg-*), var(--border-*)). Use var(--text), var(--accent), var(--surface) instead.`,
          });
        }
        if (HARDCODED_RADIUS_RE.test(layout.css)) {
          issues.push({
            level: "warning",
            step: i,
            field: `steps[${i}].layout.css`,
            message: `CSS contains hardcoded border-radius. Use var(--radius-sm), var(--radius-md), var(--radius-lg) or var(--r-card) from the theme.`,
          });
        }
        if (HARDCODED_SHADOW_RE.test(layout.css)) {
          issues.push({
            level: "warning",
            step: i,
            field: `steps[${i}].layout.css`,
            message: `CSS contains hardcoded box-shadow. Use var(--shadow-sm), var(--shadow-md), var(--shadow-lg), or theme shadow tokens.`,
          });
        }
        if (HARDCODED_MOTION_RE.test(layout.css)) {
          issues.push({
            level: "warning",
            step: i,
            field: `steps[${i}].layout.css`,
            message: `CSS contains hardcoded cubic-bezier(). Use var(--motion-snappy), var(--motion-smooth), var(--motion-gentle), var(--motion-spring), or var(--motion-linear).`,
          });
        }
      }

      if (HARDCODED_COLORS_RE.test(layout.jsx)) {
        issues.push({
          level: "warning",
          step: i,
          field: `steps[${i}].layout.jsx`,
          message: `JSX contains hardcoded hex colors. Use var(--token) instead.`,
        });
      }
    }

    // Template-specific constraint checks
    if (layout.mode === "template" && layout.slots) {
      const slots = layout.slots as Record<string, any>;

      // hero-title: check for empty required fields
      if (layout.template === "hero-title" && !slots.title?.trim()) {
        issues.push({
          level: "error",
          step: i,
          field: `steps[${i}].layout.slots.title`,
          message: `hero-title template requires a non-empty title`,
        });
      }

      // step-reveal: check that each step item has content
      if (layout.template === "step-reveal" && Array.isArray(slots.steps)) {
        for (let si = 0; si < slots.steps.length; si++) {
          const item = slots.steps[si];
          if (!item.heading?.trim()) {
            issues.push({
              level: "warning",
              step: i,
              field: `steps[${i}].layout.slots.steps[${si}].heading`,
              message: `step-reveal item ${si} has an empty heading — screen may appear blank`,
            });
          }
        }
      }

      // quote-card: require quote text
      if (layout.template === "quote-card" && !slots.quote?.trim()) {
        issues.push({
          level: "error",
          step: i,
          field: `steps[${i}].layout.slots.quote`,
          message: `quote-card template requires a non-empty quote`,
        });
      }

      // grid-gallery: require at least 2 items
      if (layout.template === "grid-gallery" && (!Array.isArray(slots.items) || slots.items.length < 2)) {
        issues.push({
          level: "warning",
          step: i,
          field: `steps[${i}].layout.slots.items`,
          message: `grid-gallery is designed for 2+ items. Consider a different template for single images.`,
        });
      }
    }
  }

  return issues;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Post-compilation: quick structural checks on generated output
// ═══════════════════════════════════════════════════════════════════════════════

export function validateGenerated(tsx: string, stepCount: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check that stepCount matches if/else if blocks
  const stepBlockMatches = tsx.match(/if\s*\(\s*step\s*===\s*\d+\s*\)/g);
  const blockCount = stepBlockMatches?.length ?? 0;

  if (blockCount !== stepCount) {
    issues.push({
      level: "error",
      step: null,
      field: "generated.tsx",
      message: `Generated TSX has ${blockCount} step blocks but blueprint declares ${stepCount} steps`,
    });
  }

  // Check for missing component import
  if (tsx.includes("import { ") && !tsx.includes("from")) {
    issues.push({
      level: "error",
      step: null,
      field: "generated.tsx",
      message: `Generated TSX has a broken import statement`,
    });
  }

  return issues;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main entry point
// ═══════════════════════════════════════════════════════════════════════════════

export function validateBlueprint(
  bp: unknown
): { validated: ChapterBlueprintType | null; result: ValidationResult } {
  const allIssues: ValidationIssue[] = [];

  // L0: Quick type check — is it even an object with the expected shape?
  if (!bp || typeof bp !== "object") {
    return {
      validated: null,
      result: {
        valid: false,
        issues: [{ level: "error", step: null, field: "root", message: "Blueprint must be a non-null object" }],
      },
    };
  }

  // L1: Zod schema
  allIssues.push(...validateL1(bp as ChapterBlueprintType));

  // If L1 failed, we can't proceed to L2/L3 safely
  const hasErrors = allIssues.some((i) => i.level === "error");
  if (hasErrors) {
    return {
      validated: null,
      result: { valid: false, issues: allIssues },
    };
  }

  const parsed = bp as ChapterBlueprintType;

  // L2: Semantic
  allIssues.push(...validateL2(parsed));

  // L3: Constraints
  allIssues.push(...validateL3(parsed));

  const stillHasErrors = allIssues.some((i) => i.level === "error");

  return {
    validated: stillHasErrors ? null : parsed,
    result: {
      valid: !stillHasErrors,
      issues: allIssues,
    },
  };
}

/**
 * Human-readable summary of validation issues, suitable for showing
 * to the LLM so it can fix its blueprint.
 */
export function formatValidationResult(result: ValidationResult): string {
  if (result.issues.length === 0) {
    return "✅ Blueprint 校验通过，无问题。";
  }

  const errors = result.issues.filter((i) => i.level === "error");
  const warnings = result.issues.filter((i) => i.level === "warning");

  const lines: string[] = [];

  if (errors.length > 0) {
    lines.push(`❌ ${errors.length} 个错误（必须修复）：`);
    for (const e of errors) {
      const loc = e.step !== null ? `步骤 ${e.step}` : "章节级别";
      lines.push(`  - [${loc}] ${e.field}: ${e.message}`);
    }
  }

  if (warnings.length > 0) {
    lines.push(`\n⚠️  ${warnings.length} 个警告（建议修复）：`);
    for (const w of warnings) {
      const loc = w.step !== null ? `步骤 ${w.step}` : "章节级别";
      lines.push(`  - [${loc}] ${w.field}: ${w.message}`);
    }
  }

  return lines.join("\n");
}
