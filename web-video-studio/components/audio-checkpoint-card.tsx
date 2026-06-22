"use client";

import { useEffect, useState } from "react";

export interface AudioCheckpointData {
  chapterCount: number;
  stepCount: number;
}

export interface SynthStatus {
  phase: "idle" | "running" | "done" | "error";
  completed: number;
  total: number;
}

interface AudioCheckpointCardProps {
  projectId: string;
  data: AudioCheckpointData;
  devPort: number | null;
  synthStatus: SynthStatus;
  onSkip: () => void;
  onSynthesize: (provider: string, apiKey: string) => void;
}

const LS_PROVIDER = "webvideo-tts-provider";
const lsKeyFor = (p: string) => `webvideo-tts-apikey-${p}`;

export function AudioCheckpointCard({
  projectId,
  data,
  devPort,
  synthStatus,
  onSkip,
  onSynthesize,
}: AudioCheckpointCardProps) {
  const [provider, setProvider] = useState<"minimax" | "openai">("openai");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem(LS_PROVIDER) as "minimax" | "openai" | null;
    if (savedProvider) setProvider(savedProvider);
    const savedKey = localStorage.getItem(lsKeyFor(savedProvider ?? "openai"));
    if (savedKey) setApiKey(savedKey);
  }, []);

  // Persist provider changes
  function handleProviderChange(p: "minimax" | "openai") {
    setProvider(p);
    localStorage.setItem(LS_PROVIDER, p);
    const savedKey = localStorage.getItem(lsKeyFor(p)) ?? "";
    setApiKey(savedKey);
  }

  // Persist key changes
  function handleKeyChange(v: string) {
    setApiKey(v);
    localStorage.setItem(lsKeyFor(provider), v);
  }

  const providers = [
    { id: "openai" as const, name: "OpenAI TTS", desc: "需要 OPENAI_API_KEY，curl-based" },
    { id: "minimax" as const, name: "MiniMax", desc: "中文音色更自然，需要 mmx-cli" },
  ];

  const isBusy = synthStatus.phase === "running";
  const isDone = synthStatus.phase === "done";
  const isError = synthStatus.phase === "error";
  const progress = synthStatus.total > 0
    ? Math.round((synthStatus.completed / synthStatus.total) * 100)
    : 0;

  return (
    <div className="mx-3 my-2 rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-base">🎙️</span>
        <span className="text-sm font-semibold text-t1">网页构建完成</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-center">
        {[
          { label: "章节", value: `${data.chapterCount} 章` },
          { label: "步骤", value: `${data.stepCount} 步` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-modal border border-blue-100 py-2">
            <p className="text-xs text-t3">{s.label}</p>
            <p className="text-sm font-semibold text-t1">{s.value}</p>
          </div>
        ))}
      </div>

      {devPort && (
        <a
          href={`http://127.0.0.1:${devPort}`}
          target="_blank"
          rel="noreferrer"
          className="block text-center text-xs text-blue-600 hover:underline"
        >
          在浏览器预览演示 →
        </a>
      )}

      <div className="border-t border-blue-100 pt-3">
        <p className="text-xs font-medium text-t2 mb-2">合成口播音频（可选）</p>

        {/* Running state */}
        {isBusy && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-t2">
              <span>合成中…</span>
              {synthStatus.total > 0 && (
                <span className="font-mono text-t3">
                  {synthStatus.completed} / {synthStatus.total} 条
                </span>
              )}
            </div>
            <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: synthStatus.total > 0 ? `${progress}%` : "100%" }}
              />
            </div>
            {synthStatus.total === 0 && (
              <p className="text-xs text-t3">提取旁白中…</p>
            )}
          </div>
        )}

        {/* Done state */}
        {isDone && (
          <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2.5 flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="text-xs text-green-700 font-medium">
              已合成 {synthStatus.total} 条音频
            </span>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
            合成失败，请检查 API Key 后重试
          </div>
        )}

        {/* Idle / Error — show form */}
        {(synthStatus.phase === "idle" || isError) && (
          <>
            <p className="text-xs text-t3 mb-3 leading-relaxed">
              合成后可用 <code className="bg-blue-100 px-1 rounded">?auto=1</code> 模式一键录屏，音视频天然同步。
            </p>

            {/* Provider picker */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`rounded-xl px-3 py-2 text-left border transition-colors ${
                    provider === p.id
                      ? "bg-accent text-t1 border-accent"
                      : "bg-modal border-bd hover:border-bd-hover"
                  }`}
                >
                  <p className="text-xs font-medium">{p.name}</p>
                  <p className={`text-xs mt-0.5 ${provider === p.id ? "text-t4" : "text-t3"}`}>
                    {p.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* API Key input */}
            <div className="relative mb-1">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder={provider === "openai" ? "sk-..." : "MiniMax API Key（或留空用 mmx-cli）"}
                className="w-full rounded-xl border border-bd px-3 py-2 pr-16 text-xs font-mono outline-none focus:border-bd-strong"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {apiKey && (
                  <span className="text-xs text-green-500" title="已记住">✓</span>
                )}
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="text-t4 hover:text-t2 text-xs"
                >
                  {showKey ? "隐藏" : "显示"}
                </button>
              </div>
            </div>
            <p className="text-xs text-t4 mb-3 pl-1">Key 仅存于本地浏览器，不上传服务器</p>

            <div className="flex gap-2">
              <button
                onClick={onSkip}
                className="flex-1 rounded-xl border border-bd py-2 text-xs text-t2 hover:bg-modal transition-colors"
              >
                跳过，手动后期
              </button>
              <button
                onClick={() => onSynthesize(provider, apiKey)}
                disabled={isBusy}
                className="flex-1 rounded-xl bg-accent py-2 text-xs font-medium text-t1 hover:bg-accent-hover disabled:opacity-50 transition-colors"
              >
                合成语音 →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
