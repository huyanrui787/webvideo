import { NextResponse } from "next/server";
import { db, rawDb } from "@/lib/db";
import { users, subscriptions, creditAccounts, creditTransactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { hashPassword } from "@/lib/password";
import { signToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password, name } = await req.json() as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password || !name) {
    return NextResponse.json({ error: "姓名、邮箱和密码不能为空" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "密码至少 8 位" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // First user ever → admin
  const count = await db.select({ id: users.id }).from(users).limit(1);
  const role = count.length === 0 ? "admin" : "user";

  const id = nanoid(10);
  const hashedPw = await hashPassword(password);
  const ts = Math.floor(Date.now() / 1000);

  // ─── Atomic transaction: check uniqueness + create all records ──────────
  const sqlite = rawDb;
  try {
    sqlite.transaction(() => {
      // Check email uniqueness inside transaction (eliminates TOCTOU race)
      const dup = sqlite.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
      if (dup) {
        throw new Error("EMAIL_TAKEN");
      }

      // 1. Insert user
      sqlite.prepare(
        `INSERT INTO users (id, email, name, password, role, plan_code, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'free', ?, ?)`
      ).run(id, normalizedEmail, name.trim(), hashedPw, role, ts, ts);

      // 2. Create free subscription
      const subId = nanoid(10);
      sqlite.prepare(
        `INSERT INTO subscriptions (id, user_id, plan_code, billing_cycle, status, current_period_start, current_period_end, created_at, updated_at)
         VALUES (?, ?, 'free', 'monthly', 'active', ?, ?, ?, ?)`
      ).run(subId, id, ts, ts + 365 * 24 * 60 * 60, ts, ts);

      // 3. Create credit account with 100 starting credits
      const acctId = nanoid(10);
      sqlite.prepare(
        `INSERT INTO credit_accounts (id, user_id, balance, total_earned, total_spent, updated_at)
         VALUES (?, ?, 100, 100, 0, ?)`
      ).run(acctId, id, ts);

      // 4. Record signup bonus transaction
      const txId = nanoid(10);
      sqlite.prepare(
        `INSERT INTO credit_transactions (id, user_id, type, amount, balance_after, operation, description, created_at)
         VALUES (?, ?, 'earn', 100, 100, 'signup_bonus', '新用户注册赠送积分', ?)`
      ).run(txId, id, ts);
    })();
  } catch (err: any) {
    if (err.message === "EMAIL_TAKEN") {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 409 });
    }
    throw err;
  }

  const token = await signToken({ userId: id, role });
  await setSessionCookie(token);

  return NextResponse.json(
    { id, email: normalizedEmail, name: name.trim(), role, planCode: "free", credits: 100 },
    { status: 201 },
  );
}
