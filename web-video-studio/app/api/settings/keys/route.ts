/**
 * API Keys settings — stored server-side in the encrypted settings store.
 *
 * GET  → returns which keys are configured (masked values) and their current status
 * PATCH → saves one or more API keys
 * DELETE → removes a specific key
 */

import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings-store";

const KEY_FIELDS = [
  "anthropic",
  "heygen",
  "fal",
  "dashscope",
  "deepseek",
  "gptImage",
  "stripe",
] as const;

const ENDPOINT_FIELDS = [
  "anthropicBaseUrl",
  "buildAnthropicBaseUrl",
  "gptImageBaseUrl",
] as const;

export async function GET() {
  const settings = getSettings();
  const { apiKeys, endpoints } = settings;

  // Return which keys are configured (masked for security)
  const keys: Record<string, { configured: boolean; preview: string }> = {};
  for (const k of KEY_FIELDS) {
    const val = (apiKeys as Record<string, string | undefined>)[k];
    keys[k] = {
      configured: !!val,
      preview: val ? maskKey(val) : "",
    };
  }

  return NextResponse.json({
    keys,
    endpoints,
  });
}

export async function PATCH(req: Request) {
  const body = await req.json();

  const apiKeyUpdates: Record<string, string> = {};
  const endpointUpdates: Record<string, string> = {};

  // Validate and collect API key updates
  for (const k of KEY_FIELDS) {
    if (body[k] !== undefined) {
      if (typeof body[k] !== "string") {
        return NextResponse.json(
          { error: `${k} must be a string` },
          { status: 400 }
        );
      }
      apiKeyUpdates[k] = body[k];
    }
  }

  // Validate and collect endpoint updates
  for (const k of ENDPOINT_FIELDS) {
    if (body[k] !== undefined) {
      if (typeof body[k] !== "string") {
        return NextResponse.json(
          { error: `${k} must be a string` },
          { status: 400 }
        );
      }
      endpointUpdates[k] = body[k];
    }
  }

  // Apply updates
  const current = getSettings();
  const updatedKeys = { ...current.apiKeys, ...apiKeyUpdates };
  const updatedEndpoints = { ...current.endpoints, ...endpointUpdates };

  updateSettings({
    apiKeys: updatedKeys,
    endpoints: updatedEndpoints,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Missing ?key= param" }, { status: 400 });
  }

  const current = getSettings();
  const updatedKeys = { ...current.apiKeys };
  delete (updatedKeys as Record<string, string | undefined>)[key];

  updateSettings({ apiKeys: updatedKeys });

  return NextResponse.json({ ok: true });
}

// ── Helpers ────────────────────────────────────────────────────────────────

function maskKey(key: string): string {
  if (key.length <= 8) return "••••";
  return key.slice(0, 4) + "••••" + key.slice(-4);
}
