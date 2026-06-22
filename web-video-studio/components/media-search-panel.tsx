"use client";

import { useRef, useState } from "react";
import type { SearchResult } from "@/app/api/search/route";

type Source = "pexels" | "pexels-video" | "giphy";

const SOURCES: { id: Source; label: string; icon: string; needsKey: "PEXELS_API_KEY" | "GIPHY_API_KEY" }[] = [
  { id: "pexels", label: "Pexels 图片", icon: "🖼️", needsKey: "PEXELS_API_KEY" },
  { id: "pexels-video", label: "Pexels 视频", icon: "🎬", needsKey: "PEXELS_API_KEY" },
  { id: "giphy", label: "Giphy GIF", icon: "✨", needsKey: "GIPHY_API_KEY" },
];

interface MediaSearchPanelProps {
  projectId: string;
  onImported: () => void;
}

export function MediaSearchPanel({ projectId, onImported }: MediaSearchPanelProps) {
  const [source, setSource] = useState<Source>("pexels");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [importing, setImporting] = useState<string | null>(null);
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  async function doSearch(p = 1) {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError("");
    if (p === 1) setResults([]);
    setPage(p);

    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&source=${source}&page=${p}`
    );
    const data = await res.json();

    if (!res.ok || data.error) {
      setSearchError(data.error ?? "搜索失败");
    } else {
      setResults((prev) => p === 1 ? data.results : [...prev, ...data.results]);
    }
    setSearching(false);
  }

  async function importAsset(item: SearchResult) {
    setImporting(item.id);
    const caption = item.credit ? `${item.title} (by ${item.credit})` : item.title;
    const res = await fetch(`/api/projects/${projectId}/assets/from-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: item.downloadUrl,
        filename: `${item.source}-${item.id.split("-").pop()}`,
        caption,
        type: item.type === "gif" ? "image" : item.type,
      }),
    });
    if (res.ok) {
      setImported((prev) => new Set([...prev, item.id]));
      onImported();
    }
    setImporting(null);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Source selector */}
      <div className="flex gap-1 px-3 pt-2 shrink-0">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSource(s.id); setResults([]); setSearchError(""); }}
            className={`flex-1 rounded-lg py-1.5 text-[10px] font-medium transition-colors ${
              source === s.id
                ? "bg-accent text-t1"
                : "bg-surface2 text-t2 hover:bg-surface3"
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="flex gap-1.5 px-3 pt-2 shrink-0">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") doSearch(1); }}
          placeholder={source === "giphy" ? "搜索 GIF…" : "搜索图片关键词…"}
          className="flex-1 rounded-xl border border-bd px-3 py-1.5 text-xs outline-none focus:border-bd-strong"
        />
        <button
          onClick={() => doSearch(1)}
          disabled={searching || !query.trim()}
          className="rounded-xl bg-accent text-t1 px-3 py-1.5 text-xs font-medium hover:bg-accent-hover disabled:opacity-40 transition-colors"
        >
          {searching ? "…" : "搜"}
        </button>
      </div>

      {searchError && (
        <p className="mx-3 mt-1.5 text-[10px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-2 py-1 shrink-0">
          {searchError.includes("not configured")
            ? `请在 .env.local 配置 ${source.startsWith("pexels") ? "PEXELS_API_KEY" : "GIPHY_API_KEY"}`
            : searchError}
        </p>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 mt-2">
        {results.length === 0 && !searching && !searchError && (
          <div className="text-center py-8 text-t4 text-xs">
            {query ? "无结果" : "输入关键词开始搜索"}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {results.map((item) => {
            const isImporting = importing === item.id;
            const isImported = imported.has(item.id);
            return (
              <div key={item.id} className="group relative rounded-xl overflow-hidden border border-bd bg-base">
                {item.type === "video" ? (
                  <div className="w-full h-20 bg-surface3 flex items-center justify-center">
                    <img src={item.previewUrl} alt={item.title} className="w-full h-20 object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center text-t1 text-xl bg-black/30">▶</span>
                  </div>
                ) : (
                  <img
                    src={item.previewUrl}
                    alt={item.title}
                    className="w-full h-20 object-cover"
                    loading="lazy"
                  />
                )}
                <div className="px-2 pt-1 pb-1.5">
                  <p className="text-[10px] text-t2 truncate">{item.credit ?? item.title}</p>
                </div>
                <button
                  onClick={() => !isImported && importAsset(item)}
                  disabled={isImporting || isImported}
                  className={`absolute top-1.5 right-1.5 text-xs rounded-full w-6 h-6 flex items-center justify-center transition-all
                    ${isImported
                      ? "bg-green-500 text-t1 opacity-100"
                      : "bg-overlay text-t1 opacity-0 group-hover:opacity-100 hover:bg-indigo-600"
                    }`}
                  title={isImported ? "已添加" : "添加到项目"}
                >
                  {isImporting ? "…" : isImported ? "✓" : "+"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Load more */}
        {results.length > 0 && results.length % 20 === 0 && (
          <button
            onClick={() => doSearch(page + 1)}
            disabled={searching}
            className="w-full mt-3 rounded-xl border border-bd py-2 text-xs text-t2 hover:bg-base transition-colors disabled:opacity-40"
          >
            {searching ? "加载中…" : "加载更多"}
          </button>
        )}
      </div>
    </div>
  );
}
