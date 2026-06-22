import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/api-helpers";
import { projectDir } from "@/lib/projects";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import { patchAssetMeta } from "@/lib/projects";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const { url, filename, caption, type } = await req.json().catch(() => ({}));
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const res = await fetch(url).catch(() => null);
  if (!res?.ok) return NextResponse.json({ error: "Failed to fetch URL" }, { status: 502 });

  const contentType = res.headers.get("content-type") ?? "";
  const ext = guessExt(filename ?? url, contentType);
  const safeName = sanitize(filename ?? path.basename(new URL(url).pathname)) || `asset-${nanoid(6)}`;
  const finalName = safeName.includes(".") ? safeName : `${safeName}${ext}`;

  const assetsDir = path.join(projectDir(id), "assets");
  fs.mkdirSync(assetsDir, { recursive: true });

  // Avoid name collisions
  let destName = finalName;
  let counter = 1;
  while (fs.existsSync(path.join(assetsDir, destName))) {
    const [base, ...extParts] = finalName.split(".");
    destName = extParts.length
      ? `${base}-${counter}.${extParts.join(".")}`
      : `${finalName}-${counter}`;
    counter++;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(assetsDir, destName), buf);

  if (caption) patchAssetMeta(id, destName, { caption });

  const assetType = type ?? (contentType.startsWith("video") ? "video" : "image");
  const fileUrl = `/api/projects/${id}/assets/${encodeURIComponent(destName)}`;

  return NextResponse.json({ ok: true, name: destName, url: fileUrl, type: assetType });
}

function guessExt(name: string, mime: string): string {
  if (name.match(/\.(jpe?g|png|webp|gif|svg|mp4|webm|mov)$/i)) return "";
  if (mime.includes("jpeg")) return ".jpg";
  if (mime.includes("png")) return ".png";
  if (mime.includes("gif")) return ".gif";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("mp4")) return ".mp4";
  if (mime.includes("webm")) return ".webm";
  return ".jpg";
}

function sanitize(s: string): string {
  return s.replace(/[^a-zA-Z0-9._一-龥-]/g, "-").replace(/-+/g, "-").slice(0, 80);
}
