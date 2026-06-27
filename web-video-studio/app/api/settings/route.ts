import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUserId } from "@/lib/api-helpers";
import type { PreferredModel, PreferredTtsProvider } from "@/lib/db/schema";
import { listAllSkills, MAIN_SKILL_ID } from "@/lib/skills";
import { getAllModelIds } from "@/lib/model-provider/providers";
import type { ProviderView } from "@/lib/model-provider/types";
import { ALL_PROVIDERS } from "@/lib/model-provider/providers";
import { getProviderConfig } from "@/lib/settings-store";

const ALLOWED_TTS_PROVIDERS: PreferredTtsProvider[] = ["minimax", "openai"];

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db
    .select({
      preferredModel: users.preferredModel,
      preferredCodingModel: users.preferredCodingModel,
      workflowMode: users.workflowMode,
      illustrationsEnabled: users.illustrationsEnabled,
      preferredTtsProvider: users.preferredTtsProvider,
      preferredTtsVoice: users.preferredTtsVoice,
      enabledSkills: users.enabledSkills,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let enabledSkills: string[] = [];
  try {
    const parsed = JSON.parse(user.enabledSkills ?? "[]");
    if (Array.isArray(parsed)) enabledSkills = parsed.filter((x): x is string => typeof x === "string");
  } catch { /* ignore */ }
  // Main skill is always on
  if (!enabledSkills.includes(MAIN_SKILL_ID)) enabledSkills.push(MAIN_SKILL_ID);

  // Build provider views for the unified "model provider" settings tab
  const providerViews: ProviderView[] = ALL_PROVIDERS.map((meta) => {
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
        ? maskApiKey(config!.apiKey!)
        : "",
      customBaseUrl,
      status,
    };
  });

  return NextResponse.json({
    preferredModel: user.preferredModel,
    preferredCodingModel: user.preferredCodingModel ?? "claude-sonnet-4-6",
    workflowMode: user.workflowMode ?? "quick",
    illustrationsEnabled: user.illustrationsEnabled !== "false",
    preferredTtsProvider: user.preferredTtsProvider ?? "minimax",
    preferredTtsVoice: user.preferredTtsVoice ?? null,
    enabledSkills,
    providerViews,
  });
}

export async function PATCH(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = { updatedAt: Math.floor(Date.now() / 1000) };

  if (body?.preferredModel !== undefined) {
    const validModelIds = getAllModelIds();
    if (!validModelIds.includes(body.preferredModel)) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }
    updates.preferredModel = body.preferredModel;
  }

  if (body?.preferredCodingModel !== undefined) {
    const validModelIds = getAllModelIds();
    if (!validModelIds.includes(body.preferredCodingModel)) {
      return NextResponse.json({ error: "Invalid coding model" }, { status: 400 });
    }
    updates.preferredCodingModel = body.preferredCodingModel;
  }

  if (body?.preferredTtsProvider !== undefined) {
    if (!ALLOWED_TTS_PROVIDERS.includes(body.preferredTtsProvider)) {
      return NextResponse.json({ error: "Invalid TTS provider" }, { status: 400 });
    }
    updates.preferredTtsProvider = body.preferredTtsProvider;
  }

  if (body?.workflowMode !== undefined) {
    if (!["quick", "detailed"].includes(body.workflowMode)) {
      return NextResponse.json({ error: "Invalid workflow mode" }, { status: 400 });
    }
    updates.workflowMode = body.workflowMode;
  }

  if (body?.illustrationsEnabled !== undefined) {
    updates.illustrationsEnabled = body.illustrationsEnabled ? "true" : "false";
  }

  if (body?.preferredTtsVoice !== undefined) {
    updates.preferredTtsVoice = body.preferredTtsVoice;
  }

  if (body?.enabledSkills !== undefined) {
    if (!Array.isArray(body.enabledSkills)) {
      return NextResponse.json({ error: "enabledSkills must be an array" }, { status: 400 });
    }
    // Whitelist: every id must be a real skill on disk
    const validIds = new Set(listAllSkills().map((s) => s.id));
    const filtered = body.enabledSkills.filter(
      (x: unknown): x is string => typeof x === "string" && validIds.has(x)
    );
    // Main skill can never be disabled
    if (!filtered.includes(MAIN_SKILL_ID)) filtered.push(MAIN_SKILL_ID);
    updates.enabledSkills = JSON.stringify(Array.from(new Set(filtered)));
  }

  if (body?.defaultStylePreset !== undefined) {
    updates.defaultStylePreset = body.defaultStylePreset;
  }

  await db.update(users).set(updates).where(eq(users.id, userId));

  return NextResponse.json({ ok: true });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••";
  return key.slice(0, 4) + "••••" + key.slice(-4);
}
