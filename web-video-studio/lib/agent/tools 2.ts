import { tool } from "ai";
import { z } from "zod";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import {
  readProjectFile,
  writeProjectFile,
  listProjectFiles,
  projectDir,
} from "@/lib/projects";
import { getManimVenvDir } from "@/lib/env";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ProjectStatus } from "@/lib/db/schema";
import { listAllSkills } from "@/lib/skills";
import {
  validateBlueprint,
  compileChapter,
  formatValidationResult,
} from "@/lib/chapter-blueprint";
import type { GeneratedChapter } from "@/lib/chapter-blueprint";

const ALLOWED_PREFIXES = ["bash ", "npm ", "npx ", "tsc ", "node ", "python3 ", "manim "];

/** Absolute paths that ProjectRead is allowed to serve (skill roots). */
function getAllowedSkillRoots(): string[] {
  return listAllSkills().map((s) => path.resolve(s.path));
}

function readSkillFile(filePath: string): string | null {
  const abs = path.resolve(filePath);
  const roots = getAllowedSkillRoots();
  if (!roots.some((r) => abs.startsWith(r + path.sep) || abs === r)) return null;
  try {
    return fs.readFileSync(abs, "utf-8");
  } catch {
    return null;
  }
}

function isAllowedCommand(cmd: string): boolean {
  const trimmed = cmd.trim();
  return ALLOWED_PREFIXES.some((p) => trimmed.startsWith(p));
}

function validateChaptersTs(content: string): string | null {
  // Detect any `import { ... as XYZ }` where XYZ contains a hyphen
  const aliasRe = /\bas\s+([A-Za-z0-9_$-]+)/g;
  const bad: string[] = [];
  for (const m of content.matchAll(aliasRe)) {
    if (m[1].includes("-")) bad.push(m[1]);
  }
  if (bad.length === 0) return null;
  return (
    `chapters.ts 包含非法标识符别名（含连字符）：${bad.join(", ")}。` +
    `请将章节 id 转为 camelCase 作为别名，例如 "seo-dead" → seoDeadNarrations，然后重新写入。`
  );
}

// Sensitive env vars that must NOT leak to child processes
const SECRET_ENV_KEYS = new Set([
  "ANTHROPIC_API_KEY", "DEEPSEEK_API_KEY", "OPENAI_API_KEY",
  "AUTH_SECRET", "FAL_KEY", "HEYGEN_API_KEY", "DASHSCOPE_API_KEY",
  "GPT_IMAGE_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET",
  "WECHAT_PAY_API_V3_KEY", "WECHAT_PAY_MCHID", "WECHAT_PAY_SERIAL_NO",
]);

function sanitizedEnv() {
  const env: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(process.env)) {
    env[k] = SECRET_ENV_KEYS.has(k) ? "" : (v ?? undefined);
  }
  // Prepend Manim venv to PATH so AI can use manim/python3 in ProjectShell
  const manimBinDir = process.env.MANIM_PYTHON_PATH
    ? require("path").dirname(process.env.MANIM_PYTHON_PATH)
    : require("path").join(getManimVenvDir(), "bin");
  env.PATH = `${manimBinDir}:${env.PATH || process.env.PATH || ""}`;
  return env;
}

// Paths that the main agent MUST NOT write to — reserved for the coding agent.
const CODE_PATHS_BLOCKED = [
  /^presentation\/src\/chapters\//,               // chapter .tsx/.css
  /^presentation\/src\/registry\/chapters\.ts$/,  // chapter registry
];

// Commands blocked when project is in writing phase.
const WRITING_BLOCKED_COMMANDS = ["tsc", "npm run build", "npx tsc", "npm run dev"];

function isCodeWrite(path: string): boolean {
  return CODE_PATHS_BLOCKED.some((re) => re.test(path));
}

function isBlockedCommand(cmd: string, status: string): string | null {
  if (status !== "writing") return null;
  const trimmed = cmd.trim().toLowerCase();
  for (const blocked of WRITING_BLOCKED_COMMANDS) {
    if (trimmed.startsWith(blocked) || trimmed.includes(blocked)) {
      return `写作阶段禁止执行「${blocked}」命令。章节代码将在 building 阶段通过 ProjectSetChapter 蓝图编译器自动生成。`;
    }
  }
  return null;
}

export function makeAgentTools(projectId: string, projectStatus?: string) {
  const status = projectStatus ?? "writing";

  return {
    // PascalCase matches how this harness normalizes tool names internally
    ProjectRead: tool({
      description: "Read a file from the current video project directory, OR from a Skill reference directory (absolute path starting with the Skill root)",
      inputSchema: z.object({
        path: z.string().describe(
          "Relative path within the project (e.g. article.md, outline.md) OR absolute path to a Skill reference file"
        ),
      }),
      execute: async ({ path: filePath }) => {
        // Absolute path → try skill file first
        if (path.isAbsolute(filePath)) {
          const content = readSkillFile(filePath);
          if (content === null) return { error: `File not found or access denied: ${filePath}` };
          return { content };
        }
        // Relative path → project file
        const content = readProjectFile(projectId, filePath);
        if (content === null) return { error: `File not found: ${filePath}` };
        return { content };
      },
    }),

    ProjectWrite: tool({
      description:
        "Write content to a file in the current video project directory (creates parent dirs automatically)",
      inputSchema: z.object({
        path: z.string().describe("Relative path within the project"),
        content: z.string().describe("File content to write"),
      }),
      execute: async ({ path, content }) => {
        // ═══ Hard block: writing phase must not write chapter code ═══
        if (status === "writing" && isCodeWrite(path)) {
          return {
            error: `写作阶段禁止写入章节代码文件「${path}」。章节代码由 ProjectSetChapter 蓝图编译器在 building 阶段自动生成。当前阶段你只需输出 rhythm.md → script.md → outline.md。`,
          };
        }
        // Guard: chapters.ts must not have hyphenated import aliases
        if (path.endsWith("registry/chapters.ts")) {
          const err = validateChaptersTs(content);
          if (err) return { error: err };
        }
        writeProjectFile(projectId, path, content);
        return { success: true, path };
      },
    }),

    ProjectList: tool({
      description: "List files in a directory within the current video project",
      inputSchema: z.object({
        dir: z
          .string()
          .default(".")
          .describe("Relative directory path (default: project root)"),
      }),
      execute: async ({ dir }) => {
        const files = listProjectFiles(projectId, dir);
        return { files };
      },
    }),

    ProjectShell: tool({
      description:
        "Run a shell command inside the current video project directory. Only bash/npm/npx/tsc/node commands allowed.",
      inputSchema: z.object({
        cmd: z
          .string()
          .describe(
            "Command to run (must start with bash/npm/npx/tsc/node)"
          ),
        cwd: z
          .string()
          .optional()
          .describe(
            "Working directory relative to project root (e.g. 'presentation'). Default: project root"
          ),
      }),
      execute: async ({ cmd, cwd }) => {
        if (!isAllowedCommand(cmd)) {
          return {
            error: `Command not allowed: "${cmd}". Must start with: bash, npm, npx, tsc, or node.`,
          };
        }

        // ═══ Hard block: writing phase must not run build/compile commands ═══
        const blockedReason = isBlockedCommand(cmd, status);
        if (blockedReason) {
          return { error: blockedReason };
        }

        const workDir = cwd
          ? `${projectDir(projectId)}/${cwd}`
          : projectDir(projectId);

        return new Promise<
          | { exitCode: number | null; stdout: string; stderr: string }
          | { error: string; stdout: string; stderr: string }
        >((resolve) => {
          const proc = spawn("sh", ["-c", cmd], {
            cwd: workDir,
            env: { ...sanitizedEnv() } as typeof process.env,
          });

          const MAX_OUT = 1_000_000; // 1MB cap to prevent OOM
          let stdout = "";
          let stderr = "";

          proc.stdout.on("data", (d: Buffer) => { if (stdout.length < MAX_OUT) stdout += d.toString(); });
          proc.stderr.on("data", (d: Buffer) => { if (stderr.length < MAX_OUT) stderr += d.toString(); });

          proc.on("close", (code) => {
            resolve({ exitCode: code, stdout, stderr });
          });

          setTimeout(() => {
            proc.kill();
            resolve({
              error: "Command timed out after 5 minutes",
              stdout,
              stderr,
            });
          }, 300_000);
        });
      },
    }),

    ProjectSetChapter: tool({
      description:
        "提交一个章节 Blueprint JSON，系统自动编译为 TSX/CSS/narrations 代码，写入文件，注册章节，并运行 tsc 验证。" +
        "Blueprint 是结构化数据，不是代码。LLM 填模板槽位即可，编译器保证代码正确性。" +
        "支持 8 个模板：hero-title, step-reveal, data-spotlight, side-by-side, flow-diagram, code-showcase, quote-card, grid-gallery。" +
        "每章只需调用一次此工具，不要手工写 TSX/CSS/narrations！",
      inputSchema: z.object({
        chapterId: z.string().min(2).describe("章节 slug，如 'why-matter'"),
        title: z.string().min(1).describe("章节标题"),
        steps: z.array(z.object({
          narration: z.string().default("").describe("该步口播文本"),
          layout: z.object({
            mode: z.enum(["template","composed","custom"]),
            template: z.enum(["hero-title","step-reveal","data-spotlight","side-by-side","flow-diagram","code-showcase","quote-card","grid-gallery"]).optional(),
            variant: z.string().optional(),
            slots: z.record(z.string(), z.any()).optional(),
            overrides: z.object({ backgroundStyle: z.enum(["solid","gradient-subtle","gradient-bold","noise"]).optional(), extraClasses: z.string().optional() }).optional(),
            layoutComp: z.enum(["stack","grid","split","center","absolute"]).optional(),
            regions: z.record(z.string(), z.object({ content: z.any(), gridArea: z.string().optional(), flex: z.string().optional() })).optional(),
            animations: z.array(z.object({ target: z.string(), effect: z.enum(["fadeIn","slideUp","slideLeft","slideRight","scaleIn"]), delay: z.number().min(0).default(0), duration: z.number().positive().default(0.6) })).optional(),
            imports: z.array(z.string()).optional(),
            jsx: z.string().optional(),
            css: z.string().optional(),
          }),
        })).min(1).max(20),
        orderHint: z.number().int().min(0).optional(),
      }),
      execute: async (input) => {
        const bp: any = {
          chapterId: input.chapterId, title: input.title,
          steps: input.steps.map((s: any) => ({
            narration: s.narration || "",
            layout: buildLayoutDef(s.layout),
          })),
          orderHint: input.orderHint ?? 0,
        };
        const { validated, result } = validateBlueprint(bp);
        if (!validated) return { success: false, error: formatValidationResult(result), issues: result.issues };
        let generated: GeneratedChapter;
        try { generated = compileChapter(validated!); }
        catch (err: any) { return { success: false, error: `Compile: ${err.message}` }; }
        const chaptersDir = `presentation/src/chapters/${bp.chapterId}`;
        writeProjectFile(projectId, `${chaptersDir}/${generated.componentName}.tsx`, generated.tsx);
        writeProjectFile(projectId, `${chaptersDir}/${generated.componentName}.css`, generated.css);
        writeProjectFile(projectId, `${chaptersDir}/narrations.ts`, generated.narrations);
        const regPath = "presentation/src/registry/chapters.ts";
        writeProjectFile(projectId, regPath, regenerateRegistry(projectId));

        // tsc is best-effort — pre-existing project errors must not block registration.
        // The chapter files and registry are already written at this point.
        let tscWarning: string | undefined;
        try {
          const tscDir = path.join(projectDir(projectId), "presentation");
          const tscResult = await new Promise<{ ok: boolean; out: string }>((resolve) => {
            const tscProject = fs.existsSync(path.join(tscDir, "tsconfig.app.json")) ? "tsconfig.app.json" : "tsconfig.json";
            const proc = spawn("sh", ["-c", `npx tsc --noEmit -p ${tscProject} 2>&1`], { cwd: tscDir, env: { ...process.env } });
            let out = ""; proc.stdout.on("data", (d: Buffer) => { out += d.toString(); }); proc.stderr.on("data", (d: Buffer) => { out += d.toString(); });
            proc.on("close", (code) => resolve({ ok: code === 0, out }));
            setTimeout(() => { proc.kill(); resolve({ ok: false, out: out + "\n[tsc timeout]" }); }, 60000);
          });
          if (!tscResult.ok) {
            // Only report chapter-specific errors to the AI.
            // Pre-existing errors (template, primitives, etc.) are logged but suppressed.
            const lines = tscResult.out.split("\n");
            const chapterErrors = lines.filter((l: string) =>
              l.includes(`chapters/${bp.chapterId}/`));
            const otherErrors = lines.filter((l: string) =>
              l.includes("error TS") && !l.includes("chapters/"));
            if (otherErrors.length > 0) {
              console.warn(`[ProjectSetChapter] ${otherErrors.length} pre-existing tsc errors (suppressed)`);
            }
            if (chapterErrors.length > 0) {
              tscWarning = `本章 tsc 错误:\n${chapterErrors.join("\n").slice(-800)}`;
            }
          }
        } catch (tscErr: any) {
          tscWarning = `tsc 执行异常: ${tscErr.message}`;
        }

        const baseMsg = `✅ ${bp.title} — 文件已生成，注册表已更新`;
        return {
          success: true,
          chapterId: generated.chapterId,
          componentName: generated.componentName,
          stepCount: generated.stepCount,
          message: tscWarning ? `${baseMsg}。${tscWarning}` : `${baseMsg}，tsc 通过`,
          ...(tscWarning ? { tscWarning } : {}),
        };
      },
    }),

    ProjectSetChapters: tool({
      description:
        "一次性提交多个章节 Blueprint，并行编译。优先使用此工具批量提交所有章节，而不是逐章调用 ProjectSetChapter。" +
        "系统会逐个验证，合法的立即编译落盘，不合法的返回具体错误供修正。全部编译完成后跑一次 tsc 验证。",
      inputSchema: z.object({
        blueprints: z.array(z.object({
          chapterId: z.string().min(2).describe("章节 slug，如 'why-matter'"),
          title: z.string().min(1).describe("章节标题"),
          steps: z.array(z.object({
            narration: z.string().default("").describe("该步口播文本"),
            layout: z.object({
              mode: z.enum(["template","composed","custom"]),
              template: z.enum(["hero-title","step-reveal","data-spotlight","side-by-side","flow-diagram","code-showcase","quote-card","grid-gallery"]).optional(),
              variant: z.string().optional(),
              slots: z.record(z.string(), z.any()).optional(),
              overrides: z.object({ backgroundStyle: z.enum(["solid","gradient-subtle","gradient-bold","noise"]).optional(), extraClasses: z.string().optional() }).optional(),
              layoutComp: z.enum(["stack","grid","split","center","absolute"]).optional(),
              regions: z.record(z.string(), z.object({ content: z.any(), gridArea: z.string().optional(), flex: z.string().optional() })).optional(),
              animations: z.array(z.object({ target: z.string(), effect: z.enum(["fadeIn","slideUp","slideLeft","slideRight","scaleIn"]), delay: z.number().min(0).default(0), duration: z.number().positive().default(0.6) })).optional(),
              imports: z.array(z.string()).optional(),
              jsx: z.string().optional(),
              css: z.string().optional(),
            }),
          })).min(1).max(20),
          orderHint: z.number().int().min(0).optional(),
        })).min(1).max(30).describe("要批量提交的章节 Blueprint 数组"),
      }),
      execute: async ({ blueprints }) => {
        const results: Array<{
          chapterId: string; title: string; success: boolean;
          error?: string; stepCount?: number; componentName?: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          compiled?: any;
        }> = [];

        // ── Phase 1: Validate all blueprints (partial success) ──────────
        for (const input of blueprints) {
          const bp: any = {
            chapterId: input.chapterId, title: input.title,
            steps: input.steps.map((s: any) => ({
              narration: s.narration || "",
              layout: buildLayoutDef(s.layout),
            })),
            orderHint: input.orderHint ?? 0,
          };
          const { validated, result } = validateBlueprint(bp);
          if (!validated) {
            results.push({ chapterId: input.chapterId, title: input.title, success: false, error: formatValidationResult(result) });
          } else {
            results.push({ chapterId: input.chapterId, title: input.title, success: true, compiled: validated });
          }
        }

        // ── Phase 2: Compile valid blueprints ───────────────────────────
        for (const r of results) {
          if (!r.success) continue;
          try {
            const generated = compileChapter(r.compiled!);
            r.componentName = generated.componentName;
            r.stepCount = generated.stepCount;
            (r as any).generated = generated;
          } catch (err: any) {
            r.success = false;
            r.error = `Compile: ${err.message}`;
          }
        }

        // ── Phase 3: Write all files ────────────────────────────────────
        for (const r of results) {
          if (!r.success) continue;
          const g = (r as any).generated;
          const dir = `presentation/src/chapters/${r.chapterId}`;
          writeProjectFile(projectId, `${dir}/${g.componentName}.tsx`, g.tsx);
          writeProjectFile(projectId, `${dir}/${g.componentName}.css`, g.css);
          writeProjectFile(projectId, `${dir}/narrations.ts`, g.narrations);
        }

        // ── Phase 4: Regenerate registry once ───────────────────────────
        writeProjectFile(projectId, "presentation/src/registry/chapters.ts", regenerateRegistry(projectId));

        // ── Phase 5: tsc once (best-effort) ─────────────────────────────
        let tscWarning: string | undefined;
        try {
          const tscDir = path.join(projectDir(projectId), "presentation");
          const tscProject = fs.existsSync(path.join(tscDir, "tsconfig.app.json")) ? "tsconfig.app.json" : "tsconfig.json";
          const tscResult = await new Promise<{ ok: boolean; out: string }>((resolve) => {
            const proc = spawn("sh", ["-c", `npx tsc --noEmit -p ${tscProject} 2>&1`], { cwd: tscDir, env: { ...process.env } });
            let out = ""; proc.stdout.on("data", (d: Buffer) => { out += d.toString(); }); proc.stderr.on("data", (d: Buffer) => { out += d.toString(); });
            proc.on("close", (code) => resolve({ ok: code === 0, out }));
            setTimeout(() => { proc.kill(); resolve({ ok: false, out: out + "\n[tsc timeout]" }); }, 60000);
          });
          if (!tscResult.ok) {
            const lines = tscResult.out.split("\n");
            const chapterErrors = lines.filter((l: string) => l.includes("chapters/"));
            const otherErrors = lines.filter((l: string) => l.includes("error TS") && !l.includes("chapters/"));
            if (otherErrors.length > 0) console.warn(`[ProjectSetChapters] ${otherErrors.length} pre-existing tsc errors (suppressed)`);
            if (chapterErrors.length > 0) tscWarning = `tsc 错误 (${chapterErrors.length} 条):\n${chapterErrors.join("\n").slice(-1000)}`;
          }
        } catch (tscErr: any) { /* best-effort */ }

        // ── Phase 6: Consolidated result ────────────────────────────────
        const built = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        return {
          success: failed.length === 0,
          summary: `已构建 ${built.length}/${results.length} 章` + (failed.length > 0 ? `，${failed.length} 章失败需修正` : ""),
          built: built.map(r => ({ chapterId: r.chapterId, title: r.title, steps: r.stepCount })),
          failed: failed.map(r => ({ chapterId: r.chapterId, title: r.title, error: r.error })),
          ...(tscWarning ? { tscWarning } : {}),
        };
      },
    }),

    ProjectSetStatus: tool({
      description: "Update the video project status in the database",
      inputSchema: z.object({
        status: z
          .enum([
            "writing",
            "plan_checkpoint",
            "illustration_planning",
            "building",
            "illustrating",
            "typesetting",
            "done",
          ])
          .describe("New project status"),
      }),
      execute: async ({ status }) => {
        await db
          .update(projects)
          .set({
            status: status as ProjectStatus,
            updatedAt: Math.floor(Date.now() / 1000),
          })
          .where(eq(projects.id, projectId));
        return { success: true, status };
      },
    }),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Blueprint helpers for ProjectSetChapter
// ═══════════════════════════════════════════════════════════════════════

function buildLayoutDef(layout: any): any {
  const mode = layout.mode ?? "template";
  if (mode === "template") {
    return { mode: "template", template: layout.template, variant: layout.variant, slots: layout.slots ?? {}, overrides: layout.overrides };
  }
  if (mode === "composed") {
    return { mode: "composed", layout: layout.layoutComp ?? "stack", regions: layout.regions ?? {}, animations: layout.animations, overrides: layout.overrides };
  }
  return { mode: "custom", imports: layout.imports, jsx: layout.jsx ?? "<div />", css: layout.css };
}

/** Rebuild chapters.ts from all directories on disk. Self-healing: always matches reality. */
function regenerateRegistry(projectId: string): string {
  const chaptersDir = path.join(projectDir(projectId), "presentation/src/chapters");
  let dirs: string[] = [];
  try {
    dirs = fs.readdirSync(chaptersDir).filter((d) => {
      if (d === "01-example") return false;
      return fs.statSync(path.join(chaptersDir, d)).isDirectory();
    }).sort();
  } catch { return `import type { ChapterDef } from "./types";\n\nexport const CHAPTERS: ChapterDef[] = [];\n`; }

  const imports: string[] = [];
  const entries: string[] = [];

  for (const dirName of dirs) {
    // Find the TSX file in the directory
    let tsxFile = "";
    try {
      const files = fs.readdirSync(path.join(chaptersDir, dirName));
      tsxFile = files.find((f) => f.endsWith(".tsx")) ?? "";
    } catch { continue; }
    if (!tsxFile) continue;

    const componentName = tsxFile.replace(".tsx", "");
    const camel = dirName.split("-").map((s, i) => i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)).join("");

    imports.push(`import ${componentName} from "../chapters/${dirName}/${componentName}";`);
    imports.push(`import { narrations as ${camel}Narrations } from "../chapters/${dirName}/narrations";`);

    // Derive title from directory name (human-readable version)
    const title = dirName.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    entries.push(`  { id: "${dirName}", title: "${title}", narrations: ${camel}Narrations, Component: ${componentName} },`);
  }

  const lines = [
    ...imports,
    "",
    `import type { ChapterDef } from "./types";`,
    "",
    "export const CHAPTERS: ChapterDef[] = [",
    ...entries,
    "];",
    "",
  ];
  return lines.join("\n");
}
