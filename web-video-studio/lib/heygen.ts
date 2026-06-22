/**
 * HeyGen API client — server-side only.
 * Handles asset upload, photo avatar creation, video generation, and polling.
 */

import fs from "fs";

const BASE = "https://api.heygen.com";
const UPLOAD_BASE = "https://upload.heygen.com";

function apiKey(): string {
  const k = process.env.HEYGEN_API_KEY;
  if (!k) throw new Error("HEYGEN_API_KEY not set");
  return k;
}

// ─── Asset upload ─────────────────────────────────────────────────────────────

export async function uploadAsset(
  filePath: string,
  mimeType: string
): Promise<{ assetId: string; url: string }> {
  const buf = fs.readFileSync(filePath);
  const res = await fetch(`${UPLOAD_BASE}/v1/asset`, {
    method: "POST",
    headers: { "X-Api-Key": apiKey(), "Content-Type": mimeType },
    body: buf,
  });
  const json = await res.json() as { code: number; data: { id: string; url: string } };
  if (json.code !== 100) throw new Error(`HeyGen upload failed: ${JSON.stringify(json)}`);
  return { assetId: json.data.id, url: json.data.url };
}

// ─── Photo avatar ─────────────────────────────────────────────────────────────

export async function createPhotoAvatar(
  assetId: string,
  name = "Studio Avatar"
): Promise<{ groupId: string; lookId: string }> {
  const res = await fetch(`${BASE}/v3/avatars`, {
    method: "POST",
    headers: { "X-Api-Key": apiKey(), "Content-Type": "application/json" },
    body: JSON.stringify({ type: "photo", name, file: { type: "asset_id", asset_id: assetId } }),
  });
  const json = await res.json() as {
    data: { avatar_group: { id: string }; avatar_item: { id: string } };
  };
  return { groupId: json.data.avatar_group.id, lookId: json.data.avatar_item.id };
}

export async function getAvatarStatus(
  lookId: string
): Promise<"processing" | "ready" | "failed"> {
  const res = await fetch(`${BASE}/v3/avatars`, {
    headers: { "X-Api-Key": apiKey() },
  });
  const json = await res.json() as { data: Array<{ id: string; preview_image_url?: string }> };
  const groups = json.data ?? [];
  // Check if any group's looks contain our lookId — if preview exists it's ready
  for (const g of groups) {
    if (g.id) {
      const looksRes = await fetch(`${BASE}/v3/avatars/${g.id}/looks`, {
        headers: { "X-Api-Key": apiKey() },
      }).catch(() => null);
      if (!looksRes?.ok) continue;
      const looksJson = await looksRes.json() as { data?: Array<{ id: string; status?: string; preview_image_url?: string }> };
      const look = (looksJson.data ?? []).find((l) => l.id === lookId);
      if (look) {
        if (look.preview_image_url) return "ready";
        if (look.status === "failed") return "failed";
        return "processing";
      }
    }
  }
  // Fallback: treat as ready if avatar was just created (preview_image_url on group)
  const topLevel = groups.find((g) => g.id && g.preview_image_url);
  if (topLevel) return "ready";
  return "processing";
}

// ─── Video generation ─────────────────────────────────────────────────────────

export async function generateAvatarVideo(
  lookId: string,
  audioAssetId: string,
  dimension = { width: 720, height: 720 }
): Promise<string> {
  const res = await fetch(`${BASE}/v2/video/generate`, {
    method: "POST",
    headers: { "X-Api-Key": apiKey(), "Content-Type": "application/json" },
    body: JSON.stringify({
      video_inputs: [{
        character: { type: "avatar", avatar_id: lookId, avatar_style: "normal" },
        voice: { type: "audio", audio_asset_id: audioAssetId },
      }],
      dimension,
    }),
  });
  const json = await res.json() as { error: unknown; data: { video_id: string } };
  if (json.error) throw new Error(`HeyGen generate failed: ${JSON.stringify(json.error)}`);
  return json.data.video_id;
}

export async function getVideoStatus(videoId: string): Promise<{
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}> {
  const res = await fetch(`${BASE}/v1/video_status.get?video_id=${videoId}`, {
    headers: { "X-Api-Key": apiKey() },
  });
  const json = await res.json() as {
    data: { status: string; video_url?: string; error?: { message?: string } };
  };
  const d = json.data;
  return {
    status: d.status as "pending" | "processing" | "completed" | "failed",
    videoUrl: d.video_url,
    error: d.error?.message,
  };
}

// ─── Download video ───────────────────────────────────────────────────────────

export async function downloadVideo(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(require("path").dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buf);
}
