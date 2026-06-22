"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface LibraryAsset {
  id: string;
  name: string;
  originalName: string;
  type: "image" | "video";
  size: number;
  tags: string[];
  caption: string;
  url: string;
  createdAt: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

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
    await fetch("/api/library/assets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchAssets();
    setDeletingId(null);
  }

  async function saveName(id: string) {
    if (!editName.trim()) { setEditingId(null); return; }
    await fetch(`/api/library/assets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalName: editName.trim() }),
    });
    setEditingId(null);
    setAssets((prev) => prev.map((a) => a.id === id ? { ...a, originalName: editName.trim() } : a));
  }

  async function saveCaption(id: string) {
    await fetch(`/api/library/assets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption: editCaption }),
    });
    setEditingCaptionId(null);
    setAssets((prev) => prev.map((a) => a.id === id ? { ...a, caption: editCaption } : a));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    uploadFiles(e.dataTransfer.files);
  }

  const visible = assets.filter((a) => {
    if (filter !== "all" && a.type !== filter) return false;
    if (query && !a.originalName.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="border-b border-bd px-8 py-4 flex items-center justify-between shrink-0">
          <h1 className="text-base font-semibold text-t1">素材库</h1>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索素材…"
              className="text-sm border border-input-bd bg-input-bg text-t1 placeholder:text-input-placeholder rounded-lg px-3 py-1.5 w-48 outline-none focus:border-accent"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "all" | "image" | "video")}
              className="text-sm border border-input-bd bg-input-bg text-t1 rounded-lg px-2 py-1.5 outline-none"
            >
              <option value="all">全部类型</option>
              <option value="image">图片</option>
              <option value="video">视频</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center py-8 gap-2 mb-8 transition-colors ${
            dragging
              ? "border-indigo-400 bg-indigo-500/10"
              : "border-bd-hover hover:border-bd-strong hover:bg-surface2"
          }`}
        >
          <span className="text-3xl">{uploading ? "⏳" : "⬆"}</span>
          <p className="text-sm font-medium text-t2">
            {uploading ? "上传中…" : "拖拽文件到此处，或点击选择"}
          </p>
          <p className="text-xs text-t3">支持 jpg · png · webp · svg · gif · mp4 · webm</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,video/mp4,video/webm"
            multiple
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
          />
        </div>

        {/* Stats */}
        {!loading && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-t2">
              {visible.length} 个素材
              {query || filter !== "all" ? `（共 ${assets.length} 个）` : ""}
            </p>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 text-t3 text-sm">加载中…</div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🖼️</p>
            <p className="text-t3 text-sm">
              {assets.length === 0 ? "还没有素材，上传后可在所有项目中复用" : "没有匹配的素材"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {visible.map((asset) => (
              <div
                key={asset.id}
                className="group relative rounded-2xl overflow-hidden border border-bd bg-modal hover:shadow-md hover:border-bd-hover transition-all"
              >
                {asset.type === "image" ? (
                  <img src={asset.url} alt={asset.originalName} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-surface2">
                    <span className="text-3xl">🎬</span>
                    <span className="text-xs text-t3">视频</span>
                  </div>
                )}
                <div className="px-3 py-2">
                  {editingId === asset.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => saveName(asset.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveName(asset.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-full text-xs border-b border-bd-hover bg-transparent text-t1 outline-none py-0.5"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p
                      className="text-xs text-t2 truncate cursor-pointer hover:text-indigo-400"
                      title={asset.originalName}
                      onDoubleClick={() => { setEditingId(asset.id); setEditName(asset.originalName); }}
                    >
                      {asset.originalName}
                    </p>
                  )}
                  {/* Caption */}
                  {editingCaptionId === asset.id ? (
                    <input
                      autoFocus
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      onBlur={() => saveCaption(asset.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveCaption(asset.id);
                        if (e.key === "Escape") setEditingCaptionId(null);
                      }}
                      className="w-full text-[10px] border-b border-indigo-400 outline-none py-0.5 bg-transparent text-t2 mt-0.5"
                      placeholder="添加描述…"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p
                      className={`text-[10px] mt-0.5 cursor-text truncate ${asset.caption ? "text-t3" : "text-tmuted italic"}`}
                      title={asset.caption || "点击添加描述"}
                      onClick={() => { setEditingCaptionId(asset.id); setEditCaption(asset.caption); }}
                    >
                      {asset.caption || "添加描述…"}
                    </p>
                  )}
                  <p className="text-[10px] text-t3 mt-0.5">
                    {formatSize(asset.size)} · {formatDate(asset.createdAt)}
                  </p>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id); }}
                  disabled={deletingId === asset.id}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-overlay hover:bg-black/80 text-t1 rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  title="删除"
                >
                  {deletingId === asset.id ? "…" : "×"}
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
  );
}
