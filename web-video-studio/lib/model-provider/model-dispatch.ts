/**
 * Centralized model dispatch.
 *
 * Every route that needs an AI model calls `getModel(modelId)`. This function:
 * 1. Resolves the model ID → provider
 * 2. Reads the user's provider config (custom base URL, API key)
 * 3. Instantiates the correct AI SDK language model
 *
 * This replaces the ad-hoc `getModel()` functions scattered across route files.
 */

import { PROVIDER_REGISTRY, getProviderForModel } from "./providers";
import { getProviderConfig } from "@/lib/settings-store";

// ── Lazy SDK imports ───────────────────────────────────────────────────────────
// Only the SDKs that are actually called will be bundled into a route.

import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { deepseek as deepseekProvider } from "@ai-sdk/deepseek";
import { createOpenAI } from "@ai-sdk/openai";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build a standardized env-var key for a provider's API key. */
function envApiKey(providerId: string): string | undefined {
  switch (providerId) {
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    case "deepseek":
      return process.env.DEEPSEEK_API_KEY;
    case "openai-compat":
      return process.env.OPENAI_API_KEY;
    default:
      return undefined;
  }
}

/** Build a standardized env-var key for a provider's base URL. */
function envBaseUrl(providerId: string): string | undefined {
  switch (providerId) {
    case "anthropic":
      return process.env.ANTHROPIC_BASE_URL;
    case "deepseek":
      return undefined; // DeepSeek SDK doesn't support custom base URL easily
    case "openai-compat":
      return process.env.OPENAI_BASE_URL;
    default:
      return undefined;
  }
}

// ── Dispatch ───────────────────────────────────────────────────────────────────

/**
 * Get a ready-to-use AI SDK language model for the given model ID.
 *
 * Uses the provider registry to determine the correct SDK provider, then
 * reads user-configured custom base URL and API key from the settings store (with
 * env-var fallback).
 */
export function getModel(modelId: string) {
  const provider = getProviderForModel(modelId);

  if (!provider) {
    // Fallback: try prefix matching for unknown model IDs
    if (modelId.startsWith("claude-")) {
      return anthropic(modelId);
    }
    if (modelId.startsWith("deepseek-")) {
      return deepseekProvider(modelId);
    }
    // Last resort — default to DeepSeek
    return deepseekProvider(modelId);
  }

  const config = getProviderConfig(provider.id);

  switch (provider.id) {
    case "anthropic": {
      const apiKey =
        config?.apiKey || envApiKey("anthropic");
      const baseURL =
        config?.baseUrl || envBaseUrl("anthropic") || provider.defaultBaseUrl;

      if (baseURL !== provider.defaultBaseUrl || apiKey) {
        return createAnthropic({
          baseURL,
          apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
          // Let undefined pass through if neither is set — SDK uses env var
        })(modelId);
      }
      // Use default SDK instance (reads ANTHROPIC_API_KEY from env)
      return anthropic(modelId);
    }

    case "deepseek": {
      // DeepSeek SDK handles env var (DEEPSEEK_API_KEY) automatically
      return deepseekProvider(modelId);
    }

    case "openai-compat": {
      const apiKey =
        config?.apiKey || envApiKey("openai-compat") || "not-needed";
      const baseURL =
        config?.baseUrl || envBaseUrl("openai-compat") || provider.defaultBaseUrl;

      const openai = createOpenAI({
        baseURL,
        apiKey,
      });
      return openai.chat(modelId);
    }

    default:
      // Exhaustive switch — fallback to DeepSeek for safety
      return deepseekProvider(modelId);
  }
}

// ── Feature detection ──────────────────────────────────────────────────────────

/**
 * Whether the given model supports tool-invocation content blocks in message
 * history. DeepSeek models currently error when tool-invocation parts are included.
 */
export function modelSupportsToolHistory(modelId: string): boolean {
  if (modelId.startsWith("deepseek-")) return false;
  return true;
}
