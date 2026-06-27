"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { VOICE_META } from "@/lib/voice-meta";
import type { VoiceItem } from "@/app/api/voices/route";

interface Segment {
  chapter: string;
  step: number;
  text: string;
  audio: string;
}

interface ChapterAudioStatus {
  chapterId: string;
  status: "idle" | "pending" | "running" | "done" | "error";
  total: number;
  done: number;
}

interface AudioWorkbenchProps {
  projectId: string;
  ttsVoice?: string | null;
  ttsProvider?: string | null;
  onSynthDone?: () => void;
  onSkip?: () => void;
}

type SynthPhase = "idle" | "extracting" | "running" | "done" | "error";
const GENDER_LABEL: Record<string, string> = { male: "男声", female: "女声", neutral: "中性" };
const CHAPTER_STATUS_ICONS: Record<string, string> = {
  idle: "○",
  pending: "○",
  running: "◐",
  done: "✓",
  error: "✗",
};

export function AudioWorkbench({ projectId, ttsVoice, onSynthDone, onSkip }: AudioWorkbenchProps) {
  const [currentVoice, setCurrentVoice] = useState(ttsVoice ?? "");
  const [phase, setPhase] = useState<SynthPhase>("idle");
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);

  // Per-chapter audio status
  const [chapterStatuses, setChapterStatuses] = useState<ChapterAudioStatus[]>([]);
  const [audioGlobal, setAudioGlobal] = useState<{ total: number; done: number; running: boolean }>({ total: 0, done: 0, running: false });

  // Segment playback
  const [segments, setSegments] = useState<Segment[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [loadingSegs, setLoadingSegs] = useState(false);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [voiceChanged, setVoiceChanged] = useState(false);

  // Inline voice picker state
  const [voices, setVoices] = useState<{ minimax: VoiceItem[]; openai: VoiceItem[] }>({ minimax: [], openai: [] });
  const [voiceProvider, setVoiceProvider] = useState<"minimax" | "openai">("minimax");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [savingVoice, setSavingVoice] = useState(false);

  const synthPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // ── Fetch audio-status ───────────────────────────────────────────────
  const fetchAudioStatus = useCallback(async () => {
    try {
      const r = await fetch(`/api/projects/${projectId}/audio-status`);
      if (!r.ok) return;
      const d = await r.json();
      setAudioGlobal({ total: d.global.total, done: d.global.done, running: d.global.running });
      setChapterStatuses(d.chapters ?? []);
    } catch { /* ignore */ }
  }, [projectId]);

  useEffect(() => {
    fetch("/api/voices").then(r => r.ok ? r.json() : null).then(d => { if (d) setVoices(d); });
  }, []);

  useEffect(() => {
    // Check audio-status first (new per-chapter tracking), fall back to legacy endpoint
    fetch(`/api/projects/${projectId}/audio-status`)
      .then(r => r.json())
      .then(d => {
        if (d.global.running) { setPhase("running"); startPoll(); }
        else if (d.global.total > 0 && d.global.done === d.global.total) setPhase("done");
        else setPhase("idle");
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Poll audio-status while panel is open (detects new TTS jobs even when idle)
  useEffect(() => {
    const id = setInterval(fetchAudioStatus, 3000);
    return () => clearInterval(id);
  }, [fetchAudioStatus]);

  // Keep legacy phase in sync with audioGlobal.running (detects new TTS jobs)
  useEffect(() => {
    if (audioGlobal.running && phase !== "running") {
      setPhase("running");
      startPoll();
    } else if (!audioGlobal.running && audioGlobal.total > 0 && audioGlobal.done === audioGlobal.total && phase === "running") {
      setPhase("done");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioGlobal.running]);

  useEffect(() => () => {
    audioRef.current?.pause();
    previewAudioRef.current?.pause();
    if (synthPollRef.current) clearInterval(synthPollRef.current);
  }, []);

  function startPoll() {
    if (synthPollRef.current) return;
    synthPollRef.current = setInterval(async () => {
      const res = await fetch(`/api/projects/${projectId}/synthesize`);
      const d = await res.json();
      setCompleted(d.completed ?? 0);
      setTotal(d.total ?? 0);
      if (d.status === "done") {
        setPhase("done"); setVoiceChanged(false); setSegments([]);
        clearInterval(synthPollRef.current!); synthPollRef.current = null;
        fetchAudioStatus();
        onSynthDone?.();
      } else if (d.status === "error") {
        setPhase("error");
        clearInterval(synthPollRef.current!); synthPollRef.current = null;
        fetchAudioStatus();
      }
    }, 2000);
  }

  async function handleSynthesize(force = false) {
    if (phase === "extracting" || phase === "running") return;
    setPhase("extracting"); setCompleted(0); setTotal(0);
    const extractRes = await fetch(`/api/projects/${projectId}/synthesize`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "extract" }),
    });
    if (!extractRes.ok) { setPhase("error"); return; }
    setPhase("running");
    await fetch(`/api/projects/${projectId}/synthesize`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: voiceProvider, voice: currentVoice || undefined, ...(force && { force: true }) }),
    });
    startPoll();
  }

  /** Synthesize all pending chapters (those with status "pending") */
  async function synthesizePending() {
    for (const ch of chapterStatuses) {
      if (ch.status === "pending" || ch.status === "idle") {
        await fetch(`/api/projects/${projectId}/synthesize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "synthesize-chapter",
            chapterId: ch.chapterId,
            provider: voiceProvider,
            voice: currentVoice || undefined,
          }),
        });
      }
    }
    setPhase("running");
    startPoll();
  }

  async function loadSegments() {
    if (segments.length > 0) { setListOpen(o => !o); return; }
    setListOpen(true); setLoadingSegs(true);
    const res = await fetch(`/api/projects/${projectId}/files?path=presentation/audio-segments.json`);
    const data = res.ok ? await res.json() : null;
    if (data?.content) { try { setSegments(JSON.parse(data.content)); } catch { /* ignore */ } }
    setLoadingSegs(false);
  }

  function play(idx: number, audioPath: string) {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (playingIdx === idx) { setPlayingIdx(null); return; }
    const audio = new Audio(`/api/projects/${projectId}/audio/${audioPath}`);
    audioRef.current = audio;
    setPlayingIdx(idx);
    audio.play().catch(() => setPlayingIdx(null));
    audio.addEventListener("ended", () => setPlayingIdx(null));
  }

  async function previewVoice(voice: VoiceItem) {
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
    if (previewingId === voice.id) { setPreviewingId(null); return; }
    setPreviewingId(voice.id);
    try {
      const res = await fetch("/api/voices/preview", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: voiceProvider, voiceId: voice.id, text: "你好，这是音色预览，帮你感受音色的效果。" }),
      });
      if (!res.ok) { setPreviewingId(null); return; }
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      previewAudioRef.current = audio;
      audio.play().catch(() => setPreviewingId(null));
      audio.addEventListener("ended", () => setPreviewingId(null));
    } catch { setPreviewingId(null); }
  }

  async function saveVoice(voiceId: string) {
    setSavingVoice(true);
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ttsProvider: voiceProvider, ttsVoice: voiceId }),
    });
    setCurrentVoice(voiceId);
    if (phase === "done") setVoiceChanged(true);
    setSavingVoice(false);
  }

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isBusy = phase === "extracting" || phase === "running";
  const segChapters = Array.from(new Set(segments.map(s => s.chapter)));
  const voiceList = (voiceProvider === "minimax" ? voices.minimax : voices.openai)
    .filter(v => genderFilter === "all" || v.gender === genderFilter);

  const hasConfiguredVoice = currentVoice !== "";
  const pendingChapters = chapterStatuses.filter(c => c.status === "pending" || c.status === "idle");
  const allDone = audioGlobal.total > 0 && audioGlobal.done === audioGlobal.total;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-modal">

      {/* ── 合成状态区 ── */}
      <div className="shrink-0 border-b border-bd px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-t2 flex items-center gap-1.5">🎙 语音合成</span>
          {allDone && <span className="text-xs text-green-600 font-medium">✓ 全部完成 ({audioGlobal.total})</span>}
          {isBusy && <span className="text-xs text-blue-500 animate-pulse">{phase === "extracting" ? "提取旁白…" : `合成中 ${total > 0 ? `${completed}/${total}` : ""}…`}</span>}
          {!isBusy && !allDone && audioGlobal.total > 0 && (
            <span className="text-xs text-t3">{audioGlobal.done}/{audioGlobal.total} 段</span>
          )}
        </div>

        {isBusy && (
          <div className="w-full bg-surface2 rounded-full h-1 overflow-hidden">
            <div className="bg-blue-500 h-1 rounded-full transition-all duration-500" style={{ width: phase === "extracting" ? "100%" : `${progress}%` }} />
          </div>
        )}

        {/* ── Per-chapter status ── */}
        {chapterStatuses.length > 0 && (
          <div className="rounded-xl border border-bd bg-base overflow-hidden">
            <div className="divide-y divide-bd max-h-36 overflow-y-auto">
              {chapterStatuses.map(ch => {
                const icon = CHAPTER_STATUS_ICONS[ch.status] ?? "○";
                const colorCls =
                  ch.status === "done" ? "text-green-500"
                  : ch.status === "running" ? "text-blue-500 animate-pulse"
                  : ch.status === "error" ? "text-red-500"
                  : "text-t3";
                return (
                  <div key={ch.chapterId} className="flex items-center gap-2 px-3 py-1.5">
                    <span className={`text-[10px] shrink-0 w-3 text-center ${colorCls}`}>{icon}</span>
                    <span className="flex-1 text-[11px] text-t2 truncate">{ch.chapterId}</span>
                    <span className="text-[10px] text-t3 shrink-0">{ch.done}/{ch.total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-red-600">合成失败，请重试</span>
            <button onClick={() => setPhase("idle")} className="text-xs text-red-500 hover:text-red-700">重试</button>
          </div>
        )}

        {phase === "done" && voiceChanged && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-amber-700">音色已更改</span>
            <button onClick={() => handleSynthesize(true)} className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded hover:bg-brand transition-colors">重新合成</button>
          </div>
        )}

        {phase === "done" && (
          <button onClick={loadSegments} className="w-full text-xs border border-bd rounded-lg py-1.5 text-t2 hover:bg-base transition-colors">
            {listOpen ? "收起预听 ▾" : "展开预听 ▴"}
          </button>
        )}
        {phase === "done" && listOpen && (
          <div className="max-h-40 overflow-y-auto rounded-xl border border-bd bg-base">
            {loadingSegs ? (
              <p className="text-xs text-t3 text-center py-4">加载中…</p>
            ) : segments.length === 0 ? (
              <p className="text-xs text-t3 text-center py-4">暂无音频文件</p>
            ) : (
              <div className="divide-y divide-bd">
                {segChapters.map(ch => (
                  <div key={ch} className="px-3 py-2">
                    <p className="text-[10px] font-semibold text-t3 uppercase tracking-wide mb-1">{ch}</p>
                    {segments.filter(s => s.chapter === ch).map((seg) => {
                      const idx = segments.indexOf(seg);
                      return (
                        <button key={idx} onClick={() => play(idx, seg.audio)}
                          className={`w-full flex items-center gap-2 py-1 text-left rounded transition-colors ${playingIdx === idx ? "text-blue-600" : "text-t2 hover:text-t1"}`}>
                          <span className="text-[10px] shrink-0">{playingIdx === idx ? "■" : "▶"}</span>
                          <span className="text-xs truncate">{seg.text}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Action buttons ── */}
        {(phase === "idle" || phase === "error") && (
          <div className="flex gap-1.5">
            <button onClick={onSkip} className="flex-1 rounded-lg border border-bd py-1.5 text-xs text-t2 hover:bg-base transition-colors">跳过</button>
            {hasConfiguredVoice && pendingChapters.length > 0 && (
              <button onClick={synthesizePending} className="flex-1 rounded-lg bg-accent py-1.5 text-xs font-medium text-accent-text hover:bg-accent-hover transition-colors">
                合成全部 ({pendingChapters.length} 章)
              </button>
            )}
            {(!hasConfiguredVoice || pendingChapters.length === 0) && (
              <button onClick={() => handleSynthesize()} disabled={isBusy}
                className="flex-1 rounded-lg bg-accent py-1.5 text-xs font-medium text-accent-text hover:bg-accent-hover disabled:opacity-50 transition-colors">
                合成语音 →
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 音色选择（始终展示）── */}
      <div className="shrink-0 px-4 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-t2">
            音色
            {currentVoice && <span className="ml-1.5 text-t4 font-normal">当前：{VOICE_META[currentVoice]?.zh ?? currentVoice}</span>}
          </span>
          {savingVoice && <span className="text-xs text-t4">保存中…</span>}
        </div>
        {/* Provider tabs */}
        <div className="flex rounded-lg border border-bd overflow-hidden mb-2">
          {(["minimax", "openai"] as const).map(p => (
            <button key={p} onClick={() => { setVoiceProvider(p); setGenderFilter("all"); }}
              className={`flex-1 py-1 text-[11px] font-medium transition-colors ${voiceProvider === p ? "bg-accent text-accent-text" : "text-t3 hover:text-t2"}`}>
              {p === "minimax" ? "MiniMax" : "OpenAI"}
            </button>
          ))}
        </div>
        {/* Gender filter */}
        <div className="flex gap-1 mb-2">
          {(["all", "female", "male"] as const).map(g => (
            <button key={g} onClick={() => setGenderFilter(g)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${genderFilter === g ? "bg-accent text-accent-text" : "bg-surface2 text-t2 hover:bg-surface3"}`}>
              {g === "all" ? "全部" : GENDER_LABEL[g]}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-t4 self-center">{voiceList.length} 个</span>
        </div>
      </div>

      {/* Voice list — takes remaining space */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {voiceList.length === 0 ? (
          <p className="text-xs text-t3 text-center py-6">加载中…</p>
        ) : (
          <div className="space-y-0.5">
            {voiceList.map(voice => {
              const isSelected = currentVoice === voice.id;
              const isPreviewing = previewingId === voice.id;
              return (
                <div key={voice.id} onClick={() => saveVoice(voice.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-colors ${isSelected ? "bg-accent text-accent-text" : "hover:bg-surface2 text-t2"}`}>
                  <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${voice.gender === "female" ? "bg-pink-400" : voice.gender === "male" ? "bg-blue-400" : "bg-t3"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{voice.zh}</p>
                    <p className="text-[10px] truncate opacity-60">{voice.style}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); previewVoice(voice); }}
                    className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isSelected ? "bg-white/20 hover:bg-white/30" : "bg-surface2 hover:bg-surface3 text-t2"}`}
                    title="试听">
                    <span className="text-[10px]">{isPreviewing ? "■" : "▶"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
