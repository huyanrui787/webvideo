import fs from "fs";
import path from "path";
import { projectDir } from "@/lib/projects";

export interface WysiwygEdit {
  chapter: string;
  step: number;
  selector: string;
  selectorIndex: number;
  // Layout
  translate: string | null;
  width: string | null;
  height: string | null;
  // Visibility & layering
  hidden: boolean;
  opacity: number | null;       // 0-1
  zIndex: number | null;
  // Transform
  scale: number | null;         // 0.5-3.0
  // Typography
  fontSize: string | null;      // e.g. "var(--t-h2)" or "24px"
  color: string | null;         // only token values accepted: var(--token)
  // Decoration
  borderRadius: string | null;  // e.g. "8px" or "var(--radius-md)"
  // Image
  objectFit: "contain" | "cover" | null;
  // Custom CSS override (for advanced users)
  extraCSS: string | null;      // injected as inline style properties
}

export interface WysiwygManifest {
  version: 1;
  edits: WysiwygEdit[];
}

export function editKey(e: Pick<WysiwygEdit, "chapter" | "step" | "selector" | "selectorIndex">): string {
  const ch = e.chapter ?? "unknown";
  const st = e.step ?? 0;
  const sel = e.selector ?? "unknown";
  const idx = e.selectorIndex ?? 0;
  return `${ch}:${st}:${sel}:${idx}`;
}

function editsPath(projectId: string): string {
  return path.join(projectDir(projectId), "presentation", "src", ".wysiwyg-edits.json");
}

export function readEdits(projectId: string): WysiwygManifest {
  try {
    const raw = fs.readFileSync(editsPath(projectId), "utf8");
    const parsed = JSON.parse(raw) as WysiwygManifest;
    if (parsed?.version === 1 && Array.isArray(parsed.edits)) return parsed;
  } catch {
    // file absent or malformed
  }
  return { version: 1, edits: [] };
}

export function writeEdits(projectId: string, manifest: WysiwygManifest): void {
  const p = editsPath(projectId);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(manifest, null, 2), "utf8");
}

export function upsertEdit(projectId: string, entry: WysiwygEdit): WysiwygManifest {
  const manifest = readEdits(projectId);
  const key = editKey(entry);
  const idx = manifest.edits.findIndex((e) => editKey(e) === key);
  if (idx >= 0) {
    manifest.edits[idx] = entry;
  } else {
    manifest.edits.push(entry);
  }
  writeEdits(projectId, manifest);
  return manifest;
}

export function deleteEdit(projectId: string, key: string): WysiwygManifest {
  const manifest = readEdits(projectId);
  manifest.edits = manifest.edits.filter((e) => editKey(e) !== key);
  writeEdits(projectId, manifest);
  return manifest;
}

export function clearEdits(projectId: string): WysiwygManifest {
  const manifest: WysiwygManifest = { version: 1, edits: [] };
  writeEdits(projectId, manifest);
  return manifest;
}
