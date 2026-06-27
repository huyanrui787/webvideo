"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LibraryPickerDrawer } from "./library-picker-drawer";
import { MediaSearchPanel } from "./media-search-panel";
import { ImageGenPanel } from "./image-gen-panel";

interface AssetItem {
  name: string;
  originalName: string;
  type: "image" | "video";
  size: number;
  url: string;
  source: "local" | "library";
  refId: string | null;
  assetId?: string;
  caption: string;
  tags: string[];
}

interface AssetsLibraryProps {
  projectId: string;
  editMode?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

type InnerTab = "local" | "search" | "generate";

export function AssetsLibrary({ projectId, editMode }: AssetsLibraryProps) {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [innerTab, setInnerTab] = useState<InnerTab>("local");
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/assets`);
    const data = await res.json();
    setAssets(Array.isArray(data) ? data : []);
  }, [projectId]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  // Re-fetch when custom event "assets-changed" is dispatched (e.g. after AI generates images)
  useEffect(() => {
    function handler() { fetchAssets(); }
    window.addEventListener("assets-changed", handler);
    return () => window.removeEventListener("assets-changed", handler);
  }, [fetchAssets]);

  async function uploadFile(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    await fetch(`/api/projects/${projectId}/assets`, { method: "POST", body: form });
    await fetchAssets();
    setUploading(false);
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) await uploadFile(file);
  }

  async function deleteAsset(item: AssetItem) {
    const key = item.refId ?? item.name;
    setDeletingKey(key);
    await fetch(`/api/projects/${projectId}/assets`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item.refId ? { refId: item.refId } : { name: item.name }),
    });
    await fetchAssets();
    setDeletingKey(null);
  }

  async function saveCaption(item: AssetItem, caption: string) {
    if (item.source === "local") {
      await fetch(`/api/projects/${projectId}/assets/meta`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: item.name, caption }),
      });
    } else if (item.assetId) {
      await fetch(`/api/library/assets/${item.assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });
    }
    setAssets((prev) =>
      prev.map((a) => (a.name === item.name && a.source === item.source ? { ...a, caption } : a))
    );
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  const localAssets = assets.filter((a) => a.source === "local");
  const libAssets = assets.filter((a) => a.source === "library");
  const missingCaption = assets.filter((a) => !a.caption.trim()).length;

  const innerTabs: { id: InnerTab; label: string; icon: string }[] = [
    { id: "local", label: "已有", icon: "📁" },
    { id: "search", label: "搜索", icon: "🔍" },
    { id: "generate", label: "AI 生成", icon: "✨" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Inner tab bar */}
      <div className="flex gap-1 px-3 pt-2.5 pb-1.5 shrink-0 border-b border-bd">
        {innerTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setInnerTab(t.id)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
              innerTab === t.id
                ? "bg-accent text-t1"
                : "text-t3 hover:text-t2 hover:bg-surface2"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Already-have tab */}
      {innerTab === "local" && (
        <>
          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`mx-3 mt-2 mb-0 shrink-0 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
              dragging ? "border-brand-text bg-indigo-50" : "border-bd hover:border-bd-hover hover:bg-base"
            }`}
          >
            <span className="text-lg">{uploading ? "⏳" : "⬆"}</span>
            <p className="text-xs text-t2">{uploading ? "上传中…" : "拖拽或点击上传图片 / 视频"}</p>
            <p className="text-xs text-t4">jpg · png · webp · gif · mp4 · webm</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,video/mp4,video/webm"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* From library button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="mx-3 mt-2 mb-1 shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs py-2 hover:bg-indigo-100 transition-colors font-medium"
          >
            ＋ 从全局素材库选取
          </button>

          {/* Missing caption hint */}
          {missingCaption > 0 && assets.length > 0 && (
            <p className="mx-3 mb-1 shrink-0 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
              {missingCaption} 个素材未填描述，AI 生成时将跳过
            </p>
          )}

          {/* Grid */}
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {assets.length === 0 ? (
              <div className="text-center py-8 text-t4 text-xs">
                还没有素材，上传后可在章节代码中引用
              </div>
            ) : (
              <>
                {localAssets.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-t3 mb-1.5">本项目上传 ({localAssets.length})</p>
                    <AssetGrid items={localAssets} deletingKey={deletingKey} onDelete={deleteAsset} onSaveCaption={saveCaption} editMode={editMode} />
                  </div>
                )}
                {libAssets.length > 0 && (
                  <div>
                    <p className="text-xs text-t3 mb-1.5">来自素材库 ({libAssets.length})</p>
                    <AssetGrid items={libAssets} deletingKey={deletingKey} onDelete={deleteAsset} onSaveCaption={saveCaption} editMode={editMode} />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Search tab */}
      {innerTab === "search" && (
        <MediaSearchPanel projectId={projectId} onImported={() => { fetchAssets(); }} />
      )}

      {/* AI Generate tab */}
      {innerTab === "generate" && (
        <div className="flex-1 overflow-y-auto">
          <ImageGenPanel projectId={projectId} onGenerated={() => { fetchAssets(); }} />
        </div>
      )}

      <LibraryPickerDrawer
        projectId={projectId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAdded={fetchAssets}
      />
    </div>
  );
}


function AssetGrid({
  items,
  deletingKey,
  onDelete,
  onSaveCaption,
  editMode,
}: {
  items: AssetItem[];
  deletingKey: string | null;
  onDelete: (item: AssetItem) => void;
  onSaveCaption: (item: AssetItem, caption: string) => void;
  editMode?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((asset) => {
        const key = asset.refId ?? asset.name;
        return (
          <AssetCard
            key={key}
            asset={asset}
            deletingKey={deletingKey}
            onDelete={onDelete}
            onSaveCaption={onSaveCaption}
            editMode={editMode}
          />
        );
      })}
    </div>
  );
}

function AssetCard({
  asset,
  deletingKey,
  onDelete,
  onSaveCaption,
  editMode,
}: {
  asset: AssetItem;
  deletingKey: string | null;
  onDelete: (item: AssetItem) => void;
  onSaveCaption: (item: AssetItem, caption: string) => void;
  editMode?: boolean;
}) {
  const key = asset.refId ?? asset.name;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(asset.caption);

  function handleBlur() {
    setEditing(false);
    if (draft !== asset.caption) onSaveCaption(asset, draft);
  }

  const isImage = asset.type === "image";

  return (
    <div
      className={`group relative rounded-xl overflow-hidden border border-bd bg-base ${editMode && isImage ? "cursor-grab active:cursor-grabbing" : ""}`}
      draggable={editMode && isImage}
      onDragStart={editMode && isImage ? (e) => {
        e.dataTransfer.setData("application/x-asset-url", asset.url);
        e.dataTransfer.setData("application/x-asset-name", asset.originalName);
        e.dataTransfer.effectAllowed = "copy";
        // Cache URL globally as fallback (React SyntheticEvent may lose dataTransfer on drop)
        (window as unknown as Record<string, string>).__dragAssetUrl = asset.url;
        (window as unknown as Record<string, string>).__dragAssetName = asset.originalName;
        window.dispatchEvent(new CustomEvent("asset-drag-start"));
        // Create drag ghost
        const ghost = document.createElement("div");
        ghost.style.cssText = "position:fixed;top:-999px;background:#fff;border:2px solid #818cf8;border-radius:8px;padding:4px;font-size:11px;color:#4f46e5;pointer-events:none;";
        ghost.textContent = `🖼 ${asset.originalName}`;
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 0, 0);
        setTimeout(() => ghost.remove(), 0);
      } : undefined}
      onDragEnd={editMode && isImage ? () => {
        window.dispatchEvent(new CustomEvent("asset-drag-end"));
      } : undefined}
    >
      {isImage ? (
        <img src={asset.url} alt={asset.originalName} className="w-full h-20 object-cover" />
      ) : (
        <div className="w-full h-20 flex flex-col items-center justify-center gap-1 bg-surface2">
          <span className="text-2xl">🎬</span>
        </div>
      )}
      {editMode && isImage && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-indigo-600/80 text-t1 text-[9px] px-1.5 py-0.5 rounded font-medium backdrop-blur-sm">
            拖入页面
          </span>
        </div>
      )}
      <div className="px-2 pt-1 pb-1.5">
        <p className="text-xs text-t2 truncate mb-0.5" title={asset.originalName}>
          {asset.source === "library" && <span className="mr-1 text-brand-text text-[10px]">☁</span>}
          {asset.originalName}
        </p>
        {/* Caption inline edit */}
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); } if (e.key === "Escape") { setDraft(asset.caption); setEditing(false); } }}
            className="w-full text-[10px] border-b border-indigo-300 outline-none bg-transparent text-t2 pb-px"
            placeholder="添加描述…"
          />
        ) : (
          <p
            onClick={() => { setDraft(asset.caption); setEditing(true); }}
            className={`text-[10px] cursor-text truncate ${
              asset.caption ? "text-t2" : "text-t4 italic"
            }`}
            title="点击编辑描述"
          >
            {asset.caption || "添加描述…"}
          </p>
        )}
        <p className="text-[10px] text-t4 mt-0.5">{formatSize(asset.size)}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(asset); }}
        disabled={deletingKey === key}
        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-overlay text-t1 rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/80"
        title={asset.source === "library" ? "从项目移除引用" : "删除"}
      >
        {deletingKey === key ? "…" : "×"}
      </button>
    </div>
  );
}
