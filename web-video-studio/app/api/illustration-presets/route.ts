/**
 * Public preset previews — no auth, no project needed.
 *
 * GET  /api/illustration-presets — returns cached previews
 * POST /api/illustration-presets — generate missing previews
 */
import { NextResponse } from "next/server";
import { generateImage } from "@/lib/image-gen";
import { STYLE_PRESETS } from "@/lib/illustration-style";
import fs from "fs";
import path from "path";

const CACHE_DIR = path.resolve(process.cwd(), "data", "style-previews");
const CORE_IDEA = "A person sitting at a desk reading a book, with a steaming cup of tea beside them. Simple everyday scene. The character should be the main focus, centered.";
const ELEMENTS = "Elements: book / teacup / desk";

function buildPrompt(preset: string): string {
  const p = STYLE_PRESETS[preset];
  if (!p) return "";
  return [
    "Generate one standalone 16:9 horizontal illustration.", "",
    "Visual DNA:", p.visualDna, "",
    "Recurring IP character required:", p.characterDescription, "",
    CORE_IDEA, ELEMENTS,
  ].join("\n");
}

export async function GET() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const previews: Record<string, string | null> = {};
  const pending: string[] = [];

  for (const preset of Object.keys(STYLE_PRESETS)) {
    const cachePath = path.join(CACHE_DIR, `${preset}.json`);
    if (fs.existsSync(cachePath)) {
      try {
        const cached = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
        if (cached.b64) { previews[preset] = `data:image/png;base64,${cached.b64}`; continue; }
      } catch {}
    }
    previews[preset] = null;
    pending.push(preset);
  }

  return NextResponse.json({ ok: true, previews, pending });
}

export async function POST(req: Request) {
  // Single-image preview mode: POST with { prompt }
  const body = await req.json().catch(() => ({}));
  if (body.prompt) {
    try {
      const result = await generateImage({ prompt: body.prompt });
      const b64 = result.buffer.toString("base64");
      return NextResponse.json({ ok: true, image: `data:image/png;base64,${b64}` });
    } catch (err) {
      return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
  }

  // Batch generate missing preset previews (existing behavior)
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const presets = Object.keys(STYLE_PRESETS);
  const results: Record<string, string> = {};
  const failed: string[] = [];

  // Find missing
  const missing = presets.filter((preset) => {
    const cachePath = path.join(CACHE_DIR, `${preset}.json`);
    if (fs.existsSync(cachePath)) {
      try {
        const cached = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
        if (cached.b64) { results[preset] = `data:image/png;base64,${cached.b64}`; return false; }
      } catch {}
    }
    return true;
  });

  // Generate missing
  await Promise.allSettled(missing.map(async (preset) => {
    const prompt = buildPrompt(preset);
    if (!prompt) return;
    try {
      const result = await generateImage({ prompt });
      const b64 = result.buffer.toString("base64");
      fs.writeFileSync(path.join(CACHE_DIR, `${preset}.json`), JSON.stringify({ b64, preset, generatedAt: Date.now() }));
      results[preset] = `data:image/png;base64,${b64}`;
    } catch (err) {
      console.error(`[presets] Generation failed for ${preset}:`, err);
      failed.push(preset);
    }
  }));

  return NextResponse.json({ ok: true, previews: results, pending: failed });
}
