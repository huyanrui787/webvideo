"use client";

import { useEffect, useState } from "react";

interface UsageStats {
  month: string;
  tokenUsage: { chatTokens: number; codeTokens: number; chatCalls: number; codeCalls: number };
  operations: { imageGen: { count: number; credits: number }; imageIllustrate: { count: number; credits: number }; tts: { count: number; credits: number }; render: { count: number; credits: number }; totalCreditsSpent: number };
  lifetime: { totalTokens: number };
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
    const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setMonth(m);
    fetch(`/api/account/usage-stats?month=${m}`).then((r) => r.json()).then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const changeMonth = (delta: number) => {
    if (!month) return;
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const nm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    setMonth(nm); setLoading(true);
    fetch(`/api/account/usage-stats?month=${nm}`).then((r) => r.json()).then(setStats).catch(() => {}).finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-bd bg-modal p-6 flex items-center justify-center py-12">
        <span className="w-4 h-4 border-2 border-brand-text border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-bd bg-modal p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-t1">AI 用量统计</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-t3 hover:text-t1 hover:bg-surface2 transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="7.5,2.5 4,6 7.5,9.5"/></svg>
          </button>
          <span className="text-xs text-t2 min-w-[80px] text-center font-medium">{month}</span>
          <button onClick={() => changeMonth(1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-t3 hover:text-t1 hover:bg-surface2 transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4.5,2.5 8,6 4.5,9.5"/></svg>
          </button>
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
    <div className={`rounded-lg border p-3 ${accent ? "border-amber-600/30 bg-brand-subtle" : "border-bd"}`}>
      <div className="text-xs text-t4">{label}</div>
      <div className={`text-lg font-bold mt-0.5 ${accent ? "text-brand-text" : "text-t1"}`}>{value}</div>
      {sub && <div className="text-xs text-t3 mt-0.5">{sub}</div>}
    </div>
  );
}
