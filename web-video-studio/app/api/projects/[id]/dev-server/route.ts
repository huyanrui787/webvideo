import { NextResponse } from "next/server";
import { getDevServer, startDevServer, stopDevServer } from "@/lib/dev-servers";
import { requireProjectAccess } from "@/lib/api-helpers";
import fs from "fs";
import path from "path";
import { projectDir } from "@/lib/projects";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const server = getDevServer(id);
  if (server) return NextResponse.json(server);
  return NextResponse.json({ port: null, ready: false });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const { action } = await req.json().catch(() => ({ action: "start" }));

  if (action === "stop") {
    stopDevServer(id);
    return NextResponse.json({ ok: true });
  }

  // Check presentation/ exists before starting
  const presDir = path.join(projectDir(id), "presentation");
  if (!fs.existsSync(presDir)) {
    return NextResponse.json(
      { error: "presentation/ not found. Run scaffold first." },
      { status: 400 }
    );
  }

  try {
    const { port } = await startDevServer(id);
    return NextResponse.json({ port, ready: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "启动失败" },
      { status: 500 }
    );
  }
}
