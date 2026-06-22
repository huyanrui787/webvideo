import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startScaffold, getScaffoldJob, isScaffolded } from "@/lib/scaffold";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  // Already done
  if (isScaffolded(id)) {
    return NextResponse.json({ status: "done", skipped: true });
  }

  const project = await db.query.projects.findFirst({
    where: (p, { eq }) => eq(p.id, id),
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const theme = project.theme ?? "midnight-press";
  const orientation = project.orientation ?? "landscape";
  startScaffold(id, theme, orientation);

  return NextResponse.json({ status: "running" });
}
