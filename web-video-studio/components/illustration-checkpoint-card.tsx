"use client";

import { useEffect, useRef, useState } from "react";
import type { ShotItem } from "@/app/api/projects/[id]/illustrate/route";

export interface IllustrationResult {
  id: string;
  chapterId: string;
  stepHint: string;
  coreIdea: string;
  filename: string;
  assetUrl: string;
}

interface IllustrationCheckpointCardProps {
  projectId: string;
  shotList: ShotItem[] | undefined;
  onConfirmed: (illustrations: IllustrationResult[]) => void;
  onSkipped: () => void;
}

type ShotStatus = "pending" | "generating" | "done" | "error";

interface ShotState {
  shot: ShotItem;
  status: ShotStatus;
  assetUrl?: string;
  filename?: string;
  error?: string;
}

export function IllustrationCheckpointCard({
  projectId,
  shotList,
  onConfirmed,
  onSkipped,
}: IllustrationCheckpointCardProps) {
  const [phase, setPhase] = useState<"generating" | "done" | "error">("generating");
  const [shots, setShots] = useState<ShotState[]>(
    (shotList ?? []).map((shot) => ({ shot, status: "pending" }))
  );
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const startedRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track successful shots across retries so retrying failed ones doesn't lose successes
  const doneShotsRef = useRef<Map<string, ShotState>>(new Map());
  const isFirstCompletionRef = useRef(true);

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  useEffect(() => () => stopPolling(), []);

  async function startGeneration() {
    const res = await fetch(`/api/projects/${projectId}/illustrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shotList }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn("illustrate POST failed:", err);
    }
    if (!pollRef.current) {
      pollRef.current = setInterval(pollStatus, 2500);
    }
  }

  // 组件挂载时自动触发生图（无需用户点按钮）
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pollStatus() {
    const res = await fetch(`/api/projects/${projectId}/illustrate`);
    if (!res.ok) return;
    const job = await res.json() as {
      status: string;
      shots: Array<{ shot: ShotItem; status: ShotStatus; assetUrl?: string; filename?: string; error?: string }>;
    };

    // Cache any newly-completed shots
    for (const s of job.shots) {
      if (s.status === "done" && s.assetUrl && s.filename) {
        doneShotsRef.current.set(s.shot.id, {
          shot: s.shot,
          status: "done" as ShotStatus,
          assetUrl: s.assetUrl,
          filename: s.filename,
        });
      }
    }

    // Merge incoming shots with cached successes from previous runs (retry scenario)
    setShots((prev) => {
      const incomingIds = new Set(job.shots.map((s) => s.shot.id));
      const cachedDone = Array.from(doneShotsRef.current.values());
      const kept = isFirstCompletionRef.current
        ? []
        : cachedDone.filter((cs) => !incomingIds.has(cs.shot.id));
      return [
        ...kept,
        ...job.shots.map((s) => ({
          shot: s.shot,
          status: s.status as ShotStatus,
          assetUrl: s.assetUrl,
          filename: s.filename,
          error: s.error,
        })),
      ];
    });

    if (job.status === "done") {
      stopPolling();
      const allError = job.shots.every((s) => s.status === "error");
      setPhase(allError ? "error" : "done");

      if (!allError) {
        const illustrations: IllustrationResult[] = Array.from(doneShotsRef.current.values())
          .map((s) => ({
            id: s.shot.id,
            chapterId: s.shot.chapterId,
            stepHint: s.shot.stepHint,
            coreIdea: s.shot.coreIdea,
            filename: s.filename!,
            assetUrl: s.assetUrl!,
          }));

        if (isFirstCompletionRef.current) {
          isFirstCompletionRef.current = false;
          onConfirmed(illustrations);
        }
      }
    }
  }

  async function handleRetry() {
    startedRef.current = false;
    // Retry all shots (used when ALL failed)
    doneShotsRef.current = new Map();
    isFirstCompletionRef.current = true;
    setPhase("generating");
    setShots((shotList ?? []).map((shot) => ({ shot, status: "pending" })));
    await startGeneration();
  }

  async function handleRetryFailed() {
    const failedShots = shots.filter((s) => s.status === "error").map((s) => s.shot);
    if (failedShots.length === 0) return;

    setPhase("generating");
    startedRef.current = false;

    // Mark failed as pending inline
    setShots((prev) =>
      prev.map((s) =>
        s.status === "error" ? { ...s, status: "pending" as ShotStatus, error: undefined } : s
      )
    );

    const res = await fetch(`/api/projects/${projectId}/illustrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shotList: failedShots }),
    });
    if (!res.ok) {
      console.warn("retry failed shots POST failed");
    }
    if (!pollRef.current) {
      pollRef.current = setInterval(pollStatus, 2500);
    }
  }

  const doneCount = shots.filter((s) => s.status === "done").length;
  const errorCount = shots.filter((s) => s.status === "error").length;
  const hasRetryableErrors = phase === "done" && errorCount > 0;

  const total = shotList?.length ?? 0;
  const pct = total > 0 ? (doneCount / total) * 100 : 0;

  return (
    <>
      <div className="mx-3 my-2 rounded-2xl border-2 border-bd bg-base overflow-hidden">
        {/* Animated progress bar at top */}
        {phase === "generating" && (
          <div className="w-full h-1 bg-surface2">
            <div
              className="h-full transition-all duration-700 ease-out rounded-r-full"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #f59e0b)",
                backgroundSize: "200% 100%",
                animation: "illustration-bar-shimmer 1.5s ease-in-out infinite",
              }}
            />
          </div>
        )}

        <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-t1">
            插图规划 · {total} 张
          </span>
          {phase === "generating" && (
            <span className="ml-auto text-xs font-medium bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
              {doneCount}/{total} 生成中…
            </span>
          )}
          {phase === "done" && (
            <span className="ml-auto text-xs text-green-600 font-medium">
              {doneCount} 张完成{errorCount > 0 ? ` · ${errorCount} 张失败` : ""}
            </span>
          )}
          {phase === "error" && (
            <span className="ml-auto text-xs text-red-500 font-medium">
              生成失败
            </span>
          )}
        </div>

        {/* Shot list */}
        <div className="space-y-2">
          {shots.map((s, i) => {
            const canClick = s.status === "done" && !!s.assetUrl;
            return (
              <div
                key={s.shot.id}
                className="flex gap-3 bg-modal rounded-xl border border-bd p-3"
              >
                {/* Thumbnail / status indicator */}
                <div
                  className={`w-16 h-10 rounded-lg shrink-0 overflow-hidden border border-bd bg-base flex items-center justify-center ${canClick ? "cursor-zoom-in" : ""}`}
                  onClick={canClick ? () => setLightboxUrl(s.assetUrl!) : undefined}
                >
                  {s.status === "done" && s.assetUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.assetUrl}
                      alt={s.shot.theme}
                      className="w-full h-full object-cover"
                    />
                  ) : s.status === "generating" ? (
                    <span className="text-[10px] text-t3 animate-pulse font-mono">
                      ⚙ {i + 1}
                    </span>
                  ) : s.status === "error" ? (
                    <span className="text-[10px] text-red-400">✕</span>
                  ) : (
                    <span className="text-[10px] text-t4 font-mono">{String(i + 1).padStart(2, "0")}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-surface2 text-t3 border-bd">
                      {s.shot.structure}
                    </span>
                    <span className="text-[10px] text-t3 truncate">
                      {s.shot.chapterId} · {s.shot.stepHint}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-t1 truncate">{s.shot.theme}</p>
                  <p className="text-[11px] text-t3 truncate mt-0.5">{s.shot.coreIdea}</p>
                </div>

              </div>
            );
          })}
        </div>

        {/* Actions */}
        {hasRetryableErrors && (
          <button
            onClick={handleRetryFailed}
            className="w-full rounded-xl bg-t1 py-2.5 text-sm font-medium text-base hover:opacity-90 transition-opacity"
          >
            重试失败 {errorCount} 张
          </button>
        )}
        {phase === "error" && (
          <button
            onClick={handleRetry}
            className="w-full rounded-xl bg-t1 py-2.5 text-sm font-medium text-base hover:opacity-90 transition-opacity"
          >
            重试全部
          </button>
        )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="插图预览"
            className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
