import { NextResponse } from "next/server";
import { upsertEdit, deleteEdit, editKey } from "@/lib/wysiwyg";
import { requireProjectAccess } from "@/lib/api-helpers";
import type { WysiwygEdit } from "@/lib/wysiwyg";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  let body: WysiwygEdit;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.chapter || body.step == null) {
    return NextResponse.json({ error: "Missing chapter/step" }, { status: 400 });
  }

  const manifest = upsertEdit(id, body);
  return NextResponse.json({ ok: true, key: editKey(body), manifest });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  const manifest = deleteEdit(id, key);
  return NextResponse.json({ ok: true, manifest });
}
