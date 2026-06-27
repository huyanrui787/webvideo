"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileViewerSheet } from "./file-viewer-sheet";
import { CodeFileTree } from "./code-file-tree";
import type { Project } from "@/lib/db/schema";
import type { ChapterProgress } from "./chapter-progress-panel";

interface AssetItem {
  name: string;
  originalName: string;
  url: string | null;
  type: "image" | "video";
  status?: "done" | "error";
  stepIdx?: number;
  error?: string;
}

interface FilePanelProps {
  chapters?: ChapterProgress[];
  projectId: string;
  project: Project;
  files: Partial<Record<"article" | "script" | "outline" | "rhythm" | "illustrations" | "source", string>>;
  onOpenFile: (tab: "article" | "script" | "outline" | "rhythm" | "illustrations" | "source") => void;
  openFileTab?: "article" | "script" | "outline" | "rhythm" | "illustrations" | "source" | null;
  onCloseFile?: () => void;
  onSaveFile?: (tab: "script" | "outline", content: string) => Promise<void>;
  devPort: number | null;
  scaffoldStatus: "idle" | "running" | "done" | "error";
  devServerStarting: boolean;
  onStartDevServer: () => void;
  onOpenPreview: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function AssetPreview({ asset, projectId, onClose, onRetry }: {
  asset: AssetItem;
  projectId: string;
  onClose: () => void;
  onRetry?: (stepIdx: number) => void;
}) {
  const isFailed = asset.status === "error" || !asset.url;
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    if (asset.stepIdx === undefined || retrying) return;
    setRetrying(true);
    try {
      const r = await fetch(`/api/projects/${projectId}/gen-ill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepIdx: asset.stepIdx }),
      });
      if (r.ok) {
        window.dispatchEvent(new CustomEvent("assets-changed"));
        window.location.reload();
      }
    } catch {}
    setRetrying(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-bd shrink-0">
        <button
          onClick={onClose}
          className="text-xs text-t3 hover:text-t2 shrink-0 transition-colors"
        >
          ‹ 项目文件
        </button>
        <span className="text-t4 text-xs shrink-0">/</span>
        <span className="text-xs font-medium text-t1 truncate flex-1 min-w-0">{asset.originalName}</span>
        <button
          onClick={onClose}
          className="text-t3 hover:text-t1 text-base leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-surface2 transition-colors shrink-0"
        >
          ×
        </button>
      </div>
      {/* Preview */}
      <div className="flex-1 overflow-auto flex items-center justify-center bg-base p-4">
        {isFailed ? (
          <div className="flex flex-col items-center gap-3 text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <span className="text-t2 text-sm font-medium">插图生成失败</span>
            {asset.error && (
              <span className="text-t4 text-xs leading-relaxed">{asset.error}</span>
            )}
            {onRetry && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="mt-2 px-4 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50"
              >
                {retrying ? "重新生成中…" : "重新生成"}
              </button>
            )}
          </div>
        ) : asset.type === "image" ? (
          <img
            src={asset.url!}
            alt={asset.originalName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
          />
        ) : (
          <video
            src={asset.url!}
            controls
            className="max-w-full max-h-full rounded-lg shadow-sm"
          />
        )}
      </div>
    </div>
  );
}

export function FilePanel({
  projectId,
  project,
  files,
  onOpenFile,
  openFileTab,
  onCloseFile,
  onSaveFile,
  devPort,
  scaffoldStatus,
  devServerStarting,
  onStartDevServer,
  onOpenPreview,
  collapsed,
  onToggleCollapse: _onToggleCollapse,
  chapters = [],
}: FilePanelProps) {
  // (no panel tab state — 源码 is rendered as a virtual file entry, not a top-level tab)
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [previewAsset, setPreviewAsset] = useState<AssetItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const assetInputRef = useRef<HTMLInputElement>(null);

  function fetchAssets() {
    fetch(`/api/projects/${projectId}/assets`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setAssets(data))
      .catch(() => {});
  }

  useEffect(() => {
    fetchAssets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Re-fetch when custom event "assets-changed" is dispatched (e.g. after AI generates images)
  useEffect(() => {
    function handler() { fetchAssets(); }
    window.addEventListener("assets-changed", handler);
    return () => window.removeEventListener("assets-changed", handler);
  }, [projectId]);

  async function handleAssetUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      await fetch(`/api/projects/${projectId}/assets`, { method: "POST", body: form });
    }
    setUploading(false);
    fetchAssets();
  }

  const isIllust = project?.projectType === "illustration-video" || project?.projectType === "illustrated-article" || project?.projectType === "animation-video";
  const fileEntries: { tab: "article" | "script" | "outline" | "rhythm" | "illustrations" | "source"; filename: string; label: string; badge?: string; virtual?: boolean }[] = [
    { tab: "article",       filename: "article.md",        label: "原文" },
    { tab: "script",        filename: "script.md",         label: "口播稿" },
    { tab: "illustrations", filename: "illustrations.json", label: "插图", badge: "JSON" },
    ...(isIllust ? [] : [
      { tab: "rhythm" as const,  filename: "rhythm.md",  label: "节奏设计" },
      { tab: "outline" as const, filename: "outline.md", label: "开发计划" },
      { tab: "source" as const,  filename: "源码",        label: "源码", badge: "TS", virtual: true },
    ]),
  ];

  // clicking a file toggles: opens if closed, closes if already open
  function handleOpenFile(tab: "article" | "script" | "outline" | "rhythm" | "illustrations" | "source") {
    setPreviewAsset(null);
    if (openFileTab === tab) {
      // Already open → close it
      onCloseFile?.();
    } else {
      onOpenFile(tab);
    }
  }

  function handleOpenAsset(a: AssetItem) {
    setPreviewAsset(a);
    onCloseFile?.();
  }

  function handleCloseRight() {
    setPreviewAsset(null);
    onCloseFile?.();
  }

  const rightPanel = previewAsset
    ? { kind: "asset" as const, asset: previewAsset }
    : openFileTab
    ? { kind: "file" as const, tab: openFileTab }
    : null;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-2 gap-3 h-full">
        <span className="text-[10px] text-t4 [writing-mode:vertical-lr] tracking-widest mt-1">FILES</span>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: File tree ── */}
      <div
        className={`flex flex-col overflow-hidden ${rightPanel ? "border-r border-bd" : "w-full"}`}
        style={rightPanel ? { width: 220, flexShrink: 0 } : undefined}
      >
          {/* Flat file list */}
        <div className="flex-1 overflow-y-auto py-1">
          {/* Project files */}
          {fileEntries.map(({ tab, label, badge, virtual }) => {
            const exists = virtual || files[tab] !== undefined;
            if (!exists) return null;
            const isActive = openFileTab === tab && !previewAsset;
            return (
              <button
                key={tab}
                onClick={() => handleOpenFile(tab)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 transition-colors ${isActive ? "bg-surface3" : "hover:bg-surface2"}`}
              >
                <span className="text-[10px] font-bold text-t4 uppercase w-5 shrink-0">{badge ?? "MD"}</span>
                <span className={`text-xs flex-1 text-left truncate ${isActive ? "text-t1 font-medium" : "text-t2"}`}>{label}</span>
                {!virtual && <span className="w-1.5 h-1.5 rounded-full bg-t3 shrink-0" />}
              </button>
            );
          })}

          {/* Assets */}
          <>
            <div className="px-3 pt-3 pb-0.5 flex items-center gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-t4 flex-1">素材</span>
              <button
                onClick={() => assetInputRef.current?.click()}
                disabled={uploading}
                title="上传图片或视频"
                className="text-t4 hover:text-t2 transition-colors disabled:opacity-40 px-1 text-sm leading-none"
              >
                {uploading ? "…" : "+"}
              </button>
            </div>
            <input
              ref={assetInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => { handleAssetUpload(e.target.files); e.target.value = ""; }}
            />
            {assets.length === 0 ? (
              <button
                onClick={() => assetInputRef.current?.click()}
                className="mx-3 my-1 flex items-center justify-center gap-1.5 border border-dashed border-bd rounded-lg py-2 text-[10px] text-t4 hover:border-bd-hover hover:text-t3 transition-colors w-[calc(100%-24px)]"
              >
                <span>＋ 上传图片 / 视频</span>
              </button>
            ) : (
              assets.slice(0, 100).map((a) => {
                const isFailed = a.status === "error" || !a.url;
                return (
                  <button
                    key={a.name}
                    onClick={() => handleOpenAsset(a)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 transition-colors text-left ${previewAsset?.name === a.name ? "bg-surface3" : "hover:bg-surface2"}`}
                  >
                    {isFailed ? (
                      <span className="text-[10px] shrink-0 text-red-400/60">×</span>
                    ) : (
                      <span className="text-[10px] shrink-0 text-t4">{a.type === "video" ? "▶" : "▣"}</span>
                    )}
                    <span className={`text-xs truncate flex-1 ${isFailed ? "text-red-400/60" : previewAsset?.name === a.name ? "text-t1 font-medium" : "text-t2"}`}>
                      {a.originalName}
                    </span>
                  </button>
                );
              })
            )}
          </>

          {/* Scaffold status line */}
          {scaffoldStatus === "running" && (
            <div className="px-3 py-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-t4 animate-pulse shrink-0" />
              <span className="text-xs text-t4">初始化中…</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: asset preview or file content ── */}
      {rightPanel && (
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
          {rightPanel.kind === "asset" ? (
            <AssetPreview
              key={rightPanel.asset.name}
              asset={rightPanel.asset}
              projectId={projectId}
              onClose={handleCloseRight}
              onRetry={(stepIdx) => {
                fetch(`/api/projects/${projectId}/gen-ill`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ stepIdx }),
                }).then(() => {
                  window.dispatchEvent(new CustomEvent("assets-changed"));
                  window.location.reload();
                }).catch(() => {});
              }}
            />
          ) : openFileTab === "source" ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2 border-b border-bd shrink-0">
                <span className="text-xs text-t3 shrink-0">‹ 项目文件</span>
                <span className="text-t4 text-xs shrink-0">/</span>
                <span className="text-xs font-medium text-t1 truncate flex-1 min-w-0">源码</span>
                <button
                  onClick={handleCloseRight}
                  className="text-t3 hover:text-t1 text-base leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-surface2 transition-colors shrink-0"
                >×</button>
              </div>
              <div className="flex-1 overflow-hidden min-h-0">
                <CodeFileTree projectId={projectId} chapters={chapters} devPort={devPort} />
              </div>
            </>
          ) : openFileTab && onCloseFile ? (() => {
            const entry = fileEntries.find((f) => f.tab === openFileTab);
            const filename = entry?.filename ?? `${openFileTab}.md`;
            const readOnly = openFileTab === "article" || openFileTab === "rhythm" || openFileTab === "illustrations";
            return (
              <FileViewerSheet
                key={openFileTab}
                projectId={projectId}
                filename={filename}
                label={filename}
                content={files[openFileTab] ?? ""}
                readOnly={readOnly}
                onClose={handleCloseRight}
                onSave={!readOnly && onSaveFile ? (c) => onSaveFile(openFileTab as "script" | "outline", c) : undefined}
              />
            );
          })() : null}
        </div>
      )}
    </div>
  );
}
