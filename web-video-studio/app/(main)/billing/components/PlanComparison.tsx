"use client";

import { useEffect, useState } from "react";

interface PlanInfo {
  code: string; name: string; monthlyPrice: number; annualPrice: number;
  monthlyCredits: number; maxProjects: number; maxParallelBuilds: number;
  storageMb: number; maxExportRes: string; watermark: boolean; features: string[];
}

interface Props { currentPlan?: string; onRefresh: () => void; }

const FEATURE_LABELS: Record<string, string> = {
  no_watermark: "无水印导出", all_tts: "全部 TTS 服务商", all_models: "全部 AI 模型",
  parallel_builds: "并行章节构建", "4k_export": "4K 导出", custom_themes: "自定义主题",
  custom_branding: "去品牌化", api_access: "API 访问", priority_ai: "AI 优先队列",
  dedicated_support: "专属支持",
};

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  no_watermark: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3"/></svg>,
};

export function PlanComparison({ currentPlan, onRefresh }: Props) {
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch("/api/billing/plans").then((r) => r.json()).then(setPlans).catch(() => {}); }, []);

  const handleUpgrade = async (planCode: string, provider: "stripe" | "wechat") => {
    setLoading(true);
    try {
      const endpoint = provider === "stripe" ? "/api/billing/payments/stripe/checkout" : "/api/billing/payments/wechat/order";
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planCode, billingCycle: cycle }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else if (data.codeUrl) { alert(`微信支付二维码已生成\n订单号：${data.orderNo}`); onRefresh(); }
      else alert(data.error ?? "支付失败");
    } catch (err: any) { alert("支付请求失败: " + (err.message ?? "unknown")); }
    finally { setLoading(false); }
  };

  const price = (p: PlanInfo) => cycle === "annual" ? p.annualPrice : p.monthlyPrice;
  const priceLabel = (cents: number) => cents === 0 ? "免费" : `¥${(cents / 100).toFixed(0)}`;

  return (
    <div id="plan-comparison">
      {/* Billing cycle toggle */}
      <div className="inline-flex items-center rounded-lg border border-bd p-0.5 mb-4">
        <button onClick={() => setCycle("monthly")}
          className={`px-3 py-1 rounded-md text-xs transition-colors ${cycle === "monthly" ? "bg-surface2 text-t1 font-medium" : "text-t4 hover:text-t2"}`}>月付</button>
        <button onClick={() => setCycle("annual")}
          className={`px-3 py-1 rounded-md text-xs transition-colors ${cycle === "annual" ? "bg-surface2 text-t1 font-medium" : "text-t4 hover:text-t2"}`}>年付（省 2 月）</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {plans.map((plan) => {
          const isCurrent = plan.code === currentPlan;
          const p = price(plan);

          return (
            <div key={plan.code}
              className={`rounded-xl border p-4 flex flex-col gap-3 transition-colors ${
                isCurrent ? "border-brand/50 bg-brand-subtle" : "border-bd bg-modal hover:border-bd-hover"
              }`}>
              {/* Name + badge */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-t1 text-sm">{plan.name}</span>
                {isCurrent && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand/10 text-brand-text font-medium">当前</span>}
              </div>

              {/* Price */}
              <div>
                <span className="text-2xl font-bold text-t1">{priceLabel(p)}</span>
                {p > 0 && <span className="text-xs text-t3">/{cycle === "monthly" ? "月" : "年"}</span>}
              </div>

              {/* Stats — icon-free, clean text */}
              <div className="text-xs text-t2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-t4 shrink-0"><rect x="1.5" y="1.5" width="9" height="9" rx="1.5"/><polygon points="5,3 5,9 9,6"/></svg>
                  {plan.maxProjects === -1 ? "无限项目" : `${plan.maxProjects} 个项目`}
                </div>
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-t4 shrink-0"><rect x="1" y="1.5" width="10" height="9" rx="1"/><polyline points="1.5,8 4,5 4,5 5.5,6.5 8,3.5 10.5,6"/></svg>
                  {plan.maxExportRes} 导出
                </div>
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-t4 shrink-0"><rect x="1" y="1" width="10" height="10" rx="1.5"/><rect x="4" y="4" width="4" height="4" rx="0.6"/></svg>
                  {plan.storageMb >= 1024 ? `${(plan.storageMb / 1024).toFixed(0)} GB` : `${plan.storageMb} MB`} 存储
                </div>
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-t4 shrink-0"><polyline points="1.5,9 4,4 6.5,7.5 8.5,1.5"/><polyline points="6.5,1.5 10,2 9.5,5.5"/></svg>
                  {plan.monthlyCredits.toLocaleString()} 积分/月
                </div>
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-t4 shrink-0"><rect x="1.5" y="1.5" width="4" height="4" rx="0.8"/><rect x="6.5" y="1.5" width="4" height="4" rx="0.8"/><rect x="1.5" y="6.5" width="4" height="4" rx="0.8"/><rect x="6.5" y="6.5" width="4" height="4" rx="0.8"/></svg>
                  并行 {plan.maxParallelBuilds} 章
                </div>
              </div>

              {/* Features */}
              <div className="text-xs text-t3 space-y-1 flex-1">
                {plan.features.slice(0, 4).map((f) => (
                  <div key={f} className="flex items-center gap-1.5">
                    {FEATURE_ICONS[f] ?? <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3"/></svg>}
                    {FEATURE_LABELS[f] ?? f}
                  </div>
                ))}
                {plan.features.length > 4 && <div className="text-t4">…等 {plan.features.length} 项功能</div>}
              </div>

              {/* Action */}
              {!isCurrent && p > 0 && (
                <button disabled={loading} onClick={() => handleUpgrade(plan.code, "stripe")}
                  className="w-full py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium disabled:opacity-40 transition-colors">升级</button>
              )}
              {isCurrent && (
                <div className="w-full py-2 rounded-lg bg-surface2 text-sm text-center text-t3">当前套餐</div>
              )}
              {p === 0 && !isCurrent && (
                <button disabled={loading} onClick={() => handleUpgrade(plan.code, "stripe")}
                  className="w-full py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium disabled:opacity-40 transition-colors">选择</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
