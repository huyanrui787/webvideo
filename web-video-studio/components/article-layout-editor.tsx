"use client";

import { useEffect, useState, useCallback } from "react";
import type { LayoutBlock } from "@/lib/db/schema";

// ─── Types ────────────────────────────────────────────────────────────────

interface ShotInfo {
  id: string;
  theme: string;
  structureType: string;
  coreIdea: string;
  assetUrl: string | null;
  generationStatus: string;
}

interface ArticleLayoutEditorProps {
  projectId: string;
}

type LoadState = "loading" | "ready" | "error" | "empty";

// ─── Component ─────────────────────────────────────────────────────────────

export function ArticleLayoutEditor({ projectId }: ArticleLayoutEditorProps) {
  const [blocks, setBlocks] = useState<LayoutBlock[]>([]);
  const [originalBlocks, setOriginalBlocks] = useState<LayoutBlock[]>([]);
  const [shots, setShots] = useState<ShotInfo[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);

  // ─── Data fetching ──────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [layoutRes, shotsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/articles/layout`),
        fetch(`/api/projects/${projectId}/illustrations/status`),
      ]);

      if (!layoutRes.ok) throw new Error("Failed to load layout");

      const layoutData = await layoutRes.json();
      const shotsData = await shotsRes.ok ? await shotsRes.json() : { shots: [] };

      const doneShots: ShotInfo[] = (shotsData.shots || [])
        .filter((s: ShotInfo) => s.generationStatus === "done");

      if (layoutData.blocks && layoutData.blocks.length > 0) {
        setBlocks(layoutData.blocks);
        setOriginalBlocks(layoutData.blocks);
        setShots(doneShots);
        setState("ready");
      } else {
        // No layout yet — try auto-layout
        setShots(doneShots);
        if (doneShots.length > 0) {
          setState("ready");
        } else {
          setState("empty");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
      setState("error");
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Auto-layout ───────────────────────────────────────────────────

  async function autoLayout() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/articles/layout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: [], // trigger server-side auto-layout via DB
          themeConfig: {},
        }),
      });
      if (res.ok) fetchData();
    } finally {
      setSaving(false);
      setDirty(false);
    }
  }

  // ─── Save ──────────────────────────────────────────────────────────

  async function saveLayout() {
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/articles/layout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks, themeConfig: {} }),
      });
      setOriginalBlocks(blocks);
      setDirty(false);
    } catch {
      setError("保存失败");
    } finally {
      setSaving(false);
    }
  }

  // ─── Block manipulation ────────────────────────────────────────────

  function updateBlock(index: number, patch: Partial<LayoutBlock>) {
    const next = blocks.map((b, i) => (i === index ? { ...b, ...patch } : b));
    setBlocks(next);
    setDirty(true);
  }

  function removeBlock(index: number) {
    setBlocks(blocks.filter((_, i) => i !== index));
    setDirty(true);
  }

  function insertIllustration(shot: ShotInfo, afterIndex: number) {
    const newBlock: LayoutBlock = {
      id: `illust-${Date.now()}`,
      type: "illustration",
      shotId: shot.id,
      illustrationUrl: shot.assetUrl ?? undefined,
      caption: shot.coreIdea?.slice(0, 20) ?? shot.theme ?? "",
      width: "full",
      spacingBefore: "large",
    };
    const next = [...blocks];
    next.splice(afterIndex + 1, 0, newBlock);
    setBlocks(next);
    setDirty(true);
  }

  function moveBlock(from: number, to: number) {
    if (from === to) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    setBlocks(next);
    setDirty(true);
  }

  // ─── Render: loading ───────────────────────────────────────────────

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-zinc-400">
        <span className="animate-pulse">加载排版数据…</span>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mx-3 my-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
        {error}
        <button onClick={fetchData} className="ml-3 underline">重试</button>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className="mx-3 my-8 text-center py-12 border-2 border-dashed border-zinc-200 rounded-2xl">
        <p className="text-sm text-zinc-500">暂无排版数据</p>
        <p className="text-xs text-zinc-400 mt-1 mb-4">
          {shots.length > 0
            ? "已有插图，点击下方按钮自动排版"
            : "请先在插图阶段生成插画"}
        </p>
        {shots.length > 0 && (
          <button
            onClick={autoLayout}
            disabled={saving}
            className="rounded-xl bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40"
          >
            {saving ? "排版中…" : "✨ 自动排版"}
          </button>
        )}
      </div>
    );
  }

  // ─── Render: editor ────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-900">图文排版</span>
          <span className="text-xs text-zinc-400">{blocks.length} 块</span>
          {dirty && <span className="text-xs text-amber-500">● 未保存</span>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={autoLayout}
            disabled={saving}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
          >
            🤖 自动排版
          </button>
          <button
            onClick={saveLayout}
            disabled={!dirty || saving}
            className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-30"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>

      {/* Main content: split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Illustration library */}
        <div className="w-52 border-r border-zinc-200 bg-zinc-50 overflow-y-auto p-2 shrink-0">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wide px-1 mb-2">
            插画库 ({shots.length})
          </p>
          <div className="space-y-1.5">
            {shots.map((shot) => (
              <div
                key={shot.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("shotId", shot.id)}
                className="rounded-lg bg-white border border-zinc-200 p-2 cursor-grab hover:border-zinc-400 transition-colors active:cursor-grabbing"
              >
                {shot.assetUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shot.assetUrl}
                    alt={shot.theme}
                    className="w-full h-16 object-cover rounded-md mb-1.5"
                  />
                )}
                <p className="text-[11px] font-medium text-zinc-800 truncate">{shot.theme}</p>
                <p className="text-[10px] text-zinc-400 truncate">{shot.coreIdea}</p>
              </div>
            ))}
          </div>
          {shots.length === 0 && (
            <p className="text-[11px] text-zinc-300 text-center py-8">
              暂无已生成的插画
            </p>
          )}
        </div>

        {/* Right: Layout preview */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-[640px] mx-auto py-6 px-4 space-y-4">
            {blocks.length === 0 ? (
              <div className="text-center py-16 text-sm text-zinc-400">
                拖拽左侧插画到这里，或点击「自动排版」
              </div>
            ) : (
              blocks.map((block, i) => (
                <div
                  key={block.id}
                  className={`relative group transition-colors rounded-lg ${
                    dragOver === i ? "bg-blue-50 ring-1 ring-blue-200" : ""
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(i);
                  }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(null);
                    const shotId = e.dataTransfer.getData("shotId");
                    if (shotId) {
                      const shot = shots.find((s) => s.id === shotId);
                      if (shot) insertIllustration(shot, i - 1);
                    }
                  }}
                >
                  {/* Block renderer */}
                  {block.type === "heading" && (
                    <div className="flex items-start gap-2 group/block">
                      <h2 className="text-lg font-bold text-zinc-900 flex-1">
                        {block.content}
                      </h2>
                      <div className="hidden group-hover/block:flex gap-1 pt-0.5">
                        <button
                          onClick={() => moveBlock(i, i - 1)}
                          disabled={i === 0}
                          className="text-[10px] text-zinc-300 hover:text-zinc-500 disabled:opacity-20"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveBlock(i, i + 1)}
                          disabled={i === blocks.length - 1}
                          className="text-[10px] text-zinc-300 hover:text-zinc-500 disabled:opacity-20"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeBlock(i)}
                          className="text-[10px] text-zinc-300 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {block.type === "paragraph" && (
                    <div className="flex items-start gap-2 group/block">
                      <p className="text-sm text-zinc-700 leading-relaxed flex-1">
                        {block.content}
                      </p>
                      <div className="hidden group-hover/block:flex gap-1 pt-0.5">
                        <button onClick={() => moveBlock(i, i - 1)} disabled={i === 0}
                          className="text-[10px] text-zinc-300 hover:text-zinc-500 disabled:opacity-20">↑</button>
                        <button onClick={() => moveBlock(i, i + 1)} disabled={i === blocks.length - 1}
                          className="text-[10px] text-zinc-300 hover:text-zinc-500 disabled:opacity-20">↓</button>
                        <button onClick={() => removeBlock(i)}
                          className="text-[10px] text-zinc-300 hover:text-red-400">✕</button>
                      </div>
                    </div>
                  )}

                  {block.type === "quote" && (
                    <div className="flex items-start gap-2 group/block">
                      <blockquote className="border-l-3 border-zinc-200 pl-3 text-sm text-zinc-500 italic flex-1">
                        {block.content}
                      </blockquote>
                      <div className="hidden group-hover/block:flex gap-1">
                        <button onClick={() => moveBlock(i, i - 1)} disabled={i === 0}
                          className="text-[10px] text-zinc-300 hover:text-zinc-500 disabled:opacity-20">↑</button>
                        <button onClick={() => moveBlock(i, i + 1)} disabled={i === blocks.length - 1}
                          className="text-[10px] text-zinc-300 hover:text-zinc-500 disabled:opacity-20">↓</button>
                        <button onClick={() => removeBlock(i)}
                          className="text-[10px] text-zinc-300 hover:text-red-400">✕</button>
                      </div>
                    </div>
                  )}

                  {block.type === "illustration" && (
                    <div className="group/block">
                      <div className="text-center relative">
                        {block.illustrationUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={block.illustrationUrl}
                            alt={block.caption ?? ""}
                            className="mx-auto rounded-lg"
                            style={{
                              width: block.width === "normal" ? "60%" : block.width === "wide" ? "85%" : "100%",
                              maxWidth: "100%",
                            }}
                          />
                        ) : (
                          <div className="w-full h-32 bg-zinc-100 rounded-lg flex items-center justify-center text-sm text-zinc-400">
                            图片加载中…
                          </div>
                        )}

                        {/* Caption editor */}
                        {editingCaption === block.id ? (
                          <input
                            autoFocus
                            value={block.caption ?? ""}
                            onChange={(e) => updateBlock(i, { caption: e.target.value })}
                            onBlur={() => setEditingCaption(null)}
                            onKeyDown={(e) => { if (e.key === "Enter") setEditingCaption(null); }}
                            className="mt-2 text-xs text-zinc-500 text-center border-b border-zinc-300 outline-none px-2 py-0.5 w-48"
                          />
                        ) : (
                          <p
                            className="text-xs text-zinc-400 mt-2 cursor-text"
                            onClick={() => setEditingCaption(block.id ?? null)}
                          >
                            {block.caption || "点击添加说明文字"}
                          </p>
                        )}

                        {/* Hover controls */}
                        <div className="hidden group-hover/block:flex absolute top-2 right-2 gap-1">
                          <select
                            value={block.width ?? "full"}
                            onChange={(e) => updateBlock(i, { width: e.target.value as LayoutBlock["width"] })}
                            className="text-[10px] bg-white border border-zinc-200 rounded px-1 py-0.5"
                          >
                            <option value="full">全宽</option>
                            <option value="wide">宽</option>
                            <option value="normal">标准</option>
                          </select>
                          <button onClick={() => moveBlock(i, i - 1)} disabled={i === 0}
                            className="text-[10px] bg-white border border-zinc-200 rounded px-1 py-0.5 hover:bg-zinc-50 disabled:opacity-20">↑</button>
                          <button onClick={() => moveBlock(i, i + 1)} disabled={i === blocks.length - 1}
                            className="text-[10px] bg-white border border-zinc-200 rounded px-1 py-0.5 hover:bg-zinc-50 disabled:opacity-20">↓</button>
                          <button onClick={() => removeBlock(i)}
                            className="text-[10px] bg-white border border-red-200 rounded px-1 py-0.5 text-red-400 hover:bg-red-50">✕</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {block.type === "divider" && (
                    <div className="flex items-center justify-center gap-2 group/block">
                      <hr className="flex-1 border-zinc-200" />
                      <div className="hidden group-hover/block:flex gap-1">
                        <button onClick={() => moveBlock(i, i - 1)} disabled={i === 0}
                          className="text-[10px] text-zinc-300 hover:text-zinc-500 disabled:opacity-20">↑</button>
                        <button onClick={() => moveBlock(i, i + 1)} disabled={i === blocks.length - 1}
                          className="text-[10px] text-zinc-300 hover:text-zinc-500 disabled:opacity-20">↓</button>
                        <button onClick={() => removeBlock(i)}
                          className="text-[10px] text-zinc-300 hover:text-red-400">✕</button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Drop target at end */}
            <div
              className={`h-12 rounded-lg border-2 border-dashed transition-colors flex items-center justify-center text-xs ${
                dragOver === blocks.length
                  ? "border-blue-300 bg-blue-50 text-blue-400"
                  : "border-zinc-100 text-zinc-300"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(blocks.length); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const shotId = e.dataTransfer.getData("shotId");
                if (shotId) {
                  const shot = shots.find((s) => s.id === shotId);
                  if (shot) insertIllustration(shot, blocks.length - 1);
                }
              }}
            >
              拖拽插画到此处添加
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
