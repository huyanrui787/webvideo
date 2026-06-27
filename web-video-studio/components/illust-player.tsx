"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { IllustEditModal } from "./illust-edit-modal";
import { BoneCharacter, buildTimelineFromTts, type ActionKeyframe } from "./bone-character";

// ─── Types ────────────────────────────────────────────────────────────────

interface TimelineSegment {
  chapterId: string;
  stepIdx: number;
  illustration: string;
  narration?: string;
  durationSec: number;
  kenBurns?: { scale: number; panX: number; panY: number };
  mp3Path?: string;
  mp3Url?: string; // resolved audio URL for the browser
  /** @deprecated use imageStatus */
  status?: string;
  imageStatus?: "done" | "error" | "pending";
  /** Error message when imageStatus === "error" */
  error?: string;
}

interface IllustPlayerProps {
  /** Base URL to resolve illustration paths, e.g. /api/projects/{id}/assets/illustrations/ */
  assetBase?: string;
  /** Optional audio base, e.g. /api/projects/{id}/audio/ */
  audioBase?: string;
  timeline?: TimelineSegment[];
  /** Alternative: pass projectId and component fetches data itself */
  projectId?: string;
  /** Called when user clicks retry on a failed shot */
  onRetryShot?: (stepIdx: number) => void;
}

type PlayerState = "idle" | "playing" | "paused" | "ended";

// ─── Ken Burns CSS helpers ────────────────────────────────────────────────

const KB_PRESETS = {
  off: { scale: 1.0, panX: 0, panY: 0 },
  subtle: { scale: 1.03, panX: 0, panY: 0 },
  moderate: { scale: 1.06, panX: -15, panY: -10 },
  dramatic: { scale: 1.10, panX: -40, panY: -25 },
};

function buildKenBurnsStyle(
  kb: { scale: number; panX: number; panY: number } | undefined,
  durationSec: number,
): React.CSSProperties {
  const s = kb && (kb.scale > 1.0 || kb.panX !== 0 || kb.panY !== 0) ? kb : KB_PRESETS.subtle;
  return {
    animationName: "kb-zoompan",
    animationDuration: `${durationSec}s`,
    animationTimingFunction: "linear",
    animationFillMode: "forwards",
    // CSS custom properties read by the keyframe
    ["--kb-scale"]: s.scale,
    ["--kb-pan-x"]: `${s.panX}px`,
    ["--kb-pan-y"]: `${s.panY}px`,
  } as React.CSSProperties;
}

// ─── Placeholder component for failed images ──────────────────────────────

function FailedPlaceholder({
  error,
  stepIdx,
  onRetry,
}: {
  error?: string;
  stepIdx: number;
  onRetry?: () => void;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-800/80 gap-3 p-6">
      <div className="w-12 h-12 rounded-full bg-red-900/40 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <span className="text-white/50 text-xs text-center max-w-[80%]">
        插图生成失败
      </span>
      {error && (
        <span className="text-white/30 text-[10px] text-center max-w-[80%] leading-tight">
          {error.length > 80 ? error.slice(0, 80) + "…" : error}
        </span>
      )}
      {onRetry && (
        <button
          onClick={(e) => { e.stopPropagation(); onRetry(); }}
          className="text-[11px] text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
        >
          重新生成
        </button>
      )}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export function IllustPlayer({ assetBase: assetBaseProp, audioBase, timeline: timelineProp, projectId, onRetryShot }: IllustPlayerProps) {
  const [fetchedTimeline, setFetchedTimeline] = useState<TimelineSegment[]>([]);
  const [retrying, setRetrying] = useState<Set<number>>(new Set());
  const [editModalOpen, setEditModalOpen] = useState(false);
  const fetchedTimelineRef = useRef<TimelineSegment[]>([]);
  const assetBase = assetBaseProp || (projectId ? `/api/projects/${projectId}/assets/illustrations` : "");
  const resolvedAudioBase = audioBase || (projectId ? `/api/projects/${projectId}/audio` : "");
  const timeline = timelineProp || fetchedTimeline;

  // ─── Bone character skeleton loading ────────────────────────────────────
  const [skeletonCache, setSkeletonCache] = useState<Record<string, any>>({});
  const [boneTimeline, setBoneTimeline] = useState<ActionKeyframe[]>([]);

  function partsBaseUrl(illustration: string): string {
    const fileName = illustration.split("/").pop() ?? illustration;
    const stem = fileName.replace(/\.png$/i, "");
    return `${assetBase}/parts/${encodeURIComponent(stem)}`;
  }

  async function tryLoadSkeleton(illustration: string) {
    if (!illustration || !projectId) return null;
    const cacheKey = illustration;
    if (skeletonCache[cacheKey]) return skeletonCache[cacheKey];

    // Extract just the filename stem (handle full URLs, relative paths, etc.)
    const fileName = illustration.split("/").pop() ?? illustration;
    const stem = fileName.replace(/\.png$/i, "");
    const url = `/api/projects/${projectId}/files?path=assets/illustrations/parts/${encodeURIComponent(stem)}/skeleton.json`;
    try {
      const r = await fetch(url);
      if (!r.ok) return null;
      const data = await r.json();
      setSkeletonCache((prev) => ({ ...prev, [cacheKey]: data }));
      return data;
    } catch {
      return null;
    }
  }

  function imgUrl(illustration: string): string {
    if (!illustration) return "";
    if (illustration.startsWith("/") || illustration.startsWith("http")) return illustration;
    return `${assetBase}/${encodeURIComponent(illustration)}`;
  }

  const [progressiveMode, setProgressiveMode] = useState(false);

  // Fetch timeline when projectId is provided
  useEffect(() => {
    if (!projectId || timelineProp) return;
    let active = true;
    let pollTimer: ReturnType<typeof setInterval>;

    async function tryLoadManifest(): Promise<boolean> {
      const res = await fetch(`/api/projects/${projectId}/files?path=manifest.json`);
      if (!res.ok) return false;
      const data = await res.json();
      if (!data?.content || !active) return false;
      try {
        const manifest = JSON.parse(data.content);
        const steps = manifest.steps ?? [];
        if (steps.length > 0) {
          const tl = steps.map((s: any) => ({
            chapterId: s.chapterId || "",
            stepIdx: s.index ?? s.stepIdx ?? 0,
            illustration: s.image || "",
            narration: s.text || "",
            durationSec: s.durationSec || 5,
            mp3Url: s.audio || undefined,
            mp3Path: s.mp3Path || undefined,
            imageStatus: s.imageStatus || (s.image ? "done" : undefined),
            error: s.error || undefined,
          }));
          setFetchedTimeline(tl);
          fetchedTimelineRef.current = tl;
          setProgressiveMode(false);
          return true;
        }
      } catch {}
      return false;
    }

    async function tryLoadTimeline(): Promise<boolean> {
      const res = await fetch(`/api/projects/${projectId}/files?path=illust-timeline.json`);
      if (!res.ok) return false;
      const data = await res.json();
      if (!data?.content || !active) return false;
      try {
        const tl = JSON.parse(data.content);
        const entries = tl.timeline ?? [];
        if (entries.length > 0) {
          const tl = entries.map((e: any) => ({
            chapterId: e.chapterId || "",
            stepIdx: e.stepIdx || 0,
            illustration: e.assetUrl || "",
            narration: e.narration || "",
            durationSec: e.durationSec || 5,
            mp3Path: e.mp3Path || undefined,
            mp3Url: e.mp3Url || undefined,
            imageStatus: e.status === "error" ? "error" : (e.assetUrl ? "done" : undefined),
            error: e.error || undefined,
          }));
          setFetchedTimeline(tl);
          fetchedTimelineRef.current = tl;
          setProgressiveMode(false);
          return true;
        }
      } catch {}
      return false;
    }

    async function loadProgressive() {
      // Try to load illustration files directly from assets API
      const assetsRes = await fetch(`/api/projects/${projectId}/assets`);
      if (!assetsRes.ok || !active) return;
      const assets = await assetsRes.json();
      // Filter for illustration images (step-NN.png or step-NN-xxx.png for legacy files)
      const illustAssets = (assets as any[])
        .filter((a: any) => {
          const name = a.name || a.originalName || "";
          const basename = name.split("/").pop() || name;
          return basename.endsWith(".png") && /^step-\d+/.test(basename);
        })
        .sort((a: any, b: any) => {
          const extractNum = (n: string) => {
            const basename = n.split("/").pop() || n;
            const m = basename.match(/^step-(\d+)/);
            return m ? parseInt(m[1], 10) : 0;
          };
          return extractNum(a.name || "") - extractNum(b.name || "");
        });

      if (illustAssets.length > 0 && active) {
        // Only update if count changed (avoid restarting audio by re-setting same timeline)
        const currentCount = fetchedTimelineRef.current.length;
        if (illustAssets.length === currentCount && progressiveMode) return;

        // Load narration text from script.md for subtitles
        let narrations: string[] = [];
        try {
          const scriptRes = await fetch(`/api/projects/${projectId}/files?path=script.md`);
          if (scriptRes.ok) {
            const scriptData = await scriptRes.json();
            if (scriptData?.content) {
              narrations = scriptData.content
                .split("---")
                .map((s: string) => s.trim().replace(/^\[.*?\]\s*/, "").trim())
                .filter(Boolean);
            }
          }
        } catch {}

        // Map by step number from filename, not array index.
        // Filename "step-03.png" → stepNum=3 → stepIdx=2, narration[2], audio step/3.mp3
        const extractStepNum = (name: string) => {
          const basename = (name || "").split("/").pop() || "";
          const m = basename.match(/^step-(\d+)/);
          return m ? parseInt(m[1], 10) : 0;
        };

        setFetchedTimeline(
          fetchedTimelineRef.current = illustAssets.map((a: any, i: number) => {
            const stepNum = extractStepNum(a.name || a.originalName || "");
            const stepIdx = stepNum > 0 ? stepNum - 1 : i; // fallback to positional
            return {
              chapterId: "",
              stepIdx,
              illustration: a.url || "",
              narration: narrations[stepIdx] || "",
              durationSec: 5,
              mp3Url: `/api/projects/${projectId}/audio/step/${stepIdx + 1}.mp3`,
              imageStatus: "done" as const,
            };
          })
        );
        setProgressiveMode(true);
      }
    }

    // Main fetch logic
    tryLoadManifest().then((found) => {
      if (found || !active) return;
      tryLoadTimeline().then((found2) => {
        if (found2 || !active) return;
        // Neither manifest nor timeline — try progressive loading from assets
        loadProgressive().catch(() => {});
        // Poll for manifest every 5s
        pollTimer = setInterval(async () => {
          if (!active) { clearInterval(pollTimer); return; }
          const mFound = await tryLoadManifest();
          if (mFound) { clearInterval(pollTimer); return; }
          const tFound = await tryLoadTimeline();
          if (tFound) { clearInterval(pollTimer); return; }
          // Also refresh progressive count (new images may have been generated)
          loadProgressive().catch(() => {});
        }, 5000);
      });
    });

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [projectId, timelineProp]);

  const [state, setState] = useState<PlayerState>("idle");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0); // seconds from start
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Build cumulative start times lookup
  const lookup = useMemo(() => {
    const starts: number[] = [];
    let cursor = 0;
    for (const seg of timeline) {
      starts.push(cursor);
      cursor += seg.durationSec;
    }
    return { starts, totalDuration: cursor };
  }, [timeline]);

  const totalDuration = lookup.totalDuration;

  // Find which segment contains a given time
  const findSegment = useCallback(
    (t: number) => {
      for (let i = lookup.starts.length - 1; i >= 0; i--) {
        if (t >= lookup.starts[i]) return { index: i, progress: t - lookup.starts[i] };
      }
      return { index: 0, progress: 0 };
    },
    [lookup]
  );

  // ─── Playback: advance when audio ends, fallback to timer ─────────────

  const advanceRef = useRef<() => void>(() => {});
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timelineLenRef = useRef(timeline.length);
  timelineLenRef.current = timeline.length;

  const advance = useCallback(() => {
    setCurrentIdx(prev => {
      const next = prev + 1;
      if (next >= timelineLenRef.current) { setState("ended"); return prev; }
      return next;
    });
  }, []);

  advanceRef.current = advance;

  // Audio-driven: play when currentIdx changes, advance on ended
  const currentAudio = useMemo(() => {
    const seg = timeline[currentIdx];
    if (!seg) return null;
    // Even if image failed, audio still plays normally
    if (seg.mp3Url) return seg.mp3Url;
    if (seg.mp3Path) {
      if (seg.mp3Path.startsWith("/")) return seg.mp3Path;
      return resolvedAudioBase ? `${resolvedAudioBase}/${seg.mp3Path}` : null;
    }
    return null;
  }, [timeline, currentIdx, resolvedAudioBase]);

  useEffect(() => {
    if (state !== "playing") return;

    // Clear any pending fallback timer from previous effect
    if (advanceTimerRef.current) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null; }

    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }

    const audioUrl = currentAudio;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      const onEnded = () => advanceRef.current();
      audio.addEventListener("ended", onEnded, { once: true });
      audio.preload = "metadata";

      audio.play().catch(() => {
        const onMeta = () => {
          const dur = (typeof audio.duration === "number" && isFinite(audio.duration) && audio.duration > 0)
            ? audio.duration
            : 5;
          advanceTimerRef.current = setTimeout(() => advanceRef.current(), dur * 1000);
        };
        if (audio.readyState >= 1) onMeta();
        else audio.addEventListener("loadedmetadata", onMeta, { once: true });
      });

      return () => {
        audio.removeEventListener("ended", onEnded);
        audio.pause(); audio.src = "";
        audioRef.current = null;
        if (advanceTimerRef.current) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null; }
      };
    } else {
      const seg = timeline[currentIdx];
      advanceTimerRef.current = setTimeout(() => advanceRef.current(), (seg?.durationSec || 5) * 1000);
      return () => { if (advanceTimerRef.current) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null; } };
    }
  }, [currentAudio, state, currentIdx]);

  // RAF for progress bar only (visual, not controlling)
  useEffect(() => {
    if (state !== "playing") return;
    const tick = () => {
      setElapsed(prev => prev + 0.033);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [state]);

  // ─── Retry handler ────────────────────────────────────────────────────

  const handleRetry = useCallback(async (stepIdx: number) => {
    if (retrying.has(stepIdx)) return;
    setRetrying(prev => new Set(prev).add(stepIdx));

    if (onRetryShot) {
      onRetryShot(stepIdx);
    } else if (projectId) {
      // Regenerate single shot via API
      try {
        await fetch(`/api/projects/${projectId}/gen-ill`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepIdx }),
        });
        // Refresh timeline after retry
        window.dispatchEvent(new CustomEvent("assets-changed"));
        window.location.reload(); // Simplest: reload to show new image
      } catch (err) {
        console.error("Retry failed:", err);
      }
    }

    setRetrying(prev => { const next = new Set(prev); next.delete(stepIdx); return next; });
  }, [retrying, onRetryShot, projectId]);

  // ─── Controls ───────────────────────────────────────────────────────

  function play() {
    if (state === "ended") {
      setCurrentIdx(0);
      setElapsed(0);
      pausedAtRef.current = 0;
    }
    startTimeRef.current = performance.now() - pausedAtRef.current * 1000;
    setState("playing");
  }

  function pause() {
    pausedAtRef.current = elapsed;
    setState("paused");
    if (audioRef.current) audioRef.current.pause();
  }

  function seek(t: number) {
    const clamped = Math.max(0, Math.min(t, totalDuration));
    setElapsed(clamped);
    const seg = findSegment(clamped);
    setCurrentIdx(seg.index);
    if (state === "paused" || state === "ended") {
      pausedAtRef.current = clamped;
    } else {
      startTimeRef.current = performance.now() - clamped * 1000;
    }
  }

  // ─── Current segment ────────────────────────────────────────────────

  const seg = timeline[currentIdx];
  const segProgress = seg
    ? (elapsed - lookup.starts[currentIdx]) / seg.durationSec
    : 0;
  const subtitle = seg?.narration ?? "";
  const kbStyle = seg ? buildKenBurnsStyle(seg.kenBurns, seg.durationSec) : undefined;
  const isFailed = seg?.imageStatus === "error" || (!seg?.illustration && (seg as any)?.status === "error");
  const isRetryingThis = seg && retrying.has(seg.stepIdx);

  // ── Bone character state ──────────────────────────────────────────────
  const [boneSkeleton, setBoneSkeleton] = useState<any>(null);
  const boneSegRef = useRef<string>("");

  // Load skeleton when segment changes
  useEffect(() => {
    if (!seg?.illustration) return;
    const key = seg.illustration;
    if (key === boneSegRef.current) return;
    boneSegRef.current = key;
    setBoneSkeleton(null); // reset while loading
    tryLoadSkeleton(key).then((skel) => {
      if (boneSegRef.current === key) {
        setBoneSkeleton(skel);
      }
    });
  }, [seg?.illustration]);

  const showBoneChar = boneSkeleton && seg && !isFailed;

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <>
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-3">
      {/* Stage */}
      <div className="relative w-full bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {/* Empty state */}
        {timeline.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-white/60 text-sm">
            暂无插图，等待 AI 规划…
          </div>
        )}

        {/* Current image — BoneCharacter (tier 1) or Ken Burns (tier 2) */}
        {seg && !isFailed && seg.illustration && (
          <div className="absolute inset-0 overflow-hidden">
            {showBoneChar ? (
              <BoneCharacter
                key={`bone-${seg.chapterId}-${seg.stepIdx}`}
                partsBaseUrl={partsBaseUrl(seg.illustration)}
                skeleton={boneSkeleton}
                currentTime={elapsed - lookup.starts[currentIdx]}
                timeline={boneTimeline.length > 0 ? boneTimeline : undefined}
                width={1280}
                className="w-full h-full"
              />
            ) : (
              <>
                {seg.illustration.endsWith(".mp4") ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <video
                    key={`${seg.chapterId}-${seg.stepIdx}`}
                    src={imgUrl(seg.illustration)}
                    className="w-full h-full object-cover"
                    style={kbStyle}
                    muted
                    playsInline
                  />
                ) : (
                  <>
                    <style>{`
                      @keyframes kb-zoompan {
                        from { transform: scale(1.0) translate(0, 0); }
                        to   { transform: scale(var(--kb-scale, 1.03)) translate(var(--kb-pan-x, 0), var(--kb-pan-y, 0)); }
                      }
                    `}</style>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      key={`${seg.chapterId}-${seg.stepIdx}`}
                      src={imgUrl(seg.illustration)}
                      alt={seg.narration ?? `step ${seg.stepIdx + 1}`}
                      className="w-full h-full object-cover"
                      style={kbStyle}
                    />
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Failed image placeholder */}
        {seg && isFailed && (
          <FailedPlaceholder
            error={seg.error}
            stepIdx={seg.stepIdx}
            onRetry={() => handleRetry(seg.stepIdx)}
          />
        )}

        {/* Retrying overlay */}
        {isRetryingThis && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <span className="text-white/60 text-xs">重新生成中…</span>
            </div>
          </div>
        )}

        {/* Progressive generating badge */}
        {progressiveMode && timeline.length > 0 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
            <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2.5 py-1 rounded-full backdrop-blur-sm">
              生图中 · {timeline.length} 张
            </span>
          </div>
        )}

        {/* Subtitle overlay — always show even for failed images */}
        {subtitle && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-[80%] text-center">
            <span className="bg-black/60 text-white text-sm px-4 py-2 rounded-lg leading-relaxed">
              {subtitle}
            </span>
          </div>
        )}

        {/* Play overlay (idle state) */}
        {state === "idle" && timeline.length > 0 && (
          <button
            onClick={play}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-900 ml-1">
                <polygon points="6,3 20,12 6,21"/>
              </svg>
            </div>
          </button>
        )}

        {/* Ended overlay */}
        {state === "ended" && (
          <button
            onClick={play}
            className="absolute inset-0 flex items-center justify-center bg-black/40"
          >
            <span className="text-white text-sm font-medium bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
              重新播放
            </span>
          </button>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-3 px-1">
        {/* Play/Pause */}
        <button
          onClick={state === "playing" ? pause : play}
          className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-700 transition-colors shrink-0"
        >
          {state === "playing" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <rect x="5" y="4" width="5" height="16" rx="1"/>
              <rect x="14" y="4" width="5" height="16" rx="1"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" className="ml-0.5">
              <polygon points="6,3 20,12 6,21"/>
            </svg>
          )}
        </button>

        {/* Progress bar */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 w-10 text-right tabular-nums font-mono">
            {formatTime(elapsed)}
          </span>
          <input
            type="range"
            min={0}
            max={totalDuration || 1}
            step={0.1}
            value={elapsed}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-zinc-900"
          />
          <span className="text-[11px] text-zinc-400 w-10 tabular-nums font-mono">
            {formatTime(totalDuration)}
          </span>
        </div>

        {/* Segment indicator */}
        {timeline.length > 0 && (
          <span className="text-[11px] text-zinc-400 tabular-nums font-mono shrink-0">
            {currentIdx + 1}/{timeline.length}
          </span>
        )}
      </div>

      {/* Thumbnail strip + Edit button */}
      <div className="flex items-center gap-1.5 pb-1 min-h-0">
        <div className="flex gap-1.5 overflow-x-auto flex-1">
          {timeline.map((s, i) => {
            const isFailedThumb = s.imageStatus === "error" || (!s.illustration && (s as any).status === "error");
            return (
              <button
                key={i}
                onClick={() => seek(lookup.starts[i])}
                className={`shrink-0 w-16 h-10 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === currentIdx ? "border-zinc-900" : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                {isFailedThumb ? (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </div>
                ) : s.illustration ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imgUrl(s.illustration)}
                    alt={`${s.chapterId} step ${s.stepIdx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-900" />
                )}
              </button>
            );
          })}
        </div>
        {timeline.length > 0 && (
          <button
            onClick={() => setEditModalOpen(true)}
            className="shrink-0 flex items-center gap-1 px-2.5 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>编辑</span>
          </button>
        )}
      </div>
    </div>

    {/* Edit modal */}
    {editModalOpen && (
      <IllustEditModal
        timeline={timeline}
        assetBase={assetBase}
        audioBase={resolvedAudioBase}
        projectId={projectId || ""}
        onClose={() => setEditModalOpen(false)}
      />
    )}
    </>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
