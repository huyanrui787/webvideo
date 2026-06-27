/**
 * Blueprint Validator v2 — 编译前校验
 *
 * 校验层级：
 *   L1: Zod schema 基础校验（类型、必填、格式）
 *   L2: 语义 + 信息密度校验（primitive 多样性、params 正确性、区域引用）
 *   L3: 设计约束校验（token 使用、字号下限、对比度）
 *
 * 校验结果包含 warnings（不阻塞编译）和 errors（阻塞编译）。
 */

import {
  ChapterBlueprint,
  PRIMITIVE_PARAMS,
  WRAPPER_PRIMS,
  TEXT_PRIMS,
  DECOR_PRIMS,
  type ChapterBlueprint as ChapterBlueprintType,
  type LayoutDef,
} from "./types";

// ═══════════════════════════════════════════════════════════════════════════════
// Result types
// ═══════════════════════════════════════════════════════════════════════════════

export interface ValidationIssue {
  level: "error" | "warning";
  step: number | null;
  field: string;
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
// L2: Semantic + Diversity validation
// ═══════════════════════════════════════════════════════════════════════════════

/** Collect all primitive calls from a single region (recursively into container children) */
function collectPrimsFromRegion(region: any): { primitive: string; params: Record<string, any> }[] {
  const result: { primitive: string; params: Record<string, any> }[] = [];

  // Nested LayoutDef: content is a full layout object
  if (region.content?.layout && region.content?.regions) {
    result.push(...collectPrimsFromLayout(region.content as LayoutDef));
    return result;
  }

  const contents = Array.isArray(region.content) ? region.content : (region.content ? [region.content] : []);
  for (const c of contents) {
    if (c?.primitive) {
      result.push({ primitive: c.primitive, params: c.params ?? {} });
    }
    if (c?.children) {
      for (const child of c.children) {
        result.push(...collectPrimsFromRegion(child));
      }
    }
  }
  return result;
}

/** Collect all primitives from a layout by iterating over its regions */
function collectPrimsFromLayout(layout: LayoutDef): { primitive: string; params: Record<string, any> }[] {
  const result: { primitive: string; params: Record<string, any> }[] = [];
  for (const region of Object.values(layout.regions ?? {})) {
    result.push(...collectPrimsFromRegion(region));
  }
  return result;
}

function validateL2(bp: ChapterBlueprintType): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (let i = 0; i < bp.steps.length; i++) {
    const step = bp.steps[i]!;
    const layout = step.layout as LayoutDef;

    // ── Animation target validation ─────────────────────────────────────
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

    // ── Grid layout needs gridTemplate ───────────────────────────────────
    if (layout.layout === "grid" && !layout.gridTemplate) {
      issues.push({
        level: "warning",
        step: i,
        field: `steps[${i}].layout.gridTemplate`,
        message: `Grid layout should specify gridTemplate for reliable positioning`,
      });
    }

    // ── Empty regions check ──────────────────────────────────────────────
    const regionCount = Object.keys(layout.regions).length;
    if (regionCount === 0) {
      issues.push({
        level: "error",
        step: i,
        field: `steps[${i}].layout.regions`,
        message: `No regions defined — screen will be completely empty`,
      });
    }
    if (regionCount > 8) {
      issues.push({
        level: "warning",
        step: i,
        field: `steps[${i}].layout.regions`,
        message: `${regionCount} regions may feel cluttered. Consider 3-6 for optimal clarity.`,
      });
    }

    // ── Primitive params validation ──────────────────────────────────────
    const allPrims = collectPrimsFromLayout(layout);
    for (const { primitive, params } of allPrims) {
      const schema = PRIMITIVE_PARAMS[primitive];
      if (schema) {
        const result = schema.safeParse(params);
        if (!result.success) {
          for (const err of result.error.issues) {
            issues.push({
              level: "error",
              step: i,
              field: `steps[${i}].layout.regions.<region>.content.${primitive}.params.${err.path.join(".")}`,
              message: `${primitive}: ${err.message}` +
                (err.code === "invalid_enum_value" && (err as any).options
                  ? `。有效值: ${(err as any).options.join(" | ")}`
                  : err.code === "invalid_type" && err.received === "undefined"
                  ? `（该字段是必填的）`
                  : ""),
            });
          }
        }
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // DIVERSITY CONSTRAINTS (new L2 hard rules)
    // ═════════════════════════════════════════════════════════════════════

    const contentPrims = allPrims
      .map((p) => p.primitive)
      .filter((p) => !WRAPPER_PRIMS.has(p as any));

    const distinctTypes = new Set(contentPrims);

    // Constraint 1: ≥ 2 distinct primitive types (warning if < 3)
    if (distinctTypes.size < 2) {
      issues.push({
        level: "error",
        step: i,
        field: `steps[${i}].layout`,
        message: `信息密度不足：只使用了 ${distinctTypes.size} 种 primitive（${[...distinctTypes].join(", ")}），至少需要 2 种。请增加数据图表、SVG 动画、媒体或装饰类元素。`,
      });
    } else if (distinctTypes.size < 3) {
      issues.push({
        level: "warning",
        step: i,
        field: `steps[${i}].layout`,
        message: `建议增加更多元素类型：当前只有 ${distinctTypes.size} 种 primitive（${[...distinctTypes].join(", ")}），建议 ≥ 3 种以获得更丰富的画面。`,
      });
    }

    // Constraint 2: Must include non-text primitives (PullQuote + decor is acceptable)
    const hasNonText = contentPrims.some((p) => !TEXT_PRIMS.has(p as any));
    const hasPullQuote = contentPrims.includes("PullQuote");
    if (!hasNonText && !hasPullQuote) {
      issues.push({
        level: "error",
        step: i,
        field: `steps[${i}].layout`,
        message: `全部为文字元素（${contentPrims.join(", ")}），缺少视觉元素。请添加图表、数据、媒体、SVG 动画或装饰类 primitive。`,
      });
    }

    // Constraint 3: Should include decor/animation (warning only)
    const hasDecorAnim = contentPrims.some((p) => DECOR_PRIMS.has(p as any));
    if (!hasDecorAnim && contentPrims.length > 0) {
      issues.push({
        level: "warning",
        step: i,
        field: `steps[${i}].layout`,
        message: `建议添加装饰或动画元素（如 Divider / ParticleField / GlowRing / Badge），增加画面丰富度。`,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHAPTER-LEVEL: pure-text step ratio ≤ 30%
  // ═══════════════════════════════════════════════════════════════════════

  const totalSteps = bp.steps.length;
  const textOnlySteps = bp.steps.filter((s) => {
    const layout = s.layout as LayoutDef;
    const prims = collectPrimsFromLayout(layout).map((p) => p.primitive);
    const contentPrims = prims.filter((p) => !WRAPPER_PRIMS.has(p as any));
    return contentPrims.length > 0 && contentPrims.every((p) => TEXT_PRIMS.has(p as any));
  }).length;

  if (textOnlySteps / totalSteps > 0.3) {
    issues.push({
      level: "error",
      step: null,
      field: "steps",
      message: `纯文字 step 占比 ${Math.round((textOnlySteps / totalSteps) * 100)}%（${textOnlySteps}/${totalSteps}），超过 30% 上限。${textOnlySteps} 个 step 需增加非文字元素（图表/数据/媒体/SVG/装饰）。`,
    });
  }

  return issues;
}

// ═══════════════════════════════════════════════════════════════════════════════
// L3: Design constraint validation
// ═══════════════════════════════════════════════════════════════════════════════

const HARDCODED_COLORS_RE = /#[0-9a-fA-F]{3,8}(?!\d)/;
const HARDCODED_FONT_RE = /font-family\s*:\s*(?!var\(--font)/;
const DEPRECATED_TOKENS_RE = /var\(--color-|var\(--bg-|var\(--border-/;
const HARDCODED_RADIUS_RE = /border-radius\s*:\s*(?!var\(--r|var\(--radius)/;
const HARDCODED_SHADOW_RE = /box-shadow\s*:\s*(?!var\(--s|var\(--shadow|none)/;
const HARDCODED_MOTION_RE = /cubic-bezier\([^)]+\)(?!\s*;)/;
const FONT_SIZE_RE = /font-size\s*:\s*(\d+)(px|pt)/g;
const WHITESPACE_ZERO_RE = /padding\s*:\s*0[^.]|margin\s*:\s*0[^.]/;
const NARRATION_MAX_CHARS = 500;
const STEPS_MAX = 12;

function validateL3(bp: ChapterBlueprintType): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (bp.steps.length > STEPS_MAX) {
    issues.push({
      level: "warning",
      step: null,
      field: "steps",
      message: `Chapter has ${bp.steps.length} steps (recommended max: ${STEPS_MAX}). Consider splitting.`,
    });
  }

  for (let i = 0; i < bp.steps.length; i++) {
    const step = bp.steps[i]!;
    const layout = step.layout as LayoutDef;

    const narrationLen = (step.narration || "").length;
    if (narrationLen > NARRATION_MAX_CHARS) {
      issues.push({
        level: "warning",
        step: i,
        field: `steps[${i}].narration`,
        message: `Narration is ${narrationLen} chars (max: ${NARRATION_MAX_CHARS}).`,
      });
    }

    // Check extraCSS for design token violations
    const css = layout.extraCSS ?? "";
    if (css) {
      if (HARDCODED_COLORS_RE.test(css)) {
        issues.push({ level: "warning", step: i, field: `steps[${i}].layout.extraCSS`,
          message: `extraCSS contains hardcoded hex colors. Use var(--token) instead.` });
      }
      if (HARDCODED_FONT_RE.test(css)) {
        issues.push({ level: "warning", step: i, field: `steps[${i}].layout.extraCSS`,
          message: `extraCSS contains hardcoded font-family. Use var(--font-*) instead.` });
      }
      if (DEPRECATED_TOKENS_RE.test(css)) {
        issues.push({ level: "warning", step: i, field: `steps[${i}].layout.extraCSS`,
          message: `extraCSS references deprecated tokens.` });
      }
      if (WHITESPACE_ZERO_RE.test(css) && !/padding\s*:\s*0\s+\d|margin\s*:\s*0\s+\d/.test(css)) {
        issues.push({ level: "warning", step: i, field: `steps[${i}].layout.extraCSS`,
          message: `Padding/margin appear to be zero — visual may feel cramped.` });
      }

      let fsMatch: RegExpExecArray | null;
      while ((fsMatch = FONT_SIZE_RE.exec(css)) !== null) {
        const px = parseInt(fsMatch[1], 10);
        if (px < 14) {
          issues.push({ level: "warning", step: i, field: `steps[${i}].layout.extraCSS`,
            message: `Font size ${px}px may be too small for 1920×1080 video.` });
          break;
        }
      }
    }
  }

  return issues;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Post-compilation checks
// ═══════════════════════════════════════════════════════════════════════════════

export function validateGenerated(tsx: string, stepCount: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const stepBlockMatches = tsx.match(/if\s*\(\s*step\s*===\s*\d+\s*\)/g);
  const blockCount = stepBlockMatches?.length ?? 0;
  if (blockCount !== stepCount) {
    issues.push({
      level: "error", step: null, field: "generated.tsx",
      message: `Generated TSX has ${blockCount} step blocks but blueprint declares ${stepCount} steps`,
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

  if (!bp || typeof bp !== "object") {
    return {
      validated: null,
      result: {
        valid: false,
        issues: [{ level: "error", step: null, field: "root", message: "Blueprint must be a non-null object" }],
      },
    };
  }

  // L0: Detect old template/custom blueprints and give clear error
  const raw = bp as any;
  if (raw?.steps) {
    for (let i = 0; i < raw.steps.length; i++) {
      const mode = raw.steps[i]?.layout?.mode;
      if (mode === "template" || mode === "custom") {
        allIssues.push({
          level: "error",
          step: i,
          field: `steps[${i}].layout.mode`,
          message: `Blueprint v2 不再支持 "${mode}" 模式。请使用 composed 模式：去掉 mode/template/slots 字段，直接用 layout + regions + animations。参考 PRIMITIVES.md 的 42 种 primitive。`,
        });
      }
    }
  }

  // L1
  allIssues.push(...validateL1(bp as ChapterBlueprintType));
  if (allIssues.some((i) => i.level === "error")) {
    return { validated: null, result: { valid: false, issues: allIssues } };
  }

  const parsed = bp as ChapterBlueprintType;

  // L2
  allIssues.push(...validateL2(parsed));

  // L3
  allIssues.push(...validateL3(parsed));

  const hasErrors = allIssues.some((i) => i.level === "error");

  return {
    validated: hasErrors ? null : parsed,
    result: { valid: !hasErrors, issues: allIssues },
  };
}

export function formatValidationResult(result: ValidationResult): string {
  if (result.issues.length === 0) return "✅ Blueprint 校验通过，无问题。";

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
