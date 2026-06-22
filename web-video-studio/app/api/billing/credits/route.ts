import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api-helpers";
import { getBalance } from "@/lib/billing/credits";
import { db } from "@/lib/db";
import { creditTransactions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const balance = await getBalance(userId);

  // Recent 20 transactions
  const txns = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(20);

  // Total counts
  const account = await db.query.creditAccounts.findFirst({
    where: (a, { eq }) => eq(a.userId, userId),
  });

  return NextResponse.json({
    balance,
    totalEarned: account?.totalEarned ?? 0,
    totalSpent: account?.totalSpent ?? 0,
    recentTransactions: txns.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      operation: t.operation,
      description: t.description,
      createdAt: t.createdAt,
    })),
  });
}
