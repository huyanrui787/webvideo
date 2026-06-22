/**
 * Local Material Library — project-scoped and shared asset repositories.
 *
 * Two tiers:
 *   1. Project-scoped: <projectDir>/assets/ (already handled by asset-analyzer.ts)
 *   2. Shared library: <dataDir>/library/ (cross-project, accumulates over time)
 *
 * Each asset in the shared library has:
 *   - Semantic tags (AI-generated)
 *   - Visual feature embedding (for similarity search)
 *   - Usage tracking + rating
 *   - License info
 *
 * Search uses a simple keyword-overlap algorithm; in production, replace with
 * a vector DB (pgvector / Qdrant) + CLIP embeddings for truly semantic search.
 */

import fs from "fs";
import path from "path";
import { getProjectsDir } from "@/lib/env";

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface LibraryAsset {
  id: string;
  filePath: string;          // relative to library root
  thumbnailPath?: string;
  originalName: string;
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;

  // Semantic tags (AI-generated on import)
  semanticTags: string[];
  aiDescription: string;

  // Visual features (CLIP embedding or color histogram)
  visualFeatures?: number[];

  // Metadata
  style: string;             // "photorealistic" | "illustration" | "diagram" | etc.
  source: string;            // "user-upload" | "generated" | "web-download"
  sourceUrl?: string;
  license: "free" | "licensed" | "unknown";
  attribution?: string;

  // Usage tracking
  usageCount: number;
  lastUsedAt?: number;
  rating: number;            // 0-5, user-assigned
  addedAt: number;
}

export interface LibrarySearchResult {
  asset: LibraryAsset;
  score: number;             // 0-1 relevance score
  matchReason: string;       // "keyword overlap: product, dashboard" | "semantic: similar subject"
}

// ═══════════════════════════════════════════════════════════════════════════════
// Library path
// ═══════════════════════════════════════════════════════════════════════════════

function libraryRoot(): string {
  const projectsRoot = getProjectsDir();
  const libDir = path.join(projectsRoot, "..", "library");
  fs.mkdirSync(libDir, { recursive: true });
  return libDir;
}

function libraryIndexPath(): string {
  return path.join(libraryRoot(), "index.json");
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRUD
// ═══════════════════════════════════════════════════════════════════════════════

export function loadLibrary(): LibraryAsset[] {
  try {
    const raw = fs.readFileSync(libraryIndexPath(), "utf-8");
    return JSON.parse(raw) as LibraryAsset[];
  } catch {
    return [];
  }
}

function saveLibrary(assets: LibraryAsset[]): void {
  fs.writeFileSync(libraryIndexPath(), JSON.stringify(assets, null, 2));
}

export function addToLibrary(asset: Omit<LibraryAsset, "id" | "addedAt" | "usageCount" | "rating"> & { id?: string }): LibraryAsset {
  const assets = loadLibrary();

  // Dedup by filePath
  const existing = assets.find((a) => a.filePath === asset.filePath);
  if (existing) return existing;

  const newAsset: LibraryAsset = {
    ...asset,
    id: asset.id ?? `lib-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    addedAt: Date.now(),
    usageCount: 0,
    rating: 0,
  };

  assets.push(newAsset);
  saveLibrary(assets);
  return newAsset;
}

export function removeFromLibrary(assetId: string): boolean {
  const assets = loadLibrary();
  const idx = assets.findIndex((a) => a.id === assetId);
  if (idx < 0) return false;
  assets.splice(idx, 1);
  saveLibrary(assets);
  return true;
}

export function recordUsage(assetId: string): void {
  const assets = loadLibrary();
  const asset = assets.find((a) => a.id === assetId);
  if (!asset) return;
  asset.usageCount++;
  asset.lastUsedAt = Date.now();
  saveLibrary(assets);
}

export function rateAsset(assetId: string, rating: number): void {
  const assets = loadLibrary();
  const asset = assets.find((a) => a.id === assetId);
  if (!asset) return;
  asset.rating = Math.max(0, Math.min(5, rating));
  saveLibrary(assets);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Search
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Search the library for assets matching the given query.
 * Currently uses keyword overlap scoring. In production, replace with
 * embedding similarity search (pgvector + CLIP/ResNet features).
 */
export function searchLibrary(
  query: string,
  keywords: string[],
  opts: {
    style?: string;
    minWidth?: number;
    minHeight?: number;
    limit?: number;
  } = {}
): LibrarySearchResult[] {
  const assets = loadLibrary();
  const limit = opts.limit ?? 10;

  const queryWords = new Set([
    ...query.toLowerCase().split(/\s+/).filter((w) => w.length > 1),
    ...keywords.map((k) => k.toLowerCase()),
  ]);

  const results: LibrarySearchResult[] = [];

  for (const asset of assets) {
    // Style filter
    if (opts.style && asset.style !== opts.style) continue;

    // Resolution filter
    if (opts.minWidth && asset.width < opts.minWidth) continue;
    if (opts.minHeight && asset.height < opts.minHeight) continue;

    // Compute keyword overlap score
    const assetWords = new Set([
      ...asset.semanticTags.map((t) => t.toLowerCase()),
      ...asset.aiDescription.toLowerCase().split(/\s+/),
      ...asset.originalName.toLowerCase().split(/[-_\s]/),
    ]);

    let overlap = 0;
    for (const w of queryWords) {
      if (assetWords.has(w)) overlap++;
    }

    // Boost by usage count (popular assets rank higher)
    const usageBoost = Math.min(asset.usageCount / 20, 0.3);
    const ratingBoost = asset.rating / 10; // max +0.5
    const score = queryWords.size > 0
      ? (overlap / queryWords.size) + usageBoost + ratingBoost
      : 0;

    if (score > 0.1 || queryWords.size === 0) {
      results.push({
        asset,
        score: Math.min(score, 1.0),
        matchReason: overlap > 0
          ? `关键词匹配: ${overlap}/${queryWords.size}`
          : "无关键词匹配（按热度排序）",
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

/**
 * Import a project asset into the shared library.
 * Useful when a user-generated image turns out to be broadly useful.
 */
export async function importToLibrary(
  projectId: string,
  assetName: string
): Promise<LibraryAsset | null> {
  const { projectDir } = await import("@/lib/projects");
  const { getProfile } = await import("@/lib/asset-analyzer");

  const srcPath = path.join(projectDir(projectId), "assets", assetName);
  if (!fs.existsSync(srcPath)) return null;

  const ext = path.extname(assetName);
  const mimeType = ext === ".png" ? "image/png"
    : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg"
    : ext === ".webp" ? "image/webp"
    : ext === ".svg" ? "image/svg+xml"
    : ext === ".mp4" ? "video/mp4"
    : "application/octet-stream";

  // Copy to library
  const destName = `${Date.now()}-${assetName}`;
  const destPath = path.join(libraryRoot(), destName);
  fs.copyFileSync(srcPath, destPath);

  // Get semantic profile if available
  const profile = getProfile(projectId, assetName);
  const stats = fs.statSync(srcPath);

  return addToLibrary({
    filePath: destName,
    originalName: assetName,
    mimeType,
    width: profile?.dimensions?.width ?? 0,
    height: profile?.dimensions?.height ?? 0,
    fileSize: stats.size,
    semanticTags: profile?.subject ? profile.subject.split(/\s+/) : [],
    aiDescription: profile?.subject ?? assetName,
    style: profile?.contentType ?? "unknown",
    source: "user-upload",
    license: "unknown",
  });
}

/**
 * Generate a summary of library statistics for the admin UI.
 */
export function libraryStats(): {
  totalAssets: number;
  totalSize: number;
  byStyle: Record<string, number>;
  byLicense: Record<string, number>;
  topUsed: LibraryAsset[];
  recentlyAdded: LibraryAsset[];
} {
  const assets = loadLibrary();

  const byStyle: Record<string, number> = {};
  const byLicense: Record<string, number> = {};
  let totalSize = 0;

  for (const a of assets) {
    byStyle[a.style] = (byStyle[a.style] ?? 0) + 1;
    byLicense[a.license] = (byLicense[a.license] ?? 0) + 1;
    totalSize += a.fileSize;
  }

  const sorted = [...assets].sort((a, b) => b.usageCount - a.usageCount);
  const recent = [...assets].sort((a, b) => b.addedAt - a.addedAt);

  return {
    totalAssets: assets.length,
    totalSize,
    byStyle,
    byLicense,
    topUsed: sorted.slice(0, 10),
    recentlyAdded: recent.slice(0, 10),
  };
}
