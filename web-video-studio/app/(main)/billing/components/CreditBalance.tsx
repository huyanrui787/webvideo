"use client";

interface Props {
  usage: { credits: { balance: number; monthlyGrant: number } } | null;
  onRefresh: () => void;
}

export function CreditBalance({ usage }: Props) {
  const balance = usage?.credits?.balance ?? 0;
  const monthlyGrant = usage?.credits?.monthlyGrant ?? 0;

  return (
    <div className="rounded-xl border border-bd bg-modal p-5 space-y-3">
      <span className="text-xs text-t3 font-medium uppercase tracking-wider">积分余额</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-t1">{balance.toLocaleString()}</span>
        <span className="text-sm text-t3">积分</span>
      </div>
      <div className="text-xs text-t2">
        每月赠送 {monthlyGrant.toLocaleString()} 积分
      </div>
    </div>
  );
}
