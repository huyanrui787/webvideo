import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/api-helpers";
import { startIllustRender, getRenderJob } from "@/lib/render";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const { project, error } = await requireProjectAccess(req, projectId);
  if (error) return error;

  const existing = getRenderJob(projectId);
  if (existing?.status === "running") {
    return NextResponse.json({ ok: false, message: "渲染已在运行中" }, { status: 409 });
  }

  startIllustRender(projectId);

  return NextResponse.json({ ok: true, message: "渲染已启动" });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const { project, error } = await requireProjectAccess(req, projectId);
  if (error) return error;

  const job = getRenderJob(projectId);

  return NextResponse.json({
    status: job?.status ?? "idle",
    progress: job?.progress ?? "",
    outputFile: job?.outputFile,
    error: job?.error,
    totalDuration: job?.totalDuration,
    totalFrames: job?.totalFrames,
    framesDone: job?.framesDone,
    totalSegments: (job as Record<string, unknown> | null)?.totalSegments,
    segmentsDone: (job as Record<string, unknown> | null)?.segmentsDone,
  });
}
