"use client";

import { useState } from "react";

export function DangerZoneCard() {
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    window.location.href = "/login";
  };

  return (
    <div className="rounded-xl border border-red-500/20 bg-modal p-6 space-y-4">
      <h3 className="text-sm font-semibold text-red-400">危险操作</h3>

      {!showDelete ? (
        <button onClick={() => setShowDelete(true)}
          className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors">删除账号</button>
      ) : (
        <div className="space-y-3 p-4 rounded-lg border border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">此操作不可撤销。将永久删除你的账号、所有项目、资产和数据。</p>
          <p className="text-xs text-t3">请输入 DELETE 确认：</p>
          <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE"
            className="w-full px-3 py-2 rounded-lg border border-bd bg-surface text-sm text-t1 font-mono outline-none focus:border-red-500/50" />
          <div className="flex gap-2">
            <button onClick={handleDelete} disabled={confirmText !== "DELETE" || deleting}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium disabled:opacity-30 transition-colors">确认删除</button>
            <button onClick={() => { setShowDelete(false); setConfirmText(""); }}
              className="px-4 py-2 rounded-lg bg-surface2 text-sm text-t2 hover:text-t1 transition-colors">取消</button>
          </div>
        </div>
      )}
    </div>
  );
}
