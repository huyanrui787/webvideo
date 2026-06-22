"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────

interface ShotItem {
  id: string;
  chapterId: string;
  stepIdx: number;
  theme: string;
  structureType: string;
  coreIdea: string;
  xiaoheiAction?: string | null;
  elements?: string;
  labels?: string;
  generationStatus: "pending" | "prompting" | "generating" | "done" | "error";
  assetUrl?: string | null;
  assetFilename?: string | null;
  generationError?: string | null;
  kenBurnsScale?: number | null;
  kenBurnsPanX?: number | null;
  kenBurnsPanY?: number | null;
  sortOrder: number;
}

interface ChapterGroup {
  chapterId: string;
  shots: ShotItem[];
}

interface IllustTimelineEditorProps {
  projectId: string;
  onShotsUpdated?: () => void;
  onPreviewRequest?: (shot: ShotItem) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────

const STRUCTURE_LABELS: Record<string, string> = {
  Workflow: "流程",
  "系统局部": "系统",
  "前后对比": "对比",
  "角色状态": "状态",
  "概念隐喻": "隐喻",
  "方法分层": "分层",
  "地图路线": "路线",
  "小漫画分镜": "漫画",
};

const STRUCTURE_COLORS: Record<string, string> = {
  Workflow: "bg-orange-50 text-orange-700 border-orange-200",
  "系统局部": "bg-sky-50 text-sky-700 border-sky-200",
  "前后对比": "bg-violet-50 text-violet-700 border-violet-200",
  "角色状态": "bg-rose-50 text-rose-700 border-rose-200",
  "概念隐喻": "bg-amber-50 text-amber-700 border-amber-200",
  "方法分层": "bg-teal-50 text-teal-700 border-teal-200",
  "地图路线": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "小漫画分镜": "bg-pink-50 text-pink-700 border-pink-200",
};

type KBPreset = "off" | "subtle" | "moderate" | "dramatic";

const KB_PRESETS: Record<KBPreset, { label: string; desc: string; scale: number; panX: number; panY: number }> = {
  off: { label: "静止", desc: "无动画", scale: 1.0, panX: 0, panY: 0 },
  subtle: { label: "微妙", desc: "1.03×", scale: 1.03, panX: 0, panY: 0 },
  moderate: { label: "适中", desc: "1.06× + 平移", scale: 1.06, panX: -15, panY: -10 },
  dramatic: { label: "戏剧", desc: "1.10× + 大幅", scale: 1.10, panX: -40, panY: -25 },
};

// ─── Component ─────────────────────────────────────────────────────────────

export function IllustTimelineEditor({ projectId, onShotsUpdated }: IllustTimelineEditorProps) {
  const [shots, setShots] = useState<ShotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [regenerating, setRegenerating] = useState<Set<string>>(new Set());
  const [selectedShot, setSelectedShot] = useState<ShotItem | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Data fetching ──────────────────────────────────────────────────

  const fetchShots = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/illustrations/status`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setShots(data.shots || []);
      setLoading(false);

      // Stop polling when all done
      if (data.status === "done") {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchShots();
    pollRef.current = setInterval(fetchShots, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchShots]);

  // ─── Group by chapter ───────────────────────────────────────────────

  const chapters: ChapterGroup[] = (() => {
    const map = new Map<string, ShotItem[]>();
    for (const s of shots) {
      const list = map.get(s.chapterId) || [];
      list.push(s);
      map.set(s.chapterId, list);
    }
    // Sort shots within each chapter by stepIdx
    const result: ChapterGroup[] = [];
    for (const [chId, chShots] of map) {
      chShots.sort((a, b) => a.sortOrder - b.sortOrder);
      result.push({ chapterId: chId, shots: chShots });
    }
    return result;
  })();

  // ─── KB preset update ───────────────────────────────────────────────

  async function updateKB(shotId: string, preset: KBPreset) {
    const p = KB_PRESETS[preset];
    await fetch(`/api/projects/${projectId}/illustrations/${shotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kenBurnsScale: Math.round(p.scale * 100),
        kenBurnsPanX: p.panX,
        kenBurnsPanY: p.panY,
      }),
    });
    fetchShots();
  }

  // ─── Regenerate single shot ─────────────────────────────────────────

  async function regenerate(shotId: string) {
    setRegenerating((prev) => new Set(prev).add(shotId));
    try {
      await fetch(`/api/projects/${projectId}/illustrations/${shotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate: true }),
      });
      fetchShots();
      // Start polling faster during regeneration
      if (!pollRef.current) {
        pollRef.current = setInterval(fetchShots, 2000);
      }
    } finally {
      setRegenerating((prev) => {
        const next = new Set(prev);
        next.delete(shotId);
        return next;
      });
    }
  }

  // ─── Render states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-zinc-400">
        <span className="animate-pulse">加载中…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-3 my-2 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (shots.length === 0) {
    return (
      <div className="mx-3 my-6 text-center py-12 border-2 border-dashed border-zinc-200 rounded-2xl">
        <p className="text-sm text-zinc-400">暂无插图计划</p>
        <p className="text-xs text-zinc-300 mt-1">等待 AI 规划 shot list…</p>
      </div>
    );
  }

  // ─── Stats ──────────────────────────────────────────────────────────

  const doneCount = shots.filter((s) => s.generationStatus === "done").length;
  const generatingCount = shots.filter(
    (s) => ["prompting", "generating"].includes(s.generationStatus)
  ).length;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-900">
            插图时间轴
          </span>
          <span className="text-xs text-zinc-400">
            {shots.length} 张
          </span>
          {generatingCount > 0 && (
            <span className="text-xs text-pink-500 animate-pulse">
              {generatingCount} 张生成中…
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{doneCount}</span>
          /
          <span>{shots.length}</span>
        </div>
      </div>

      {/* Chapter groups */}
      <div className="space-y-3">
        {chapters.map((ch) => {
          const isExpanded = expandedChapters.has(ch.chapterId) || chapters.length === 1;
          const chDone = ch.shots.filter((s) => s.generationStatus === "done").length;

          return (
            <div key={ch.chapterId} className="mx-3 rounded-xl border border-zinc-200 overflow-hidden">
              {/* Chapter header */}
              <button
                onClick={() => {
                  setExpandedChapters((prev) => {
                    const next = new Set(prev);
                    if (next.has(ch.chapterId)) next.delete(ch.chapterId);
                    else next.add(ch.chapterId);
                    return next;
                  });
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
              >
                <svg
                  width="12" height="12" viewBox="0 0 12 12"
                  className={`shrink-0 text-zinc-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  fill="currentColor"
                >
                  <polygon points="4,2 9,6 4,10"/>
                </svg>
                <span className="text-sm font-medium text-zinc-800 flex-1">
                  第{chapters.indexOf(ch) + 1}章 · {ch.chapterId}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {chDone}/{ch.shots.length}
                </span>
              </button>

              {/* Shot cards */}
              {isExpanded && (
                <div className="divide-y divide-zinc-100">
                  {ch.shots.map((shot) => {
                    const isSelected = selectedShot?.id === shot.id;
                    const currentKB = getCurrentPreset(
                      shot.kenBurnsScale ? shot.kenBurnsScale / 100 : 1.0,
                      shot.kenBurnsPanX ?? 0,
                      shot.kenBurnsPanY ?? 0
                    );

                    return (
                      <div
                        key={shot.id}
                        onClick={() => setSelectedShot(isSelected ? null : shot)}
                        className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50" : "hover:bg-zinc-50"
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="w-20 h-12 rounded-lg shrink-0 overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center">
                          {shot.generationStatus === "done" && shot.assetUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={shot.assetUrl}
                              alt={shot.theme}
                              className="w-full h-full object-cover"
                            />
                          ) : shot.generationStatus === "error" ? (
                            <span className="text-[10px] text-red-400">失败</span>
                          ) : (
                            <span className="text-[10px] text-zinc-300 animate-pulse font-mono">
                              {shot.generationStatus === "generating" ? "⚙" : "…"}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`text-[10px] font-medium px-1 py-0.5 rounded border ${STRUCTURE_COLORS[shot.structureType] ?? "bg-zinc-50 text-zinc-600 border-zinc-200"}`}>
                              {STRUCTURE_LABELS[shot.structureType] ?? shot.structureType}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              step {shot.stepIdx + 1}
                            </span>
                            {shot.generationStatus === "error" && (
                              <span className="text-[10px] text-red-500 ml-auto" title={shot.generationError ?? ""}>
                                ✕
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-zinc-800 truncate">{shot.theme}</p>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {shot.coreIdea}
                          </p>
                        </div>

                        {/* KB preset selector */}
                        <select
                          value={currentKB}
                          onChange={(e) => updateKB(shot.id, e.target.value as KBPreset)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] border border-zinc-200 rounded-lg px-1.5 py-1 bg-white text-zinc-600 shrink-0 mt-1"
                        >
                          {Object.entries(KB_PRESETS).map(([key, p]) => (
                            <option key={key} value={key}>{p.label}</option>
                          ))}
                        </select>

                        {/* Regenerate button */}
                        {shot.generationStatus === "done" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              regenerate(shot.id);
                            }}
                            disabled={regenerating.has(shot.id)}
                            className="text-[10px] text-zinc-400 hover:text-zinc-600 disabled:opacity-30 shrink-0 mt-1"
                          >
                            {regenerating.has(shot.id) ? "⏳" : "🔄"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helper: find closest KB preset ────────────────────────────────────────

function getCurrentPreset(scale: number, panX: number, panY: number): KBPreset {
  if (scale <= 1.0 && panX === 0 && panY === 0) return "off";
  if (scale <= 1.03 && panX === 0 && panY === 0) return "subtle";
  if (scale <= 1.06 && Math.abs(panX) <= 15 && Math.abs(panY) <= 10) return "moderate";
  return "dramatic";
}
