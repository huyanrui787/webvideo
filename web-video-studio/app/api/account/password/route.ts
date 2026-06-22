import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUserId } from "@/lib/api-helpers";
import { checkPassword, hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { oldPassword, newPassword } = await req.json().catch(() => ({}));
  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: "旧密码和新密码不能为空" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "新密码至少 8 位" }, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const valid = await checkPassword(oldPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: "旧密码不正确" }, { status: 403 });
  }

  const hashed = await hashPassword(newPassword);
  await db.update(users)
    .set({ password: hashed, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(users.id, userId));

  return NextResponse.json({ ok: true });
}
