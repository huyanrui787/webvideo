import { NextResponse } from "next/server";
import { queryOrder } from "@/lib/billing/wechat";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await queryOrder(id);
  return NextResponse.json(result);
}
