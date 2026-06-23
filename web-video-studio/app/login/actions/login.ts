"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkPassword } from "@/lib/password";
import { signToken, setSessionCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(prevState: { error?: string }, formData: FormData) {
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;
  const nextUrl = (formData.get("next") as string) || "/studio";

  if (!email || !password) {
    return { error: "邮箱和密码不能为空" };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });

  if (!user || !(await checkPassword(password, user.password))) {
    return { error: "邮箱或密码不正确" };
  }

  const token = await signToken({ userId: user.id, role: user.role });
  await setSessionCookie(token);

  redirect(nextUrl);
}
