"use client";

import { useState } from "react";
import type { AnyPart } from "@/lib/types";

const TOOL_META: Record<string, { label: string; color: string; symbol: string }> = {
  ProjectRead:      { label: "读取",    color: "text-t3",  symbol: "↗" },
  ProjectWrite:     { label: "写入",    color: "text-t2",  symbol: "↙" },
  ProjectList:      { label: "列目录",  color: "text-t3",  symbol: "≡" },
  ProjectShell:     { label: "执行",    color: "text-t2",  symbol: "⚡" },
  ProjectSetStatus: { label: "更新状态", color: "text-t2", symbol: "◈" },
};

function toolSummary(t: AnyPart): string {
  const input = t.toolInvocation?.input ?? t.input ?? {};
  if (input.path)   return input.path;
  if (input.cmd)    return (input.cmd as string).slice(0, 50);
  if (input.dir)    return input.dir || ".";
  if (input.status) return input.status;
  return "";
}

export function ToolCallsBlock({
  parts,
  isStreaming: _isStreaming,
}: {
  parts: AnyPart[];
  isStreaming: boolean;
}) {
  const tools = parts.filter((p) => String(p.type ?? "").startsWith("tool-"));
  const [expanded, setExpanded] = useState(false);

  if (tools.length === 0) return null;

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="mt-2 text-xs text-t3 hover:text-t2 flex items-center gap-1 transition-colors"
      >
        <span>⚙</span>
        <span>{tools.length} 个操作</span>
        <span className="text-t4">›</span>
      </button>
    );
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(false)}
        className="text-xs text-t3 hover:text-t2 mb-1 flex items-center gap-1 transition-colors"
      >
        <span>⚙</span>
        <span>{tools.length} 个操作</span>
        <span className="text-t4">‹</span>
      </button>
      <div className="max-h-40 overflow-y-auto flex flex-col gap-0.5">
        {tools.map((t: AnyPart, i: number) => {
          const name: string = t.toolName ?? t.toolInvocation?.toolName ?? "tool";
          const meta = TOOL_META[name];
          const summary = toolSummary(t);
          const isDone = t.state === "result" || t.toolInvocation?.state === "result";
          return (
            <div
              key={t.toolCallId ?? i}
              className="flex items-center gap-1.5 text-xs font-mono py-0.5 px-1.5 rounded bg-black/[0.03]"
            >
              <span className={isDone ? "text-green-500" : "text-t4 animate-pulse"}>
                {isDone ? "✓" : "⚙"}
              </span>
              {meta ? (
                <span className={`font-semibold ${meta.color}`}>{meta.symbol} {meta.label}</span>
              ) : (
                <span className="text-t2 font-semibold">{name}</span>
              )}
              {summary && (
                <span className="text-t3 truncate max-w-[200px]">{summary}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
