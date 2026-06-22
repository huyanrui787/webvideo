/**
 * Brand Shell — fixed intro/outro segments that bookend every rendered video.
 *
 * Brand shells are NOT chapter content — they are the "video packaging":
 *   - Intro: logo animation, tagline, brand sound
 *   - Outro: CTA, QR code, credits, subscribe prompt
 *
 * Configuration is skill-scoped (brand.toml in the main skill) and can be
 * overridden per-project via .brand.json in the project directory.
 */

import fs from "fs";
import path from "path";
import { projectDir } from "@/lib/projects";
import type { GeneratedChapter } from "@/lib/chapter-blueprint";

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export type ShellTemplate = "logo-reveal" | "fade-in" | "slide-in" | "custom";
export type OutroTemplate = "cta" | "qr-code" | "credits" | "subscribe" | "custom";

export interface BrandShellIntro {
  enabled: boolean;
  durationSec: number;
  template: ShellTemplate;
  logo: string;                 // asset path or URL
  tagline?: string;
  background: "solid" | "transparent";
  audio?: string;              // brand jingle / sound
  accentColor?: string;
}

export interface BrandShellOutro {
  enabled: boolean;
  durationSec: number;
  template: OutroTemplate;
  logo?: string;
  qrCode?: string;
  ctaText?: string;
  website?: string;
  credits?: string[];
  audio?: string;
}

export interface BrandShellConfig {
  name: string;
  accentColor: string;
  logo: string;
  fontHeading: string;          // "var(--font-sans-cn)"
  fontBody: string;
  intro: BrandShellIntro;
  outro: BrandShellOutro;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Default configuration
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: BrandShellConfig = {
  name: "未命名品牌",
  accentColor: "var(--accent)",
  logo: "/api/placeholder/logo",
  fontHeading: "var(--font-sans-cn)",
  fontBody: "var(--font-body)",
  intro: {
    enabled: false,
    durationSec: 4,
    template: "fade-in",
    logo: "",
    background: "solid",
  },
  outro: {
    enabled: false,
    durationSec: 6,
    template: "cta",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Config loading
// ═══════════════════════════════════════════════════════════════════════════════

export function loadBrandConfig(projectId: string): BrandShellConfig {
  // 1. Try project-scoped override
  const projectConfigPath = path.join(projectDir(projectId), ".brand.json");
  if (fs.existsSync(projectConfigPath)) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(projectConfigPath, "utf-8")) };
    } catch { /* fall through */ }
  }

  // 2. Try skill-scoped brand.toml (converted to JSON)
  const skillConfigPath = path.join(projectDir(projectId), "..", "..", "skills", "main", "brand.json");
  if (fs.existsSync(skillConfigPath)) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(skillConfigPath, "utf-8")) };
    } catch { /* fall through */ }
  }

  return { ...DEFAULT_CONFIG };
}

export function saveBrandConfig(projectId: string, config: BrandShellConfig): void {
  const projectConfigPath = path.join(projectDir(projectId), ".brand.json");
  fs.writeFileSync(projectConfigPath, JSON.stringify(config, null, 2));
}

export function isBrandShellEnabled(projectId: string): boolean {
  const config = loadBrandConfig(projectId);
  return config.intro.enabled || config.outro.enabled;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Compiler: BrandShellConfig → GeneratedChapter (2 chapters: intro + outro)
// ═══════════════════════════════════════════════════════════════════════════════

function generateIntroTSX(config: BrandShellConfig): string {
  const i = config.intro;
  const accent = config.accentColor;

  switch (i.template) {
    case "logo-reveal":
      return `export default function BrandIntro({ step }: { step: number }) {
  return (
    <div className="brand-intro brand-intro--logo-reveal" style={{ background: "${i.background === 'transparent' ? 'transparent' : 'var(--bg)'}" }}>
      <Reveal from="up" delay={0.2} stepTime={1.0}>
        <div className="brand-intro-logo">
          <img src="${i.logo}" alt="${config.name}" style={{ maxHeight: 80, objectFit: "contain" }} />
        </div>
      </Reveal>
      ${i.tagline ? `<Reveal from="up" delay={0.8} stepTime={0.8}>
        <p className="brand-intro-tagline" style={{ color: "${accent}" }}>${i.tagline}</p>
      </Reveal>` : ""}
    </div>
  );
}`;

    case "slide-in":
      return `export default function BrandIntro({ step }: { step: number }) {
  return (
    <div className="brand-intro brand-intro--slide-in" style={{ background: "${i.background === 'transparent' ? 'transparent' : 'var(--bg)'}" }}>
      <Reveal from="left" delay={0.1} stepTime={0.8}>
        <div className="brand-intro-bar" style={{ background: "${accent}" }}></div>
      </Reveal>
      <Reveal from="right" delay={0.3} stepTime={0.8}>
        <div className="brand-intro-content">
          <img src="${i.logo}" alt="${config.name}" style={{ maxHeight: 64, objectFit: "contain" }} />
          ${i.tagline ? `<p className="brand-intro-tagline">${i.tagline}</p>` : ""}
        </div>
      </Reveal>
    </div>
  );
}`;

    // fade-in (default)
    default:
      return `export default function BrandIntro({ step }: { step: number }) {
  return (
    <div className="brand-intro brand-intro--fade-in" style={{ background: "${i.background === 'transparent' ? 'transparent' : 'var(--bg)'}" }}>
      <Reveal from="up" delay={0.3} stepTime={1.2}>
        <div className="brand-intro-center">
          <img src="${i.logo}" alt="${config.name}" style={{ maxHeight: 72, objectFit: "contain" }} />
          ${i.tagline ? `<p className="brand-intro-tagline">${i.tagline}</p>` : ""}
        </div>
      </Reveal>
    </div>
  );
}`;
  }
}

function generateOutroTSX(config: BrandShellConfig): string {
  const o = config.outro;
  const accent = config.accentColor;

  switch (o.template) {
    case "qr-code":
      return `export default function BrandOutro({ step }: { step: number }) {
  return (
    <div className="brand-outro brand-outro--qr" style={{ background: "var(--bg)" }}>
      <Reveal from="up" delay={0.3} stepTime={0.8}>
        <div className="brand-outro-layout">
          <div className="brand-outro-left">
            ${o.logo ? `<img src="${o.logo}" alt="${config.name}" style={{ maxHeight: 48, objectFit: "contain" }} />` : ""}
            ${o.ctaText ? `<h2 className="brand-outro-cta">${o.ctaText}</h2>` : ""}
            ${o.website ? `<p className="brand-outro-web">${o.website}</p>` : ""}
          </div>
          ${o.qrCode ? `<div className="brand-outro-right">
            <img src="${o.qrCode}" alt="QR Code" style={{ width: 160, height: 160 }} />
          </div>` : ""}
        </div>
      </Reveal>
    </div>
  );
}`;

    case "credits":
      const creditsList = (o.credits || ["制作: " + config.name])
        .map((c) => `<span>${c}</span>`).join("\n          ");
      return `export default function BrandOutro({ step }: { step: number }) {
  return (
    <div className="brand-outro brand-outro--credits" style={{ background: "var(--bg)" }}>
      <Reveal from="up" delay={0.3} stepTime={1.0}>
        <div className="brand-outro-credits-list">
          ${creditsList}
        </div>
      </Reveal>
    </div>
  );
}`;

    // cta (default)
    default:
      return `export default function BrandOutro({ step }: { step: number }) {
  return (
    <div className="brand-outro brand-outro--cta" style={{ background: "var(--bg)" }}>
      <Reveal from="up" delay={0.3} stepTime={0.8}>
        <div className="brand-outro-center">
          ${o.logo ? `<img src="${o.logo}" alt="${config.name}" style={{ maxHeight: 48, objectFit: "contain" }} />` : ""}
          ${o.ctaText ? `<h2 className="brand-outro-cta">${o.ctaText}</h2>` : ""}
          ${o.website ? `<p className="brand-outro-web">${o.website}</p>` : ""}
        </div>
      </Reveal>
    </div>
  );
}`;
  }
}

function shellCSS(): string {
  return `.brand-intro, .brand-outro { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.brand-intro-center, .brand-outro-center { display: flex; flex-direction: column; align-items: center; gap: var(--space-5); }
.brand-intro-tagline { font-size: var(--t-h4); font-weight: 500; }
.brand-intro--slide-in { flex-direction: row; }
.brand-intro-bar { width: 4px; height: 80%; margin-right: var(--space-6); }
.brand-intro-content { display: flex; flex-direction: column; gap: var(--space-4); }
.brand-outro-layout { display: flex; align-items: center; gap: var(--space-9); max-width: 80%; }
.brand-outro-left { flex: 1; display: flex; flex-direction: column; gap: var(--space-4); }
.brand-outro-right { flex-shrink: 0; }
.brand-outro-cta { font-size: var(--t-h2); margin: 0; line-height: 1.3; }
.brand-outro-web { font-size: var(--t-body); color: var(--text-2); margin: 0; }
.brand-outro-credits-list { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); font-size: var(--t-h3); }`;
}

const INTRO_COMPONENT_NAME = "BrandIntro";
const OUTRO_COMPONENT_NAME = "BrandOutro";
const INTRO_CHAPTER_ID = "__brand_intro";
const OUTRO_CHAPTER_ID = "__brand_outro";

export function compileBrandIntro(config: BrandShellConfig): GeneratedChapter {
  return {
    chapterId: INTRO_CHAPTER_ID,
    componentName: INTRO_COMPONENT_NAME,
    tsx: generateIntroTSX(config),
    css: shellCSS(),
    narrations: "export const narrations: string[] = [];",
    registryImports: `import ${INTRO_COMPONENT_NAME} from "../chapters/${INTRO_CHAPTER_ID}/${INTRO_COMPONENT_NAME}";
import { narrations as brandIntroNarrations } from "../chapters/${INTRO_CHAPTER_ID}/narrations";`,
    registryEntry: `{ id: "${INTRO_CHAPTER_ID}", title: "片头", narrations: brandIntroNarrations, Component: ${INTRO_COMPONENT_NAME}, stepDurations: [${config.intro.durationSec}], },`,
    stepCount: 1,
  };
}

export function compileBrandOutro(config: BrandShellConfig): GeneratedChapter {
  return {
    chapterId: OUTRO_CHAPTER_ID,
    componentName: OUTRO_COMPONENT_NAME,
    tsx: generateOutroTSX(config),
    css: shellCSS(),
    narrations: "export const narrations: string[] = [];",
    registryImports: `import ${OUTRO_COMPONENT_NAME} from "../chapters/${OUTRO_CHAPTER_ID}/${OUTRO_COMPONENT_NAME}";
import { narrations as brandOutroNarrations } from "../chapters/${OUTRO_CHAPTER_ID}/narrations";`,
    registryEntry: `{ id: "${OUTRO_CHAPTER_ID}", title: "片尾", narrations: brandOutroNarrations, Component: ${OUTRO_COMPONENT_NAME}, stepDurations: [${config.outro.durationSec}], },`,
    stepCount: 1,
  };
}

export function getBrandChapterIds(): string[] {
  return [INTRO_CHAPTER_ID, OUTRO_CHAPTER_ID];
}
