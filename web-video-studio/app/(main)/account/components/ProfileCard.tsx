"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";
import type { AccountUser } from "../page";

interface Props { user: AccountUser; onUpdate: () => void; }

const PLAN_META: Record<string, { label: string; dot: string }> = {
  free: { label: "Free", dot: "bg-t4" },
  starter: { label: "Starter", dot: "bg-blue-400" },
  pro: { label: "Pro", dot: "bg-amber-400" },
  enterprise: { label: "Enterprise", dot: "bg-amber-400" },
};

export function ProfileCard({ user, onUpdate }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const meta = PLAN_META[user.planCode] ?? PLAN_META.free;

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
      if (res.ok) { setEditing(false); onUpdate(); }
    } catch {}
    setSaving(false);
  };

  return (
    <>
      <div className="rounded-xl border border-bd bg-modal p-6 space-y-5">
        <div className="flex items-start gap-5">
          <UserAvatar user={user} size="xl" />
          <div className="flex-1 min-w-0 space-y-2">
            {editing ? (
              <div className="flex items-center gap-2">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-bd bg-surface text-sm text-t1 outline-none focus:border-brand/50" autoFocus />
                <button onClick={handleSaveName} disabled={saving}
                  className="px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium disabled:opacity-40 transition-colors">保存</button>
                <button onClick={() => { setName(user.name); setEditing(false); }}
                  className="px-3 py-1.5 rounded-lg bg-surface2 text-sm text-t2 hover:text-t1 transition-colors">取消</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-t1">{user.name}</h2>
                <button onClick={() => setEditing(true)}
                  className="text-t4 hover:text-brand-text transition-colors" title="编辑姓名">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2l2.5 2.5-7 7L1 12l.5-3.5z"/></svg>
                </button>
              </div>
            )}
            <div className="text-sm text-t2">{user.email}</div>
            <div className="text-xs text-t3">
              注册于 {new Date(user.createdAt * 1000).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface2 text-t2">
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
              <span className="text-sm text-t2">{user.credits.toLocaleString()} 积分</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-bd">
          <button onClick={() => router.push("/billing")}
            className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-colors">管理套餐</button>
          <button onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 rounded-lg bg-surface2 text-sm text-t2 hover:text-t1 hover:bg-surface transition-colors">修改密码</button>
        </div>
      </div>

      {showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} />}
    </>
  );
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const [oldPw, setOldPw] = useState(""); const [newPw, setNewPw] = useState("");
  const [error, setError] = useState(""); const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!oldPw || !newPw) { setError("请填写所有字段"); return; }
    if (newPw.length < 8) { setError("新密码至少 8 位"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }) });
      const data = await res.json();
      if (res.ok) { setSuccess(true); setTimeout(onClose, 1500); }
      else setError(data.error ?? "修改失败");
    } catch { setError("请求失败"); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay" onClick={onClose}>
      <div className="bg-modal rounded-xl border border-bd p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-t1">修改密码</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-t3 hover:text-t1 hover:bg-surface2 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>
          </button>
        </div>
        {success ? (
          <div className="text-green-400 text-sm">密码已修改成功！</div>
        ) : (
          <>
            <input type="password" placeholder="旧密码" value={oldPw} onChange={(e) => setOldPw(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input-bd bg-input-bg text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-brand/50" />
            <input type="password" placeholder="新密码（至少 8 位）" value={newPw} onChange={(e) => setNewPw(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input-bd bg-input-bg text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-brand/50" />
            {error && <div className="text-red-400 text-xs">{error}</div>}
            <div className="flex gap-2">
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium disabled:opacity-40 transition-colors">确认修改</button>
              <button onClick={onClose}
                className="flex-1 py-2 rounded-lg bg-surface2 text-sm text-t2 hover:text-t1 transition-colors">取消</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
