"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const nextUrl = (rawNext && rawNext.startsWith("/")) ? rawNext : "/studio";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const doLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "登录失败"); setLoading(false); return; }
      router.replace(nextUrl);
      router.refresh();
    } catch (e: any) {
      setError(e.message || "网络错误，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-t1">Web Video Studio</h1>
          <p className="text-sm text-t2 mt-1">登录你的账号</p>
        </div>

        <div className="bg-modal rounded-2xl border border-bd shadow-sm p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-t2 mb-1.5">邮箱</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") doLogin(); }}
              className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-accent transition-all"
              placeholder="a@a.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-t2 mb-1.5">密码</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") doLogin(); }}
              className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-accent transition-all"
              placeholder="123456"
            />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={doLogin}
            className="w-full rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ background: 'rgba(255,255,255,0.92)', color: '#0a0a0c', cursor: 'pointer' }}
          >
            {loading ? "登录中…" : "登录"}
          </button>
        </div>

        <p className="text-center text-sm text-t2 mt-4">
          还没有账号？{" "}
          <Link href="/register" className="text-accent font-medium hover:underline">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
