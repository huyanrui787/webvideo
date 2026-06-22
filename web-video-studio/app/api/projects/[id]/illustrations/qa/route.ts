import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { illustrationShots } from "@/lib/db/schema";
import { requireProjectAccess } from "@/lib/api-helpers";
import { eq, and } from "drizzle-orm";
import { checkShot, summarizeQA } from "@/lib/illustration-qa";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const { project, error } = await requireProjectAccess(req, projectId);
  if (error) return error;

  const shots = await db
    .select()
    .from(illustrationShots)
    .where(
      and(
        eq(illustrationShots.projectId, projectId),
        eq(illustrationShots.generationStatus, "done")
      )
    )
    .orderBy(illustrationShots.sortOrder);

  const results = shots.map((s) => checkShot(s));
  const summary = summarizeQA(results);

  return NextResponse.json({
    summary,
    details: results.map((r, i) => ({
      shotId: shots[i]?.id,
      theme: shots[i]?.theme,
      ...r,
    })),
  });
}
