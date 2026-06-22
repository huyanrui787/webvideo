import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkPassword } from "@/lib/password";
import { signToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json() as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });

  if (!user || !(await checkPassword(password, user.password))) {
    return NextResponse.json({ error: "邮箱或密码不正确" }, { status: 401 });
  }

  const token = await signToken({ userId: user.id, role: user.role });
  await setSessionCookie(token);

  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
}
