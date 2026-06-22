import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/api-helpers";
import { projectDir } from "@/lib/projects";
import path from "path";
import fs from "fs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("file") ?? "final.mp4";

  // Only allow files inside avatar/
  const filePath = path.join(projectDir(id), "avatar", path.basename(filename));
  if (!fs.existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  const buf = fs.readFileSync(filePath);
  return new Response(buf, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${path.basename(filename)}"`,
      "Content-Length": String(buf.length),
    },
  });
}
