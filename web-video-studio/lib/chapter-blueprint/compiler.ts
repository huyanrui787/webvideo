/**
 * Chapter Compiler v2 — Blueprint → Code Generator
 *
 * Takes a validated ChapterBlueprint and generates:
 *   1. ChapterName.tsx — React chapter component
 *   2. ChapterName.css — Scoped styles
 *   3. narrations.ts   — Narration text array
 *
 * Composed mode only. 5 layouts × 42 primitives × nested containers.
 * No AI involvement at compile time — pure deterministic code generation.
 */

import type {
  ChapterBlueprint,
  ChapterStepDef,
  LayoutDef,
  StyleOverrides,
  PrimitiveCall,
  RegionDef,
} from "./types";
import {
  createProject,
  buildChapterComponent,
  buildNarrationsFile,
  buildChapterCSS as buildCSS,
  formatSourceFile,
  type ImportSpec,
  type ComponentSpec,
  type StepRender,
} from "./ast-builder";

// ═══════════════════════════════════════════════════════════════════════════════
// Naming helpers
// ═══════════════════════════════════════════════════════════════════════════════

function componentName(chapterId: string): string {
  return chapterId
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

function camelName(chapterId: string): string {
  const parts = chapterId.split("-");
  return parts[0]! + parts.slice(1).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}

function cssClass(chapterId: string): string {
  return chapterId;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Style helpers
// ═══════════════════════════════════════════════════════════════════════════════

function styleOverridesToProp(ov?: StyleOverrides): string {
  if (!ov) return "";
  const parts: string[] = [];
  if (ov.accentColor) parts.push(`"--accent-local": "${ov.accentColor}"`);
  if (ov.customProperties) {
    for (const [k, v] of Object.entries(ov.customProperties)) {
      parts.push(`"${k}": "${v}"`);
    }
  }
  return parts.length > 0 ? ` style={{ ${parts.join(", ")} }}` : "";
}

function bgClass(ov?: StyleOverrides): string {
  if (!ov?.backgroundStyle || ov.backgroundStyle === "solid") return "";
  return ` bg-${ov.backgroundStyle}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Import path registry — maps every primitive to its module
// ═══════════════════════════════════════════════════════════════════════════════

const PRIMITIVE_IMPORT_PATH = "../../primitives";

const ALL_PRIMITIVES = new Set([
  "Reveal", "Stagger", "Counter", "DrawPath", "TypeWriter",
  "ParticleField", "NetworkGraph", "WaveForm",
  "TextGlow", "SvgReveal", "Gauge", "MagneticField",
  "CircuitFlow", "ChartPie", "ChartBar", "ChartLine", "GeoGlobe",
  "LottiePlayer", "MediaFrame", "CodeBlock", "DataChart",
  "Headline", "Body", "Kicker", "PullQuote", "Caption",
  "StatCard", "BigNumber", "BarChart", "LineChart", "PieChart",
  "ImageFrame", "VideoFrame", "Avatar",
  "Divider", "Badge", "BorderBox", "GradientBg", "NoiseBg",
  "PatternBg", "GlowRing",
  "TimelineItem", "ProcessArrow", "VennDiagram",
  "Grid", "FlexRow", "FlexCol", "Split", "Card",
  // Animation (GSAP)
  "StickMan", "BarRace", "FaceMorph", "LiquidPour", "PlantGrow",
  "GearMechanism", "CalendarFlip", "Constellation", "RocketLaunch", "HandGesture",
  "FunnelFilter", "DominoEffect", "Storm2Calm", "Hourglass",
  "PuzzleAssembly", "PaperPlane", "HologramReveal", "Volcano", "CowCharacter", "MoonPhase", "FlowChart", "LineDraw", "LoadingAnim", "GameScene", "Editorial",
]);

// ═══════════════════════════════════════════════════════════════════════════════
// Primitive → JSX element name mapping
// ═══════════════════════════════════════════════════════════════════════════════

/** Maps Blueprint primitive IDs to actual React component names */
const COMPONENT_NAME: Record<string, string> = {
  // Text
  Headline: "Headline", Body: "Body", Kicker: "Kicker",
  PullQuote: "PullQuote", Caption: "Caption", TypeWriter: "TypeWriter",
  // Data
  Counter: "Counter", StatCard: "StatCard", BigNumber: "BigNumber",
  BarChart: "ChartBar", LineChart: "ChartLine", PieChart: "ChartPie",
  Gauge: "Gauge",
  // Media
  ImageFrame: "MediaFrame", VideoFrame: "VideoFrame",
  Avatar: "Avatar", LottiePlayer: "LottiePlayer",
  // Decor
  Divider: "Divider", Badge: "Badge", BorderBox: "BorderBox",
  GradientBg: "GradientBg", NoiseBg: "NoiseBg",
  PatternBg: "PatternBg", GlowRing: "GlowRing",
  // Animation
  DrawPath: "DrawPath", ParticleField: "ParticleField",
  WaveForm: "WaveForm", MagneticField: "MagneticField",
  CircuitFlow: "CircuitFlow", TextGlow: "TextGlow",
  SvgReveal: "SvgReveal",
  // Diagram
  NetworkGraph: "NetworkGraph", TimelineItem: "TimelineItem",
  ProcessArrow: "ProcessArrow", VennDiagram: "VennDiagram",
  GeoGlobe: "GeoGlobe",
  // Container
  Grid: "Grid", FlexRow: "FlexRow", FlexCol: "FlexCol",
  Split: "Split", Card: "Card",
  // Wrappers
  Reveal: "Reveal", Stagger: "Stagger",
  // Animation (GSAP)
  StickMan: "StickMan", BarRace: "BarRace", FaceMorph: "FaceMorph",
  LiquidPour: "LiquidPour", PlantGrow: "PlantGrow",
  GearMechanism: "GearMechanism", CalendarFlip: "CalendarFlip",
  Constellation: "Constellation", RocketLaunch: "RocketLaunch",
  HandGesture: "HandGesture",
  FunnelFilter: "FunnelFilter", DominoEffect: "DominoEffect",
  Storm2Calm: "Storm2Calm", Hourglass: "Hourglass",
  PuzzleAssembly: "PuzzleAssembly", PaperPlane: "PaperPlane",
  HologramReveal: "HologramReveal", Volcano: "Volcano",
  CowCharacter: "CowCharacter",
  MoonPhase: "MoonPhase", FlowChart: "FlowChart", LineDraw: "LineDraw",
  LoadingAnim: "LoadingAnim", GameScene: "GameScene", Editorial: "Editorial",
};

/** Container primitives that can hold nested children */
const CONTAINER_PRIMS = new Set(["Grid", "FlexRow", "FlexCol", "Split", "Card", "BorderBox"]);

// ═══════════════════════════════════════════════════════════════════════════════
// Layout → JSX
// ═══════════════════════════════════════════════════════════════════════════════

function genLayout(layout: LayoutDef, _stepIdx: number, indent = ""): string {
  const lines: string[] = [];
  const layoutClass = `ch-composed ch-composed--${layout.layout}${bgClass(layout.overrides)}`;
  const I = indent;

  const animationsMap = new Map<string, string>();
  if (layout.animations) {
    for (const a of layout.animations) {
      animationsMap.set(a.target, `${a.effect} ${a.delay}s ${a.duration}s`);
    }
  }

  lines.push(`${I}<div className="${layoutClass}"${styleOverridesToProp(layout.overrides)}>`);

  if (layout.layout === "grid" && layout.gridTemplate) {
    lines.push(`${I}  <div style={{ display: "grid", gridTemplate: "${escAttr(layout.gridTemplate)}", gap: "var(--space-5)" }}>`);
  }

  for (const [name, region] of Object.entries(layout.regions)) {
    const regionJSX = genRegion(name, region, animationsMap, `${I}  `);
    lines.push(regionJSX);
  }

  if (layout.layout === "grid" && layout.gridTemplate) {
    lines.push(`${I}  </div>`);
  }

  lines.push(`${I}</div>`);
  return lines.join("\n");
}

function genRegion(
  name: string,
  region: RegionDef,
  animationsMap: Map<string, string>,
  indent: string,
): string {
  const I = indent;
  const anim = animationsMap.get(name);
  const regionClass = `ch-composed-region ch-composed-region--${name}`;
  const regionStyleParts: string[] = [];
  if (region.gridArea) regionStyleParts.push(`gridArea: "${region.gridArea}"`);
  if (region.flex) regionStyleParts.push(`flex: "${region.flex}"`);
  if (region.style) {
    for (const [k, v] of Object.entries(region.style)) {
      regionStyleParts.push(`${k}: "${v}"`);
    }
  }
  const regionStyle = regionStyleParts.length > 0
    ? ` style={{ ${regionStyleParts.join(", ")} }}`
    : "";

  // Nested layout: content is a LayoutDef (has .layout and .regions, not .primitive)
  if ((region.content as any)?.layout && (region.content as any)?.regions) {
    const nestedJSX = genLayout(region.content as LayoutDef, 0, `${I}  `);
    const lines: string[] = [];
    lines.push(`${I}<div className="${regionClass}"${regionStyle}>`);
    lines.push(nestedJSX);
    lines.push(`${I}</div>`);
    return lines.join("\n");
  }

  const contents = Array.isArray(region.content) ? region.content : [region.content];

  const body: string[] = [];
  let staggerWrap = false;

  if (contents.length > 1 && contents[0].primitive === "Stagger") {
    staggerWrap = true;
    body.push(`${I}  <Stagger ${buildProps(contents[0].params)}>`);
  }

  if (anim) {
    const [effect, delay, duration] = anim.split(" ");
    body.push(`${I}  <Reveal from="${mapEffect(effect)}" delay={${parseFloat(delay)}} stepTime={${parseFloat(duration)}}>`);
  }

  const startIdx = staggerWrap ? 1 : 0;
  for (let i = startIdx; i < contents.length; i++) {
    body.push(genPrimitive(contents[i], `${I}  `));
  }

  if (anim) body.push(`${I}  </Reveal>`);
  if (staggerWrap) body.push(`${I}  </Stagger>`);

  const lines: string[] = [];
  lines.push(`${I}<div className="${regionClass}"${regionStyle}>`);
  lines.push(body.join("\n"));
  lines.push(`${I}</div>`);
  return lines.join("\n");
}

function genPrimitive(call: PrimitiveCall, indent: string = ""): string {
  const { primitive, params, className, children } = call;
  const I = indent;
  const compName = COMPONENT_NAME[primitive] ?? primitive;
  const props = buildProps(params);
  const cls = className ? ` className="${className}"` : "";

  // Container primitives — render with nested children
  if (children && children.length > 0) {
    const childLines = children.map((region, i) =>
      genRegion(`child-${i}`, region, new Map(), `${I}  `)
    );
    return [
      `${I}<${compName}${cls} ${props}>`,
      ...childLines,
      `${I}</${compName}>`,
    ].join("\n");
  }

  // Self-closing primitives
  return `${I}<${compName}${cls} ${props} />`;
}

function buildProps(params: Record<string, any>): string {
  return Object.entries(params)
    .map(([k, v]) => {
      if (v === undefined || v === null) return null;
      const val = typeof v === "string"
        ? `"${escAttr(v)}"`
        : JSON.stringify(v);
      return `${k}={${val}}`;
    })
    .filter(Boolean)
    .join(" ");
}

function mapEffect(effect: string): string {
  const map: Record<string, string> = {
    fadeIn: "up", slideUp: "up", slideLeft: "left",
    slideRight: "right", scaleIn: "up", drawPath: "up",
  };
  return map[effect] ?? "up";
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step JSX generation (composed only)
// ═══════════════════════════════════════════════════════════════════════════════

function genStepJSX(step: ChapterStepDef, idx: number): string {
  // Handle legacy template/custom blueprints — convert to composed fallback
  const layout = step.layout as any;
  if (layout.mode === "template" || layout.mode === "custom") {
    return genLegacyFallback(layout, idx);
  }
  return genLayout(layout as LayoutDef, idx);
}

/** Fallback: old template/custom → center layout with TypeWriter of chapter title */
function genLegacyFallback(layout: any, _idx: number): string {
  const text = layout.mode === "template"
    ? (layout.slots?.title ?? layout.slots?.quote ?? layout.slots?.heading ?? "")
    : "";
  return `<div className="ch-composed ch-composed--center">
  <div className="ch-composed-region ch-composed-region--main">
    <TypeWriter text={"${escAttr(text)}"} speed={60} />
  </div>
</div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Import collection
// ═══════════════════════════════════════════════════════════════════════════════

function collectStepImports(layout: any): Set<string> {
  const prims = new Set<string>();

  if (layout.regions) {
    for (const region of Object.values(layout.regions as Record<string, any>)) {
      collectPrimsFromRegion(region, prims);
    }
  }

  if (layout.animations?.length) prims.add("Reveal");
  return prims;
}

function collectPrimsFromRegion(region: any, prims: Set<string>): void {
  const contents = Array.isArray(region.content) ? region.content : [region.content];
  for (const c of contents) {
    if (c && ALL_PRIMITIVES.has(c.primitive)) {
      prims.add(c.primitive);
    }
    // Recurse into container children
    if (c?.children) {
      for (const child of c.children) {
        collectPrimsFromRegion(child, prims);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TSX generator
// ═══════════════════════════════════════════════════════════════════════════════

function generateTSX(bp: ChapterBlueprint): string {
  const name = componentName(bp.chapterId);
  const chClass = cssClass(bp.chapterId);

  const primImports = new Set<string>();
  for (const step of bp.steps) {
    const imports = collectStepImports(step.layout);
    for (const imp of imports) primImports.add(imp);
  }

  const resolvedImports: Record<string, string[]> = {};
  for (const prim of primImports) {
    const comp = COMPONENT_NAME[prim] ?? prim;
    if (!resolvedImports[PRIMITIVE_IMPORT_PATH]) resolvedImports[PRIMITIVE_IMPORT_PATH] = [];
    if (!resolvedImports[PRIMITIVE_IMPORT_PATH].includes(comp)) {
      resolvedImports[PRIMITIVE_IMPORT_PATH].push(comp);
    }
  }

  const importSpecs: ImportSpec[] = Object.entries(resolvedImports).map(
    ([path, named]) => ({ named: named.sort(), modulePath: path })
  );

  const steps: StepRender[] = bp.steps.map((step, i) => ({
    index: i,
    jsx: genStepJSX(step, i),
  }));

  const project = createProject();
  const spec: ComponentSpec = {
    name,
    propsType: "ChapterStepProps",
    paramName: "step",
    steps,
    imports: importSpecs,
  };

  const sourceFile = buildChapterComponent(project, spec);
  return formatSourceFile(sourceFile);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSS generator
// ═══════════════════════════════════════════════════════════════════════════════

function generateCSS(bp: ChapterBlueprint): string {
  const cssBlocks: string[] = [];

  for (const step of bp.steps) {
    const layout = step.layout as LayoutDef;
    // extraCSS from composed layouts
    if (layout.extraCSS) cssBlocks.push(layout.extraCSS);
    // Region-level inline styles → CSS classes
    if (layout.regions) {
      for (const [name, region] of Object.entries(layout.regions)) {
        if (region.style && Object.keys(region.style).length > 0) {
          const props = Object.entries(region.style)
            .map(([k, v]) => `  ${k}: ${v};`)
            .join("\n");
          cssBlocks.push(`.ch-composed-region--${name} {\n${props}\n}`);
        }
      }
    }
  }

  return buildCSS(cssClass(bp.chapterId), bp.title, cssBlocks);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Narrations + Registry
// ═══════════════════════════════════════════════════════════════════════════════

function generateNarrations(bp: ChapterBlueprint): string {
  const project = createProject();
  const sourceFile = buildNarrationsFile(project, componentName(bp.chapterId), bp.steps.map((s) => s.narration));
  return formatSourceFile(sourceFile);
}

function generateRegistryEntry(bp: ChapterBlueprint): string {
  const name = componentName(bp.chapterId);
  const varName = camelName(bp.chapterId);
  return `import ${name} from "../chapters/${bp.chapterId}/${name}";
import { narrations as ${varName}Narrations } from "../chapters/${bp.chapterId}/narrations";`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Escape helpers
// ═══════════════════════════════════════════════════════════════════════════════

function escAttr(s: string | undefined | null): string {
  if (s == null) return "";
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

// ═══════════════════════════════════════════════════════════════════════════════
// Output
// ═══════════════════════════════════════════════════════════════════════════════

export interface GeneratedChapter {
  chapterId: string;
  componentName: string;
  tsx: string;
  css: string;
  narrations: string;
  registryImports: string;
  registryEntry: string;
  stepCount: number;
}

export function compileChapter(bp: ChapterBlueprint): GeneratedChapter {
  const name = componentName(bp.chapterId);
  return {
    chapterId: bp.chapterId,
    componentName: name,
    tsx: generateTSX(bp),
    css: generateCSS(bp),
    narrations: generateNarrations(bp),
    registryImports: generateRegistryEntry(bp),
    registryEntry: `{ id: "${bp.chapterId}", title: "${escAttr(bp.title)}", narrations: ${camelName(bp.chapterId)}Narrations, Component: ${name} },`,
    stepCount: bp.steps.length,
  };
}

export function compileRegistry(chapters: GeneratedChapter[]): string {
  const imports = chapters.map((c) => c.registryImports).join("\n");
  const entries = chapters.map((c) => `  ${c.registryEntry}`).join("\n");
  return `${imports}

import type { ChapterDef } from "./types";

export const CHAPTERS: ChapterDef[] = [
${entries}
];`;
}
