"use client";

import { useEffect, useState } from "react";
import type { ProviderView, ProviderModel } from "@/lib/model-provider/types";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SettingsData {
  preferredModel: string;
  preferredCodingModel: string;
  providerViews: ProviderView[];
}

type SavingTarget =
  | { kind: "preferredModel"; value: string }
  | { kind: "preferredCodingModel"; value: string }
  | { kind: "provider"; providerId: string };

// ── Icons ──────────────────────────────────────────────────────────────────────

const IconProvider = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="3.5" width="17" height="13" rx="2" />
    <line x1="5.5" y1="1.5" x2="5.5" y2="5" />
    <line x1="14.5" y1="1.5" x2="14.5" y2="5" />
    <circle cx="10" cy="10" r="2" />
    <line x1="10" y1="7.5" x2="10" y2="8.5" />
  </svg>
);

const IconCheck = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,7 5.5,10.5 12,3.5" />
  </svg>
);

const IconChevronDown = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,5.5 7,9.5 11,5.5" />
  </svg>
);

const IconChevronUp = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,8.5 7,4.5 11,8.5" />
  </svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────────

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••";
  return key.slice(0, 4) + "••••" + key.slice(-4);
}

function statusBadge(status: ProviderView["status"]) {
  switch (status) {
    case "configured":
      return (
        <span className="inline-flex items-center gap-1 text-xs text-green-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          已配置
        </span>
      );
    case "disabled":
      return (
        <span className="inline-flex items-center gap-1 text-xs text-t4">
          <span className="w-1.5 h-1.5 rounded-full bg-t4" />
          已禁用
        </span>
      );
    case "not_configured":
      return (
        <span className="inline-flex items-center gap-1 text-xs text-amber-500">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          未配置
        </span>
      );
  }
}

// ── RadioDot ───────────────────────────────────────────────────────────────────

function RadioDot({ active }: { active: boolean }) {
  return (
    <span
      className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
        active ? "border-brand-text" : "border-bd-strong"
      }`}
    >
      {active && <span className="w-2 h-2 rounded-full bg-brand" />}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ProviderSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Data from API
  const [providers, setProviders] = useState<ProviderView[]>([]);
  const [preferredModel, setPreferredModel] = useState("deepseek-v4-pro");
  const [savedPreferredModel, setSavedPreferredModel] = useState("deepseek-v4-pro");
  const [preferredCodingModel, setPreferredCodingModel] = useState("claude-sonnet-4-6");
  const [savedPreferredCodingModel, setSavedPreferredCodingModel] = useState("claude-sonnet-4-6");

  // UI state
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<SavingTarget | null>(null);

  // Per-provider form state
  const [formEnabled, setFormEnabled] = useState<Record<string, boolean>>({});
  const [formApiKey, setFormApiKey] = useState<Record<string, string>>({});
  const [formBaseUrl, setFormBaseUrl] = useState<Record<string, string>>({});

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SettingsData | null) => {
        if (data) {
          setPreferredModel(data.preferredModel);
          setSavedPreferredModel(data.preferredModel);
          setPreferredCodingModel(data.preferredCodingModel);
          setSavedPreferredCodingModel(data.preferredCodingModel);
          setProviders(data.providerViews || []);

          // Init form state from provider configs
          const enabled: Record<string, boolean> = {};
          const apiKeys: Record<string, string> = {};
          const urls: Record<string, string> = {};
          for (const pv of data.providerViews) {
            enabled[pv.providerId] = pv.enabled;
            apiKeys[pv.providerId] = "";
            urls[pv.providerId] = pv.customBaseUrl || "";
          }
          setFormEnabled(enabled);
          setFormApiKey(apiKeys);
          setFormBaseUrl(urls);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Get models for a category across all enabled & configured providers ────

  function getAvailableModels(category: "chat" | "coding"): ProviderModel[] {
    const models: ProviderModel[] = [];
    for (const pv of providers) {
      if (!pv.enabled) continue;
      if (pv.requiresAuth && !pv.hasApiKey) continue;
      for (const m of pv.models) {
        if (m.categories.includes(category) || m.categories.includes("both")) {
          models.push(m);
        }
      }
    }
    return models;
  }

  // ── Save handlers ──────────────────────────────────────────────────────────

  async function saveModel(kind: "preferredModel" | "preferredCodingModel", value: string) {
    setSaving({ kind, value });
    try {
      const body = kind === "preferredModel"
        ? { preferredModel: value }
        : { preferredCodingModel: value };
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        if (kind === "preferredModel") setSavedPreferredModel(value);
        else setSavedPreferredCodingModel(value);
      } else {
        const err = await res.json();
        setError(err.error || "保存失败");
      }
    } catch {
      setError("网络错误");
    }
    setSaving(null);
  }

  async function saveProvider(providerId: string) {
    setSaving({ kind: "provider", providerId });
    setError("");
    try {
      const body: Record<string, unknown> = {};
      const enabled = formEnabled[providerId];
      const apiKey = formApiKey[providerId]?.trim();
      const baseUrl = formBaseUrl[providerId]?.trim();

      if (enabled !== undefined) body.enabled = enabled;
      if (apiKey) body.apiKey = apiKey;
      if (baseUrl) body.baseUrl = baseUrl;

      if (Object.keys(body).length === 0) {
        setSaving(null);
        return;
      }

      const res = await fetch("/api/settings/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, ...body }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "保存失败");
      } else {
        // Update local provider state
        setProviders((prev) =>
          prev.map((pv) => {
            if (pv.providerId !== providerId) return pv;
            return {
              ...pv,
              enabled: enabled ?? pv.enabled,
              hasApiKey: apiKey ? true : pv.hasApiKey,
              apiKeyPreview: apiKey ? maskKey(apiKey) : pv.apiKeyPreview,
              customBaseUrl: baseUrl || undefined,
              status: !(enabled ?? pv.enabled)
                ? "disabled"
                : pv.requiresAuth && !apiKey && !pv.hasApiKey
                  ? "not_configured"
                  : "configured",
            } as ProviderView;
          }),
        );
        setFormApiKey((prev) => ({ ...prev, [providerId]: "" }));
        setExpanded(null);
      }
    } catch {
      setError("网络错误");
    }
    setSaving(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-5 h-5 border-2 border-brand-text border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const chatModels = getAvailableModels("chat");
  const codingModels = getAvailableModels("coding");
  const dirtyModel = preferredModel !== savedPreferredModel;
  const dirtyCodingModel = preferredCodingModel !== savedPreferredCodingModel;

  return (
    <div>
      <h2 className="text-lg font-semibold text-t1 mb-1">模型供应商</h2>
      <p className="text-xs text-t3 mb-6">
        配置 AI 模型供应商的 API Key 和端点，然后选择对话和代码生成使用的模型
      </p>

      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* ── Provider cards ── */}
      <div className="flex flex-col gap-3 mb-8">
        <h3 className="text-sm font-semibold text-t1">供应商配置</h3>

        {providers.map((pv) => {
          const isExpanded = expanded === pv.providerId;
          const isSavingProvider = saving?.kind === "provider" && saving.providerId === pv.providerId;

          return (
            <div key={pv.providerId}>
              {/* Card */}
              <button
                onClick={() => setExpanded(isExpanded ? null : pv.providerId)}
                className={`w-full text-left rounded-xl border px-4 py-3.5 transition-colors ${
                  isExpanded
                    ? "border-brand/50 bg-brand-subtle"
                    : "border-bd bg-modal hover:border-bd-hover"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <span className={`shrink-0 ${isExpanded ? "text-brand-text" : "text-t3"}`}>
                    {IconProvider}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-t1">{pv.name}</p>
                    <p className="text-xs text-t3 mt-0.5">{pv.description}</p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 shrink-0">
                    {statusBadge(pv.status)}
                    <span className="text-t4">
                      {isExpanded ? IconChevronUp : IconChevronDown}
                    </span>
                  </div>
                </div>
              </button>

              {/* Expanded config form */}
              {isExpanded && (
                <div className="border border-t-0 border-brand/50 rounded-b-xl bg-brand-subtle/30 px-4 py-4 space-y-4">
                  {/* Enable toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-t1">启用供应商</p>
                      <p className="text-xs text-t3 mt-0.5">
                        关闭后该供应商的模型在模型选择器中不可见
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setFormEnabled((prev) => ({
                          ...prev,
                          [pv.providerId]: !prev[pv.providerId],
                        }))
                      }
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        formEnabled[pv.providerId] ? "bg-brand" : "bg-bd-strong"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                          formEnabled[pv.providerId] ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {/* API Key */}
                  {pv.requiresAuth && (
                    <div>
                      <p className="text-xs font-medium text-t2 mb-1.5">API Key</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          value={formApiKey[pv.providerId] || ""}
                          onChange={(e) =>
                            setFormApiKey((prev) => ({
                              ...prev,
                              [pv.providerId]: e.target.value,
                            }))
                          }
                          placeholder={pv.hasApiKey ? `已设置 (${pv.apiKeyPreview})` : "请输入 API Key…"}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-bd bg-base text-sm text-t1 focus:outline-none focus:border-accent"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveProvider(pv.providerId);
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Base URL */}
                  <div>
                    <p className="text-xs font-medium text-t2 mb-1.5">API 端点</p>
                    <input
                      type="text"
                      value={formBaseUrl[pv.providerId] || ""}
                      onChange={(e) =>
                        setFormBaseUrl((prev) => ({
                          ...prev,
                          [pv.providerId]: e.target.value,
                        }))
                      }
                      placeholder={pv.defaultBaseUrl}
                      className="w-full px-3 py-1.5 rounded-lg border border-bd bg-base text-sm text-t1 focus:outline-none focus:border-accent font-mono"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveProvider(pv.providerId);
                      }}
                    />
                  </div>

                  {/* Save / Cancel */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => saveProvider(pv.providerId)}
                      disabled={isSavingProvider}
                      className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium disabled:opacity-40 transition-colors"
                    >
                      {isSavingProvider ? "保存中…" : "保存配置"}
                    </button>
                    <button
                      onClick={() => setExpanded(null)}
                      className="px-3 py-2 text-sm text-t3 hover:text-t1 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Model selection ── */}
      <div className="border-t border-bd pt-6">
        <h3 className="text-sm font-semibold text-t1 mb-4">默认模型选择</h3>
        <p className="text-xs text-t3 mb-4">
          选择全局默认的对话模型和代码生成模型。每个项目可以独立覆盖。
        </p>

        <div className="flex flex-col gap-8">
          {/* Chat model */}
          <section>
            <h4 className="text-sm font-medium text-t1 mb-1">对话模型</h4>
            <p className="text-xs text-t3 mb-3">
              负责对话、内容规划、口播稿和大纲生成
            </p>
            <div className="flex flex-col gap-2">
              {chatModels.length === 0 ? (
                <p className="text-xs text-t3 py-2">
                  暂无可用的对话模型，请先配置并启用至少一个供应商
                </p>
              ) : (
                chatModels.map((m) => {
                  const active = preferredModel === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPreferredModel(m.id)}
                      className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                        active
                          ? "border-brand/50 bg-brand-subtle"
                          : "border-bd bg-modal hover:border-bd-hover"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioDot active={active} />
                        <div>
                          <p className="text-sm font-semibold text-t1">{m.name}</p>
                          <p className="text-xs text-t3 mt-0.5">{m.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={() => saveModel("preferredModel", preferredModel)}
                  disabled={!dirtyModel || saving?.kind === "preferredModel"}
                  className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium disabled:opacity-40 transition-colors"
                >
                  {saving?.kind === "preferredModel" ? "保存中…" : "保存"}
                </button>
                {!dirtyModel && (
                  <span className="text-xs text-t3">已保存</span>
                )}
              </div>
            </div>
          </section>

          {/* Coding model */}
          <section>
            <h4 className="text-sm font-medium text-t1 mb-1">代码模型</h4>
            <p className="text-xs text-t3 mb-3">
              负责并行构建每个章节的 React/TSX 代码
            </p>
            <div className="flex flex-col gap-2">
              {codingModels.length === 0 ? (
                <p className="text-xs text-t3 py-2">
                  暂无可用的代码模型，请先配置并启用至少一个供应商
                </p>
              ) : (
                codingModels.map((m) => {
                  const active = preferredCodingModel === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPreferredCodingModel(m.id)}
                      className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                        active
                          ? "border-brand/50 bg-brand-subtle"
                          : "border-bd bg-modal hover:border-bd-hover"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioDot active={active} />
                        <div>
                          <p className="text-sm font-semibold text-t1">{m.name}</p>
                          <p className="text-xs text-t3 mt-0.5">{m.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={() => saveModel("preferredCodingModel", preferredCodingModel)}
                  disabled={!dirtyCodingModel || saving?.kind === "preferredCodingModel"}
                  className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium disabled:opacity-40 transition-colors"
                >
                  {saving?.kind === "preferredCodingModel" ? "保存中…" : "保存"}
                </button>
                {!dirtyCodingModel && (
                  <span className="text-xs text-t3">已保存</span>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
