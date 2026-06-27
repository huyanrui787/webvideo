"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STYLE_PRESETS, STYLE_PRESET_IDS, resolveActiveStyle, generateCustomPresetId } from "@/lib/illustration-style";
import type { StyleConfig, CustomPreset } from "@/lib/illustration-style";

interface Props {
  projectId: string;
  onClose: () => void;
}

type ActiveTab = "editor" | "preview";

export function ProjectStyleEditor({ projectId, onClose }: Props) {
  // ── State ────────────────────────────────────────────────────────
  const [styleConfig, setStyleConfig] = useState<StyleConfig>({ activePreset: "xiaobei" });
  const [activePreset, setActivePreset] = useState("xiaobei"); // currently selected card

  // Editor fields
  const [presetName, setPresetName] = useState("");
  const [visualDna, setVisualDna] = useState("");
  const [characterDesc, setCharacterDesc] = useState("");
  const [tab, setTab] = useState<ActiveTab>("editor");

  // Preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Persist
  const [savingPreset, setSavingPreset] = useState(false);
  const [applying, setApplying] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Preview cache
  const [presetPreviews, setPresetPreviews] = useState<Record<string, string | null>>({});
  const [previewsPending, setPreviewsPending] = useState<string[]>([]);
  const [previewsLoading, setPreviewsLoading] = useState(true);
  const [customPresets, setCustomPresets] = useState<Record<string, CustomPreset>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load config + previews on mount ──────────────────────────────
  useEffect(() => {
    fetch(`/api/projects/${projectId}/style`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.styleConfig) {
          const cfg = data.styleConfig as StyleConfig;
          setStyleConfig(cfg);
          const pid = cfg.activePreset || "xiaobei";
          setActivePreset(pid);
          loadPresetIntoEditor(pid, cfg);
        }
      })
      .catch(() => {});
  }, [projectId]);

  // Load global custom presets
  useEffect(() => {
    fetch("/api/style-presets/custom").then(r => r.ok ? r.json() : null).then(data => {
      if (data?.presets) setCustomPresets(data.presets);
    }).catch(() => {});
  }, []);

  // Load preset previews from public endpoint
  useEffect(() => {
    let active = true;
    let pollTimer: ReturnType<typeof setInterval>;

    async function load() {
      const res = await fetch("/api/illustration-presets");
      if (!res.ok) return;
      const data = await res.json();
      if (!active) return;
      setPresetPreviews((prev) => ({ ...prev, ...data.previews }));
      setPreviewsPending(data.pending ?? []);

      if (data.pending?.length > 0) {
        fetch("/api/illustration-presets", { method: "POST" }).catch(() => {});
        pollTimer = setInterval(async () => {
          const r2 = await fetch("/api/illustration-presets");
          if (!r2.ok) return;
          const d2 = await r2.json();
          if (!active) return;
          setPresetPreviews((prev) => ({ ...prev, ...d2.previews }));
          setPreviewsPending(d2.pending ?? []);
          if (d2.pending?.length === 0) clearInterval(pollTimer);
        }, 6000);
      }
      setPreviewsLoading(false);
    }
    load();
    return () => { active = false; if (pollTimer) clearInterval(pollTimer); };
  }, []);

  // ── Load a preset (built-in or custom) into the editor ──────────
  function loadPresetIntoEditor(presetId: string, cfg?: StyleConfig) {
    const c = cfg ?? styleConfig;
    if (presetId.startsWith("custom-")) {
      // Check global custom presets first, then project-level
      const cp = customPresets[presetId] ?? c.customPresets?.[presetId];
      if (cp) {
        setPresetName(cp.name);
        setVisualDna(cp.visualDna);
        setCharacterDesc(cp.characterDescription);
        return;
      }
    }
    if (STYLE_PRESETS[presetId]) {
      setPresetName(STYLE_PRESETS[presetId].label);
      setVisualDna(STYLE_PRESETS[presetId].visualDna);
      setCharacterDesc(STYLE_PRESETS[presetId].characterDescription);
    }
  }

  const handleSelectPreset = useCallback((presetId: string) => {
    setActivePreset(presetId);
    loadPresetIntoEditor(presetId);
  }, [styleConfig]);

  // ── Analyze uploaded image ──────────────────────────────────────
  const handleUploadSample = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);
    try {
      const form = new FormData(); form.append("file", file);
      const res = await fetch("/api/analyze-style", { method: "POST", body: form });
      const data = await res.json();
      if (data.ok) {
        setVisualDna(data.visualDna ?? "");
        setCharacterDesc(data.characterDescription ?? "");
        setPresetName("自定义 - 分析结果");
      } else {
        alert("分析失败：" + (data.error || "未知错误"));
      }
    } catch { alert("分析失败，请重试"); }
    finally { setAnalyzing(false); e.target.value = ""; }
  }, []);

  // ── Manual Preview ──────────────────────────────────────────────
  const handlePreview = useCallback(async () => {
    setPreviewing(true); setPreviewError(null); setPreviewUrl(null);
    const prompt = [
      "Generate one standalone 16:9 horizontal illustration.", "",
      "Visual DNA:", visualDna, "",
      "Recurring IP character required:", characterDesc, "",
      "Core idea: A simple scene demonstrating the visual style with a single character performing an action.",
    ].join("\n");
    try {
      const res = await fetch(`/api/projects/${projectId}/style?action=preview`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.ok) setPreviewUrl(data.image);
      else setPreviewError(data.error || "生成失败");
    } catch { setPreviewError("网络错误"); }
    finally { setPreviewing(false); }
  }, [projectId, visualDna, characterDesc]);

  // ── Save as new custom preset ───────────────────────────────────
  const handleSavePreset = useCallback(async () => {
    if (!visualDna.trim() || !characterDesc.trim()) return;
    setSavingPreset(true);
    try {
      const name = presetName.trim() || `自定义风格 ${Object.keys(customPresets).length + 1}`;
      const presetsBody = { name, visualDna: visualDna.trim(), characterDescription: characterDesc.trim() };
      const res = await fetch("/api/style-presets/custom", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(presetsBody),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      // Update local state
      setCustomPresets(prev => ({ ...prev, [data.id]: presetsBody }));
      setActivePreset(data.id);
      setPresetName(name);
    } catch { alert("保存失败"); }
    finally { setSavingPreset(false); }
  }, [customPresets, presetName, visualDna, characterDesc]);

  // ── Apply selected preset ───────────────────────────────────────
  const handleApply = useCallback(async () => {
    setApplying(true);
    try {
      // Inline custom preset data so project is self-contained
      const updatedCustoms = { ...(styleConfig.customPresets ?? {}) };
      if (activePreset.startsWith("custom-") && customPresets[activePreset] && !updatedCustoms[activePreset]) {
        updatedCustoms[activePreset] = customPresets[activePreset];
      }
      const updated: StyleConfig = {
        ...styleConfig,
        activePreset,
        customPresets: updatedCustoms,
      };
      const res = await fetch(`/api/projects/${projectId}/style`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ styleConfig: updated }),
      });
      if (!res.ok) throw new Error();
      onClose();
    } catch { alert("应用失败"); }
    finally { setApplying(false); }
  }, [projectId, styleConfig, activePreset, onClose]);

  const close = useCallback(() => onClose(), [onClose]);

  // ── Compute all preset entries (built-in + global custom) ────────
  const mergedCustoms = { ...styleConfig.customPresets, ...customPresets };
  const allPresets = [
    ...STYLE_PRESET_IDS.map((id) => ({ id, type: "builtin" as const, label: STYLE_PRESETS[id].label })),
    ...Object.entries(mergedCustoms).map(([id, cp]) => ({ id, type: "custom" as const, label: (cp as CustomPreset).name })),
  ];

  const editorPresetName = presetName;
  const isCustomEditing = activePreset.startsWith("custom-");

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="w-[95vw] max-w-4xl max-h-[90vh] bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-base font-semibold text-white">画面风格</h2>
          <button onClick={close} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-lg">×</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ── Left: Preset grid ──────────────────────────────── */}
          <div className="w-72 shrink-0 border-r border-zinc-800 overflow-y-auto p-4 space-y-4">
            <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">预设风格</p>
            <div className="grid grid-cols-2 gap-2">
              {allPresets.map(({ id, type, label }) => {
                const isSelected = activePreset === id;
                const preview = presetPreviews[id];
                const isPending = previewsPending.includes(id) || previewsLoading;
                return (
                  <button
                    key={id}
                    onClick={() => handleSelectPreset(id)}
                    className={`rounded-lg overflow-hidden border-2 transition-all text-left ${
                      isSelected ? "border-amber-500" : type === "custom" ? "border-indigo-500/30 hover:border-indigo-500/50" : "border-zinc-700 hover:border-zinc-600"
                    }`}
                  >
                    <div className="bg-black" style={{ aspectRatio: "16/9" }}>
                      {preview ? (
                        <img src={preview} alt={label} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800">
                          {isPending ? (
                            <>
                              <div className="w-3 h-3 rounded-full border-2 border-zinc-600 border-t-zinc-300 animate-spin" />
                              <span className="text-[8px] text-zinc-600 mt-1">生成中</span>
                            </>
                          ) : (
                            <span className="text-[8px] text-zinc-600">{type === "custom" ? "自定义" : "预览"}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-1.5 truncate">
                      <span className={`text-[11px] font-medium truncate block ${isSelected ? "text-amber-400" : type === "custom" ? "text-indigo-300" : "text-zinc-300"}`}>
                        {label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Right: Editor ──────────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Tab: Editor / Preview */}
              <div className="flex items-center gap-1 border-b border-zinc-800 pb-2">
                <button onClick={() => setTab("editor")} className={`px-3 py-1 rounded-md text-xs transition-colors ${tab === "editor" ? "bg-zinc-800 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"}`}>编辑</button>
                <button onClick={() => setTab("preview")} className={`px-3 py-1 rounded-md text-xs transition-colors ${tab === "preview" ? "bg-zinc-800 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"}`}>预览</button>
              </div>

              {tab === "editor" && (
                <>
                  {/* Style name */}
                  <div>
                    <label className="text-[11px] text-zinc-500 mb-1.5 block">风格名称</label>
                    <input value={presetName} onChange={(e) => setPresetName(e.target.value)}
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50 placeholder:text-zinc-600"
                      placeholder="给这个风格起个名字…" />
                  </div>

                  {/* Upload sample */}
                  <div>
                    <label className="text-[11px] text-zinc-500 mb-1.5 block">参考图片 <span className="text-zinc-600">（可选）上传样本图，AI 自动分析风格</span></label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => fileInputRef.current?.click()} disabled={analyzing}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors border border-zinc-700 disabled:opacity-50">
                        {analyzing ? "分析中…" : "上传图片分析"}
                      </button>
                      {analyzing && <span className="text-xs text-amber-400 animate-pulse">AI 分析风格中…</span>}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadSample} />
                  </div>

                  {/* Visual DNA */}
                  <div>
                    <label className="text-[11px] text-zinc-500 mb-1.5 block">画面风格描述</label>
                    <textarea value={visualDna} onChange={(e) => setVisualDna(e.target.value)} rows={4}
                      className="w-full text-xs text-zinc-300 bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 resize-none focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-zinc-600 font-mono leading-relaxed"
                      placeholder="纯白背景，黑色手绘线条，极简风格…" />
                  </div>

                  {/* Character description */}
                  <div>
                    <label className="text-[11px] text-zinc-500 mb-1.5 block">角色形象描述</label>
                    <textarea value={characterDesc} onChange={(e) => setCharacterDesc(e.target.value)} rows={3}
                      className="w-full text-xs text-zinc-300 bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 resize-none focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-zinc-600 font-mono leading-relaxed"
                      placeholder="黑色小怪物，白色圆点眼睛，细长腿…" />
                  </div>

                  {/* Save as custom preset */}
                  <button onClick={handleSavePreset} disabled={savingPreset || !visualDna.trim() || !characterDesc.trim()}
                    className="w-full py-2 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-medium hover:bg-indigo-500/30 transition-colors disabled:opacity-40">
                    {savingPreset ? "保存中…" : (isCustomEditing ? "更新此自定义风格" : "保存为自定义风格")}
                  </button>
                </>
              )}

              {tab === "preview" && (
                <div className="space-y-3">
                  <button onClick={handlePreview} disabled={previewing}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors border border-zinc-700 disabled:opacity-50">
                    {previewing ? "生成中…" : "生成预览图"}
                  </button>
                  {previewing && <span className="text-xs text-amber-400 animate-pulse">生成中（约 90 秒）…</span>}
                  {previewUrl ? (
                    <div className="rounded-xl overflow-hidden border border-zinc-700 bg-black" style={{ aspectRatio: "16/9" }}>
                      <img src={previewUrl} alt="预览" className="w-full h-full object-cover" />
                    </div>
                  ) : previewError ? (
                    <p className="text-xs text-red-400">{previewError}</p>
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-800/20 flex items-center justify-center" style={{ aspectRatio: "16/9" }}>
                      <span className="text-xs text-zinc-600">点击生成预览图查看效果</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-800 shrink-0">
              <button onClick={close} className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-300 transition-colors">取消</button>
              <button onClick={handleApply} disabled={applying}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-medium transition-colors disabled:opacity-50">
                {applying ? "应用…" : "应用此风格"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
