"use client";

interface ChapterReviewCardProps {
  chapterId: string;
  chapterTitle: string;
  onContinue: () => void;
  onFeedback: (text: string) => void;
}

export function ChapterReviewCard({
  chapterId,
  chapterTitle,
  onContinue,
  onFeedback,
}: ChapterReviewCardProps) {
  return (
    <div className="mx-3 my-2 rounded-2xl border-2 border-yellow-200 bg-yellow-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base">🔍</span>
        <span className="text-sm font-semibold text-t1">
          第 <code className="bg-yellow-100 px-1 rounded">{chapterId}</code> 章完成，请验收
        </span>
      </div>

      <p className="text-xs text-t2 leading-relaxed">
        {chapterTitle}
      </p>

      <div className="text-xs text-t2 space-y-1">
        <p className="font-medium text-t2 mb-1">验收要点：</p>
        {[
          "视觉气质符合主题预期？",
          "节奏合理，没有太快/太慢的步骤？",
          "有内容驱动的动画，不只是文字入场？",
          "没有紫粉渐变/emoji/假数据等 AI 味？",
        ].map((item) => (
          <p key={item} className="flex gap-1.5">
            <span>□</span>
            <span>{item}</span>
          </p>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onContinue}
          className="flex-1 rounded-xl bg-accent py-2 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
        >
          继续下一章 →
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="有修改意见？输入后回车发给 AI…"
          className="w-full rounded-xl border border-bd px-3 py-2 text-xs outline-none focus:border-bd-strong"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value.trim()) {
              onFeedback(e.currentTarget.value.trim());
              e.currentTarget.value = "";
            }
          }}
        />
      </div>
    </div>
  );
}
