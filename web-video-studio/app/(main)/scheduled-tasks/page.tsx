"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { ScheduledTask } from "@/lib/db/schema";

export default function ScheduledTasksPage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/scheduled-tasks");
      if (res.ok) setTasks(await res.json());
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  async function toggleEnabled(id: string, enabled: boolean) {
    await fetch(`/api/scheduled-tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    fetchTasks();
  }

  async function handleTrigger(id: string) {
    await fetch(`/api/scheduled-tasks/${id}/trigger`, { method: "POST" });
    fetchTasks();
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/scheduled-tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  }

  function formatNextRun(ts: number | null): string {
    if (!ts) return "—";
    const d = new Date(ts * 1000);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-t1">定时任务</h1>
            <p className="text-sm text-t2 mt-1">
              设置定时规则，自动创建并执行批量视频制作
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium hover:from-indigo-400 hover:to-violet-500 transition-all"
          >
            + 新建定时任务
          </button>
        </div>

        {showCreate && (
          <CreateScheduledTaskModal
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              fetchTasks();
            }}
          />
        )}

        {loading ? (
          <div className="text-center text-t3 py-20">加载中…</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">◷</div>
            <p className="text-t2 mb-4">还没有定时任务</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 rounded-xl bg-surface border border-bd text-sm text-t1 hover:bg-surface2 transition-all"
            >
              创建第一个定时任务
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-bd bg-surface p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${task.enabled ? "bg-emerald-400" : "bg-zinc-500"}`}
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-t1">{task.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-t3">
                        <code className="px-1.5 py-0.5 rounded bg-surface2 text-t2">
                          {task.cron}
                        </code>
                        <span>{task.sourceType === "rss" ? "RSS" : task.sourceType === "topic_pool" ? "话题池" : "URL 监控"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTrigger(task.id)}
                      className="px-2.5 py-1 rounded-lg border border-bd text-[11px] text-t2 hover:bg-surface2 transition-all"
                    >
                      立即执行
                    </button>
                    <button
                      onClick={() => toggleEnabled(task.id, !task.enabled)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                        task.enabled
                          ? "border-bd text-t2 hover:bg-surface2"
                          : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                      }`}
                    >
                      {task.enabled ? "暂停" : "启用"}
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="px-2 py-1 text-[11px] text-red-400 hover:text-red-300"
                    >
                      删除
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-[11px] text-t3">
                  <span>上次执行：{task.lastRunAt ? formatNextRun(task.lastRunAt) : "从未"}</span>
                  <span>下次执行：{formatNextRun(task.nextRunAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Scheduled Task Modal ───────────────────────────────────────────────

function CreateScheduledTaskModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [cron, setCron] = useState("0 8 * * *");
  const [sourceType, setSourceType] = useState<string>("rss");
  const [sourceUrl, setSourceUrl] = useState("");
  const [topics, setTopics] = useState("");
  const [theme, setTheme] = useState("midnight-press");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!title.trim()) { setError("请输入任务名称"); return; }
    setSubmitting(true);
    setError("");

    try {
      const sourceConfig = sourceType === "rss"
        ? { url: sourceUrl.trim() }
        : { topics: topics.split("\n").map((s) => s.trim()).filter(Boolean) };

      const res = await fetch("/api/scheduled-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          cron,
          sourceType,
          sourceConfig,
          projectConfig: { theme, projectFormat: "video", ttsAuto: false },
        }),
      });

      if (res.ok) onCreated();
      else {
        const data = await res.json();
        setError(data.error ?? "创建失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-modal rounded-2xl border border-bd w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-t1">新建定时任务</h2>
          <button onClick={onClose} className="text-t3 hover:text-t1">✕</button>
        </div>

        <label className="block text-sm font-medium text-t1 mb-1.5">任务名称</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 outline-none focus:border-accent transition-all mb-4"
          placeholder="例如：每日 RSS 转视频"
        />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-t2 mb-1">Cron 表达式</label>
            <input
              value={cron}
              onChange={(e) => setCron(e.target.value)}
              className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2 text-sm text-t1 outline-none font-mono"
            />
            <div className="text-[10px] text-t3 mt-1">
              {cron === "0 8 * * *" && "每天 8:00"}
              {cron === "0 */6 * * *" && "每 6 小时"}
              {cron === "0 0 * * 1" && "每周一 0:00"}
            </div>
          </div>
          <div>
            <label className="block text-xs text-t2 mb-1">主题</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2 text-sm text-t1 outline-none"
            >
              <option value="midnight-press">暗夜极简</option>
              <option value="warm-white">暖白写实</option>
            </select>
          </div>
        </div>

        <label className="block text-sm font-medium text-t1 mb-2">来源类型</label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {([
            ["rss", "RSS 订阅"],
            ["topic_pool", "话题池"],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setSourceType(val)}
              className={`p-3 rounded-xl border text-sm text-left transition-all ${
                sourceType === val
                  ? "border-indigo-500/50 bg-indigo-500/10 text-t1"
                  : "border-bd text-t2 hover:bg-surface"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {sourceType === "rss" ? (
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 outline-none focus:border-accent transition-all mb-4"
            placeholder="https://example.com/rss"
          />
        ) : (
          <textarea
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 outline-none focus:border-accent transition-all resize-none mb-4"
            placeholder="每行一个话题或关键词"
          />
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-t2 hover:text-t1">取消</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium disabled:opacity-50 transition-all"
          >
            {submitting ? "创建中…" : "创建"}
          </button>
        </div>
      </div>
    </div>
  );
}
