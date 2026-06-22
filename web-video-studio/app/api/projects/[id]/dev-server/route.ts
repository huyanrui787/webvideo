import { NextResponse } from "next/server";
import { getDevServer, startDevServer, stopDevServer } from "@/lib/dev-servers";
import fs from "fs";
import path from "path";
import { projectDir } from "@/lib/projects";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check our in-memory registry first
  const server = getDevServer(id);
  if (server) return NextResponse.json(server);

  // No known server for this project
  return NextResponse.json({ port: null, ready: false });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const { port } = await startDevServer(id);
  return NextResponse.json({ port, ready: true });
}
