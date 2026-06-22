"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserAvatar } from "./user-avatar";

const NAV_ITEMS = [
  { href: "/studio", label: "首页", icon: "⌂" },
  { href: "/projects", label: "项目", icon: "⬡" },
  { href: "/draw", label: "智能绘图", icon: "✏️" },
  { href: "/batches", label: "批量", icon: "⊞" },
  { href: "/scheduled-tasks", label: "定时", icon: "◷" },
  { href: "/library", label: "素材", icon: "◫" },
  { href: "/showcase", label: "动画", icon: "◈" },
  { href: "/billing", label: "服务", icon: "✦" },
  { href: "/settings", label: "设置", icon: "◎" },
];

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

interface SidebarUser {
  name: string;
  email: string;
  planCode: string;
  avatarUrl: string | null;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SidebarUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.email) {
          setUser({
            name: data.name ?? data.email,
            email: data.email,
            planCode: data.planCode ?? "free",
            avatarUrl: data.avatarUrl ?? null,
          });
        }
      })
      .catch(() => {});
  }, []);

  function isActive(href: string) {
    if (href === "/studio") return pathname === "/studio";
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-bd bg-sidebar">
      <div className="px-5 py-5 border-b border-bd">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">W</div>
          <span className="text-sm font-semibold tracking-tight text-t1">Web Video Studio</span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                active
                  ? "bg-indigo-500/15 text-t1 font-medium"
                  : "text-t1 hover:bg-surface2"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
              {active && <span className="ml-auto w-1 h-4 rounded-full bg-indigo-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Desktop app download banner */}
      <div className="border-t border-bd px-3 py-2">
        <a
          href="/download"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-indigo-500/10 to-violet-600/10 border border-indigo-500/20 hover:border-indigo-500/40 hover:from-indigo-500/15 hover:to-violet-600/15 transition-all group"
        >
          <span className="text-sm shrink-0">💻</span>
          <span className="text-t1 flex-1">下载桌面客户端</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 font-semibold group-hover:bg-indigo-500/30 transition-colors">
            macOS
          </span>
        </a>
      </div>

      {/* User avatar + account link */}
      <div className="border-t border-bd">
        {user && (
          <Link
            href="/account"
            className={`flex items-center gap-3 px-3 py-3 mx-2 rounded-xl transition-colors cursor-pointer ${
              pathname.startsWith("/account")
                ? "bg-indigo-500/10 text-t1"
                : "text-t1 hover:bg-surface2"
            }`}
          >
            <UserAvatar user={user} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-[11px] text-tmuted">
                {PLAN_LABELS[user.planCode] ?? user.planCode}
              </div>
            </div>
            {pathname.startsWith("/account") && (
              <span className="w-1 h-4 rounded-full bg-indigo-400" />
            )}
          </Link>
        )}
        <div className="px-3 pb-4">
          <button
            onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => router.push("/login"))}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-t1 hover:bg-surface2 transition-colors"
          >
            <span className="text-base">→</span>
            <span>退出</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
