/**
 * Batch Pipeline — fully automated project execution engine.
 *
 * For each project in a batch, runs the full 4-phase pipeline without human checkpoints:
 *   1. Content writing (AI generates article from URL/topic)
 *   2. Scaffold + parallel build (auto)
 *   3. Audio synthesis (if tts configured)
 *   4. Render (optional, deferred for now)
 *
 * Concurrency is capped per batch and per user's plan.maxParallelBuilds.
 */

import { db, rawDb } from "@/lib/db";
import { batches, projects as projectsTable, users, plans, subscriptions, type Project } from "@/lib/db/schema";
import { eq, and, asc, sql as dsql } from "drizzle-orm";
import { startScaffold, isScaffolded } from "@/lib/scaffold";
import { startParallelBuild, getParallelBuildJob } from "@/lib/parallel-build";
import { getServerBaseUrl, getProjectsDir } from "@/lib/env";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";

// ─── In-memory pipeline state ──────────────────────────────────────────────────

const runningPipelines = new Map<string, boolean>(); // batchId → isRunning
const projectLocks = new Set<string>(); // projectId — prevents double-execution

// ─── Concurrency helpers ───────────────────────────────────────────────────────

async function getUserMaxConcurrency(userId: string): Promise<number> {
  try {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (sub) {
      const [plan] = await db
        .select()
        .from(plans)
        .where(eq(plans.code, sub.planCode))
        .limit(1);
      if (plan && plan.maxParallelBuilds > 0) return plan.maxParallelBuilds;
    }
  } catch { /* fall through */ }
  return 1; // default: 1 project at a time
}

async function getActiveProjectCount(batchId: string): Promise<number> {
  const rows = await db
    .select({ count: dsql<number>`count(*)` })
    .from(projectsTable)
    .where(
      and(
        eq(projectsTable.batchId, batchId),
        eq(projectsTable.status, "building")
      )
    );
  return rows[0]?.count ?? 0;
}

// ─── Update batch progress ────────────────────────────────────────────────────

async function syncBatchProgress(batchId: string) {
  const stats = await db
    .select({ status: projectsTable.status })
    .from(projectsTable)
    .where(eq(projectsTable.batchId, batchId));

  const done = stats.filter((s) => s.status === "done").length;
  const failed = stats.filter((s) => s.status === "done" /* will check errorMessage */).length;

  // Actually count failed as those with error_message set
  const errored = await db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(and(eq(projectsTable.batchId, batchId)))
    .then((rows) => rows.length); // placeholder

  // Better: query directly
  const allProjects = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.batchId, batchId));

  const actualDone = allProjects.filter((p) => p.status === "done" && !p.errorMessage).length;
  const actualFailed = allProjects.filter((p) => p.errorMessage).length;
  const isDone = actualDone + actualFailed >= allProjects.length;

  await db
    .update(batches)
    .set({
      done: actualDone,
      failed: actualFailed,
      status: isDone
        ? actualFailed > 0
          ? "partial"
          : "done"
        : "running",
      finishedAt: isDone ? Math.floor(Date.now() / 1000) : null,
    })
    .where(eq(batches.id, batchId));
}

// ─── Project pipeline steps ────────────────────────────────────────────────────

async function runProjectPipeline(
  project: typeof projectsTable.$inferSelect,
  batchId: string
): Promise<void> {
  const pid = project.id;
  if (projectLocks.has(pid)) return; // already running
  projectLocks.add(pid);

  try {
    // ── Step 1: Content writing — generate article if URL or topic ────────
    if (project.status === "writing") {
      const batch = await db.select().from(batches).where(eq(batches.id, batchId)).limit(1).then(r => r[0]);
      if (!batch) return;

      const sourceConfig = JSON.parse(batch.sourceConfig);
      const projectConfig = JSON.parse(batch.projectConfig);

      // Get the source item for this project
      let sourceItem = "";
      if (batch.sourceType === "url_list" || batch.sourceType === "rss") {
        const urls = (sourceConfig.urls as string[]) ?? [];
        sourceItem = urls[project.batchIndex ?? 0] ?? "";
      } else if (batch.sourceType === "topic_list") {
        const topics = (sourceConfig.topics as string[]) ?? [];
        sourceItem = topics[project.batchIndex ?? 0] ?? "";
      }

      if (sourceItem) {
        // Generate article content from source
        if (batch.sourceType === "url_list" || batch.sourceType === "rss") {
          // Fetch URL content
          try {
            const res = await fetch(sourceItem, {
              headers: { "User-Agent": "Mozilla/5.0" },
              signal: AbortSignal.timeout(15000),
            });
            const html = await res.text();
            // Strip HTML tags for a rough article extraction
            const text = html
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
              .replace(/<[^>]+>/g, "\n")
              .replace(/&nbsp;/g, " ")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&amp;/g, "&")
              .replace(/\n{3,}/g, "\n\n")
              .trim()
              .slice(0, 8000);

            const projectDir = path.join(getProjectsDir(), pid);
            fs.mkdirSync(projectDir, { recursive: true });
            fs.writeFileSync(path.join(projectDir, "article.md"), text, "utf-8");
          } catch (e) {
            throw new Error(`URL fetch failed: ${e}`);
          }
        } else if (batch.sourceType === "topic_list") {
          // Write the topic as the article (AI will expand it during build)
          const projectDir = path.join(getProjectsDir(), pid);
          fs.mkdirSync(projectDir, { recursive: true });
          fs.writeFileSync(
            path.join(projectDir, "article.md"),
            `# ${sourceItem}\n\n请根据这个主题生成一篇适合制作视频的文章。`,
            "utf-8"
          );
        }
      }

      await db
        .update(projectsTable)
        .set({ status: "building", updatedAt: Math.floor(Date.now() / 1000) })
        .where(eq(projectsTable.id, pid));
    }

    // ── Step 2: Scaffold ─────────────────────────────────────────────────
    if (project.status === "building") {
      const projDir = path.join(getProjectsDir(), pid);
      fs.mkdirSync(projDir, { recursive: true });

      // Trigger scaffold if not done
      if (!isScaffolded(pid)) {
        startScaffold(pid, project.theme ?? "midnight-press", project.orientation ?? "landscape", project.projectFormat ?? "video");

        // Poll for scaffold completion
        await new Promise<void>((resolve, reject) => {
          const start = Date.now();
          const maxWait = 5 * 60 * 1000; // 5 min timeout
          const interval = setInterval(() => {
            if (isScaffolded(pid)) {
              clearInterval(interval);
              resolve();
            } else if (Date.now() - start > maxWait) {
              clearInterval(interval);
              reject(new Error("Scaffold timeout"));
            }
          }, 2000);
        });
      }

      // Start parallel build
      const buildJob = await startParallelBuild({
        id: pid,
        userId: project.userId,
        title: project.title,
        status: "building",
        theme: project.theme,
        devMode: project.devMode ?? "hybrid",
        projectType: project.projectType ?? "article",
        projectFormat: project.projectFormat ?? "video",
        orientation: project.orientation ?? "landscape",
        model: project.model ?? "deepseek-v4-pro",
        codingModel: project.codingModel ?? "claude-sonnet-4-6",
        mainSkillId: project.mainSkillId ?? "web-video-presentation",
        autoMode: true,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      } as Project);

      // Poll for build completion
      await new Promise<void>((resolve, reject) => {
        const start = Date.now();
        const maxWait = 30 * 60 * 1000; // 30 min timeout
        const interval = setInterval(async () => {
          try {
            const job = getParallelBuildJob(pid);
            if (job?.status === "done") {
              clearInterval(interval);
              resolve();
            } else if (job?.status === "error") {
              clearInterval(interval);
              reject(new Error(job.assemblyError ?? "Build failed"));
            } else if (Date.now() - start > maxWait) {
              clearInterval(interval);
              reject(new Error("Build timeout"));
            }
          } catch { /* retry */ }
        }, 5000);
      });

      // If TTS is configured, trigger audio synthesis
      const cfg = JSON.parse(
        (await db.select().from(batches).where(eq(batches.id, batchId)).limit(1).then(r => r[0]))
          ?.projectConfig ?? "{}"
      ) as Record<string, unknown>;

      if (cfg.ttsAuto) {
        await db
          .update(projectsTable)
          .set({ status: "audio", updatedAt: Math.floor(Date.now() / 1000) })
          .where(eq(projectsTable.id, pid));

        // Trigger synthesis (simplified — calls the existing synthesize endpoint)
        try {
          const baseUrl = getServerBaseUrl();
          const synthRes = await fetch(`${baseUrl}/api/projects/${pid}/synthesize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "extract" }),
          });

          if (synthRes.ok) {
            // Poll synthesis
            await new Promise<void>((resolve) => {
              const maxWait = 10 * 60 * 1000;
              const start = Date.now();
              const interval = setInterval(async () => {
                try {
                  const check = await fetch(
                    `${baseUrl}/api/projects/${pid}/synthesize`
                  );
                  const data = await check.json();
                  if (data.status === "done") {
                    clearInterval(interval);
                    resolve();
                  } else if (Date.now() - start > maxWait) {
                    clearInterval(interval);
                    resolve(); // Don't fail on audio timeout
                  }
                } catch { /* retry */ }
              }, 3000);
            });
          }
        } catch { /* audio synthesis is optional */ }
      }

      // Mark project as done
      await db
        .update(projectsTable)
        .set({ status: "done", updatedAt: Math.floor(Date.now() / 1000) })
        .where(eq(projectsTable.id, pid));
    }
  } catch (e) {
    console.error(`[batch-pipeline] project ${pid} failed:`, e);
    await db
      .update(projectsTable)
      .set({
        status: "done",
        errorMessage: String(e).slice(0, 500),
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(projectsTable.id, pid));
  } finally {
    projectLocks.delete(pid);
  }
}

// ─── Main pipeline driver ──────────────────────────────────────────────────────

export async function triggerBatchPipeline(batchId: string): Promise<void> {
  if (runningPipelines.get(batchId)) return; // already running
  runningPipelines.set(batchId, true);

  try {
    const [batch] = await db
      .select()
      .from(batches)
      .where(eq(batches.id, batchId))
      .limit(1);

    if (!batch) return;
    if (batch.status === "cancelled") return;

    const maxConcurrency = await getUserMaxConcurrency(batch.userId);

    // Keep processing until all projects are done
    while (true) {
      await syncBatchProgress(batchId);

      const [currentBatch] = await db
        .select()
        .from(batches)
        .where(eq(batches.id, batchId))
        .limit(1);

      if (!currentBatch || currentBatch.status === "cancelled") break;
      if (currentBatch.status === "done" || currentBatch.status === "partial") break;

      // Get pending projects
      const pending = await db
        .select()
        .from(projectsTable)
        .where(
          and(
            eq(projectsTable.batchId, batchId),
            eq(projectsTable.autoMode, true)
          )
        )
        .orderBy(asc(projectsTable.batchIndex));

      const notStarted = pending.filter(
        (p) => p.status !== "done" && !p.errorMessage
      );

      if (notStarted.length === 0) {
        await syncBatchProgress(batchId);
        break;
      }

      // Check active count
      const activeCount = await getActiveProjectCount(batchId);
      const available = maxConcurrency - activeCount;

      if (available <= 0) {
        // Wait and retry
        await new Promise((r) => setTimeout(r, 10000));
        continue;
      }

      // Start next N projects
      const toStart = notStarted.slice(0, available);
      await Promise.allSettled(
        toStart.map((p) => runProjectPipeline(p, batchId))
      );
    }
  } finally {
    runningPipelines.delete(batchId);
  }
}

/**
 * Start one project immediately (used for single-project auto mode).
 */
export async function startAutoProject(projectId: string): Promise<void> {
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId))
    .limit(1);

  if (!project || !project.autoMode) return;
  if (!project.batchId) return;

  await runProjectPipeline(project, project.batchId);
}
