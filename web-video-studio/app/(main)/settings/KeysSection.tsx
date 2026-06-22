"use client";

import { useEffect, useState } from "react";

interface KeyStatus {
  configured: boolean;
  preview: string;
}

interface KeysData {
  keys: Record<string, KeyStatus>;
  endpoints: Record<string, string>;
}

const KEY_DEFS: {
  id: string;
  label: string;
  desc: string;
  placeholder: string;
}[] = [
  {
    id: "anthropic",
    label: "Anthropic API Key",
    desc: "Claude 模型调用（必填）",
    placeholder: "sk-ant-…",
  },
  {
    id: "heygen",
    label: "HeyGen API Key",
    desc: "AI 数字人视频生成",
    placeholder: "…",
  },
  {
    id: "fal",
    label: "Fal.ai Key",
    desc: "Kling Lipsync 图像生成",
    placeholder: "…",
  },
  {
    id: "dashscope",
    label: "DashScope API Key",
    desc: "阿里云 TTS 语音合成",
    placeholder: "sk-…",
  },
  {
    id: "deepseek",
    label: "DeepSeek API Key",
    desc: "DeepSeek 推理模型",
    placeholder: "sk-…",
  },
  {
    id: "gptImage",
    label: "GPT Image Key",
    desc: "GPT-Image-2 图像生成",
    placeholder: "sk-…",
  },
  {
    id: "stripe",
    label: "Stripe Secret Key",
    desc: "支付集成（可选，桌面端通常不需要）",
    placeholder: "sk_live_…",
  },
];

const ENDPOINT_DEFS: {
  id: string;
  label: string;
  desc: string;
  placeholder: string;
}[] = [
  {
    id: "anthropicBaseUrl",
    label: "Anthropic Base URL",
    desc: "API 代理地址，默认 https://qqqapi.com",
    placeholder: "https://qqqapi.com",
  },
  {
    id: "buildAnthropicBaseUrl",
    label: "Build Base URL",
    desc: "构建流水线的 API 地址，默认同上",
    placeholder: "https://qqqapi.com",
  },
  {
    id: "gptImageBaseUrl",
    label: "GPT Image Base URL",
    desc: "GPT 图像生成 API 地址",
    placeholder: "https://qqqapi.com",
  },
];

export function KeysSection() {
  const [keys, setKeys] = useState<Record<string, KeyStatus>>({});
  const [endpoints, setEndpoints] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/settings/keys")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setKeys(data.keys);
          setEndpoints(data.endpoints || {});
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function saveKey(keyId: string) {
    const val = values[keyId] || "";
    if (!val.trim()) {
      // Delete the key
      setSaving(keyId);
      await fetch(`/api/settings/keys?key=${encodeURIComponent(keyId)}`, {
        method: "DELETE",
      });
      setKeys((prev) => ({
        ...prev,
        [keyId]: { configured: false, preview: "" },
      }));
      setEditing(null);
      setSaving(null);
      return;
    }

    setSaving(keyId);
    setError("");
    try {
      const res = await fetch("/api/settings/keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [keyId]: val }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "保存失败");
      } else {
        setKeys((prev) => ({
          ...prev,
          [keyId]: {
            configured: true,
            preview: mask(val),
          },
        }));
        setEditing(null);
      }
    } catch {
      setError("网络错误");
    }
    setSaving(null);
  }

  async function saveEndpoint(endpointId: string) {
    const val = values[endpointId] || "";
    setSaving(endpointId);
    setError("");
    try {
      const res = await fetch("/api/settings/keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [endpointId]: val }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "保存失败");
      } else {
        setEndpoints((prev) => ({ ...prev, [endpointId]: val }));
        setEditing(null);
      }
    } catch {
      setError("网络错误");
    }
    setSaving(null);
  }

  function startEdit(id: string, current: string) {
    setEditing(id);
    setValues((prev) => ({ ...prev, [id]: current }));
    setError("");
  }

  if (!loaded) {
    return (
      <div>
        <h2 className="text-xl font-bold text-t1 mb-1">API 密钥</h2>
        <p className="text-sm text-t3">加载中…</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-t1 mb-1">API 密钥</h2>
      <p className="text-sm text-t3 mb-6">
        配置 AI 服务的 API Key。密钥加密存储，不会上传到云端。
        {typeof window !== "undefined" && !(window as any).electronAPI && (
          <span className="block mt-1 text-amber-500">
            💡 开发模式：也可通过 .env.local 设置环境变量
          </span>
        )}
      </p>

      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* API Keys */}
      <div className="flex flex-col gap-3 mb-8">
        <h3 className="text-sm font-semibold text-t1">API Keys</h3>
        {KEY_DEFS.map((def) => {
          const status = keys[def.id];
          const isEditing = editing === def.id;
          const isSaving = saving === def.id;

          return (
            <div
              key={def.id}
              className="rounded-xl border border-bd bg-modal px-4 py-3"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-t1">
                    {def.label}
                    {status?.configured && !isEditing && (
                      <span className="ml-2 text-xs text-green-500">✓ 已配置</span>
                    )}
                  </p>
                  <p className="text-xs text-t3 mt-0.5">{def.desc}</p>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="password"
                      value={values[def.id] || ""}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [def.id]: e.target.value,
                        }))
                      }
                      placeholder={def.placeholder}
                      className="w-56 px-3 py-1.5 rounded-lg border border-bd bg-base text-sm text-t1 focus:outline-none focus:border-accent"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveKey(def.id);
                        if (e.key === "Escape") setEditing(null);
                      }}
                    />
                    <button
                      onClick={() => saveKey(def.id)}
                      disabled={isSaving}
                      className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-text text-xs font-medium disabled:opacity-40 transition-colors"
                    >
                      {isSaving ? "…" : "保存"}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="px-2 py-1.5 text-xs text-t3 hover:text-t1"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-t4 font-mono select-none">
                      {status?.preview || "未设置"}
                    </span>
                    <button
                      onClick={() => startEdit(def.id, "")}
                      className="px-3 py-1.5 rounded-lg border border-bd hover:bg-surface2 text-xs text-t2 transition-colors"
                    >
                      {status?.configured ? "修改" : "设置"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Endpoints */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-t1">API 端点</h3>
        {ENDPOINT_DEFS.map((def) => {
          const current = endpoints[def.id] || "";
          const isEditing = editing === def.id;
          const isSaving = saving === def.id;

          return (
            <div
              key={def.id}
              className="rounded-xl border border-bd bg-modal px-4 py-3"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-t1">{def.label}</p>
                  <p className="text-xs text-t3 mt-0.5">{def.desc}</p>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      value={values[def.id] || ""}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [def.id]: e.target.value,
                        }))
                      }
                      placeholder={def.placeholder}
                      className="w-56 px-3 py-1.5 rounded-lg border border-bd bg-base text-sm text-t1 focus:outline-none focus:border-accent"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEndpoint(def.id);
                        if (e.key === "Escape") setEditing(null);
                      }}
                    />
                    <button
                      onClick={() => saveEndpoint(def.id)}
                      disabled={isSaving}
                      className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-text text-xs font-medium disabled:opacity-40 transition-colors"
                    >
                      {isSaving ? "…" : "保存"}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="px-2 py-1.5 text-xs text-t3 hover:text-t1"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-t4 font-mono select-none">
                      {current || "（使用默认）"}
                    </span>
                    <button
                      onClick={() => startEdit(def.id, current)}
                      className="px-3 py-1.5 rounded-lg border border-bd hover:bg-surface2 text-xs text-t2 transition-colors"
                    >
                      {current ? "修改" : "设置"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function mask(val: string): string {
  if (val.length <= 8) return "••••";
  return val.slice(0, 4) + "••••" + val.slice(-4);
}
