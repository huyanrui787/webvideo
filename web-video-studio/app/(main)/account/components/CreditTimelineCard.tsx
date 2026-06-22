"use client";

import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  operation: string;
  description: string;
  createdAt: number;
}

const TYPE_SYMBOLS: Record<string, { symbol: string; color: string }> = {
  earn: { symbol: "+", color: "text-green-400" },
  spend: { symbol: "-", color: "text-red-400" },
  refund: { symbol: "↩", color: "text-blue-400" },
  expire: { symbol: "✕", color: "text-tmuted" },
};

export function CreditTimelineCard() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/billing/credits")
      .then((r) => r.json())
      .then((data) => {
        setTxns(data.recentTransactions ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-bd p-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">积分流水</h3>
      </div>

      {loading ? (
        <div className="animate-pulse text-sm text-tmuted">加载中…</div>
      ) : txns.length === 0 ? (
        <div className="text-sm text-tmuted">暂无积分记录</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-tmuted border-b border-bd">
                <th className="pb-2 font-medium">时间</th>
                <th className="pb-2 font-medium">说明</th>
                <th className="pb-2 font-medium text-right">变动</th>
                <th className="pb-2 font-medium text-right">余额</th>
              </tr>
            </thead>
            <tbody>
              {txns.slice(0, 15).map((tx) => {
                const style = TYPE_SYMBOLS[tx.type] ?? { symbol: "", color: "" };
                return (
                  <tr key={tx.id} className="border-b border-bd/50">
                    <td className="py-2 text-t2 text-xs">
                      {new Date(tx.createdAt * 1000).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="py-2">{tx.description}</td>
                    <td className={`py-2 text-right font-medium ${style.color}`}>
                      {style.symbol}{Math.abs(tx.amount)}
                    </td>
                    <td className="py-2 text-right text-t2">
                      {tx.balanceAfter.toLocaleString()}
                    </td>
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
