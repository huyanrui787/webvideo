import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api-helpers";
import { createPortalSession } from "@/lib/billing/stripe";

export async function POST(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const baseUrl = new URL(req.url).origin;
  const result = await createPortalSession(userId, `${baseUrl}/billing`);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ url: result.url });
}
