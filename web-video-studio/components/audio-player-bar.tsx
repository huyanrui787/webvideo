"use client";

import { useEffect, useRef, useState } from "react";
import { VoicePicker } from "./voice-picker";

interface Segment {
  chapter: string;
  step: number;
  text: string;
  audio: string;
}

interface AudioPlayerBarProps {
  projectId: string;
  devPort?: number;
  ttsVoice?: string | null;
  ttsProvider?: string | null;
}

export function AudioPlayerBar({ projectId, ttsVoice, ttsProvider }: AudioPlayerBarProps) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [open, setOpen] = useState(false);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [currentVoice, setCurrentVoice] = useState(ttsVoice ?? "");
  const [currentProvider, setCurrentProvider] = useState(ttsProvider ?? "minimax");
  const [voiceChanged, setVoiceChanged] = useState(false);
  const [synthStatus, setSynthStatus] = useState<"idle" | "extracting" | "running" | "done" | "error">("idle");
  const synthPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!open || segments.length > 0) return;
    setLoading(true);
    fetch(`/api/projects/${projectId}/files?path=presentation/audio-segments.json`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.content) {
          try { setSegments(JSON.parse(data.content)); } catch { /* ignore */ }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open, projectId, segments.length]);

  function play(idx: number, audioPath: string) {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (playingIdx === idx) { setPlayingIdx(null); return; }
    const src = `/api/projects/${projectId}/audio/${audioPath}`;
    const audio = new Audio(src);
    audioRef.current = audio;
    setPlayingIdx(idx);
    audio.play().catch(() => setPlayingIdx(null));
    audio.addEventListener("ended", () => setPlayingIdx(null));
  }

  useEffect(() => () => {
    audioRef.current?.pause();
    if (synthPollRef.current) clearInterval(synthPollRef.current);
  }, []);

  async function resynthesize() {
    if (synthStatus === "running" || synthStatus === "extracting") return;
    setSynthStatus("extracting");

    // Step 1: extract narrations
    await fetch(`/api/projects/${projectId}/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "extract" }),
    });

    // Step 2: start synthesis with current voice, force re-generate existing files
    setSynthStatus("running");
    await fetch(`/api/projects/${projectId}/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: currentProvider,
        voice: currentVoice,
        force: true,
      }),
    });

    // Step 3: poll until done
    if (synthPollRef.current) clearInterval(synthPollRef.current);
    synthPollRef.current = setInterval(async () => {
      const res = await fetch(`/api/projects/${projectId}/synthesize`);
      const data = await res.json() as { status: string };
      if (data.status === "done") {
        setSynthStatus("done");
        setVoiceChanged(false);
        clearInterval(synthPollRef.current!);
        synthPollRef.current = null;
        // Reset segments so they reload on next open
        setSegments([]);
      } else if (data.status === "error") {
        setSynthStatus("error");
        clearInterval(synthPollRef.current!);
        synthPollRef.current = null;
      }
    }, 2000);
  }

  const chapters = Array.from(new Set(segments.map(s => s.chapter)));

  return (
    <div className="border-t border-bd bg-modal shrink-0 relative">
      {/* Toggle bar */}
      <div className="flex items-center px-4 py-2">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex-1 flex items-center gap-1.5 text-xs text-t2 hover:text-t2 transition-colors text-left"
        >
          <span>🎙</span>
          <span className="font-medium">语音预听</span>
          {segments.length > 0 && (
            <span className="text-t3 font-normal">· {segments.length} 条</span>
          )}
          <span className="text-t4 ml-1">{open ? "▾" : "▴"}</span>
        </button>

        {/* Voice picker trigger */}
        <button
          onClick={() => setVoicePickerOpen(true)}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors border ml-2 shrink-0 ${
            voiceChanged
              ? "text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100"
              : "text-t2 hover:text-t1 hover:bg-surface2 border-bd"
          }`}
          title="选择音色"
        >
          <span>🎤</span>
          <span className="font-medium max-w-[80px] truncate">
            {currentVoice || "音色"}
          </span>
          {voiceChanged && <span className="text-amber-500 text-[10px]">●</span>}
        </button>
      </div>

      {/* Segment list */}
      {open && (
        <div className="max-h-52 overflow-y-auto px-3 pb-3">
          {/* Voice changed warning + re-synth button */}
          {voiceChanged && segments.length > 0 && synthStatus !== "done" && (
            <div className="mx-0.5 mb-2 mt-1 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <span className="text-amber-500 shrink-0 text-sm">⚠</span>
              <p className="text-xs text-amber-700 flex-1">音色已更改，当前预听的是旧音色。</p>
              <button
                onClick={resynthesize}
                disabled={synthStatus === "running" || synthStatus === "extracting"}
                className="shrink-0 text-xs bg-amber-500 hover:bg-brand text-t1 px-2.5 py-1 rounded-lg disabled:opacity-50 transition-colors font-medium"
              >
                {synthStatus === "extracting" ? "提取中…" : synthStatus === "running" ? "合成中…" : "重新合成"}
              </button>
            </div>
          )}
          {synthStatus === "error" && (
            <div className="mx-0.5 mb-2 mt-1 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
              <span className="text-red-500 shrink-0 text-sm">✕</span>
              <p className="text-xs text-red-700 flex-1">合成失败</p>
              <button
                onClick={() => setSynthStatus("idle")}
                className="text-xs text-red-500 hover:text-red-700"
              >重试</button>
            </div>
          )}
          {synthStatus === "done" && (
            <div className="mx-0.5 mb-2 mt-1 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
              <span className="text-green-500 shrink-0 text-sm">✓</span>
              <p className="text-xs text-green-700">合成完成，展开列表试听</p>
            </div>
          )}
          {loading ? (
            <p className="text-xs text-t3 text-center py-4">加载中…</p>
          ) : segments.length === 0 ? (
            <p className="text-xs text-t3 text-center py-4">
              暂无语音文件。先在 AI 对话中完成语音合成。
            </p>
          ) : (
            <div className="space-y-3 pt-1">
              {chapters.map(chapter => (
                <div key={chapter}>
                  <p className="text-[10px] font-medium text-t3 uppercase tracking-wider mb-1.5 px-0.5">
                    {chapter}
                  </p>
                  <div className="space-y-1">
                    {segments.filter(s => s.chapter === chapter).map((seg, i) => {
                      const globalIdx = segments.indexOf(seg);
                      const isPlaying = playingIdx === globalIdx;
                      return (
                        <button
                          key={i}
                          onClick={() => play(globalIdx, seg.audio)}
                          className={`w-full flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                            isPlaying ? "bg-accent text-t1" : "hover:bg-surface2 text-t2"
                          }`}
                        >
                          <span className={`shrink-0 mt-0.5 text-[10px] w-4 h-4 flex items-center justify-center rounded-full ${
                            isPlaying ? "bg-white/20" : "bg-surface3 text-t2"
                          }`}>
                            {isPlaying ? "■" : "▶"}
                          </span>
                          <span className="text-xs leading-relaxed truncate">{seg.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Voice picker — full-screen drawer rendered at page root level */}
      {voicePickerOpen && (
        <VoicePicker
          projectId={projectId}
          currentVoice={currentVoice}
          currentProvider={currentProvider}
          onSaved={(prov, voice) => {
            setCurrentProvider(prov);
            setCurrentVoice(voice);
            setVoiceChanged(true);
            setVoicePickerOpen(false);
          }}
          onClose={() => setVoicePickerOpen(false)}
        />
      )}
    </div>
  );
}


interface Segment {
  chapter: string;
  step: number;
  text: string;
  audio: string;
}

interface AudioPlayerBarProps {
  projectId: string;
  devPort?: number; // kept for API compat but no longer used for audio src
}

