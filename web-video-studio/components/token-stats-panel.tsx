"use client";

import { useEffect, useState } from "react";

interface TurnRow {
  id: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  summary: string;
  createdAt: number;
}

interface SummaryRow {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  turns: number;
}

interface TokenStatsPanelProps {
  projectId: string;
  onClose: () => void;
}

const MODEL_SHORT: Record<string, string> = {
  "claude-sonnet-4-6": "Sonnet 4.6",
  "claude-opus-4-8": "Opus 4.8",
};

const MODEL_COLOR: Record<string, string> = {
  "claude-sonnet-4-6": "bg-sky-100 text-sky-700",
  "claude-opus-4-8": "bg-violet-100 text-violet-700",
};

// Anthropic pricing (USD per 1M tokens), as of 2025-08
// https://www.anthropic.com/pricing
const MODEL_PRICE: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6": { input: 3.0,  output: 15.0 },
  "claude-opus-4-8":   { input: 15.0, output: 75.0 },
};
const USD_TO_CNY = 7.25;

function calcCostCNY(model: string, inputTokens: number, outputTokens: number): number {
  const price = MODEL_PRICE[model];
  if (!price) return 0;
  const usd = (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
  return usd * USD_TO_CNY;
}

function fmtCNY(cny: number): string {
  if (cny < 0.01) return "< ¥0.01";
  return `¥${cny.toFixed(2)}`;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function fmtTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TokenStatsPanel({ projectId, onClose }: TokenStatsPanelProps) {
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [turns, setTurns] = useState<TurnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [turnsOpen, setTurnsOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/token-usage`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) { setSummary(d.summary); setTurns(d.turns); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  const grandTotal = summary.reduce((s, r) => s + r.totalTokens, 0);
  const grandInput = summary.reduce((s, r) => s + r.inputTokens, 0);
  const grandOutput = summary.reduce((s, r) => s + r.outputTokens, 0);
  const grandTurns = summary.reduce((s, r) => s + r.turns, 0);
  const grandCostCNY = summary.reduce(
    (s, r) => s + calcCostCNY(r.model, r.inputTokens, r.outputTokens),
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-modal rounded-2xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bd shrink-0">
          <h2 className="text-sm font-semibold text-t1">Token 消耗统计</h2>
          <button
            onClick={onClose}
            className="text-t3 hover:text-t2 text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <p className="text-sm text-t3 text-center py-6">加载中…</p>
          ) : grandTurns === 0 ? (
            <p className="text-sm text-t3 text-center py-6">暂无数据，发送第一条消息后开始记录</p>
          ) : (
            <>
              {/* Grand total */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "总 Token", value: fmt(grandTotal) },
                  { label: "输入", value: fmt(grandInput) },
                  { label: "输出", value: fmt(grandOutput) },
                  { label: "费用", value: fmtCNY(grandCostCNY), highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className={`rounded-xl px-3 py-3 text-center ${highlight ? "bg-amber-50" : "bg-base"}`}>
                    <p className={`text-[11px] mb-0.5 ${highlight ? "text-amber-500" : "text-t3"}`}>{label}</p>
                    <p className={`text-lg font-bold tabular-nums ${highlight ? "text-amber-700" : "text-t1"}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Per-model breakdown */}
              {summary.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-t2 px-0.5">按模型</p>
                  {summary.map((s) => (
                    <div key={s.model} className="flex items-center gap-3 bg-base rounded-xl px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${MODEL_COLOR[s.model] ?? "bg-surface2 text-t2"}`}>
                        {MODEL_SHORT[s.model] ?? s.model}
                      </span>
                      <div className="flex-1 grid grid-cols-4 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-t3">总计</p>
                          <p className="text-sm font-semibold text-t1 tabular-nums">{fmt(s.totalTokens)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-t3">输入</p>
                          <p className="text-sm text-t2 tabular-nums">{fmt(s.inputTokens)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-t3">输出</p>
                          <p className="text-sm text-t2 tabular-nums">{fmt(s.outputTokens)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-amber-500">费用</p>
                          <p className="text-sm font-semibold text-amber-700 tabular-nums">
                            {fmtCNY(calcCostCNY(s.model, s.inputTokens, s.outputTokens))}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-t3 shrink-0">{s.turns} 轮</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Per-turn detail */}
              <div>
                <button
                  onClick={() => setTurnsOpen((o) => !o)}
                  className="w-full flex items-center justify-between text-xs font-medium text-t2 px-0.5 py-1 hover:text-t2 transition-colors"
                >
                  <span>每轮明细（{grandTurns} 轮）</span>
                  <span className="text-t4">{turnsOpen ? "▲" : "▼"}</span>
                </button>
                {turnsOpen && (
                  <div className="mt-1 rounded-xl border border-bd divide-y divide-zinc-50 overflow-hidden">
                    {turns.map((t) => (
                      <div key={t.id} className="flex flex-col px-4 py-2.5 gap-1">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${MODEL_COLOR[t.model] ?? "bg-surface2 text-t2"}`}>
                            {MODEL_SHORT[t.model] ?? t.model}
                          </span>
                          <div className="flex-1 flex items-center gap-3 min-w-0 tabular-nums text-xs">
                            <span className="text-t1 font-medium w-14 text-right">{fmt(t.totalTokens)}</span>
                            <span className="text-t3">↑{fmt(t.inputTokens)}</span>
                            <span className="text-t3">↓{fmt(t.outputTokens)}</span>
                            <span className="text-amber-600 font-medium">{fmtCNY(calcCostCNY(t.model, t.inputTokens, t.outputTokens))}</span>
                          </div>
                          <span className="text-[11px] text-t4 shrink-0">{fmtTime(t.createdAt)}</span>
                        </div>
                        {t.summary && (
                          <p className="text-[11px] text-zinc-400 pl-0.5 truncate" title={t.summary}>
                            {t.summary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
