"use client";

/**
 * 解析 rhythm.md 内容，提取情绪弧模板名 + 章节节拍列表，渲染成时间轴缩略图。
 * 期望 rhythm.md 大致格式：
 *   # 节奏蓝图
 *   情绪弧模板: xxx
 *   ---
 *   ## 第1章 · hook
 *   ...
 */

import { useMemo } from "react";

interface RhythmPreviewProps {
  rhythmMd: string;
}

interface ChapterBeat {
  index: number;
  chapterTitle: string;
  beatType: string;
}

const BEAT_COLORS: Record<string, string> = {
  hook: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  turn: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  data: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  release: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  close: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

const DEFAULT_COLOR = "bg-surface2 text-t3 border-bd";

function colorForBeat(beat: string): string {
  return BEAT_COLORS[beat] ?? DEFAULT_COLOR;
}

function parseRhythm(md: string): { template: string | null; beats: ChapterBeat[] } {
  const templateMatch = md.match(/(?:情绪弧模板|emotion[_\s-]?arc)[:：]\s*(.+)/i);
  const template = templateMatch ? templateMatch[1].trim() : null;

  // 按 `---` 分隔，每节是一章
  const sections = md.split(/^---+$/m);
  const beats: ChapterBeat[] = [];
  let idx = 0;
  for (const sec of sections) {
    // 匹配 "## 第N章" 或 "## chapter-id" 标题行
    const chapterMatch = sec.match(/^##\s+(.+?)\s*$/m);
    if (!chapterMatch) continue;
    const title = chapterMatch[1].trim();
    // 标题里抽取 beat type：标题末尾的 [xxx] 或 (xxx) 标记，或正文中 `[beat]` 标记
    const tagMatch = title.match(/[\[【]([a-zA-Z_-]+?)[\]】]/) ?? sec.match(/---\[(\w+)\]---/);
    const beatType = tagMatch ? tagMatch[1].toLowerCase() : "turn";
    // 简单 slug：去除中文标点
    const slug = title.replace(/[【】\[\]()·:：]/g, "").replace(/\s+/g, "-").toLowerCase();
    idx += 1;
    beats.push({ index: idx, chapterTitle: title, beatType });
    void slug;
  }
  return { template, beats };
}

export function RhythmPreview({ rhythmMd }: RhythmPreviewProps) {
  const { template, beats } = useMemo(() => parseRhythm(rhythmMd), [rhythmMd]);

  if (beats.length === 0) {
    return (
      <div className="mt-2 rounded-xl border border-bd bg-surface2 px-3 py-2.5 text-xs text-t3">
        节奏蓝图已生成，{template ? `使用「${template}」模板` : ""}
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-bd bg-surface2 px-3 py-2.5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-t2">🎼 节奏蓝图</span>
        {template && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface3 text-t3 border border-bd">
            {template}
          </span>
        )}
        <span className="text-[10px] text-t4">{beats.length} 章节拍</span>
      </div>
      <div className="flex items-stretch gap-1.5 overflow-x-auto pb-0.5">
        {beats.map((b) => (
          <div
            key={b.index}
            className={`flex-shrink-0 min-w-[80px] rounded-md border px-2 py-1.5 ${colorForBeat(b.beatType)}`}
            title={b.chapterTitle}
          >
            <div className="text-[10px] font-semibold opacity-80">Ch.{b.index} · {b.beatType}</div>
            <div className="text-[11px] truncate mt-0.5">{b.chapterTitle.replace(/^##\s+/, "")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
