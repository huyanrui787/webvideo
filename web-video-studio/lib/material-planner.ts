/**
 * Material Planner — demand-driven asset acquisition.
 *
 * Core philosophy: calculate what we need first, then acquire via best available source.
 * Never compromise visual quality because a material is missing.
 *
 * Pipeline:
 *   1. Scan all blueprints for material requirements (declared in MediaRef.requirement)
 *   2. Deduplicate requirements (same description = same asset)
 *   3. Check local availability (assets/ + semantic profiles)
 *   4. Acquire missing via ranked strategies: generate > search > local-library > ask-user > placeholder
 *   5. Backfill acquired materials into blueprints → recompile
 */

import fs from "fs";
import path from "path";
import { projectDir, writeProjectFile } from "@/lib/projects";
import { loadProfiles } from "@/lib/asset-analyzer";
import type { AssetSemanticProfile } from "@/lib/asset-analyzer";

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export type MaterialStyle =
  | "xiaohei-illustration"
  | "photorealistic"
  | "ui-screenshot"
  | "diagram"
  | "chart"
  | "stock-photo"
  | "icon"
  | "logo";

export type MaterialComposition = "16_9_wide" | "1_1_square" | "4_3" | "9_16_tall";

export interface MaterialRequirement {
  id: string;                          // unique requirement ID (nanoid)
  description: string;                 // natural language: what content should the asset show
  style: MaterialStyle;
  composition: MaterialComposition;
  keywords: string[];
  colorPalette?: string[];
  minResolution?: { w: number; h: number };
  priority: "critical" | "high" | "medium" | "low";
  usedInChapters: string[];            // which chapter IDs reference this requirement
  usedInSteps: string[];               // "chapterId:stepIdx" format
}

export interface AcquiredMaterial {
  requirementId: string;
  filename: string;                    // saved filename in assets/
  source: string;                      // "generated:wanx-v1" | "web:unsplash" | "local-library" | "pending-user" | "fallback:placeholder"
  buffer?: Buffer;
  url?: string;
  metadata?: Record<string, any>;
}

export interface MaterialPlan {
  requirements: MaterialRequirement[];
  available: MaterialRequirement[];     // found locally
  gaps: MaterialRequirement[];          // need to acquire
  acquired: AcquiredMaterial[];
  pendingUser: MaterialRequirement[];   // need user to provide
}

// ═══════════════════════════════════════════════════════════════════════════════
// Requirement extraction from blueprints
// ═══════════════════════════════════════════════════════════════════════════════

interface BlueprintFile {
  chapterId: string;
  path: string;
  raw: any;
}

/**
 * Deep-scan a layout object (and its nested children) for MediaRef
 * entries that have a `requirement` field instead of a `src`.
 */
function extractFromLayout(layout: any, chapterId: string, stepIdx: number): MaterialRequirement[] {
  const reqs: MaterialRequirement[] = [];
  if (!layout) return reqs;

  // Direct media with requirement
  function scan(obj: any): void {
    if (!obj || typeof obj !== "object") return;
    if (obj.type && (obj.type === "image" || obj.type === "video") && obj.requirement) {
      const r = obj.requirement;
      reqs.push({
        id: `${chapterId}-s${stepIdx}-${reqs.length}`,
        description: r.description || "",
        style: r.style || "stock-photo",
        composition: r.composition || "16_9_wide",
        keywords: r.keywords || [],
        colorPalette: r.colorPalette,
        minResolution: r.minResolution,
        priority: "medium",
        usedInChapters: [chapterId],
        usedInSteps: [`${chapterId}:${stepIdx}`],
      });
    }
    // Recurse into nested objects/arrays
    if (Array.isArray(obj)) {
      for (const item of obj) scan(item);
    } else {
      for (const val of Object.values(obj)) {
        if (typeof val === "object" && val !== null) scan(val);
      }
    }
  }

  scan(layout);
  return reqs;
}

/**
 * Scan all chapter blueprint files in a project for material requirements.
 */
export function scanAllRequirements(projectId: string): MaterialRequirement[] {
  const chaptersDir = path.join(projectDir(projectId), "presentation", "src", "chapters");
  if (!fs.existsSync(chaptersDir)) return [];

  const allReqs: MaterialRequirement[] = [];

  // Scan each chapter's blueprint JSON (if stored) or the compiled narration
  const dirs = fs.readdirSync(chaptersDir).filter((d) => {
    const stat = fs.statSync(path.join(chaptersDir, d));
    return stat.isDirectory() && !d.startsWith(".") && !d.startsWith("__");
  });

  for (const chapterId of dirs) {
    // Try reading a stored blueprint file first
    const bpPath = path.join(chaptersDir, chapterId, ".blueprint.json");
    if (fs.existsSync(bpPath)) {
      try {
        const bp = JSON.parse(fs.readFileSync(bpPath, "utf-8"));
        for (let si = 0; si < (bp.steps || []).length; si++) {
          const step = bp.steps[si];
          const reqs = extractFromLayout(step.layout, chapterId, si);
          allReqs.push(...reqs);
        }
      } catch { /* skip malformed blueprint */ }
    }
  }

  return deduplicateRequirements(allReqs);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Deduplication — same description + style = same material
// ═══════════════════════════════════════════════════════════════════════════════

function deduplicateRequirements(reqs: MaterialRequirement[]): MaterialRequirement[] {
  const seen = new Map<string, MaterialRequirement>();

  for (const req of reqs) {
    const key = `${req.style}:${req.description.toLowerCase().trim()}`;
    const existing = seen.get(key);
    if (existing) {
      // Merge references
      existing.usedInChapters = [...new Set([...existing.usedInChapters, ...req.usedInChapters])];
      existing.usedInSteps = [...new Set([...existing.usedInSteps, ...req.usedInSteps])];
      // Bump priority if any reference is higher
      const priorityRank = { critical: 4, high: 3, medium: 2, low: 1 };
      if (priorityRank[req.priority] > priorityRank[existing.priority]) {
        existing.priority = req.priority;
      }
    } else {
      seen.set(key, { ...req });
    }
  }

  return [...seen.values()];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Local availability check
// ═══════════════════════════════════════════════════════════════════════════════

function findLocalMatch(
  req: MaterialRequirement,
  profiles: Record<string, AssetSemanticProfile>
): string | null {
  // Check if any existing asset semantically matches the requirement
  for (const [name, profile] of Object.entries(profiles)) {
    // Simple keyword overlap heuristic
    const reqWords = new Set([
      ...req.keywords.map((k) => k.toLowerCase()),
      ...req.description.toLowerCase().split(/\s+/),
    ]);
    const assetWords = new Set(profile.subject.toLowerCase().split(/\s+/));

    let overlap = 0;
    for (const w of reqWords) {
      if (assetWords.has(w)) overlap++;
    }

    if (overlap >= 2) return name; // reasonable match
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Multi-source acquisition pipeline
// ═══════════════════════════════════════════════════════════════════════════════

interface FetchStrategy {
  source: string;
  cost: "free" | "api_call" | "user_action";
  latency: "fast" | "medium" | "slow";
  quality: number; // 0-1
}

function rankStrategies(req: MaterialRequirement): Array<{ strategy: FetchStrategy; fn: () => Promise<AcquiredMaterial | null> }> {
  const strategies: Array<{ strategy: FetchStrategy; fn: () => Promise<AcquiredMaterial | null> }> = [];

  // 1. Local library (fastest, free)
  strategies.push({
    strategy: { source: "local-library", cost: "free", latency: "fast", quality: 0.8 },
    fn: () => searchLocalMaterialLibrary(req),
  });

  // 2. AI Generation (higher quality, costs API)
  if (req.style === "xiaohei-illustration") {
    strategies.push({
      strategy: { source: "generated:wanx-v1", cost: "api_call", latency: "medium", quality: 0.9 },
      fn: () => generateIllustrationMaterial(req),
    });
  }
  if (req.style === "photorealistic" || req.style === "stock-photo") {
    strategies.push({
      strategy: { source: "generated:gpt-image-2", cost: "api_call", latency: "medium", quality: 0.85 },
      fn: () => generateImageMaterial(req),
    });
  }
  if (req.style === "diagram") {
    strategies.push({
      strategy: { source: "generated:diagram", cost: "api_call", latency: "medium", quality: 0.8 },
      fn: () => generateDiagramMaterial(req),
    });
  }

  // 3. Web search (free but needs curation)
  strategies.push({
    strategy: { source: "search-web", cost: "free", latency: "fast", quality: 0.6 },
    fn: () => searchWebForMaterial(req),
  });

  // 4. Placeholder (always works)
  strategies.push({
    strategy: { source: "fallback:placeholder", cost: "free", latency: "fast", quality: 0.3 },
    fn: () => generatePlaceholderMaterial(req),
  });

  return strategies;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Individual acquisition methods
// ═══════════════════════════════════════════════════════════════════════════════

async function searchLocalMaterialLibrary(req: MaterialRequirement): Promise<AcquiredMaterial | null> {
  // Check projects/<id>/assets/ with semantic profiles
  // In production, also check a shared library at /data/library/
  const profiles = loadProfiles(""); // placeholder — needs projectId
  // Currently a no-op until library infrastructure is built (P3.3)
  return null;
}

async function generateIllustrationMaterial(req: MaterialRequirement): Promise<AcquiredMaterial | null> {
  const { buildImagePrompt } = await import("@/lib/illustration-prompt");
  // Build a minimal IllustrationShot-like object
  const shot = {
    theme: req.description,
    structureType: "概念隐喻",
    coreIdea: req.description,
    xiaoheiAction: req.keywords.join(", "),
    elements: JSON.stringify(req.keywords),
    labels: "[]",
    promptEn: "",
  };
  // This would call DashScope wanx-v1 in production
  // For now, return null to let the next strategy try
  return null;
}

async function generateImageMaterial(req: MaterialRequirement): Promise<AcquiredMaterial | null> {
  try {
    const { generateImage } = await import("@/lib/fal");
    const prompt = `High quality ${req.style} image. ${req.description}. ${req.composition} aspect ratio. Clean professional look. No watermarks, no text overlay.`;
    const result = await generateImage({ prompt });
    return {
      requirementId: req.id,
      filename: `gen-${req.id}.png`,
      source: "generated:gpt-image-2",
      buffer: result.buffer,
    };
  } catch {
    return null;
  }
}

async function generateDiagramMaterial(req: MaterialRequirement): Promise<AcquiredMaterial | null> {
  // Architecture/diagram generation — could use D2, Mermaid, or AI SVG
  // Placeholder: generate a styled text-diagram
  return null;
}

async function searchWebForMaterial(req: MaterialRequirement): Promise<AcquiredMaterial | null> {
  // Search Unsplash, Pexels, Pixabay for free-to-use images
  // For now, placeholder
  return null;
}

async function generatePlaceholderMaterial(req: MaterialRequirement): Promise<AcquiredMaterial> {
  // Always-success fallback: a simple SVG placeholder (no external dependencies)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <rect fill="#f0f0f0" width="640" height="360"/>
  <text fill="#999" font-family="sans-serif" font-size="16" text-anchor="middle" x="320" y="180">
    ${req.description.slice(0, 60)}
  </text>
</svg>`;
  return {
    requirementId: req.id,
    filename: `placeholder-${req.id}.svg`,
    source: "fallback:placeholder",
    buffer: Buffer.from(svg),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main orchestrator: Plan → Acquire → Backfill
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Run the full material planning & acquisition pipeline:
 *   1. Scan blueprints for material requirements
 *   2. Check local availability
 *   3. Acquire missing materials via multi-source pipeline
 *   4. Save acquired materials to project assets/
 *   5. Return the material plan
 *
 * Backfill into blueprints is done separately via backfillBlueprints().
 */
export async function planAndAcquireMaterials(
  projectId: string
): Promise<MaterialPlan> {
  // 1. Scan
  const allReqs = scanAllRequirements(projectId);

  // 2. Check local
  const profiles = loadProfiles(projectId);
  const available: MaterialRequirement[] = [];
  const gaps: MaterialRequirement[] = [];

  for (const req of allReqs) {
    const match = findLocalMatch(req, profiles);
    if (match) {
      available.push(req);
    } else {
      gaps.push(req);
    }
  }

  // 3. Acquire gaps (prioritized by criticality)
  const priorityRank = { critical: 0, high: 1, medium: 2, low: 3 };
  gaps.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  const acquired: AcquiredMaterial[] = [];
  const pendingUser: MaterialRequirement[] = [];

  for (const req of gaps) {
    const strategies = rankStrategies(req);

    let success = false;
    for (const { strategy, fn } of strategies) {
      try {
        const result = await fn();
        if (result) {
          // Save to project assets
          const assetsDir = path.join(projectDir(projectId), "assets");
          fs.mkdirSync(assetsDir, { recursive: true });
          if (result.buffer) {
            fs.writeFileSync(path.join(assetsDir, result.filename), result.buffer);
          }
          acquired.push(result);
          success = true;
          break;
        }
      } catch (err) {
        console.warn(`[material-planner] Strategy ${strategy.source} failed for ${req.id}:`, err);
      }
    }

    if (!success) {
      pendingUser.push(req);
    }
  }

  const plan: MaterialPlan = { requirements: allReqs, available, gaps, acquired, pendingUser };

  // Persist plan
  const planPath = path.join(projectDir(projectId), ".material-plan.json");
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));

  return plan;
}

/**
 * Backfill acquired materials into blueprint files.
 * Replaces requirement declarations with actual asset references.
 */
export async function backfillBlueprints(
  projectId: string,
  plan: MaterialPlan
): Promise<number> {
  const chaptersDir = path.join(projectDir(projectId), "presentation", "src", "chapters");
  if (!fs.existsSync(chaptersDir)) return 0;

  // Build lookup: requirementId → filename
  const lookup = new Map<string, string>();
  for (const mat of plan.acquired) {
    lookup.set(mat.requirementId, mat.filename);
  }

  let replaced = 0;
  const dirs = fs.readdirSync(chaptersDir).filter((d) => {
    const stat = fs.statSync(path.join(chaptersDir, d));
    return stat.isDirectory() && !d.startsWith(".") && !d.startsWith("__");
  });

  for (const chapterId of dirs) {
    const bpPath = path.join(chaptersDir, chapterId, ".blueprint.json");
    if (!fs.existsSync(bpPath)) continue;

    try {
      const bp = JSON.parse(fs.readFileSync(bpPath, "utf-8"));
      let modified = false;

      function replaceInLayout(layout: any): void {
        if (!layout || typeof layout !== "object") return;
        if (layout.type && layout.requirement?.id) {
          const filename = lookup.get(layout.requirement.id);
          if (filename) {
            layout.src = `/api/projects/${projectId}/assets/${filename}`;
            delete layout.requirement;
            modified = true;
            replaced++;
          }
        }
        // Recurse
        for (const val of Object.values(layout)) {
          if (typeof val === "object" && val !== null) replaceInLayout(val);
        }
      }

      for (const step of bp.steps || []) {
        replaceInLayout(step.layout);
      }

      if (modified) {
        fs.writeFileSync(bpPath, JSON.stringify(bp, null, 2));
      }
    } catch { /* skip */ }
  }

  return replaced;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Material requirement summary for agent
// ═══════════════════════════════════════════════════════════════════════════════

export function generateMaterialGapSummary(plan: MaterialPlan): string {
  if (plan.gaps.length === 0 && plan.pendingUser.length === 0) {
    return "✅ 所有素材需求已满足。";
  }

  const lines: string[] = [];
  if (plan.available.length > 0) {
    lines.push(`✅ ${plan.available.length} 个素材已在本地找到。`);
  }
  if (plan.acquired.length > 0) {
    lines.push(`🔧 ${plan.acquired.length} 个素材已自动生成/获取。`);
  }
  if (plan.gaps.length > 0) {
    lines.push(`\n📋 仍需获取 ${plan.gaps.length} 个素材：`);
    for (const g of plan.gaps) {
      lines.push(`  - [${g.priority}] ${g.description.slice(0, 80)} (${g.style}) — 用于: ${g.usedInChapters.join(", ")}`);
    }
  }
  if (plan.pendingUser.length > 0) {
    lines.push(`\n🙋 需用户提供 ${plan.pendingUser.length} 个素材：`);
    for (const p of plan.pendingUser) {
      lines.push(`  - ${p.description.slice(0, 80)} (${p.style})`);
    }
  }

  return lines.join("\n");
}
