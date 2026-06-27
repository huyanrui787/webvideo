import type { ProviderId, ProviderMeta, ProviderModel } from "./types";

// ─── Provider Registry ─────────────────────────────────────────────────────────
//
// This is the canonical source of truth for all supported AI providers and their
// models. To add a new provider, add an entry here — no DB migration needed.
//
// The AI SDK provider packages are lazy-imported in model-dispatch.ts, so adding
// a provider to this registry does NOT force bundling its SDK.

export const PROVIDER_REGISTRY: Record<ProviderId, ProviderMeta> = {
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 系列模型，擅长复杂推理和代码生成",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    requiresAuth: true,
    models: [
      {
        id: "claude-sonnet-4-6",
        name: "Claude Sonnet 4.6",
        description: "速度与质量均衡，适合日常制作",
        contextWindow: 200_000,
        maxOutputTokens: 131_072,
        supportsToolCalling: true,
        categories: ["both"],
      },
      {
        id: "claude-opus-4-8",
        name: "Claude Opus 4.8",
        description: "最强推理能力，适合复杂内容",
        contextWindow: 200_000,
        maxOutputTokens: 131_072,
        supportsToolCalling: true,
        categories: ["both"],
      },
    ],
  },

  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    description: "高性价比推理模型，V4 系列性能强大",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    requiresAuth: true,
    models: [
      {
        id: "deepseek-v4-pro",
        name: "DeepSeek V4 Pro",
        description: "最新旗舰模型，推理能力强，性价比高",
        contextWindow: 128_000,
        maxOutputTokens: 131_072,
        supportsToolCalling: true,
        categories: ["both"],
      },
      {
        id: "deepseek-v4-flash",
        name: "DeepSeek V4 Flash",
        description: "V4 轻量版，响应速度更快，适合快速迭代",
        contextWindow: 128_000,
        maxOutputTokens: 131_072,
        supportsToolCalling: true,
        categories: ["chat"],
      },
      {
        id: "deepseek-chat",
        name: "DeepSeek V3",
        description: "上一代主力模型，稳定可靠",
        contextWindow: 128_000,
        maxOutputTokens: 131_072,
        supportsToolCalling: true,
        categories: ["chat"],
      },
      {
        id: "deepseek-reasoner",
        name: "DeepSeek R1",
        description: "推理专用模型，适合复杂逻辑任务",
        contextWindow: 128_000,
        maxOutputTokens: 131_072,
        supportsToolCalling: true,
        categories: ["coding"],
      },
    ],
  },

  "openai-compat": {
    id: "openai-compat",
    name: "OpenAI 兼容",
    description: "支持任意 OpenAI API 兼容服务（Ollama / vLLM / 自定义代理等）",
    defaultBaseUrl: "https://api.openai.com/v1",
    requiresAuth: false,
    models: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        description: "OpenAI 旗舰多模态模型",
        contextWindow: 128_000,
        maxOutputTokens: 16_384,
        supportsVision: true,
        supportsToolCalling: true,
        categories: ["both"],
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "轻量快速，适合简单任务",
        contextWindow: 128_000,
        maxOutputTokens: 16_384,
        supportsToolCalling: true,
        categories: ["chat"],
      },
    ],
  },
};

// ─── Derived Views ─────────────────────────────────────────────────────────────

export const ALL_PROVIDERS: ProviderMeta[] = Object.values(PROVIDER_REGISTRY);

export const ALL_MODELS: ProviderModel[] = ALL_PROVIDERS.flatMap(
  (p) => p.models,
);

/** Map from model ID → parent ProviderMeta for O(1) lookup. */
export const MODEL_PROVIDER_MAP: Map<string, ProviderMeta> = new Map();
for (const provider of ALL_PROVIDERS) {
  for (const model of provider.models) {
    MODEL_PROVIDER_MAP.set(model.id, provider);
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve a model ID to its parent ProviderMeta. */
export function getProviderForModel(modelId: string): ProviderMeta | undefined {
  return MODEL_PROVIDER_MAP.get(modelId);
}

/** All model IDs known to the registry. */
export function getAllModelIds(): string[] {
  return ALL_MODELS.map((m) => m.id);
}

/** Models suitable for a given role. */
export function getModelsForCategory(
  category: "chat" | "coding",
): ProviderModel[] {
  return ALL_MODELS.filter((m) => m.categories.includes(category) || m.categories.includes("both"));
}
