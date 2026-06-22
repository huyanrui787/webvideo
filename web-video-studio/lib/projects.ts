import path from "path";
import fs from "fs";
import { getProjectsDir } from "@/lib/env";

const PROJECTS_ROOT = getProjectsDir();

/** Absolute path to a project's directory */
export function projectDir(id: string): string {
  return path.join(PROJECTS_ROOT, id);
}

/** Resolve and validate a path is inside the project directory (prevent traversal) */
function safePath(id: string, relPath: string): string {
  const base = projectDir(id);
  const resolved = path.resolve(base, relPath);
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    throw new Error(`Path traversal detected: ${relPath}`);
  }
  return resolved;
}

/** Read a file from the project directory. Returns null if not found. */
export function readProjectFile(id: string, relPath: string): string | null {
  try {
    return fs.readFileSync(safePath(id, relPath), "utf-8");
  } catch {
    return null;
  }
}

/** Write a file to the project directory. Creates parent dirs automatically. */
export function writeProjectFile(
  id: string,
  relPath: string,
  content: string
): void {
  const fullPath = safePath(id, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf-8");
}

/** List files in a directory within the project. Returns [] if not found. */
export function listProjectFiles(id: string, relDir: string = "."): string[] {
  try {
    const fullPath = safePath(id, relDir);
    return fs.readdirSync(fullPath);
  } catch {
    return [];
  }
}

/** Ensure the project directory exists */
export function ensureProjectDir(id: string): void {
  fs.mkdirSync(projectDir(id), { recursive: true });
}

// ─── Asset meta (caption + tags for project-local assets) ────────────────────

interface AssetMeta { caption: string; tags: string[]; durationSec?: number }
type AssetMetaMap = Record<string, AssetMeta>;

function assetMetaPath(id: string): string {
  return path.join(projectDir(id), "assets", "meta.json");
}

export function readAssetMeta(id: string): AssetMetaMap {
  try { return JSON.parse(fs.readFileSync(assetMetaPath(id), "utf-8")); }
  catch { return {}; }
}

function writeAssetMeta(id: string, map: AssetMetaMap): void {
  const p = assetMetaPath(id);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(map, null, 2), "utf-8");
}

export function patchAssetMeta(id: string, filename: string, patch: Partial<AssetMeta>): void {
  const map = readAssetMeta(id);
  const existing: AssetMeta = map[filename] ?? { caption: "", tags: [] };
  map[filename] = { ...existing, ...patch };
  writeAssetMeta(id, map);
}
