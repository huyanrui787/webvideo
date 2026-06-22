"use client";

import { useState } from "react";

export function DangerZoneCard() {
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch { /* ignore */ }
    window.location.href = "/login";
  };

  return (
    <div className="rounded-xl border border-red-500/30 p-6 space-y-4">
      <h3 className="font-semibold text-red-400">危险操作</h3>

      {!showDelete ? (
        <button
          onClick={() => setShowDelete(true)}
          className="px-4 py-2 rounded-lg border border-red-500/50 text-red-400 text-sm hover:bg-red-500/10"
        >
          删除账号
        </button>
      ) : (
        <div className="space-y-3 p-4 rounded-lg border border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-400">
            此操作不可撤销。将永久删除你的账号、所有项目、资产和数据。
          </p>
          <p className="text-xs text-tmuted">
            请输入 DELETE 确认：
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full px-3 py-2 rounded-lg border border-bd bg-surface text-sm font-mono"
          />
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={confirmText !== "DELETE" || deleting}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm disabled:opacity-30"
            >
              确认删除
            </button>
            <button
              onClick={() => { setShowDelete(false); setConfirmText(""); }}
              className="px-4 py-2 rounded-lg bg-surface2 text-sm"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
