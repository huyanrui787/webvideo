"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserAvatar } from "./user-avatar";

/* ── SVG Icons (18px, stroke-width 1.5) ─────────────────────────────── */

const Icons = {
  home: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 8l6-5.5 6 5.5"/><path d="M4.5 6.5v8a1 1 0 001 1h7a1 1 0 001-1v-8"/></svg>,
  projects: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="5.5" height="5.5" rx="1"/><rect x="10.5" y="2" width="5.5" height="5.5" rx="1"/><rect x="2" y="10.5" width="5.5" height="5.5" rx="1"/><rect x="10.5" y="10.5" width="5.5" height="5.5" rx="1"/></svg>,
  draw: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 15.5H3.5a1 1 0 01-1-1v-11a1 1 0 011-1h6l2.5 2.5v3"/><path d="M10.5 12.5l4 4"/><circle cx="12" cy="10.5" r="2.5"/></svg>,
  batches: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="1.5" width="15" height="15" rx="2"/><rect x="4" y="4" width="10" height="10" rx="1"/><rect x="7" y="7" width="4" height="4" rx="0.6"/></svg>,
  scheduled: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="7.5"/><polyline points="9,5 9,9 12,11"/></svg>,
  library: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2.5" width="14" height="11" rx="1.5"/><circle cx="5.5" cy="6" r="1.2"/><path d="M2 12l3.5-3.5 2 2 3-2.5 3.5 3.5"/></svg>,
  showcase: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="7,2.5 14,9 7,15.5"/></svg>,
  blocks: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1" width="7" height="7" rx="1.5"/><rect x="10" y="1" width="7" height="7" rx="1.5"/><rect x="1" y="10" width="7" height="7" rx="1.5"/><rect x="10" y="10" width="7" height="7" rx="1.5"/></svg>,
  billing: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="4" width="15" height="10.5" rx="1.5"/><line x1="1.5" y1="7.5" x2="16.5" y2="7.5"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="2.5"/><path d="M9 1.5v1.5M9 15v1.5M3.7 3.7l1 1M13.3 13.3l1 1M1.5 9h1.5M15 9h1.5M3.7 14.3l1-1M13.3 4.7l1-1"/></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 15.5H3.5a1 1 0 01-1-1v-11a1 1 0 011-1H7"/><polyline points="11,5.5 15,9 11,12.5"/><line x1="15" y1="9" x2="7" y2="9"/></svg>,
  download: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v9"/><polyline points="5,8 8,11 11,8"/><path d="M2.5 12.5v1a1 1 0 001 1h9a1 1 0 001-1v-1"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="3,4.5 6,7.5 9,4.5"/></svg>,
};

/* ── Nav items ──────────────────────────────────────────────────────── */

const NAV_GROUPS = [
  {
    items: [
      { href: "/studio", label: "首页", icon: Icons.home },
      { href: "/projects", label: "项目", icon: Icons.projects },
    ],
  },
  {
    items: [
      { href: "/batches", label: "批量任务", icon: Icons.batches },
      { href: "/scheduled-tasks", label: "定时任务", icon: Icons.scheduled },
    ],
  },
  {
    items: [
      { href: "/library", label: "素材库", icon: Icons.library },
      { href: "/showcase/primitives", label: "视觉积木", icon: Icons.blocks },
    ],
  },
  {
    items: [
      { href: "/billing", label: "服务与订阅", icon: Icons.billing },
      { href: "/settings", label: "设置", icon: Icons.settings },
    ],
  },
];

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

const PLAN_DOT: Record<string, string> = {
  free: "bg-t4",
  starter: "bg-blue-400",
  pro: "bg-amber-400",
  enterprise: "bg-amber-400",
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
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobile() { setMobileOpen(false); }

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

  const sidebarContent = (
    <aside className="w-56 shrink-0 flex flex-col border-r border-bd bg-sidebar h-full">
      {/* ── Logo ── */}
      <div className="px-4 py-4 border-b border-bd">
        <Link href="/studio" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="7,1 13,4 13,10 7,13 1,10 1,4"/>
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-t1">Web Video Studio</span>
        </Link>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-4 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-brand/10 text-t1 font-medium"
                      : "text-t2 hover:text-t1 hover:bg-surface2"
                  }`}
                >
                  <span className={`shrink-0 ${active ? "text-brand-text" : "text-t3"}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Bottom area ── */}
      <div className="border-t border-bd">
        {/* Download banner */}
        <div className="px-3 pt-3 pb-2">
          <a
            href="/download"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs bg-surface2 border border-bd hover:border-bd-strong transition-colors group"
          >
            <span className="shrink-0 text-t3">{Icons.download}</span>
            <span className="text-t2 flex-1 group-hover:text-t1 transition-colors">下载桌面客户端</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-brand/10 text-brand-text">
              macOS
            </span>
          </a>
        </div>

        {/* User section */}
        {user && (
          <div className="px-3 pb-1">
            <Link
              href="/account"
              onClick={closeMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                pathname.startsWith("/account")
                  ? "bg-brand/10 text-t1"
                  : "hover:bg-surface2"
              }`}
            >
              <UserAvatar user={user} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-t1 truncate">{user.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${PLAN_DOT[user.planCode] ?? "bg-t4"}`} />
                  <span className="text-[11px] text-t3">
                    {PLAN_LABELS[user.planCode] ?? user.planCode}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Logout */}
        <div className="px-3 pb-3">
          <button
            onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => router.push("/login"))}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-t3 hover:text-t1 hover:bg-surface2 transition-colors"
          >
            <span>{Icons.logout}</span>
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Hamburger toggle — visible only on mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-xl bg-modal border border-bd flex items-center justify-center text-t2 hover:text-t1 hover:bg-surface2 transition-colors shadow-sm"
        aria-label="打开菜单"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      {/* Desktop: always visible */}
      <div className="hidden lg:flex h-full">{sidebarContent}</div>

      {/* Mobile: overlay drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-overlay transition-opacity"
            onClick={closeMobile}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 flex animate-fade-in-up">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
