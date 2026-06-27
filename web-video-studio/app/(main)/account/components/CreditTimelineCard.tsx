"use client";

import { useEffect, useState } from "react";

interface Transaction { id: string; type: string; amount: number; balanceAfter: number; operation: string; description: string; createdAt: number; }

const TYPE_META: Record<string, { label: string; color: string }> = {
  earn: { label: "+", color: "text-green-400" },
  spend: { label: "-", color: "text-red-400" },
  refund: { label: "↩", color: "text-blue-400" },
  expire: { label: "−", color: "text-t4" },
};

export function CreditTimelineCard() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/billing/credits").then((r) => r.json()).then((data) => { setTxns(data.recentTransactions ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-bd bg-modal p-6 space-y-3">
      <h3 className="text-sm font-semibold text-t1">积分流水</h3>
      {loading ? (
        <div className="flex items-center justify-center py-8"><span className="w-4 h-4 border-2 border-brand-text border-t-transparent rounded-full animate-spin" /></div>
      ) : txns.length === 0 ? (
        <div className="text-sm text-t3 py-4 text-center">暂无积分记录</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-t4 border-b border-bd"><th className="pb-2 font-medium text-xs">时间</th><th className="pb-2 font-medium text-xs">说明</th><th className="pb-2 font-medium text-xs text-right">变动</th><th className="pb-2 font-medium text-xs text-right">余额</th></tr></thead>
            <tbody>
              {txns.slice(0, 15).map((tx) => {
                const meta = TYPE_META[tx.type] ?? { label: "", color: "" };
                return (
                  <tr key={tx.id} className="border-b border-bd/50 hover:bg-surface2 transition-colors">
                    <td className="py-2.5 text-t3 text-xs">{new Date(tx.createdAt * 1000).toLocaleDateString("zh-CN")}</td>
                    <td className="py-2.5 text-t2 text-xs">{tx.description}</td>
                    <td className={`py-2.5 text-right font-medium text-xs ${meta.color}`}>{meta.label}{Math.abs(tx.amount)}</td>
                    <td className="py-2.5 text-right text-t3 text-xs">{tx.balanceAfter.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
