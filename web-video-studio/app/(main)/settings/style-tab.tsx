"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STYLE_PRESETS, STYLE_PRESET_IDS } from "@/lib/illustration-style";
import type { CustomPreset } from "@/lib/illustration-style";

export function StyleSettingsTab() {
  // ── State ────────────────────────────────────────────────────────
  const [customPresets, setCustomPresets] = useState<Record<string, CustomPreset>>({});
  const [defaultPreset, setDefaultPreset] = useState("");
  const [presetPreviews, setPresetPreviews] = useState<Record<string, string | null>>({});

  // Editor state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editVisualDna, setEditVisualDna] = useState("");
  const [editCharacterDesc, setEditCharacterDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load data ────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    // Load custom presets
    const presetsRes = await fetch("/api/style-presets/custom");
    if (presetsRes.ok) {
      const data = await presetsRes.json();
      if (data.presets) setCustomPresets(data.presets);
    }
    // Load global default
    const settingsRes = await fetch("/api/settings");
    if (settingsRes.ok) {
      const data = await settingsRes.json();
      if (data?.defaultStylePreset) setDefaultPreset(data.defaultStylePreset);
    }
    // Load previews
    const previewsRes = await fetch("/api/illustration-presets");
    if (previewsRes.ok) {
      const data = await previewsRes.json();
      if (data.previews) setPresetPreviews(data.previews);
      if (data.pending?.length > 0) {
        fetch("/api/illustration-presets", { method: "POST" }).catch(() => {});
      }
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Set default preset ───────────────────────────────────────────
  const handleSetDefault = useCallback(async (presetId: string) => {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultStylePreset: presetId }),
    });
    setDefaultPreset(presetId);
  }, []);

  // ── Edit / New ───────────────────────────────────────────────────
  // ── Preview ──────────────────────────────────────────────────────
  const handlePreview = useCallback(async () => {
    if (!editVisualDna.trim() || !editCharacterDesc.trim()) return;
    setPreviewing(true); setPreviewUrl(null);
    const prompt = [
      "Generate one standalone 16:9 horizontal illustration.", "",
      "Visual DNA:", editVisualDna, "",
      "Recurring IP character required:", editCharacterDesc, "",
      "Core idea: A simple scene demonstrating the visual style.",
    ].join("\n");
    try {
      const res = await fetch("/api/illustration-presets", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.ok) setPreviewUrl(data.image);
      else alert(data.error || "生成失败（请检查 API 额度）");
    } catch (err) { alert("网络错误: " + (err instanceof Error ? err.message : "")); }
    finally { setPreviewing(false); }
  }, [editVisualDna, editCharacterDesc]);

  const handleNew = useCallback(() => {
    setEditId(null);
    setEditName("");
    setEditVisualDna("");
    setEditCharacterDesc("");
    setPreviewUrl(null);
  }, []);

  const handleEdit = useCallback((id: string, cp: CustomPreset) => {
    setEditId(id);
    setEditName(cp.name);
    setEditVisualDna(cp.visualDna);
    setEditCharacterDesc(cp.characterDescription);
    setPreviewUrl(null);
  }, []);

  // ── Upload Image Analysis ────────────────────────────────────────
  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);
    try {
      const form = new FormData(); form.append("file", file);
      const res = await fetch("/api/analyze-style", { method: "POST", body: form });
      const data = await res.json();
      if (data.ok) {
        setEditVisualDna(data.visualDna ?? "");
        setEditCharacterDesc(data.characterDescription ?? "");
      } else {
        alert(data.error || "分析失败");
      }
    } catch { alert("网络错误"); }
    finally { setAnalyzing(false); e.target.value = ""; }
  }, []);

  // ── Save preset ──────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!editName.trim() || !editVisualDna.trim() || !editCharacterDesc.trim()) return;
    setSaving(true);
    try {
      const body: any = { name: editName.trim(), visualDna: editVisualDna.trim(), characterDescription: editCharacterDesc.trim() };
      if (editId) body.presetId = editId;
      const res = await fetch("/api/style-presets/custom", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCustomPresets(prev => ({ ...prev, [data.id]: { name: body.name, visualDna: body.visualDna, characterDescription: body.characterDescription } }));
      setEditId(data.id);
    } catch { alert("保存失败"); }
    finally { setSaving(false); }
  }, [editId, editName, editVisualDna, editCharacterDesc]);

  // ── Delete preset ────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    const res = await fetch(`/api/style-presets/custom?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setCustomPresets(prev => { const n = { ...prev }; delete n[id]; return n; });
      if (editId === id) handleNew();
      if (defaultPreset === id) { setDefaultPreset(""); fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ defaultStylePreset: "" }) }); }
    }
  }, [editId, defaultPreset, handleNew]);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Built-in presets display */}
      <div>
        <h3 className="text-sm font-semibold text-t1 mb-3">预设风格</h3>
        <div className="grid grid-cols-5 gap-2">
          {STYLE_PRESET_IDS.map((id) => {
            const isDefault = defaultPreset === id;
            return (
              <button
                key={id}
                onClick={() => handleSetDefault(id)}
                className={`rounded-lg overflow-hidden border-2 transition-all text-left ${
                  isDefault ? "border-amber-500 ring-1 ring-amber-500/30" : "border-zinc-700 hover:border-zinc-600"
                }`}
              >
                <div className="h-[56px] bg-black flex items-center justify-center overflow-hidden">
                  {presetPreviews[id] ? (
                    <img src={presetPreviews[id]} alt={STYLE_PRESETS[id].label} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-zinc-300 animate-spin" />
                  )}
                </div>
                <div className={`px-2 py-1.5 text-[11px] truncate ${isDefault ? "text-amber-400" : "text-zinc-300"}`}>
                  {STYLE_PRESETS[id].label}
                  {isDefault && <span className="ml-1 text-[9px] text-amber-500">默认</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom presets CRUD */}
      <div className="border-t border-zinc-800 pt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-t1">我的自定义风格</h3>
          <button onClick={handleNew} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">+ 新建</button>
        </div>

        {/* Editor */}
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-4 space-y-3 mb-4">
          <input value={editName} onChange={(e) => setEditName(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
            placeholder="风格名称" />
          <textarea value={editVisualDna} onChange={(e) => setEditVisualDna(e.target.value)} rows={3}
            className="w-full text-xs text-zinc-300 bg-zinc-800/50 border border-zinc-700 rounded-lg p-2 resize-none focus:outline-none focus:border-amber-500/50"
            placeholder="画面风格描述…" />
          <textarea value={editCharacterDesc} onChange={(e) => setEditCharacterDesc(e.target.value)} rows={2}
            className="w-full text-xs text-zinc-300 bg-zinc-800/50 border border-zinc-700 rounded-lg p-2 resize-none focus:outline-none focus:border-amber-500/50"
            placeholder="角色形象描述…" />
          <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} disabled={analyzing}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50">
              {analyzing ? "分析中…" : "上传图片分析"}
            </button>
            <button onClick={handlePreview} disabled={previewing}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50">
              {previewing ? "生成中…" : "生成预览"}
            </button>
            {previewUrl && (
              <div className="w-32 rounded overflow-hidden border border-zinc-700 bg-black shrink-0" style={{ aspectRatio: "16/9" }}>
                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={handleSave} disabled={saving || !editName.trim() || !editVisualDna.trim() || !editCharacterDesc.trim()}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-medium disabled:opacity-50">
              {saving ? "保存中…" : editId ? "更新" : "保存"}
            </button>
          </div>
        </div>

        {/* Saved custom presets list */}
        {Object.keys(customPresets).length === 0 ? (
          <p className="text-xs text-zinc-500">还没有自定义风格，点击"+ 新建"创建一个</p>
        ) : (
          <div className="space-y-1.5">
            {Object.entries(customPresets).map(([id, cp]) => {
              const isDefault = defaultPreset === id;
              return (
                <div key={id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-800/20 border border-zinc-800">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-200 truncate">
                      {cp.name}
                      {isDefault && <span className="ml-1.5 text-[10px] text-amber-500">默认</span>}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">{cp.visualDna.slice(0, 60)}…</p>
                  </div>
                  <button onClick={() => handleSetDefault(id)}
                    className={`text-[11px] px-2 py-1 rounded transition-colors ${isDefault ? "text-amber-400 bg-amber-500/10" : "text-zinc-500 hover:text-zinc-300"}`}>
                    {isDefault ? "已默认" : "设为默认"}
                  </button>
                  <button onClick={() => handleEdit(id, cp)} className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs px-1">✎</button>
                  <button onClick={() => handleDelete(id)} className="text-zinc-500 hover:text-red-400 transition-colors text-xs px-1">×</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
