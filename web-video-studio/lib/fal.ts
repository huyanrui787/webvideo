/**
 * fal.ai client — server-side only.
 * Wraps Kling LipSync (photo + audio → video) and image generation.
 */

import { fal } from "@fal-ai/client";

function configure() {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY not set");
  fal.config({ credentials: key });
}

export interface LipSyncInput {
  /** Public URL of the portrait photo (jpeg/png) */
  imageUrl: string;
  /** Public URL of the audio file (mp3/wav) */
  audioUrl: string;
}

export interface LipSyncResult {
  videoUrl: string;
  durationSec?: number;
}

/**
 * Generate a lip-synced talking head video from a photo + audio.
 * Uses Kling LipSync (fal-ai/kling-video/lipsync/audio-to-video).
 * Falls back to MuseTalk if Kling is unavailable.
 */
export async function generateLipSync(input: LipSyncInput): Promise<LipSyncResult> {
  configure();

  const result = await fal.subscribe("fal-ai/kling-video/lipsync/audio-to-video", {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: {
      image_url: input.imageUrl,
      audio_url: input.audioUrl,
    } as any,
    pollInterval: 5000,
    timeout: 600_000,
  }) as { video?: { url: string }; video_url?: string };

  const videoUrl = result.video?.url ?? result.video_url;
  if (!videoUrl) throw new Error("fal.ai returned no video URL");

  return { videoUrl };
}

/**
 * Upload a file to fal.ai storage and return a public URL.
 * Required because fal.ai models need publicly accessible URLs.
 */
export async function uploadToFal(filePath: string, mimeType: string): Promise<string> {
  configure();
  const fs = await import("fs");
  const blob = new Blob([fs.readFileSync(filePath)], { type: mimeType });
  const file = new File([blob], filePath.split("/").pop()!, { type: mimeType });
  const url = await fal.storage.upload(file);
  return url;
}

// ─── Text-to-image (gpt-image-2 via proxy) ───────────────────────────────────

export interface GenerateImageInput {
  prompt: string;
}

export interface GenerateImageResult {
  /** Raw PNG buffer — write directly to disk, no second fetch needed. */
  buffer: Buffer;
}

/**
 * Generate a 1024×1024 image via gpt-image-2 through a third-party proxy.
 * Returns raw PNG bytes as a Buffer.
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageResult> {
  const key = process.env.GPT_IMAGE_KEY;
  const baseUrl = process.env.GPT_IMAGE_BASE_URL ?? "https://api.openai.com";
  if (!key) throw new Error("GPT_IMAGE_KEY not set");

  const res = await fetch(`${baseUrl}/v1/images/generations`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt: input.prompt,
      size: "1024x1024",
      response_format: "b64_json",
      n: 1,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`gpt-image-2 failed ${res.status}: ${text}`);
  }

  const data = await res.json() as { data?: Array<{ b64_json?: string }> };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error(`gpt-image-2 returned no image: ${JSON.stringify(data)}`);

  return { buffer: Buffer.from(b64, "base64") };
}
