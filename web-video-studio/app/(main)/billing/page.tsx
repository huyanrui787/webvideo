"use client";

import { useEffect, useState, useCallback } from "react";
import { PlanComparison } from "./components/PlanComparison";
import { CreditBalance } from "./components/CreditBalance";
import { CreditPackages } from "./components/CreditPackages";
import { TransactionHistory } from "./components/TransactionHistory";
import { CurrentSubscription } from "./components/CurrentSubscription";

interface UsageData {
  plan: string; planName: string;
  credits: { balance: number; monthlyGrant: number };
  projects: { current: number; max: number | "unlimited" };
  features: string[];
}

export default function BillingPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    try { const res = await fetch("/api/billing/usage"); if (res.ok) setUsage(await res.json()); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsage();
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") window.history.replaceState({}, "", "/billing");
  }, [fetchUsage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-5 h-5 border-2 border-brand-text border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">
        <div>
          <h1 className="text-lg font-semibold text-t1">服务与订阅</h1>
          <p className="text-xs text-t3 mt-0.5">管理套餐、积分和账单</p>
        </div>

        {/* Plan + Credits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CurrentSubscription usage={usage} onRefresh={fetchUsage} />
          <CreditBalance usage={usage} onRefresh={fetchUsage} />
        </div>

        {/* Plan comparison */}
        <section>
          <h2 className="text-sm font-semibold text-t1 mb-4">套餐对比</h2>
          <PlanComparison currentPlan={usage?.plan} onRefresh={fetchUsage} />
        </section>

        {/* Credit packages */}
        <section>
          <h2 className="text-sm font-semibold text-t1 mb-4">积分充值</h2>
          <CreditPackages onRefresh={fetchUsage} />
        </section>

        {/* Transaction history */}
        <section>
          <h2 className="text-sm font-semibold text-t1 mb-4">积分明细</h2>
          <TransactionHistory />
        </section>
      </div>
    </div>
  );
}
