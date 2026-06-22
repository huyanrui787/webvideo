import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { batches, projects } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/auth";
import type { BatchStatus } from "@/lib/db/schema";

// ─── GET /api/batches/[id] — batch detail with project list ────────────────────

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const [batch] = await db.select().from(batches).where(eq(batches.id, id)).limit(1);
  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (batch.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch projects in this batch
  const projList = await db
    .select()
    .from(projects)
    .where(eq(projects.batchId, id))
    .orderBy(asc(projects.batchIndex));

  return NextResponse.json({ batch, projects: projList });
}

// ─── PATCH /api/batches/[id] — update batch status ─────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const [batch] = await db.select().from(batches).where(eq(batches.id, id)).limit(1);
  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (batch.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { status } = body as { status?: BatchStatus };

  if (status) {
    await db.update(batches).set({ status }).where(eq(batches.id, id));
  }

  return NextResponse.json({ ok: true });
}

// ─── DELETE /api/batches/[id] — delete batch and its projects ──────────────────

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const [batch] = await db.select().from(batches).where(eq(batches.id, id)).limit(1);
  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (batch.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Delete all projects in batch
  await db.delete(projects).where(eq(projects.batchId, id));
  // Delete the batch
  await db.delete(batches).where(eq(batches.id, id));

  return NextResponse.json({ ok: true });
}
