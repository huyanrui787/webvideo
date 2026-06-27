import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectAssetRefs, libraryAssets } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireProjectAccess, getUserId } from "@/lib/api-helpers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { assetIds } = await req.json() as { assetIds: string[] };
  if (!Array.isArray(assetIds) || assetIds.length === 0) {
    return NextResponse.json({ error: "assetIds required" }, { status: 400 });
  }

  // Verify all assets belong to this user
  const owned = await db
    .select({ id: libraryAssets.id })
    .from(libraryAssets)
    .where(and(eq(libraryAssets.userId, userId), inArray(libraryAssets.id, assetIds)));

  const ownedIds = new Set(owned.map((r) => r.id));
  const valid = assetIds.filter((aid) => ownedIds.has(aid));

  if (valid.length === 0) {
    return NextResponse.json({ error: "No valid assets" }, { status: 400 });
  }

  // Skip any already-linked assets
  const existing = await db
    .select({ assetId: projectAssetRefs.assetId })
    .from(projectAssetRefs)
    .where(eq(projectAssetRefs.projectId, id));

  const existingIds = new Set(existing.map((r) => r.assetId));
  const toAdd = valid.filter((aid) => !existingIds.has(aid));

  if (toAdd.length > 0) {
    await db.insert(projectAssetRefs).values(
      toAdd.map((assetId) => ({ id: nanoid(10), projectId: id, assetId }))
    );
  }

  return NextResponse.json({ added: toAdd.length, skipped: valid.length - toAdd.length });
}
