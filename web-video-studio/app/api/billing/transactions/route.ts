import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { creditTransactions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const skip = parseInt(url.searchParams.get("skip") ?? "0");
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50"));

  const txns = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit)
    .offset(skip);

  return NextResponse.json(txns);
}
