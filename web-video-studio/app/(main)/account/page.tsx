"use client";

import { useEffect, useState, useCallback } from "react";
import { ProfileCard } from "./components/ProfileCard";
import { UsageStatsCard } from "./components/UsageStatsCard";
import { OrderHistoryCard } from "./components/OrderHistoryCard";
import { CreditTimelineCard } from "./components/CreditTimelineCard";
import { DangerZoneCard } from "./components/DangerZoneCard";

export interface AccountUser {
  id: string;
  email: string;
  name: string;
  role: string;
  planCode: string;
  planName: string;
  credits: number;
  createdAt: number;
  avatarUrl: string | null;
}

export default function AccountPage() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) setUser(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-tmuted">加载中…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-tmuted">无法加载用户信息</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold">账户</h1>

        <ProfileCard user={user} onUpdate={fetchUser} />
        <UsageStatsCard />
        <OrderHistoryCard />
        <CreditTimelineCard />
        <DangerZoneCard />
      </div>
    </div>
  );
}
