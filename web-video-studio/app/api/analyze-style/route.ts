/**
 * POST /api/analyze-style
 *
 * Accept an image upload, analyze it to extract structured style description.
 * Tries multiple vision models in order until one succeeds.
 */
import { NextResponse } from "next/server";

const VISION_MODELS = [
  { model: "gpt-4o-mini", stream: false },
  { model: "gemini-2.5-flash", stream: false },
  { model: "gpt-4-vision-preview", stream: false },
];

const ANALYSIS_SYSTEM_PROMPT = `You are a style analyst for illustration generation.
Analyze the uploaded reference image and output a structured style description in JSON format.

Return ONLY valid JSON, no markdown, no explanation:
{
  "visualDna": "A concise 3-5 sentence description of the visual style: background color/texture, line style, color palette, shading technique, overall aesthetic mood.",
  "characterDescription": "A 2-3 sentence description of the main character or subject's visual traits: body shape, facial features, posture, how they relate to the environment.",
  "tags": ["tag1", "tag2", "tag3"],
  "bestPreset": "Which built-in preset this image is closest to (xiaobei/shuicai/flat/cyber/storybook), or 'custom' if none fits."
}`;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const reference = (formData.get("reference") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const b64 = buffer.toString("base64");
    const mime = file.type || "image/png";
    const dataUrl = `data:${mime};base64,${b64}`;

    const key = process.env.GPT_IMAGE_KEY;
    const baseUrl = process.env.GPT_IMAGE_BASE_URL ?? "https://qqqapi.com";

    if (!key) {
      return NextResponse.json({ error: "No API key configured" }, { status: 500 });
    }

    const userMessage = reference
      ? `Analyze this image for illustration style and character description. Additional context: ${reference}`
      : "Analyze this image for illustration style and character description.";

    // Try each model in order
    const errors: string[] = [];
    for (const { model, stream } of VISION_MODELS) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);
        const res = await fetch(`${baseUrl}/v1/chat/completions`, {
          signal: controller.signal,
          method: "POST",
          headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            stream,
            messages: [
              { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
              {
                role: "user",
                content: [
                  { type: "text", text: userMessage },
                  { type: "image_url", image_url: { url: dataUrl } },
                ],
              },
            ],
            max_tokens: 1000,
          }),
        });
        clearTimeout(timeout);

        if (!res.ok) {
          const text = await res.text();
          errors.push(`${model}: ${res.status} ${text.slice(0, 100)}`);
          continue;
        }

        // Try JSON first, fallback to SSE parsing
        const rawText = await res.text();
        let content = "";
        try {
          const json = JSON.parse(rawText);
          content = json?.choices?.[0]?.message?.content ?? "";
        } catch {
          // SSE format: parse data: lines
          for (const line of rawText.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const chunk = line.slice(6).trim();
            if (chunk === "[DONE]") continue;
            try {
              const d = JSON.parse(chunk);
              const delta = d?.choices?.[0]?.delta?.content ?? d?.choices?.[0]?.message?.content ?? "";
              if (delta) content += delta;
            } catch {}
          }
        }

        if (!content) {
          errors.push(`${model}: empty response`);
          continue;
        }

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          errors.push(`${model}: no JSON in response (${content.slice(0, 100)})`);
          continue;
        }

        const analysis = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ ok: true, model, ...analysis });
      } catch (err) {
        errors.push(`${model}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // All models failed
    return NextResponse.json({
      error: `All vision models failed: ${errors.join("; ")}`,
    }, { status: 500 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
