"use client";

import { useEffect, useRef, useState } from "react";
import type { ChapterProgress } from "./chapter-progress-panel";

export interface PlaybackStep {
  globalIndex: number;
  totalGlobal: number;
  chapter: number;
  chapterTitle: string;
  step: number;
  startSec?: number;
  stepDuration?: number;
  totalDuration?: number;
}

interface PlaybackBarProps {
  step: PlaybackStep | null;
  playbackState: "idle" | "playing" | "paused" | "ended";
  speed: number;
  totalChapters: number;
  onPlay: () => void;
  onPause: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onSpeedChange: (rate: number) => void;
  // Chapter timeline (edit mode)
  chapters?: ChapterProgress[];
  chapterStepCounts?: Record<number, number>;
  onSeekToStep?: (chapter: number, step: number) => void;
}

function fmtSec(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function PlaybackBar({
  step,
  playbackState,
  speed,
  totalChapters,
  onPlay,
  onPause,
  onPrevChapter,
  onNextChapter,
  onSpeedChange,
  chapters = [],
  chapterStepCounts = {},
  onSeekToStep,
}: PlaybackBarProps) {
  const [visible, setVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef(0);

  useEffect(() => {
    if (step?.startSec !== undefined) {
      elapsedRef.current = step.startSec;
      setElapsed(step.startSec);
    }
  }, [step?.globalIndex, step?.startSec]);

  useEffect(() => {
    if (playbackState === "playing") {
      lastTickRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const dt = (now - lastTickRef.current) / 1000;
        lastTickRef.current = now;
        const stepEnd = step ? (step.startSec ?? 0) + (step.stepDuration ?? 3) : Infinity;
        const total = step?.totalDuration ?? Infinity;
        elapsedRef.current = Math.min(elapsedRef.current + dt * speed, Math.min(stepEnd, total));
        setElapsed(elapsedRef.current);
      }, 100);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (playbackState === "idle") { elapsedRef.current = 0; setElapsed(0); }
      if (playbackState === "ended" && step?.totalDuration) {
        elapsedRef.current = step.totalDuration;
        setElapsed(step.totalDuration);
      }
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackState, speed]);

  function resetHideTimer() {
    setVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setVisible(false), 3000);
  }

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackState, step?.globalIndex]);

  useEffect(() => {
    if (playbackState === "ended") {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setVisible(true);
    }
  }, [playbackState]);

  const isPlaying = playbackState === "playing";
  const isEnded = playbackState === "ended";
  const totalDuration = step?.totalDuration;
  const hasTiming = step?.totalDuration !== undefined;

  const progress = isEnded
    ? 1
    : totalDuration
    ? elapsed / totalDuration
    : step
    ? step.globalIndex / Math.max(1, step.totalGlobal - 1)
    : 0;

  const chapterMarkers = totalChapters > 1
    ? Array.from({ length: totalChapters - 1 }, (_, i) => (i + 1) / totalChapters)
    : [];

  const hasChapterTimeline = chapters.length > 0 && onSeekToStep;

  return (
    <div className="w-full" onMouseMove={resetHideTimer} onMouseEnter={resetHideTimer}>
      <div
        className="transition-all duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {/* Progress bar */}
        <div
          className="relative mx-3 mt-2 mb-1 h-1 rounded-full bg-surface3 cursor-pointer"
          onClick={(e) => {
            if (!step) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            const targetChapter = Math.floor(ratio * totalChapters);
            if (targetChapter !== step.chapter) {
              if (targetChapter < step.chapter) onPrevChapter();
              else onNextChapter();
            }
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-t2 transition-[width] duration-100"
            style={{ width: `${progress * 100}%` }}
          />
          {chapterMarkers.map((pos, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-2 rounded-full bg-bd-strong"
              style={{ left: `${pos * 100}%` }}
            />
          ))}
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2 px-3 pb-1">
          <button
            onClick={onPrevChapter}
            disabled={!step || step.chapter === 0}
            className="w-7 h-7 flex items-center justify-center rounded-full text-t3 hover:text-t1 hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
            title="上一章节"
          >◀◀</button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors shadow-sm text-sm font-bold bg-t1 text-base hover:opacity-80"
            title={isEnded ? "重播" : isPlaying ? "暂停" : "继续"}
          >
            {isPlaying ? "⏸" : isEnded ? "↺" : "▶"}
          </button>

          <button
            onClick={onNextChapter}
            disabled={!step || step.chapter >= totalChapters - 1}
            className="w-7 h-7 flex items-center justify-center rounded-full text-t3 hover:text-t1 hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
            title="下一章节"
          >▶▶</button>

          {hasTiming && (
            <span className="text-xs text-t2 tabular-nums font-mono shrink-0">
              {fmtSec(elapsed)} / {fmtSec(totalDuration!)}
            </span>
          )}

          <span className="flex-1" />

          {/* Speed */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-t3 tabular-nums w-7 text-right font-mono">
              {speed % 1 === 0 ? `${speed}x` : `${speed.toFixed(1)}x`}
            </span>
            <input
              type="range" min={0.5} max={3} step={0.05} value={speed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              onDoubleClick={() => onSpeedChange(1)}
              title={`速度 ${speed}x（双击重置）`}
              className="w-14 h-1 appearance-none rounded-full cursor-pointer"
              style={{ background: `linear-gradient(to right, var(--text-2) ${((speed - 0.5) / 2.5) * 100}%, var(--bg-surface-3) ${((speed - 0.5) / 2.5) * 100}%)` }}
            />
          </div>
        </div>

        {/* Chapter timeline (shown when chapters are available) */}
        {hasChapterTimeline && (
          <div className="px-3 pb-2 pt-0.5">
            <div className="flex gap-1 items-end">
              {chapters.map((ch, chIdx) => {
                const isActive = chIdx === (step?.chapter ?? -1);
                const maxStep = chapterStepCounts[chIdx] ?? 0;
                const stepCount = maxStep + 1;
                const stepProgress = isActive ? (step!.step) / Math.max(1, stepCount - 1) : 0;

                return (
                  <div
                    key={ch.id}
                    className="flex-1 flex flex-col gap-0.5 cursor-pointer group"
                    onClick={() => onSeekToStep!(chIdx, 0)}
                    title={ch.title || ch.id}
                  >
                    {/* Chapter block with step progress fill */}
                    <div className={`relative h-5 rounded-sm overflow-hidden transition-all ${
                      isActive
                        ? "bg-surface3 ring-1 ring-[var(--border-strong)]"
                        : "bg-surface2 hover:bg-surface3"
                    }`}>
                      {/* Step progress bar inside active chapter */}
                      {isActive && stepCount > 1 && (
                        <div
                          className="absolute inset-y-0 left-0 bg-t3 transition-[width] duration-150"
                          style={{ width: `${stepProgress * 100}%` }}
                        />
                      )}
                      {/* Step dots */}
                      <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-1">
                        {Array.from({ length: Math.min(stepCount, 8) }, (_, sIdx) => {
                          const isActiveStep = isActive && sIdx === step!.step;
                          return (
                            <button
                              key={sIdx}
                              onClick={(e) => { e.stopPropagation(); onSeekToStep!(chIdx, sIdx); }}
                              className={`rounded-full transition-all shrink-0 ${
                                isActiveStep
                                  ? "w-2 h-2 bg-t1"
                                  : isActive
                                  ? "w-1 h-1 bg-t2 hover:bg-t1"
                                  : "w-1 h-1 bg-t4 hover:bg-t3"
                              }`}
                              title={`第 ${sIdx + 1} 步`}
                            />
                          );
                        })}
                        {stepCount > 8 && (
                          <span className="text-[8px] text-t4 ml-0.5">+{stepCount - 8}</span>
                        )}
                      </div>
                    </div>
                    {/* Chapter label */}
                    <span className={`text-[9px] truncate text-center leading-tight transition-colors ${
                      isActive ? "text-t2" : "text-t4 group-hover:text-t3"
                    }`}>
                      {chIdx + 1}. {ch.title || ch.id}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Step info */}
            {step && (
              <div className="text-center text-[9px] text-t4 mt-0.5">
                Ch.{step.chapter + 1} {step.chapterTitle} · Step {step.step + 1}
                {!isPlaying && " · 双击画面编辑"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
