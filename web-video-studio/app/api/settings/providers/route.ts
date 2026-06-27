/**
 * Model Provider settings API.
 *
 * GET  → returns all providers with masked keys and status
 * PATCH → saves per-provider config (enabled, apiKey, baseUrl)
 */

import { NextResponse } from "next/server";
import {
  ALL_PROVIDERS,
  getProviderForModel,
} from "@/lib/model-provider/providers";
import type { ProviderView } from "@/lib/model-provider/types";
import {
  getProviderConfig,
  setProviderConfig,
} from "@/lib/settings-store";

// ─── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  const views: ProviderView[] = ALL_PROVIDERS.map((meta) => {
    const config = getProviderConfig(meta.id);

    const hasApiKey = !!config?.apiKey;
    const enabled = config?.enabled ?? false;
    const customBaseUrl = config?.baseUrl;

    let status: ProviderView["status"];
    if (!enabled) {
      status = "disabled";
    } else if (!meta.requiresAuth || hasApiKey) {
      status = "configured";
    } else {
      status = "not_configured";
    }

    return {
      providerId: meta.id,
      name: meta.name,
      description: meta.description,
      defaultBaseUrl: meta.defaultBaseUrl,
      requiresAuth: meta.requiresAuth,
      models: meta.models,
      enabled,
      hasApiKey,
      apiKeyPreview: hasApiKey
        ? maskKey(config!.apiKey!)
        : "",
      customBaseUrl,
      status,
    };
  });

  return NextResponse.json({ providers: views });
}

// ─── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req: Request) {
  const body = await req.json();

  const { providerId, enabled, apiKey, baseUrl } = body || {};

  if (!providerId || typeof providerId !== "string") {
    return NextResponse.json(
      { error: "providerId is required" },
      { status: 400 },
    );
  }

  // Validate providerId exists in registry
  if (!getProviderForModel) {
    // Check ALL_PROVIDERS directly since getProviderForModel is for model IDs
  }
  const providerExists = ALL_PROVIDERS.some((p) => p.id === providerId);
  if (!providerExists) {
    return NextResponse.json(
      { error: `Unknown provider: ${providerId}` },
      { status: 400 },
    );
  }

  const patch: { enabled?: boolean; apiKey?: string; baseUrl?: string } = {};

  if (enabled !== undefined) {
    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled must be a boolean" },
        { status: 400 },
      );
    }
    patch.enabled = enabled;
  }

  if (apiKey !== undefined) {
    if (typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "apiKey must be a string" },
        { status: 400 },
      );
    }
    patch.apiKey = apiKey;
  }

  if (baseUrl !== undefined) {
    if (typeof baseUrl !== "string") {
      return NextResponse.json(
        { error: "baseUrl must be a string" },
        { status: 400 },
      );
    }
    patch.baseUrl = baseUrl;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 },
    );
  }

  setProviderConfig(providerId, patch);

  return NextResponse.json({ ok: true });
}

// ─── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get("providerId");

  if (!providerId) {
    return NextResponse.json(
      { error: "Missing ?providerId= param" },
      { status: 400 },
    );
  }

  // Reset provider config to defaults (disabled, no key/url)
  setProviderConfig(providerId, {
    enabled: false,
    apiKey: "",
    baseUrl: "",
  });

  return NextResponse.json({ ok: true });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••";
  return key.slice(0, 4) + "••••" + key.slice(-4);
}
