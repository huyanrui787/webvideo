import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api-helpers";
import { createCheckoutSession } from "@/lib/billing/stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { planCode, billingCycle, creditPackageId } = body;

  // Get user email for Stripe
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const baseUrl = new URL(req.url).origin;

  if (planCode) {
    const result = await createCheckoutSession({
      userId,
      userEmail: user.email,
      planCode,
      billingCycle: billingCycle ?? "monthly",
      successUrl: `${baseUrl}/billing?success=true`,
      cancelUrl: `${baseUrl}/billing?cancelled=true`,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ url: result.url });
  }

  if (creditPackageId) {
    const { creditPackages } = await import("@/lib/db/schema");
    const pkg = await db.query.creditPackages.findFirst({
      where: (p, { eq }) => eq(p.id, creditPackageId),
    });
    if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

    const result = await createCheckoutSession({
      userId,
      userEmail: user.email,
      creditPackageId: pkg.id,
      creditAmount: pkg.credits,
      creditPriceCents: pkg.priceCents,
      successUrl: `${baseUrl}/billing?success=true`,
      cancelUrl: `${baseUrl}/billing?cancelled=true`,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ url: result.url });
  }

  return NextResponse.json({ error: "planCode or creditPackageId required" }, { status: 400 });
}
