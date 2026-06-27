"use client";

import { useEffect, useState } from "react";

interface Order {
  id: string; provider: string; orderType: "subscription" | "credits";
  amountCents: number; currency: string; planCode: string | null;
  creditsAmount: number | null; status: string; paidAt: number | null; createdAt: number;
}

const STATUS_LABELS: Record<string, string> = { pending: "待支付", paid: "已支付", failed: "失败", cancelled: "已取消", expired: "已过期" };
const STATUS_COLORS: Record<string, string> = { pending: "text-brand-text", paid: "text-green-400", failed: "text-red-400", cancelled: "text-t4", expired: "text-t4" };

export function OrderHistoryCard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account/orders?limit=10").then((r) => r.json()).then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-bd bg-modal p-6 space-y-3">
      <h3 className="text-sm font-semibold text-t1">购买记录</h3>
      {loading ? (
        <div className="flex items-center justify-center py-8"><span className="w-4 h-4 border-2 border-brand-text border-t-transparent rounded-full animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="text-sm text-t3 py-4 text-center">暂无购买记录</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-t4 border-b border-bd"><th className="pb-2 font-medium text-xs">时间</th><th className="pb-2 font-medium text-xs">类型</th><th className="pb-2 font-medium text-xs">详情</th><th className="pb-2 font-medium text-xs text-right">金额</th><th className="pb-2 font-medium text-xs text-right">状态</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-bd/50 hover:bg-surface2 transition-colors">
                  <td className="py-2.5 text-t3 text-xs">{new Date(o.createdAt * 1000).toLocaleDateString("zh-CN")}</td>
                  <td className="py-2.5 text-t2 text-xs">{o.orderType === "subscription" ? "套餐" : "积分"}</td>
                  <td className="py-2.5 text-t3 text-xs">{o.orderType === "subscription" ? (o.planCode ?? "-") : `${o.creditsAmount ?? 0} 积分`}</td>
                  <td className="py-2.5 text-right text-xs font-medium text-t1">{o.currency === "CNY" ? "¥" : "$"}{(o.amountCents / 100).toFixed(2)}</td>
                  <td className={`py-2.5 text-right text-xs font-medium ${STATUS_COLORS[o.status] ?? ""}`}>{STATUS_LABELS[o.status] ?? o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
