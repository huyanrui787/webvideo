import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api-helpers";
import { checkFeature } from "@/lib/billing";
import type { FeatureFlag } from "@/lib/billing/types";

export async function POST(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { feature } = await req.json().catch(() => ({}));
  if (!feature) return NextResponse.json({ error: "feature required" }, { status: 400 });

  const result = await checkFeature(userId, feature as FeatureFlag);
  return NextResponse.json(result);
}
