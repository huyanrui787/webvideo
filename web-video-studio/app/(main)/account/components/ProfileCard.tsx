"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";
import type { AccountUser } from "../page";

interface Props {
  user: AccountUser;
  onUpdate: () => void;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

export function ProfileCard({ user, onUpdate }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        setEditing(false);
        onUpdate();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  return (
    <>
      <div className="rounded-xl border border-bd p-6 space-y-5">
        <div className="flex items-start gap-5">
          <UserAvatar user={user} size="xl" />
          <div className="flex-1 min-w-0 space-y-2">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-bd bg-surface text-sm"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm disabled:opacity-50"
                >
                  保存
                </button>
                <button
                  onClick={() => { setName(user.name); setEditing(false); }}
                  className="px-3 py-1.5 rounded-lg bg-surface2 text-sm"
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{user.name}</h2>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-tmuted hover:text-t1"
                >
                  ✎
                </button>
              </div>
            )}
            <div className="text-sm text-t2">{user.email}</div>
            <div className="text-xs text-tmuted">
              注册于 {new Date(user.createdAt * 1000).toLocaleDateString("zh-CN", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {PLAN_LABELS[user.planCode] ?? user.planCode}
              </span>
              <span className="text-sm text-t2">
                {user.credits.toLocaleString()} 积分
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-bd">
          <button
            onClick={() => router.push("/billing")}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium"
          >
            管理套餐
          </button>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 rounded-lg bg-surface2 text-sm"
          >
            修改密码
          </button>
        </div>
      </div>

      {/* Password modal */}
      {showPasswordModal && (
        <PasswordModal
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </>
  );
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!oldPw || !newPw) { setError("请填写所有字段"); return; }
    if (newPw.length < 8) { setError("新密码至少 8 位"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(onClose, 1500);
      } else {
        setError(data.error ?? "修改失败");
      }
    } catch { setError("请求失败"); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-base rounded-xl border border-bd p-6 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">修改密码</h3>
        {success ? (
          <div className="text-green-500 text-sm">密码已修改成功！</div>
        ) : (
          <>
            <input
              type="password" placeholder="旧密码" value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-bd bg-surface text-sm"
            />
            <input
              type="password" placeholder="新密码（至少 8 位）" value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-bd bg-surface text-sm"
            />
            {error && <div className="text-red-400 text-xs">{error}</div>}
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-2 rounded-lg bg-accent text-white text-sm disabled:opacity-50"
              >
                确认修改
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg bg-surface2 text-sm"
              >
                取消
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
