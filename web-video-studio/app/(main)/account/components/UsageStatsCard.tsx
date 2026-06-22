"use client";

import { useEffect, useState } from "react";

interface UsageStats {
  month: string;
  tokenUsage: {
    chatTokens: number;
    codeTokens: number;
    chatCalls: number;
    codeCalls: number;
  };
  operations: {
    imageGen: { count: number; credits: number };
    imageIllustrate: { count: number; credits: number };
    tts: { count: number; credits: number };
    render: { count: number; credits: number };
    totalCreditsSpent: number;
  };
  lifetime: {
    totalTokens: number;
  };
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export function UsageStatsCard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("");

  useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setMonth(currentMonth);

    fetch(`/api/account/usage-stats?month=${currentMonth}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const changeMonth = (delta: number) => {
    if (!month) return;
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    setMonth(newMonth);
    setLoading(true);
    fetch(`/api/account/usage-stats?month=${newMonth}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-bd p-6">
        <div className="animate-pulse text-sm text-tmuted">加载用量统计…</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-bd p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">AI 用量统计</h3>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => changeMonth(-1)} className="px-2 py-0.5 rounded hover:bg-surface2">◀</button>
          <span className="text-t2 min-w-[80px] text-center">{month}</span>
          <button onClick={() => changeMonth(1)} className="px-2 py-0.5 rounded hover:bg-surface2">▶</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="对话 Token" value={formatTokens(stats?.tokenUsage.chatTokens ?? 0)} sub={`${stats?.tokenUsage.chatCalls ?? 0} 次`} />
        <StatBox label="编码 Token" value={formatTokens(stats?.tokenUsage.codeTokens ?? 0)} sub={`${stats?.tokenUsage.codeCalls ?? 0} 次`} />
        <StatBox label="图片生成" value={`${stats?.operations.imageGen.count ?? 0} 张`} sub={`${stats?.operations.imageGen.credits ?? 0} 积分`} />
        <StatBox label="TTS 合成" value={`${stats?.operations.tts.count ?? 0} 次`} sub={`${stats?.operations.tts.credits ?? 0} 积分`} />
        <StatBox label="视频渲染" value={`${stats?.operations.render.count ?? 0} 次`} sub={`${stats?.operations.render.credits ?? 0} 积分`} />
        <StatBox label="本月消耗" value={`${stats?.operations.totalCreditsSpent ?? 0} 积分`} sub="" accent />
        <StatBox label="累计 Token" value={formatTokens(stats?.lifetime.totalTokens ?? 0)} sub="所有时间" />
        <StatBox label="插图生成" value={`${stats?.operations.imageIllustrate.count ?? 0} 张`} sub={`${stats?.operations.imageIllustrate.credits ?? 0} 积分`} />
      </div>
    </div>
  );
}

function StatBox({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${accent ? "border-accent bg-accent/5" : "border-bd"}`}>
      <div className="text-xs text-tmuted">{label}</div>
      <div className={`text-lg font-bold mt-0.5 ${accent ? "text-accent" : ""}`}>{value}</div>
      {sub && <div className="text-xs text-t2 mt-0.5">{sub}</div>}
    </div>
  );
}
