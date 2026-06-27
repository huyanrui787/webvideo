// ─── Provider Identity ─────────────────────────────────────────────────────────

export type ProviderId = "anthropic" | "deepseek" | "openai-compat";

// ─── Static Metadata (defined once in providers.ts, never in DB) ──────────────

/** A model that a provider offers. */
export interface ProviderModel {
  id: string; // e.g. "claude-sonnet-4-6"
  name: string; // display name, e.g. "Claude Sonnet 4.6"
  description: string; // one-liner Chinese description
  contextWindow: number;
  maxOutputTokens: number;
  supportsVision?: boolean;
  supportsToolCalling?: boolean;
  /** Which agent role(s) this model is suitable for. */
  categories: ("chat" | "coding" | "both")[];
}

/** Static, developer-defined metadata for a single provider. */
export interface ProviderMeta {
  id: ProviderId;
  name: string; // e.g. "Anthropic"
  description: string; // one-liner Chinese description
  /** Default API endpoint (used when user hasn't set a custom base URL). */
  defaultBaseUrl: string;
  /** Whether this provider requires an API key. False for local Ollama etc. */
  requiresAuth: boolean;
  /** Models available from this provider. */
  models: ProviderModel[];
}

// ─── Runtime Config (user-specific, persisted in settings-store) ───────────────

/** Per-provider configuration set by the user. */
export interface ProviderConfig {
  enabled: boolean;
  apiKey?: string; // encrypted at rest via Electron safeStorage
  baseUrl?: string; // custom override
}

// ─── Combined View (returned to the frontend) ──────────────────────────────────

export type ProviderStatus = "not_configured" | "configured" | "disabled";

/** Merged provider metadata + user config, sent to the settings UI. */
export interface ProviderView {
  providerId: ProviderId;
  name: string;
  description: string;
  defaultBaseUrl: string;
  requiresAuth: boolean;
  models: ProviderModel[];
  /** User config. */
  enabled: boolean;
  hasApiKey: boolean;
  apiKeyPreview: string; // masked preview, e.g. "sk-a••••b12c"
  customBaseUrl?: string;
  /** Derived status for the UI. */
  status: ProviderStatus;
}
