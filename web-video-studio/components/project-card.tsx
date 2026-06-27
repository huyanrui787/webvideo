"use client";

import { useState } from "react";
import type React from "react";
import Link from "next/link";
import type { Project } from "@/lib/db/schema";
import type { ProjectType } from "@/lib/db/schema";

const STATUS_LABELS: Record<Project["status"], string> = {
  writing: "内容编写",
  plan_checkpoint: "计划确认",
  illustration_planning: "插图规划",
  building: "构建中",
  illustrating: "插画生成中",
  animating: "动画生成中",
  typesetting: "排版中",
  audio_checkpoint: "音频确认",
  audio: "待音频确认",
  done: "已完成",
};

const STATUS_COLORS: Record<Project["status"], string> = {
  writing: "bg-blue-100 text-blue-700",
  plan_checkpoint: "bg-amber-100 text-amber-700",
  illustration_planning: "bg-pink-100 text-pink-700",
  building: "bg-purple-100 text-purple-700",
  illustrating: "bg-rose-100 text-rose-700",
  animating: "bg-violet-100 text-violet-700",
  typesetting: "bg-teal-100 text-teal-700",
  audio_checkpoint: "bg-orange-100 text-orange-700",
  audio: "bg-orange-100 text-orange-700",
  done: "bg-green-100 text-green-700",
};

const TYPE_LABELS: Record<ProjectType, string> = {
  "article": "文章讲解",
  "data-story": "数据故事",
  "code-tour": "代码讲解",
  "math-video": "数学动画",
  "product-demo": "产品演示",
  "timeline-story": "时间线叙事",
  "resume": "简历",
  "illustration-video": "绘图视频",
  "illustrated-article": "图文排版",
  "animation-video": "动态视频",
};

const PROJECT_TYPES: { id: ProjectType; icon: React.ReactNode; label: string; desc: string }[] = [
  {
    id: "article",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="14" height="14" rx="2"/>
        <line x1="5" y1="6" x2="13" y2="6"/>
        <line x1="5" y1="9" x2="13" y2="9"/>
        <line x1="5" y1="12" x2="9" y2="12"/>
      </svg>
    ),
    label: "文章讲解",
    desc: "把文章或教程做成视频感网页演示",
  },
  {
    id: "data-story",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="2" y1="16" x2="16" y2="16"/>
        <rect x="3" y="10" width="3" height="6" rx="0.5"/>
        <rect x="7.5" y="6" width="3" height="10" rx="0.5"/>
        <rect x="12" y="3" width="3" height="13" rx="0.5"/>
      </svg>
    ),
    label: "数据故事",
    desc: "用图表动效讲述数据背后的故事",
  },
  {
    id: "code-tour",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1.5" y="3" width="15" height="12" rx="2"/>
        <line x1="1.5" y1="6.5" x2="16.5" y2="6.5"/>
        <polyline points="5.5,10 7.5,12 5.5,14"/>
        <line x1="9.5" y1="14" x2="13" y2="14"/>
      </svg>
    ),
    label: "代码讲解",
    desc: "模拟 IDE 逐行高亮讲解代码逻辑",
  },
  {
    id: "product-demo",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="14" height="10" rx="1.5"/>
        <line x1="2" y1="7" x2="16" y2="7"/>
        <circle cx="4" cy="5.5" r="0.6" fill="currentColor" stroke="none"/>
        <circle cx="6.2" cy="5.5" r="0.6" fill="currentColor" stroke="none"/>
        <circle cx="8.4" cy="5.5" r="0.6" fill="currentColor" stroke="none"/>
        <line x1="6" y1="11" x2="12" y2="11"/>
      </svg>
    ),
    label: "产品演示",
    desc: "截图序列 + Mock Browser 展示产品",
  },
  {
    id: "timeline-story",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="9" x2="15" y2="9"/>
        <circle cx="5" cy="9" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="13" cy="9" r="1.5" fill="currentColor" stroke="none"/>
        <line x1="5" y1="9" x2="5" y2="5.5"/>
        <line x1="9" y1="9" x2="9" y2="12.5"/>
        <line x1="13" y1="9" x2="13" y2="5.5"/>
      </svg>
    ),
    label: "时间线叙事",
    desc: "时间轴逐点展开重要事件",
  },
  {
    id: "illustration-video",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="14" height="14" rx="2"/>
        <circle cx="6.5" cy="7" r="1.3" fill="currentColor" stroke="none"/>
        <path d="M4 14l3-4 1.5 1.5 2-2.5L14 13"/>
        <line x1="11" y1="2" x2="11" y2="4.5"/>
        <line x1="8" y1="2" x2="10" y2="3"/>
        <line x1="8" y1="3" x2="10" y2="2"/>
      </svg>
    ),
    label: "绘图视频",
    desc: "用小黑手绘插画图解文章内容，合成视频",
  },
  {
    id: "illustrated-article",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1.5" y="1.5" width="15" height="15" rx="1.5"/>
        <line x1="5" y1="5.5" x2="13" y2="5.5"/>
        <line x1="5" y1="8.5" x2="13" y2="8.5"/>
        <line x1="5" y1="11.5" x2="9" y2="11.5"/>
        <rect x="5" y="10.5" width="6" height="4" rx="0.5" strokeDasharray="1.5 1"/>
      </svg>
    ),
    label: "图文排版",
    desc: "给文章配小黑插画，排版导出公众号长文",
  },
  {
    id: "animation-video",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3,1.5 15,6 15,12 3,16.5" strokeLinejoin="round"/>
        <line x1="3" y1="6" x2="15" y2="6"/>
        <line x1="3" y1="12" x2="15" y2="12"/>
        <circle cx="6" cy="9" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
    label: "动态视频",
    desc: "文章转 AI 动画片段 + 配音，自动合成 MP4",
  },
];

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ProjectCardProps {
  project: Project;
  onDeleted?: (id: string) => void;
}

export function ProjectCard({ project, onDeleted }: ProjectCardProps) {
  const type = project.projectType ?? "article";
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirming) { setConfirming(true); return; }
    setDeleting(true);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    onDeleted?.(project.id);
  }

  function handleCancelDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(false);
  }

  return (
    <div className="group relative">
      <Link
        href={`/projects/${project.id}`}
        className="block rounded-xl border border-bd bg-modal p-5 shadow-sm hover:shadow-md hover:border-bd-hover transition-all"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-semibold text-t1 text-sm leading-snug line-clamp-2">
            {project.title}
          </h2>
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status]}`}>
            {STATUS_LABELS[project.status]}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {type !== "article" && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
              {TYPE_LABELS[type]}
            </span>
          )}
          {project.theme && (
            <span className="text-xs text-t3">{project.theme}</span>
          )}
        </div>
        <p className="mt-3 text-xs text-t3">{formatDate(project.createdAt)}</p>
      </Link>

      {/* Delete controls — appear on hover */}
      {!confirming ? (
        <button
          onClick={handleDelete}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-full text-t3 hover:text-red-500 hover:bg-red-50"
          title="删除项目"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="2" y1="2" x2="11" y2="11"/><line x1="11" y1="2" x2="2" y2="11"/>
          </svg>
        </button>
      ) : (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-modal border border-bd rounded-lg shadow-sm px-2 py-1 z-10">
          <span className="text-xs text-t2 mr-1">确认删除？</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs font-medium text-red-600 hover:text-red-700 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? "删除中…" : "删除"}
          </button>
          <button
            onClick={handleCancelDelete}
            className="text-xs text-t3 hover:text-t2 px-1.5 py-0.5 rounded hover:bg-surface2 transition-colors"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}

interface NewProjectDialogProps {
  onCreated: (project: Project) => void;
}

export function NewProjectDialog({ onCreated }: NewProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("article");
  const [loading, setLoading] = useState(false);

  function handleOpen() {
    setOpen(true);
    setStep(1);
    setTitle("");
    setProjectType("article");
  }

  function handleClose() {
    setOpen(false);
    setStep(1);
  }

  function handleNextStep() {
    if (!title.trim()) return;
    setStep(2);
  }

  async function handleCreate() {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, projectType }),
      });
      const project = await res.json();
      onCreated(project);
      handleClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        新建项目
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay">
          <div className="w-full max-w-sm rounded-2xl bg-modal p-6 shadow-2xl">
            {step === 1 ? (
              <>
                <h3 className="text-base font-semibold text-t1 mb-1">新建视频项目</h3>
                <p className="text-xs text-t3 mb-4">第 1 步：为项目起个名字</p>
                <input
                  autoFocus
                  type="text"
                  placeholder="项目标题，如：邮件发送的600ms"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                  className="w-full rounded-lg border border-bd px-3 py-2 text-sm outline-none focus:border-bd-strong focus:ring-2 focus:ring-input-focus"
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={handleClose}
                    className="rounded-lg px-4 py-2 text-sm text-t2 hover:bg-surface2 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={!title.trim()}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-t1 hover:bg-accent-hover disabled:opacity-40 transition-colors"
                  >
                    下一步 →
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-t1 mb-1">选择项目类型</h3>
                <p className="text-xs text-t3 mb-4">第 2 步：选定内容形式</p>
                <div className="space-y-2">
                  {PROJECT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setProjectType(t.id)}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left border transition-colors ${
                        projectType === t.id
                          ? "bg-accent text-t1 border-accent"
                          : "bg-modal border-bd hover:border-bd-hover"
                      }`}
                    >
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        projectType === t.id ? "bg-white/15 text-t1" : "bg-surface2 text-t2"
                      }`}>
                        {t.icon}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{t.label}</p>
                        <p className={`text-xs mt-0.5 ${projectType === t.id ? "text-t4" : "text-t3"}`}>
                          {t.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="rounded-lg px-4 py-2 text-sm text-t2 hover:bg-surface2 transition-colors"
                  >
                    ← 返回
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-t1 hover:bg-accent-hover disabled:opacity-40 transition-colors"
                  >
                    {loading ? "创建中…" : "创建项目"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
