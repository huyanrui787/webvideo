import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { libraryAssets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { analyzeAsset } from "@/lib/analyze-asset";

const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", svg: "image/svg+xml", gif: "image/gif",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
};

function isImage(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png", "webp", "svg", "gif"].includes(ext);
}

function libraryDir(userId: string): string {
  const dir = path.join(process.cwd(), "data", "library", userId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function GET(req: Request) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(libraryAssets)
    .where(eq(libraryAssets.userId, userId))
    .orderBy(libraryAssets.createdAt);

  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      tags: JSON.parse(r.tags ?? "[]"),
      caption: r.caption ?? "",
      url: `/api/library/assets/${r.id}/file`,
    }))
  );
}

export async function POST(req: Request) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const tagsRaw = formData.get("tags") as string | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!Object.keys(MIME).includes(ext)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const id = nanoid(10);
  const safeName = `${id}.${ext}`;
  const dir = libraryDir(userId);
  const dest = path.join(dir, safeName);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(dest, buffer);

  const tags = tagsRaw ? JSON.parse(tagsRaw) : [];
  const originalName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._\-一-鿿]/g, "");

  const [row] = await db
    .insert(libraryAssets)
    .values({
      id,
      userId,
      name: safeName,
      originalName,
      type: isImage(file.name) ? "image" : "video",
      size: buffer.byteLength,
      tags: JSON.stringify(tags),
    })
    .returning();

  // Async Vision analysis — don't await, let upload respond immediately
  const assetType = isImage(file.name) ? "image" : "video";
  analyzeAsset(dest, assetType).then(({ caption, durationSec }) => {
    db.update(libraryAssets)
      .set({ caption, ...(durationSec !== undefined && { durationSec }) })
      .where(eq(libraryAssets.id, id))
      .catch(() => { /* ignore DB errors in background */ });
  }).catch(() => { /* Vision failure is non-fatal */ });

  return NextResponse.json(
    { ...row, tags, url: `/api/library/assets/${id}/file` },
    { status: 201 }
  );
}

export async function DELETE(req: Request) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const [row] = await db
    .select()
    .from(libraryAssets)
    .where(and(eq(libraryAssets.id, id), eq(libraryAssets.userId, userId)))
    .limit(1);

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const filePath = path.join(libraryDir(userId), row.name);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await db
    .delete(libraryAssets)
    .where(and(eq(libraryAssets.id, id), eq(libraryAssets.userId, userId)));

  return NextResponse.json({ ok: true });
}
