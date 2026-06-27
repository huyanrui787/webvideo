"use client";

import { useEffect, useState } from "react";
import type { ProviderView } from "@/lib/model-provider/types";

interface ModelPickerPanelProps {
  current: string;
  onConfirm: (model: string) => void | Promise<void>;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

/** Get model display info from provider views, falling back to a label derived from the model ID. */
function getModelInfo(
  modelId: string,
  providerViews: ProviderView[],
): { name: string; desc: string; providerName: string; isAvailable: boolean } | null {
  for (const pv of providerViews) {
    const model = pv.models.find((m) => m.id === modelId);
    if (model) {
      return {
        name: model.name,
        desc: model.description,
        providerName: pv.name,
        isAvailable: pv.enabled && (!pv.requiresAuth || pv.hasApiKey),
      };
    }
  }
  return null;
}

export function ModelPickerPanel({
  current,
  onConfirm,
  onClose,
  title,
  subtitle,
}: ModelPickerPanelProps) {
  const [selected, setSelected] = useState<string>(current);
  const [saving, setSaving] = useState(false);
  const [providerViews, setProviderViews] = useState<ProviderView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch provider data to populate the picker
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.providerViews) {
          setProviderViews(data.providerViews);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const changed = selected !== current;

  async function confirm() {
    if (!changed || saving) return;
    setSaving(true);
    try {
      await onConfirm(selected);
      onClose();
    } catch (e) {
      setSaving(false);
      console.error("[ModelPicker] confirm failed:", e);
    }
  }

  // Get current model info for the subtitle
  const currentInfo = getModelInfo(current, providerViews);
  const defaultSubtitle = currentInfo
    ? `${currentInfo.providerName} · ${currentInfo.name}`
    : `当前：${current}`;

  // Flatten all models grouped by provider
  const groupedModels = providerViews.map((pv) => ({
    provider: pv,
    models: pv.models.filter(
      (m) => m.categories.includes("both") || m.categories.includes("chat"),
    ),
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex flex-col bg-modal h-full shadow-2xl"
        style={{ width: "min(380px, 100vw)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-bd shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-t1">
              {title ?? "选择模型"}
            </h2>
            <p className="text-xs text-t3 mt-0.5">
              {subtitle ?? defaultSubtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface2 text-t3 hover:text-t2 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="w-4 h-4 border-2 border-brand-text border-t-transparent rounded-full animate-spin" />
            </div>
          ) : groupedModels.length === 0 ? (
            <p className="text-xs text-t3 text-center py-12">
              暂无可用模型，请先在设置中配置供应商
            </p>
          ) : (
            groupedModels.map(({ provider, models }) => (
              <div key={provider.providerId}>
                {/* Provider header */}
                <div className="flex items-center gap-2 px-3 py-1.5 mt-1 first:mt-0">
                  <span className="text-[10px] font-medium text-t4 uppercase tracking-wider">
                    {provider.name}
                  </span>
                  {!provider.enabled && (
                    <span className="text-[10px] text-t4">· 已禁用</span>
                  )}
                  {provider.enabled &&
                    provider.requiresAuth &&
                    !provider.hasApiKey && (
                      <span className="text-[10px] text-amber-500">· 未配置</span>
                    )}
                </div>

                {models.map((m) => {
                  const isSelected = selected === m.id;
                  const isCurrent = m.id === current;
                  const isAvailable =
                    provider.enabled &&
                    (!provider.requiresAuth || provider.hasApiKey);

                  return (
                    <div
                      key={m.id}
                      onClick={() => isAvailable && setSelected(m.id)}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                        !isAvailable
                          ? "opacity-40 cursor-not-allowed"
                          : isSelected
                            ? "bg-accent text-accent-text cursor-pointer"
                            : "hover:bg-surface2 text-t2 cursor-pointer"
                      }`}
                    >
                      <span
                        className={`shrink-0 mt-1.5 w-2 h-2 rounded-full ${
                          isCurrent
                            ? "bg-emerald-400"
                            : isSelected
                              ? "bg-[var(--accent-text)]"
                              : "bg-t3"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {m.name}
                        </p>
                        <p
                          className={`text-xs truncate ${
                            isSelected
                              ? "text-accent-text/65"
                              : "text-t3"
                          }`}
                        >
                          {m.description}
                        </p>
                      </div>
                      {isCurrent && (
                        <span
                          className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ${
                            isSelected
                              ? "bg-[var(--accent-text)]/20 text-accent-text"
                              : "bg-emerald-500/15 text-emerald-400"
                          }`}
                        >
                          当前
                        </span>
                      )}
                      {!isAvailable && (
                        <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-t4/10 text-t4">
                          {!provider.enabled ? "已禁用" : "需配置"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-bd shrink-0">
          <button
            onClick={confirm}
            disabled={!changed || saving}
            className="w-full rounded-xl bg-accent py-2.5 text-sm font-medium text-accent-text hover:bg-accent-hover disabled:opacity-40 transition-colors"
          >
            {saving
              ? "切换中…"
              : changed
                ? `✓ 切换到「${getModelInfo(selected, providerViews)?.name ?? selected}」`
                : "未修改"}
          </button>
        </div>
      </div>
    </div>
  );
}
