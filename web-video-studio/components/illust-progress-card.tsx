"use client";

export interface ShotProgress {
  id: string;
  chapterId: string;
  status: "pending" | "generating" | "done" | "error";
  errorMessage?: string;
}

interface IllustProgressCardProps {
  shots: ShotProgress[];
}

const STATUS_CFG: Record<ShotProgress["status"], { label: string; dot: string; text: string }> = {
  pending:   { label: "等待中",  dot: "bg-t4",         text: "text-t4" },
  generating:{ label: "生成中…", dot: "bg-amber-400 animate-pulse", text: "text-amber-400" },
  done:      { label: "已完成",  dot: "bg-green-400",  text: "text-green-400" },
  error:     { label: "失败",    dot: "bg-red-400",    text: "text-red-400" },
};

export function IllustProgressCard({ shots }: IllustProgressCardProps) {
  const doneCount = shots.filter(s => s.status === "done").length;
  const total = shots.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const chapterNames = [...new Set(shots.map(s => s.chapterId))];

  return (
    <div className="px-3">
      <div className="rounded-xl border border-brand/20 bg-brand-subtle overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-brand/10">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-brand-text">
              <rect x="1.5" y="1.5" width="11" height="11" rx="2"/><circle cx="5" cy="5" r="1.5"/><path d="M1.5 10l3-3 1.5 1.5 2.5-2.5L13 9"/>
            </svg>
            <span className="text-xs font-semibold text-brand-text">插画生成中</span>
          </div>
          <span className="text-xs font-medium text-brand-text">{doneCount}/{total}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-brand/10">
          <div className="h-full bg-brand transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>

        {/* Chapter summary — one row per chapter */}
        <div className="px-4 py-2.5 space-y-1.5">
          {chapterNames.map((ch) => {
            const chShots = shots.filter(s => s.chapterId === ch);
            const chDone = chShots.filter(s => s.status === "done").length;
            const hasError = chShots.some(s => s.status === "error");
            const hasGenerating = chShots.some(s => s.status === "generating");
            const allDone = chDone === chShots.length;

            return (
              <div key={ch} className="flex items-center gap-2">
                {/* Dots for each shot in this chapter */}
                <div className="flex gap-0.5 shrink-0">
                  {chShots.map((s) => (
                    <span
                      key={s.id}
                      className={`w-1.5 h-1.5 rounded-full ${STATUS_CFG[s.status].dot}`}
                      title={`${ch} · ${STATUS_CFG[s.status].label}`}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-t2 truncate flex-1">{ch}</span>
                {allDone && <span className="text-[10px] text-green-400 shrink-0">✓</span>}
                {hasError && !allDone && <span className="text-[10px] text-red-400 shrink-0">{hasError ? "失败" : ""}</span>}
                {hasGenerating && <span className="text-[10px] text-amber-400 shrink-0 animate-pulse">生成中</span>}
                {!allDone && !hasError && !hasGenerating && <span className="text-[10px] text-t4 shrink-0">等待</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
