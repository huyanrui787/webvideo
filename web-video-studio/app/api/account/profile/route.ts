import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUserId } from "@/lib/api-helpers";

export async function PATCH(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name } = body;

  const updates: Record<string, unknown> = { updatedAt: Math.floor(Date.now() / 1000) };

  if (name !== undefined) {
    if (!name?.trim()) return NextResponse.json({ error: "姓名不能为空" }, { status: 400 });
    updates.name = name.trim();
  }

  if (Object.keys(updates).length <= 1) {
    return NextResponse.json({ ok: true, message: "No changes" });
  }

  await db.update(users).set(updates).where(eq(users.id, userId));
  return NextResponse.json({ ok: true });
}
