import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api-helpers";
import { createWechatOrder } from "@/lib/billing/wechat";
import { db } from "@/lib/db";
import { getPlan } from "@/lib/billing";

export async function POST(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { planCode, billingCycle = "monthly", creditPackageId } = body;

  if (planCode) {
    const plan = await getPlan(planCode);
    if (!plan) return NextResponse.json({ error: `Unknown plan: ${planCode}` }, { status: 400 });

    const priceCents = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;

    const result = await createWechatOrder({
      userId,
      amountCents: priceCents,
      description: `Web Video Studio – ${plan.name} (${billingCycle})`,
      planCode,
      billingCycle,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      orderNo: result.orderNo,
      codeUrl: result.codeUrl,
      expiresIn: result.expiresIn,
    });
  }

  if (creditPackageId) {
    const pkg = await db.query.creditPackages.findFirst({
      where: (p, { eq }) => eq(p.id, creditPackageId),
    });
    if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

    const result = await createWechatOrder({
      userId,
      amountCents: pkg.priceCents,
      description: `Web Video Studio – ${pkg.credits} 积分`,
      creditPackageId: pkg.id,
      creditsAmount: pkg.credits,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      orderNo: result.orderNo,
      codeUrl: result.codeUrl,
      expiresIn: result.expiresIn,
    });
  }

  return NextResponse.json({ error: "planCode or creditPackageId required" }, { status: 400 });
}
