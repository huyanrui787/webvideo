"use client";

import { useEffect, useState } from "react";
import type { PlaybackStep } from "./playback-bar";

interface SubtitleOverlayProps {
  projectId: string;
  playbackStep: PlaybackStep | null;
  playbackState: "idle" | "playing" | "paused" | "ended";
  visible: boolean;
}

interface NarrationChapter {
  id: string;
  narrations: string[];
}

export function SubtitleOverlay({
  projectId,
  playbackStep,
  playbackState,
  visible,
}: SubtitleOverlayProps) {
  const [chapters, setChapters] = useState<NarrationChapter[]>([]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/narrations`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.chapters) setChapters(d.chapters); })
      .catch(() => {});
  }, [projectId]);

  if (!visible || playbackState === "idle" || !playbackStep) return null;

  const text = chapters[playbackStep.chapter]?.narrations[playbackStep.step] ?? "";
  if (!text) return null;

  return (
    <div
      className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none z-10 px-8"
      style={{ zIndex: 15 }}
    >
      <div
        className="max-w-2xl text-center text-t1 text-base leading-snug px-4 py-2 rounded-lg"
        style={{
          textShadow: "0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)",
          fontWeight: 500,
          fontSize: "clamp(13px, 1.6vw, 18px)",
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(2px)",
        }}
      >
        {text}
      </div>
    </div>
  );
}
