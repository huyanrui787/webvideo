/**
 * Chapter Blueprint 类型系统 v2
 *
 * 单层架构 — composed 模式（积木拼装）：
 *   5 种布局 × 42 种 primitive × 嵌套区域 → 覆盖全部场景
 *
 * Blueprint 是纯 JSON 数据，不包含运行时代码。ChapterCompiler 负责
 * 将 blueprint 编译为可执行的 TSX / CSS / narrations.ts。
 */

import { z } from "zod";

// ═══════════════════════════════════════════════════════════════════════════════
// Primitive IDs — 42 种视觉积木
// ═══════════════════════════════════════════════════════════════════════════════

export const PRIMITIVE_IDS = [
  // ── 文字 (6) ──
  "Headline",
  "Body",
  "Kicker",
  "PullQuote",
  "Caption",
  "TypeWriter",
  // ── 数据 (7) ──
  "Counter",
  "StatCard",
  "BigNumber",
  "BarChart",
  "LineChart",
  "PieChart",
  "Gauge",
  // ── 媒体 (4) ──
  "ImageFrame",
  "VideoFrame",
  "Avatar",
  "LottiePlayer",
  // ── 布局容器 (5) ──
  "Grid",
  "FlexRow",
  "FlexCol",
  "Split",
  "Card",
  // ── 装饰 (7) ──
  "Divider",
  "Badge",
  "BorderBox",
  "GradientBg",
  "NoiseBg",
  "PatternBg",
  "GlowRing",
  // ── 动画/SVG (7) ──
  "DrawPath",
  "ParticleField",
  "WaveForm",
  "MagneticField",
  "CircuitFlow",
  "TextGlow",
  "SvgReveal",
  // ── 图表/图示 (5) ──
  "NetworkGraph",
  "TimelineItem",
  "ProcessArrow",
  "VennDiagram",
  "GeoGlobe",
  // ── GSAP 动画 (18) ──
  "StickMan",
  "BarRace",
  "FaceMorph",
  "LiquidPour",
  "PlantGrow",
  "GearMechanism",
  "CalendarFlip",
  "Constellation",
  "RocketLaunch",
  "HandGesture",
  "FunnelFilter",
  "DominoEffect",
  "Storm2Calm",
  "Hourglass",
  "PuzzleAssembly",
  "PaperPlane",
  "HologramReveal",
  "Volcano",
  "CowCharacter",
  "MoonPhase",
  "FlowChart",
  "LineDraw",
  "LoadingAnim",
  "GameScene",
  "Editorial",
      // ── 包装器 (2，不计入 diversity) ──
  "Reveal",
  "Stagger",
] as const;

export type PrimitiveId = (typeof PRIMITIVE_IDS)[number];

/** 不计入信息密度计数的包装器 */
export const WRAPPER_PRIMS = new Set<PrimitiveId>(["Reveal", "Stagger"]);

/** 文字类 primitive */
export const TEXT_PRIMS = new Set<PrimitiveId>([
  "Headline", "Body", "Kicker", "PullQuote", "Caption", "TypeWriter",
]);

/** 装饰/动画类 primitive */
export const DECOR_PRIMS = new Set<PrimitiveId>([
  "Divider", "Badge", "BorderBox", "GradientBg", "NoiseBg", "PatternBg", "GlowRing",
  "DrawPath", "ParticleField", "WaveForm", "MagneticField", "CircuitFlow",
  "TextGlow", "SvgReveal",
]);

// ═══════════════════════════════════════════════════════════════════════════════
// Shared types
// ═══════════════════════════════════════════════════════════════════════════════

export const MediaRef = z.object({
  type: z.enum(["image", "video"]),
  src: z.string().describe("URL path, e.g. /api/projects/{id}/assets/hero.jpg"),
  alt: z.string().optional(),
  fit: z.enum(["contain", "cover"]).default("contain").optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});
export type MediaRef = z.infer<typeof MediaRef>;

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

export const StyleOverrides = z.object({
  textAlign: z.enum(["left", "center", "right"]).optional(),
  accentColor: z.string().optional().describe("Override var(--accent) hue"),
  backgroundStyle: z
    .enum(["solid", "gradient-subtle", "gradient-bold", "noise"])
    .optional(),
  extraClasses: z.string().optional(),
  customProperties: z.record(z.string(), z.string()).optional(),
});
export type StyleOverrides = z.infer<typeof StyleOverrides>;

// ═══════════════════════════════════════════════════════════════════════════════
// Primitive params schemas (type-safe params for each primitive)
// ═══════════════════════════════════════════════════════════════════════════════

// ── 文字 ──

export const HeadlineParams = z.object({
  text: z.string(),
  scale: z.enum(["hero", "data", "quote", "sub", "body", "kicker"]).default("hero"),
});
export const BodyParams = z.object({
  text: z.string(),
  align: z.enum(["left", "center", "right"]).default("left"),
});
export const KickerParams = z.object({
  text: z.string(),
  color: z.string().optional(),
});
export const PullQuoteParams = z.object({
  text: z.string(),
  attribution: z.string().optional(),
  context: z.string().optional(),
});
export const CaptionParams = z.object({ text: z.string() });
export const TypeWriterParams = z.object({
  text: z.string(),
  speed: z.number().min(10).max(200).default(60),
  cursor: z.boolean().default(true),
  scale: z.enum(["hero", "data", "quote", "sub", "body", "kicker"]).default("body"),
});

// ── 数据 ──

export const CounterParams = z.object({
  to: z.number(),
  from: z.number().default(0),
  unit: z.string().default(""),
  prefix: z.string().default(""),
  duration: z.number().default(1.2),
  decimals: z.number().default(0),
  delay: z.number().default(0),
});
export const StatCardParams = z.object({
  value: z.string(),
  label: z.string(),
  trend: z.enum(["up", "down", "neutral"]).optional(),
});
export const BigNumberParams = z.object({
  value: z.string(),
  unit: z.string().default(""),
  label: z.string().default(""),
});
export const BarChartParams = z.object({
  data: z.array(z.object({ label: z.string(), value: z.number(), color: z.string().optional() })),
  showLabels: z.boolean().default(true),
  duration: z.number().default(1.4),
});
export const LineChartParams = z.object({
  series: z.array(z.object({
    label: z.string(),
    points: z.array(z.object({ x: z.union([z.string(), z.number()]), y: z.number() })),
    color: z.string().optional(),
  })),
  duration: z.number().default(1.5),
});
export const PieChartParams = z.object({
  slices: z.array(z.object({ value: z.number(), label: z.string().optional(), color: z.string().optional() })),
  innerRadius: z.number().min(0).max(1).default(0),
  showLabels: z.boolean().default(true),
  duration: z.number().default(1.4),
});
export const GaugeParams = z.object({
  value: z.number().default(0),
  max: z.number().default(100),
  label: z.string().default(""),
  unit: z.string().default(""),
  color: z.string().optional(),
  startAngle: z.number().default(135),
  sweepAngle: z.number().default(270),
  duration: z.number().default(1.2),
});

// ── 媒体 ──

export const ImageFrameParams = z.object({
  src: z.string(),
  fit: z.enum(["contain", "cover"]).default("cover"),
  rounded: z.boolean().default(true),
  shadow: z.boolean().default(false),
});
export const VideoFrameParams = z.object({
  src: z.string(),
  fit: z.enum(["contain", "cover"]).default("cover"),
  autoplay: z.boolean().default(true),
});
export const AvatarParams = z.object({
  src: z.string(),
  size: z.number().default(64),
  shape: z.enum(["circle", "square"]).default("circle"),
});
export const LottiePlayerParams = z.object({
  src: z.string(),
  loop: z.boolean().default(true),
  speed: z.number().default(1),
  clipDuration: z.number().default(3),
});

// ── 布局容器 ──

export const ContainerParams = z.object({
  gap: z.enum(["sm", "md", "lg"]).default("md"),
  align: z.enum(["start", "center", "end", "stretch"]).default("center"),
});
export const GridParams = ContainerParams.extend({
  columns: z.number().int().min(1).max(4).default(2),
});
export const SplitParams = z.object({
  ratio: z.string().default("1fr 1fr"),
  divider: z.enum(["none", "vs", "arrow", "line"]).default("line"),
  leftLabel: z.string().optional(),
  rightLabel: z.string().optional(),
});
export const CardParams = z.object({
  padding: z.enum(["none", "sm", "md", "lg"]).default("md"),
  border: z.boolean().default(true),
  shadow: z.boolean().default(true),
});

// ── 装饰 ──

export const DividerParams = z.object({
  direction: z.enum(["horizontal", "vertical"]).default("horizontal"),
  style: z.enum(["solid", "dashed", "gradient"]).default("solid"),
  color: z.string().optional(),
});
export const BadgeParams = z.object({
  text: z.string(),
  color: z.string().optional(),
  size: z.enum(["sm", "md"]).default("md"),
});
export const BorderBoxParams = z.object({
  borderWidth: z.number().default(2),
  borderColor: z.string().optional(),
  padding: z.enum(["none", "sm", "md", "lg"]).default("md"),
});
export const GradientBgParams = z.object({
  from: z.string().default("var(--accent)"),
  to: z.string().default("transparent"),
  direction: z.enum(["to-b", "to-r", "to-br", "to-t"]).default("to-b"),
  opacity: z.number().min(0).max(1).default(0.15),
});
export const NoiseBgParams = z.object({
  opacity: z.number().min(0).max(1).default(0.05),
});
export const PatternBgParams = z.object({
  pattern: z.enum(["dots", "grid", "diagonal", "crosshatch"]).default("dots"),
  opacity: z.number().min(0).max(1).default(0.08),
  color: z.string().optional(),
});
export const GlowRingParams = z.object({
  color: z.string().optional(),
  size: z.number().default(200),
  pulseSpeed: z.number().default(2),
});

// ── 动画/SVG ──

export const DrawPathParams = z.object({
  d: z.string().describe("SVG path data, e.g. 'M 0 540 L 1920 540'"),
  strokeWidth: z.number().default(3),
  color: z.string().optional(),
  duration: z.number().default(2),
});
export const ParticleFieldParams = z.object({
  behavior: z.enum(["flow", "burst", "orbit", "rain"]).default("flow"),
  count: z.number().default(80),
  color: z.string().optional(),
  speed: z.number().default(1),
});
export const WaveFormParams = z.object({
  variant: z.enum(["sine", "pulse", "noise", "bars"]).default("sine"),
  cycles: z.number().default(2),
  amplitude: z.number().default(0.15),
  color: z.string().optional(),
});
export const MagneticFieldParams = z.object({
  lineCount: z.number().default(12),
  showParticles: z.boolean().default(true),
  color: z.string().optional(),
  accentColor: z.string().optional(),
});
export const CircuitFlowParams = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    x: z.number(), y: z.number(),
    type: z.enum(["ic", "resistor", "capacitor", "dot"]).default("dot"),
    label: z.string().optional(),
  })),
  wires: z.array(z.object({
    from: z.string(), to: z.string(),
    via: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
  })),
  showCurrent: z.boolean().default(true),
  duration: z.number().default(2),
});
export const TextGlowParams = z.object({
  text: z.string(),
  color: z.string().optional(),
  intensity: z.number().default(1),
});
export const SvgRevealParams = z.object({
  drawPath: z.string().optional(),
  duration: z.number().default(1.5),
});

// ── 图表/图示 ──

export const NetworkGraphParams = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    highlight: z.boolean().default(false),
  })),
  edges: z.array(z.object({
    from: z.string(), to: z.string(),
    label: z.string().optional(),
  })).optional(),
  visibleNodes: z.number().int().optional(),
  layout: z.enum(["horizontal", "vertical", "radial"]).default("horizontal"),
});
export const TimelineItemParams = z.object({
  date: z.string(),
  heading: z.string(),
  body: z.string().optional(),
  highlight: z.boolean().default(false),
});
export const ProcessArrowParams = z.object({
  steps: z.array(z.object({ label: z.string(), description: z.string().optional() })),
  direction: z.enum(["horizontal", "vertical"]).default("horizontal"),
});
export const VennDiagramParams = z.object({
  sets: z.array(z.object({
    label: z.string(),
    size: z.number(),
    color: z.string().optional(),
    items: z.array(z.string()).optional(),
  })).min(2).max(4),
});
export const GeoGlobeParams = z.object({
  highlightRegions: z.array(z.string()).optional(),
  rotationSpeed: z.number().default(0.3),
});

// ── 包装器 ──

export const RevealParams = z.object({
  from: z.enum(["up", "down", "left", "right", "none"]).default("up"),
  delay: z.number().default(0),
  duration: z.number().default(0.7),
  distance: z.number().default(32),
});
export const StaggerParams = z.object({
  interval: z.number().default(0.12),
  delay: z.number().default(0),
  duration: z.number().default(0.6),
  from: z.enum(["up", "down", "left", "right", "none"]).default("up"),
});

/** Map primitive ID → Zod params schema */
export const PRIMITIVE_PARAMS: Record<string, z.ZodObject<any>> = {
  Headline: HeadlineParams, Body: BodyParams, Kicker: KickerParams,
  PullQuote: PullQuoteParams, Caption: CaptionParams, TypeWriter: TypeWriterParams,
  Counter: CounterParams, StatCard: StatCardParams, BigNumber: BigNumberParams,
  BarChart: BarChartParams, LineChart: LineChartParams, PieChart: PieChartParams,
  Gauge: GaugeParams,
  ImageFrame: ImageFrameParams, VideoFrame: VideoFrameParams,
  Avatar: AvatarParams, LottiePlayer: LottiePlayerParams,
  Grid: GridParams, FlexRow: ContainerParams, FlexCol: ContainerParams,
  Split: SplitParams, Card: CardParams,
  Divider: DividerParams, Badge: BadgeParams, BorderBox: BorderBoxParams,
  GradientBg: GradientBgParams, NoiseBg: NoiseBgParams,
  PatternBg: PatternBgParams, GlowRing: GlowRingParams,
  DrawPath: DrawPathParams, ParticleField: ParticleFieldParams,
  WaveForm: WaveFormParams, MagneticField: MagneticFieldParams,
  CircuitFlow: CircuitFlowParams, TextGlow: TextGlowParams,
  SvgReveal: SvgRevealParams,
  NetworkGraph: NetworkGraphParams, TimelineItem: TimelineItemParams,
  ProcessArrow: ProcessArrowParams, VennDiagram: VennDiagramParams,
  GeoGlobe: GeoGlobeParams,
  Reveal: RevealParams, Stagger: StaggerParams,
  StickMan: z.object({ action: z.enum(["walk","wave","think","celebrate","idle","point"]).default("idle"), color: z.string().optional(), size: z.number().default(180), duration: z.number().default(3), delay: z.number().default(0) }),
  BarRace: z.object({ data: z.array(z.object({ label: z.string(), value: z.number(), color: z.string().optional() })), showLabels: z.boolean().default(true), duration: z.number().default(2), delay: z.number().default(0) }),
  FaceMorph: z.object({ emotion: z.enum(["happy","surprised","thinking","sweat","angry","neutral"]).default("happy"), size: z.number().default(120), color: z.string().optional(), duration: z.number().default(1.5), delay: z.number().default(0) }),
  LiquidPour: z.object({ value: z.number().default(65), max: z.number().default(100), label: z.string().default(""), unit: z.string().default("%"), color: z.string().optional(), duration: z.number().default(2), delay: z.number().default(0) }),
  PlantGrow: z.object({ stages: z.number().int().min(1).max(5).default(4), color: z.string().optional(), size: z.number().default(160), duration: z.number().default(3), delay: z.number().default(0) }),
  GearMechanism: z.object({ gears: z.number().int().min(1).max(5).default(2), color: z.string().optional(), size: z.number().default(160), speed: z.number().default(1) }),
  CalendarFlip: z.object({ pages: z.number().int().min(2).max(12).default(4), color: z.string().optional(), size: z.number().default(160), duration: z.number().default(3), delay: z.number().default(0) }),
  Constellation: z.object({ stars: z.number().int().min(3).max(20).default(8), color: z.string().optional(), size: z.number().default(200), duration: z.number().default(3), delay: z.number().default(0) }),
  RocketLaunch: z.object({ size: z.number().default(200), color: z.string().optional(), duration: z.number().default(4), delay: z.number().default(0), autoPlay: z.boolean().default(true) }),
  FunnelFilter: z.object({ particleCount: z.number().default(60), stages: z.number().int().min(1).max(5).default(3), color: z.string().optional(), size: z.number().default(240), duration: z.number().default(4), delay: z.number().default(0) }),
  DominoEffect: z.object({ count: z.number().int().min(3).max(30).default(10), color: z.string().optional(), size: z.number().default(280), labels: z.array(z.string()).optional(), duration: z.number().default(3.5), delay: z.number().default(0) }),
  Storm2Calm: z.object({ color: z.string().optional(), size: z.number().default(260), duration: z.number().default(4.5), delay: z.number().default(0) }),
  Hourglass: z.object({ value: z.number().default(50), color: z.string().optional(), size: z.number().default(180), duration: z.number().default(4), delay: z.number().default(0) }),
  PuzzleAssembly: z.object({ pieces: z.number().int().min(4).max(30).default(12), color: z.string().optional(), size: z.number().default(240), title: z.string().default(""), duration: z.number().default(4), delay: z.number().default(0) }),
  PaperPlane: z.object({ color: z.string().optional(), size: z.number().default(240), message: z.string().default(""), duration: z.number().default(4.5), delay: z.number().default(0) }),
  HologramReveal: z.object({ color: z.string().optional(), size: z.number().default(220), shape: z.enum(["cube","sphere","diamond"]).default("cube"), duration: z.number().default(4.5), delay: z.number().default(0) }),
  MoonPhase: z.object({ speed: z.number().default(1), size: z.number().default(200) }),
  FlowChart: z.object({ nodes: z.array(z.object({ id:z.number(), label:z.string(), sub:z.string().optional(), error:z.boolean().optional() })).optional(), duration: z.number().default(2.5), color: z.string().optional(), size: z.number().default(260) }),
  LineDraw: z.object({ title: z.string().default("ARCHITECTURE"), color: z.string().optional(), size: z.number().default(260), duration: z.number().default(3.5) }),
  LoadingAnim: z.object({ value: z.number().default(67), label: z.string().default("Loading"), color: z.string().optional(), size: z.number().default(160) }),
  GameScene: z.object({ mazeSize: z.number().int().min(6).max(24).default(12), color: z.string().optional(), size: z.number().default(240) }),
  Editorial: z.object({ title: z.string().default("BEYOND THE HORIZON"), subtitle: z.string().default(""), color: z.string().optional(), size: z.number().default(280) }),
  CowCharacter: z.object({ action: z.enum(["idle","walk","wave","celebrate","charge","point"]).default("idle"), color: z.string().default("#8B5E3C"), spotColor: z.string().default("#6B3F2A"), size: z.number().default(200), duration: z.number().default(3), delay: z.number().default(0) }),
  Volcano: z.object({ color: z.string().optional(), size: z.number().default(240), duration: z.number().default(4.5), delay: z.number().default(0) }),
  HandGesture: z.object({ gesture: z.enum(["thumbsUp","counting","okSign","pointing","clap","wave"]).default("thumbsUp"), num: z.number().default(5), color: z.string().optional(), size: z.number().default(120), duration: z.number().default(2), delay: z.number().default(0) }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// Layout definition — composed mode only
// ═══════════════════════════════════════════════════════════════════════════════

export const PrimitiveCall = z.object({
  primitive: z.enum(PRIMITIVE_IDS),
  params: z.record(z.string(), z.any()).default({}),
  className: z.string().optional(),
  /** Nested regions — only for container primitives (Grid/FlexRow/FlexCol/Split/Card/BorderBox) */
  children: z.array(z.lazy(() => RegionDef)).optional(),
});
export type PrimitiveCall = z.infer<typeof PrimitiveCall>;

export const RegionDef = z.object({
  /** PrimitiveCall, array of PrimitiveCall, or a nested LayoutDef for recursive layouts */
  content: z.union([PrimitiveCall, z.array(PrimitiveCall), z.lazy(() => LayoutDef)]),
  gridArea: z.string().optional(),
  flex: z.string().optional(),
  style: z.record(z.string(), z.string()).optional(),
});
export type RegionDef = z.infer<typeof RegionDef>;

export const AnimationDef = z.object({
  target: z.string().describe("Region name to animate"),
  effect: z.enum(["fadeIn", "slideUp", "slideLeft", "slideRight", "scaleIn", "drawPath"]),
  delay: z.number().min(0).default(0),
  duration: z.number().positive().default(0.6),
});

export const LayoutDef = z.object({
  layout: z.enum(["stack", "grid", "split", "center", "absolute"]),
  gridTemplate: z.string().optional(),
  regions: z.record(z.string(), RegionDef),
  animations: z.array(AnimationDef).optional(),
  extraCSS: z.string().optional(),
  overrides: StyleOverrides.optional(),
});
export type LayoutDef = z.infer<typeof LayoutDef>;

// ═══════════════════════════════════════════════════════════════════════════════
// Chapter Step + Blueprint
// ═══════════════════════════════════════════════════════════════════════════════

export const ChapterStepDef = z.object({
  narration: z.string().default(""),
  layout: LayoutDef,
  durationSec: z.number().positive().optional(),

  pacing: z.object({
    entry: z.enum(["reveal", "cut", "dissolve", "wipe", "push"]).default("cut"),
    entryDurationMs: z.number().min(0).max(3000).default(400),
    exit: z.enum(["hold", "dissolve", "cut", "slide-out"]).default("cut"),
    exitDurationMs: z.number().min(0).max(3000).default(300),
    preHoldMs: z.number().min(0).max(5000).default(0),
    postHoldMs: z.number().min(0).max(5000).default(500),
    narrationTiming: z.enum(["sync", "visual-first", "audio-first"]).default("sync"),
    energy: z.enum(["calm", "moderate", "high", "peak"]).optional(),
  }).optional(),

  microSteps: z.array(z.object({
    layout: LayoutDef,
    holdMs: z.number().min(300).max(3000),
    transition: z.enum(["cut", "dissolve"]).default("cut"),
  })).max(8).optional(),

  assetHint: z.object({
    assetName: z.string(),
    placement: z.enum(["fill", "overlay", "inset"]),
    prominence: z.enum(["primary", "secondary", "ambient"]),
  }).optional(),
});
export type ChapterStepDef = z.infer<typeof ChapterStepDef>;

export const ChapterBlueprint = z.object({
  chapterId: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Must be slug format"),
  title: z.string().min(1).max(100),
  steps: z.array(ChapterStepDef).min(1).max(20),
  orderHint: z.number().int().min(0).optional(),

  transition: z.object({
    into: z.enum(["fade-black", "dissolve", "slide", "zoom", "none"]).default("fade-black"),
    intoDurationMs: z.number().min(0).max(3000).default(600),
    outOf: z.enum(["fade-black", "dissolve", "slide", "zoom", "none"]).default("fade-black"),
    outOfDurationMs: z.number().min(0).max(3000).default(400),
    showTitleCard: z.boolean().default(true),
    titleCardDurationMs: z.number().min(500).max(5000).default(2000),
  }).optional(),

  bgmSync: z.object({
    bpm: z.number().positive().optional(),
    beatAlign: z.enum(["off", "chapter", "step"]).default("off"),
    offsetBeats: z.number().int().min(0).default(0),
  }).optional(),
});
export type ChapterBlueprint = z.infer<typeof ChapterBlueprint>;

// ═══════════════════════════════════════════════════════════════════════════════
// Backward-compat helpers (for old template/custom blueprints still on disk)
// ═══════════════════════════════════════════════════════════════════════════════

/** Old template IDs — kept for compat, not used in new blueprints */
export const LEGACY_TEMPLATE_IDS = [
  "hero-title", "step-reveal", "data-spotlight", "side-by-side",
  "flow-diagram", "code-showcase", "quote-card", "grid-gallery",
  "timeline", "comparison-table", "before-after", "anatomy",
  "progress-bar", "testimonial",
] as const;

export type LegacyTemplateId = (typeof LEGACY_TEMPLATE_IDS)[number];

/** Accept old blueprint shapes at the Zod level, normalize to LayoutDef */
export const LegacyLayoutDef = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("template"),
    template: z.enum(LEGACY_TEMPLATE_IDS),
    variant: z.string().optional(),
    slots: z.record(z.string(), z.any()),
    overrides: StyleOverrides.optional(),
  }),
  LayoutDef.extend({ mode: z.literal("composed").optional() }),
  z.object({
    mode: z.literal("custom"),
    imports: z.array(z.string()).optional(),
    jsx: z.string(),
    css: z.string().optional(),
  }),
]);
