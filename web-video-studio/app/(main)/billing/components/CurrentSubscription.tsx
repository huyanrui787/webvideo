"use client";

interface Props {
  usage: { plan: string; planName: string; projects: { current: number; max: number | "unlimited" }; features: string[] } | null;
  onRefresh: () => void;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

export function CurrentSubscription({ usage }: Props) {
  const plan = usage?.plan ?? "free";
  const planName = usage?.planName ?? "Free";

  return (
    <div className="rounded-xl border border-bd p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-tmuted">当前套餐</span>
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-surface2">
          {PLAN_LABELS[plan] ?? plan}
        </span>
      </div>
      <div className="text-xl font-bold">{planName}</div>
      <div className="text-sm text-t2">
        项目数：{usage?.projects.current ?? 0} / {usage?.projects.max ?? "?"}
      </div>
      {plan === "free" && (
        <a
          href="#plan-comparison"
          className="inline-block text-sm text-accent hover:underline"
        >
          升级套餐 →
        </a>
      )}
    </div>
  );
}
