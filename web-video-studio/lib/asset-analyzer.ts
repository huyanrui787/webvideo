/**
 * Asset Semantic Analyzer — vision-based content analysis for user-uploaded assets.
 *
 * Analyzes images and videos to extract:
 *   - Content type classification (photo, screenshot, diagram, etc.)
 *   - Subject description
 *   - Dominant colors
 *   - Composition characteristics
 *   - OCR text regions
 *   - Suggested usage in templates
 *
 * The analysis results are stored alongside the asset and injected into the
 * agent system prompt so the AI can make informed template-matching decisions.
 */

import fs from "fs";
import path from "path";
import { projectDir, readAssetMeta } from "@/lib/projects";

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export type AssetContentType =
  | "photo"
  | "screenshot"
  | "diagram"
  | "chart"
  | "logo"
  | "icon"
  | "video_clip"
  | "illustration"
  | "unknown";

export type AssetRole = "hero" | "support" | "background" | "icon" | "evidence";

export type TemplateId =
  | "hero-title" | "step-reveal" | "data-spotlight" | "side-by-side"
  | "flow-diagram" | "code-showcase" | "quote-card" | "grid-gallery"
  | "timeline" | "comparison-table" | "before-after" | "anatomy"
  | "progress-bar" | "testimonial"
  | "brand-intro" | "brand-outro";  // for brand shell

export interface AssetSemanticProfile {
  assetName: string;
  contentType: AssetContentType;
  subject: string;                    // "团队合影", "产品架构图", "Dashboard screenshot"
  dominantColors: string[];           // ["#1a1a2e", "#e94560"]
  composition: "centered" | "left-heavy" | "right-heavy" | "wide" | "tall" | "balanced";
  hasText: boolean;
  textRegions?: Array<{ text: string; position: string; confidence: number }>;
  suggestedUsage: {
    bestTemplates: TemplateId[];
    bestRole: AssetRole;
    aspectRatioFit: "native_16_9" | "crop_needed" | "letterbox_needed" | "unknown";
    safeZoneScore: number;            // 0-1
    shouldFill: boolean;              // true = best used as full-background
    shouldInset: boolean;             // true = best used as small inset
  };
  analyzedAt: number;
  dimensions?: { width: number; height: number };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Profile storage
// ═══════════════════════════════════════════════════════════════════════════════

function profilePath(projectId: string): string {
  return path.join(projectDir(projectId), "assets", "semantic-profiles.json");
}

export function loadProfiles(projectId: string): Record<string, AssetSemanticProfile> {
  try {
    const raw = fs.readFileSync(profilePath(projectId), "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveProfiles(projectId: string, profiles: Record<string, AssetSemanticProfile>): void {
  const dir = path.dirname(profilePath(projectId));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(profilePath(projectId), JSON.stringify(profiles, null, 2));
}

export function getProfile(projectId: string, assetName: string): AssetSemanticProfile | null {
  const profiles = loadProfiles(projectId);
  return profiles[assetName] ?? null;
}

export function setProfile(projectId: string, profile: AssetSemanticProfile): void {
  const profiles = loadProfiles(projectId);
  profiles[profile.assetName] = profile;
  saveProfiles(projectId, profiles);
}

export function deleteProfile(projectId: string, assetName: string): void {
  const profiles = loadProfiles(projectId);
  delete profiles[assetName];
  saveProfiles(projectId, profiles);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Heuristic classification (fast, no API call)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Quick content-type guess from file extension and filename heuristics.
 * For accurate classification, use classifyWithVision() which calls a vision model.
 */
export function heuristicClassify(assetName: string, dimensions?: { width: number; height: number }): {
  contentType: AssetContentType;
  composition: AssetSemanticProfile["composition"];
  aspectRatioFit: AssetSemanticProfile["suggestedUsage"]["aspectRatioFit"];
} {
  const lower = assetName.toLowerCase();

  // Extension-based
  if (/\.(mp4|webm|mov|avi)$/i.test(lower)) {
    return { contentType: "video_clip", composition: "wide", aspectRatioFit: "unknown" };
  }
  if (/\.(svg|ico)$/i.test(lower) || /\b(logo|icon|favicon|avatar)\b/i.test(lower)) {
    if (/\blogo\b/i.test(lower)) {
      return { contentType: "logo", composition: "centered", aspectRatioFit: "letterbox_needed" };
    }
    return { contentType: "icon", composition: "centered", aspectRatioFit: "letterbox_needed" };
  }
  if (/\b(screenshot|screen|capture|snip)\b/i.test(lower)) {
    return { contentType: "screenshot", composition: "balanced", aspectRatioFit: "crop_needed" };
  }
  if (/\b(diagram|flow|architecture|arch|flowchart|mindmap)\b/i.test(lower)) {
    return { contentType: "diagram", composition: "balanced", aspectRatioFit: "letterbox_needed" };
  }
  if (/\b(chart|graph|plot|data|stats|metrics|kpi)\b/i.test(lower)) {
    return { contentType: "chart", composition: "balanced", aspectRatioFit: "letterbox_needed" };
  }
  if (/\b(illust|draw|sketch|手绘|插画)\b/i.test(lower)) {
    return { contentType: "illustration", composition: "balanced", aspectRatioFit: "unknown" };
  }

  // Dimensional heuristics
  if (dimensions) {
    const ratio = dimensions.width / dimensions.height;
    if (ratio > 1.6 && ratio < 1.85) {
      return { contentType: "photo", composition: "wide", aspectRatioFit: "native_16_9" };
    }
    if (ratio > 1.85) {
      return { contentType: "photo", composition: "wide", aspectRatioFit: "letterbox_needed" };
    }
    if (ratio < 1.0) {
      return { contentType: "photo", composition: "tall", aspectRatioFit: "crop_needed" };
    }
  }

  return { contentType: "photo", composition: "centered", aspectRatioFit: "unknown" };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Template matching rules — maps content types to best template usage
// ═══════════════════════════════════════════════════════════════════════════════

const TEMPLATE_ROLE_MAP: Record<AssetContentType, {
  bestTemplates: TemplateId[];
  bestRole: AssetRole;
  shouldFill: boolean;
  shouldInset: boolean;
}> = {
  photo: {
    bestTemplates: ["hero-title", "quote-card", "testimonial", "grid-gallery"],
    bestRole: "hero",
    shouldFill: true,
    shouldInset: false,
  },
  screenshot: {
    bestTemplates: ["side-by-side", "code-showcase", "anatomy", "before-after"],
    bestRole: "evidence",
    shouldFill: false,
    shouldInset: true,
  },
  diagram: {
    bestTemplates: ["side-by-side", "flow-diagram", "anatomy"],
    bestRole: "support",
    shouldFill: false,
    shouldInset: true,
  },
  chart: {
    bestTemplates: ["data-spotlight", "side-by-side", "comparison-table"],
    bestRole: "evidence",
    shouldFill: false,
    shouldInset: true,
  },
  logo: {
    bestTemplates: ["hero-title", "brand-intro", "brand-outro"],
    bestRole: "icon",
    shouldFill: false,
    shouldInset: true,
  },
  icon: {
    bestTemplates: ["step-reveal", "flow-diagram", "hero-title"],
    bestRole: "icon",
    shouldFill: false,
    shouldInset: true,
  },
  video_clip: {
    bestTemplates: ["hero-title", "step-reveal", "grid-gallery"],
    bestRole: "hero",
    shouldFill: true,
    shouldInset: false,
  },
  illustration: {
    bestTemplates: ["hero-title", "step-reveal", "grid-gallery", "data-spotlight"],
    bestRole: "support",
    shouldFill: false,
    shouldInset: true,
  },
  unknown: {
    bestTemplates: ["grid-gallery", "step-reveal"],
    bestRole: "support",
    shouldFill: false,
    shouldInset: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Full analysis pipeline
// ═══════════════════════════════════════════════════════════════════════════════

export interface AnalysisOptions {
  /** Call a vision-capable model for accurate subject/content classification */
  useVision?: boolean;
  /** Model to use for vision analysis */
  visionModel?: string;
}

/**
 * Build a complete AssetSemanticProfile by combining heuristic classification
 * with optional vision-model analysis.
 *
 * When `useVision` is false (default), returns a heuristic profile suitable
 * for immediate use. Vision analysis can be deferred to a background job.
 */
export async function analyzeAsset(
  projectId: string,
  assetName: string,
  opts: AnalysisOptions = {}
): Promise<AssetSemanticProfile> {
  const assetsDir = path.join(projectDir(projectId), "assets");
  const assetPath = path.join(assetsDir, assetName);

  // Get actual dimensions if the file exists
  let dimensions: { width: number; height: number } | undefined;
  try {
    // For images, try reading dimensions from file metadata
    const ext = path.extname(assetName).toLowerCase();
    if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) {
      // Use image-size or similar in production; for now, heuristic
      dimensions = { width: 1920, height: 1080 }; // placeholder
    }
  } catch { /* ignore */ }

  const heuristic = heuristicClassify(assetName, dimensions);
  const roleMap = TEMPLATE_ROLE_MAP[heuristic.contentType];

  // ── Build profile ────────────────────────────────────────────────────
  let subject = assetName.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
  let hasText = false;
  let textRegions: AssetSemanticProfile["textRegions"] = [];

  // Vision-based refinement (when enabled)
  if (opts.useVision && opts.visionModel) {
    try {
      const visionResult = await classifyWithVision(assetPath, opts.visionModel);
      if (visionResult) {
        subject = visionResult.subject || subject;
        hasText = visionResult.hasText || false;
        textRegions = visionResult.textRegions || [];
      }
    } catch (err) {
      console.warn(`[asset-analyzer] Vision analysis failed for ${assetName}:`, err);
    }
  }

  const profile: AssetSemanticProfile = {
    assetName,
    contentType: heuristic.contentType,
    subject,
    dominantColors: [],
    composition: heuristic.composition,
    hasText,
    textRegions: textRegions.length > 0 ? textRegions : undefined,
    suggestedUsage: {
      bestTemplates: roleMap.bestTemplates,
      bestRole: roleMap.bestRole,
      aspectRatioFit: heuristic.aspectRatioFit,
      safeZoneScore: heuristic.aspectRatioFit === "native_16_9" ? 1.0 : 0.7,
      shouldFill: roleMap.shouldFill,
      shouldInset: roleMap.shouldInset,
    },
    analyzedAt: Date.now(),
    dimensions,
  };

  // Persist
  setProfile(projectId, profile);

  return profile;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Vision model classification (pluggable backend)
// ═══════════════════════════════════════════════════════════════════════════════

interface VisionClassificationResult {
  subject: string;
  contentType: AssetContentType;
  hasText: boolean;
  textRegions: Array<{ text: string; position: string; confidence: number }>;
  dominantColors: string[];
}

/**
 * Call a vision-capable model to classify the asset.
 * Supports Claude Vision (via Anthropic API) and GPT-4V (via OpenAI API).
 *
 * The implementation is pluggable — add new backends here.
 */
async function classifyWithVision(
  assetPath: string,
  model: string
): Promise<VisionClassificationResult | null> {
  const fsMod = await import("fs");
  if (!fsMod.existsSync(assetPath)) return null;

  const buffer = fsMod.readFileSync(assetPath);
  const base64 = buffer.toString("base64");
  const ext = path.extname(assetPath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png"
    : ext === ".webp" ? "image/webp"
    : ext === ".gif" ? "image/gif"
    : "image/jpeg";

  const prompt = `Analyze this image and return a JSON object with:
- subject: a concise description in Chinese (max 15 words)
- contentType: one of "photo", "screenshot", "diagram", "chart", "logo", "icon", "illustration", "unknown"
- hasText: boolean, whether the image contains readable text
- textRegions: array of {text: string, position: string, confidence: number} for any text found
- dominantColors: array of top 2-3 hex colors

Return ONLY the JSON object, no other text.`;

  if (model.startsWith("claude-")) {
    const key = process.env.ANTHROPIC_API_KEY;
    const baseUrl = process.env.ANTHROPIC_BASE_URL ?? "https://qqqapi.com";
    if (!key) return null;

    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model.replace("claude-", "claude-"),
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType, data: base64 },
            },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json() as any;
    const text = data?.content?.[0]?.text ?? "";
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return null;
    }
  }

  // GPT-4V fallback
  if (model.startsWith("gpt-4")) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return null;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json() as any;
    const text = data?.choices?.[0]?.message?.content ?? "";
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return null;
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Bulk analysis
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze all un-analyzed assets in a project.
 * Returns the number of newly analyzed assets.
 */
export async function analyzeAllAssets(
  projectId: string,
  opts: AnalysisOptions = {}
): Promise<number> {
  const assetsDir = path.join(projectDir(projectId), "assets");
  if (!fs.existsSync(assetsDir)) return 0;

  const existingProfiles = loadProfiles(projectId);
  const files = fs.readdirSync(assetsDir).filter((f) => {
    if (f.startsWith(".") || f === "meta.json" || f === "semantic-profiles.json") return false;
    return !existingProfiles[f]; // only un-analyzed
  });

  const mediaExts = new Set(["jpg", "jpeg", "png", "webp", "svg", "gif", "mp4", "webm", "mov"]);
  const toAnalyze = files.filter((f) => mediaExts.has(path.extname(f).slice(1).toLowerCase()));

  let count = 0;
  for (const file of toAnalyze) {
    try {
      await analyzeAsset(projectId, file, opts);
      count++;
    } catch (err) {
      console.warn(`[asset-analyzer] Failed to analyze ${file}:`, err);
    }
  }

  return count;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Summary for agent system prompt
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a concise summary of all analyzed assets for injection into
 * the agent system prompt. Helps the AI make informed template choices.
 */
export function generateAssetSummary(projectId: string): string {
  const profiles = loadProfiles(projectId);
  const entries = Object.values(profiles);

  if (entries.length === 0) return "";

  const lines: string[] = [
    "## 可用素材（已分析语义）",
    "",
  ];

  for (const p of entries) {
    const usage = p.suggestedUsage;
    const bestTemplates = usage.bestTemplates.slice(0, 3).join(", ");
    const roleLabel = {
      hero: "主视觉", support: "辅助元素", background: "背景", icon: "图标/Logo", evidence: "证据/截图",
    }[usage.bestRole];

    lines.push(`- **${p.assetName}** → ${p.contentType} · "${p.subject}"`);
    lines.push(`  推荐用于: ${bestTemplates} | 角色: ${roleLabel} | ` +
      `填充模式: ${usage.shouldFill ? "全屏" : "嵌入"} | ` +
      `16:9适配: ${usage.aspectRatioFit}`);
    if (p.hasText) {
      const texts = (p.textRegions || []).map((t) => t.text).join(", ");
      lines.push(`  ⚠ 图中含文字: ${texts}`);
    }
  }

  return lines.join("\n");
}
