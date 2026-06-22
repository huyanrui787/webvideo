"use client";

export type ChapterStatus =
  | "pending"
  | "building"
  | "review"
  | "done"
  | "error"
  | "validating"
  | "skipped"
  | "timeout";

export interface ChapterProgress {
  id: string;
  title: string;
  status: ChapterStatus;
  stepCount?: number;
  error?: string;
  tscErrors?: string;
  startedAt?: number;
  finishedAt?: number;
}

const STATUS_CONFIG: Record<
  ChapterStatus,
  { label: string; color: string; icon: string }
> = {
  pending:    { label: "待开始", color: "bg-surface2 text-t3",   icon: "○" },
  building:   { label: "构建中", color: "bg-surface3 text-t2", icon: "◌" },
  review:     { label: "待验收", color: "bg-amber-500/15 text-amber-400", icon: "◉" },
  done:       { label: "已完成", color: "bg-t1 text-base",   icon: "●" },
  error:      { label: "失败",   color: "bg-red-500/15 text-red-400", icon: "✕" },
  validating: { label: "验证中", color: "bg-purple-500/15 text-purple-400", icon: "◎" },
  skipped:    { label: "已跳过", color: "bg-surface2 text-t4", icon: "−" },
  timeout:    { label: "超时",   color: "bg-orange-500/15 text-orange-400", icon: "⏱" },
};

interface ChapterProgressPanelProps {
  chapters: ChapterProgress[];
  onChapterClick?: (chapter: ChapterProgress) => void;
}

export function ChapterProgressPanel({
  chapters,
  onChapterClick,
}: ChapterProgressPanelProps) {
  if (chapters.length === 0) return null;

  const doneCount = chapters.filter((c) => c.status === "done").length;

  return (
    <div className="border-b border-bd bg-modal px-3 py-2">
      {/* Summary */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-t2">
          章节进度
        </span>
        <span className="text-xs text-t3">
          {doneCount}/{chapters.length} 完成
        </span>
      </div>

      {/* Chapter chips */}
      <div className="flex flex-wrap gap-1.5">
        {chapters.map((c, idx) => {
          const cfg = STATUS_CONFIG[c.status];
          return (
            <button
              key={c.id}
              onClick={() => onChapterClick?.(c)}
              title={c.title}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 ${cfg.color}`}
            >
              <span
                className={c.status === "building" ? "animate-pulse" : ""}
              >
                {cfg.icon}
              </span>
              <span className="max-w-[72px] truncate">{idx + 1}. {c.title || c.id}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
