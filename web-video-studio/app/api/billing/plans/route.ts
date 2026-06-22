import { NextResponse } from "next/server";
import { listPlans } from "@/lib/billing";

export async function GET() {
  const plans = await listPlans();
  return NextResponse.json(plans);
}
