import { NextResponse } from "next/server";
import { z } from "zod";
import { requireProjectAccess } from "@/lib/api-helpers";
import { startParallelBuild, getParallelBuildJob } from "@/lib/parallel-build";
import { ChapterBlueprint } from "@/lib/chapter-blueprint";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const job = getParallelBuildJob(id);
  return NextResponse.json(job ?? { status: "idle" });
}

const BuildParallelBody = z.object({
  blueprints: z.array(ChapterBlueprint).optional(),
  fromChapter: z.number().int().min(0).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { project, error } = await requireProjectAccess(req, id);
  if (error) return error;
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Parse and validate request body
  let body: z.infer<typeof BuildParallelBody>;
  try {
    body = BuildParallelBody.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid blueprint data", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  startParallelBuild(project, { fromChapter: body.fromChapter }, body.blueprints);
  return NextResponse.json({ status: "running" });
}
