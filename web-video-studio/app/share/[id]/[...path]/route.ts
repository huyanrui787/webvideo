import fs from "fs";
import path from "path";
import { projectDir } from "@/lib/projects";

const MIME: Record<string, string> = {
  html: "text/html; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  mjs: "application/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  json: "application/json",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  webm: "video/webm",
};

function mimeFor(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return MIME[ext] ?? "application/octet-stream";
}

function serveFile(absPath: string): Response {
  try {
    const data = fs.readFileSync(absPath);
    return new Response(data, {
      headers: {
        "Content-Type": mimeFor(absPath),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; path: string[] }> }
) {
  const { id, path: segments } = await params;
  const distDir = path.join(projectDir(id), "presentation", "dist");

  const rel = segments.join("/");
  const resolved = path.resolve(distDir, rel);

  // Prevent path traversal outside dist/
  if (!resolved.startsWith(distDir + path.sep) && resolved !== distDir) {
    return new Response("Forbidden", { status: 403 });
  }

  // If the resolved path is a directory, serve index.html inside it
  const target = fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()
    ? path.join(resolved, "index.html")
    : resolved;

  return serveFile(target);
}
