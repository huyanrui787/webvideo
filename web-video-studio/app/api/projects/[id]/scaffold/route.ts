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

  // illustration-video / illustrated-article: audio-only scaffold (IllustPlayer, no Vite needed)
  // animation-video IS a blueprint video project — needs full Vite scaffold
  const isIllust = project?.projectType === "illustration-video" || project?.projectType === "illustrated-article";
  if (isIllust) {
    if (isScaffolded(id)) return NextResponse.json({ status: "done", skipped: true });
    // Lightweight scaffold: copy audio scripts + npm install
    const { startAudioScaffold } = await import("@/lib/scaffold");
    startAudioScaffold(id);
    return NextResponse.json({ status: "running" });
  }

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
