import fs from "fs";
import path from "path";
import { projectDir } from "@/lib/projects";

const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", svg: "image/svg+xml", gif: "image/gif",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; filename: string[] }> }
) {
  const { id, filename } = await params;
  const assetsDir = path.join(projectDir(id), "assets");
  const rel = filename.map(decodeURIComponent).join("/");
  const resolved = path.resolve(assetsDir, rel);

  // Path traversal protection
  if (!resolved.startsWith(assetsDir + path.sep)) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(resolved)) {
    return new Response("Not found", { status: 404 });
  }

  const ext = resolved.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME[ext] ?? "application/octet-stream";
  const data = fs.readFileSync(resolved);

  return new Response(data, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
