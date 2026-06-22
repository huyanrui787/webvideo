"use client";

import { useEffect, useState, useCallback } from "react";
import { PlanComparison } from "./components/PlanComparison";
import { CreditBalance } from "./components/CreditBalance";
import { CreditPackages } from "./components/CreditPackages";
import { TransactionHistory } from "./components/TransactionHistory";
import { CurrentSubscription } from "./components/CurrentSubscription";

interface UsageData {
  plan: string;
  planName: string;
  credits: { balance: number; monthlyGrant: number };
  projects: { current: number; max: number | "unlimited" };
  features: string[];
}

export default function BillingPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/usage");
      if (res.ok) setUsage(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsage();
    // Check for Stripe redirect params
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      window.history.replaceState({}, "", "/billing");
    }
  }, [fetchUsage]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-tmuted">加载中…</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <h1 className="text-2xl font-bold">服务</h1>

        {/* Current plan + credit balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CurrentSubscription usage={usage} onRefresh={fetchUsage} />
          <CreditBalance usage={usage} onRefresh={fetchUsage} />
        </div>

        {/* Plan comparison */}
        <section>
          <h2 className="text-lg font-semibold mb-4">套餐对比</h2>
          <PlanComparison currentPlan={usage?.plan} onRefresh={fetchUsage} />
        </section>

        {/* Credit packages */}
        <section>
          <h2 className="text-lg font-semibold mb-4">积分充值</h2>
          <CreditPackages onRefresh={fetchUsage} />
        </section>

        {/* Transaction history */}
        <section>
          <h2 className="text-lg font-semibold mb-4">积分明细</h2>
          <TransactionHistory />
        </section>
      </div>
    </div>
  );
}
