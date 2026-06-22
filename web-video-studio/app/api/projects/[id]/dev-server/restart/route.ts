import { NextResponse } from "next/server";
import { restartDevServer } from "@/lib/dev-servers";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await restartDevServer(id);
  if (!result) {
    return NextResponse.json({ error: "restart failed or max attempts reached" }, { status: 503 });
  }
  return NextResponse.json({ port: result.port, ready: true });
}
