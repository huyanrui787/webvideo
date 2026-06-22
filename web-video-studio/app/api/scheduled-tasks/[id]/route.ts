import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/auth";

// ─── GET — single scheduled task ────────────────────────────────────────────────

export async function GET(
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

  return NextResponse.json(task);
}

// ─── PATCH — update scheduled task ──────────────────────────────────────────────

export async function PATCH(
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

  const body = await req.json();
  const updates: Record<string, unknown> = { updatedAt: Math.floor(Date.now() / 1000) };

  if (body.title !== undefined) updates.title = body.title;
  if (body.enabled !== undefined) updates.enabled = body.enabled;
  if (body.cron !== undefined) updates.cron = body.cron;
  if (body.sourceConfig !== undefined) updates.sourceConfig = JSON.stringify(body.sourceConfig);
  if (body.projectConfig !== undefined) updates.projectConfig = JSON.stringify(body.projectConfig);

  await db.update(scheduledTasks).set(updates).where(eq(scheduledTasks.id, id));

  return NextResponse.json({ ok: true });
}

// ─── DELETE — remove scheduled task ─────────────────────────────────────────────

export async function DELETE(
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

  await db.delete(scheduledTasks).where(eq(scheduledTasks.id, id));

  return NextResponse.json({ ok: true });
}
