"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Project } from "@/lib/db/schema";
import { NewProjectDialog } from "@/components/project-card";

const STATUS_LABELS: Record<string, string> = {
  writing: "写作中",
  plan_checkpoint: "计划确认",
  illustration_planning: "插图规划",
  building: "构建中",
  illustrating: "插图中",
  typesetting: "排版中",
  audio_checkpoint: "音频确认",
  audio: "音频合成",
  done: "已完成",
};

const TYPE_LABELS: Record<string, string> = {
  article: "文章讲解",
  "data-story": "数据故事",
  "code-tour": "代码游览",
  "math-video": "数学视频",
  "product-demo": "产品演示",
  "timeline-story": "时间线",
  "illustration-video": "绘图视频",
  resume: "简历",
};

function formatRelativeTime(ts: number): string {
  const d = Math.floor(Date.now() / 1000) - ts;
  if (d < 60) return "刚刚";
  if (d < 3600) return `${Math.floor(d / 60)} 分钟前`;
  if (d < 86400) return `${Math.floor(d / 3600)} 小时前`;
  if (d < 86400 * 30) return `${Math.floor(d / 86400)} 天前`;
  return new Date(ts * 1000).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-t2 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="text-accent text-sm underline">重试</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-t1">我的项目</h1>
        <NewProjectDialog
          onCreated={(project: Project) => {
            setProjects((prev) => [project, ...prev]);
            router.push(`/projects/${project.id}`);
          }}
        />
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-t2 mb-4 text-sm">还没有项目</p>
          <NewProjectDialog
            onCreated={(project: Project) => {
              setProjects((prev) => [project, ...prev]);
              router.push(`/projects/${project.id}`);
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-surface hover:bg-surface-2 transition-colors group cursor-pointer"
              onClick={() => router.push(`/projects/${p.id}`)}
            >
              {/* Thumbnail */}
              <div className="w-16 h-9 rounded bg-surface-2 shrink-0 flex items-center justify-center overflow-hidden text-t4">
                {p.thumbnailUrl ? (
                  <img src={p.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">🎬</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-t1 truncate group-hover:text-accent transition-colors">
                  {p.title || "未命名项目"}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-t3">
                  <span>{TYPE_LABELS[p.projectType ?? ""] ?? p.projectType ?? "文章"}</span>
                  <span>·</span>
                  <span>{p.theme ?? "默认主题"}</span>
                  {p.orientation === "portrait" && <><span>·</span><span>竖屏</span></>}
                </div>
              </div>

              {/* Status & time */}
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${
                    p.status === "done"
                      ? "bg-green-500/10 text-green-500"
                      : p.status === "building" || p.status === "illustrating"
                        ? "bg-blue-500/10 text-blue-500"
                        : p.status === "writing" || p.status === "plan_checkpoint"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-surface-2 text-t3"
                  }`}
                >
                  {STATUS_LABELS[p.status] ?? p.status}
                </span>
                <span className="text-[11px] text-t4 w-16 text-right">
                  {formatRelativeTime(p.createdAt)}
                </span>
                <span className="text-t4 opacity-0 group-hover:opacity-100 transition-opacity text-sm">→</span>
              </div>

              {/* Delete button */}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteTarget(null)}>
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
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? "删除中…" : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
