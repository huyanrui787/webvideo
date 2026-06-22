import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { projectDir } from "@/lib/projects";
import { requireProjectAccess } from "@/lib/api-helpers";
import { spawn } from "child_process";
import { eq } from "drizzle-orm";

function spawnAsync(cmd: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    proc.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || stdout || `exit ${code}`));
    });
    proc.on("error", reject);
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error: accessError } = await requireProjectAccess(req, id);
  if (accessError) return accessError;
  const project = await db.query.projects.findFirst({
    where: (p, { eq }) => eq(p.id, id),
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ url: project.miaodaUrl ?? null, appId: project.miaodaAppId ?? null });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error: accessError } = await requireProjectAccess(req, id);
  if (accessError) return accessError;

  const distDir = path.join(projectDir(id), "presentation", "dist");
  if (!fs.existsSync(path.join(distDir, "index.html"))) {
    return NextResponse.json(
      { error: "dist/index.html not found. Build the project first." },
      { status: 400 }
    );
  }

  const project = await db.query.projects.findFirst({
    where: (p, { eq }) => eq(p.id, id),
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const presDir = path.join(projectDir(id), "presentation");
  const appName = project.title || "Web Video Presentation";

  try {
    let appId = project.miaodaAppId;

    // Create app if not yet published
    if (!appId) {
      const createOut = await spawnAsync("lark-cli", [
        "apps", "+create", "--name", appName, "--app-type", "HTML", "-q", ".data.app.app_id",
      ], presDir);
      appId = createOut.trim().replace(/^"|"$/g, "");
      if (!appId || !appId.startsWith("app_")) {
        return NextResponse.json(
          { error: "Failed to create Miaoda app", detail: createOut },
          { status: 500 }
        );
      }
    }

    // Publish dist/ to the app
    const publishOut = await spawnAsync("lark-cli", [
      "apps", "+html-publish", "--app-id", appId, "--path", "./dist",
    ], presDir);

    let publishResult: { ok: boolean; data?: { url: string }; error?: { message: string; hint: string } };
    try {
      publishResult = JSON.parse(publishOut);
    } catch {
      return NextResponse.json({ error: "Unexpected CLI output", detail: publishOut }, { status: 500 });
    }

    if (!publishResult.ok) {
      const hint = publishResult.error?.hint || publishResult.error?.message || "Unknown error";
      return NextResponse.json({ error: hint }, { status: 500 });
    }

    const url = publishResult.data?.url;
    if (!url) {
      return NextResponse.json({ error: "No URL in publish response", detail: publishOut }, { status: 500 });
    }

    // Persist app_id and url
    await db.update(projects)
      .set({ miaodaAppId: appId, miaodaUrl: url })
      .where(eq(projects.id, id));

    return NextResponse.json({ url, appId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
