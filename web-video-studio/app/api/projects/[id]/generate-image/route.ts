import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/api-helpers";
import { projectDir, patchAssetMeta } from "@/lib/projects";
import { uploadToFal } from "@/lib/image-gen";
import { fal } from "@fal-ai/client";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";

const MODELS = {
  schnell: "fal-ai/flux/schnell",
  pro: "fal-ai/flux-pro/v1.1",
} as const;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const { prompt, model = "schnell", size = "landscape_4_3" } = await req.json().catch(() => ({}));
  if (!prompt?.trim()) return NextResponse.json({ error: "prompt required" }, { status: 400 });

  const falKey = process.env.FAL_KEY;
  if (!falKey) return NextResponse.json({ error: "FAL_KEY not configured" }, { status: 503 });

  fal.config({ credentials: falKey });

  const modelId = MODELS[model as keyof typeof MODELS] ?? MODELS.schnell;

  const result = await fal.subscribe(modelId, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: { prompt, image_size: size, num_images: 1 } as any,
  }) as { images?: Array<{ url: string }> };

  const imageUrl = result.images?.[0]?.url;
  if (!imageUrl) return NextResponse.json({ error: "No image returned" }, { status: 500 });

  // Download and save to project assets
  const res = await fetch(imageUrl);
  if (!res.ok) return NextResponse.json({ error: "Failed to download generated image" }, { status: 502 });

  const slug = prompt.trim().slice(0, 30).replace(/[^a-zA-Z0-9一-龥]/g, "-");
  const filename = `ai-${slug}-${nanoid(4)}.jpg`;
  const assetsDir = path.join(projectDir(id), "assets");
  fs.mkdirSync(assetsDir, { recursive: true });
  fs.writeFileSync(path.join(assetsDir, filename), Buffer.from(await res.arrayBuffer()));

  patchAssetMeta(id, filename, { caption: prompt.trim().slice(0, 100) });

  return NextResponse.json({
    ok: true,
    name: filename,
    url: `/api/projects/${id}/assets/${encodeURIComponent(filename)}`,
    prompt,
  });
}
