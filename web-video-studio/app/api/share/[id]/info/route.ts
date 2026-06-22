import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { projectDir } from "@/lib/projects";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Check if render is done (MP4 exists)
  const renderDir = path.join(projectDir(id), "presentation", "render");
  const renderDone = fs.existsSync(path.join(renderDir, "output.mp4"));

  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      status: project.status,
      theme: project.theme,
      thumbnailUrl: project.thumbnailUrl,
    },
    renderDone,
  });
}
