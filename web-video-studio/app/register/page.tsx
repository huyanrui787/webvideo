"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "注册失败"); return; }
      router.replace("/studio");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-t1">Web Video Studio</h1>
          <p className="text-sm text-t2 mt-1">创建你的账号</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-modal rounded-2xl border border-bd shadow-sm p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-t2 mb-1.5">姓名</label>
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-accent transition-all"
              placeholder="你的名字"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-t2 mb-1.5">邮箱</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-accent transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-t2 mb-1.5">密码</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-accent transition-all"
              placeholder="至少 8 位"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent hover:bg-accent-hover py-2.5 text-sm font-medium text-accent-text disabled:opacity-50 transition-colors"
          >
            {loading ? "注册中…" : "注册"}
          </button>
        </form>

        <p className="text-center text-sm text-t2 mt-4">
          已有账号？{" "}
          <Link href="/login" className="text-accent font-medium hover:underline">
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
