"use client";

import { useState } from "react";

interface ContentCheckpointCardProps {
  projectId: string;
  scriptWordCount: number;
  outlineChapters: number;
  outlineSteps: number;
  onConfirm: () => void;
}

export function ContentCheckpointCard({
  projectId,
  scriptWordCount,
  outlineChapters,
  outlineSteps,
  onConfirm,
}: ContentCheckpointCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mx-3 my-2 rounded-2xl border border-bd-strong bg-surface2 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-start gap-3">
        <span className="text-xl shrink-0">📝</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-t1">内容审核</p>
          <p className="text-xs text-t3 mt-0.5">
            口播稿和大纲已生成，请确认内容后再继续
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-2 flex gap-4 text-xs text-t3">
        <span>口播稿 {scriptWordCount} 字</span>
        <span>{outlineChapters} 章</span>
        <span>{outlineSteps} 步</span>
      </div>

      {/* Expand to view files */}
      <div className="px-4 pb-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-t3 hover:text-t2 transition-colors"
        >
          {expanded ? "收起文件列表 ▲" : "展开文件列表 ▼"}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-3 flex flex-col gap-1 text-xs text-t3">
          <a
            href={`/api/projects/${projectId}/files?path=script.md`}
            target="_blank"
            className="hover:text-t2 underline"
          >
            script.md — 口播稿
          </a>
          <a
            href={`/api/projects/${projectId}/files?path=outline.md`}
            target="_blank"
            className="hover:text-t2 underline"
          >
            outline.md — 开发计划
          </a>
          <a
            href={`/api/projects/${projectId}/files?path=rhythm.md`}
            target="_blank"
            className="hover:text-t2 underline"
          >
            rhythm.md — 节奏蓝图
          </a>
          <p className="mt-1 text-t4">
            点击文件名在新标签页查看。如需修改，直接在文件面板编辑后回来点确认。
          </p>
        </div>
      )}

      {/* Action */}
      <div className="px-4 pb-3 pt-1">
        <button
          onClick={onConfirm}
          className="w-full rounded-xl bg-accent hover:bg-accent-hover text-accent-text text-sm font-medium py-2.5 transition-colors"
        >
          确认内容，继续
        </button>
      </div>
    </div>
  );
}
