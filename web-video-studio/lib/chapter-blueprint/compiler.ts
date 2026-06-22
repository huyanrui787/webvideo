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
  TemplateLayout,
  ComposedLayout,
  CustomLayout,
  StyleOverrides,
  TemplateId,
} from "./types";

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
// Template → JSX generators
// Each returns the JSX body for one step using that template.
// ═══════════════════════════════════════════════════════════════════════════════

function genHeroTitle(layout: TemplateLayout, _stepIdx: number): string {
  const s = layout.slots as any;
  const variant = layout.variant ?? "centered";
  const lines: string[] = [];

  lines.push(`<div className="ch-hero ch-hero--${variant}${bgClass(layout.overrides)}"${styleOverridesToProp(layout.overrides)}>`);
  if (s.kicker) {
    lines.push(`  <div className="kicker">${escHtml(s.kicker)}</div>`);
  }
  lines.push(`  <h1 className="ch-hero-title">`);
  lines.push(`    <MaskReveal show duration={900}>`);
  lines.push(`      <span className="serif-cn">${escHtml(s.title)}</span>`);
  lines.push(`    </MaskReveal>`);
  lines.push(`  </h1>`);
  if (s.subtitle) {
    lines.push(`  <p className="ch-hero-sub">${escHtml(s.subtitle)}</p>`);
  }
  if (s.background) {
    lines.push(`  <div className="ch-hero-bg">`);
    lines.push(`    ${mediaToJsx(s.background, "    ")}`);
    lines.push(`  </div>`);
  }
  if (s.logo) {
    lines.push(`  <div className="ch-hero-logo">${mediaToJsx(s.logo, "    ")}</div>`);
  }
  lines.push(`</div>`);
  return lines.join("\n");
}

function genStepReveal(layout: TemplateLayout, stepIdx: number): string {
  const s = layout.slots as any;
  const variant = layout.variant ?? "numbered";
  const steps: any[] = s.steps ?? [];
  const lines: string[] = [];

  lines.push(`<div className="ch-steps ch-steps--${variant}${bgClass(layout.overrides)}"${styleOverridesToProp(layout.overrides)}>`);

  if (s.hook) {
    lines.push(`  <div className="ch-steps-hook">`);
    lines.push(`    <Reveal from="up" delay={0.1} stepTime={0.8}>`);
    lines.push(`      <span className="ch-steps-hook-${s.hook.type}">${escHtml(s.hook.content)}</span>`);
    if (s.hook.label) {
      lines.push(`      <span className="label-mono">${escHtml(s.hook.label)}</span>`);
    }
    lines.push(`    </Reveal>`);
    lines.push(`  </div>`);
  }

  lines.push(`  <div className="ch-steps-list">`);
  steps.forEach((item: any, i: number) => {
    const revealDelay = 0.2 + i * 0.15;
    lines.push(`    <Stagger index={${i}} delay={${revealDelay.toFixed(2)}} stepTime={0.7}>`);
    lines.push(`      <div className="ch-step-item">`);
    if (variant === "numbered") {
      lines.push(`        <span className="ch-step-num">${String(i + 1).padStart(2, "0")}</span>`);
    }
    lines.push(`        <div className="ch-step-body">`);
    if (item.badge) {
      lines.push(`          <span className="ch-step-badge">${escHtml(item.badge)}</span>`);
    }
    lines.push(`          <h3 className="ch-step-heading">${escHtml(item.heading)}</h3>`);
    if (item.body) {
      lines.push(`          <p className="ch-step-text">${escHtml(item.body)}</p>`);
    }
    lines.push(`        </div>`);
    if (item.media) {
      lines.push(`        <div className="ch-step-media">${mediaToJsx(item.media, "          ")}</div>`);
    }
    lines.push(`      </div>`);
    lines.push(`    </Stagger>`);
  });
  lines.push(`  </div>`);

  lines.push(`</div>`);
  return lines.join("\n");
}

function genDataSpotlight(layout: TemplateLayout, _stepIdx: number): string {
  const s = layout.slots as any;
  const variant = layout.variant ?? "single-stat";
  const lines: string[] = [];

  lines.push(`<div className="ch-data ch-data--${variant}${bgClass(layout.overrides)}"${styleOverridesToProp(layout.overrides)}>`);
  lines.push(`  <div className="ch-data-primary">`);
  lines.push(`    <Counter to={${parseFloat(String(s.primaryValue)) || 0}} delay={0.2} stepTime={1.2} />`);
  lines.push(`    <span className="ch-data-value">${escHtml(s.primaryValue)}</span>`);
  lines.push(`    <span className="ch-data-label label-mono">${escHtml(s.primaryLabel)}</span>`);
  lines.push(`  </div>`);
  if (s.context) {
    lines.push(`  <p className="ch-data-context">${escHtml(s.context)}</p>`);
  }
  if (s.secondaryValues?.length) {
    lines.push(`  <div className="ch-data-secondary">`);
    s.secondaryValues.forEach((sv: any) => {
      const trendIcon = sv.trend === "up" ? "↑" : sv.trend === "down" ? "↓" : "";
      lines.push(`    <div className="ch-data-secondary-item">`);
      lines.push(`      <span className="ch-data-secondary-value">${escHtml(sv.value)}${trendIcon ? ` <span className="trend-${sv.trend}">${trendIcon}</span>` : ""}</span>`);
      lines.push(`      <span className="label-mono">${escHtml(sv.label)}</span>`);
      lines.push(`    </div>`);
    });
    lines.push(`  </div>`);
  }
  if (s.media) {
    lines.push(`  <div className="ch-data-media">${mediaToJsx(s.media, "    ")}</div>`);
  }
  lines.push(`</div>`);
  return lines.join("\n");
}

function genSideBySide(layout: TemplateLayout, _stepIdx: number): string {
  const s = layout.slots as any;
  const variant = layout.variant ?? "vs";
  const lines: string[] = [];

  lines.push(`<div className="ch-compare ch-compare--${variant}${bgClass(layout.overrides)}"${styleOverridesToProp(layout.overrides)}>`);
  lines.push(`  <div className="ch-compare-panel ch-compare-left">`);
  if (s.leftLabel) {
    lines.push(`    <span className="ch-compare-label label-mono">${escHtml(s.leftLabel)}</span>`);
  }
  lines.push(genPanelContent(s.left, 2));
  lines.push(`  </div>`);
  if (variant !== "none") {
    lines.push(`  <div className="ch-compare-divider"><span>${variant === "vs" ? "VS" : "→"}</span></div>`);
  }
  lines.push(`  <div className="ch-compare-panel ch-compare-right">`);
  if (s.rightLabel) {
    lines.push(`    <span className="ch-compare-label label-mono">${escHtml(s.rightLabel)}</span>`);
  }
  lines.push(genPanelContent(s.right, 2));
  lines.push(`  </div>`);
  lines.push(`</div>`);
  return lines.join("\n");
}

function genPanelContent(panel: any, indent: number): string {
  const pad = "  ".repeat(indent);
  const lines: string[] = [];
  lines.push(`${pad}<h3 className="ch-compare-heading">${escHtml(panel.heading)}</h3>`);
  if (panel.body) {
    lines.push(`${pad}<p className="ch-compare-body">${escHtml(panel.body)}</p>`);
  }
  if (panel.items?.length) {
    lines.push(`${pad}<ul className="ch-compare-items">`);
    panel.items.forEach((item: string) => {
      lines.push(`${pad}  <li>${escHtml(item)}</li>`);
    });
    lines.push(`${pad}</ul>`);
  }
  if (panel.media) {
    lines.push(`${pad}<div className="ch-compare-media">${mediaToJsx(panel.media, pad + "  ")}</div>`);
  }
  return lines.join("\n");
}

function genFlowDiagram(layout: TemplateLayout, _stepIdx: number): string {
  const s = layout.slots as any;
  const variant = layout.variant ?? "horizontal";
  const nodes: any[] = s.nodes ?? [];
  const edges: any[] = s.edges ?? [];
  const lines: string[] = [];

  lines.push(`<div className="ch-flow ch-flow--${variant}${bgClass(layout.overrides)}"${styleOverridesToProp(layout.overrides)}>`);

  // Generate nodes
  const visibleCount = s.highlightIndex != null ? s.highlightIndex + 1 : nodes.length;
  lines.push(`  <NetworkGraph`);
  lines.push(`    nodes={[`);
  nodes.forEach((n: any) => {
    lines.push(`      { id: "${escAttr(n.id)}", label: "${escAttr(n.label)}"${n.description ? `, description: "${escAttr(n.description)}"` : ""}${n.icon ? `, icon: "${escAttr(n.icon)}"` : ""} },`);
  });
  lines.push(`    ]}`);
  lines.push(`    edges={[`);
  edges.forEach((e: any) => {
    lines.push(`      { from: "${escAttr(e.from)}", to: "${escAttr(e.to)}"${e.label ? `, label: "${escAttr(e.label)}"` : ""} },`);
  });
  lines.push(`    ]}`);
  lines.push(`    visibleNodes={${visibleCount}}`);
  lines.push(`    stepTime={1.0}`);
  lines.push(`  />`);
  lines.push(`</div>`);
  return lines.join("\n");
}

function genCodeShowcase(layout: TemplateLayout, _stepIdx: number): string {
  const s = layout.slots as any;
  const variant = layout.variant ?? "single-file";
  const lines: string[] = [];

  lines.push(`<div className="ch-code ch-code--${variant}${bgClass(layout.overrides)}"${styleOverridesToProp(layout.overrides)}>`);

  if (s.filename) {
    lines.push(`  <div className="ch-code-header">`);
    lines.push(`    <span className="ch-code-filename label-mono">${escHtml(s.filename)}</span>`);
    lines.push(`    <span className="ch-code-lang label-mono">${escHtml(s.language)}</span>`);
    lines.push(`  </div>`);
  }

  // Code block
  const highlights = s.highlights?.length
    ? `[${(s.highlights as string[]).map((h: string) => `"${h}"`).join(", ")}]`
    : "[]";
  lines.push(`  <CodeBlock code={\`${escTemplate(s.code)}\`} language="${escAttr(s.language)}" highlights={${highlights}} />`);

  // Annotations
  if (s.annotations?.length) {
    lines.push(`  <div className="ch-code-annotations">`);
    s.annotations.forEach((ann: any, i: number) => {
      lines.push(`    <Reveal from="${ann.position === "bottom" ? "up" : "right"}" delay={${(0.5 + i * 0.3).toFixed(1)}} stepTime={0.6}>`);
      lines.push(`      <div className="ch-code-annotation ch-code-annotation--${ann.position}">`);
      lines.push(`        <span className="label-mono">${escHtml(ann.lines)}</span>`);
      lines.push(`        <span>${escHtml(ann.text)}</span>`);
      lines.push(`      </div>`);
      lines.push(`    </Reveal>`);
    });
    lines.push(`  </div>`);
  }

  if (s.output) {
    lines.push(`  <div className="ch-code-output">${mediaToJsx(s.output, "    ")}</div>`);
  }
  lines.push(`</div>`);
  return lines.join("\n");
}

function genQuoteCard(layout: TemplateLayout, _stepIdx: number): string {
  const s = layout.slots as any;
  const variant = layout.variant ?? "centered";
  const lines: string[] = [];

  lines.push(`<div className="ch-quote ch-quote--${variant}${bgClass(layout.overrides)}"${styleOverridesToProp(layout.overrides)}>`);
  if (s.media) {
    lines.push(`  <div className="ch-quote-media">${mediaToJsx(s.media, "    ")}</div>`);
  }
  lines.push(`  <blockquote className="ch-quote-text pull-quote">`);
  lines.push(`    <MaskReveal show duration={1100}>`);
  lines.push(`      <span className="serif-cn">${escHtml(s.quote)}</span>`);
  lines.push(`    </MaskReveal>`);
  lines.push(`  </blockquote>`);
  if (s.attribution) {
    lines.push(`  <cite className="ch-quote-attribution">— ${escHtml(s.attribution)}</cite>`);
  }
  if (s.context) {
    lines.push(`  <p className="ch-quote-context label-mono">${escHtml(s.context)}</p>`);
  }
  lines.push(`</div>`);
  return lines.join("\n");
}

function genGridGallery(layout: TemplateLayout, _stepIdx: number): string {
  const s = layout.slots as any;
  const variant = layout.variant ?? `cols-${s.columns || 3}`;
  const items: any[] = s.items ?? [];
  const lines: string[] = [];

  lines.push(`<div className="ch-grid ch-grid--${variant}${bgClass(layout.overrides)}"${styleOverridesToProp(layout.overrides)}>`);
  lines.push(`  <div className="ch-grid-inner" style={{ "--grid-cols": ${s.columns || 3}, "--grid-gap": "var(--space-${s.gap === "sm" ? "4" : s.gap === "lg" ? "7" : "5"})" } as React.CSSProperties}>`);
  items.forEach((item: any, i: number) => {
    lines.push(`    <Stagger index={${i}} delay={0.15} stepTime={0.5}>`);
    lines.push(`      <div className="ch-grid-item">`);
    lines.push(`        ${mediaToJsx(item.media, "        ")}`);
    if (item.caption || item.tag) {
      lines.push(`        <div className="ch-grid-item-info">`);
      if (item.tag) lines.push(`          <span className="ch-grid-item-tag label-mono">${escHtml(item.tag)}</span>`);
      if (item.caption) lines.push(`          <span className="ch-grid-item-caption">${escHtml(item.caption)}</span>`);
      lines.push(`        </div>`);
    }
    lines.push(`      </div>`);
    lines.push(`    </Stagger>`);
  });
  lines.push(`  </div>`);
  lines.push(`</div>`);
  return lines.join("\n");
}

// Maps template ID → generator function
const TEMPLATE_GENERATORS: Record<TemplateId, (layout: TemplateLayout, stepIdx: number) => string> = {
  "hero-title": genHeroTitle,
  "step-reveal": genStepReveal,
  "data-spotlight": genDataSpotlight,
  "side-by-side": genSideBySide,
  "flow-diagram": genFlowDiagram,
  "code-showcase": genCodeShowcase,
  "quote-card": genQuoteCard,
  "grid-gallery": genGridGallery,
};

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
      return TEMPLATE_GENERATORS[layout.template](layout, idx);
    case "composed":
      return genComposedLayout(layout, idx);
    case "custom":
      return genCustomLayout(layout, chCssClass, idx);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Template-specific imports
// ═══════════════════════════════════════════════════════════════════════════════

const TEMPLATE_REQUIRED_IMPORTS: Record<TemplateId, string[]> = {
  "hero-title": ["MaskReveal"],
  "step-reveal": ["Reveal", "Stagger"],
  "data-spotlight": ["Counter"],
  "side-by-side": [],
  "flow-diagram": ["NetworkGraph"],
  "code-showcase": ["CodeBlock", "Reveal"],
  "quote-card": ["MaskReveal"],
  "grid-gallery": ["Stagger"],
};

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

// ═══════════════════════════════════════════════════════════════════════════════
// TSX generator
// ═══════════════════════════════════════════════════════════════════════════════

function generateTSX(bp: ChapterBlueprint): string {
  const name = componentName(bp.chapterId);
  const chClass = cssClass(bp.chapterId);

  // Collect required imports
  const usedComponents = new Set<string>();
  const usedPrimitives = new Set<string>();
  const extraImports = new Set<string>();

  for (const step of bp.steps) {
    if (step.layout.mode === "template") {
      const req = TEMPLATE_REQUIRED_IMPORTS[step.layout.template] ?? [];
      for (const r of req) {
        if (IMPORT_PATHS[r]?.includes("primitives")) {
          usedPrimitives.add(r);
        } else {
          usedComponents.add(r);
        }
      }
    }
    if (step.layout.mode === "composed") {
      for (const region of Object.values(step.layout.regions)) {
        const contents = Array.isArray(region.content) ? region.content : [region.content];
        for (const c of contents) {
          if (IMPORT_PATHS[c.primitive]?.includes("primitives")) {
            usedPrimitives.add(c.primitive);
          } else {
            usedComponents.add(c.primitive);
          }
        }
      }
      // If composed uses Reveal for animations
      if (step.layout.animations?.length) {
        usedPrimitives.add("Reveal");
      }
    }
    if (step.layout.mode === "custom" && step.layout.imports) {
      for (const imp of step.layout.imports) {
        // Only allow relative imports from src/ or known packages
        if (typeof imp === "string" && (imp.startsWith("./") || imp.startsWith("../") || /^[a-z@]/.test(imp))) {
          extraImports.add(imp);
        }
      }
    }
  }

  const lines: string[] = [];

  // Imports
  if (usedComponents.has("MaskReveal")) {
    lines.push(`import { MaskReveal } from "../../components/MaskReveal";`);
  }
  if (usedPrimitives.size > 0) {
    const sorted = [...usedPrimitives].sort();
    lines.push(`import { ${sorted.join(", ")} } from "../../primitives";`);
  }
  lines.push(`import type { ChapterStepProps } from "../../registry/types";`);
  for (const imp of extraImports) {
    lines.push(imp);
  }
  lines.push(`import "./${name}.css";`);
  lines.push("");

  // Component function
  lines.push(`export default function ${name}({ step }: ChapterStepProps) {`);

  for (let i = 0; i < bp.steps.length; i++) {
    const step = bp.steps[i]!;
    const ifWord = i === 0 ? "if" : "else if";
    const jsx = genStepJSX(step, i, chClass)
      .split("\n")
      .map((l) => `    ${l}`)
      .join("\n");

    lines.push(`  ${ifWord} (step === ${i}) {`);
    lines.push(`    return (`);
    lines.push(jsx);
    lines.push(`    );`);
    lines.push(`  }`);
    lines.push("");
  }

  lines.push(`  return null;`);
  lines.push(`}`);

  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSS generator
// ═══════════════════════════════════════════════════════════════════════════════

function generateCSS(bp: ChapterBlueprint): string {
  const chClass = cssClass(bp.chapterId);
  const lines: string[] = [
    `/* ─────────────────────────────────────────────────────────────────────`,
    ` * ${bp.title}`,
    ` * Auto-generated from chapter blueprint. Edit the blueprint, not this file.`,
    ` * ───────────────────────────────────────────────────────────────────── */`,
    "",
    `.ch-${chClass} { color: var(--text); }`,
    "",
  ];

  // Collect template-specific CSS snippets
  const cssBlocks = new Set<string>();
  for (const step of bp.steps) {
    if (step.layout.mode === "template") {
      cssBlocks.add(getTemplateCSS(step.layout.template));
    }
    if (step.layout.mode === "composed" && step.layout.extraCSS) {
      cssBlocks.add(step.layout.extraCSS);
    }
    if (step.layout.mode === "custom" && step.layout.css) {
      cssBlocks.add(step.layout.css);
    }
  }

  for (const block of cssBlocks) {
    lines.push(block);
    lines.push("");
  }

  return lines.join("\n");
}

function getTemplateCSS(template: TemplateId): string {
  switch (template) {
    case "hero-title":
      return `.ch-hero { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: var(--space-5); padding: var(--stage-pad-y) var(--stage-pad-x); }
.ch-hero--centered { align-items: center; text-align: center; }
.ch-hero--left { align-items: flex-start; text-align: left; }
.ch-hero--split { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: var(--space-9); }
.ch-hero-title { font-size: var(--t-display-2); line-height: 1.05; margin: 0; max-width: 24ch; }
.ch-hero-sub { font-family: var(--font-body); font-size: var(--t-body); color: var(--text-2); max-width: 56ch; margin: 0; }
.ch-hero-bg { position: absolute; inset: 0; z-index: 0; opacity: 0.3; }
.ch-hero-bg img, .ch-hero-bg video { width: 100%; height: 100%; object-fit: cover; }
.ch-hero-logo { position: absolute; top: var(--space-6); right: var(--space-6); width: 64px; }`;

    case "step-reveal":
      return `.ch-steps { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: var(--stage-pad-y) var(--stage-pad-x); gap: var(--space-6); }
.ch-steps-hook { margin-bottom: var(--space-5); }
.ch-steps-hook-stat { font-size: var(--t-display-1); color: var(--accent); display: block; }
.ch-steps-hook-quote { font-size: var(--t-h1); font-style: italic; display: block; }
.ch-steps-hook-question { font-size: var(--t-h1); font-weight: 600; display: block; }
.ch-steps-list { display: flex; flex-direction: column; gap: var(--space-5); }
.ch-step-item { display: flex; gap: var(--space-5); align-items: flex-start; }
.ch-step-num { font-family: var(--font-mono); font-size: var(--t-display-2); color: var(--accent); line-height: 0.9; min-width: 2ch; }
.ch-step-body { flex: 1; display: flex; flex-direction: column; gap: var(--space-2); }
.ch-step-badge { display: inline-block; padding: 2px var(--space-3); background: var(--accent); color: #fff; border-radius: 4px; font-size: var(--t-small); align-self: flex-start; }
.ch-step-heading { font-size: var(--t-h2); margin: 0; }
.ch-step-text { font-family: var(--font-body); font-size: var(--t-body); color: var(--text-2); max-width: 56ch; margin: 0; }
.ch-step-media { flex-shrink: 0; margin-top: var(--space-2); }
.ch-step-media img { border-radius: 8px; }`;

    case "data-spotlight":
      return `.ch-data { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: var(--stage-pad-y) var(--stage-pad-x); gap: var(--space-5); }
.ch-data-primary { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); }
.ch-data-value { font-size: var(--t-display-1); font-weight: 700; color: var(--accent); }
.ch-data-label { font-size: var(--t-h3); }
.ch-data-context { font-family: var(--font-body); font-size: var(--t-body); color: var(--text-2); max-width: 48ch; text-align: center; margin: 0; }
.ch-data-secondary { display: flex; gap: var(--space-9); margin-top: var(--space-4); }
.ch-data-secondary-item { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); }
.ch-data-secondary-value { font-size: var(--t-h2); font-weight: 600; }
.ch-data-media { margin-top: var(--space-5); }
.ch-data-media img { max-width: 600px; border-radius: 8px; }`;

    case "side-by-side":
      return `.ch-compare { flex: 1; display: flex; align-items: center; justify-content: center; padding: var(--stage-pad-y) var(--stage-pad-x); gap: var(--space-7); }
.ch-compare-panel { flex: 1; display: flex; flex-direction: column; gap: var(--space-4); max-width: 440px; }
.ch-compare-label { display: inline-block; padding: 2px var(--space-3); background: var(--accent); color: #fff; border-radius: 4px; align-self: flex-start; }
.ch-compare-heading { font-size: var(--t-h2); margin: 0; }
.ch-compare-body { font-family: var(--font-body); font-size: var(--t-body); color: var(--text-2); margin: 0; }
.ch-compare-items { margin: 0; padding-left: var(--space-5); display: flex; flex-direction: column; gap: var(--space-2); }
.ch-compare-items li { font-size: var(--t-body); }
.ch-compare-divider { display: flex; align-items: center; justify-content: center; }
.ch-compare-divider span { font-size: var(--t-h1); font-weight: 700; color: var(--accent); }
.ch-compare-media img { max-width: 100%; border-radius: 8px; }`;

    case "flow-diagram":
      return `.ch-flow { flex: 1; display: flex; align-items: center; justify-content: center; padding: var(--stage-pad-y) var(--stage-pad-x); }`;

    case "code-showcase":
      return `.ch-code { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: var(--stage-pad-y) var(--stage-pad-x); gap: var(--space-5); }
.ch-code-header { display: flex; justify-content: space-between; align-items: center; }
.ch-code-filename { color: var(--accent); }
.ch-code-annotations { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-4); }
.ch-code-annotation { display: flex; gap: var(--space-3); align-items: baseline; }
.ch-code-output { margin-top: var(--space-5); }
.ch-code-output img { max-width: 100%; border-radius: 8px; }`;

    case "quote-card":
      return `.ch-quote { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: var(--stage-pad-y) var(--stage-pad-x); gap: var(--space-5); }
.ch-quote--centered { align-items: center; text-align: center; }
.ch-quote--side { align-items: flex-start; }
.ch-quote--overlay { align-items: center; text-align: center; }
.ch-quote-text { font-size: var(--t-display-2); line-height: 1.15; max-width: 22ch; margin: 0; }
.ch-quote-attribution { font-family: var(--font-body); font-size: var(--t-h3); color: var(--text-2); font-style: normal; }
.ch-quote-context { max-width: 48ch; }
.ch-quote-media { margin-bottom: var(--space-4); }
.ch-quote-media img { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; }`;

    case "grid-gallery":
      return `.ch-grid { flex: 1; display: flex; align-items: center; justify-content: center; padding: var(--stage-pad-y) var(--stage-pad-x); }
.ch-grid-inner { display: grid; grid-template-columns: repeat(var(--grid-cols, 3), 1fr); gap: var(--grid-gap, var(--space-5)); width: 100%; max-width: 1100px; }
.ch-grid-item { display: flex; flex-direction: column; gap: var(--space-2); }
.ch-grid-item img { width: 100%; aspect-ratio: 16/9; object-fit: contain; border-radius: 8px; background: white; }
.ch-grid-item-info { display: flex; flex-direction: column; gap: var(--space-1); }
.ch-grid-item-tag { color: var(--accent); }
.ch-grid-item-caption { font-size: var(--t-small); color: var(--text-2); }`;

    default:
      return "";
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Narrations generator
// ═══════════════════════════════════════════════════════════════════════════════

function generateNarrations(bp: ChapterBlueprint): string {
  const name = componentName(bp.chapterId);
  const lines: string[] = [
    `import type { Narration } from "../../registry/types";`,
    "",
    `export const narrations: Narration[] = [`,
  ];

  for (const step of bp.steps) {
    const escaped = step.narration.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    lines.push(`  "${escaped}",`);
  }

  lines.push(`];`);
  return lines.join("\n");
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
