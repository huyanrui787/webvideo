import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { batches, projects, users } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { eq, desc, and } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/auth";
import type { BatchSourceType, BatchStatus } from "@/lib/db/schema";

// ─── GET /api/batches — list batches for current user ──────────────────────────

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as BatchStatus | null;

  const where = status
    ? and(eq(batches.userId, session.userId), eq(batches.status, status))
    : eq(batches.userId, session.userId);

  const rows = await db
    .select()
    .from(batches)
    .where(where)
    .orderBy(desc(batches.createdAt));

  return NextResponse.json(rows);
}

// ─── POST /api/batches — create a new batch ────────────────────────────────────

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    title,
    sourceType,
    sourceConfig,
    projectConfig,
    items, // string[] — URL list, topic list, etc.
  } = body as {
    title: string;
    sourceType: BatchSourceType;
    sourceConfig?: Record<string, unknown>;
    projectConfig?: Record<string, unknown>;
    items?: string[];
  };

  if (!title || !sourceType) {
    return NextResponse.json({ error: "title and sourceType are required" }, { status: 400 });
  }

  const itemList = items ?? [];
  if (itemList.length === 0) {
    return NextResponse.json({ error: "items array is required and must not be empty" }, { status: 400 });
  }

  // Read user defaults
  const [userRow] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const batchId = nanoid(12);
  const now = Math.floor(Date.now() / 1000);

  // Insert batch
  await db.insert(batches).values({
    id: batchId,
    userId: session.userId,
    title,
    sourceType,
    sourceConfig: JSON.stringify(sourceConfig ?? {}),
    projectConfig: JSON.stringify(projectConfig ?? {}),
    status: "running",
    total: itemList.length,
    done: 0,
    failed: 0,
    createdAt: now,
  });

  // Create projects for each item
  const cfg = (projectConfig ?? {}) as Record<string, unknown>;
  for (let i = 0; i < itemList.length; i++) {
    const item = itemList[i].trim();
    if (!item) continue;

    const projectId = nanoid(10);
    const projectTitle =
      sourceType === "topic_list"
        ? `[Batch] ${item}`
        : sourceType === "url_list"
          ? `[Batch] ${item.slice(0, 60)}`
          : `[Batch] ${title} #${i + 1}`;

    await db.insert(projects).values({
      id: projectId,
      userId: session.userId,
      title: projectTitle,
      status: "writing",
      theme: (cfg.theme as string) ?? userRow?.preferredModel ? "midnight-press" : "midnight-press",
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

  // Trigger auto-pipeline execution in background
  const { triggerBatchPipeline } = await import("@/lib/batch-pipeline");
  triggerBatchPipeline(batchId).catch((e) =>
    console.error(`[batch-pipeline] batch ${batchId} failed to start:`, e)
  );

  return NextResponse.json({ id: batchId, total: itemList.length }, { status: 201 });
}
