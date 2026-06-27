"use client";

interface Props {
  usage: { plan: string; planName: string; projects: { current: number; max: number | "unlimited" }; features: string[] } | null;
  onRefresh: () => void;
}

const PLAN_META: Record<string, { label: string; dot: string }> = {
  free: { label: "Free", dot: "bg-t4" },
  starter: { label: "Starter", dot: "bg-blue-400" },
  pro: { label: "Pro", dot: "bg-amber-400" },
  enterprise: { label: "Enterprise", dot: "bg-amber-400" },
};

export function CurrentSubscription({ usage }: Props) {
  const plan = usage?.plan ?? "free";
  const meta = PLAN_META[plan] ?? PLAN_META.free;

  return (
    <div className="rounded-xl border border-bd bg-modal p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-t3 font-medium uppercase tracking-wider">当前套餐</span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-t2">
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>
      <div className="text-xl font-bold text-t1">{usage?.planName ?? meta.label}</div>
      <div className="text-sm text-t2">
        项目数：{usage?.projects.current ?? 0} / {usage?.projects.max ?? "?"}
      </div>
      {plan === "free" && (
        <a href="#plan-comparison" className="inline-block text-xs font-medium text-brand-text hover:text-indigo-300 transition-colors">
          升级套餐 →
        </a>
      )}
    </div>
  );
}
