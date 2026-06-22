import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledTasks, type ScheduleSourceType } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { eq, desc } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/auth";

// ─── GET — list scheduled tasks ────────────────────────────────────────────────

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(scheduledTasks)
    .where(eq(scheduledTasks.userId, session.userId))
    .orderBy(desc(scheduledTasks.createdAt));

  return NextResponse.json(rows);
}

// ─── POST — create scheduled task ──────────────────────────────────────────────

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, cron, sourceType, sourceConfig, projectConfig } = body as {
    title: string;
    cron: string;
    sourceType: string;
    sourceConfig?: Record<string, unknown>;
    projectConfig?: Record<string, unknown>;
  };

  if (!title || !cron || !sourceType) {
    return NextResponse.json(
      { error: "title, cron, and sourceType are required" },
      { status: 400 }
    );
  }

  const id = nanoid(12);
  const now = Math.floor(Date.now() / 1000);

  await db.insert(scheduledTasks).values({
    id,
    userId: session.userId,
    title,
    enabled: true,
    cron,
    sourceType: sourceType as ScheduleSourceType,
    sourceConfig: JSON.stringify(sourceConfig ?? {}),
    projectConfig: JSON.stringify(projectConfig ?? {}),
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id }, { status: 201 });
}
