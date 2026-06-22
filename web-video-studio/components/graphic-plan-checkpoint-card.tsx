"use client";

import { useEffect, useState } from "react";
import type { ThemeMeta } from "@/app/api/themes/route";
import { ThemePickerPanel } from "@/components/theme-picker-panel";

export interface GraphicCheckpointData {
  cardCount: number;
  titles?: string[];
  recommendedThemes?: Array<{ id: string; score: number; reason: string }>;
}

interface Props {
  projectId: string;
  data: GraphicCheckpointData;
  onConfirmed: (opts: { theme: string; devMode: "sequential" | "parallel"; orientation: "landscape" | "portrait" }) => void;
}

export function GraphicPlanCheckpointCard({ projectId, data, onConfirmed }: Props) {
  const [themes, setThemes] = useState<ThemeMeta[]>([]);
  const [selectedTheme, setSelectedTheme] = useState("");
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
      body: JSON.stringify({ theme: selectedTheme, devMode: "sequential", orientation: "portrait" }),
    });
    onConfirmed({ theme: selectedTheme, devMode: "sequential", orientation: "portrait" });
  }

  const current = themes.find((t) => t.id === selectedTheme);
  const recommendedIds = new Set(recommended.map((r) => r.id));

  return (
    <>
      <div className="mx-3 my-2 rounded-2xl border-2 border-bd bg-base p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-base">🖼️</span>
          <span className="text-sm font-semibold text-t1">图文卡片方案已就绪</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-center">
          {[
            { label: "卡片数量", value: `${data.cardCount} 张` },
            { label: "画面方向", value: "竖版 9:16" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-surface2 py-3">
              <p className="text-lg font-bold text-t1">{value}</p>
              <p className="text-[11px] text-t4 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Card titles preview */}
        {data.titles && data.titles.length > 0 && (
          <div>
            <p className="text-xs text-t4 mb-2">卡片预览</p>
            <div className="flex flex-wrap gap-1.5">
              {data.titles.slice(0, 10).map((t, i) => (
                <span key={i} className="text-[11px] px-2 py-1 rounded-lg bg-surface2 text-t3">
                  {i + 1}. {t}
                </span>
              ))}
              {data.titles.length > 10 && (
                <span className="text-[11px] px-2 py-1 rounded-lg bg-surface2 text-t4">
                  +{data.titles.length - 10} 张
                </span>
              )}
            </div>
          </div>
        )}

        {/* Recommended themes */}
        {recommended.length > 0 && (
          <div>
            <p className="text-xs text-t4 mb-2">推荐风格</p>
            <div className="flex flex-col gap-1.5">
              {recommended.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => setSelectedTheme(rec.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${
                    selectedTheme === rec.id
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-bd hover:border-bd-hover"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${selectedTheme === rec.id ? "bg-emerald-400" : "bg-t4"}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-t1">{rec.id}</span>
                    <span className="text-[11px] text-t4 ml-2">{rec.reason}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Theme selector */}
        <div>
          <p className="text-xs text-t4 mb-2">风格主题</p>
          <button
            onClick={() => setPickerOpen(true)}
            className="w-full flex items-center justify-between rounded-xl border border-bd px-3 py-2.5 hover:border-bd-hover transition-colors"
          >
            <div className="flex items-center gap-2">
              {current ? (
                <>
                  <span className="text-xs font-medium text-t1">{current.id}</span>
                  {recommendedIds.has(current.id) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">推荐</span>
                  )}
                </>
              ) : (
                <span className="text-xs text-t4">选择主题…</span>
              )}
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 5L6 8L9 5"/>
            </svg>
          </button>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selectedTheme || loading}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-sm font-medium text-white disabled:opacity-30 transition-colors"
        >
          {loading ? "启动构建…" : "开始构建卡片"}
        </button>
      </div>

      {pickerOpen && (
        <ThemePickerPanel
          themes={themes}
          selected={selectedTheme}
          onSelect={(id) => { setSelectedTheme(id); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
