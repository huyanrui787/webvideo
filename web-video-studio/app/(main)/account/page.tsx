"use client";

import { useEffect, useState, useCallback } from "react";
import { ProfileCard } from "./components/ProfileCard";
import { UsageStatsCard } from "./components/UsageStatsCard";
import { OrderHistoryCard } from "./components/OrderHistoryCard";
import { CreditTimelineCard } from "./components/CreditTimelineCard";
import { DangerZoneCard } from "./components/DangerZoneCard";

export interface AccountUser {
  id: string; email: string; name: string; role: string;
  planCode: string; planName: string; credits: number;
  createdAt: number; avatarUrl: string | null;
}

export default function AccountPage() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try { const res = await fetch("/api/auth/me"); if (res.ok) setUser(await res.json()); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-5 h-5 border-2 border-brand-text border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-t3 text-sm">无法加载用户信息</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-t1">账户</h1>
          <p className="text-xs text-t3 mt-0.5">管理个人信息、查看用量和订单记录</p>
        </div>
        <ProfileCard user={user} onUpdate={fetchUser} />
        <UsageStatsCard />
        <OrderHistoryCard />
        <CreditTimelineCard />
        <DangerZoneCard />
      </div>
    </div>
  );
}
