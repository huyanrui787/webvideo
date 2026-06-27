"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Project } from "@/lib/db/schema";
import { NewProjectDialog } from "@/components/project-card";

const STATUS_LABELS: Record<string, string> = {
  writing: "写作中", plan_checkpoint: "计划确认", illustration_planning: "插图规划",
  building: "构建中", illustrating: "插图中", typesetting: "排版中",
  audio_checkpoint: "音频确认", audio: "音频合成", done: "已完成",
};

const STATUS_STYLE: Record<string, string> = {
  writing: "bg-brand-subtle text-brand-text",
  plan_checkpoint: "bg-brand-subtle text-brand-text",
  illustration_planning: "bg-blue-400/10 text-blue-400",
  building: "bg-blue-400/10 text-blue-400",
  illustrating: "bg-blue-400/10 text-blue-400",
  typesetting: "bg-blue-400/10 text-blue-400",
  audio_checkpoint: "bg-brand-subtle text-brand-text",
  audio: "bg-blue-400/10 text-blue-400",
  done: "bg-green-400/10 text-green-400",
};

const TYPE_LABELS: Record<string, string> = {
  article: "文章讲解", "data-story": "数据故事", "code-tour": "代码游览",
  "math-video": "数学视频", "product-demo": "产品演示", "timeline-story": "时间线",
  "illustration-video": "绘图视频", "animation-video": "动态视频", resume: "简历",
};

function formatRelativeTime(ts: number): string {
  const d = Math.floor(Date.now() / 1000) - ts;
  if (d < 60) return "刚刚";
  if (d < 3600) return `${Math.floor(d / 60)} 分钟前`;
  if (d < 86400) return `${Math.floor(d / 3600)} 小时前`;
  if (d < 86400 * 30) return `${Math.floor(d / 86400)} 天前`;
  return new Date(ts * 1000).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

/* ── SVG icons ─────────────────────────────────────────────────────── */

const IconGrid = <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="9" y="1" width="5" height="5" rx="1"/><rect x="1" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>;
const IconList = <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="3" y1="3.5" x2="12" y2="3.5"/><line x1="3" y1="7.5" x2="12" y2="7.5"/><line x1="3" y1="11.5" x2="12" y2="11.5"/></svg>;

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  async function handleDelete(p: Project) {
    setDeleting(true);
    const prev = projects;
    setProjects((list) => list.filter((x) => x.id !== p.id));
    try {
      const r = await fetch(`/api/projects/${p.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("删除失败");
    } catch {
      setProjects(prev);
      setError("删除失败，请重试");
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => {
        if (r.status === 401) { router.replace("/login"); return; }
        if (!r.ok) throw new Error("加载失败");
        return r.json();
      })
      .then((data: Project[]) => { setProjects(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [router]);

  /* ── Loading ──────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-5 h-5 border-2 border-brand-text border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Error ────────────────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-t2 mb-4 text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-surface2 text-sm text-t1 hover:bg-surface transition-colors">重试</button>
      </div>
    );
  }

  /* ── Empty state ──────────────────────────────────────────────────── */
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6">
        <div className="w-16 h-16 rounded-2xl bg-surface2 flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-t4">
            <rect x="3" y="2" width="22" height="24" rx="3"/>
            <line x1="7" y1="9" x2="21" y2="9"/><line x1="7" y1="14" x2="21" y2="14"/>
            <line x1="7" y1="19" x2="15" y2="19"/>
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-t1 mb-2">还没有项目</h2>
        <p className="text-xs text-t3 mb-6 text-center max-w-xs">创建你的第一个项目，把文章、链接或想法变成可发布的视频</p>
        <NewProjectDialog
          onCreated={(project: Project) => {
            setProjects((prev) => [project, ...prev]);
            router.push(`/projects/${project.id}`);
          }}
        />
      </div>
    );
  }

  /* ── Main content ─────────────────────────────────────────────────── */
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-t1">我的项目</h1>
          <p className="text-xs text-t3 mt-0.5">{projects.length} 个项目</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-bd p-0.5 mr-1">
            <button
              onClick={() => setViewMode("grid")}
              title="卡片视图"
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-surface2 text-t1" : "text-t4 hover:text-t2"}`}
            >{IconGrid}</button>
            <button
              onClick={() => setViewMode("list")}
              title="列表视图"
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-surface2 text-t1" : "text-t4 hover:text-t2"}`}
            >{IconList}</button>
          </div>
          <NewProjectDialog
            onCreated={(project: Project) => {
              setProjects((prev) => [project, ...prev]);
              router.push(`/projects/${project.id}`);
            }}
          />
        </div>
      </div>

      {/* ── Grid View ── */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={(e) => {
                // Don't navigate if the click was on a button or SVG (delete button)
                const target = e.target as HTMLElement;
                if (target.closest("button")) return;
                router.push(`/projects/${p.id}`);
              }}
              className="group block rounded-xl border border-bd bg-modal hover:border-bd-hover transition-all overflow-hidden cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="relative w-full aspect-video bg-surface2 overflow-hidden">
                {p.thumbnailUrl ? (
                  <img src={p.thumbnailUrl} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-t4">
                      <rect x="3" y="2" width="22" height="24" rx="3"/>
                      <line x1="7" y1="9" x2="21" y2="9"/><line x1="7" y1="14" x2="21" y2="14"/>
                      <line x1="7" y1="19" x2="15" y2="19"/>
                    </svg>
                    <span className="text-[10px] text-t4 font-medium">{STATUS_LABELS[p.status] ?? p.status}</span>
                  </div>
                )}
                {/* Format badge */}
                <span className="absolute top-2 left-2 text-[9px] font-medium px-1.5 py-0.5 rounded bg-black/50 text-white/80 backdrop-blur-sm">
                  {p.projectFormat === "graphic" ? "9:16" : "16:9"}
                </span>
                {/* Status dot — hidden on hover */}
                <span className={`absolute top-2 right-2 w-2 h-2 rounded-full group-hover:opacity-0 transition-opacity ${
                  p.status === "done" ? "bg-green-400" : p.status === "writing" || p.status === "plan_checkpoint" ? "bg-amber-400" : "bg-blue-400"
                }`} />
                {/* Delete button — shown on hover, z-10 to sit above overlay */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
                  className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-400/10 text-t4 hover:text-red-400"
                  title="删除项目"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                    <path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M11 4v7a1 1 0 01-1 1H4a1 1 0 01-1-1V4"/>
                  </svg>
                </button>
                {/* Hover overlay — pointer-events-none so it doesn't block clicks */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
              </div>
              {/* Info */}
              <div className="p-3.5">
                <h3 className="text-sm font-medium text-t1 truncate group-hover:text-brand-text transition-colors">{p.title || "未命名项目"}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] text-t3">{TYPE_LABELS[p.projectType ?? ""] ?? p.projectType ?? "文章"}</span>
                  <span className="text-[11px] text-t4">{formatRelativeTime(p.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── List View ── */}
      {viewMode === "list" && (
        <div className="flex flex-col gap-1">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface2 transition-colors group cursor-pointer"
              onClick={() => router.push(`/projects/${p.id}`)}
            >
              {/* Thumbnail */}
              <div className="w-14 h-10 rounded-md bg-surface2 shrink-0 flex items-center justify-center overflow-hidden">
                {p.thumbnailUrl ? (
                  <img src={p.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-t4">
                    <rect x="3" y="2" width="22" height="24" rx="3"/>
                    <line x1="7" y1="9" x2="21" y2="9"/><line x1="7" y1="14" x2="21" y2="14"/><line x1="7" y1="19" x2="15" y2="19"/>
                  </svg>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-t1 truncate group-hover:text-brand-text transition-colors">
                  {p.title || "未命名项目"}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-t3">
                  <span>{TYPE_LABELS[p.projectType ?? ""] ?? p.projectType ?? "文章"}</span>
                  <span>·</span>
                  <span>{p.projectFormat === "graphic" ? "9:16" : "16:9"}</span>
                </div>
              </div>
              {/* Status */}
              <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[p.status] ?? "bg-surface2 text-t3"}`}>
                {STATUS_LABELS[p.status] ?? p.status}
              </span>
              {/* Time */}
              <span className="text-[11px] text-t4 w-16 text-right shrink-0 hidden sm:block">
                {formatRelativeTime(p.createdAt)}
              </span>
              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
                className="shrink-0 text-t4 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 rounded hover:bg-red-400/10"
                title="删除项目"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                  <path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M11 4v7a1 1 0 01-1 1H4a1 1 0 01-1-1V4"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="bg-modal border border-bd rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-t1 mb-2">确认删除</p>
            <p className="text-xs text-t2 mb-6">
              「{deleteTarget.title || "未命名项目"}」将被永久删除，包括所有对话记录、生成内容和项目文件。此操作不可撤销。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-xs font-medium text-t2 hover:text-t1 hover:bg-surface2 transition-colors"
              >取消</button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >{deleting ? "删除中…" : "确认删除"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
