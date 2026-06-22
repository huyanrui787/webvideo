import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/api-helpers";
import { tokenUsage, creditTransactions, projects } from "@/lib/db/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get("month");

  const now = new Date();
  const targetDate = month
    ? new Date(month + "-01")
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonth = Math.floor(targetDate.getTime() / 1000);
  const endOfMonth = Math.floor(
    new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59).getTime() / 1000
  );

  // ── AI token usage (from token_usage joined with projects) ──
  const tokenRows = await db
    .select({
      model: tokenUsage.model,
      totalInput: sql<number>`SUM(${tokenUsage.inputTokens})`,
      totalOutput: sql<number>`SUM(${tokenUsage.outputTokens})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(tokenUsage)
    .innerJoin(projects, eq(tokenUsage.projectId, projects.id))
    .where(
      and(
        eq(projects.userId, userId),
        gte(tokenUsage.createdAt, startOfMonth),
        lte(tokenUsage.createdAt, endOfMonth),
      ),
    )
    .groupBy(tokenUsage.model)
    .all();

  const chatTokens = tokenRows
    .filter((r) => !r.model.startsWith("claude"))
    .reduce((s, r) => s + r.totalInput + r.totalOutput, 0);
  const codeTokens = tokenRows
    .filter((r) => r.model.startsWith("claude"))
    .reduce((s, r) => s + r.totalInput + r.totalOutput, 0);

  // ── Credit-based usage stats ──
  const txRows = await db
    .select({
      operation: creditTransactions.operation,
      count: sql<number>`COUNT(*)`,
      totalCredits: sql<number>`SUM(ABS(${creditTransactions.amount}))`,
    })
    .from(creditTransactions)
    .where(
      and(
        eq(creditTransactions.userId, userId),
        eq(creditTransactions.type, "spend"),
        gte(creditTransactions.createdAt, startOfMonth),
        lte(creditTransactions.createdAt, endOfMonth),
      ),
    )
    .groupBy(creditTransactions.operation)
    .all();

  const opMap: Record<string, { count: number; credits: number }> = {};
  for (const r of txRows) {
    opMap[r.operation] = { count: (opMap[r.operation]?.count ?? 0) + r.count, credits: (opMap[r.operation]?.credits ?? 0) + r.totalCredits };
  }

  // ── Lifetime stats ──
  const lifetimeTokens = await db
    .select({
      totalInput: sql<number>`SUM(${tokenUsage.inputTokens})`,
      totalOutput: sql<number>`SUM(${tokenUsage.outputTokens})`,
    })
    .from(tokenUsage)
    .innerJoin(projects, eq(tokenUsage.projectId, projects.id))
    .where(eq(projects.userId, userId))
    .all();

  const lifetimeInput = lifetimeTokens[0]?.totalInput ?? 0;
  const lifetimeOutput = lifetimeTokens[0]?.totalOutput ?? 0;

  return NextResponse.json({
    month: month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    tokenUsage: {
      chatTokens,
      codeTokens,
      chatCalls: tokenRows.filter((r) => !r.model.startsWith("claude")).reduce((s, r) => s + r.count, 0),
      codeCalls: tokenRows.filter((r) => r.model.startsWith("claude")).reduce((s, r) => s + r.count, 0),
    },
    operations: {
      imageGen: opMap["image_gen"] ?? { count: 0, credits: 0 },
      imageIllustrate: opMap["image_illustrate"] ?? { count: 0, credits: 0 },
      tts: opMap["tts"] ?? { count: 0, credits: 0 },
      render: opMap["render"] ?? { count: 0, credits: 0 },
      totalCreditsSpent: Object.values(opMap).reduce((s, v) => s + v.credits, 0),
    },
    lifetime: {
      totalInputTokens: lifetimeInput,
      totalOutputTokens: lifetimeOutput,
      totalTokens: lifetimeInput + lifetimeOutput,
    },
  });
}
