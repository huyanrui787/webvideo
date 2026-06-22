import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { illustrationShots } from "@/lib/db/schema";
import { requireProjectAccess } from "@/lib/api-helpers";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const { project, error } = await requireProjectAccess(req, projectId);
  if (error) return error;

  const body = await req.json();
  const shots = body.shots as Array<{
    chapterId: string;
    stepIdx: number;
    theme: string;
    structureType: string;
    coreIdea: string;
    xiaoheiAction?: string;
    elements?: string[];
    labels?: string[];
  }>;

  if (!Array.isArray(shots) || shots.length === 0) {
    return NextResponse.json({ error: "shots array is required" }, { status: 400 });
  }

  // Clear existing shots for this project (allows re-planning)
  await db.delete(illustrationShots).where(eq(illustrationShots.projectId, projectId));

  const now = Math.floor(Date.now() / 1000);
  const records = shots.map((s, i) => ({
    id: nanoid(),
    projectId,
    chapterId: s.chapterId,
    stepIdx: s.stepIdx,
    theme: s.theme,
    structureType: s.structureType as never,
    coreIdea: s.coreIdea,
    xiaoheiAction: s.xiaoheiAction ?? null,
    elements: JSON.stringify(s.elements ?? []),
    labels: JSON.stringify(s.labels ?? []),
    sortOrder: i,
    createdAt: now,
  }));

  await db.insert(illustrationShots).values(records);

  const inserted = await db
    .select()
    .from(illustrationShots)
    .where(eq(illustrationShots.projectId, projectId))
    .orderBy(illustrationShots.sortOrder);

  return NextResponse.json({ ok: true, shotCount: inserted.length, shots: inserted }, { status: 201 });
}
