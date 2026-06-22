import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { libraryAssets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { originalName?: string; tags?: string[]; caption?: string };

  const updates: Partial<{ originalName: string; tags: string; caption: string }> = {};
  if (body.originalName !== undefined) updates.originalName = body.originalName;
  if (body.tags !== undefined) updates.tags = JSON.stringify(body.tags);
  if (body.caption !== undefined) updates.caption = body.caption;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await db
    .update(libraryAssets)
    .set(updates)
    .where(and(eq(libraryAssets.id, id), eq(libraryAssets.userId, userId)));

  return NextResponse.json({ ok: true });
}
