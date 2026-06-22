import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api-helpers";
import { getUserSubscription, getUserPlan } from "@/lib/billing";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getUserSubscription(userId);
  const plan = await getUserPlan(userId);

  return NextResponse.json({
    subscription: sub,
    plan,
  });
}

export async function POST(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planCode, billingCycle = "monthly" } = await req.json().catch(() => ({}));
  if (!planCode) return NextResponse.json({ error: "planCode required" }, { status: 400 });

  // Only free plan can be self-activated (downgrade)
  if (planCode !== "free") {
    return NextResponse.json(
      { error: "请通过支付通道升级套餐" },
      { status: 400 },
    );
  }

  const ts = Math.floor(Date.now() / 1000);
  const existing = await getUserSubscription(userId);

  if (existing) {
    await db.update(subscriptions)
      .set({
        planCode,
        billingCycle,
        status: "active",
        currentPeriodStart: ts,
        currentPeriodEnd: ts + 365 * 24 * 60 * 60,
        updatedAt: ts,
      })
      .where(eq(subscriptions.id, existing.id));
  } else {
    await db.insert(subscriptions).values({
      id: nanoid(10),
      userId,
      planCode,
      billingCycle,
      status: "active",
      currentPeriodStart: ts,
      currentPeriodEnd: ts + 365 * 24 * 60 * 60,
    });
  }

  return NextResponse.json({ ok: true });
}
