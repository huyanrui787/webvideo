import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startScaffold, getScaffoldJob, isScaffolded } from "@/lib/scaffold";
import { requireProjectAccess } from "@/lib/api-helpers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const done = isScaffolded(id);
  if (done) return NextResponse.json({ status: "done" });
  const job = getScaffoldJob(id);
  return NextResponse.json(job ?? { status: "idle" });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, project } = await requireProjectAccess(req, id);
  if (error) return error;

  if (isScaffolded(id)) {
    return NextResponse.json({ status: "done", skipped: true });
  }

  const theme = project?.theme ?? "midnight-press";
  const orientation = project?.orientation ?? "landscape";
  const projectFormat = project?.projectFormat ?? "video";
  const mainSkillId = project?.mainSkillId ?? undefined;
  startScaffold(id, theme, orientation, projectFormat, mainSkillId);

  return NextResponse.json({ status: "running" });
}
