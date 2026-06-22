import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startRender, getRenderJob } from "@/lib/render";
import { getDevServer } from "@/lib/dev-servers";
import net from "net";
import path from "path";
import fs from "fs";
import { projectDir } from "@/lib/projects";

/** Scan 5300-5399 for a listening vite process */
async function findDevPort(): Promise<number | null> {
  for (let port = 5300; port <= 5399; port++) {
    const open = await new Promise<boolean>((resolve) => {
      const sock = net.createConnection({ port, host: "127.0.0.1" });
      sock.setTimeout(300);
      sock.on("connect", () => { sock.destroy(); resolve(true); });
      sock.on("error", () => resolve(false));
      sock.on("timeout", () => { sock.destroy(); resolve(false); });
    });
    if (open) return port;
  }
  return null;
}

export const maxDuration = 3600; // 1 hour for long presentations

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);

  // ?download=1 → serve the rendered MP4 file
  if (searchParams.get("download") === "1") {
    const job = getRenderJob(id);
    if (!job?.outputFile || job.status !== "done") {
      return NextResponse.json({ error: "No render available" }, { status: 404 });
    }
    const filePath = path.join(projectDir(id), job.outputFile);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    const buffer = fs.readFileSync(filePath);
    return new Response(buffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="presentation.mp4"`,
        "Content-Length": String(buffer.length),
      },
    });
  }

  // Default: return job status
  const job = getRenderJob(id);
  if (!job) return NextResponse.json({ status: "idle" });
  return NextResponse.json(job);
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await db.query.projects.findFirst({
    where: (p, { eq }) => eq(p.id, id),
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const server = getDevServer(id);
  const port = server?.port ?? await findDevPort();

  if (!port) {
    return NextResponse.json(
      { error: "Dev server not running — start it first" },
      { status: 400 }
    );
  }

  startRender(id, port);

  return NextResponse.json({ status: "running" });
}
