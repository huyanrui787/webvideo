"use client";

import { useEffect, useRef, useState } from "react";

interface BgmTrack {
  id: string;
  nameZh: string;
  moodZh: string;
  desc: string;
  bpm: number;
  available: boolean;
}

interface MusicCheckpointCardProps {
  projectId: string;
  articleTitle?: string;
  onConfirm: () => void;
  onSkip: () => void;
}

type Tab = "library" | "upload" | "ai";
type SaveStatus = "idle" | "saving" | "saved" | "error";
type GenStatus = "idle" | "generating" | "done" | "error";

const MOOD_ICONS: Record<string, string> = {
  tech: "⚡",
  corporate: "🏢",
  inspiring: "🚀",
  storytelling: "📖",
  dark: "🌑",
  upbeat: "🎉",
};

export function MusicCheckpointCard({
  projectId,
  articleTitle,
  onConfirm,
  onSkip,
}: MusicCheckpointCardProps) {
  const [tab, setTab] = useState<Tab>("library");
  const [tracks, setTracks] = useState<BgmTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<BgmTrack | null>(null);
  const [volume, setVolume] = useState(28);

  // Preview playback
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // AI generate
  const [genStatus, setGenStatus] = useState<GenStatus>("idle");
  const [genError, setGenError] = useState("");
  const genPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Save
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetch("/api/library/music")
      .then((r) => r.json())
      .then(setTracks)
      .catch(() => {});
  }, []);

  // On mount: restore state if bgm already exists or ai job is still running
  useEffect(() => {
    fetch(`/api/projects/${projectId}/bgm`)
      .then((r) => r.json())
      .then((d) => {
        if (d.aiGen?.status === "running") {
          setTab("ai");
          setGenStatus("generating");
          pollAiGen();
        } else if (d.configured && d.mp3Exists && d.config?.trackName?.startsWith("AI")) {
          setTab("ai");
          setGenStatus("done");
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    return () => {
      previewAudioRef.current?.pause();
      if (genPollRef.current) clearInterval(genPollRef.current);
    };
  }, []);

  function togglePreview(trackId: string) {
    if (previewId === trackId) {
      previewAudioRef.current?.pause();
      setPreviewId(null);
      return;
    }
    previewAudioRef.current?.pause();
    const audio = new Audio(`/bgm/${trackId}.mp3`);
    audio.volume = volume / 100;
    previewAudioRef.current = audio;
    setPreviewId(trackId);
    audio.play().catch(() => setPreviewId(null));
    audio.addEventListener("ended", () => setPreviewId(null));
  }

  async function handleConfirm() {
    if (confirmed) return;
    setSaveStatus("saving");

    let ok = false;

    if (tab === "library" && selectedTrack) {
      const res = await fetch(`/api/projects/${projectId}/bgm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: selectedTrack.id,
          trackName: selectedTrack.nameZh,
          volume: volume / 100,
        }),
      });
      ok = res.ok;
    } else if (tab === "upload" && uploadFile) {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("volume", String(volume / 100));
      const res = await fetch(`/api/projects/${projectId}/bgm`, {
        method: "POST",
        body: fd,
      });
      ok = res.ok;
    } else if (tab === "ai" && genStatus === "done") {
      // bgm.json already written by generate endpoint
      ok = true;
    }

    if (ok) {
      setSaveStatus("saved");
      setConfirmed(true);
      onConfirm();
    } else {
      setSaveStatus("idle"); // reset so button is clickable again
    }
  }

  async function startAiGenerate() {
    if (genStatus === "generating") return;
    setGenStatus("generating");
    setGenError("");

    const moodMap: Record<string, string> = {
      tech: "tech", corporate: "corporate", inspiring: "inspiring",
      storytelling: "storytelling", dark: "dark", upbeat: "upbeat",
    };
    const mood = selectedTrack ? moodMap[selectedTrack.id.split("-")[0]] ?? "" : "";

    await fetch(`/api/projects/${projectId}/bgm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate-ai",
        title: articleTitle,
        mood,
        volume: volume / 100,
      }),
    });

    pollAiGen();
  }

  function pollAiGen() {
    if (genPollRef.current) return;
    const deadline = Date.now() + 180_000;
    genPollRef.current = setInterval(async () => {
      const res = await fetch(`/api/projects/${projectId}/bgm`);
      const data = await res.json();
      if (data.mp3Exists && data.configured) {
        setGenStatus("done");
        clearInterval(genPollRef.current!);
        genPollRef.current = null;
      } else if (data.aiGen?.status === "error") {
        setGenStatus("error");
        setGenError(data.aiGen.error ?? "生成失败");
        clearInterval(genPollRef.current!);
        genPollRef.current = null;
      } else if (Date.now() > deadline) {
        setGenStatus("error");
        setGenError("生成超时，请重试");
        clearInterval(genPollRef.current!);
        genPollRef.current = null;
      }
    }, 3000);
  }

  const canConfirm =
    (tab === "library" && selectedTrack !== null && selectedTrack.available) ||
    (tab === "upload" && uploadFile !== null) ||
    (tab === "ai" && genStatus === "done");

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "library", label: "内置曲库", icon: "🎵" },
    { id: "upload", label: "上传文件", icon: "⬆" },
    { id: "ai", label: "AI 生成", icon: "✨" },
  ];

  return (
    <div className="mx-3 my-2 rounded-2xl border-2 border-purple-200 bg-purple-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base">🎶</span>
        <span className="text-sm font-semibold text-t1">配置背景音乐</span>
        <span className="ml-auto text-xs text-t3">可选</span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-modal rounded-xl p-1 border border-purple-100">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? "bg-purple-600 text-t1 shadow-sm"
                : "text-t2 hover:text-t1"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Library tab */}
      {tab === "library" && (
        <div className="space-y-2">
          {tracks.length === 0 ? (
            <p className="text-xs text-t3 text-center py-3">曲库加载中…</p>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5">
              {tracks.map((track) => {
                const isSelected = selectedTrack?.id === track.id;
                const isPreviewing = previewId === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => setSelectedTrack(track)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer transition-colors border ${
                      isSelected
                        ? "bg-purple-100 border-purple-300"
                        : "bg-modal border-bd hover:border-purple-200"
                    }`}
                  >
                    <span className="text-base shrink-0">
                      {MOOD_ICONS[track.id.split("-")[0]] ?? "🎵"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-t1 truncate">
                        {track.nameZh}
                        <span className="ml-1.5 text-[10px] text-t3 font-normal">
                          {track.moodZh} · {track.bpm} BPM
                        </span>
                      </p>
                      <p className="text-[10px] text-t3 truncate mt-0.5">{track.desc}</p>
                    </div>
                    {track.available ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePreview(track.id); }}
                        className={`shrink-0 text-xs px-2 py-1 rounded-lg transition-colors ${
                          isPreviewing
                            ? "bg-purple-600 text-t1"
                            : "border border-bd text-t2 hover:border-purple-300 hover:text-purple-600"
                        }`}
                      >
                        {isPreviewing ? "■" : "▶"}
                      </button>
                    ) : (
                      <span className="shrink-0 text-[10px] text-t4 bg-base border border-bd px-1.5 py-0.5 rounded">
                        需 AI 生成
                      </span>
                    )}
                    {isSelected && (
                      <span className="shrink-0 text-purple-500 text-sm">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {selectedTrack && !selectedTrack.available && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
              该曲目文件尚未生成。切换到「AI 生成」标签，选择情绪后生成，或选择其他已有文件的曲目。
            </div>
          )}
        </div>
      )}

      {/* Upload tab */}
      {tab === "upload" && (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,.mp3,.wav,.ogg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setUploadFile(f);
            }}
          />
          {uploadFile ? (
            <div className="flex items-center gap-2 rounded-xl bg-modal border border-purple-200 px-3 py-2.5">
              <span className="text-purple-500">🎵</span>
              <span className="flex-1 text-xs text-t2 truncate">{uploadFile.name}</span>
              <button
                onClick={() => setUploadFile(null)}
                className="text-xs text-t3 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-purple-200 bg-modal py-6 text-center hover:border-purple-400 transition-colors"
            >
              <p className="text-sm text-t3">点击选择音频文件</p>
              <p className="text-xs text-t4 mt-1">支持 MP3 / WAV / OGG</p>
            </button>
          )}
        </div>
      )}

      {/* AI Generate tab */}
      {tab === "ai" && (
        <div className="space-y-2">
          <p className="text-xs text-t2 leading-relaxed">
            基于文章主题，用 MiniMax AI 生成一首约 2 分钟纯器乐配乐（需要 mmx-cli 已登录）。
          </p>
          <p className="text-[10px] text-t3">
            当前主题：{articleTitle ? `「${articleTitle}」` : "（未知）"}
          </p>

          {genStatus === "idle" && (
            <button
              onClick={startAiGenerate}
              className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-medium text-t1 hover:bg-purple-500 transition-colors"
            >
              ✨ 开始 AI 生成
            </button>
          )}

          {genStatus === "generating" && (
            <div className="rounded-xl bg-modal border border-purple-100 px-4 py-4 flex items-center gap-3">
              <span className="flex gap-0.5 items-end h-4 shrink-0">
                {[0, 0.15, 0.3].map((d) => (
                  <span
                    key={d}
                    className="w-1 bg-purple-400 rounded-full animate-pulse"
                    style={{ height: "12px", animationDelay: `${d}s`, animationDuration: "0.9s" }}
                  />
                ))}
              </span>
              <div>
                <p className="text-xs font-medium text-purple-700">AI 正在作曲…</p>
                <p className="text-[10px] text-t3 mt-0.5">通常需要 30-60 秒</p>
              </div>
            </div>
          )}

          {genStatus === "done" && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2.5 flex items-center gap-2">
              <span className="text-green-600 text-sm">✓</span>
              <div className="flex-1">
                <p className="text-xs font-medium text-green-700">AI 配乐生成完成</p>
              </div>
              <button
                onClick={() => {
                  previewAudioRef.current?.pause();
                  const audio = new Audio(`/api/projects/${projectId}/audio/bgm.mp3`);
                  audio.volume = volume / 100;
                  previewAudioRef.current = audio;
                  setPreviewId("ai-preview");
                  audio.play().catch(() => {});
                  audio.addEventListener("ended", () => setPreviewId(null));
                }}
                className="text-xs border border-green-300 text-green-700 px-2.5 py-1 rounded-lg hover:bg-green-100 transition-colors"
              >
                {previewId === "ai-preview" ? "■ 停止" : "▶ 预听"}
              </button>
            </div>
          )}

          {genStatus === "error" && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 space-y-1.5">
              <p className="text-xs text-red-600">{genError || "生成失败，请确认 mmx-cli 已登录后重试"}</p>
              <button
                onClick={() => { setGenStatus("idle"); setGenError(""); }}
                className="text-xs text-red-500 hover:text-red-700 underline"
              >
                重试
              </button>
            </div>
          )}
        </div>
      )}

      {/* Volume */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-t2">背景音量</span>
          <span className="text-xs font-mono text-t2">{volume}%</span>
        </div>
        <input
          type="range"
          min={5}
          max={80}
          value={volume}
          onChange={(e) => {
            const v = Number(e.target.value);
            setVolume(v);
            if (previewAudioRef.current) previewAudioRef.current.volume = v / 100;
          }}
          className="w-full accent-purple-600 h-1.5"
        />
        <p className="text-[10px] text-t4">建议 20–35%，保证口播清晰</p>
      </div>

      {/* Action buttons */}
      {!confirmed ? (
        <div className="flex gap-2 pt-1">
          <button
            onClick={onSkip}
            className="flex-1 rounded-xl border border-bd py-2 text-xs text-t2 hover:bg-modal transition-colors"
          >
            跳过，不配乐
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || saveStatus === "saving"}
            className="flex-1 rounded-xl bg-purple-600 py-2 text-xs font-medium text-t1 hover:bg-purple-500 disabled:opacity-40 transition-colors"
          >
            {saveStatus === "saving" ? "保存中…" : "确认配乐 →"}
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2 flex items-center gap-2">
          <span className="text-green-600">✓</span>
          <span className="text-xs text-green-700 font-medium">配乐已配置，等待 AI 继续…</span>
        </div>
      )}
    </div>
  );
}
