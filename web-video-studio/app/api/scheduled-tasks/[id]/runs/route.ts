import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taskRuns } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/auth";

// ─── GET — run history for a scheduled task ────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const rows = await db
    .select()
    .from(taskRuns)
    .where(eq(taskRuns.scheduledTaskId, id))
    .orderBy(desc(taskRuns.startedAt))
    .limit(50);

  return NextResponse.json(rows);
}
