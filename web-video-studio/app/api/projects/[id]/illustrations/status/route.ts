import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { illustrationShots } from "@/lib/db/schema";
import { requireProjectAccess } from "@/lib/api-helpers";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const { project, error } = await requireProjectAccess(req, projectId);
  if (error) return error;

  const shots = await db
    .select({
      id: illustrationShots.id,
      chapterId: illustrationShots.chapterId,
      stepIdx: illustrationShots.stepIdx,
      theme: illustrationShots.theme,
      structureType: illustrationShots.structureType,
      generationStatus: illustrationShots.generationStatus,
      assetUrl: illustrationShots.assetUrl,
      assetFilename: illustrationShots.assetFilename,
      generationError: illustrationShots.generationError,
      sortOrder: illustrationShots.sortOrder,
    })
    .from(illustrationShots)
    .where(eq(illustrationShots.projectId, projectId))
    .orderBy(illustrationShots.sortOrder);

  const doneCount = shots.filter((s) => s.generationStatus === "done").length;
  const errorCount = shots.filter((s) => s.generationStatus === "error").length;
  const pendingCount = shots.filter(
    (s) => s.generationStatus === "pending" || s.generationStatus === "prompting" || s.generationStatus === "generating"
  ).length;

  const allDone = pendingCount === 0;

  return NextResponse.json({
    totalShots: shots.length,
    doneCount,
    errorCount,
    pendingCount,
    status: allDone ? "done" : "generating",
    shots,
  });
}
