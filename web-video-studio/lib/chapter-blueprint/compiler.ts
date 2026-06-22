/**
 * Chapter Compiler — Blueprint → Code Generator
 *
 * Takes a validated ChapterBlueprint and generates:
 *   1. ChapterName.tsx — React chapter component
 *   2. ChapterName.css — Scoped styles
 *   3. narrations.ts   — Narration text array
 *
 * Output is deterministic: same blueprint → same code, every time.
 * No AI involvement at compile time — this is pure code generation.
 */

import type {
  ChapterBlueprint,
  ChapterStepDef,
  ComposedLayout,
  CustomLayout,
  StyleOverrides,
} from "./types";
import { getTemplate, collectTemplateCSS, getTemplateImports } from "./templates/registry";
import type { TemplateContext } from "./templates/types";
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

/** "why-matter" → "WhyMatter" */
function componentName(chapterId: string): string {
  return chapterId
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

/** "why-matter" → "whyMatter" (for variable names like narrations) */
function camelName(chapterId: string): string {
  const parts = chapterId.split("-");
  return parts[0]! + parts.slice(1).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}

/** "why-matter" → "why-matter" (identity, validated as slug) */
function cssClass(chapterId: string): string {
  return chapterId;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Style overrides → JSX props / inline style string
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

function extraClasses(ov?: StyleOverrides): string {
  if (!ov?.extraClasses) return "";
  return ` ${ov.extraClasses}`;
}

function bgClass(ov?: StyleOverrides): string {
  if (!ov?.backgroundStyle || ov.backgroundStyle === "solid") return "";
  return ` bg-${ov.backgroundStyle}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Media ref → JSX
// ═══════════════════════════════════════════════════════════════════════════════

function mediaToJsx(
  media: { type: string; src: string; alt?: string; fit?: string; width?: number; height?: number } | undefined,
  indent: string = ""
): string {
  if (!media) return "null /* no media */";
  const { src, alt = "", type, fit = "contain" } = media;
  const styleParts = [`objectFit: "${fit}"` as string];
  if (media.width) styleParts.push(`width: ${media.width}`);
  if (media.height) styleParts.push(`height: ${media.height}`);
  const style = `{{ ${styleParts.join(", ")} }}`;

  if (type === "video") {
    return `${indent}<video src="${src}" style={${style}} autoPlay muted loop playsInline />`;
  }
  // For illustration images: enforce 16:9 with explicit dimensions if not set
  if (!media.width && !media.height) {
    return `${indent}<img src="${src}" alt="${alt}" style={{ objectFit: "${fit}", width: 640, height: 360 }} />`;
  }
  return `${indent}<img src="${src}" alt="${alt}" style={${style}} />`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Template → JSX dispatch (via registry)
// ═══════════════════════════════════════════════════════════════════════════════

function genTemplateLayout(layout: { template: string; slots: Record<string, any>; variant?: string; overrides?: any }, stepIdx: number): string {
  const tpl = getTemplate(layout.template);
  const ctx: TemplateContext = {
    slots: layout.slots,
    variant: layout.variant,
    overrides: layout.overrides,
    stepIdx,
    chapterClass: "",
  };
  return tpl.generate(ctx).jsx;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Composed mode → JSX
// ═══════════════════════════════════════════════════════════════════════════════

function genComposedLayout(layout: ComposedLayout, _stepIdx: number): string {
  const lines: string[] = [];
  const layoutClass = `ch-composed ch-composed--${layout.layout}${bgClass(layout.overrides)}`;

  const animationsMap = new Map<string, string>();
  if (layout.animations) {
    for (const a of layout.animations) {
      animationsMap.set(a.target, `${a.effect} ${a.delay}s ${a.duration}s`);
    }
  }

  lines.push(`<div className="${layoutClass}"${styleOverridesToProp(layout.overrides)}>`);

  if (layout.layout === "grid" && layout.gridTemplate) {
    lines.push(`  <div style={{ display: "grid", gridTemplate: "${escAttr(layout.gridTemplate)}", gap: "var(--space-5)" }}>`);
  }

  for (const [name, region] of Object.entries(layout.regions)) {
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
    const regionStyle = regionStyleParts.length > 0 ? ` style={{ ${regionStyleParts.join(", ")} }}` : "";

    const contents = Array.isArray(region.content) ? region.content : [region.content];

    const regionBody: string[] = [];
    let staggerWrap = false;
    if (contents.length > 1 && contents[0].primitive === "Stagger") {
      // First primitive is Stagger: it wraps all remaining primitives in the region
      staggerWrap = true;
      const s = contents[0];
      const staggerProps = Object.entries(s.params ?? {})
        .map(([k, v]) => `${k}={${typeof v === "string" ? `"${escAttr(v)}"` : JSON.stringify(v)}}`)
        .join(" ");
      regionBody.push(`<Stagger ${staggerProps}>`);
    }

    if (anim) {
      const [effect, delay, duration] = anim.split(" ");
      regionBody.push(`<Reveal from="${mapEffect(effect)}" delay={${parseFloat(delay)}} stepTime={${parseFloat(duration)}}>`);
    }

    const startIdx = staggerWrap ? 1 : 0;
    for (let i = startIdx; i < contents.length; i++) {
      regionBody.push(genPrimitiveCall(contents[i]));
    }

    if (anim) {
      regionBody.push(`</Reveal>`);
    }

    if (staggerWrap) {
      regionBody.push(`</Stagger>`);
    }

    const body = regionBody.map((l) => `    ${l}`).join("\n");
    lines.push(`  <div className="${regionClass}"${regionStyle}>`);
    lines.push(body);
    lines.push(`  </div>`);
  }

  if (layout.layout === "grid" && layout.gridTemplate) {
    lines.push(`  </div>`);
  }

  // extraCSS is emitted in the .css file (generateCSS), not as inline <style>

  lines.push(`</div>`);
  return lines.join("\n");
}

function mapEffect(effect: string): string {
  const map: Record<string, string> = {
    fadeIn: "up",
    slideUp: "up",
    slideLeft: "left",
    slideRight: "right",
    scaleIn: "up",
    drawPath: "up",
  };
  return map[effect] ?? "up";
}

function genPrimitiveCall(call: { primitive: string; params: Record<string, any>; className?: string }): string {
  const { primitive, params } = call;
  const props = Object.entries(params)
    .map(([k, v]) => {
      const val = typeof v === "string" ? `"${escAttr(v)}"` : JSON.stringify(v);
      return `${k}={${val}}`;
    })
    .join(" ");

  const className = call.className ? ` className="${call.className}"` : "";

  // Self-closing for visual primitives
  if (["ParticleField", "NetworkGraph", "WaveForm", "DrawPath"].includes(primitive)) {
    return `<${primitive}${className} ${props} />`;
  }
  // Counter has children
  if (primitive === "Counter") {
    return `<${primitive}${className} ${props} />`;
  }
  // MediaFrame & CodeBlock are containers
  if (primitive === "MediaFrame" || primitive === "CodeBlock") {
    return `<${primitive}${className} ${props} />`;
  }
  // DataChart
  if (primitive === "DataChart") {
    return `<${primitive}${className} ${props} />`;
  }
  // Wrapping primitives (Reveal, Stagger, TypeWriter)
  if (primitive === "TypeWriter") {
    return `<${primitive}${className} ${props} />`;
  }
  // Default: self-closing
  return `<${primitive}${className} ${props} />`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Custom mode → JSX
// ═══════════════════════════════════════════════════════════════════════════════

function genCustomLayout(layout: CustomLayout, cssClass: string, _stepIdx: number): string {
  const lines: string[] = [];
  lines.push(`<div className="ch-custom ch-custom-${cssClass}">`);
  // Sanitize: strip script tags and event handlers from raw JSX
  const safeJSX = layout.jsx
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "<!-- script removed -->")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\son\w+\s*=\s*\{[^}]*\}/gi, "");
  const jsxLines = safeJSX.trim().split("\n");
  for (const l of jsxLines) {
    lines.push(`  ${l}`);
  }
  lines.push(`</div>`);
  // css is emitted in the .css file (generateCSS), not as inline <style>
  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════════
// Layout → JSX router
// ═══════════════════════════════════════════════════════════════════════════════

function genStepJSX(step: ChapterStepDef, idx: number, chCssClass: string): string {
  const { layout } = step;

  switch (layout.mode) {
    case "template":
      return genTemplateLayout(layout, idx);
    case "composed":
      return genComposedLayout(layout, idx);
    case "custom":
      return genCustomLayout(layout, chCssClass, idx);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Import resolution — registry-based (no more hardcoded TEMPLATE_REQUIRED_IMPORTS)
// ═══════════════════════════════════════════════════════════════════════════════

const IMPORT_PATHS: Record<string, string> = {
  MaskReveal: "../../components/MaskReveal",
  Reveal: "../../primitives",
  Stagger: "../../primitives",
  Counter: "../../primitives",
  DrawPath: "../../primitives",
  TypeWriter: "../../primitives",
  ParticleField: "../../primitives",
  NetworkGraph: "../../primitives",
  WaveForm: "../../primitives",
  MediaFrame: "../../primitives",
  CodeBlock: "../../primitives",
  DataChart: "../../primitives",
};

/** Collect required imports for a step's layout from the template registry */
function collectStepImports(layout: any): string[] {
  if (layout.mode === "template") {
    return getTemplateImports(layout.template);
  }
  if (layout.mode === "composed") {
    const prims = new Set<string>();
    for (const region of Object.values(layout.regions as Record<string, any>)) {
      const contents = Array.isArray(region.content) ? region.content : [region.content];
      for (const c of contents as any[]) {
        if (IMPORT_PATHS[c.primitive]?.includes("primitives")) prims.add(c.primitive);
        else if (IMPORT_PATHS[c.primitive]) prims.add(c.primitive);
      }
    }
    if (layout.animations?.length) prims.add("Reveal");
    return [...prims];
  }
  return [];
}

// ═══════════════════════════════════════════════════════════════════════════════
// TSX generator (AST-based via ts-morph)
// ═══════════════════════════════════════════════════════════════════════════════

function generateTSX(bp: ChapterBlueprint): string {
  const name = componentName(bp.chapterId);
  const chClass = cssClass(bp.chapterId);

  // Collect imports
  const importSpecs: ImportSpec[] = [];
  const compImports = new Set<string>();
  const primImports = new Set<string>();
  const extraImports = new Set<string>();

  for (const step of bp.steps) {
    const imports = collectStepImports(step.layout);
    for (const imp of imports) {
      if (IMPORT_PATHS[imp]?.includes("primitives")) {
        primImports.add(imp);
      } else if (IMPORT_PATHS[imp]) {
        compImports.add(imp);
      }
    }
    if (step.layout.mode === "custom" && step.layout.imports) {
      for (const imp of step.layout.imports) {
        if (typeof imp === "string" && (imp.startsWith("./") || imp.startsWith("../") || /^[a-z@]/.test(imp))) {
          extraImports.add(imp);
        }
      }
    }
  }

  for (const c of compImports) {
    importSpecs.push({ named: [c], modulePath: IMPORT_PATHS[c]! });
  }
  if (primImports.size > 0) {
    importSpecs.push({ named: [...primImports].sort(), modulePath: "../../primitives" });
  }

  // Build steps for the component
  const steps: StepRender[] = bp.steps.map((step, i) => ({
    index: i,
    jsx: genStepJSX(step, i, chClass),
  }));

  // Use AST builder
  const project = createProject();
  const spec: ComponentSpec = {
    name,
    propsType: "ChapterStepProps",
    paramName: "step",
    steps,
    imports: importSpecs,
  };

  const sourceFile = buildChapterComponent(project, spec);

  // Format the AST-generated code
  let result = formatSourceFile(sourceFile);

  // Prepend custom extra imports (full import statement strings)
  if (extraImports.size > 0) {
    result = [...extraImports].join("\n") + "\n" + result;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSS generator
// ═══════════════════════════════════════════════════════════════════════════════

function generateCSS(bp: ChapterBlueprint): string {
  // Collect CSS blocks from templates and custom steps
  const cssBlocks: string[] = [];
  const usedTemplateIds = new Set<string>();

  for (const step of bp.steps) {
    if (step.layout.mode === "template") {
      usedTemplateIds.add(step.layout.template);
    }
    if (step.layout.mode === "composed" && step.layout.extraCSS) {
      cssBlocks.push(step.layout.extraCSS);
    }
    if (step.layout.mode === "custom" && step.layout.css) {
      cssBlocks.push(step.layout.css);
    }
  }

  // Add CSS from all used templates via registry
  for (const cssBlock of collectTemplateCSS(usedTemplateIds)) {
    cssBlocks.push(cssBlock);
  }

  return buildCSS(cssClass(bp.chapterId), bp.title, cssBlocks);
}


// ═══════════════════════════════════════════════════════════════════════════════
// Narrations generator
// ═══════════════════════════════════════════════════════════════════════════════

function generateNarrations(bp: ChapterBlueprint): string {
  const project = createProject();
  const sourceFile = buildNarrationsFile(project, componentName(bp.chapterId), bp.steps.map((s) => s.narration));
  return formatSourceFile(sourceFile);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Registry fragment generator
// ═══════════════════════════════════════════════════════════════════════════════

function generateRegistryEntry(bp: ChapterBlueprint): string {
  const name = componentName(bp.chapterId);
  const varName = camelName(bp.chapterId);
  return `import ${name} from "../chapters/${bp.chapterId}/${name}";
import { narrations as ${varName}Narrations } from "../chapters/${bp.chapterId}/narrations";`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Escape helpers
// ═══════════════════════════════════════════════════════════════════════════════

function escHtml(s: string | undefined | null): string {
  if (s == null) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escAttr(s: string | undefined | null): string {
  if (s == null) return "";
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function escTemplate(s: string | undefined | null): string {
  if (s == null) return "";
  return s.replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

// ═══════════════════════════════════════════════════════════════════════════════
// File output shape
// ═══════════════════════════════════════════════════════════════════════════════

export interface GeneratedChapter {
  /** Chapter ID (slug) */
  chapterId: string;
  /** Component name */
  componentName: string;
  /** Generated TSX source */
  tsx: string;
  /** Generated CSS source */
  css: string;
  /** Generated narrations.ts source */
  narrations: string;
  /** Registry import lines to insert into registry/chapters.ts */
  registryImports: string;
  /** Registry array entry */
  registryEntry: string;
  /** Step count */
  stepCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main compile function
// ═══════════════════════════════════════════════════════════════════════════════

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

/**
 * Compile multiple chapters and produce a complete registry.ts
 */
export function compileRegistry(chapters: GeneratedChapter[]): string {
  const imports = chapters.map((c) => c.registryImports).join("\n");
  const entries = chapters.map((c) => `  ${c.registryEntry}`).join("\n");

  return `${imports}

import type { ChapterDef } from "./types";

export const CHAPTERS: ChapterDef[] = [
${entries}
];`;
}
