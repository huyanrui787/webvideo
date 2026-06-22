import { NextResponse } from "next/server";
import { handleWechatNotify } from "@/lib/billing/wechat";

export async function POST(req: Request) {
  const body = await req.text();
  const result = await handleWechatNotify(req.headers, body);

  if (result.code === "FAIL") {
    return NextResponse.json(
      { code: "FAIL", message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ code: "SUCCESS" });
}
