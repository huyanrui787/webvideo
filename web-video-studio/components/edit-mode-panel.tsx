"use client";

import { useState } from "react";
import type { ChapterProgress } from "./chapter-progress-panel";

interface EditModePanelProps {
  chapters: ChapterProgress[];
  currentChapter: number;
  currentStep: number;
  chapterStepCounts: Record<number, number>;
  onSeekToStep: (chapter: number, step: number) => void;
}

export function EditModePanel({
  chapters,
  currentChapter,
  currentStep,
  chapterStepCounts,
  onSeekToStep,
}: EditModePanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (chapters.length === 0) return null;

  return (
    <div
      className="absolute left-0 top-0 bottom-0 z-20 flex"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Collapsed: narrow dot strip */}
      {!expanded && (
        <div className="w-8 flex flex-col items-center py-3 gap-2 bg-black/50 backdrop-blur-sm border-r border-white/10 overflow-hidden">
          {chapters.map((ch, chIdx) => {
            const isActive = chIdx === currentChapter;
            return (
              <button
                key={ch.id}
                onClick={() => onSeekToStep(chIdx, 0)}
                title={ch.title || ch.id}
                className={`w-4 h-4 rounded-full shrink-0 transition-all ${
                  isActive
                    ? "bg-amber-400 scale-110"
                    : "bg-white/20 hover:bg-white/40"
                }`}
              />
            );
          })}
        </div>
      )}

      {/* Expanded: full panel */}
      {expanded && (
        <div className="w-52 flex flex-col bg-black/80 backdrop-blur-sm border-r border-white/10 overflow-hidden">
          <div className="px-3 py-2 border-b border-white/10 shrink-0">
            <span className="text-xs font-medium text-t2 uppercase tracking-wider">步骤导航</span>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {chapters.map((ch, chIdx) => {
              const isActiveChapter = chIdx === currentChapter;
              const maxStep = chapterStepCounts[chIdx] ?? 0;
              const stepCount = maxStep + 1;

              return (
                <div key={ch.id} className="mb-1">
                  <button
                    onClick={() => onSeekToStep(chIdx, 0)}
                    className={`w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors ${
                      isActiveChapter
                        ? "bg-indigo-600/30 text-t1"
                        : "text-t3 hover:text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isActiveChapter ? "bg-amber-400" : "bg-white/20"
                    }`} />
                    <span className="text-xs font-medium truncate">{ch.title || ch.id}</span>
                  </button>

                  {(isActiveChapter || stepCount > 1) && (
                    <div className="pl-6 pr-2 pb-1 flex flex-wrap gap-1">
                      {Array.from({ length: stepCount }, (_, sIdx) => {
                        const isActive = isActiveChapter && sIdx === currentStep;
                        return (
                          <button
                            key={sIdx}
                            onClick={() => onSeekToStep(chIdx, sIdx)}
                            className={`w-6 h-6 rounded text-xs font-mono transition-colors ${
                              isActive
                                ? "bg-brand text-t1"
                                : "bg-white/10 text-t3 hover:bg-white/20 hover:text-t2"
                            }`}
                            title={`第 ${sIdx + 1} 步`}
                          >
                            {sIdx + 1}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
