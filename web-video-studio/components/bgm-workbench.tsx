"use client";

import { useEffect, useRef, useState } from "react";
import { MusicCheckpointCard } from "./music-checkpoint-card";

interface BgmWorkbenchProps {
  projectId: string;
  projectTitle?: string;
}

export function BgmWorkbench({ projectId, projectTitle }: BgmWorkbenchProps) {
  const [configured, setConfigured] = useState(false);
  const [trackName, setTrackName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/bgm`)
      .then((r) => r.json())
      .then((d) => {
        setConfigured(d.configured && d.mp3Exists);
        setTrackName(d.config?.trackName ?? null);
      })
      .catch(() => {});
  }, [projectId]);

  function togglePreview() {
    if (previewing) {
      previewRef.current?.pause();
      setPreviewing(false);
      return;
    }
    const audio = new Audio(`/api/projects/${projectId}/audio/bgm.mp3`);
    previewRef.current = audio;
    setPreviewing(true);
    audio.play().catch(() => setPreviewing(false));
    audio.addEventListener("ended", () => setPreviewing(false));
  }

  async function removeBgm() {
    await fetch(`/api/projects/${projectId}/bgm`, { method: "DELETE" });
    previewRef.current?.pause();
    setConfigured(false);
    setTrackName(null);
    setPreviewing(false);
  }

  function handleConfirm() {
    setOpen(false);
    fetch(`/api/projects/${projectId}/bgm`)
      .then((r) => r.json())
      .then((d) => {
        setConfigured(d.configured && d.mp3Exists);
        setTrackName(d.config?.trackName ?? null);
      })
      .catch(() => {});
  }

  return (
    <div className="border-t border-bd bg-modal shrink-0">
      {/* Header row */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs font-medium text-t2 flex items-center gap-1.5">
          🎶 背景音乐
        </span>
        <div className="flex items-center gap-1.5">
          {configured && (
            <>
              <button
                onClick={togglePreview}
                title={previewing ? "停止" : "预听"}
                className="text-xs text-t3 hover:text-purple-600 transition-colors"
              >
                {previewing ? "■" : "▶"}
              </button>
              <button
                onClick={removeBgm}
                title="移除配乐"
                className="text-xs text-t4 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-xs text-t2 hover:text-purple-600 border border-bd rounded-lg px-2 py-0.5 hover:border-purple-300 transition-colors"
          >
            {configured ? "更换" : "配置"}
          </button>
        </div>
      </div>

      {/* Status line */}
      {!open && (
        <div className="px-4 pb-2.5 -mt-1">
          {configured ? (
            <p className="text-xs text-purple-600 font-medium truncate">
              ✓ {trackName ?? "已配置"}
            </p>
          ) : (
            <p className="text-xs text-t3">未配置，录屏时无背景音乐</p>
          )}
        </div>
      )}

      {/* Inline card */}
      {open && (
        <div className="pb-2">
          <MusicCheckpointCard
            projectId={projectId}
            articleTitle={projectTitle}
            onConfirm={handleConfirm}
            onSkip={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
