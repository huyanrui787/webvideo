import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/api-helpers";
import { paymentOrders } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") ?? "20"));
  const skip = parseInt(url.searchParams.get("skip") ?? "0");

  const orders = await db
    .select()
    .from(paymentOrders)
    .where(eq(paymentOrders.userId, userId))
    .orderBy(desc(paymentOrders.createdAt))
    .limit(limit)
    .offset(skip);

  return NextResponse.json(
    orders.map((o) => ({
      id: o.id,
      provider: o.provider,
      orderType: o.orderType,
      amountCents: o.amountCents,
      currency: o.currency,
      planCode: o.planCode,
      creditsAmount: o.creditsAmount,
      status: o.status,
      paidAt: o.paidAt,
      createdAt: o.createdAt,
    })),
  );
}
