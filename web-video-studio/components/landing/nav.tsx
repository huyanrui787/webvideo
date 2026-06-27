"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Sticky navigation bar for the landing page.
 * Transitions from transparent to solid background on scroll.
 */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-base/95 backdrop-blur-xl border-b border-bd shadow-lg shadow-black/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-sm font-bold text-white">
            W
          </div>
          <span className="text-sm font-semibold tracking-tight text-t1">
            Web Video Studio
          </span>
        </Link>

        {/* Right links */}
        <div className="flex items-center gap-3">
          <Link
            href="/download"
            className="flex items-center gap-1.5 text-sm text-t2 hover:text-t1 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
              <path d="M12 2v10M8 8l4-4 4 4"/>
              <rect x="3" y="12" width="18" height="8" rx="2"/>
              <path d="M8 17h8"/>
            </svg>
            <span className="hidden sm:inline">下载客户端</span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-t2 hover:text-t1 transition-colors"
          >
            登录
          </Link>
          <Link
            href="/register"
            className="text-sm px-4 py-2 rounded-xl bg-brand text-white font-medium hover:bg-brand-hover transition-colors"
          >
            免费注册
          </Link>
        </div>
      </div>
    </header>
  );
}
