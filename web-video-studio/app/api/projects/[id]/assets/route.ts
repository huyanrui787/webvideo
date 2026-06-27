import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { projectDir, readAssetMeta, patchAssetMeta } from "@/lib/projects";
import { db } from "@/lib/db";
import { projectAssetRefs, libraryAssets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { analyzeAsset } from "@/lib/analyze-asset";

function assetsDir(id: string): string {
  return path.join(projectDir(id), "assets");
}

const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", svg: "image/svg+xml", gif: "image/gif",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
};

function isImage(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png", "webp", "svg", "gif"].includes(ext);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Local project assets — recursive scan for subdirectories too
  const dir = assetsDir(id);
  const meta = readAssetMeta(id);

  function walkDir(currentDir: string, relativePrefix: string): Array<{
    name: string; originalName: string; type: "image" | "video";
    size: number; url: string; source: "local"; refId: null;
    caption: string; tags: string[];
  }> {
    const items: any[] = [];
    if (!fs.existsSync(currentDir)) return items;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "meta.json") continue;
      const fullPath = path.join(currentDir, entry.name);
      const relPath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        items.push(...walkDir(fullPath, relPath));
      } else {
        const ext = entry.name.split(".").pop()?.toLowerCase() ?? "";
        if (!Object.keys(MIME).includes(ext)) continue;
        items.push({
          name: relPath,
          originalName: entry.name,
          type: (isImage(entry.name) ? "image" : "video") as "image" | "video",
          size: fs.statSync(fullPath).size,
          url: `/api/projects/${id}/assets/${encodeURIComponent(relPath)}`,
          source: "local" as const,
          refId: null,
          caption: meta[entry.name]?.caption ?? "",
          tags: meta[entry.name]?.tags ?? [],
        });
      }
    }
    return items;
  }

  const localItems = walkDir(dir, "");

  // Include failed illustration entries from manifest.json
  const manifestPath = path.join(projectDir(id), "manifest.json");
  const failedItems: any[] = [];
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      const steps = manifest.steps ?? [];
      for (const step of steps) {
        if (step.imageStatus === "error" && !step.image) {
          const label = `step-${String(step.index + 1).padStart(2, "0")}`;
          failedItems.push({
            name: label,
            originalName: label,
            type: "image" as const,
            size: 0,
            url: null,
            source: "failed" as const,
            status: "error" as const,
            stepIdx: step.index,
            error: step.error || "Image generation failed",
            refId: null,
            caption: "",
            tags: [],
          });
        }
      }
    } catch {}
  }

  // Library refs
  const refs = await db
    .select({
      refId: projectAssetRefs.id,
      assetId: libraryAssets.id,
      name: libraryAssets.name,
      originalName: libraryAssets.originalName,
      type: libraryAssets.type,
      size: libraryAssets.size,
      caption: libraryAssets.caption,
    })
    .from(projectAssetRefs)
    .innerJoin(libraryAssets, eq(projectAssetRefs.assetId, libraryAssets.id))
    .where(eq(projectAssetRefs.projectId, id));

  const libItems = refs.map((r) => ({
    name: r.originalName,
    originalName: r.originalName,
    type: r.type,
    size: r.size,
    url: `/api/library/assets/${r.assetId}/file`,
    source: "library" as const,
    refId: r.refId,
    assetId: r.assetId,
    caption: r.caption ?? "",
    tags: [] as string[],
  }));

  return NextResponse.json([...localItems, ...failedItems, ...libItems]);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dir = assetsDir(id);
  fs.mkdirSync(dir, { recursive: true });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const safeName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._\-一-鿿]/g, "");
  const ext = safeName.split(".").pop()?.toLowerCase() ?? "";
  if (!Object.keys(MIME).includes(ext)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const dest = path.join(dir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(dest, buffer);

  // Async Vision analysis — don't await, let upload respond immediately
  const assetType = isImage(safeName) ? "image" : "video";
  analyzeAsset(dest, assetType).then(({ caption, durationSec }) => {
    patchAssetMeta(id, safeName, {
      caption,
      ...(durationSec !== undefined && { durationSec }),
    });
  }).catch(() => { /* Vision failure is non-fatal */ });

  return NextResponse.json({
    name: safeName,
    originalName: safeName,
    type: isImage(safeName) ? "image" : "video",
    size: buffer.byteLength,
    url: `/api/projects/${id}/assets/${encodeURIComponent(safeName)}`,
    source: "local",
    refId: null,
  }, { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json() as { name?: string; refId?: string };

  // Remove library ref
  if (body.refId) {
    await db.delete(projectAssetRefs).where(eq(projectAssetRefs.id, body.refId));
    return NextResponse.json({ ok: true });
  }

  // Remove local file
  if (!body.name) return NextResponse.json({ error: "name or refId required" }, { status: 400 });
  const dir = assetsDir(id);
  const resolved = path.resolve(dir, body.name);
  if (!resolved.startsWith(dir + path.sep)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (fs.existsSync(resolved)) fs.unlinkSync(resolved);
  return NextResponse.json({ ok: true });
}
