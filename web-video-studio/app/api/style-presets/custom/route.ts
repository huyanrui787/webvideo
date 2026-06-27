/**
 * GET  /api/style-presets/custom — list user's custom presets
 * POST /api/style-presets/custom — save a custom preset
 * DELETE /api/style-presets/custom?id=xxx — delete a custom preset
 */
import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api-helpers";
import { getUserPresets, saveUserPreset, deleteUserPreset } from "@/lib/custom-presets";
import type { CustomPreset } from "@/lib/illustration-style";

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const presets = getUserPresets(userId);
  return NextResponse.json({ ok: true, presets });
}

export async function POST(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, visualDna, characterDescription, presetId } = body as CustomPreset & { presetId?: string };

  if (!name || !visualDna || !characterDescription) {
    return NextResponse.json({ error: "name, visualDna, characterDescription required" }, { status: 400 });
  }

  const id = saveUserPreset(userId, { name, visualDna, characterDescription }, presetId);
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const presetId = url.searchParams.get("id");
  if (!presetId) return NextResponse.json({ error: "id required" }, { status: 400 });

  deleteUserPreset(userId, presetId);
  return NextResponse.json({ ok: true });
}
