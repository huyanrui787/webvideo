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
import { publishProjectEvent } from "@/lib/events";
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
import {
  recordValidationFailure,
  recordCompilationFailure,
  recordTscFailure,
  markResolved,
  hashBlueprint,
} from "@/lib/build-telemetry";

const ALLOWED_PREFIXES = ["npm ", "npx ", "tsc ", "python3 ", "manim "];

/** bash/node only allowed for running scripts, not arbitrary -c/-e code */
const BLOCKED_SHELL_FLAGS = /\b(bash|sh)\s+-c\b/;
const BLOCKED_NODE_EVAL = /\bnode\s+-e\b/;

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
  } catch (err: any) {
    if (err?.code !== "ENOENT") console.warn("[tools] readSkillFile failed:", err?.message ?? err);
    return null;
  }
}

function isAllowedCommand(cmd: string): boolean {
  const trimmed = cmd.trim();
  // Deny shell -c and node -e (arbitrary code execution vectors)
  if (BLOCKED_SHELL_FLAGS.test(trimmed)) return false;
  if (BLOCKED_NODE_EVAL.test(trimmed)) return false;
  // Allow npm/npx/tsc/bash/node/python3/manim with script/file arguments
  if (trimmed.startsWith("bash ") || trimmed.startsWith("node ")) return true;
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
    ? path.dirname(process.env.MANIM_PYTHON_PATH)
    : path.join(getManimVenvDir(), "bin");
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

/** Read current project status from DB — avoids stale closure */
async function getCurrentStatus(projectId: string): Promise<string> {
  try {
    const row = await db
      .select({ status: projects.status })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    return row[0]?.status ?? "writing";
  } catch (err: any) {
    console.warn("[tools] getProjectStatus failed:", err?.message ?? err);
    return "writing";
  }
}

/** Caps for tool output — file reads get a generous limit, shell/Python output stays tight */
const FILE_READ_CAP = 60_000;  // ~15k tokens — covers article.md + outline.md + script.md combined
const SHELL_OUTPUT_CAP = 3_000; // shell/Python output stays tight
const TOOL_ERROR_CAP = 1_000;

function capOutput(text: string, maxLen = FILE_READ_CAP): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + `\n\n[输出已截断，原长 ${text.length} chars。如需完整内容，用更精确的路径/命令重新请求。]`;
}

/** Classify error as transient (retriable) or permanent */
function toolError(msg: string, isTransient = false) {
  return { error: msg, isTransient };
}

export function makeAgentTools(projectId: string, _projectStatus?: string) {
  // _projectStatus is kept for backward compatibility but NOT used —
  // each tool reads the real-time status from the DB to avoid stale closure.

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
          if (content === null) return toolError(`File not found or access denied: ${filePath}`);
          return { content: capOutput(content) };
        }
        // Relative path → project file
        const content = readProjectFile(projectId, filePath);
        if (content === null) return toolError(`File not found: ${filePath}`);
        return { content: capOutput(content, FILE_READ_CAP) };
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
        // Guard: prevent writing excessively large files
        const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
        if (Buffer.byteLength(content, "utf-8") > MAX_FILE_BYTES) {
          return toolError(`File too large (${(Buffer.byteLength(content, "utf-8") / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`);
        }
        // ═══ Hard block: writing phase must not write chapter code ═══
        const currentStatus = await getCurrentStatus(projectId);
        if (currentStatus === "writing" && isCodeWrite(path)) {
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
        const currentStatus = await getCurrentStatus(projectId);
        const blockedReason = isBlockedCommand(cmd, currentStatus);
        if (blockedReason) {
          return { error: blockedReason };
        }

        // Validate cwd: reject relative path traversal and absolute paths
        if (cwd && (cwd.includes("..") || path.isAbsolute(cwd))) {
          return { error: `Invalid working directory: "${cwd}". Must be a simple relative path within the project.` };
        }
        const workDir = cwd
          ? path.join(projectDir(projectId), cwd)
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
        "支持 14 个模板：hero-title, step-reveal, data-spotlight, side-by-side, flow-diagram, code-showcase, quote-card, grid-gallery, timeline, comparison-table, before-after, anatomy, progress-bar, testimonial。" +
        "每章只需调用一次此工具，不要手工写 TSX/CSS/narrations！",
      inputSchema: z.object({
        chapterId: z.string().min(2).describe("章节 slug，如 'why-matter'"),
        title: z.string().min(1).describe("章节标题"),
        steps: z.array(z.object({
          narration: z.string().default("").describe("该步口播文本"),
          layout: z.object({
            mode: z.enum(["template","composed","custom"]),
            template: z.enum(["hero-title","step-reveal","data-spotlight","side-by-side","flow-diagram","code-showcase","quote-card","grid-gallery","timeline","comparison-table","before-after","anatomy","progress-bar","testimonial"]).optional(),
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
        if (!validated) {
          recordValidationFailure(projectId, bp.chapterId, bp, bp.steps[0]?.layout?.template, result.issues);
          return { success: false, error: formatValidationResult(result), issues: result.issues };
        }
        // Check for existing chapter before overwriting
        const existingChapterDir = path.join(projectDir(projectId), "presentation", "src", "chapters", bp.chapterId);
        if (fs.existsSync(existingChapterDir)) {
          return {
            success: false,
            error: `章节 "${bp.chapterId}" 已存在（目录: ${existingChapterDir}）。如需重建请先手动删除该目录，或修改 chapterId 创建新章节。`,
            existingChapter: true,
          };
        }
        let generated: GeneratedChapter;
        try { generated = compileChapter(validated!); }
        catch (err: any) {
          recordCompilationFailure(projectId, bp.chapterId, bp, bp.steps[0]?.layout?.template, err.message);
          return { success: false, error: `Compile: ${err.message}` };
        }
        const chaptersDir = `presentation/src/chapters/${bp.chapterId}`;
        writeProjectFile(projectId, `${chaptersDir}/${generated.componentName}.tsx`, generated.tsx);
        writeProjectFile(projectId, `${chaptersDir}/${generated.componentName}.css`, generated.css);
        writeProjectFile(projectId, `${chaptersDir}/narrations.ts`, generated.narrations);
        // Persist the blueprint JSON for telemetry, WYSIWYG backfill, and material planning
        writeProjectFile(projectId, `${chaptersDir}/.blueprint.json`, JSON.stringify(bp, null, 2));
        // Notify frontend via SSE
        publishProjectEvent(projectId, "chapter-built", { chapterId: bp.chapterId, title: bp.title });
        const regPath = "presentation/src/registry/chapters.ts";
        const regContent = regenerateRegistry(projectId);
        writeProjectFile(projectId, regPath, regContent);
        // Verify: retry once if registry came back empty despite having chapter dirs on disk
        if (!regContent.includes('{ id: "')) {
          const retryContent = regenerateRegistry(projectId);
          if (retryContent.includes('{ id: "')) {
            writeProjectFile(projectId, regPath, retryContent);
          }
        }

        // tsc is best-effort — pre-existing project errors must not block registration.
        // The chapter files and registry are already written at this point.
        let tscWarning: string | undefined;
        try {
          const tscDir = path.join(projectDir(projectId), "presentation");
          const tscResult = await new Promise<{ ok: boolean; out: string }>((resolve) => {
            const tscProject = fs.existsSync(path.join(tscDir, "tsconfig.app.json")) ? "tsconfig.app.json" : "tsconfig.json";
            const proc = spawn("sh", ["-c", `npx tsc --noEmit -p ${tscProject} 2>&1`], { cwd: tscDir, env: sanitizedEnv() });
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
              recordTscFailure(projectId, bp.chapterId, bp, bp.steps[0]?.layout?.template, chapterErrors.join("\n"));
            }
          }
        } catch (tscErr: any) {
          tscWarning = `tsc 执行异常: ${tscErr.message}`;
        }

        if (!tscWarning) {
          markResolved(bp.chapterId, hashBlueprint(bp), tscWarning ? `tsc warning fixed: ${tscWarning}` : undefined);
        }

        // ── Completion check: if all outline chapters are now built + tsc clean → auto-done ──
        let buildComplete = false;
        if (!tscWarning) {
          try {
            const outlinePath = path.join(projectDir(projectId), "outline.md");
            if (fs.existsSync(outlinePath)) {
              const outline = fs.readFileSync(outlinePath, "utf-8");
              const outlineCount = (outline.match(/^## \d+\./gm) || []).length;
              const chaptersDir = path.join(projectDir(projectId), "presentation", "src", "chapters");
              const builtCount = fs.existsSync(chaptersDir)
                ? fs.readdirSync(chaptersDir).filter(d => !d.startsWith(".") && !d.startsWith("__") && d !== "01-example").length
                : 0;
              buildComplete = outlineCount > 0 && builtCount >= outlineCount;
            }
          } catch { /* best-effort */ }
        }
        if (buildComplete) {
          try {
            await db.update(projects).set({ status: "done" as ProjectStatus, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(projects.id, projectId));
            publishProjectEvent(projectId, "status-change", { status: "done", auto: true });
          } catch (err: any) { console.warn("[ProjectSetChapter] Auto-done failed:", err?.message ?? err); }
        }

        const baseMsg = `✅ ${bp.title} — 文件已生成，注册表已更新`;
        return {
          success: true,
          chapterId: generated.chapterId,
          componentName: generated.componentName,
          stepCount: generated.stepCount,
          message: tscWarning ? `${baseMsg}。${tscWarning}` : `${baseMsg}，tsc 通过`,
          ...(tscWarning ? { tscWarning } : {}),
          ...(buildComplete ? { buildComplete: true, statusAutoSet: "done" } : {}),
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
              template: z.enum(["hero-title","step-reveal","data-spotlight","side-by-side","flow-diagram","code-showcase","quote-card","grid-gallery","timeline","comparison-table","before-after","anatomy","progress-bar","testimonial"]).optional(),
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
            recordValidationFailure(projectId, bp.chapterId, bp, bp.steps[0]?.layout?.template, result.issues);
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
            recordCompilationFailure(projectId, r.chapterId, r.compiled, (r as any).compiled?.steps?.[0]?.layout?.template, err.message);
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
          // Persist blueprint JSON
          writeProjectFile(projectId, `${dir}/.blueprint.json`, JSON.stringify(r.compiled, null, 2));
          // Notify frontend
          publishProjectEvent(projectId, "chapter-built", { chapterId: r.chapterId, title: r.title });
        }

        // ── Phase 4: Regenerate registry once (with verify + retry) ────
        const regContent = regenerateRegistry(projectId);
        writeProjectFile(projectId, "presentation/src/registry/chapters.ts", regContent);
        // Verify: if registry came back empty despite having chapter dirs on disk, retry once
        if (!regContent.includes('{ id: "')) {
          const retryContent = regenerateRegistry(projectId);
          if (retryContent.includes('{ id: "')) {
            writeProjectFile(projectId, "presentation/src/registry/chapters.ts", retryContent);
          }
        }

        // ── Phase 5: tsc once (best-effort) ─────────────────────────────
        let tscWarning: string | undefined;
        try {
          const tscDir = path.join(projectDir(projectId), "presentation");
          const tscProject = fs.existsSync(path.join(tscDir, "tsconfig.app.json")) ? "tsconfig.app.json" : "tsconfig.json";
          const tscResult = await new Promise<{ ok: boolean; out: string }>((resolve) => {
            const proc = spawn("sh", ["-c", `npx tsc --noEmit -p ${tscProject} 2>&1`], { cwd: tscDir, env: sanitizedEnv() });
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

        // ── Completion detection: check if all outline chapters are built ──
        let buildComplete = false;
        if (failed.length === 0) {
          try {
            const outlinePath = path.join(projectDir(projectId), "outline.md");
            if (fs.existsSync(outlinePath)) {
              const outline = fs.readFileSync(outlinePath, "utf-8");
              const outlineChapters = (outline.match(/^## \d+\./gm) || []).length;
              const chaptersDir = path.join(projectDir(projectId), "presentation", "src", "chapters");
              const builtDirs = fs.existsSync(chaptersDir)
                ? fs.readdirSync(chaptersDir).filter(d => !d.startsWith(".") && !d.startsWith("__") && d !== "01-example")
                : [];
              buildComplete = outlineChapters > 0 && builtDirs.length >= outlineChapters;
            }
          } catch { /* best-effort */ }
        }

        // ── Auto-done: only if all chapters built AND tsc clean (safer) ──
        const tscClean = !tscWarning;
        if (buildComplete && tscClean) {
          try {
            await db
              .update(projects)
              .set({ status: "done" as ProjectStatus, updatedAt: Math.floor(Date.now() / 1000) })
              .where(eq(projects.id, projectId));
            publishProjectEvent(projectId, "status-change", { status: "done", auto: true });
          } catch (err: any) {
            console.warn("[ProjectSetChapters] Auto-done failed:", err?.message ?? err);
          }
        }

        return {
          success: failed.length === 0,
          summary: `已构建 ${built.length}/${results.length} 章` + (failed.length > 0 ? `，${failed.length} 章失败需修正` : ""),
          built: built.map(r => ({ chapterId: r.chapterId, title: r.title, steps: r.stepCount })),
          failed: failed.map(r => ({ chapterId: r.chapterId, title: r.title, error: r.error })),
          ...(tscWarning ? { tscWarning } : {}),
          ...(buildComplete ? {
            buildComplete: true,
            statusAutoSet: "done",
            message: "所有章节已构建完成。项目状态已自动设为 'done'。可以预览或录制视频了。",
          } : {}),
        };
      },
    }),

    ProjectRecommendTemplates: tool({
      description:
        "根据章节内容特征和语调，推荐最适合的模板组合。在编写 Blueprint 之前调用此工具，获取模板建议。" +
        "适用于：不确定该用什么模板、内容类型超出常规范围、需要混合使用多个模板。",
      inputSchema: z.object({
        chapterContent: z.string().describe("章节内容摘要或要点（200字以内）"),
        tone: z.enum(["technical", "story", "data-driven", "persuasive", "tutorial"]).describe("内容语调"),
        hasUserAssets: z.boolean().default(false).describe("是否有用户上传的图片/视频素材"),
        highlightType: z.enum(["comparison", "process", "statistic", "concept", "code", "showcase"]).describe("核心表达需求"),
      }),
      execute: async ({ chapterContent, tone, hasUserAssets, highlightType }) => {
        // ── Template recommendation rules ──────────────────────────────
        const rules: Record<string, { templates: string[]; reason: string }> = {
          "technical:comparison": { templates: ["side-by-side", "data-spotlight"], reason: "技术对比适合左右对照 + 核心数据强调" },
          "technical:process": { templates: ["flow-diagram", "step-reveal"], reason: "技术流程适合流程节点图 + 分步揭示" },
          "technical:code": { templates: ["code-showcase", "side-by-side"], reason: "代码展示为主，可配合对照面板" },
          "technical:concept": { templates: ["hero-title", "flow-diagram", "step-reveal"], reason: "概念讲解：标题定调 + 流程图/分步展开" },
          "story:process": { templates: ["step-reveal", "quote-card", "hero-title"], reason: "故事叙述适合分步展开 + 引用点睛 + 标题开场" },
          "story:concept": { templates: ["hero-title", "quote-card", "grid-gallery"], reason: "感性概念：标题渲染情绪 + 引用 + 图片叙事" },
          "data-driven:statistic": { templates: ["data-spotlight", "comparison-table", "progress-bar"], reason: "数据驱动适合核心数字 + 对比表格 + 进度条" },
          "data-driven:comparison": { templates: ["side-by-side", "data-spotlight", "comparison-table"], reason: "数据对比：左右对照 + 数据高亮 + 对比表" },
          "persuasive:comparison": { templates: ["side-by-side", "before-after", "quote-card"], reason: "说服型对比：前后对比 + 引用背书" },
          "persuasive:concept": { templates: ["hero-title", "data-spotlight", "testimonial"], reason: "说服概念：强势标题 + 关键数字 + 客户证言" },
          "tutorial:process": { templates: ["step-reveal", "code-showcase", "anatomy"], reason: "教程流程：分步 + 代码展示 + 界面标注" },
          "tutorial:code": { templates: ["code-showcase", "step-reveal", "side-by-side"], reason: "代码教程：代码主视觉 + 分步讲解" },
        };

        const key = `${tone}:${highlightType}`;
        const match = rules[key] ?? { templates: ["step-reveal", "hero-title", "data-spotlight"], reason: "通用推荐：分步展开 + 标题 + 数据支撑" };

        // Adjust if user has assets
        let bonusTemplates: string[] = [];
        if (hasUserAssets) {
          bonusTemplates = ["grid-gallery", "anatomy"];
        }

        const recommendations = [...new Set([...match.templates, ...bonusTemplates])];

        // ── Detailed guidance per template ──────────────────────────────
        const guidance: Record<string, string> = {
          "hero-title": "用于章节开场或核心理念陈述。只需 kicker + title + subtitle 三个槽位。",
          "step-reveal": "用于分点论述、操作步骤、要点总结。每步 = heading + body + 可选 media。",
          "data-spotlight": "用于放大核心数字。primaryValue + primaryLabel + context。适合 1-2 个关键指标。",
          "side-by-side": "用于对比、选择决策。left + right 各一个 panel，divider 用 vs/arrow/none。",
          "flow-diagram": "用于流程、链路、架构。nodes 2-10 个，edges 可选（默认串联）。",
          "code-showcase": "用于展示代码。code + language + 可选 highlights + annotations。",
          "quote-card": "用于引用、客户评价、金句。quote + attribution。",
          "grid-gallery": "用于多张图片/视频展示。items 2-12 个，columns 2-4。",
          "comparison-table": "用于功能对比、方案选型。rows × cols 结构化数据。",
          "before-after": "用于优化前后对比。左右或上下分屏，适合视觉效果对比。",
          "timeline": "用于时间线、里程碑、路线图。按时间点排列的事件序列。",
          "anatomy": "用于产品/界面标注。在图片上放置引导线和标签。",
          "progress-bar": "用于完成度、目标达成率。单一进度指标 + 标签。",
          "testimonial": "用于客户案例、用户评价。大引号 + 头像 + 署名。",
        };

        return {
          recommendations,
          primaryReason: match.reason,
          guidance: Object.fromEntries(
            recommendations.map((t) => [t, guidance[t] ?? "通用模板，按槽位文档填写"])
          ),
          tip: "每章混合 2-3 种模板效果最佳。开场用 hero-title，主体用 step-reveal/flow-diagram，对比用 side-by-side，收尾用 quote-card。",
        };
      },
    }),

    ProjectValidateBlueprint: tool({
      description:
        "预校验 Blueprint，不提交文件。返回校验结果供 AI 自行修正。在调用 ProjectSetChapter 之前先调用此工具可以避免提交无效 Blueprint。" +
        "校验三层：L1 Zod schema、L2 语义（槽位完整性/引用正确）、L3 设计规范（Token 使用）。",
      inputSchema: z.object({
        chapterId: z.string().min(2).describe("章节 slug"),
        title: z.string().min(1).describe("章节标题"),
        steps: z.array(z.object({
          narration: z.string().default(""),
          layout: z.object({
            mode: z.enum(["template","composed","custom"]),
            template: z.enum(["hero-title","step-reveal","data-spotlight","side-by-side","flow-diagram","code-showcase","quote-card","grid-gallery","timeline","comparison-table","before-after","anatomy","progress-bar","testimonial"]).optional(),
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
        if (!validated) {
          return {
            valid: false,
            issues: result.issues,
            formattedError: formatValidationResult(result),
            tip: "根据以上错误修正 Blueprint 后重新调用此工具验证。常见修正：确保必填字段非空（title, quote, heading）、不要使用硬编码颜色/字体、template 名称使用正确 ID。",
          };
        }
        const templatesUsed = [...new Set(
          validated!.steps.map((s: any) => s.layout?.template).filter(Boolean)
        )] as string[];
        return {
          valid: true,
          stepCount: validated!.steps.length,
          templatesUsed,
          message: `✅ 校验通过。${validated!.steps.length} 步，使用模板: ${templatesUsed.join(", ") || "composed/custom"}。可以安全调用 ProjectSetChapter 提交。`,
        };
      },
    }),

    ProjectPlanMaterials: tool({
      description:
        "扫描所有已提交的 Blueprint，分析素材需求缺口，按优先级自动获取素材（生成→本地库→联网搜索→向用户索取）。" +
        "在 Building 阶段完成、Blueprint 全部提交后调用此工具，确保所有 MediaRef 的 requirement 得到满足。",
      inputSchema: z.object({
        action: z.enum(["analyze", "acquire", "summary"]).default("summary").describe("analyze=仅分析缺口, acquire=分析并自动获取, summary=显示获取结果"),
      }),
      execute: async ({ action }) => {
        try {
          const { scanAllRequirements, planAndAcquireMaterials, generateMaterialGapSummary } =
            await import("@/lib/material-planner");

          if (action === "analyze") {
            const reqs = scanAllRequirements(projectId);
            const gapSummary = reqs.length > 0
              ? `发现 ${reqs.length} 个素材需求，分布在 ${[...new Set(reqs.map(r => r.usedInChapters))].length} 个章节。`
              : "未发现素材需求（所有 MediaRef 都有 src 或未声明 requirement）。";
            return { success: true, action: "analyze", totalRequirements: reqs.length, summary: gapSummary };
          }

          if (action === "acquire") {
            const plan = await planAndAcquireMaterials(projectId);
            const summary = generateMaterialGapSummary(plan);
            return {
              success: true, action: "acquire",
              totalRequirements: plan.requirements.length,
              available: plan.available.length,
              acquired: plan.acquired.length,
              pendingUser: plan.pendingUser.length,
              summary,
              acquiredList: plan.acquired.map(a => ({ filename: a.filename, source: a.source, requirementId: a.requirementId })),
              pendingUserList: plan.pendingUser.map(p => ({ description: p.description, style: p.style, priority: p.priority })),
            };
          }

          // summary: read existing plan from disk
          const planPath = path.join(projectDir(projectId), ".material-plan.json");
          if (fs.existsSync(planPath)) {
            const plan = JSON.parse(fs.readFileSync(planPath, "utf-8"));
            const summary = generateMaterialGapSummary(plan);
            return { success: true, action: "summary", summary, plan };
          }
          return { success: true, action: "summary", summary: "尚未执行素材规划。使用 action=acquire 开始。", plan: null };
        } catch (err: any) {
          return { success: false, error: `Material planner failed: ${err.message}` };
        }
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
        // Notify frontend via SSE so it can react to status changes immediately
        publishProjectEvent(projectId, "status-change", { status });
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
  } catch (err: any) {
    console.warn("[tools] regenerateRegistry failed:", err?.message ?? err);
    return `import type { ChapterDef } from "./types";\n\nexport const CHAPTERS: ChapterDef[] = [];\n`;
  }

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
