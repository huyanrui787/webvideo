import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getBalance } from "@/lib/billing/credits";
import { getUserPlan } from "@/lib/billing";

export async function GET(req: Request) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      planCode: users.planCode,
      preferredModel: users.preferredModel,
      preferredCodingModel: users.preferredCodingModel,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then(rows => rows[0] ?? null);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [balance, plan] = await Promise.all([
    getBalance(userId),
    getUserPlan(userId),
  ]);

  return NextResponse.json({
    ...user,
    credits: balance,
    planName: plan.name,
    avatarUrl: null, // placeholder for future avatar upload
  });
}
