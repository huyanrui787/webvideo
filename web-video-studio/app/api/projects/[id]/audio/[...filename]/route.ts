import fs from "fs";
import path from "path";
import { projectDir } from "@/lib/projects";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; filename: string[] }> }
) {
  const { id, filename } = await params;
  const audioDir = path.join(projectDir(id), "presentation/public/audio");
  const rel = filename.map(decodeURIComponent).join("/");
  const resolved = path.resolve(audioDir, rel);

  // Path traversal protection
  if (!resolved.startsWith(audioDir + path.sep)) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(resolved)) {
    return new Response("Not found", { status: 404 });
  }

  const data = fs.readFileSync(resolved);
  const rangeHeader = req.headers.get("range");

  // Support range requests (browsers require this for audio seeking)
  if (rangeHeader) {
    const size = data.length;
    const [startStr, endStr] = rangeHeader.replace("bytes=", "").split("-");
    const start = parseInt(startStr ?? "0", 10);
    const end = endStr ? parseInt(endStr, 10) : size - 1;
    const chunk = data.subarray(start, end + 1);

    return new Response(chunk, {
      status: 206,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunk.length),
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return new Response(data, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Accept-Ranges": "bytes",
      "Content-Length": String(data.length),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
