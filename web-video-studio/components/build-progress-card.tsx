"use client";

import { useEffect, useState, useCallback } from "react";
import type { ChapterProgress } from "./chapter-progress-panel";

// --- Types ---

type BuildPhase = "building" | "done" | "mixed";

interface BuildProgressCardProps {
  chapters: ChapterProgress[];
  onRebuildChapter?: (chapterId: string) => void;
}

// --- Status config ---

const STATUS_CFG: Record<
  ChapterProgress["status"],
  { label: string; dotColor: string; textColor: string }
> = {
  pending: {
    label: "排队中",
    dotColor: "bg-[var(--border)]",
    textColor: "text-t4",
  },
  building: {
    label: "构建中",
    dotColor: "bg-blue-400",
    textColor: "text-t2",
  },
  review: {
    label: "待验收",
    dotColor: "bg-amber-400",
    textColor: "text-t2",
  },
  done: {
    label: "已完成",
    dotColor: "bg-emerald-400",
    textColor: "text-t2",
  },
  error: {
    label: "失败",
    dotColor: "bg-red-400",
    textColor: "text-red-400",
  },
  validating: {
    label: "验证中",
    dotColor: "bg-purple-400",
    textColor: "text-t2",
  },
  skipped: {
    label: "已跳过",
    dotColor: "bg-[var(--border)]",
    textColor: "text-t4",
  },
  timeout: {
    label: "超时",
    dotColor: "bg-orange-400",
    textColor: "text-orange-400",
  },
};

// --- Sub-components ---

function ShimmerBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 rounded-full bg-surface2 overflow-hidden relative">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 bg-[length:200%_100%] animate-shimmer-bar transition-[width] duration-700 ease-out"
        style={{ width: `${Math.max(pct, 2)}%` }}
      />
    </div>
  );
}

function SpinningDot() {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
    </span>
  );
}

function DoneDot() {
  return (
    <span className="w-2 h-2 shrink-0 rounded-full bg-emerald-400 flex items-center justify-center">
      <svg
        width="8"
        height="8"
        viewBox="0 0 8 8"
        fill="none"
        className="text-white"
      >
        <polyline
          points="1.5,4 3.5,6 6.5,2"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function ErrorDot() {
  return (
    <span className="w-2 h-2 shrink-0 rounded-full bg-red-400 flex items-center justify-center text-[7px] font-bold text-white leading-none">
      !
    </span>
  );
}

// --- Main ---

export function BuildProgressCard({ chapters, onRebuildChapter }: BuildProgressCardProps) {
  const [visible, setVisible] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((id: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Slide-in animation on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (chapters.length === 0) return null;

  // Preflight: waiting for scaffold + outline before build can start
  const isPreflight = chapters.length === 1 && chapters[0].id === "__preflight__";

  const doneCount = chapters.filter((c) => c.status === "done").length;
  const errorCount = chapters.filter((c) => c.status === "review").length;
  const buildingCount = chapters.filter((c) => c.status === "building").length;
  const pct = Math.round((doneCount / chapters.length) * 100);

  let phase: BuildPhase = "building";
  if (doneCount === chapters.length) phase = "done";
  else if (doneCount + errorCount === chapters.length && errorCount > 0)
    phase = "mixed";

  return (
    <div
      className={[
        "mx-3 my-2 rounded-2xl border-2 border-bd bg-base p-4 space-y-3",
        "transition-all duration-500 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      ].join(" ")}
    >
      {/* Preflight: waiting for scaffold + outline */}
      {isPreflight ? (
        <>
          <div className="flex items-center gap-2">
            <span className="text-base">⏳</span>
            <span className="text-sm font-semibold text-t1">
              等待构建环境就绪…
            </span>
          </div>
          <ShimmerBar pct={10} />
          <div className="flex gap-3 text-[11px] text-t3">
            <span>scaffold <span className="text-t1 font-medium">检查中…</span></span>
            <span>outline <span className="text-t1 font-medium">检查中…</span></span>
          </div>
          <p className="text-[11px] text-t4 text-center">
            确认 scaffold 和 outline 就绪后自动开始构建
          </p>
        </>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {phase === "building" ? (
                <>
                  <span className="text-base animate-pulse">⚡</span>
                  <span className="text-sm font-semibold text-t1">后台并行构建中</span>
                </>
              ) : phase === "mixed" ? (
                <>
                  <span className="text-base">⚠️</span>
                  <span className="text-sm font-semibold text-t1">构建完成，有章节需修复</span>
                </>
              ) : (
                <>
                  <span className="text-base">🎉</span>
                  <span className="text-sm font-semibold text-t1">全部构建完成</span>
                </>
              )}
            </div>
            <span className="text-xs font-medium tabular-nums text-t3">{doneCount}/{chapters.length} 章</span>
          </div>

          <ShimmerBar pct={pct} />

          <ul className="space-y-1">
            {chapters.map((ch, idx) => {
              const cfg = STATUS_CFG[ch.status];
              const canRebuild = ch.status === "review" || ch.status === "error" || ch.status === "timeout" || ch.status === "pending";
              const hasErrors = !!ch.tscErrors;
              const isExpanded = expandedChapters.has(ch.id);
              const elapsed = ch.finishedAt && ch.startedAt
                ? `${((ch.finishedAt - ch.startedAt) / 1000).toFixed(0)}s`
                : ch.status === "building" && ch.startedAt
                  ? `${((Date.now() - ch.startedAt) / 1000).toFixed(0)}s`
                  : "";
              return (
                <li key={ch.id}>
                  <div className={["flex items-center gap-2.5 px-2 py-1 -mx-2 rounded-lg transition-colors", ch.status === "building" ? "bg-blue-500/5" : ""].join(" ")}>
                    <span className="shrink-0 flex items-center justify-center w-4 h-4">
                      {ch.status === "building" ? <SpinningDot /> : ch.status === "done" ? <DoneDot /> : ch.status === "review" || ch.status === "error" || ch.status === "timeout" ? <ErrorDot /> : <span className={`w-2 h-2 shrink-0 rounded-full ${cfg.dotColor}`} />}
                    </span>
                    <button
                      onClick={() => hasErrors && toggleExpand(ch.id)}
                      className={`flex-1 text-xs truncate text-left ${hasErrors ? "cursor-pointer hover:underline" : ""} ${cfg.textColor}`}
                    >
                      <span className="tabular-nums text-t4 mr-1">{idx + 1}.</span>
                      {ch.title || ch.id}
                    </button>
                    {canRebuild && onRebuildChapter && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRebuildChapter(ch.id); }}
                        className="shrink-0 w-5 h-5 flex items-center justify-center rounded-md bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 text-[10px] font-bold transition-colors"
                        title={ch.status === "pending" ? `手动构建「${ch.title || ch.id}」` : `重新构建「${ch.title || ch.id}」`}
                      >
                        {ch.status === "pending" ? "▶" : "↻"}
                      </button>
                    )}
                    <span className={["text-[10px] font-medium shrink-0 tabular-nums", ch.status === "building" ? "text-blue-400 animate-pulse" : cfg.textColor].join(" ")}>{cfg.label}{elapsed ? ` ${elapsed}` : ""}</span>
                  </div>
                  {isExpanded && hasErrors && (
                    <pre className="mt-1 mx-2 p-2 bg-red-500/5 border border-red-500/15 rounded-lg text-[10px] text-red-400 font-mono leading-relaxed overflow-x-auto max-h-24 overflow-y-auto whitespace-pre-wrap">
                      {ch.tscErrors}
                    </pre>
                  )}
                </li>
              );
            })}
          </ul>

          {phase === "building" && (
            <p className="text-[11px] text-t4 text-center">Coding 模型正在后台并发生成代码</p>
          )}
          {phase === "done" && (
            <p className="text-[11px] text-emerald-500/70 text-center">TypeScript 验证通过 · 可逐章验收预览</p>
          )}
          {phase === "mixed" && (
            <div className="space-y-2">
              <p className="text-[11px] text-amber-500/70 text-center">失败章节的 tsc 错误已注入对话，等待 Agent 修复</p>
              {onRebuildChapter && (
                <button
                  onClick={() => {
                    chapters.filter(c => c.status === "review" || c.status === "error" || c.status === "timeout")
                      .forEach(c => onRebuildChapter(c.id));
                  }}
                  className="w-full py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium transition-colors"
                >
                  一键重试全部失败章节
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
