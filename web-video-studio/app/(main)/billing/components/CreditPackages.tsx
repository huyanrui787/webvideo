"use client";

import { useEffect, useState } from "react";

interface PackageInfo {
  id: string;
  credits: number;
  priceCents: number;
  label: string | null;
}

interface Props {
  onRefresh: () => void;
}

export function CreditPackages({ onRefresh }: Props) {
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/billing/credits/packages")
      .then((r) => r.json())
      .then(setPackages)
      .catch(() => {});
  }, []);

  const handleBuy = async (pkg: PackageInfo) => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/payments/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditPackageId: pkg.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "支付失败");
      }
    } catch (err: any) {
      alert("支付请求失败: " + (err.message ?? "unknown"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {packages.map((pkg) => (
        <div
          key={pkg.id}
          className="rounded-xl border border-bd p-4 space-y-3"
        >
          {pkg.label && (
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--accent-soft)] text-accent font-medium">
              {pkg.label}
            </span>
          )}
          <div className="text-xl font-bold">
            {pkg.credits.toLocaleString()} <span className="text-sm font-normal text-tmuted">积分</span>
          </div>
          <div className="text-lg font-semibold">
            ${(pkg.priceCents / 100).toFixed(2)}
          </div>
          <button
            disabled={loading}
            onClick={() => handleBuy(pkg)}
            className="w-full py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            购买
          </button>
        </div>
      ))}
    </div>
  );
}
