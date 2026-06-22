"use client";

import { useState } from "react";

interface ImageGenPanelProps {
  projectId: string;
  onGenerated: () => void;
}

const MODELS = [
  { id: "schnell", label: "FLUX Schnell", desc: "快速 ~3s，$0.003/张" },
  { id: "pro", label: "FLUX Pro", desc: "高质量 ~10s，$0.05/张" },
];

const SIZES = [
  { id: "landscape_4_3", label: "横屏 4:3" },
  { id: "landscape_16_9", label: "横屏 16:9" },
  { id: "square_hd", label: "正方形" },
  { id: "portrait_4_3", label: "竖屏 4:3" },
];

export function ImageGenPanel({ projectId, onGenerated }: ImageGenPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("schnell");
  const [size, setSize] = useState("landscape_4_3");
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState<{ url: string; name: string } | null>(null);

  async function generate() {
    if (!prompt.trim() || status === "generating") return;
    setStatus("generating");
    setError("");
    setLastResult(null);

    const res = await fetch(`/api/projects/${projectId}/generate-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model, size }),
    });
    const data = await res.json();

    if (res.ok && data.ok) {
      setLastResult({ url: data.url, name: data.name });
      setStatus("done");
      onGenerated();
    } else {
      setError(data.error ?? "生成失败");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-3 px-3 pt-2 pb-3">
      {/* Prompt */}
      <div>
        <label className="text-[10px] text-t3 block mb-1">描述图片内容</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="例：一位年轻工程师在办公室使用电脑，科技感背景，蓝紫色调"
          rows={3}
          className="w-full rounded-xl border border-bd px-3 py-2 text-xs outline-none focus:border-bd-strong resize-none leading-relaxed"
        />
      </div>

      {/* Model */}
      <div className="grid grid-cols-2 gap-1.5">
        {MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => setModel(m.id)}
            className={`rounded-xl px-2 py-2 text-left border transition-colors ${
              model === m.id
                ? "bg-accent text-t1 border-accent"
                : "bg-modal border-bd hover:border-bd-hover"
            }`}
          >
            <p className={`text-[10px] font-medium ${model === m.id ? "text-t1" : "text-t2"}`}>{m.label}</p>
            <p className={`text-[10px] mt-0.5 ${model === m.id ? "text-t4" : "text-t3"}`}>{m.desc}</p>
          </button>
        ))}
      </div>

      {/* Size */}
      <div className="flex gap-1 flex-wrap">
        {SIZES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSize(s.id)}
            className={`rounded-lg px-2 py-1 text-[10px] font-medium transition-colors border ${
              size === s.id
                ? "bg-indigo-600 text-t1 border-indigo-600"
                : "bg-base text-t2 border-bd hover:border-bd-hover"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {status === "error" && (
        <p className="text-[10px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-2 py-1">
          {error.includes("FAL_KEY") ? "请在 .env.local 配置 FAL_KEY" : error}
        </p>
      )}

      {/* Result preview */}
      {lastResult && (
        <div className="rounded-xl overflow-hidden border border-green-200 bg-green-50">
          <img src={lastResult.url} alt="生成结果" className="w-full h-32 object-cover" />
          <p className="text-[10px] text-green-700 px-2 py-1.5 font-medium">✓ 已保存到项目素材</p>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={!prompt.trim() || status === "generating"}
        className="rounded-xl bg-indigo-600 py-2.5 text-xs font-medium text-t1 hover:bg-indigo-500 disabled:opacity-40 transition-colors"
      >
        {status === "generating" ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full" />
            AI 生成中…
          </span>
        ) : (
          "✨ 生成图片"
        )}
      </button>

      <p className="text-[10px] text-t4 text-center -mt-1">生成后自动存入项目素材，AI 写章节时可直接引用</p>
    </div>
  );
}
