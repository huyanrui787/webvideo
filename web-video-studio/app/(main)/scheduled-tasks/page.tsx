"use client";

import { useEffect, useState, useCallback } from "react";
import type { ScheduledTask } from "@/lib/db/schema";

/* ── SVG icons ─────────────────────────────────────────────────────── */

const IconClock = <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="8.5"/><polyline points="10,5.5 10,10 13.5,12"/></svg>;
const IconCheck = <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="2.5,7 5.5,10 11.5,4"/></svg>;
const IconPlay = <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" stroke="none"><polygon points="3,2 11,6.5 3,11"/></svg>;
const IconPause = <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" stroke="none"><rect x="2" y="2" width="3" height="9" rx="0.5"/><rect x="8" y="2" width="3" height="9" rx="0.5"/></svg>;
const IconRss = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 10.5a3 3 0 013 3"/><path d="M2.5 5.5a8 8 0 018 8"/><circle cx="3.5" cy="12.5" r="1" fill="currentColor" stroke="none"/></svg>;
const IconTopic = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="2"/><path d="M8 1.5V3M8 13v1.5M3.4 3.4l1 1M11.6 11.6l1 1M1.5 8H3M13 8h1.5M3.4 12.6l1-1M11.6 4.4l1-1"/></svg>;
const IconUrl = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 3.5h-2a2 2 0 100 4h2"/><path d="M9.5 12.5h2a2 2 0 100-4h-2"/><line x1="5.5" y1="8" x2="10.5" y2="8"/></svg>;

const SOURCE_META: Record<string, { label: string; icon: React.ReactNode }> = {
  rss: { label: "RSS 订阅", icon: IconRss },
  topic_pool: { label: "话题池", icon: IconTopic },
  url_list: { label: "URL 监控", icon: IconUrl },
};

function formatNextRun(ts: number | null): string {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  const now = new Date();
  const diffMin = Math.round((d.getTime() - now.getTime()) / 60000);
  if (diffMin < 1) return "即将执行";
  if (diffMin < 60) return `${diffMin} 分钟后`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)} 小时后`;
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function describeCron(cron: string): string {
  const m: Record<string, string> = {
    "0 8 * * *": "每天 8:00",
    "0 */6 * * *": "每 6 小时",
    "0 0 * * 1": "每周一 0:00",
    "0 9 * * 1-5": "工作日 9:00",
    "0 0 1 * *": "每月 1 日",
  };
  return m[cron] ?? cron;
}

export default function ScheduledTasksPage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/scheduled-tasks");
      if (res.ok) setTasks(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  async function toggleEnabled(id: string, enabled: boolean) {
    await fetch(`/api/scheduled-tasks/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
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

  /* ── Loading ──────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-5 h-5 border-2 border-brand-text border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Empty state ──────────────────────────────────────────────────── */
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6">
        <div className="w-16 h-16 rounded-2xl bg-surface2 flex items-center justify-center mb-5">
          {IconClock}
        </div>
        <h2 className="text-sm font-semibold text-t1 mb-2">还没有定时任务</h2>
        <p className="text-xs text-t3 mb-6 text-center max-w-xs leading-relaxed">
          设置定时规则，自动从 RSS 源或话题池获取内容，定期批量生成视频
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
        >
          创建第一个定时任务
        </button>
        {showCreate && (
          <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchTasks(); }} />
        )}
      </div>
    );
  }

  /* ── Main content ─────────────────────────────────────────────────── */
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-t1">定时任务</h1>
            <p className="text-xs text-t3 mt-0.5">{tasks.length} 个任务 · {tasks.filter(t => t.enabled).length} 个启用</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
          >
            新建定时任务
          </button>
        </div>

        {showCreate && (
          <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchTasks(); }} />
        )}

        {/* Task list */}
        <div className="space-y-2">
          {tasks.map((task) => {
            const meta = SOURCE_META[task.sourceType] ?? SOURCE_META.rss;
            const enabled = task.enabled;
            return (
              <div
                key={task.id}
                className={`rounded-xl border p-4 transition-colors ${enabled ? "border-bd bg-modal hover:border-bd-hover" : "border-bd bg-surface2 opacity-60"}`}
              >
                <div className="flex items-center gap-4">
                  {/* Status dot */}
                  <span className={`w-2 h-2 rounded-full shrink-0 ${enabled ? "bg-green-400" : "bg-t4"}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-t1 truncate">{task.title}</h3>
                      {!enabled && <span className="text-[10px] text-t4 font-medium">已暂停</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <code className="text-[11px] px-1.5 py-0.5 rounded bg-surface2 text-t2 font-mono">
                        {describeCron(task.cron)}
                      </code>
                      <span className="text-[11px] text-t3 flex items-center gap-1">
                        {meta.icon}
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-t4">
                      <span>上次：{task.lastRunAt ? formatNextRun(task.lastRunAt) : "从未执行"}</span>
                      <span>下次：{formatNextRun(task.nextRunAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleTrigger(task.id)}
                      className="h-7 px-2.5 rounded-lg border border-bd text-[11px] text-t2 hover:text-t1 hover:bg-surface2 transition-colors flex items-center gap-1"
                      title="立即执行"
                    >
                      {IconPlay}
                      <span className="hidden sm:inline">执行</span>
                    </button>
                    <button
                      onClick={() => toggleEnabled(task.id, !enabled)}
                      className={`h-7 px-2.5 rounded-lg border text-[11px] transition-colors flex items-center gap-1 ${
                        enabled
                          ? "border-bd text-t3 hover:text-t1 hover:bg-surface2"
                          : "border-green-400/30 text-green-400 hover:bg-green-400/10"
                      }`}
                      title={enabled ? "暂停" : "启用"}
                    >
                      {enabled ? IconPause : IconCheck}
                      <span className="hidden sm:inline">{enabled ? "暂停" : "启用"}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="h-7 px-2 rounded-lg text-[11px] text-t4 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title="删除"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M11 4v7a1 1 0 01-1 1H4a1 1 0 01-1-1V4"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Create Modal ────────────────────────────────────────────────────

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
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
    setSubmitting(true); setError("");
    try {
      const sourceConfig = sourceType === "rss"
        ? { url: sourceUrl.trim() }
        : { topics: topics.split("\n").map((s) => s.trim()).filter(Boolean) };
      const res = await fetch("/api/scheduled-tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), cron, sourceType, sourceConfig,
          projectConfig: { theme, projectFormat: "video", ttsAuto: false },
        }),
      });
      if (res.ok) onCreated();
      else { const data = await res.json(); setError(data.error ?? "创建失败"); }
    } catch { setError("网络错误"); }
    finally { setSubmitting(false); }
  }

  const cronPresets = [
    { value: "0 8 * * *", label: "每天 8:00" },
    { value: "0 */6 * * *", label: "每 6 小时" },
    { value: "0 0 * * 1", label: "每周一" },
    { value: "0 9 * * 1-5", label: "工作日 9:00" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay" onClick={onClose}>
      <div className="bg-modal rounded-2xl border border-bd w-full max-w-lg p-6 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-t1">新建定时任务</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-t3 hover:text-t1 hover:bg-surface2 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>
          </button>
        </div>

        <label className="block text-xs font-medium text-t2 mb-1.5">任务名称</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 outline-none focus:border-brand/50 mb-4"
          placeholder="例如：每日 RSS 转视频" />

        <label className="block text-xs font-medium text-t2 mb-1.5">执行频率</label>
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {cronPresets.map((p) => (
            <button key={p.value} onClick={() => setCron(p.value)}
              className={`px-2 py-1.5 rounded-lg text-[11px] transition-colors ${cron === p.value ? "bg-brand/10 text-brand-text font-medium" : "border border-bd text-t2 hover:bg-surface2"}`}>
              {p.label}
            </button>
          ))}
        </div>
        <input value={cron} onChange={(e) => setCron(e.target.value)}
          className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2 text-xs text-t1 outline-none focus:border-brand/50 font-mono mb-4"
          placeholder="自定义 cron 表达式" />

        <label className="block text-xs font-medium text-t2 mb-2">来源类型</label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(["rss","topic_pool"] as const).map((val) => {
            const meta = SOURCE_META[val];
            return (
              <button key={val} onClick={() => setSourceType(val)}
                className={`p-3 rounded-xl border text-sm text-left transition-colors flex items-center gap-2 ${
                  sourceType === val ? "border-brand/50 bg-brand/10 text-t1" : "border-bd text-t2 hover:bg-surface"
                }`}>
                <span className="text-t3">{meta.icon}</span>
                {meta.label}
              </button>
            );
          })}
        </div>

        {sourceType === "rss" ? (
          <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
            className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 outline-none focus:border-brand/50 mb-4"
            placeholder="https://example.com/rss" />
        ) : (
          <textarea value={topics} onChange={(e) => setTopics(e.target.value)} rows={4}
            className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 outline-none focus:border-brand/50 resize-none mb-4"
            placeholder="每行一个话题或关键词" />
        )}

        <label className="block text-xs font-medium text-t2 mb-1.5">主题</label>
        <select value={theme} onChange={(e) => setTheme(e.target.value)}
          className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2 text-sm text-t1 outline-none mb-4">
          <option value="midnight-press">暗夜极简</option>
          <option value="warm-white">暖白写实</option>
        </select>

        {error && (
          <div className="mb-4 rounded-lg bg-red-400/10 border border-red-400/20 px-3 py-2 text-sm text-red-400">{error}</div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-t2 hover:text-t1 hover:bg-surface2 transition-colors">取消</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-40 transition-colors">
            {submitting ? "创建中…" : "创建"}
          </button>
        </div>
      </div>
    </div>
  );
}
