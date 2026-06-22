"use client";

import { useEffect, useRef, useState } from "react";
import type { ChapterProgress } from "./chapter-progress-panel";
import type { PlaybackStep } from "./playback-bar";
import { SubtitleOverlay } from "./subtitle-overlay";
import { PreviewLifecycleButton, type PreviewLifecycleButtonProps } from "./preview-lifecycle-button";
import type { Project } from "@/lib/db/schema";
import type { ReactNode } from "react";
import type { ScaffoldError } from "@/stores/project-store";

interface Segment { chapter: string; step: number; text: string; audio: string; }

const CTRL_H = 40;

export interface InlinePreviewProps {
  projectId: string;
  project: Project;
  devPort: number | null;
  iframeKey: number;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  isGraphic: boolean;
  scaffoldStatus: "idle" | "running" | "done" | "error";
  devServerStarting: boolean;
  devServerError?: string | null;
  onStartDevServer: () => void;
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
  // playback mode
  autoPlayMode: boolean;
  onToggleAutoPlayMode: () => void;
  // render / build / publish
  renderStatus: "idle" | "running" | "done" | "error";
  renderProgress: string;
  buildStatus: "idle" | "running" | "done" | "error";
  publishStatus: "idle" | "running" | "done" | "error";
  miaodaUrl: string | null;
  copied: boolean;
  onShare: () => void;
  onStartRender: () => void;
  onStartBuild: () => void;
  onPublish: () => void;
  onCopyLink: () => void;
  onOpenFloating?: () => void;
  onOpenThemePicker?: () => void;
  currentThemeName?: string;
  currentThemeShell?: string;
  currentThemeAccent?: string;
  // lifecycle button
  isStreaming: boolean;
  aiReadyForPreview: boolean;
  scaffoldStale: boolean;
  devCrashed: boolean;
  devDegraded?: boolean;
  scaffoldProgress?: { stage: string; pct: number } | null;
  scaffoldError?: ScaffoldError | null;
  scaffoldRetries?: number;
  buildDoneChapters: number;
  buildTotalChapters: number;
  buildErrorCount: number;
  onStartScaffold: () => void;
  onRebuild: () => void;
  onTakeManualControl: () => void;
  onTryDegradedStart?: () => void;
  onViewScaffoldLogs?: () => void;
  // wysiwyg overlay (rendered inside iframe container)
  wysiwygOverlay?: ReactNode;
  iframeContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export function InlinePreview({
  projectId,
  project,
  devPort,
  iframeKey,
  iframeRef,
  isGraphic,
  scaffoldStatus,
  devServerStarting,
  devServerError,
  onStartDevServer,
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
  autoPlayMode,
  onToggleAutoPlayMode,
  onShare,
  onStartRender,
  onStartBuild,
  onPublish,
  onCopyLink,
  onOpenFloating,
  isStreaming,
  aiReadyForPreview,
  scaffoldStale,
  devCrashed,
  devDegraded,
  scaffoldProgress,
  scaffoldError,
  scaffoldRetries,
  buildDoneChapters,
  buildTotalChapters,
  buildErrorCount,
  onStartScaffold,
  onRebuild,
  onTakeManualControl,
  onTryDegradedStart,
  onViewScaffoldLogs,
  wysiwygOverlay,
  iframeContainerRef,
}: InlinePreviewProps) {
  // PPT / 视频 tab — auto-switch to video when render completes
  const [tab, setTab] = useState<"ppt" | "video">("ppt");
  const [endedDismissed, setEndedDismissed] = useState(false);

  useEffect(() => {
    if (playbackState !== "ended") setEndedDismissed(false);
  }, [playbackState]);

  useEffect(() => {
    if (renderStatus === "done") setTab("video");
  }, [renderStatus]);

  // PPT mode: step-synced audio playback
  const [muted, setMuted] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const stepAudioRef = useRef<HTMLAudioElement | null>(null);
  const segmentsLoaded = useRef(false);

  // Load segments once devPort is available
  useEffect(() => {
    if (!devPort || segmentsLoaded.current) return;
    fetch(`/api/projects/${projectId}/files?path=presentation/audio-segments.json`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        segmentsLoaded.current = true;
        if (d?.content) { try { setSegments(JSON.parse(d.content)); } catch { /* ignore */ } }
      })
      .catch(() => {});
  }, [devPort, projectId]);

  // Play audio when step changes (PPT mode only)
  useEffect(() => {
    if (!isGraphic || muted || segments.length === 0 || !playbackStep) return;
    const { chapter, step } = playbackStep;
    const chapterId = chapters[chapter]?.id ?? String(chapter);
    const seg = segments.find(s => s.chapter === chapterId && s.step === step);
    if (!seg) return;
    stepAudioRef.current?.pause();
    const audio = new Audio(`/api/projects/${projectId}/audio/${seg.audio}`);
    stepAudioRef.current = audio;
    audio.play().catch(() => {});
    return () => { audio.pause(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackStep?.globalIndex]);

  useEffect(() => () => { stepAudioRef.current?.pause(); }, []);

  // Sync edit mode to iframe
  useEffect(() => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: previewMode === "edit" ? "edit-mode" : "exit-edit-mode" },
      "*"
    );
  }, [previewMode, iframeRef]);

  // iframe load error detection
  const [iframeLoadError, setIframeLoadError] = useState(false);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!devPort) { setIframeLoadError(false); return; }
    setIframeLoadError(false);
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => setIframeLoadError(true), 15_000);
    return () => { if (loadTimerRef.current) clearTimeout(loadTimerRef.current); };
  }, [devPort, iframeKey]);

  // Graphic mode: no tab switching, show existing card UI
  if (isGraphic) {
    return <GraphicPreview
      projectId={projectId}
      devPort={devPort}
      iframeKey={iframeKey}
      iframeRef={iframeRef}
      scaffoldStatus={scaffoldStatus}
      devServerStarting={devServerStarting}
      devServerError={devServerError}
      onStartDevServer={onStartDevServer}
      cardIndex={cardIndex}
      cardTotal={cardTotal}
      onCardPrev={onCardPrev}
      onCardNext={onCardNext}
      onExportCards={onExportCards}
      buildStatus={buildStatus}
      onStartBuild={onStartBuild}
      publishStatus={publishStatus}
      miaodaUrl={miaodaUrl}
      onShare={onShare}
      copied={copied}
      onPublish={onPublish}
      onCopyLink={onCopyLink}
      scaffoldStatusValue={scaffoldStatus}
      onOpenFloating={onOpenFloating}
    />;
  }

  return (
    <div className="flex flex-col h-full bg-modal">
      {/* ── Title bar ── */}
      <div className="relative flex items-stretch border-b border-bd shrink-0" style={{ height: 36 }}>
        {/* Left: port / render status */}
        <div className="flex items-center px-3 min-w-0">
          <span className="text-xs text-t4 truncate">
            {tab === "ppt" && devPort && <>:{devPort}</>}
            {tab === "video" && renderStatus === "done" && <span className="text-green-600 text-[10px]">✓ MP4</span>}
            {tab === "video" && renderStatus === "running" && <span className="text-blue-500 text-[10px] animate-pulse">{renderProgress || "渲染中…"}</span>}
          </span>
        </div>

        {/* Center: PPT / 视频 underline tabs */}
        <div className="absolute inset-0 flex items-stretch justify-center pointer-events-none">
          <div className="flex items-stretch pointer-events-auto">
            <button
              onClick={() => setTab("ppt")}
              className={`relative px-5 text-sm font-medium transition-colors ${tab === "ppt" ? "text-t1" : "text-t3 hover:text-t2"}`}
            >
              PPT
              {tab === "ppt" && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[var(--accent,var(--text))]" />}
            </button>
            <button
              onClick={() => renderStatus === "done" && setTab("video")}
              disabled={renderStatus !== "done"}
              title={renderStatus !== "done" ? "渲染为 MP4 后可用" : undefined}
              className={`relative px-5 text-sm font-medium transition-colors ${
                tab === "video" ? "text-t1"
                : renderStatus === "done" ? "text-t3 hover:text-t2"
                : "text-t4 cursor-not-allowed"
              }`}
            >
              视频
              {tab === "video" && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[var(--accent,var(--text))]" />}
            </button>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-0.5 px-2 ml-auto">
          <PreviewLifecycleButton
            {...({
              scaffold: scaffoldStatus,
              scaffoldProgress,
              scaffoldError,
              scaffoldRetries,
              devPort,
              devStarting: devServerStarting,
              devError: devServerError ?? null,
              devDegraded,
              buildStatus,
              buildDoneChapters,
              buildTotalChapters,
              buildErrorCount,
              projectStatus: project.status,
              isStreaming,
              aiReadyForPreview,
              scaffoldStale,
              devCrashed,
              onStartScaffold,
              onStartDevServer,
              onStopDevServer,
              onRefreshPreview,
              onRebuild,
              onFullscreen,
              onTakeManualControl,
              onTryDegradedStart,
              onViewScaffoldLogs,
              variant: "titlebar" as const,
            } as PreviewLifecycleButtonProps)}
          />
          {onOpenFloating && (
            <button onClick={onOpenFloating} className="flex items-center gap-1 text-xs text-t2 hover:text-t1 hover:bg-surface2 px-2 py-1 rounded-md transition-all shrink-0" title="悬浮窗口"><span className="text-[11px]">⊞</span><span className="hidden sm:inline">悬浮</span></button>
          )}
        </div>
      </div>

      {/* ── Content area ── */}
      {tab === "ppt" ? (
        <>
          {/* iframe */}
          <div className="relative flex-1 overflow-hidden bg-black" ref={iframeContainerRef}>
            {devPort ? (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative" style={{ width: "100%", aspectRatio: "16/9", maxHeight: "100%" }}>
                    <iframe
                      ref={iframeRef}
                      key={iframeKey}
                      src={`http://127.0.0.1:${devPort}?pid=${projectId}${autoPlayMode ? "&auto=1" : ""}`}
                      allow="autoplay"
                      className={`absolute inset-0 w-full h-full border-0 ${previewMode === "edit" ? "ring-2 ring-inset ring-[var(--border-strong)]" : ""}`}
                      title="演示预览"
                      onLoad={() => { if (loadTimerRef.current) clearTimeout(loadTimerRef.current); setIframeLoadError(false); }}
                    />
                  </div>
                </div>
                {wysiwygOverlay}

                {/* Edit mode overlays */}
                {previewMode === "edit" && (
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

                <SubtitleOverlay projectId={projectId} playbackStep={playbackStep} playbackState={playbackState} visible={subtitleVisible} />

                {/* Playback ended overlay */}
                {playbackState === "ended" && !endedDismissed && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black/60 backdrop-blur-sm">
                    <p className="text-base font-semibold text-white/80">播放完毕</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEndedDismissed(true)}
                        className="px-4 py-1.5 rounded-lg border border-white/20 text-xs text-white/50 hover:text-white/80 hover:border-white/30 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={onPlay}
                        className="px-4 py-1.5 rounded-lg bg-white/90 text-black text-xs font-medium hover:bg-white transition-colors"
                      >
                        ↺ 重播
                      </button>
                    </div>
                  </div>
                )}

                {/* iframe load error overlay */}
                {iframeLoadError && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/85">
                    <p className="text-xs text-t3">预览加载失败，可能是 Vite 编译错误</p>
                    <button
                      onClick={() => { setIframeLoadError(false); onRefreshPreview(); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-t1 text-base text-xs font-medium hover:opacity-80 transition-opacity"
                    >
                      重试
                    </button>
                  </div>
                )}
              </>
            ) : scaffoldStatus === "running" ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-t3 animate-pulse">脚手架初始化中…</span>
              </div>
            ) : scaffoldStatus === "done" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                {devServerStarting ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-12 h-12">
                      <span className="absolute inset-0 rounded-full border-2 border-white/10" />
                      <span
                        className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                        style={{ borderTopColor: "rgba(255,255,255,0.85)" }}
                      />
                      <span
                        className="absolute inset-[5px] rounded-full border border-transparent animate-spin"
                        style={{ borderTopColor: "rgba(255,255,255,0.35)", animationDuration: "1.5s", animationDirection: "reverse" }}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-medium text-white/60">启动预览中</span>
                      <span className="text-xs text-white/30 animate-pulse">正在启动 Vite 开发服务器…</span>
                    </div>
                  </div>
                ) : devServerError ? (
                  <>
                    <p className="text-xs text-red-400 max-w-[220px] text-center leading-relaxed">{devServerError}</p>
                    <button onClick={onStartDevServer} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-t1 text-base text-xs font-medium hover:opacity-80 transition-opacity">
                      重试
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onStartDevServer}
                    className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold active:scale-95 transition-all duration-150"
                    style={{ background: "rgba(255,255,255,0.92)", color: "#0a0a0c" }}
                  >
                    <span className="text-base leading-none">▶</span>
                    启动预览
                  </button>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 select-none">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <span className="text-3xl">🎬</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <span className="text-sm font-semibold text-white/70">演示预览</span>
                  <span className="text-xs text-white/35 max-w-[260px] leading-relaxed">
                    启动开发服务器后，你的演示内容将显示在此预览框中，支持翻页、编辑与渲染。
                  </span>
                </div>
                <div className="flex flex-col gap-2 text-xs text-white/25">
                  {['编辑章节内容', '预览确认效果', '渲染为 MP4'].map((label, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 text-[10px] font-medium text-white/40">{i + 1}</span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PPT bottom bar — chapters inline + action buttons */}
          <div className="shrink-0 border-t border-bd bg-modal">
            {/* Chapter timeline — always visible when chapters exist */}
            {devPort && chapters.length > 0 && (
              <div className="flex gap-1 items-end px-3 pt-2 pb-1">
                {chapters.map((ch, chIdx) => {
                  const isActive = chIdx === (playbackStep?.chapter ?? -1);
                  const stepCount = (chapterStepCounts[chIdx] ?? 0) + 1;
                  const stepProgress = isActive ? playbackStep!.step / Math.max(1, stepCount - 1) : 0;
                  const disabled = autoPlayMode;
                  return (
                    <div
                      key={ch.id}
                      className={`flex-1 flex flex-col gap-0.5 ${disabled ? "" : "cursor-pointer group"}`}
                      onClick={() => { if (!disabled) onSeekToStep(chIdx, 0); }}
                      title={disabled ? undefined : (ch.title || ch.id)}
                    >
                      <div className={`relative h-4 rounded-sm overflow-hidden transition-all ${
                        isActive ? "bg-surface3 ring-1 ring-[var(--border-strong)]" : "bg-surface2" + (disabled ? "" : " hover:bg-surface3")
                      }`}>
                        {isActive && stepCount > 1 && (
                          <div className="absolute inset-y-0 left-0 bg-t3 transition-[width] duration-150" style={{ width: `${stepProgress * 100}%` }} />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-1">
                          {Array.from({ length: Math.min(stepCount, 8) }, (_, sIdx) => {
                            const isActiveStep = isActive && sIdx === playbackStep!.step;
                            return (
                              <button
                                key={sIdx}
                                onClick={(e) => { e.stopPropagation(); if (!disabled) onSeekToStep(chIdx, sIdx); }}
                                className={`rounded-full shrink-0 transition-all ${
                                  isActiveStep ? "w-2 h-2 bg-t1" : isActive ? "w-1 h-1 bg-t2" : "w-1 h-1 bg-t4" + (disabled ? "" : " hover:bg-t3")
                                }`}
                              />
                            );
                          })}
                          {stepCount > 8 && <span className="text-[8px] text-t4 ml-0.5">+{stepCount - 8}</span>}
                        </div>
                      </div>
                      <span className={`text-[9px] truncate text-center leading-tight ${isActive ? "text-t2" : "text-t4" + (disabled ? "" : " group-hover:text-t3")}`}>
                        {chIdx + 1}. {ch.title || ch.id}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Control row */}
            <div className="flex items-center gap-1.5 px-3" style={{ height: CTRL_H }}>
              {/* Auto / Manual mode toggle — left side */}
              {devPort && (
                <div className="flex items-center rounded-lg border border-bd bg-surface p-0.5 shrink-0">
                  <button
                    onClick={() => { if (autoPlayMode) onToggleAutoPlayMode(); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      !autoPlayMode
                        ? "bg-t1 text-base shadow-sm"
                        : "text-t3 hover:text-t2"
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1.5" y="1.5" width="9" height="9" rx="1.5"/>
                      <line x1="5" y1="4.5" x2="5" y2="7.5"/><line x1="7" y1="4.5" x2="7" y2="7.5"/>
                    </svg>
                    手动
                  </button>
                  <button
                    onClick={() => { if (!autoPlayMode) onToggleAutoPlayMode(); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      autoPlayMode
                        ? "bg-t1 text-base shadow-sm"
                        : "text-t3 hover:text-t2"
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="3,1.5 10,6 3,10.5"/>
                    </svg>
                    自动
                  </button>
                </div>
              )}

              <div className="flex-1" />

              {/* Play/Pause + Speed — only in auto mode */}
              {devPort && autoPlayMode && (
                <>
                  {playbackState === "playing" ? (
                    <button onClick={onPause} className="text-xs bg-surface3 text-t2 border border-bd px-2.5 py-1 rounded-md font-medium hover:bg-surface2 shrink-0">⏸</button>
                  ) : playbackState === "paused" ? (
                    <button onClick={onPlay} className="text-xs bg-t1 text-base px-2.5 py-1 rounded-md font-medium hover:opacity-80 shrink-0">▶ 继续</button>
                  ) : playbackState === "ended" ? (
                    <button onClick={onPlay} className="text-xs bg-t1 text-base px-2.5 py-1 rounded-md font-medium hover:opacity-80 shrink-0">↺ 重播</button>
                  ) : (
                    <button onClick={onPlay} className="text-xs bg-t1 text-base px-2.5 py-1 rounded-md font-medium hover:opacity-80 shrink-0">▶ 播放</button>
                  )}
                  <SpeedButton speed={playbackSpeed} onChange={onSpeedChange} />
                </>
              )}

              {/* 预览 / 编辑 toggle */}
              {devPort && (
                <div className="flex items-center rounded-md border border-bd overflow-hidden shrink-0">
                  <button
                    onClick={onExitEditMode}
                    className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${previewMode === "preview" ? "bg-accent text-accent-text" : "text-t3 hover:text-t2"}`}
                  >预览</button>
                  <button
                    onClick={onEnterEditMode}
                    className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${previewMode === "edit" ? "bg-accent text-accent-text" : "text-t3 hover:text-t2"}`}
                  >编辑</button>
                </div>
              )}


              {/* Share */}
              {devPort && (
                <button onClick={onShare} className="text-xs text-t3 border border-bd px-2.5 py-1 rounded-md hover:text-t2 hover:border-bd-hover transition-colors font-medium shrink-0">↗ 分享</button>
              )}

              {/* Render */}
              {renderStatus === "idle" && devPort && (
                <button onClick={onStartRender} className="text-xs bg-t1 text-base px-2.5 py-1 rounded-md hover:opacity-80 font-medium shrink-0">⬇ 渲染</button>
              )}
              {renderStatus === "running" && (
                <span className="text-xs text-t3 animate-pulse shrink-0">⚙ {renderProgress || "渲染中…"}</span>
              )}
              {renderStatus === "error" && (
                <button onClick={onStartRender} className="text-xs text-red-400 px-2 py-1 rounded-md border border-red-400/30 shrink-0">✕ 重试</button>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ── VIDEO tab ── */
        <>
          <div
            className="relative flex-1 overflow-hidden flex items-center justify-center"
            style={{
              background: `black url(/api/projects/${projectId}/assets/poster.jpg) center/contain no-repeat`,
            }}
          >
            {renderStatus === "done" ? (
              <video
                src={`/api/projects/${projectId}/render?stream=1`}
                controls
                preload="none"
                className="max-w-full max-h-full"
                style={{ aspectRatio: "16/9", background: "black" }}
              />
            ) : renderStatus === "running" ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-48 bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-white h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${renderProgress.match(/(\d+)%/)?.[1] ?? 0}%` }}
                  />
                </div>
                <span className="text-xs text-white/60 animate-pulse">{renderProgress || "渲染中…"}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 text-center px-6">
                <span className="text-4xl opacity-30">🎬</span>
                <div>
                  <p className="text-sm font-medium text-white/80 mb-1">尚未渲染为视频</p>
                  <p className="text-xs text-white/40">渲染后可用原生播放器播放，约 2-5 分钟</p>
                </div>
                <button
                  onClick={() => { onStartRender(); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  ⬇ 开始渲染
                </button>
              </div>
            )}
          </div>

          {/* Video bottom bar */}
          <div className="flex items-center gap-1.5 px-3 border-t border-bd shrink-0 bg-modal" style={{ height: CTRL_H }}>
            <div className="flex-1" />

            {renderStatus === "done" && (
              <>
                <button onClick={onStartRender} className="text-xs text-t3 border border-bd px-2.5 py-1 rounded-md hover:bg-surface2 font-medium shrink-0">↺ 重新渲染</button>
                <a href={`/api/projects/${projectId}/render?download=1`} download="presentation.mp4" className="text-xs bg-t1 text-base px-2.5 py-1 rounded-md hover:opacity-80 font-medium shrink-0">↓ 下载 MP4</a>
                <div className="w-px h-4 bg-[var(--border)] mx-0.5 shrink-0" />
              </>
            )}

            {/* Build */}
            {buildStatus === "idle" && scaffoldStatus === "done" && <button onClick={onStartBuild} className="text-xs bg-surface3 text-t2 border border-bd-strong px-2.5 py-1 rounded-md hover:bg-surface2 font-medium shrink-0">⬡ 构建</button>}
            {buildStatus === "running" && <span className="text-xs text-t3 animate-pulse shrink-0">⚙ 构建中…</span>}
            {buildStatus === "done" && (
              <button onClick={onShare} className="text-xs bg-surface3 text-t2 border border-bd-strong px-2.5 py-1 rounded-md hover:bg-surface2 font-medium shrink-0">↗ 分享</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Graphic card preview (unchanged) ─────────────────────────────────────────

function GraphicPreview({
  projectId, devPort, iframeKey, iframeRef, scaffoldStatus, devServerStarting, devServerError,
  onStartDevServer, cardIndex, cardTotal, onCardPrev, onCardNext, onExportCards,
  buildStatus, onStartBuild, publishStatus, miaodaUrl, copied, onShare, onPublish, onCopyLink,
  scaffoldStatusValue, onOpenFloating,
}: {
  projectId: string; devPort: number | null; iframeKey: number;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  scaffoldStatus: "idle" | "running" | "done" | "error"; devServerStarting: boolean;
  devServerError?: string | null;
  onStartDevServer: () => void; cardIndex: number; cardTotal: number;
  onCardPrev: () => void; onCardNext: () => void; onExportCards: () => void;
  buildStatus: "idle" | "running" | "done" | "error";
  onStartBuild: () => void; publishStatus: "idle" | "running" | "done" | "error";
  miaodaUrl: string | null; copied: boolean; onShare: () => void; onPublish: () => void; onCopyLink: () => void;
  scaffoldStatusValue: string; onOpenFloating?: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-modal">
      <div className="flex items-center gap-2 px-3 border-b border-bd shrink-0" style={{ height: 36 }}>
        <span className="text-xs font-medium text-t2 flex-1 truncate">
          卡片预览{devPort && <span className="text-t4 ml-1.5 font-normal">:{devPort}</span>}
        </span>
        {onOpenFloating && <button onClick={onOpenFloating} className="text-t4 hover:text-t2 text-xs px-1.5 py-0.5 rounded border border-bd hover:border-bd-hover transition-colors">悬浮</button>}
      </div>

      <div className="relative flex-1 overflow-hidden bg-black">
        {devPort ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-full" style={{ aspectRatio: "9/16", maxHeight: "100%", maxWidth: "100%" }}>
              <iframe ref={iframeRef} key={iframeKey} src={`http://127.0.0.1:${devPort}?pid=${projectId}`} allow="autoplay" className="w-full h-full border-0" title="卡片预览" />
            </div>
          </div>
        ) : scaffoldStatus === "running" ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-t3 animate-pulse">脚手架初始化中…</span>
          </div>
        ) : scaffoldStatus === "done" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {devServerStarting ? (
              <div className="flex items-center gap-1.5 text-xs text-t2">
                <span className="w-3 h-3 border-2 border-t-transparent border-[var(--text-3)] rounded-full animate-spin" />启动中…
              </div>
            ) : devServerError ? (
              <>
                <p className="text-xs text-red-400 max-w-[200px] text-center leading-relaxed">{devServerError}</p>
                <button onClick={onStartDevServer} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-t1 text-base text-xs font-medium hover:opacity-80 transition-opacity">重试</button>
              </>
            ) : (
              <button onClick={onStartDevServer} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-t1 text-base text-xs font-medium hover:opacity-80 transition-opacity">▶ 启动预览</button>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 select-none">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 ring-1 ring-white/10">
                <span className="text-2xl">🖼️</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-sm font-semibold text-white/70">卡片预览</span>
                <span className="text-xs text-white/35 max-w-[220px] leading-relaxed">
                  启动开发服务器后，卡片内容将在此预览。
                </span>
              </div>
            </div>
        )}
      </div>

      {devPort && (
        <div className="flex items-center gap-1.5 px-3 border-t border-bd shrink-0 bg-modal" style={{ height: CTRL_H }}>
          {cardTotal > 0 && (
            <>
              <button onClick={onCardPrev} disabled={cardIndex === 0} className="text-xs text-t3 hover:text-t2 px-1 disabled:opacity-30">‹</button>
              <span className="text-xs text-t3">{cardIndex + 1}/{cardTotal}</span>
              <button onClick={onCardNext} disabled={cardIndex >= cardTotal - 1} className="text-xs text-t3 hover:text-t2 px-1 disabled:opacity-30">›</button>
              <div className="w-px h-4 bg-[var(--border)] mx-1 shrink-0" />
              <button onClick={onExportCards} className="text-xs bg-t1 text-base px-2.5 py-1 rounded-md hover:opacity-80 font-medium shrink-0">⬇ 导出</button>
            </>
          )}
          <div className="flex-1" />
          {buildStatus === "idle" && scaffoldStatusValue === "done" && <button onClick={onStartBuild} className="text-xs bg-surface3 text-t2 border border-bd-strong px-2.5 py-1 rounded-md hover:bg-surface2 font-medium shrink-0">⬡ 构建</button>}
          {buildStatus === "running" && <span className="text-xs text-t3 animate-pulse shrink-0">⚙ 构建中…</span>}
          {buildStatus === "done" && (
            <>
              <button onClick={onShare} className="text-xs bg-surface3 text-t2 border border-bd-strong px-2.5 py-1 rounded-md hover:bg-surface2 font-medium shrink-0">↗ 分享</button>
              {publishStatus === "idle" && <button onClick={onPublish} className="text-xs bg-t1 text-base px-2.5 py-1 rounded-md hover:opacity-80 font-medium shrink-0">↑ 发布</button>}
              {publishStatus === "running" && <span className="text-xs text-t3 animate-pulse shrink-0">⚙ 发布…</span>}
              {publishStatus === "done" && miaodaUrl && <a href={miaodaUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-t1 text-base px-2.5 py-1 rounded-md hover:opacity-80 font-medium shrink-0">↗ 妙搭</a>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Speed selector ─────────────────────────────────────────────────────────────

const SPEED_MIN = 0.5;
const SPEED_MAX = 2;
const SPEED_STEP = 0.1;

function SpeedButton({
  speed,
  onChange,
}: {
  speed: number;
  onChange: (rate: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        title="播放速度"
        className="text-[10px] px-1.5 py-0.5 rounded border border-bd text-t3 hover:text-t2 hover:border-bd-hover transition-colors font-medium"
      >
        {speed}x
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-50 bg-modal border border-bd rounded-xl shadow-xl p-3 min-w-[160px]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-t3">播放速度</span>
              <span className="text-xs font-semibold text-t1">{speed}x</span>
            </div>
            <input
              type="range"
              min={SPEED_MIN}
              max={SPEED_MAX}
              step={SPEED_STEP}
              value={speed}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-surface2 cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-t1 [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-sm"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-t4">{SPEED_MIN}x</span>
              <span className="text-[9px] text-t4">1x</span>
              <span className="text-[9px] text-t4">{SPEED_MAX}x</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
