"use client";

import { useEffect, useRef, useState } from "react";
import type { ThemeMeta } from "@/app/api/themes/route";

interface ThemePickerPanelProps {
  themes: ThemeMeta[];
  selected: string;
  recommendedIds?: Set<string>;
  onSelect: (id: string) => void;
  onClose: () => void;
}

type Filter = "all" | "dark" | "light";

// 非标准布局的展示配置
const LAYOUT_META: Record<string, { label: string; icon: string; hint: string }> = {
  "split-canvas-dynamic":  { label: "分屏", icon: "⊡", hint: "左白右色硬切分屏" },
  "data-dashboard":        { label: "数据仪表", icon: "⊞", hint: "Swiss 网格 + 规则线 + 数字出血区" },
  "cinematic-letterbox":   { label: "电影信箱", icon: "▬", hint: "2.39:1 信箱裁切，上下黑条" },
};

function isDark(t: ThemeMeta): boolean {
  return t.mood[0] === "dark";
}

export function ThemePickerPanel({
  themes,
  selected,
  recommendedIds,
  onSelect,
  onClose,
}: ThemePickerPanelProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [hovered, setHovered] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const detailId = hovered ?? selected;
  const detail = themes.find((t) => t.id === detailId);

  const filtered = themes.filter((t) => {
    if (filter === "dark") return isDark(t);
    if (filter === "light") return !isDark(t);
    return true;
  });

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={handleBackdrop}
    >
      <div
        ref={panelRef}
        className="flex flex-col bg-modal h-full shadow-2xl"
        style={{ width: "min(520px, 100vw)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bd shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-t1">选择主题</h2>
            <p className="text-xs text-t3 mt-0.5">{themes.length} 个主题可选</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface2 text-t3 hover:text-t2 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Filter */}
        <div className="px-5 py-3 border-b border-bd shrink-0 flex gap-1.5">
          {(["all", "dark", "light"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-accent text-t1"
                  : "bg-surface2 text-t2 hover:bg-surface3"
              }`}
            >
              {f === "all" ? "全部" : f === "dark" ? "暗色" : "亮色"}
            </button>
          ))}
          <span className="ml-auto text-xs text-t4 self-center">
            {filtered.length} 个
          </span>
        </div>

        {/* Body: grid + detail */}
        <div className="flex flex-1 overflow-hidden">
          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-2.5">
              {filtered.map((t) => {
                const isSelected = selected === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelect(t.id)}
                    onMouseEnter={() => setHovered(t.id)}
                    onMouseLeave={() => setHovered(null)}
                    className={`relative rounded-xl overflow-hidden text-left transition-all ${
                      isSelected
                        ? "ring-2 ring-zinc-900 ring-offset-2"
                        : "hover:ring-2 hover:ring-zinc-300 hover:ring-offset-1"
                    }`}
                    style={{ background: t.preview.shell }}
                  >
                    {/* Color swatch body */}
                    <div className="h-16 w-full relative">
                      {/* Surface patch */}
                      <div
                        className="absolute inset-3 rounded-lg opacity-80"
                        style={{ background: t.preview.surface }}
                      />
                      {/* Accent strip */}
                      <div
                        className="absolute bottom-3 left-3 h-1.5 rounded-full"
                        style={{ background: t.preview.accent, width: "40%" }}
                      />
                      {/* Layout structure overlay for non-standard layouts */}
                      {t.layout_template === "split-canvas-dynamic" && (
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Vertical split line */}
                          <div className="absolute top-0 bottom-0" style={{ left: "50%", width: 2, background: t.preview.text, opacity: 0.5 }} />
                          {/* Right half accent tint */}
                          <div className="absolute top-0 bottom-0 right-0" style={{ left: "50%", background: t.preview.accent, opacity: 0.25 }} />
                        </div>
                      )}
                      {t.layout_template === "data-dashboard" && (
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Horizontal rule at ~30% */}
                          <div className="absolute left-3 right-3" style={{ top: "30%", height: 1, background: t.preview.text, opacity: 0.2 }} />
                          {/* Horizontal rule at ~72% */}
                          <div className="absolute left-3 right-3" style={{ top: "72%", height: 1, background: t.preview.text, opacity: 0.2 }} />
                        </div>
                      )}
                      {t.layout_template === "cinematic-letterbox" && (
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Top bar */}
                          <div className="absolute left-0 right-0 top-0" style={{ height: "20%", background: t.preview.shell, opacity: 0.85 }} />
                          {/* Bottom bar */}
                          <div className="absolute left-0 right-0 bottom-0" style={{ height: "20%", background: t.preview.shell, opacity: 0.85 }} />
                        </div>
                      )}
                      {/* Layout badge */}
                      {t.layout_template && LAYOUT_META[t.layout_template] && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-white"
                          style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.04em",
                            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}>
                          {LAYOUT_META[t.layout_template].label}
                        </div>
                      )}
                      {/* Recommended badge */}
                      {recommendedIds?.has(t.id) && !isSelected && (
                        <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                          <span className="text-white text-xs leading-none" style={{ fontSize: 9 }}>★</span>
                        </div>
                      )}
                      {/* Selected badge — left-2 when layout badge occupies right-2, else right-2 */}
                      {isSelected && (
                        <div className={`absolute top-2 ${t.layout_template && LAYOUT_META[t.layout_template] ? "left-2" : "right-2"} w-4 h-4 rounded-full bg-accent flex items-center justify-center`}>
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <polyline points="1.5,4 3,5.5 6.5,2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Label */}
                    <div
                      className="px-2.5 py-2"
                      style={{ background: t.preview.shell }}
                    >
                      <p
                        className="text-xs font-semibold truncate"
                        style={{ color: t.preview.text }}
                      >
                        {t.nameZh}
                      </p>
                      <p
                        className="text-xs truncate mt-0.5 opacity-60"
                        style={{ color: t.preview.text }}
                      >
                        {t.bestFor[0]}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          {detail && (
            <div className="w-44 shrink-0 border-l border-bd flex flex-col overflow-y-auto">
              {/* Large color preview */}
              <div
                className="h-24 shrink-0 relative"
                style={{ background: detail.preview.shell }}
              >
                <div
                  className="absolute inset-4 rounded-lg opacity-80"
                  style={{ background: detail.preview.surface }}
                />
                <div
                  className="absolute bottom-4 left-4 right-4 h-1.5 rounded-full"
                  style={{ background: detail.preview.accent }}
                />
              </div>

              <div className="p-3 flex flex-col gap-3">
                <div>
                  <p className="text-xs font-semibold text-t1">{detail.nameZh}</p>
                  <p className="text-xs text-t2 mt-1 leading-relaxed">{detail.descriptionZh}</p>
                  {/* Layout template badge */}
                  {detail.layout_template && LAYOUT_META[detail.layout_template] && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                        style={{ background: "var(--bg-surface-2)", color: "var(--accent)" }}>
                        {LAYOUT_META[detail.layout_template].icon} {LAYOUT_META[detail.layout_template].label}
                      </span>
                    </div>
                  )}
                  {detail.layout_template && LAYOUT_META[detail.layout_template] && (
                    <p className="text-xs text-t3 mt-1 leading-relaxed">
                      {LAYOUT_META[detail.layout_template].hint}
                    </p>
                  )}
                </div>

                {detail.mood.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-t3 mb-1.5">风格标签</p>
                    <div className="flex flex-wrap gap-1">
                      {detail.mood.slice(0, 5).map((m) => (
                        <span
                          key={m}
                          className="text-xs px-1.5 py-0.5 rounded-md bg-surface2 text-t2"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {detail.bestFor.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-t3 mb-1.5">适合</p>
                    <ul className="space-y-1">
                      {detail.bestFor.map((b) => (
                        <li key={b} className="text-xs text-t2 flex gap-1">
                          <span className="text-t4 shrink-0">·</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-bd shrink-0">
          {selected ? (
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-accent py-2.5 text-sm font-medium text-t1 hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <polyline points="2.5,7 5.5,10 11.5,4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              使用「{themes.find((t) => t.id === selected)?.nameZh ?? selected}」
            </button>
          ) : (
            <p className="text-center text-xs text-t3">请选择一个主题</p>
          )}
        </div>
      </div>
    </div>
  );
}
