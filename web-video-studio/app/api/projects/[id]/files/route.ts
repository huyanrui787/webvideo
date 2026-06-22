import { NextResponse } from "next/server";
import { readProjectFile, writeProjectFile } from "@/lib/projects";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ error: "path query param required" }, { status: 400 });
  }

  const project = await db.query.projects.findFirst({
    where: (p, { eq }) => eq(p.id, id),
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const content = readProjectFile(id, filePath);
  if (content === null) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return NextResponse.json({ content });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { path: filePath, content } = await req.json();

  if (!filePath || content === undefined) {
    return NextResponse.json({ error: "path and content required" }, { status: 400 });
  }

  const project = await db.query.projects.findFirst({
    where: (p, { eq }) => eq(p.id, id),
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  writeProjectFile(id, filePath, content);
  return NextResponse.json({ success: true });
}
