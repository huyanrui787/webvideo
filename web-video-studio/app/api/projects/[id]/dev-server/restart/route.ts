import { NextResponse } from "next/server";
import { restartDevServer } from "@/lib/dev-servers";
import { requireProjectAccess } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const result = await restartDevServer(id);
  if (!result) {
    return NextResponse.json({ error: "restart failed or max attempts reached" }, { status: 503 });
  }
  return NextResponse.json({ port: result.port, ready: true });
}
