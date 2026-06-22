import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { libraryAssets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", svg: "image/svg+xml", gif: "image/gif",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  const [row] = await db
    .select()
    .from(libraryAssets)
    .where(and(eq(libraryAssets.id, id), eq(libraryAssets.userId, userId)))
    .limit(1);

  if (!row) return new Response("Not found", { status: 404 });

  const filePath = path.join(process.cwd(), "data", "library", userId, row.name);
  if (!fs.existsSync(filePath)) return new Response("Not found", { status: 404 });

  const ext = row.name.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME[ext] ?? "application/octet-stream";
  const data = fs.readFileSync(filePath);

  return new Response(data, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
