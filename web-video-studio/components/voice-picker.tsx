"use client";

import { useEffect, useRef, useState } from "react";
import type { VoiceItem } from "@/app/api/voices/route";

interface VoicePickerProps {
  projectId: string;
  currentVoice?: string | null;
  currentProvider?: string | null;
  onSaved: (provider: string, voice: string) => void;
  onClose: () => void;
  inline?: boolean;
}

const GENDER_LABEL: Record<string, string> = { male: "男声", female: "女声", neutral: "中性" };

/**
 * Right-side drawer for selecting TTS voice.
 * Opens as a slide-in panel from the right edge of the preview area.
 */
export function VoicePicker({ projectId, currentVoice, currentProvider, onSaved, onClose, inline = false }: VoicePickerProps) {
  const [provider, setProvider] = useState<"minimax" | "openai">(
    (currentProvider as "minimax" | "openai") ?? "minimax"
  );
  const [voices, setVoices] = useState<{ minimax: VoiceItem[]; openai: VoiceItem[] }>({
    minimax: [], openai: [],
  });
  const [selected, setSelected] = useState<string>(currentVoice ?? "");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/voices").then(r => r.ok ? r.json() : null).then(data => {
      if (data) setVoices(data);
    });
  }, []);

  const list = provider === "minimax" ? voices.minimax : voices.openai;
  const filtered = list.filter(v =>
    genderFilter === "all" || v.gender === genderFilter
  );

  function stopAudio() {
    audioRef.current?.pause();
    audioRef.current = null;
    setPreviewingId(null);
  }

  async function preview(voice: VoiceItem) {
    stopAudio();
    if (previewingId === voice.id) return;
    setPreviewingId(voice.id);

    // Use a short sample text
    const sampleText = "你好，这是音色预览，帮你感受音色的效果。";

    const audio = new Audio();
    audioRef.current = audio;
    audio.addEventListener("ended", () => setPreviewingId(null));
    audio.addEventListener("error", () => setPreviewingId(null));

    // Build URL to preview API
    const params = new URLSearchParams({ provider, voiceId: voice.id, text: sampleText });
    audio.src = `/api/voices/preview?${params}`;

    // POST to preview API and play the response blob
    try {
      const res = await fetch("/api/voices/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, voiceId: voice.id, text: sampleText }),
      });
      if (!res.ok) { setPreviewingId(null); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current !== audio) { URL.revokeObjectURL(url); return; }
      audio.src = url;
      audio.play().catch(() => setPreviewingId(null));
      audio.addEventListener("ended", () => URL.revokeObjectURL(url));
    } catch {
      setPreviewingId(null);
    }
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ttsProvider: provider, ttsVoice: selected }),
      });
      onSaved(provider, selected);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => () => stopAudio(), []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") { stopAudio(); onClose(); } }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const inner = (
    <div className={`flex flex-col ${inline ? "h-full" : "bg-modal h-full shadow-2xl"}`}
      style={inline ? undefined : { width: "min(420px, 100vw)" }}
      onClick={inline ? undefined : e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bd shrink-0">
        {inline ? (
          <button
            onClick={() => { stopAudio(); onClose(); }}
            className="flex items-center gap-1.5 text-xs text-t3 hover:text-t2 transition-colors"
          >
            ‹ 返回
          </button>
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-t1">选择音色</h2>
            <p className="text-xs text-t3 mt-0.5">
              {selected ? `当前：${selected}` : "未选择音色"}
            </p>
          </div>
        )}
        {!inline && (
          <button
            onClick={() => { stopAudio(); onClose(); }}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface2 text-t3 hover:text-t2 transition-colors text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

        {/* Provider tabs */}
        <div className="flex border-b border-bd shrink-0">
          {(["minimax", "openai"] as const).map(p => (
            <button
              key={p}
              onClick={() => { setProvider(p); setSelected(""); setGenderFilter("all"); }}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                provider === p
                  ? "text-t1 border-b-2 border-accent"
                  : "text-t3 hover:text-t2"
              }`}
            >
              {p === "minimax" ? "MiniMax" : "OpenAI"}
            </button>
          ))}
        </div>

        {/* Gender filter */}
        <div className="flex gap-1.5 px-5 py-3 border-b border-bd shrink-0">
          {(["all", "female", "male"] as const).map(g => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                genderFilter === g
                  ? "bg-accent text-t1"
                  : "bg-surface2 text-t2 hover:bg-surface3"
              }`}
            >
              {g === "all" ? "全部" : GENDER_LABEL[g]}
            </button>
          ))}
          <span className="ml-auto text-xs text-t4 self-center">{filtered.length} 个</span>
        </div>

        {/* Voice list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-t3 text-center py-8">加载中…</p>
          ) : (
            <div className="p-3 space-y-1">
              {filtered.map(voice => {
                const isSelected = selected === voice.id;
                const isPreviewing = previewingId === voice.id;
                return (
                  <div
                    key={voice.id}
                    onClick={() => setSelected(voice.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? "bg-accent text-t1" : "hover:bg-surface2 text-t2"
                    }`}
                  >
                    <span className={`shrink-0 w-2 h-2 rounded-full ${
                      voice.gender === "female" ? "bg-pink-400" :
                      voice.gender === "male" ? "bg-blue-400" : "bg-t3"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{voice.zh}</p>
                      <p className={`text-xs truncate ${isSelected ? "text-t3" : "text-t3"}`}>
                        {voice.style}
                      </p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); preview(voice); }}
                      className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-white/20 hover:bg-white/30 text-t1"
                          : "bg-surface2 hover:bg-surface3 text-t2"
                      }`}
                      title="试听"
                    >
                      <span className="text-[11px]">{isPreviewing ? "■" : "▶"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-bd shrink-0">
          <button
            onClick={save}
            disabled={!selected || saving}
            className="w-full rounded-xl bg-accent py-2.5 text-sm font-medium text-accent-text hover:bg-accent-hover disabled:opacity-40 transition-colors"
          >
            {saving ? "保存中…" : selected ? `✓ 使用「${voices[provider]?.find(v => v.id === selected)?.zh ?? selected}」` : "保存音色"}
          </button>
        </div>
      </div>
  );

  if (inline) return inner;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={e => { if (e.target === e.currentTarget) { stopAudio(); onClose(); } }}
    >
      {inner}
    </div>
  );
}
