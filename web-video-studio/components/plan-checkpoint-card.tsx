"use client";

import { useEffect, useState } from "react";
import type { ThemeMeta } from "@/app/api/themes/route";
import type { Orientation } from "@/lib/db/schema";
import { ThemePickerPanel } from "@/components/theme-picker-panel";

export interface RecommendedTheme {
  id: string;
  score: number;
  reason: string;
}

export interface CheckpointData {
  scriptWordCount: number;
  outlineChapters: number;
  outlineSteps: number;
  recommendedThemes?: RecommendedTheme[];
}

interface PlanCheckpointCardProps {
  projectId: string;
  data: CheckpointData;
  onConfirmed: (opts: { theme: string; devMode: "sequential" | "parallel"; orientation: Orientation }) => void;
}

export function PlanCheckpointCard({
  projectId,
  data,
  onConfirmed,
}: PlanCheckpointCardProps) {
  const [themes, setThemes] = useState<ThemeMeta[]>([]);
  const [selectedTheme, setSelectedTheme] = useState("");
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const recommended = data.recommendedThemes ?? [];

  useEffect(() => {
    fetch("/api/themes")
      .then((r) => r.ok ? r.json() : Promise.resolve([]))
      .then((fetched: ThemeMeta[]) => {
        if (!Array.isArray(fetched)) return;
        setThemes(fetched);
        const firstRec = recommended[0]?.id;
        const autoSelect = firstRec ?? (fetched.length > 0 ? fetched[0].id : "");
        if (autoSelect) setSelectedTheme(autoSelect);
      }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConfirm() {
    if (!selectedTheme) return;
    setLoading(true);
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: selectedTheme, devMode: "parallel", orientation, visualStyle: "standard" }),
    });
    onConfirmed({ theme: selectedTheme, devMode: "parallel", orientation });
  }

  const current = themes.find((t) => t.id === selectedTheme);
  const recommendedIds = new Set(recommended.map((r) => r.id));

  return (
    <>
      <div className="mx-3 my-2 rounded-2xl border-2 border-bd bg-base p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <span className="text-sm font-semibold text-t1">内容计划已就绪</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "口播稿", value: `${data.scriptWordCount} 字` },
            { label: "章节", value: `${data.outlineChapters} 章` },
            { label: "步骤", value: `${data.outlineSteps} 步` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-modal border border-bd py-2">
              <p className="text-xs text-t3">{s.label}</p>
              <p className="text-sm font-semibold text-t1">{s.value}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-t2">视觉主题</p>
            {recommended.length > 0 && (
              <span className="text-xs text-t4 flex items-center gap-1">
                <span className="text-brand-text">★</span> AI 已推荐
              </span>
            )}
          </div>

          {recommended.length > 0 && themes.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {recommended.slice(0, 3).map((rec, idx) => {
                const t = themes.find((th) => th.id === rec.id);
                if (!t) return null;
                const isSelected = selectedTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTheme(t.id)}
                    title={rec.reason}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-all border ${
                      isSelected
                        ? "border-brand-text/60 bg-amber-400/8 ring-1 ring-amber-400/40"
                        : "border-bd bg-modal hover:border-brand-text/40"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: isSelected ? "#f59e0b33" : "var(--bg-surface-2)", color: isSelected ? "#f59e0b" : "var(--text-3)" }}>
                      {idx + 1}
                    </div>
                    <div className="w-7 h-7 rounded-lg shrink-0 relative overflow-hidden" style={{ background: t.preview.shell }}>
                      <div className="absolute inset-1 rounded-md opacity-80" style={{ background: t.preview.surface }} />
                      <div className="absolute bottom-1 left-1 right-1 h-1 rounded-full" style={{ background: t.preview.accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-t1 truncate">{t.nameZh}</p>
                      <p className="text-xs text-t4 truncate mt-0.5">{rec.reason}</p>
                    </div>
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-brand-text">
                        <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={() => setPickerOpen(true)}
            className="w-full flex items-center gap-3 rounded-xl border border-bd bg-modal px-3 py-2 hover:border-bd-hover transition-colors text-left"
          >
            {current && !recommendedIds.has(current.id) ? (
              <>
                <div className="w-7 h-7 rounded-lg shrink-0 relative overflow-hidden" style={{ background: current.preview.shell }}>
                  <div className="absolute inset-1 rounded-md opacity-80" style={{ background: current.preview.surface }} />
                  <div className="absolute bottom-1 left-1 right-1 h-1 rounded-full" style={{ background: current.preview.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-t1 truncate">{current.nameZh}</p>
                  <p className="text-xs text-t3 truncate mt-0.5">{current.bestFor[0]}</p>
                </div>
                <span className="text-xs text-t3 shrink-0">换 →</span>
              </>
            ) : (
              <>
                <span className="text-xs text-t3 flex-1">浏览全部 {themes.length} 个主题 →</span>
              </>
            )}
          </button>
        </div>

        <div>
          <p className="text-xs font-medium text-t2 mb-2">画面方向</p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: "landscape", label: "横屏 16:9", desc: "电脑 / B站 / YouTube" },
                { id: "portrait",  label: "竖屏 9:16", desc: "抖音 / 视频号 / Reels" },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                onClick={() => setOrientation(o.id)}
                className={`rounded-xl px-3 py-2 text-left transition-colors border ${
                  orientation === o.id
                    ? "bg-accent text-white border-accent"
                    : "bg-modal border-bd hover:border-bd-hover"
                }`}
              >
                <p className="text-xs font-medium">{o.label}</p>
                <p className={`text-xs mt-0.5 ${orientation === o.id ? "text-white/70" : "text-t3"}`}>{o.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selectedTheme || loading}
          className="w-full rounded-xl bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40 transition-colors"
        >
          {loading ? "确认中…" : "确认，开始构建 →"}
        </button>
      </div>

      {pickerOpen && (
        <ThemePickerPanel
          themes={themes}
          selected={selectedTheme}
          recommendedIds={recommendedIds}
          onSelect={(id) => setSelectedTheme(id)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
