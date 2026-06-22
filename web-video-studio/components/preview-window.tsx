"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChapterProgress } from "./chapter-progress-panel";
import type { PlaybackStep } from "./playback-bar";
import { PlaybackBar } from "./playback-bar";
import { SubtitleOverlay } from "./subtitle-overlay";
import { AudioPlayerBar } from "./audio-player-bar";
import { PreviewLifecycleButton } from "./preview-lifecycle-button";
import type { Project } from "@/lib/db/schema";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_W = 680;
const MIN_W = 320;
const MAX_W = 1400;
const TITLE_H = 36;
const CTRL_H = 40;
// PlaybackBar heights (outside iframe, opaque)
const PB_CTRL_H = 44;       // controls row
const PB_TIMELINE_H = 58;   // chapter timeline + step label
const PB_MINIMAL_H = 44;    // no chapters

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PreviewWindowProps {
  projectId: string;
  project: Project;
  devPort: number;
  iframeKey: number;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  isGraphic: boolean;
  // playback
  playbackState: "idle" | "playing" | "paused" | "ended";
  playbackStep: PlaybackStep | null;
  playbackSpeed: number;
  totalChapters: number;
  subtitleVisible: boolean;
  onPlay: () => void;
  onPause: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onSpeedChange: (rate: number) => void;
  onSubtitleToggle: () => void;
  onRefreshPreview: () => void;
  onStopDevServer: () => void;
  onFullscreen: () => void;
  // edit mode
  previewMode: "preview" | "edit";
  chapters: ChapterProgress[];
  chapterStepCounts: Record<number, number>;
  onEnterEditMode: () => void;
  onExitEditMode: () => void;
  onSeekToStep: (chapter: number, step: number) => void;
  wholePageSelected: boolean;
  onSelectWholePage: () => void;
  isDraggingAsset: boolean;
  dragOverIframe: boolean;
  onDragOverIframe: (v: boolean) => void;
  onDropOnIframe: (e: React.DragEvent<HTMLDivElement>) => void;
  // graphic
  cardIndex: number;
  cardTotal: number;
  onCardPrev: () => void;
  onCardNext: () => void;
  onExportCards: () => void;
  // render / build / publish
  renderStatus: "idle" | "running" | "done" | "error";
  renderProgress: string;
  buildStatus: "idle" | "running" | "done" | "error";
  publishStatus: "idle" | "running" | "done" | "error";
  miaodaUrl: string | null;
  copied: boolean;
  scaffoldStatus: "idle" | "running" | "done" | "error";
  devServerStarting: boolean;
  devServerError?: string | null;
  devCrashed: boolean;
  devDegraded?: boolean;
  scaffoldProgress?: { stage: string; pct: number } | null;
  scaffoldRetries?: number;
  // lifecycle button
  isStreaming: boolean;
  aiReadyForPreview: boolean;
  scaffoldStale: boolean;
  buildDoneChapters: number;
  buildTotalChapters: number;
  buildErrorCount: number;
  onStartScaffold: () => void;
  onStartDevServer: () => void;
  onRebuild: () => void;
  onTakeManualControl: () => void;
  onTryDegradedStart?: () => void;
  onStartRender: () => void;
  onStartBuild: () => void;
  onPublish: () => void;
  onCopyLink: () => void;
  onShare: () => void;
  // window control
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PreviewWindow({
  projectId,
  project,
  devPort,
  iframeKey,
  iframeRef,
  isGraphic,
  playbackState,
  playbackStep,
  playbackSpeed,
  totalChapters,
  subtitleVisible,
  onPlay,
  onPause,
  onPrevChapter,
  onNextChapter,
  onSpeedChange,
  onSubtitleToggle,
  onRefreshPreview,
  onStopDevServer,
  onFullscreen,
  previewMode,
  chapters,
  chapterStepCounts,
  onEnterEditMode,
  onExitEditMode,
  onSeekToStep,
  wholePageSelected,
  onSelectWholePage,
  isDraggingAsset,
  dragOverIframe,
  onDragOverIframe,
  onDropOnIframe,
  cardIndex,
  cardTotal,
  onCardPrev,
  onCardNext,
  onExportCards,
  renderStatus,
  renderProgress,
  buildStatus,
  publishStatus,
  miaodaUrl,
  copied,
  scaffoldStatus,
  devServerStarting,
  devServerError,
  devCrashed,
  devDegraded,
  scaffoldProgress,
  scaffoldRetries,
  isStreaming,
  aiReadyForPreview,
  scaffoldStale,
  buildDoneChapters,
  buildTotalChapters,
  buildErrorCount,
  onStartScaffold,
  onStartDevServer,
  onRebuild,
  onTakeManualControl,
  onTryDegradedStart,
  onStartRender,
  onStartBuild,
  onPublish,
  onCopyLink,
  onShare,
  onClose,
}: PreviewWindowProps) {
  // Window position & size
  const [pos, setPos] = useState(() => {
    // Right panel starts at ~40% of screen width (left panel is ~40%, right is ~60%)
    const rightPanelStart = Math.round(window.innerWidth * 0.40);
    const rightPanelWidth = window.innerWidth - rightPanelStart;
    const x = rightPanelStart + Math.round((rightPanelWidth - DEFAULT_W) / 2);
    return { x: Math.max(rightPanelStart, x), y: 60 };
  });
  const [winW, setWinW] = useState(DEFAULT_W);
  const [minimized, setMinimized] = useState(false);
  // PPT = interactive iframe, video = rendered MP4
  const [viewMode, setViewMode] = useState<"ppt" | "video">("ppt");
  const hasVideo = renderStatus === "done";

  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number } | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  // Content height based on aspect ratio + chrome
  const aspect = isGraphic ? 9 / 16 : 16 / 9;
  const contentH = Math.round(winW / aspect);
  const hasChapters = !isGraphic && chapters.length > 0;
  const pbH = !isGraphic && playbackState !== "idle"
    ? (hasChapters ? PB_CTRL_H + PB_TIMELINE_H : PB_MINIMAL_H)
    : 0;
  const totalH = minimized ? TITLE_H : TITLE_H + contentH + pbH + CTRL_H;

  // ── Drag (title bar) ──────────────────────────────────────────────────────
  const onTitleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    document.body.style.userSelect = "none";
  }, [pos]);

  // ── Resize (bottom-right handle) ─────────────────────────────────────────
  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: winW };
    document.body.style.userSelect = "none";
    document.body.style.cursor = "nwse-resize";
  }, [winW]);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPos({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
      }
      if (resizeRef.current) {
        const dx = e.clientX - resizeRef.current.startX;
        const next = Math.min(MAX_W, Math.max(MIN_W, resizeRef.current.origW + dx));
        setWinW(next);
      }
    }
    function onMouseUp() {
      dragRef.current = null;
      if (resizeRef.current) {
        resizeRef.current = null;
        document.body.style.cursor = "";
      }
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      // Always restore body styles (prevent leak on unmount mid-drag)
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, []);

  return (
    <div
      ref={windowRef}
      className="fixed z-30 flex flex-col overflow-hidden rounded-xl border border-bd-strong bg-modal shadow-2xl"
      style={{ left: pos.x, top: pos.y, width: winW, height: totalH }}
    >
      {/* ── Title bar ────────────────────────────────────────────────────── */}
      <div
        onMouseDown={onTitleMouseDown}
        className="flex items-center gap-2 px-3 border-b border-bd shrink-0 cursor-grab active:cursor-grabbing select-none"
        style={{ height: TITLE_H }}
      >
        {/* drag grip */}
        <span className="text-t4 text-xs mr-1">⠿</span>

        {/* ── Primary: PPT / 视频 toggle ── */}
        {!isGraphic && (
          <div className="flex items-center rounded-lg border border-bd overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode("ppt")}
              className={`px-2.5 py-1 text-xs font-semibold transition-colors ${viewMode === "ppt" ? "bg-t1 text-base" : "text-t3 hover:text-t2"}`}
            >PPT</button>
            <button
              onClick={() => { setViewMode("video"); if (previewMode === "edit") onExitEditMode(); }}
              className={`px-2.5 py-1 text-xs font-semibold transition-colors ${viewMode === "video" ? "bg-t1 text-base" : hasVideo ? "text-t3 hover:text-t2" : "text-t4 cursor-not-allowed"}`}
              disabled={!hasVideo}
              title={hasVideo ? "查看渲染视频" : "需要先渲染"}
            >视频</button>
          </div>
        )}

        {/* Port label */}
        {devPort && <span className="text-t4 text-[10px] font-normal shrink-0">:{devPort}</span>}

        <div className="flex-1" />

        <button onClick={() => setMinimized((v) => !v)} className="text-t4 hover:text-t2 text-xs px-1 transition-colors" title={minimized ? "展开" : "最小化"}>
          {minimized ? "□" : "⊟"}
        </button>
        <button onClick={onClose} className="text-t4 hover:text-t1 text-xs px-1 transition-colors" title="关闭">×</button>
      </div>

      {!minimized && (
        <>
          {/* ── iframe area ───────────────────────────────────────────────── */}
          <div className="relative bg-black flex-1 overflow-hidden">
            {/* Video mode: rendered MP4 */}
            {viewMode === "video" ? (
              <video
                key={renderStatus}
                src={`/api/projects/${projectId}/render`}
                controls
                className="w-full h-full object-contain"
              />
            ) : isGraphic ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-full" style={{ aspectRatio: "9/16", maxHeight: "100%", maxWidth: "100%" }}>
                  <iframe
                    ref={iframeRef}
                    key={iframeKey}
                    src={`http://127.0.0.1:${devPort}?pid=${projectId}`}
                    allow="autoplay"
                    className="w-full h-full border-0"
                    title="卡片预览"
                  />
                </div>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                key={iframeKey}
                src={`http://127.0.0.1:${devPort}?pid=${projectId}`}
                allow="autoplay"
                className={`w-full h-full border-0 ${previewMode === "edit" ? "ring-2 ring-inset ring-[var(--border-strong)]" : ""}`}
                title="演示预览"
              />
            )}

            {/* Edit mode hint overlay */}
            {!isGraphic && viewMode === "ppt" && previewMode === "edit" && (
              <>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1">
                  <span className="bg-surface3 text-t2 text-[9px] px-2 py-0.5 rounded-full font-medium shadow backdrop-blur-sm border border-bd pointer-events-none">
                    编辑 · 悬停高亮 · 单击选中
                  </span>
                  <button
                    onClick={onSelectWholePage}
                    className={`text-[9px] px-2 py-0.5 rounded-full font-medium shadow backdrop-blur-sm transition-colors border ${wholePageSelected ? "bg-t1 text-base border-[var(--text)]" : "bg-surface3 text-t2 border-bd hover:bg-surface2"}`}
                  >
                    {wholePageSelected ? "◈ 整页" : "整页"}
                  </button>
                </div>
                {isDraggingAsset && (
                  <div
                    className={`absolute inset-0 z-30 transition-colors ${dragOverIframe ? "bg-t1/5 ring-2 ring-inset ring-[var(--border-strong)]" : "bg-transparent"}`}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; onDragOverIframe(true); }}
                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) onDragOverIframe(false); }}
                    onDrop={onDropOnIframe}
                  >
                    {dragOverIframe && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="bg-surface3 text-t2 text-xs font-medium px-3 py-1.5 rounded-xl shadow backdrop-blur-sm border border-bd">松手放置</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Subtitle overlay stays inside iframe area */}
            {!isGraphic && viewMode === "ppt" && (
              <SubtitleOverlay
                projectId={projectId}
                playbackStep={playbackStep}
                playbackState={playbackState}
                visible={subtitleVisible}
              />
            )}
          </div>

          {/* ── Playback bar — OUTSIDE iframe, opaque background ─────────── */}
          {!isGraphic && viewMode === "ppt" && playbackState !== "idle" && (
            <div className="shrink-0 bg-modal border-t border-bd">
              <PlaybackBar
                step={playbackStep}
                playbackState={playbackState}
                speed={playbackSpeed}
                totalChapters={totalChapters}
                onPlay={onPlay}
                onPause={onPause}
                onPrevChapter={onPrevChapter}
                onNextChapter={onNextChapter}
                onSpeedChange={onSpeedChange}
                chapters={chapters}
                chapterStepCounts={chapterStepCounts}
                onSeekToStep={onSeekToStep}
              />
            </div>
          )}

          {/* ── Bottom control bar ────────────────────────────────────────── */}
          <div
            className="flex items-center gap-1.5 px-3 border-t border-bd shrink-0 overflow-x-auto"
            style={{ height: CTRL_H }}
          >
            {/* 预览 / 编辑 toggle (PPT mode only) */}
            {!isGraphic && viewMode === "ppt" && (
              <>
                <div className="flex items-center rounded-md border border-bd overflow-hidden shrink-0">
                  <button
                    onClick={onExitEditMode}
                    className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${previewMode === "preview" ? "bg-t1 text-base" : "text-t3 hover:text-t2"}`}
                  >预览</button>
                  <button
                    onClick={onEnterEditMode}
                    className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${previewMode === "edit" ? "bg-t1 text-base" : "text-t3 hover:text-t2"}`}
                  >编辑</button>
                </div>
                <div className="w-px h-4 bg-[var(--border)] mx-0.5 shrink-0" />
              </>
            )}

            {/* Window controls */}
            <PreviewLifecycleButton
              scaffold={scaffoldStatus}
              scaffoldProgress={scaffoldProgress}
              scaffoldRetries={scaffoldRetries ?? 0}
              devPort={devPort}
              devStarting={devServerStarting}
              devError={devServerError ?? null}
              devDegraded={devDegraded}
              buildStatus={buildStatus}
              buildDoneChapters={buildDoneChapters}
              buildTotalChapters={buildTotalChapters}
              buildErrorCount={buildErrorCount}
              projectStatus={project.status}
              isStreaming={isStreaming}
              aiReadyForPreview={aiReadyForPreview}
              scaffoldStale={scaffoldStale}
              devCrashed={devCrashed}
              onStartScaffold={onStartScaffold}
              onStartDevServer={onStartDevServer}
              onStopDevServer={onStopDevServer}
              onRefreshPreview={onRefreshPreview}
              onRebuild={onRebuild}
              onFullscreen={onFullscreen}
              onTakeManualControl={onTakeManualControl}
              onTryDegradedStart={onTryDegradedStart}
              variant="titlebar"
            />

            <div className="w-px h-4 bg-[var(--border)] mx-0.5 shrink-0" />

            {/* Graphic controls */}
            {isGraphic && cardTotal > 0 && (
              <>
                <button onClick={onCardPrev} disabled={cardIndex === 0} className="text-xs text-t3 hover:text-t2 px-1 disabled:opacity-30">‹</button>
                <span className="text-xs text-t3">{cardIndex + 1}/{cardTotal}</span>
                <button onClick={onCardNext} disabled={cardIndex >= cardTotal - 1} className="text-xs text-t3 hover:text-t2 px-1 disabled:opacity-30">›</button>
                <div className="w-px h-4 bg-[var(--border)] mx-1 shrink-0" />
                <button onClick={onExportCards} className="text-xs bg-t1 text-base px-2.5 py-1 rounded-md hover:opacity-80 font-medium shrink-0">⬇ 导出</button>
              </>
            )}

            {/* Video playback controls */}
            {!isGraphic && viewMode === "ppt" && (
              <>
                {playbackState === "playing" ? (
                  <button onClick={onPause} className="text-xs bg-surface3 text-t2 border border-bd px-2.5 py-1 rounded-md font-medium hover:bg-surface2 shrink-0">⏸</button>
                ) : playbackState === "ended" ? (
                  <button onClick={onPlay} className="text-xs bg-t1 text-base px-2.5 py-1 rounded-md font-medium hover:opacity-80 shrink-0">↺</button>
                ) : (
                  <button onClick={onPlay} className="text-xs bg-t1 text-base px-2.5 py-1 rounded-md font-medium hover:opacity-80 shrink-0">▶ 播放</button>
                )}
                {playbackState !== "idle" && (
                  <button onClick={onSubtitleToggle} className={`text-xs px-1.5 py-1 rounded-md border font-medium shrink-0 ${subtitleVisible ? "bg-t1 text-base border-[var(--text)]" : "text-t3 border-bd"}`}>CC</button>
                )}
              </>
            )}

            <div className="flex-1" />

            {/* Audio player (done status) */}
            {!isGraphic && project?.status === "done" && (
              <div className="shrink-0 max-w-[180px]">
                <AudioPlayerBar projectId={projectId} ttsVoice={project.ttsVoice} ttsProvider={project.ttsProvider} />
              </div>
            )}


            <div className="w-px h-4 bg-[var(--border)] mx-0.5 shrink-0" />

            {/* Render */}
            {!isGraphic && renderStatus === "idle" && (
              <button onClick={onStartRender} className="text-xs bg-t1 text-base px-2.5 py-1 rounded-md hover:opacity-80 font-medium shrink-0">⬇ 渲染</button>
            )}
            {!isGraphic && renderStatus === "running" && (
              <span className="text-xs text-t3 animate-pulse shrink-0">⚙ {renderProgress || "渲染中…"}</span>
            )}
            {!isGraphic && renderStatus === "done" && (
              <a href={`/api/projects/${projectId}/render?download=1`} download="presentation.mp4" className="text-xs bg-t1 text-base px-2.5 py-1 rounded-md hover:opacity-80 font-medium shrink-0">↓ MP4</a>
            )}
            {!isGraphic && renderStatus === "error" && (
              <button onClick={onStartRender} className="text-xs text-red-400 px-2 py-1 rounded-md border border-red-400/30 shrink-0">✕ 渲染失败</button>
            )}

            {/* Build */}
            {buildStatus === "idle" && scaffoldStatus === "done" && (
              <button onClick={onStartBuild} className="text-xs bg-surface3 text-t2 border border-bd-strong px-2.5 py-1 rounded-md hover:bg-surface2 font-medium shrink-0">⬡ 构建</button>
            )}
            {buildStatus === "running" && <span className="text-xs text-t3 animate-pulse shrink-0">⚙ 构建中…</span>}
            {buildStatus === "done" && (
              <button onClick={onShare} className="text-xs text-t3 border border-bd px-2.5 py-1 rounded-md hover:text-t2 hover:border-bd-hover transition-colors font-medium shrink-0">↗ 分享</button>
            )}
          </div>
        </>
      )}

      {/* ── Resize handle (bottom-right corner) ─────────────────────────────── */}
      {!minimized && (
        <div
          onMouseDown={onResizeMouseDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end pb-0.5 pr-0.5"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M7 1L1 7M7 4L4 7" stroke="currentColor" strokeWidth="1.2" className="text-t4" strokeLinecap="round"/>
          </svg>
        </div>
      )}
    </div>
  );
}
