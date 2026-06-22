import fs from "fs";
import path from "path";
import { getSkillsRoot } from "@/lib/env";

export interface Skill {
  id: string;             // relative to SKILLS_ROOT, e.g. "disney-animation-rule-skill"
  name: string;
  description: string;
  category?: string;
  version?: string;
  path: string;           // absolute path
  hasManifest: boolean;
  skillMdPath: string;    // absolute path to SKILL.md
  role?: "main";          // from manifest.json — only "main" skills can drive a project workflow

  // ── Manifest context (from manifest.json → context) ──────────────────────
  planFiles: string[];
  alwaysKeepFiles: string[];
  chapterDirPattern: string | null;

  // ── Convention directories (null if absent) ──────────────────────────────
  refsDir: string | null;       // references/
  templatesDir: string | null;  // chapter-templates/ (or equivalent)
  scriptsDir: string | null;    // scripts/
}

const DEFAULT_MAIN_SKILL_ID = "web-video-presentation";

export const SKILLS_ROOT = getSkillsRoot();

// Validate at startup — missing skills breaks the entire app
if (!fs.existsSync(SKILLS_ROOT)) {
  console.error(
    `[skills] SKILLS_ROOT not found: ${SKILLS_ROOT}\n` +
    `  Set SKILLS_ROOT env var to the skills directory path.\n` +
    `  Clone from: git clone <skills-repo> <path>`
  );
}
export const MAIN_SKILL_ID = process.env.MAIN_SKILL_ID?.trim() || DEFAULT_MAIN_SKILL_ID;

interface ManifestData {
  name?: string;
  description?: string;
  category?: string;
  version?: string;
  role?: "main";
  context?: {
    planFiles?: string[];
    alwaysKeepFiles?: string[];
    chapterDirPattern?: string;
  };
}

function readManifest(dir: string): ManifestData {
  const p = path.join(dir, "manifest.json");
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return {};
  }
}

function readSkillMdFirstParagraph(p: string): string {
  if (!fs.existsSync(p)) return "";
  const text = fs.readFileSync(p, "utf-8");
  // Skip leading H1 (# ...) and grab first non-empty paragraph
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length && lines[i].trim().startsWith("#")) i++;
  while (i < lines.length && !lines[i].trim()) i++;
  const buf: string[] = [];
  while (i < lines.length && lines[i].trim()) {
    buf.push(lines[i].trim());
    i++;
  }
  return buf.join(" ").trim().slice(0, 240);
}

/** Detect known convention directories inside a skill root. */
function detectConventionDirs(dir: string): {
  refsDir: string | null;
  templatesDir: string | null;
  scriptsDir: string | null;
} {
  const refs = path.join(dir, "references");
  const templates = path.join(dir, "chapter-templates");
  const scripts = path.join(dir, "scripts");
  return {
    refsDir: fs.existsSync(refs) ? refs : null,
    templatesDir: fs.existsSync(templates) ? templates : null,
    scriptsDir: fs.existsSync(scripts) ? scripts : null,
  };
}

// Directories that are NOT skills themselves — they're template libraries,
// example collections, or documentation dumps that happen to contain SKILL.md.
const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "templates",        // legacy name — skip nested template dirs inside skills
  "visual-frames",    // visual-frames/frame-* — CSS animation iframe library
  "examples",         // example collections inside a skill
  "docs",             // documentation dumps
  "assets",           // media libraries
  "references",       // reference material (skill internal — only detected after SKILL.md found)
  "scripts",          // shell scripts
  "showcase-effects", // demo content
  "presentation",     // prebuilt project scaffolding
  "base",             // prebuilt project scaffolding
  "chapter-templates",// prebuilt chapter templates
  "templates-graphic",// prebuilt graphic templates
  "research",         // research notes
  "packages",         // monorepo packages
  "notes",            // misc notes
]);

function scanDir(dir: string, relBase: string, out: Skill[]) {
  if (!fs.existsSync(dir)) return;
  const skillMd = path.join(dir, "SKILL.md");
  if (fs.existsSync(skillMd)) {
    const id = relBase === "" ? path.basename(dir) : relBase;
    const m = readManifest(dir);
    const descFromMd = readSkillMdFirstParagraph(skillMd);
    const dirs = detectConventionDirs(dir);

    // Parse manifest context block (replaces standalone loadSkillContext)
    const ctx = m.context ?? {};

    out.push({
      id,
      name: m.name ?? id,
      description: m.description ?? descFromMd ?? id,
      category: m.category,
      version: m.version,
      path: dir,
      hasManifest: !!m.name,
      skillMdPath: skillMd,
      role: m.role,
      planFiles: Array.isArray(ctx.planFiles) ? ctx.planFiles : [],
      alwaysKeepFiles: Array.isArray(ctx.alwaysKeepFiles) ? ctx.alwaysKeepFiles : [],
      chapterDirPattern: typeof ctx.chapterDirPattern === "string" ? ctx.chapterDirPattern : null,
      refsDir: dirs.refsDir,
      templatesDir: dirs.templatesDir,
      scriptsDir: dirs.scriptsDir,
    });
    return; // Don't recurse into a skill directory
  }
  // Container directory — recurse into direct children only
  const children = fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && !SKIP_DIR_NAMES.has(d.name));
  for (const c of children) {
    scanDir(path.join(dir, c.name), relBase ? `${relBase}/${c.name}` : c.name, out);
  }
}

/**
 * Scan SKILLS_ROOT for all skill directories. Results are deterministic
 * (sorted by id) but **not** cached — restart the studio to pick up
 * newly added skills.
 */
/**
 * Scan SKILLS_ROOT for all skill directories. Results are deterministic
 * (sorted by id) but **not** cached — restart the studio to pick up
 * newly added skills.
 *
 * Directory layout:
 *   SKILLS_ROOT/
 *     main/   ← contains skills with role:"main" (one per project)
 *     aux/    ← contains auxiliary skills (user-enabled)
 *
 * Skill IDs remain flat (e.g. "web-video-presentation", not "main/web-video-presentation").
 */
export function listAllSkills(): Skill[] {
  if (!fs.existsSync(SKILLS_ROOT)) return [];
  const out: Skill[] = [];
  // Scan both main/ and aux/ containers — IDs are flat (container name not prefixed)
  for (const container of ["main", "aux"]) {
    const dir = path.join(SKILLS_ROOT, container);
    if (!fs.existsSync(dir)) continue;
    const children = fs.readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("."));
    for (const c of children) {
      scanDir(path.join(dir, c.name), c.name, out);
    }
  }
  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}

/**
 * Return the metadata for a specific skill id, or null if not found.
 */
export function getSkill(id: string): Skill | null {
  return listAllSkills().find((s) => s.id === id) ?? null;
}

/**
 * Return all skills whose manifest declares `role: "main"`.
 * These are the "video paradigms" a project can choose as its workflow driver.
 */
export function listMainSkills(): Skill[] {
  return listAllSkills().filter((s) => s.role === "main");
}

/**
 * Resolve the path to a skill's SKILL.md for use in system prompts.
 * Returns null if the skill is not found.
 */
export function resolveSkillPath(id: string): string | null {
  const s = getSkill(id);
  return s ? s.path : null;
}

/**
 * Read a reference file from a skill's references/ directory.
 * Returns the file content as a string, or "" if the skill or file is not found.
 *
 * Usage:
 *   readSkillRef(MAIN_SKILL_ID, "RHYTHM-DESIGN.md")
 *   readSkillRef("ian-xiaohei-illustrations", "xiaohei-ip.md")
 */
export function readSkillRef(skillId: string, filename: string): string {
  const skill = getSkill(skillId);
  if (!skill?.refsDir) return "";
  try {
    return fs.readFileSync(path.join(skill.refsDir, filename), "utf-8");
  } catch {
    return "";
  }
}
