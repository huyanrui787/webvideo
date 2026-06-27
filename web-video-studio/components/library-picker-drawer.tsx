"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface LibraryAsset {
  id: string;
  name: string;
  originalName: string;
  type: "image" | "video";
  size: number;
  tags: string[];
  url: string;
}

interface LibraryPickerDrawerProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function LibraryPickerDrawer({ projectId, open, onClose, onAdded }: LibraryPickerDrawerProps) {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/library/assets");
    const data = await res.json();
    setAssets(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) {
      fetchAssets();
      setSelected(new Set());
      setQuery("");
      setFilter("all");
    }
  }, [open, fetchAssets]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const visible = assets.filter((a) => {
    if (filter !== "all" && a.type !== filter) return false;
    if (query && !a.originalName.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleAdd() {
    if (selected.size === 0) return;
    setAdding(true);
    await fetch(`/api/projects/${projectId}/assets/from-library`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetIds: Array.from(selected) }),
    });
    setAdding(false);
    onAdded();
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 bottom-0 z-50 w-80 bg-modal shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bd shrink-0">
          <span className="text-sm font-semibold text-t1">从素材库选取</span>
          <button
            onClick={onClose}
            className="text-t3 hover:text-t2 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-3 py-2 border-b border-bd flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索…"
            className="flex-1 text-xs border border-bd rounded-lg px-2.5 py-1.5 outline-none focus:border-bd-strong"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "image" | "video")}
            className="text-xs border border-bd rounded-lg px-2 py-1.5 outline-none"
          >
            <option value="all">全部</option>
            <option value="image">图片</option>
            <option value="video">视频</option>
          </select>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {loading ? (
            <div className="text-center py-10 text-t4 text-xs">加载中…</div>
          ) : visible.length === 0 ? (
            <div className="text-center py-10 text-t4 text-xs">
              {assets.length === 0 ? "素材库为空，先去素材库上传素材" : "没有匹配的素材"}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {visible.map((asset) => {
                const isSelected = selected.has(asset.id);
                return (
                  <div
                    key={asset.id}
                    onClick={() => toggleSelect(asset.id)}
                    className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-amber-600 shadow-md shadow-indigo-100"
                        : "border-bd hover:border-bd-hover"
                    }`}
                  >
                    {asset.type === "image" ? (
                      <img src={asset.url} alt={asset.originalName} className="w-full h-20 object-cover" />
                    ) : (
                      <div className="w-full h-20 flex items-center justify-center bg-surface2">
                        <span className="text-2xl">🎬</span>
                      </div>
                    )}
                    <div className="px-1.5 py-1">
                      <p className="text-xs text-t2 truncate" title={asset.originalName}>
                        {asset.originalName}
                      </p>
                      <p className="text-[10px] text-t3">{formatSize(asset.size)}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                        <span className="text-t1 text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-bd flex items-center gap-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-bd py-2 text-xs text-t2 hover:bg-base transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleAdd}
            disabled={selected.size === 0 || adding}
            className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs text-t1 font-medium hover:bg-brand disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {adding ? "添加中…" : selected.size > 0 ? `添加 ${selected.size} 项 →` : "请先选择"}
          </button>
        </div>
      </div>
    </>
  );
}
