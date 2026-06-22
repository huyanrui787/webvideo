// POST /api/billing/credits/buy — init credit purchase (used when not going through payment API directly)
// Mostly for consistency with the API surface; actual purchases go through payment endpoints.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Use /api/billing/payments/stripe/checkout or /api/billing/payments/wechat/order to purchase credits" },
    { status: 400 },
  );
}
