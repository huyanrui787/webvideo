import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { projectDir, writeProjectFile } from "./projects";
import type { Project } from "./db/schema";
import { publishProjectEvent } from "@/lib/events";
import {
  validateBlueprint,
  compileChapter,
  formatValidationResult,
} from "@/lib/chapter-blueprint";
import type { ChapterBlueprint, GeneratedChapter } from "@/lib/chapter-blueprint";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChapterBuildStatus {
  id: string;
  dirName: string;
  title: string;
  status: "pending" | "building" | "validating" | "done" | "review" | "error" | "skipped" | "timeout";
  error?: string;
  tscErrors?: string;
  startedAt?: number;
  finishedAt?: number;
  retries?: number;
}

export interface ParallelBuildJob {
  status: "running" | "done" | "error" | "partial";
  chapters: ChapterBuildStatus[];
  assemblyStatus: "pending" | "running" | "done" | "error";
  assemblyError?: string;
  tscOutput?: string;
  startedAt: number;
  finishedAt?: number;
}

const jobs = new Map<string, ParallelBuildJob>();

// ── Disk persistence: save/load build job state ──────────────────────────
function buildJobPath(projectId: string): string {
  return path.join(projectDir(projectId), ".build-job.json");
}
function saveJobToDisk(projectId: string, job: ParallelBuildJob): void {
  try { fs.writeFileSync(buildJobPath(projectId), JSON.stringify(job)); } catch { /* ignore */ }
  publishProjectEvent(projectId, "build", {
    status: job.status,
    doneChapters: job.chapters?.filter((c) => c.status === "done").length ?? 0,
    totalChapters: job.chapters?.length ?? 0,
    assemblyStatus: job.assemblyStatus,
  });
}

export function getParallelBuildJob(projectId: string): ParallelBuildJob | null {
  const job = jobs.get(projectId);
  if (job) return job;

  // Recover from disk (survives server restart)
  try {
    const p = buildJobPath(projectId);
    if (fs.existsSync(p)) {
      const recovered = JSON.parse(fs.readFileSync(p, "utf-8")) as ParallelBuildJob;
      // A "running" job on disk means the server restarted mid-build.
      // Mark pending/building chapters as review so the user can retry.
      recovered.chapters = recovered.chapters.map((c) => ({
        ...c,
        status: c.status === "building" || c.status === "validating" ? "review" as const
          : c.status === "pending" ? "review" as const
          : c.status,
      }));
      recovered.status = recovered.status === "running" ? "partial" : recovered.status;
      jobs.set(projectId, recovered);
      return recovered;
    }
  } catch { /* ignore */ }

  return null;
}

// Convert a hyphenated chapter id to a camelCase identifier prefix
// e.g. "seo-dead" → "seoDead", "launch-cadence" → "launchCadence"
function idToCamel(id: string): string {
  return id
    .split("-")
    .map((seg, i) => (i === 0 ? seg : seg.charAt(0).toUpperCase() + seg.slice(1)))
    .join("");
}

// ── Incremental assembly: update chapters.ts after each chapter completes ─
function incrementalAssemble(projectId: string, chapter: { id: string; dirName: string; title: string; componentName: string }): void {
  const chaptersFile = path.join(projectDir(projectId), "presentation/src/registry/chapters.ts");
  const dir = path.join(projectDir(projectId), "presentation/src/chapters", chapter.dirName);
  // Verify directory and component exist
  if (!fs.existsSync(dir)) return;
  const tsx = fs.readdirSync(dir).find((f) => f.endsWith(".tsx"));
  if (!tsx) return;

  const camel = idToCamel(chapter.id);
  const componentName = tsx.replace(".tsx", "");
  const newImport = `import ${componentName} from "../chapters/${chapter.dirName}/${componentName}";`;
  const newNarrationImport = `import { narrations as ${camel}Narrations } from "../chapters/${chapter.dirName}/narrations";`;
  const newEntry = `  { id: "${chapter.id}", title: "${chapter.title}", narrations: ${camel}Narrations, Component: ${componentName}, },`;

  let content: string;
  if (fs.existsSync(chaptersFile)) {
    content = fs.readFileSync(chaptersFile, "utf-8");
  } else {
    content = `import type { ChapterDef } from "./types";\n\nexport const CHAPTERS: ChapterDef[] = [];\n`;
  }

  // Idempotent: skip if already registered
  if (content.includes(`id: "${chapter.id}"`)) return;

  // Add imports before the CHAPTERS array, entries inside it.
  // Use anchored patterns to avoid accidental matches in comments or strings.
  content = content.replace(
    /^export const CHAPTERS/m,
    `${newImport}\n${newNarrationImport}\n\nexport const CHAPTERS`
  );
  // Only replace the closing bracket at end of file (chapters.ts always ends with ];\n)
  content = content.replace(/];\s*$/, `\n${newEntry}\n];`);
  fs.writeFileSync(chaptersFile, content, "utf-8");
}

/** Assemble chapters.ts from a chapter list with known dirName values. */
function assembleFromDisk(
  projectId: string,
  chapters: Array<{ id: string; dirName: string; title: string }>
): string {
  const chaptersDir = path.join(projectDir(projectId), "presentation/src/chapters");
  const existing = new Set(
    fs.existsSync(chaptersDir)
      ? fs.readdirSync(chaptersDir)
          .filter((d) => fs.statSync(path.join(chaptersDir, d)).isDirectory())
          .sort() // deterministic order across filesystems
      : []
  );

  const valid: Array<{
    id: string;
    dirName: string;
    title: string;
    componentName: string;
  }> = [];

  for (const c of chapters) {
    if (!existing.has(c.dirName)) continue;
    const dirPath = path.join(chaptersDir, c.dirName);
    const tsx = fs.readdirSync(dirPath).find((f) => f.endsWith(".tsx"));
    if (!tsx) continue;
    valid.push({
      id: c.id,
      dirName: c.dirName,
      title: c.title,
      componentName: tsx.replace(".tsx", ""),
    });
  }

  const lines: string[] = [`import type { ChapterDef } from "./types";`];
  for (const c of valid) {
    const camel = idToCamel(c.id);
    lines.push(
      `import ${c.componentName} from "../chapters/${c.dirName}/${c.componentName}";`
    );
    lines.push(
      `import { narrations as ${camel}Narrations } from "../chapters/${c.dirName}/narrations";`
    );
  }
  lines.push("");
  lines.push("export const CHAPTERS: ChapterDef[] = [");
  for (const c of valid) {
    const camel = idToCamel(c.id);
    lines.push(`  {`);
    lines.push(`    id: "${c.id}",`);
    lines.push(`    title: "${c.title}",`);
    lines.push(`    narrations: ${camel}Narrations,`);
    lines.push(`    Component: ${c.componentName},`);
    lines.push(`  },`);
  }
  lines.push("];");
  return lines.join("\n");
}

// ─── tsc validation ────────────────────────────────────────────────────────────

function runTsc(projectId: string): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    const proc = spawn("npx", ["tsc", "--noEmit", "-p", "tsconfig.app.json"], {
      cwd: path.join(projectDir(projectId), "presentation"),
      env: { ...process.env },
    });
    let output = "";
    proc.stdout.on("data", (d: Buffer) => {
      output += d.toString();
    });
    proc.stderr.on("data", (d: Buffer) => {
      output += d.toString();
    });
    proc.on("close", (code: number | null) => {
      resolve({ ok: code === 0, output });
    });
    setTimeout(() => {
      proc.kill();
      resolve({ ok: false, output: output + "\n[tsc timed out after 2min]" });
    }, 120_000);
  });
}

// ── Main orchestrator (fire-and-forget) ───────────────────────────────────────

export interface BuildOpts {
  /** 只构建编号 >= fromChapter 的章节（默认全部构建） */
  fromChapter?: number;
}

/**
 * Start a parallel chapter build from blueprints.
 *
 * Each blueprint is validated then compiled deterministically into
 * TSX / CSS / narrations.ts — no AI involved at compile time.
 *
 * When `blueprints` is empty, this is a no-op (the caller should
 * provide blueprints generated by the chat agent via ProjectSetChapter).
 */
export function startParallelBuild(
  project: Project,
  opts: BuildOpts = {},
  blueprints?: ChapterBlueprint[]
): void {
  const projectId = project.id;

  if (!blueprints || blueprints.length === 0) {
    // No blueprints provided — nothing to build. The build-parallel API
    // expects blueprints generated by the chat agent (or another producer).
    return;
  }

  // Filter by fromChapter if specified (hybrid mode: skip already-built chapters)
  const todo = opts.fromChapter
    ? blueprints.filter((bp) => (bp.orderHint ?? 0) >= opts.fromChapter!)
    : blueprints;

  if (todo.length === 0) return;

  if (jobs.get(projectId)?.status === "running") return;

  const chapterStatuses: ChapterBuildStatus[] = todo.map((bp) => ({
    id: bp.chapterId,
    dirName: bp.chapterId,
    title: bp.title,
    status: "pending" as const,
  }));

  const job: ParallelBuildJob = {
    status: "running",
    chapters: chapterStatuses,
    assemblyStatus: "pending",
    startedAt: Date.now(),
  };
  jobs.set(projectId, job);
  saveJobToDisk(projectId, job);

  // Run async without blocking caller
  (async () => {
    const os = await import("os");
    const BATCH_SIZE = Math.max(2, os.cpus().length - 1); // leave one core for the server
    const compiledResults: Array<{
      index: number;
      generated: GeneratedChapter;
      bp: (typeof todo)[number];
    } | null> = [];

    try {
      // ── Phase 1: Validate & Compile in parallel batches ────────────────
      for (let batchStart = 0; batchStart < todo.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, todo.length);
        const batch = todo.slice(batchStart, batchEnd);

        // Mark batch as building
        for (let j = batchStart; j < batchEnd; j++) {
          chapterStatuses[j].status = "building";
          chapterStatuses[j].startedAt = Date.now();
        }
        saveJobToDisk(projectId, job);

        // Parallel compile within batch
        const batchResults = await Promise.all(
          batch.map(async (bp, batchIdx) => {
            const globalIdx = batchStart + batchIdx;

            // Validate
            const { validated, result } = validateBlueprint(bp);
            if (!validated) {
              chapterStatuses[globalIdx].status = "error";
              chapterStatuses[globalIdx].error = formatValidationResult(result);
              chapterStatuses[globalIdx].finishedAt = Date.now();
              return null;
            }

            // Compile
            let generated: GeneratedChapter;
            try {
              generated = compileChapter(validated);
            } catch (err) {
              chapterStatuses[globalIdx].status = "error";
              chapterStatuses[globalIdx].error = `编译失败: ${err instanceof Error ? err.message : String(err)}`;
              chapterStatuses[globalIdx].finishedAt = Date.now();
              return null;
            }

            return { index: globalIdx, generated, bp };
          })
        );

        // Save batch results
        for (const r of batchResults) {
          compiledResults.push(r);
          if (!r) {
            saveJobToDisk(projectId, job);
            continue;
          }
        }
      }

      // ── Phase 2: Write all files (sequential — filesystem is the bottleneck) ──
      const successful = compiledResults.filter((r): r is NonNullable<typeof r> => r !== null);
      const allChapterDefs: Array<{ id: string; dirName: string; title: string }> = [];

      for (const r of successful) {
        const { generated, bp } = r;
        const chaptersDir = `presentation/src/chapters/${generated.chapterId}`;
        writeProjectFile(projectId, `${chaptersDir}/${generated.componentName}.tsx`, generated.tsx);
        writeProjectFile(projectId, `${chaptersDir}/${generated.componentName}.css`, generated.css);
        writeProjectFile(projectId, `${chaptersDir}/narrations.ts`, generated.narrations);
        allChapterDefs.push({
          id: generated.chapterId,
          dirName: generated.chapterId,
          title: bp.title,
        });

        chapterStatuses[r.index].status = "done";
        chapterStatuses[r.index].finishedAt = Date.now();
        saveJobToDisk(projectId, job);
      }

      // ── Phase 3: One-shot registry assembly ────────────────────────────
      if (allChapterDefs.length > 0) {
        const chaptersTs = assembleFromDisk(projectId, allChapterDefs);
        const chaptersFile = `presentation/src/registry/chapters.ts`;
        writeProjectFile(projectId, chaptersFile, chaptersTs);
      }

      // ── Phase 4: Final tsc verification ────────────────────────────────
      job.assemblyStatus = "running";
      const tscResult = await runTsc(projectId);
      const MAX_TSC_OUTPUT = 15_000;
      job.tscOutput = tscResult.output.length > MAX_TSC_OUTPUT
        ? tscResult.output.slice(0, MAX_TSC_OUTPUT) + `\n... (truncated, ${tscResult.output.length} total chars)`
        : tscResult.output;

      const allDone = chapterStatuses.every((c) => c.status === "done" || c.status === "skipped");

      if (allDone && tscResult.ok) {
        job.status = "done";
        job.assemblyStatus = "done";
      } else {
        job.status = "partial";
        job.assemblyStatus = tscResult.ok ? "done" : "error";
        if (!tscResult.ok) {
          job.assemblyError = "TypeScript 验证未通过，请检查章节代码";
        }
      }

      job.finishedAt = Date.now();
      saveJobToDisk(projectId, job);
    } catch (err) {
      console.error("[parallel-build] build failed:", err instanceof Error ? err.message : String(err));
      job.status = "error";
      job.assemblyError = err instanceof Error ? err.message : String(err);
      job.finishedAt = Date.now();
      saveJobToDisk(projectId, job);
    }
  })();
}

// ── Chapter-level operations (skip / rebuild) ─────────────────────────────

export function skipChapter(projectId: string, chapterId: string): boolean {
  const job = jobs.get(projectId);
  if (!job) return false;
  const ch = job.chapters.find((c) => c.id === chapterId);
  if (!ch) return false;
  ch.status = "skipped";
  ch.error = "用户跳过";
  saveJobToDisk(projectId, job);

  // Re-assemble to reflect the change using job chapter list (not outline)
  const chaptersTs = assembleFromDisk(
    projectId,
    job.chapters.map((c) => ({ id: c.id, dirName: c.dirName, title: c.title }))
  );
  const chaptersFile = path.join(projectDir(projectId), "presentation/src/registry/chapters.ts");
  fs.writeFileSync(chaptersFile, chaptersTs, "utf-8");

  // If all chapters are resolved, finalize
  const allResolved = job.chapters.every((c) =>
    c.status === "done" || c.status === "skipped" || c.status === "error"
  );
  if (allResolved) {
    job.status = "partial";
    job.finishedAt = Date.now();
    saveJobToDisk(projectId, job);
  }

  return true;
}

/**
 * Rebuild a single chapter from a blueprint.
 *
 * Validates the blueprint, compiles it, writes the output files,
 * and re-assembles chapters.ts.
 */
export async function rebuildChapter(
  projectId: string,
  chapterId: string,
  blueprint: ChapterBlueprint
): Promise<boolean> {
  let job = jobs.get(projectId);
  if (!job) {
    // Try disk recovery
    job = getParallelBuildJob(projectId) ?? undefined;
    if (!job) {
      console.warn("[parallel-build] rebuildChapter: no job found for", projectId);
      return false;
    }
  }
  const ch = job.chapters.find((c) => c.id === chapterId);
  if (!ch) {
    console.warn("[parallel-build] rebuildChapter: chapter", chapterId, "not found in job");
    return false;
  }

  console.log("[parallel-build] rebuildChapter: starting rebuild of", chapterId, "in", projectId);

  ch.status = "building";
  ch.error = undefined;
  ch.tscErrors = undefined;
  ch.startedAt = Date.now();
  job.status = "running";
  saveJobToDisk(projectId, job);

  // ── Validate ──────────────────────────────────────────────────────────
  const { validated, result } = validateBlueprint(blueprint);
  if (!validated) {
    ch.status = "error";
    ch.error = formatValidationResult(result);
    ch.finishedAt = Date.now();
    saveJobToDisk(projectId, job);
    return false;
  }

  // ── Compile ───────────────────────────────────────────────────────────
  let generated: GeneratedChapter;
  try {
    generated = compileChapter(validated);
  } catch (err) {
    ch.status = "error";
    ch.error = `编译失败: ${err instanceof Error ? err.message : String(err)}`;
    ch.finishedAt = Date.now();
    saveJobToDisk(projectId, job);
    return false;
  }

  // ── Write files ───────────────────────────────────────────────────────
  const chaptersDir = `presentation/src/chapters/${generated.chapterId}`;
  writeProjectFile(projectId, `${chaptersDir}/${generated.componentName}.tsx`, generated.tsx);
  writeProjectFile(projectId, `${chaptersDir}/${generated.componentName}.css`, generated.css);
  writeProjectFile(projectId, `${chaptersDir}/narrations.ts`, generated.narrations);

  // ── Re-assemble using job chapter list (not outline) ─────────────────
  const chaptersTs = assembleFromDisk(
    projectId,
    job.chapters.map((c) => ({ id: c.id, dirName: c.dirName, title: c.title }))
  );
  const chaptersFile = path.join(projectDir(projectId), "presentation/src/registry/chapters.ts");
  fs.writeFileSync(chaptersFile, chaptersTs, "utf-8");

  ch.status = "done";
  ch.finishedAt = Date.now();

  const allDone = job.chapters.every((c) =>
    c.status === "done" || c.status === "skipped"
  );
  if (allDone) {
    job.status = "done";
    job.finishedAt = Date.now();
  }
  saveJobToDisk(projectId, job);

  return true;
}
