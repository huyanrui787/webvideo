"use client";

import { useRef, useState, useCallback, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────

interface TimelineSegment {
  chapterId: string;
  stepIdx: number;
  illustration: string;
  narration?: string;
  durationSec: number;
  kenBurns?: { scale: number; panX: number; panY: number };
  mp3Path?: string;
  mp3Url?: string;
  imageStatus?: "done" | "error" | "pending";
  error?: string;
}

interface IllustEditModalProps {
  timeline: TimelineSegment[];
  assetBase: string;
  audioBase: string;
  projectId: string;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────

export function IllustEditModal({
  timeline,
  assetBase,
  audioBase,
  projectId,
  onClose,
}: IllustEditModalProps) {
  // ── Editable state ───────────────────────────────────────────────
  const [items, setItems] = useState(() =>
    timeline.map((seg, i) => ({
      key: `${seg.stepIdx}-${i}`,
      seg,
      narration: seg.narration ?? "",
      deleted: false,
      originalIndex: i,
      replacedFile: null as File | null, // pending replace
    })),
  );

  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [regeneratePrompt, setRegeneratePrompt] = useState<Record<number, string>>({});
  const [regenerateOpen, setRegenerateOpen] = useState<Set<number>>(() =>
    new Set(timeline.filter((s) => s.imageStatus === "error" || (!s.illustration && (s as any).status === "error")).map((s) => s.stepIdx)),
  );
  const [regenerating, setRegenerating] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<number | null>(null);

  const activeItems = useMemo(() => items.filter((it) => !it.deleted), [items]);
  const doneCount = activeItems.filter((it) => it.seg.imageStatus !== "error" && it.seg.illustration).length;
  const errorCount = activeItems.filter((it) => it.seg.imageStatus === "error" || !it.seg.illustration).length;

  // ── Helpers ──────────────────────────────────────────────────────
  const imgUrl = useCallback(
    (illustration: string, replacedFile: File | null): string => {
      if (replacedFile) return URL.createObjectURL(replacedFile);
      if (!illustration) return "";
      if (illustration.startsWith("/") || illustration.startsWith("http")) return illustration;
      return `${assetBase}/${encodeURIComponent(illustration)}`;
    },
    [assetBase],
  );

  const resolveAudio = useCallback(
    (seg: TimelineSegment): string | null => {
      if (seg.mp3Url) return seg.mp3Url;
      if (seg.mp3Path) {
        if (seg.mp3Path.startsWith("/")) return seg.mp3Path;
        return `${audioBase}/${seg.mp3Path}`;
      }
      return null;
    },
    [audioBase],
  );

  // ── Audio play ───────────────────────────────────────────────────
  const handlePlay = useCallback(
    (idx: number) => {
      if (playingIdx === idx) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current = null;
        }
        setPlayingIdx(null);
        return;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      const seg = activeItems[idx]?.seg;
      if (!seg) return;
      const url = resolveAudio(seg);
      if (!url) return;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.addEventListener("ended", () => {
        setPlayingIdx(null);
        audioRef.current = null;
      });
      audio.play().catch(() => {
        setPlayingIdx(null);
        audioRef.current = null;
      });
      setPlayingIdx(idx);
    },
    [activeItems, resolveAudio],
  );

  // ── Drag & drop ──────────────────────────────────────────────────
  const handleDragStart = useCallback(
    (idx: number) => (e: React.DragEvent) => {
      setDragIdx(idx);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(idx));
    },
    [],
  );

  const handleDragOver = useCallback(
    (idx: number) => (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    [],
  );

  const handleDrop = useCallback(
    (targetIdx: number) => (e: React.DragEvent) => {
      e.preventDefault();
      if (dragIdx === null || dragIdx === targetIdx) {
        setDragIdx(null);
        return;
      }
      setItems((prev) => {
        const arr = [...prev];
        const [moved] = arr.splice(dragIdx, 1);
        arr.splice(targetIdx, 0, moved);
        return arr;
      });
      setDragIdx(null);
    },
    [dragIdx],
  );

  // ── Narration edit ───────────────────────────────────────────────
  const handleNarrationChange = useCallback(
    (idx: number, value: string) => {
      setItems((prev) => {
        const arr = [...prev];
        arr[idx] = { ...arr[idx], narration: value };
        return arr;
      });
    },
    [],
  );

  // ── Delete ───────────────────────────────────────────────────────
  const handleDelete = useCallback((idx: number) => {
    setItems((prev) => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], deleted: true };
      return arr;
    });
  }, []);

  // ── Replace image ────────────────────────────────────────────────
  const handleReplaceClick = useCallback((idx: number) => {
    setReplaceTarget(idx);
    // Trigger file input after render
    setTimeout(() => fileInputRef.current?.click(), 0);
  }, []);

  const handleFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || replaceTarget === null) return;
      setItems((prev) => {
        const arr = [...prev];
        arr[replaceTarget] = { ...arr[replaceTarget], replacedFile: file };
        return arr;
      });
      setReplaceTarget(null);
      e.target.value = "";
    },
    [replaceTarget],
  );

  // ── Save ─────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const narrations: Record<number, string> = {};
      const reorder: number[] = [];
      const deleteImages: number[] = [];
      const replacements: Record<number, string> = {};

      for (const it of items) {
        const origStepIdx = it.seg.stepIdx;

        // Narrations changed
        if (it.narration !== (it.seg.narration ?? "")) {
          narrations[origStepIdx] = it.narration;
        }

        // Reorder: track the original stepIdx in new order (skip deleted)
        if (!it.deleted) {
          reorder.push(origStepIdx);
        }

        // Deleted
        if (it.deleted && it.seg.illustration) {
          deleteImages.push(origStepIdx);
        }

        // Replaced image
        if (it.replacedFile) {
          const b64 = await fileToBase64(it.replacedFile);
          replacements[origStepIdx] = b64.split(",")[1] ?? b64;
        }
      }

      const res = await fetch(`/api/projects/${projectId}/illust-edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ narrations, reorder, deleteImages, replacements }),
      });

      if (!res.ok) throw new Error("Save failed");

      window.dispatchEvent(new CustomEvent("assets-changed"));
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      alert("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  }, [items, projectId, onClose]);

  // ── Regenerate ────────────────────────────────────────────────
  const handleRegenerate = useCallback(
    async (idx: number) => {
      const it = activeItems[idx];
      if (!it || regenerating.has(it.seg.stepIdx)) return;

      const stepIdx = it.seg.stepIdx;
      setRegenerating((prev) => new Set(prev).add(stepIdx));

      try {
        const prompt = regeneratePrompt[stepIdx] || "";
        const res = await fetch(`/api/projects/${projectId}/gen-ill`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepIdx, prompt: prompt || undefined }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `Regenerate failed (${res.status})`);
        }

        // Clear the prompt and flag for reload
        setRegeneratePrompt((prev) => {
          const next = { ...prev };
          delete next[stepIdx];
          return next;
        });

        window.dispatchEvent(new CustomEvent("assets-changed"));
        window.location.reload();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "未知错误";
        console.error("Regenerate error:", err);
        alert(`重新生成失败：${msg}`);
      } finally {
        setRegenerating((prev) => {
          const next = new Set(prev);
          next.delete(stepIdx);
          return next;
        });
      }
    },
    [activeItems, projectId, regeneratePrompt, regenerating],
  );

  const close = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    onClose();
  }, [onClose]);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      onKeyDown={(e) => { if (e.key === "Escape") close(); }}
      tabIndex={0}
    >
      <div className="w-[95vw] max-w-7xl max-h-[88vh] bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 flex flex-col overflow-hidden">
        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-white">编辑插画</h2>
            <span className="text-xs text-zinc-500">
              {activeItems.length} 段
              <span className="text-green-400 ml-2">{doneCount} 已完成</span>
              {errorCount > 0 && <span className="text-red-400 ml-2">{errorCount} 失败</span>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "保存中…" : "保存更改"}
            </button>
            <button
              onClick={close}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-lg"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Card grid ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeItems.map((it, idx) => {
              const seg = it.seg;
              const isFailed = seg.imageStatus === "error" || (!seg.illustration && (seg as any).status === "error");
              const isPlaying = playingIdx === idx;
              const audioUrl = resolveAudio(seg);
              const isDragging = dragIdx === idx;

              return (
                <div
                  key={it.key}
                  draggable
                  onDragStart={handleDragStart(idx)}
                  onDragOver={handleDragOver(idx)}
                  onDrop={handleDrop(idx)}
                  className={`rounded-xl border overflow-hidden transition-all ${
                    isDragging ? "opacity-40 scale-95" : "opacity-100"
                  } ${
                    isFailed
                      ? "border-red-900/50 bg-zinc-800/50"
                      : isPlaying
                        ? "border-amber-500/40 bg-zinc-800"
                        : "border-zinc-800 bg-zinc-800/30 hover:border-zinc-700"
                  }`}
                >
                  {/* Thumbnail area (16:9) + drag handle */}
                  <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
                    {/* Drag handle */}
                    <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-b from-black/60 to-transparent z-10 flex items-center cursor-grab active:cursor-grabbing">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/40 ml-2">
                        <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
                        <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                        <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
                      </svg>
                    </div>

                    {/* Sequence number badge (top-left, below drag handle) */}
                    <span className="absolute top-6 left-2 z-10 bg-black/60 text-white text-[10px] font-mono px-1.5 py-0.5 rounded leading-tight">
                      {String(idx + 1).padStart(2, "0")}
                    </span>

                    {/* Delete button (top-right) */}
                    <button
                      onClick={() => handleDelete(idx)}
                      className="absolute top-2 right-2 z-10 w-5 h-5 flex items-center justify-center rounded bg-black/50 text-zinc-400 hover:text-red-400 hover:bg-red-900/40 transition-colors text-xs"
                      title="删除此图"
                    >
                      ×
                    </button>

                    {/* Failed badge */}
                    {isFailed && !it.replacedFile && (
                      <span className="absolute top-2 right-9 z-10 bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded">
                        失败
                      </span>
                    )}

                    {/* Image (clickable for replace) */}
                    {(it.replacedFile || (!isFailed && seg.illustration)) ? (
                      <button
                        onClick={() => handleReplaceClick(idx)}
                        className="w-full h-full block relative group"
                        title="点击替换图片"
                      >
                        <img
                          src={imgUrl(seg.illustration, it.replacedFile)}
                          alt={`step ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <span className="text-white/0 group-hover:text-white/80 text-[11px] font-medium transition-colors">
                            替换图片
                          </span>
                        </div>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReplaceClick(idx)}
                        className="w-full h-full flex flex-col items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 transition-colors"
                        title="上传图片"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="15" y1="9" x2="9" y2="15"/>
                          <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                        <span className="text-[10px] text-zinc-600">点击上传</span>
                      </button>
                    )}

                    {/* Playing indicator */}
                    {isPlaying && (
                      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        播放中
                      </div>
                    )}
                  </div>

                  {/* Content area */}
                  <div className="p-3 space-y-2">
                    {/* Narration textarea */}
                    <textarea
                      value={it.narration}
                      onChange={(e) => handleNarrationChange(idx, e.target.value)}
                      rows={2}
                      className="w-full text-xs text-zinc-300 bg-zinc-800/50 border border-zinc-700 rounded-lg p-2 resize-none focus:outline-none focus:border-amber-500/50 focus:bg-zinc-800 transition-colors placeholder:text-zinc-600"
                      placeholder="输入口播稿文字…"
                    />

                    {/* Regenerate section (collapsible) */}
                    {regenerateOpen.has(it.seg.stepIdx) ? (
                      <div className="space-y-1.5">
                        <textarea
                          value={regeneratePrompt[it.seg.stepIdx] ?? ""}
                          onChange={(e) =>
                            setRegeneratePrompt((prev) => ({
                              ...prev,
                              [it.seg.stepIdx]: e.target.value,
                            }))
                          }
                          rows={2}
                          className="w-full text-[11px] text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-lg p-1.5 resize-none focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-zinc-600"
                          placeholder="自定义提示词（留空使用自动生成）…"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleRegenerate(idx)}
                            disabled={regenerating.has(it.seg.stepIdx)}
                            className="flex-1 text-[11px] py-1 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                          >
                            {regenerating.has(it.seg.stepIdx) ? "生成中…" : "确认生成"}
                          </button>
                          <button
                            onClick={() =>
                              setRegenerateOpen((prev) => {
                                const next = new Set(prev);
                                next.delete(it.seg.stepIdx);
                                return next;
                              })
                            }
                            className="text-[11px] px-2 py-1 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setRegenerateOpen((prev) => new Set(prev).add(it.seg.stepIdx))
                        }
                        className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors self-start"
                      >
                        重新生成
                      </button>
                    )}

                    {/* Bottom row: replace + play */}
                    <div className="flex items-center justify-between pt-1">
                      {/* Replace button */}
                      <button
                        onClick={() => handleReplaceClick(idx)}
                        className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        换图
                      </button>

                      {/* Play button */}
                      <button
                        onClick={() => handlePlay(idx)}
                        disabled={!audioUrl}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                        title={audioUrl ? (isPlaying ? "停止" : "试听") : "无配音"}
                      >
                        {isPlaying ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                            <rect x="5" y="4" width="5" height="16" rx="1"/>
                            <rect x="14" y="4" width="5" height="16" rx="1"/>
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white" className="ml-0.5">
                            <polygon points="6,3 20,12 6,21"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hidden file input for image replacement */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  );
}

// ─── Utility ────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
