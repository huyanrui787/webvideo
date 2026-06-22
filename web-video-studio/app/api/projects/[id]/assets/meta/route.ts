import { NextResponse } from "next/server";
import { patchAssetMeta } from "@/lib/projects";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json() as { filename: string; caption?: string; tags?: string[] };
  if (!body.filename) return NextResponse.json({ error: "filename required" }, { status: 400 });

  patchAssetMeta(id, body.filename, {
    ...(body.caption !== undefined && { caption: body.caption }),
    ...(body.tags !== undefined && { tags: body.tags }),
  });

  return NextResponse.json({ ok: true });
}
