"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Batch, BatchStatus } from "@/lib/db/schema";
import type { Project } from "@/lib/db/schema";

const STATUS_LABELS: Record<string, string> = {
  writing: "写作中",
  building: "构建中",
  audio: "音频合成",
  done: "已完成",
};

const STATUS_COLORS: Record<string, string> = {
  writing: "text-blue-400",
  building: "text-brand-text",
  audio: "text-purple-400",
  done: "text-emerald-400",
};

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/batches/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBatch(data.batch);
        setProjects(data.projects);
      }
    } catch { /* */ }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Poll if running
  useEffect(() => {
    if (!batch || batch.status !== "running") return;
    const t = setInterval(fetchData, 4000);
    return () => clearInterval(t);
  }, [batch, fetchData]);

  async function handleRetry() {
    await fetch(`/api/batches/${id}/retry`, { method: "POST" });
    fetchData();
  }

  async function handleCancel() {
    await fetch(`/api/batches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-t3">加载中…</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-t3">批次不存在</p>
      </div>
    );
  }

  const progress = batch.total > 0 ? Math.round(((batch.done + batch.failed) / batch.total) * 100) : 0;
  const failedProjects = projects.filter((p) => p.errorMessage);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/batches"
            className="text-xs text-t3 hover:text-t2 shrink-0"
          >
            ← 返回
          </Link>
          <span className="text-bd">|</span>
          <h1 className="text-xl font-bold text-t1 truncate">{batch.title}</h1>
        </div>

        {/* Progress overview */}
        <div className="rounded-2xl border border-bd bg-surface p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-t1">
                {progress}%
              </div>
              <div>
                <div className="text-sm text-t2">
                  {batch.done} 成功 · {batch.failed} 失败 · {batch.total - batch.done - batch.failed} 剩余
                </div>
                <div className="text-xs text-t3 mt-0.5">
                  共 {batch.total} 个项目
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {failedProjects.length > 0 && (
                <button
                  onClick={handleRetry}
                  className="px-3 py-1.5 rounded-lg border border-bd text-xs text-t1 hover:bg-surface2 transition-all"
                >
                  重试失败项 ({failedProjects.length})
                </button>
              )}
              {batch.status === "running" && (
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 rounded-lg border border-red-500/20 text-xs text-red-400 hover:bg-red-500/10 transition-all"
                >
                  取消
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full bg-surface2 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Project list */}
        <div className="space-y-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center gap-4 rounded-xl border border-bd bg-surface hover:bg-surface2 transition-all p-4"
            >
              {/* Status icon */}
              <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                {project.status === "done" && !project.errorMessage && "✅"}
                {project.status === "done" && project.errorMessage && "❌"}
                {project.status === "building" && "🔨"}
                {project.status === "writing" && "📝"}
                {project.status === "audio" && "🎙️"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-t1 truncate">
                  {project.title}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[11px] ${STATUS_COLORS[project.status]}`}>
                    {STATUS_LABELS[project.status] ?? project.status}
                  </span>
                  {project.errorMessage && (
                    <span className="text-[11px] text-red-400 truncate max-w-xs">
                      {project.errorMessage.slice(0, 60)}
                    </span>
                  )}
                </div>
              </div>

              <span className="text-xs text-t3 shrink-0">
                #{project.batchIndex != null ? project.batchIndex + 1 : "?"}
              </span>
            </Link>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12 text-t3">暂无项目</div>
        )}
      </div>
    </div>
  );
}
