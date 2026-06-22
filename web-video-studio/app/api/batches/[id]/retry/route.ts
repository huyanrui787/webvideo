import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { batches, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/auth";

// ─── POST /api/batches/[id]/retry — retry all failed projects ──────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const [batch] = await db.select().from(batches).where(eq(batches.id, id)).limit(1);
  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (batch.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Reset failed projects to writing and clear errors
  const failedProjects = await db
    .select()
    .from(projects)
    .where(and(eq(projects.batchId, id), eq(projects.status, "done"))); // re-check: "done" may include failed ones we marked

  // Actually get projects that have error_message set
  const errored = await db
    .select()
    .from(projects)
    .where(and(eq(projects.batchId, id)))
    .then((rows) => rows.filter((r) => r.errorMessage));

  let retried = 0;
  for (const p of errored) {
    await db
      .update(projects)
      .set({ status: "writing", errorMessage: null, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(projects.id, p.id));
    retried++;
  }

  // Re-trigger pipeline
  const { triggerBatchPipeline } = await import("@/lib/batch-pipeline");
  triggerBatchPipeline(id).catch((e) =>
    console.error(`[batch-pipeline] batch ${id} retry failed:`, e)
  );

  return NextResponse.json({ retried });
}
