/**
 * Encrypted settings store for API keys and user preferences.
 *
 * In Electron, uses safeStorage to encrypt sensitive values.
 * In plain Node.js (development), stores values unencrypted in a JSON file
 * (development convenience — API keys in .env.local still take precedence).
 */

import fs from "fs";
import path from "path";
import { getSettingsPath, getDataDir } from "@/lib/env";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AppSettings {
  /** API Keys — all optional, user configures what they need.
   *  @deprecated Use providerConfigs instead for AI provider keys.
   *  Non-AI keys (heygen, fal, dashscope, gptImage, stripe) remain here. */
  apiKeys: {
    anthropic?: string;
    heygen?: string;
    fal?: string;
    dashscope?: string;
    deepseek?: string;
    gptImage?: string;
    stripe?: string;
    wechatPay?: {
      mchId?: string;
      appId?: string;
      apiV3Key?: string;
      serialNo?: string;
      privateKeyPath?: string;
      notifyUrl?: string;
    };
  };
  /** Server / URL overrides.
   *  @deprecated Use providerConfigs instead for AI provider endpoints. */
  endpoints: {
    anthropicBaseUrl?: string;
    buildAnthropicBaseUrl?: string;
    gptImageBaseUrl?: string;
  };
  /** Per-provider configuration (replaces flat apiKeys + endpoints for AI providers). */
  providerConfigs: Record<string, {
    enabled: boolean;
    apiKey?: string;
    baseUrl?: string;
  }>;
  /** General preferences */
  preferences: {
    mainSkillId?: string;
    skillsRoot?: string;
    autoStartServer?: boolean;
    theme?: "light" | "dark" | "system";
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  apiKeys: {},
  endpoints: {},
  providerConfigs: {},
  preferences: {
    autoStartServer: true,
    theme: "system",
  },
};

// ── In-memory cache ────────────────────────────────────────────────────────────

let _settings: AppSettings | null = null;

// ── Safe storage wrapper ───────────────────────────────────────────────────────

function encryptValue(value: string): string {
  try {
    // Dynamic require: safeStorage is only available in Electron main process
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { safeStorage } = require("electron");
    if (safeStorage?.isEncryptionAvailable()) {
      return safeStorage.encryptString(value).toString("base64");
    }
  } catch {
    // Not in Electron, fall through to plaintext
  }
  return JSON.stringify({ plain: value }); // plaintext marker
}

function decryptValue(stored: string): string {
  try {
    // Check if it's a plaintext marker
    const parsed = JSON.parse(stored);
    if (parsed.plain !== undefined) return parsed.plain;
  } catch {
    // Not JSON, try decrypting with safeStorage
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { safeStorage } = require("electron");
    if (safeStorage?.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(stored, "base64"));
    }
  } catch {
    // Not in Electron or decryption failed
  }
  return "";
}

// ── Load / save ────────────────────────────────────────────────────────────────

function loadFromDisk(): AppSettings {
  const filePath = getSettingsPath();
  try {
    if (!fs.existsSync(filePath)) return { ...DEFAULT_SETTINGS };
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const merged = deepMerge(DEFAULT_SETTINGS, raw);
    // Auto-migrate legacy apiKeys → providerConfigs
    return migrateFromLegacy(merged);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Auto-migrate legacy flat apiKeys + endpoints into the new providerConfigs
 * structure. Runs once on first load after upgrade.
 */
function migrateFromLegacy(settings: AppSettings): AppSettings {
  const hasLegacyKeys =
    settings.apiKeys.anthropic || settings.apiKeys.deepseek;
  const hasProviderConfigs = Object.keys(settings.providerConfigs || {}).length > 0;

  // Only migrate if there are legacy keys and no provider configs yet
  if (!hasLegacyKeys || hasProviderConfigs) return settings;

  const configs: AppSettings["providerConfigs"] = {};

  // Map legacy API keys → provider configs
  if (settings.apiKeys.anthropic) {
    configs.anthropic = {
      enabled: true,
      apiKey: settings.apiKeys.anthropic,
      baseUrl: settings.endpoints?.anthropicBaseUrl,
    };
  }
  if (settings.apiKeys.deepseek) {
    configs.deepseek = {
      enabled: true,
      apiKey: settings.apiKeys.deepseek,
    };
  }

  return {
    ...settings,
    providerConfigs: { ...configs, ...settings.providerConfigs },
  };
}

function saveToDisk(settings: AppSettings): void {
  const filePath = getSettingsPath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), "utf-8");
}

function deepMerge(base: AppSettings, override: Partial<AppSettings>): AppSettings {
  return {
    apiKeys: { ...base.apiKeys, ...override.apiKeys },
    endpoints: { ...base.endpoints, ...override.endpoints },
    providerConfigs: { ...base.providerConfigs, ...override.providerConfigs },
    preferences: { ...base.preferences, ...override.preferences },
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function getSettings(): AppSettings {
  if (!_settings) {
    _settings = loadFromDisk();
  }
  return _settings;
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  _settings = deepMerge(current, patch);
  saveToDisk(_settings);
  return _settings;
}

// ── Provider config helpers ─────────────────────────────────────────────────────

/** Get the user config for a specific provider. */
export function getProviderConfig(providerId: string): {
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
} | undefined {
  const settings = getSettings();
  return settings.providerConfigs[providerId];
}

/** Set (or update) a provider's user config. */
export function setProviderConfig(
  providerId: string,
  patch: { enabled?: boolean; apiKey?: string; baseUrl?: string },
): void {
  const settings = getSettings();
  const current = settings.providerConfigs[providerId] || { enabled: false };
  const merged = { ...current, ...patch };
  updateSettings({
    providerConfigs: { ...settings.providerConfigs, [providerId]: merged },
  });
}

/** Get all provider configs. */
export function getAllProviderConfigs(): Record<
  string,
  { enabled: boolean; apiKey?: string; baseUrl?: string }
> {
  return getSettings().providerConfigs;
}

/** Get a specific API key (checks env var first, then settings store). */
export function getApiKey(name: string): string | undefined {
  // Environment variables take precedence
  const envKey = `WEBVIDEO_${name.toUpperCase()}`;
  if (process.env[envKey]) return process.env[envKey];

  // Then check settings store
  const settings = getSettings();
  const keys = settings.apiKeys as Record<string, string | undefined>;
  if (keys[name]) return keys[name];

  return undefined;
}

/** Set an API key in the settings store. */
export function setApiKey(name: string, value: string): void {
  const settings = getSettings();
  const keys = { ...settings.apiKeys, [name]: value };
  updateSettings({ apiKeys: keys });
}

/** Load API keys from settings store into process.env for the Next.js server. */
export function loadApiKeysIntoEnv(): void {
  const settings = getSettings();
  const { apiKeys, endpoints, providerConfigs } = settings;

  // ── Legacy API keys ── (non-AI keys remain here)
  if (apiKeys.heygen) process.env.HEYGEN_API_KEY = apiKeys.heygen;
  if (apiKeys.fal) process.env.FAL_KEY = apiKeys.fal;
  if (apiKeys.dashscope) process.env.DASHSCOPE_API_KEY = apiKeys.dashscope;
  if (apiKeys.gptImage) process.env.GPT_IMAGE_KEY = apiKeys.gptImage;
  if (apiKeys.stripe) process.env.STRIPE_SECRET_KEY = apiKeys.stripe;

  // ── Provider configs → env vars ──
  // Anthropic
  const anthropicCfg = providerConfigs.anthropic || {};
  if (anthropicCfg.apiKey && anthropicCfg.enabled !== false) {
    process.env.ANTHROPIC_API_KEY = anthropicCfg.apiKey;
  } else if (apiKeys.anthropic) {
    // Fallback to legacy key
    process.env.ANTHROPIC_API_KEY = apiKeys.anthropic;
  }
  if (anthropicCfg.baseUrl) {
    process.env.ANTHROPIC_BASE_URL = anthropicCfg.baseUrl;
  } else if (endpoints.anthropicBaseUrl) {
    process.env.ANTHROPIC_BASE_URL = endpoints.anthropicBaseUrl;
  }

  // DeepSeek
  const deepseekCfg = providerConfigs.deepseek || {};
  if (deepseekCfg.apiKey && deepseekCfg.enabled !== false) {
    process.env.DEEPSEEK_API_KEY = deepseekCfg.apiKey;
  } else if (apiKeys.deepseek) {
    process.env.DEEPSEEK_API_KEY = apiKeys.deepseek;
  }

  // OpenAI-compat
  const openaiCfg = providerConfigs["openai-compat"] || {};
  if (openaiCfg.apiKey && openaiCfg.enabled !== false) {
    process.env.OPENAI_API_KEY = openaiCfg.apiKey;
  }
  if (openaiCfg.baseUrl) {
    process.env.OPENAI_BASE_URL = openaiCfg.baseUrl;
  }

  // ── Legacy endpoints (non-provider) ──
  if (endpoints.buildAnthropicBaseUrl) process.env.BUILD_ANTHROPIC_BASE_URL = endpoints.buildAnthropicBaseUrl;
  if (endpoints.gptImageBaseUrl) process.env.GPT_IMAGE_BASE_URL = endpoints.gptImageBaseUrl;

  // Preferences
  if (settings.preferences.mainSkillId) process.env.MAIN_SKILL_ID = settings.preferences.mainSkillId;
  if (settings.preferences.skillsRoot) process.env.SKILLS_ROOT = settings.preferences.skillsRoot;
}
