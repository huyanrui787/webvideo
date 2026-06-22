/**
 * Reads the active Skill's manifest.json and exposes its `context` block.
 *
 * This is the single place where Studio learns about Skill-specific file
 * structure conventions. All prune / route logic must consume this instead
 * of hardcoding Skill-internal paths.
 *
 * If the Skill manifest has no `context` block (older Skill or different Skill),
 * the returned object has empty/null values and pruning degrades gracefully
 * (no-op rather than breaking).
 */

import fs from "fs";
import path from "path";

export interface SkillContext {
  /** Files that hold the project plan — only latest read is kept in history */
  planFiles: Set<string>;
  /** Files that must never be truncated in history (content always needed) */
  alwaysKeepFiles: Set<string>;
  /** Relative dir pattern identifying chapter source files (e.g. "presentation/src/chapters") */
  chapterDirPattern: string | null;
}

/**
 * Read the active Skill's manifest.json and expose its `context` block.
 *
 * No caching — the manifest is a small JSON file and OS-level caching makes
 * repeated reads essentially free. Avoiding a module-level cache prevents
 * stale data from persisting across the entire server process lifetime.
 */
export function loadSkillContext(skillRoot: string): SkillContext {
  const manifestPath = path.join(skillRoot, "manifest.json");
  try {
    const raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    const ctx = raw.context ?? {};
    return {
      planFiles: new Set<string>(Array.isArray(ctx.planFiles) ? ctx.planFiles : []),
      alwaysKeepFiles: new Set<string>(Array.isArray(ctx.alwaysKeepFiles) ? ctx.alwaysKeepFiles : []),
      chapterDirPattern: typeof ctx.chapterDirPattern === "string" ? ctx.chapterDirPattern : null,
    };
  } catch {
    // Manifest missing or unreadable — safe fallback (no pruning of plan/chapter files)
    return {
      planFiles: new Set(),
      alwaysKeepFiles: new Set(),
      chapterDirPattern: null,
    };
  }
}
