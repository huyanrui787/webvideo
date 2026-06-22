/**
 * Chapter Blueprint 类型系统
 *
 * 三层架构：
 *   Tier 1 — 模板模式 (template)：选模板 + 填槽位 → 覆盖 80% 场景
 *   Tier 2 — 组合模式 (composed)：拼装 primitives → 覆盖 15% 场景
 *   Tier 3 — 自定义模式 (custom)：手写 JSX/CSS 兜底 → 覆盖 5% 场景
 *
 * Blueprint 是纯 JSON 数据，不包含运行时代码。ChapterCompiler 负责
 * 将 blueprint 编译为可执行的 TSX / CSS / narrations.ts。
 */

import { z } from "zod";

// Import precise slot schemas from new templates for L2 validation
import { TimelineSlots } from "./templates/timeline";
import { ComparisonTableSlots } from "./templates/comparison-table";
import { BeforeAfterSlots } from "./templates/before-after";
import { AnatomySlots } from "./templates/anatomy";
import { ProgressBarSlots } from "./templates/progress-bar";
import { TestimonialSlots } from "./templates/testimonial";

// ═══════════════════════════════════════════════════════════════════════════════
// Template IDs
// ═══════════════════════════════════════════════════════════════════════════════

export const TEMPLATE_IDS = [
  "hero-title",
  "step-reveal",
  "data-spotlight",
  "side-by-side",
  "flow-diagram",
  "code-showcase",
  "quote-card",
  "grid-gallery",
  "timeline",
  "comparison-table",
  "before-after",
  "anatomy",
  "progress-bar",
  "testimonial",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

// ═══════════════════════════════════════════════════════════════════════════════
// Primitive IDs (existing + new)
// ═══════════════════════════════════════════════════════════════════════════════

export const PRIMITIVE_IDS = [
  "Reveal",
  "Stagger",
  "Counter",
  "DrawPath",
  "TypeWriter",
  "ParticleField",
  "NetworkGraph",
  "WaveForm",
  "MediaFrame",
  "CodeBlock",
  "DataChart",
] as const;

export type PrimitiveId = (typeof PRIMITIVE_IDS)[number];

// ═══════════════════════════════════════════════════════════════════════════════
// Shared slot value types
// ═══════════════════════════════════════════════════════════════════════════════

/** A reference to a project asset (image/video) */
export const MediaRef = z.object({
  type: z.enum(["image", "video"]),
  src: z.string().describe("URL path, e.g. /api/projects/{id}/assets/hero.jpg"),
  alt: z.string().optional(),
  fit: z.enum(["contain", "cover"]).default("contain").optional(),
  /** For illustration images: maintain 16:9 by setting width & height */
  width: z.number().optional(),
  height: z.number().optional(),
});
export type MediaRef = z.infer<typeof MediaRef>;

/** A single content block — text, media, or data */
export const ContentBlock = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), text: z.string() }),
  z.object({ kind: z.literal("media"), media: MediaRef }),
  z.object({
    kind: z.literal("stat"),
    value: z.string(),
    label: z.string(),
    trend: z.enum(["up", "down", "neutral"]).optional(),
  }),
]);
export type ContentBlock = z.infer<typeof ContentBlock>;

// ═══════════════════════════════════════════════════════════════════════════════
// Tier 1: Template mode — per-template slot schemas
// ═══════════════════════════════════════════════════════════════════════════════

/** Shared style overrides applicable to any template layout */
export const StyleOverrides = z.object({
  textAlign: z.enum(["left", "center", "right"]).optional(),
  accentColor: z.string().optional().describe("Override var(--accent) hue"),
  backgroundStyle: z
    .enum(["solid", "gradient-subtle", "gradient-bold", "noise"])
    .optional(),
  /** CSS class names to append to the step wrapper */
  extraClasses: z.string().optional(),
  /** Inline CSS custom properties to inject */
  customProperties: z.record(z.string(), z.string()).optional(),
});
export type StyleOverrides = z.infer<typeof StyleOverrides>;

// ── hero-title ────────────────────────────────────────────────────────────────

export const HeroTitleSlots = z.object({
  kicker: z.string().optional().describe("Small label above the title"),
  title: z.string().describe("Main title text, supports <em> for emphasis"),
  subtitle: z.string().optional().describe("Supporting text below title"),
  background: MediaRef.optional().describe("Background image/video"),
  logo: MediaRef.optional().describe("Small logo/icon"),
});
export type HeroTitleSlots = z.infer<typeof HeroTitleSlots>;

// ── step-reveal ───────────────────────────────────────────────────────────────

export const StepRevealItem = z.object({
  heading: z.string(),
  body: z.string().optional(),
  media: MediaRef.optional(),
  /** Highlight color badge / tag */
  badge: z.string().optional(),
});

export const StepRevealSlots = z.object({
  hook: z
    .object({
      type: z.enum(["stat", "quote", "question"]),
      content: z.string(),
      label: z.string().optional(),
    })
    .optional()
    .describe("Opening hook before the step list"),
  steps: z
    .array(StepRevealItem)
    .min(1)
    .max(8)
    .describe("Each step = one reveal item with heading + optional body/media"),
});
export type StepRevealSlots = z.infer<typeof StepRevealSlots>;
export type StepRevealItem = z.infer<typeof StepRevealItem>;

// ── data-spotlight ────────────────────────────────────────────────────────────

export const DataSpotlightSlots = z.object({
  primaryValue: z.string().describe("The big number/stat (e.g. '2048 tokens')"),
  primaryLabel: z.string().describe("What the number represents"),
  context: z
    .string()
    .optional()
    .describe("1-2 sentences explaining significance"),
  secondaryValues: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        trend: z.enum(["up", "down", "neutral"]).optional(),
      })
    )
    .max(4)
    .optional()
    .describe("Secondary comparison stats"),
  media: MediaRef.optional().describe("Supporting chart or diagram"),
});
export type DataSpotlightSlots = z.infer<typeof DataSpotlightSlots>;

// ── side-by-side ──────────────────────────────────────────────────────────────

export const SideBySidePanel = z.object({
  heading: z.string(),
  body: z.string().optional(),
  media: MediaRef.optional(),
  items: z.array(z.string()).optional().describe("Bullet points"),
});

export const SideBySideSlots = z.object({
  left: SideBySidePanel,
  right: SideBySidePanel,
  leftLabel: z.string().optional().describe("Label badge (e.g. '优化前', '方案 A')"),
  rightLabel: z.string().optional(),
  divider: z.enum(["vs", "arrow", "none"]).default("vs"),
});
export type SideBySideSlots = z.infer<typeof SideBySideSlots>;
export type SideBySidePanel = z.infer<typeof SideBySidePanel>;

// ── flow-diagram ──────────────────────────────────────────────────────────────

export const FlowNode = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  icon: z.string().optional().describe("Emoji or icon character"),
});

export const FlowDiagramSlots = z.object({
  nodes: z.array(FlowNode).min(2).max(10),
  edges: z
    .array(z.object({ from: z.string(), to: z.string(), label: z.string().optional() }))
    .optional()
    .describe("If omitted, nodes are connected sequentially"),
  highlightIndex: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Which node to highlight (0-indexed, for step-by-step build)"),
});
export type FlowDiagramSlots = z.infer<typeof FlowDiagramSlots>;
export type FlowNode = z.infer<typeof FlowNode>;

// ── code-showcase ─────────────────────────────────────────────────────────────

export const CodeAnnotation = z.object({
  lines: z.string().describe("Line range, e.g. '3-7' or '12'"),
  text: z.string().describe("Annotation text"),
  position: z.enum(["right", "bottom"]).default("right"),
});

export const CodeShowcaseSlots = z.object({
  code: z.string().describe("The code snippet (plain text)"),
  language: z.string().default("typescript"),
  filename: z.string().optional(),
  highlights: z
    .array(z.string())
    .optional()
    .describe("Line ranges to highlight, e.g. ['3-7', '12']"),
  annotations: z.array(CodeAnnotation).optional(),
  output: MediaRef.optional().describe("Screenshot/GIF of the running result"),
});
export type CodeShowcaseSlots = z.infer<typeof CodeShowcaseSlots>;
export type CodeAnnotation = z.infer<typeof CodeAnnotation>;

// ── quote-card ────────────────────────────────────────────────────────────────

export const QuoteCardSlots = z.object({
  quote: z.string().describe("The pull quote text"),
  attribution: z.string().optional().describe("Who said/wrote it"),
  context: z.string().optional().describe("Where it's from or relevance"),
  media: MediaRef.optional().describe("Portrait or decorative image"),
});
export type QuoteCardSlots = z.infer<typeof QuoteCardSlots>;

// ── grid-gallery ──────────────────────────────────────────────────────────────

export const GridItem = z.object({
  media: MediaRef,
  caption: z.string().optional(),
  tag: z.string().optional(),
});

export const GridGallerySlots = z.object({
  items: z.array(GridItem).min(2).max(12),
  columns: z.number().int().min(2).max(4).default(3),
  gap: z.enum(["sm", "md", "lg"]).default("md"),
});
export type GridGallerySlots = z.infer<typeof GridGallerySlots>;
export type GridItem = z.infer<typeof GridItem>;

// ═══════════════════════════════════════════════════════════════════════════════
// Tier 1: Template layout definition
// ═══════════════════════════════════════════════════════════════════════════════

/** Maps each template to its slot schema — legacy, kept for backwards compat.
 *  New code should import slot schemas directly from template modules. */
const SLOT_SCHEMAS = {
  "hero-title": HeroTitleSlots,
  "step-reveal": StepRevealSlots,
  "data-spotlight": DataSpotlightSlots,
  "side-by-side": SideBySideSlots,
  "flow-diagram": FlowDiagramSlots,
  "code-showcase": CodeShowcaseSlots,
  "quote-card": QuoteCardSlots,
  "grid-gallery": GridGallerySlots,
  "timeline": TimelineSlots,
  "comparison-table": ComparisonTableSlots,
  "before-after": BeforeAfterSlots,
  "anatomy": AnatomySlots,
  "progress-bar": ProgressBarSlots,
  "testimonial": TestimonialSlots,
} as const satisfies Record<TemplateId, z.ZodObject<any>>;

/** Legacy: get slot schema by template ID. Prefer importing directly from template module. */
export function getSlotSchema(template: TemplateId): z.ZodObject<any> {
  return SLOT_SCHEMAS[template];
}

export const TemplateLayout = z.object({
  mode: z.literal("template"),
  template: z.enum(TEMPLATE_IDS),
  /** Template-specific visual variant */
  variant: z.string().optional(),
  /** Content slots — schema depends on template */
  slots: z.record(z.string(), z.any()),
  overrides: StyleOverrides.optional(),
});
export type TemplateLayout = z.infer<typeof TemplateLayout>;

// ═══════════════════════════════════════════════════════════════════════════════
// Tier 2: Composed mode — primitives assembly
// ═══════════════════════════════════════════════════════════════════════════════

export const PrimitiveCall = z.object({
  primitive: z.enum(PRIMITIVE_IDS),
  params: z.record(z.string(), z.any()).default({}),
  /** CSS class name to wrap this primitive */
  className: z.string().optional(),
});

export const RegionDef = z.object({
  /** A single primitive or a list (rendered in order) */
  content: z.union([PrimitiveCall, z.array(PrimitiveCall)]),
  /** Position/sizing hints */
  gridArea: z.string().optional().describe("CSS grid-area name for grid layouts"),
  flex: z.string().optional().describe("flex shorthand for split layouts"),
  /** CSS that gets applied to the region container */
  style: z.record(z.string(), z.string()).optional(),
});

export const AnimationDef = z.object({
  target: z.string().describe("Region name to animate"),
  effect: z.enum(["fadeIn", "slideUp", "slideLeft", "slideRight", "scaleIn", "drawPath"]),
  delay: z.number().min(0).default(0).describe("Delay in seconds"),
  duration: z.number().positive().default(0.6).describe("Duration in seconds"),
});

export const ComposedLayout = z.object({
  mode: z.literal("composed"),
  /** Top-level layout strategy */
  layout: z.enum(["stack", "grid", "split", "center", "absolute"]),
  /** For grid: CSS grid-template definition */
  gridTemplate: z.string().optional().describe("e.g. '1fr 1fr / 1fr 1fr'"),
  /** Regions keyed by name, referenced by animations */
  regions: z.record(z.string(), RegionDef),
  /** Entrance animations */
  animations: z.array(AnimationDef).optional(),
  /** Optional CSS to inject for this step */
  extraCSS: z.string().optional(),
  overrides: StyleOverrides.optional(),
});
export type ComposedLayout = z.infer<typeof ComposedLayout>;

// ═══════════════════════════════════════════════════════════════════════════════
// Tier 3: Custom mode — raw code escape hatch
// ═══════════════════════════════════════════════════════════════════════════════

export const CustomLayout = z.object({
  mode: z.literal("custom"),
  /** Extra import statements to prepend */
  imports: z.array(z.string()).optional(),
  /** The JSX body for this step (must use design tokens, no hard-coded colors) */
  jsx: z.string().describe("JSX body — must use var(--token) for colors, var(--font-*) for fonts"),
  /** Scoped CSS for this step */
  css: z.string().optional(),
});
export type CustomLayout = z.infer<typeof CustomLayout>;

// ═══════════════════════════════════════════════════════════════════════════════
// Chapter Step Definition
// ═══════════════════════════════════════════════════════════════════════════════

export const LayoutDef = z.discriminatedUnion("mode", [
  TemplateLayout,
  ComposedLayout,
  CustomLayout,
]);
export type LayoutDef = z.infer<typeof LayoutDef>;

export const ChapterStepDef = z.object({
  /** Spoken narration for this step (empty string = silent transition) */
  narration: z.string().default(""),
  /** What appears on screen */
  layout: LayoutDef,
  /** Optional override: display duration in seconds */
  durationSec: z.number().positive().optional(),

  // ── 节奏控制 (pacing) ─────────────────────────────────────────────────
  pacing: z.object({
    /** 入场方式 */
    entry: z.enum(["reveal", "cut", "dissolve", "wipe", "push"]).default("cut"),
    /** 入场动画时长 ms */
    entryDurationMs: z.number().min(0).max(3000).default(400),
    /** 退场方式 */
    exit: z.enum(["hold", "dissolve", "cut", "slide-out"]).default("cut"),
    /** 退场动画时长 ms */
    exitDurationMs: z.number().min(0).max(3000).default(300),
    /** 切入后静默停顿 ms */
    preHoldMs: z.number().min(0).max(5000).default(0),
    /** 旁白结束后的停留 ms */
    postHoldMs: z.number().min(0).max(5000).default(500),
    /** 旁白与视觉的时序关系 */
    narrationTiming: z.enum(["sync", "visual-first", "audio-first"]).default("sync"),
    /** 能量级别 (影响 BGM 匹配和动画幅度) */
    energy: z.enum(["calm", "moderate", "high", "peak"]).optional(),
  }).optional(),

  /** 蒙太奇模式：多步快速切换，无旁白 */
  microSteps: z.array(z.object({
    layout: LayoutDef,
    holdMs: z.number().min(300).max(3000),
    transition: z.enum(["cut", "dissolve"]).default("cut"),
  })).max(8).optional().describe("蒙太奇连续切换，无旁白"),

  /** 素材绑定提示 */
  assetHint: z.object({
    assetName: z.string(),
    placement: z.enum(["fill", "overlay", "inset"]),
    prominence: z.enum(["primary", "secondary", "ambient"]),
  }).optional(),
});
export type ChapterStepDef = z.infer<typeof ChapterStepDef>;

// ═══════════════════════════════════════════════════════════════════════════════
// Full Chapter Blueprint
// ═══════════════════════════════════════════════════════════════════════════════

export const ChapterBlueprint = z.object({
  /** Chapter identifier, slug format (e.g. "why-matter", "02-solution") */
  chapterId: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Must be slug format"),
  /** Human-readable chapter title */
  title: z.string().min(1).max(100),
  /** Ordered steps — one per screen/narration segment */
  steps: z.array(ChapterStepDef).min(1).max(20),
  /** Optional: order hint for generated file naming */
  orderHint: z.number().int().min(0).optional(),

  // ── 章节转场 ───────────────────────────────────────────────────────────
  transition: z.object({
    into: z.enum(["fade-black", "dissolve", "slide", "zoom", "none"]).default("fade-black"),
    intoDurationMs: z.number().min(0).max(3000).default(600),
    outOf: z.enum(["fade-black", "dissolve", "slide", "zoom", "none"]).default("fade-black"),
    outOfDurationMs: z.number().min(0).max(3000).default(400),
    showTitleCard: z.boolean().default(true),
    titleCardDurationMs: z.number().min(500).max(5000).default(2000),
  }).optional(),

  // ── BGM 节拍同步 ───────────────────────────────────────────────────────
  bgmSync: z.object({
    bpm: z.number().positive().optional().describe("BGM beats per minute"),
    beatAlign: z.enum(["off", "chapter", "step"]).default("off").describe("对齐精度"),
    offsetBeats: z.number().int().min(0).default(0).describe("从第几拍开始"),
  }).optional(),
});
export type ChapterBlueprint = z.infer<typeof ChapterBlueprint>;

// ═══════════════════════════════════════════════════════════════════════════════
// Blueprint Generation Metadata (returned from LLM via ProjectSetChapter tool)
// ═══════════════════════════════════════════════════════════════════════════════

export const BlueprintMetadata = z.object({
  chapterId: z.string(),
  title: z.string(),
  stepCount: z.number().int(),
  templateCounts: z.record(z.enum(TEMPLATE_IDS), z.number()).optional(),
  customStepCount: z.number().int().default(0),
});
export type BlueprintMetadata = z.infer<typeof BlueprintMetadata>;
