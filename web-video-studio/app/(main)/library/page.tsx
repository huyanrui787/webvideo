"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface LibraryAsset {
  id: string; name: string; originalName: string;
  type: "image" | "video"; size: number; tags: string[];
  caption: string; url: string; createdAt: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

/* ── SVG icons ─────────────────────────────────────────────────────── */

const IconUpload = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="16" x2="12" y2="8"/><polyline points="9,11 12,8 15,11"/><path d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2"/></svg>;
const IconImage = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="2" width="18" height="20" rx="2"/><circle cx="8" cy="9" r="1.5" fill="currentColor" stroke="none"/><path d="M3 18l5-5 3 3 4-4 6 5.5"/></svg>;
const IconVideo = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="2" width="18" height="20" rx="2"/><polygon points="10,8 10,16 17,12" fill="currentColor" stroke="none" opacity="0.3"/><polygon points="10,8 10,16 17,12" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
const IconSearch = <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="4.5"/><line x1="9.5" y1="9.5" x2="12.5" y2="12.5"/></svg>;
const IconSpinner = <span className="w-5 h-5 border-2 border-brand-text border-t-transparent rounded-full animate-spin" />;

export default function LibraryPage() {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/library/assets");
    if (!res.ok) { router.replace("/login"); return; }
    const data = await res.json();
    setAssets(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  async function uploadFiles(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      await fetch("/api/library/assets", { method: "POST", body: form });
    }
    await fetchAssets();
    setUploading(false);
  }

  async function deleteAsset(id: string) {
    setDeletingId(id);
    await fetch("/api/library/assets", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await fetchAssets();
    setDeletingId(null);
  }

  async function saveName(id: string) {
    if (!editName.trim()) { setEditingId(null); return; }
    await fetch(`/api/library/assets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ originalName: editName.trim() }) });
    setEditingId(null);
    setAssets((prev) => prev.map((a) => a.id === id ? { ...a, originalName: editName.trim() } : a));
  }

  async function saveCaption(id: string) {
    await fetch(`/api/library/assets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caption: editCaption }) });
    setEditingCaptionId(null);
    setAssets((prev) => prev.map((a) => a.id === id ? { ...a, caption: editCaption } : a));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    uploadFiles(e.dataTransfer.files);
  }

  const visible = assets.filter((a) => {
    if (filter !== "all" && a.type !== filter) return false;
    if (query && !a.originalName.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* ── Top bar ── */}
      <div className="border-b border-bd px-6 py-3 flex items-center justify-between shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-t1">素材库</h1>
          {!loading && <span className="text-xs text-t3">{assets.length} 个素材</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t4">{IconSearch}</span>
            <input
              type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索素材…"
              className="text-sm border border-input-bd bg-input-bg text-t1 placeholder:text-input-placeholder rounded-lg pl-8 pr-3 py-1.5 w-44 outline-none focus:border-brand/50"
            />
          </div>
          <div className="flex items-center rounded-lg border border-bd p-0.5">
            {(["all","image","video"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${filter === f ? "bg-surface2 text-t1 font-medium" : "text-t4 hover:text-t2"}`}>
                {f === "all" ? "全部" : f === "image" ? "图片" : "视频"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* ── Upload zone ── */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center py-10 gap-3 mb-6 transition-colors ${
            dragging ? "border-brand-text/50 bg-brand-subtle" : "border-bd-hover hover:border-bd-strong hover:bg-surface2"
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${uploading ? "bg-brand-subtle text-brand-text" : "bg-surface2 text-t3"}`}>
            {uploading ? IconSpinner : IconUpload}
          </div>
          <p className="text-sm font-medium text-t2">
            {uploading ? "上传中…" : "拖拽文件到此处，或点击选择"}
          </p>
          <p className="text-xs text-t4">支持 jpg · png · webp · svg · gif · mp4 · webm</p>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,video/mp4,video/webm" multiple className="hidden"
            onChange={(e) => uploadFiles(e.target.files)} />
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">{IconSpinner}</div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-surface2 flex items-center justify-center mb-4">
              {IconImage}
            </div>
            <h2 className="text-sm font-semibold text-t1 mb-1">
              {assets.length === 0 ? "还没有素材" : "没有匹配的素材"}
            </h2>
            <p className="text-xs text-t3">
              {assets.length === 0 ? "上传图片或视频，可在所有项目中复用" : "试试修改筛选条件"}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-t3">
                {visible.length} 个素材{query || filter !== "all" ? `（共 ${assets.length} 个）` : ""}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {visible.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative rounded-xl overflow-hidden border border-bd bg-modal hover:border-bd-hover transition-colors"
                >
                  {/* Preview */}
                  {asset.type === "image" ? (
                    <img src={asset.url} alt={asset.originalName} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-surface2">
                      <span className="text-t4">{IconVideo}</span>
                      <span className="text-[10px] text-t4 font-medium">视频</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="px-3 py-2.5">
                    {editingId === asset.id ? (
                      <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => saveName(asset.id)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveName(asset.id); if (e.key === "Escape") setEditingId(null); }}
                        className="w-full text-xs border-b border-brand-text/50 bg-transparent text-t1 outline-none py-0.5"
                        onClick={(e) => e.stopPropagation()} />
                    ) : (
                      <p
                        className="text-xs text-t2 truncate cursor-pointer hover:text-brand-text transition-colors"
                        title={asset.originalName}
                        onDoubleClick={() => { setEditingId(asset.id); setEditName(asset.originalName); }}>
                        {asset.originalName}
                      </p>
                    )}

                    {editingCaptionId === asset.id ? (
                      <input autoFocus value={editCaption} onChange={(e) => setEditCaption(e.target.value)}
                        onBlur={() => saveCaption(asset.id)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveCaption(asset.id); if (e.key === "Escape") setEditingCaptionId(null); }}
                        className="w-full text-[10px] border-b border-brand-text/50 outline-none py-0.5 bg-transparent text-t2 mt-0.5"
                        placeholder="添加描述…"
                        onClick={(e) => e.stopPropagation()} />
                    ) : (
                      <p
                        className={`text-[10px] mt-0.5 cursor-text truncate ${asset.caption ? "text-t3" : "text-tmuted"}`}
                        title={asset.caption || "点击添加描述"}
                        onClick={() => { setEditingCaptionId(asset.id); setEditCaption(asset.caption); }}>
                        {asset.caption || "添加描述…"}
                      </p>
                    )}

                    <p className="text-[10px] text-t4 mt-0.5">
                      {formatSize(asset.size)} · {formatDate(asset.createdAt)}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id); }}
                    disabled={deletingId === asset.id}
                    className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/60 hover:bg-red-500 text-white/80 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    title="删除"
                  >
                    {deletingId === asset.id ? (
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1.5 3h9M4 3V1.5h4V3M9.5 3v6.5a1 1 0 01-1 1h-5a1 1 0 01-1-1V3"/></svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
