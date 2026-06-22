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

const TYPE_LABELS: Record<string, string> = {
  earn: "+",
  spend: "-",
  refund: "↩",
  expire: "✕",
};

const TYPE_COLORS: Record<string, string> = {
  earn: "text-green-500",
  spend: "text-red-400",
  refund: "text-blue-400",
  expire: "text-tmuted",
};

export function TransactionHistory() {
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

  if (loading) {
    return <div className="text-sm text-tmuted animate-pulse">加载中…</div>;
  }

  if (txns.length === 0) {
    return <div className="text-sm text-tmuted">暂无积分记录</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-tmuted border-b border-bd">
            <th className="pb-2 font-medium">时间</th>
            <th className="pb-2 font-medium">操作</th>
            <th className="pb-2 font-medium text-right">变动</th>
            <th className="pb-2 font-medium text-right">余额</th>
          </tr>
        </thead>
        <tbody>
          {txns.map((tx) => (
            <tr key={tx.id} className="border-b border-bd/50">
              <td className="py-2 text-t2">
                {new Date(tx.createdAt * 1000).toLocaleDateString("zh-CN")}
              </td>
              <td className="py-2">{tx.description}</td>
              <td className={`py-2 text-right font-medium ${TYPE_COLORS[tx.type] ?? ""}`}>
                {TYPE_LABELS[tx.type] ?? ""}{Math.abs(tx.amount)}
              </td>
              <td className="py-2 text-right text-t2">
                {tx.balanceAfter}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
