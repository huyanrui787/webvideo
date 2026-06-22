import { NextResponse } from "next/server";
import { handleStripeWebhook } from "@/lib/billing/stripe";

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  const result = await handleStripeWebhook(payload, signature);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}
