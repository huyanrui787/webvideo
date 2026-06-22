"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

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
}

interface IllustPlayerProps {
  /** Base URL to resolve illustration paths, e.g. /api/projects/{id}/assets/illustrations/ */
  assetBase: string;
  /** Optional audio base, e.g. /api/projects/{id}/audio/ */
  audioBase?: string;
  timeline: TimelineSegment[];
  /** Optional: external subtitle array overrides timeline narrations */
  subtitles?: string[];
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

// ─── Component ─────────────────────────────────────────────────────────────

export function IllustPlayer({ assetBase, audioBase, timeline }: IllustPlayerProps) {
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

  // ─── Playback loop ──────────────────────────────────────────────────

  useEffect(() => {
    if (state !== "playing") return;

    const tick = () => {
      const now = performance.now();
      const elapsedSec = (now - startTimeRef.current) / 1000;
      setElapsed(elapsedSec);

      const seg = findSegment(elapsedSec);
      if (seg.index !== currentIdx) setCurrentIdx(seg.index);

      if (elapsedSec >= totalDuration) {
        setState("ended");
        setElapsed(totalDuration);
        setCurrentIdx(timeline.length - 1);
        if (audioRef.current) audioRef.current.pause();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [state, totalDuration, findSegment, currentIdx, timeline.length]);

  // ─── Audio sync ─────────────────────────────────────────────────────

  const currentAudio = useMemo(() => {
    const seg = timeline[currentIdx];
    if (!seg) return null;
    if (seg.mp3Url) return seg.mp3Url;
    if (audioBase && seg.mp3Path) {
      return `${audioBase}/${seg.chapterId}/${seg.stepIdx + 1}.mp3`;
    }
    return null;
  }, [timeline, currentIdx, audioBase]);

  useEffect(() => {
    if (!currentAudio || state !== "playing") return;
    const audio = new Audio(currentAudio);
    audioRef.current = audio;
    audio.play().catch(() => {}); // autoplay may be blocked
    return () => { audio.pause(); audioRef.current = null; };
  }, [currentAudio, state]);

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

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">
      {/* Stage */}
      <div className="relative w-full bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {/* Empty state */}
        {timeline.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-white/60 text-sm">
            暂无插图，等待 AI 规划…
          </div>
        )}

        {/* Current image with Ken Burns */}
        {seg && (
          <div className="absolute inset-0 overflow-hidden">
            <style>{`
              @keyframes kb-zoompan {
                from { transform: scale(1.0) translate(0, 0); }
                to   { transform: scale(var(--kb-scale, 1.03)) translate(var(--kb-pan-x, 0), var(--kb-pan-y, 0)); }
              }
            `}</style>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={`${seg.chapterId}-${seg.stepIdx}`}
              src={`${assetBase}/${encodeURIComponent(seg.illustration)}`}
              alt={seg.narration ?? `step ${seg.stepIdx + 1}`}
              className="w-full h-full object-cover"
              style={kbStyle}
            />
          </div>
        )}

        {/* Subtitle overlay */}
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

      {/* Thumbnail strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {timeline.map((s, i) => (
          <button
            key={i}
            onClick={() => seek(lookup.starts[i])}
            className={`shrink-0 w-16 h-10 rounded-lg overflow-hidden border-2 transition-colors ${
              i === currentIdx ? "border-zinc-900" : "border-transparent opacity-50 hover:opacity-80"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${assetBase}/${encodeURIComponent(s.illustration)}`}
              alt={`${s.chapterId} step ${s.stepIdx + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
