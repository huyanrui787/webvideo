"use client";

import { useEffect, useState } from "react";

interface PlanInfo {
  code: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyCredits: number;
  maxProjects: number;
  maxParallelBuilds: number;
  storageMb: number;
  maxExportRes: string;
  watermark: boolean;
  features: string[];
}

interface Props {
  currentPlan?: string;
  onRefresh: () => void;
}

const FEATURE_LABELS: Record<string, string> = {
  no_watermark: "无水印导出",
  all_tts: "全部 TTS 服务商",
  all_models: "全部 AI 模型",
  parallel_builds: "并行章节构建",
  "4k_export": "4K 导出",
  custom_themes: "自定义主题",
  custom_branding: "去品牌化",
  api_access: "API 访问",
  priority_ai: "AI 优先队列",
  dedicated_support: "专属支持",
};

export function PlanComparison({ currentPlan, onRefresh }: Props) {
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/billing/plans")
      .then((r) => r.json())
      .then(setPlans)
      .catch(() => {});
  }, []);

  const handleUpgrade = async (planCode: string, provider: "stripe" | "wechat") => {
    setLoading(true);
    try {
      const endpoint = provider === "stripe"
        ? "/api/billing/payments/stripe/checkout"
        : "/api/billing/payments/wechat/order";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode, billingCycle: cycle }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url; // Stripe redirect
      } else if (data.codeUrl) {
        // WeChat QR code — show in a modal (simplified: open in new tab)
        alert(`微信支付二维码已生成，请在微信中扫码支付。\n订单号：${data.orderNo}`);
        onRefresh();
      } else {
        alert(data.error ?? "支付失败");
      }
    } catch (err: any) {
      alert("支付请求失败: " + (err.message ?? "unknown"));
    } finally {
      setLoading(false);
    }
  };

  const price = (p: PlanInfo) =>
    cycle === "annual" ? p.annualPrice : p.monthlyPrice;

  return (
    <div id="plan-comparison">
      {/* Billing cycle toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setCycle("monthly")}
          className={`px-3 py-1 rounded text-sm ${cycle === "monthly" ? "bg-accent text-white" : "bg-surface2"}`}
        >
          月付
        </button>
        <button
          onClick={() => setCycle("annual")}
          className={`px-3 py-1 rounded text-sm ${cycle === "annual" ? "bg-accent text-white" : "bg-surface2"}`}
        >
          年付（省 2 月）
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {plans.map((plan) => {
          const isCurrent = plan.code === currentPlan;
          const priceCents = price(plan);

          return (
            <div
              key={plan.code}
              className={`rounded-xl border p-4 space-y-3 ${isCurrent ? "border-accent ring-1 ring-[var(--accent)]" : "border-bd"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{plan.name}</span>
                {isCurrent && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-accent text-white">
                    当前
                  </span>
                )}
              </div>

              <div>
                <span className="text-2xl font-bold">
                  ${(priceCents / 100).toFixed(0)}
                </span>
                <span className="text-sm text-tmuted">/{cycle === "monthly" ? "月" : "年"}</span>
              </div>

              <div className="text-sm space-y-1">
                <div>🎬 {plan.maxProjects === -1 ? "无限" : plan.maxProjects} 个项目</div>
                <div>🎥 {plan.maxExportRes} 导出</div>
                <div>📦 {plan.storageMb >= 1024 ? `${(plan.storageMb / 1024).toFixed(0)} GB` : `${plan.storageMb} MB`} 存储</div>
                <div>⚡ {plan.monthlyCredits.toLocaleString()} 积分/月</div>
                <div>🔧 并行 {plan.maxParallelBuilds} 章</div>
              </div>

              {/* Feature list */}
              <div className="text-xs text-t2 space-y-0.5">
                {plan.features.slice(0, 4).map((f) => (
                  <div key={f}>✓ {FEATURE_LABELS[f] ?? f}</div>
                ))}
                {plan.features.length > 4 && (
                  <div>… 等 {plan.features.length} 项功能</div>
                )}
              </div>

              {!isCurrent && priceCents > 0 && (
                <button
                  disabled={loading}
                  onClick={() => handleUpgrade(plan.code, "stripe")}
                  className="w-full py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  升级
                </button>
              )}
              {isCurrent && (
                <div className="w-full py-2 rounded-lg bg-surface2 text-sm text-center text-tmuted">
                  当前套餐
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
