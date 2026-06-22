import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledTasks, taskRuns, batches, projects, users, type BatchSourceType } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getSessionFromRequest } from "@/lib/auth";

// ─── POST — manually trigger a scheduled task ──────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const [task] = await db
    .select()
    .from(scheduledTasks)
    .where(eq(scheduledTasks.id, id))
    .limit(1);

  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (task.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = Math.floor(Date.now() / 1000);
  const runId = nanoid(10);

  // Create task run
  await db.insert(taskRuns).values({
    id: runId,
    scheduledTaskId: id,
    status: "running",
    startedAt: now,
  });

  // Resolve source to get items
  const sourceConfig = JSON.parse(task.sourceConfig);
  let items: string[] = [];

  if (task.sourceType === "url_watchlist") {
    items = (sourceConfig.urls as string[]) ?? [];
  } else if (task.sourceType === "topic_pool") {
    items = (sourceConfig.topics as string[]) ?? [];
  } else if (task.sourceType === "rss") {
    // RSS fetch — for manual trigger, use a placeholder
    try {
      const res = await fetch(sourceConfig.url as string);
      const text = await res.text();
      // Simple RSS link extraction
      const linkRe = /<link>([^<]+)<\/link>/g;
      let match: RegExpExecArray | null;
      const seen = new Set<string>();
      while ((match = linkRe.exec(text)) !== null) {
        const link = match[1].trim();
        if (link.startsWith("http") && !seen.has(link)) {
          seen.add(link);
          items.push(link);
        }
      }
    } catch (e) {
      await db
        .update(taskRuns)
        .set({ status: "error", result: JSON.stringify({ error: String(e) }), finishedAt: Math.floor(Date.now() / 1000) })
        .where(eq(taskRuns.id, runId));
      return NextResponse.json({ error: "RSS fetch failed" }, { status: 500 });
    }
  }

  if (items.length === 0) {
    await db
      .update(taskRuns)
      .set({ status: "done", result: JSON.stringify({ message: "No new items" }), finishedAt: Math.floor(Date.now() / 1000) })
      .where(eq(taskRuns.id, runId));
    return NextResponse.json({ message: "No items to process" });
  }

  // Create batch
  const batchId = nanoid(12);
  const projectConfig = JSON.parse(task.projectConfig);

  // Read user defaults
  const [userRow] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  await db.insert(batches).values({
    id: batchId,
    userId: session.userId,
    title: `${task.title} — ${new Date().toISOString().slice(0, 10)}`,
    sourceType: (
      task.sourceType === "url_watchlist" ? "url_list"
      : task.sourceType === "topic_pool" ? "topic_list"
      : task.sourceType
    ) as BatchSourceType,
    sourceConfig: task.sourceConfig,
    projectConfig: task.projectConfig,
    status: "running",
    total: items.length,
    done: 0,
    failed: 0,
    scheduledTaskId: id,
    createdAt: now,
  });

  // Create projects
  const cfg = projectConfig as Record<string, unknown>;
  for (let i = 0; i < items.length; i++) {
    const item = items[i].trim();
    if (!item) continue;

    const projectId = nanoid(10);
    await db.insert(projects).values({
      id: projectId,
      userId: session.userId,
      title: `[Scheduled] ${item.slice(0, 60)}`,
      status: "writing",
      theme: (cfg.theme as string) ?? "midnight-press",
      projectType: (cfg.projectType as "article") ?? "article",
      projectFormat: (cfg.projectFormat as "video") ?? "video",
      model: (cfg.model as "deepseek-v4-pro") ?? (userRow?.preferredModel ?? "deepseek-v4-pro"),
      codingModel: (cfg.codingModel as "claude-sonnet-4-6") ?? (userRow?.preferredCodingModel ?? "claude-sonnet-4-6"),
      ttsProvider: (cfg.ttsProvider as "minimax") ?? "minimax",
      autoMode: true,
      batchId,
      batchIndex: i,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Link run to batch
  await db
    .update(taskRuns)
    .set({ batchId })
    .where(eq(taskRuns.id, runId));

  // Update scheduled task timestamps
  await db
    .update(scheduledTasks)
    .set({ lastRunAt: now, updatedAt: now })
    .where(eq(scheduledTasks.id, id));

  // Trigger pipeline
  const { triggerBatchPipeline } = await import("@/lib/batch-pipeline");
  triggerBatchPipeline(batchId).catch((e) =>
    console.error(`[batch-pipeline] batch ${batchId} failed:`, e)
  );

  return NextResponse.json({ runId, batchId, total: items.length }, { status: 201 });
}
