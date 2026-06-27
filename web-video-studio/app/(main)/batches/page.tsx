"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Batch, BatchSourceType, BatchStatus } from "@/lib/db/schema";

const STATUS_LABELS: Record<BatchStatus, string> = {
  pending: "等待中", running: "运行中", done: "已完成", partial: "部分完成", cancelled: "已取消",
};

const STATUS_STYLE: Record<BatchStatus, string> = {
  pending: "bg-blue-400/10 text-blue-400",
  running: "bg-brand-subtle text-brand-text",
  done: "bg-green-400/10 text-green-400",
  partial: "bg-brand-subtle text-brand-text",
  cancelled: "bg-surface2 text-t3",
};

const SOURCE_LABELS: Record<BatchSourceType, string> = {
  url_list: "URL 列表", topic_list: "话题列表", rss: "RSS 订阅", csv_upload: "CSV 上传",
};

const SOURCE_ICONS: Record<BatchSourceType, string> = {
  url_list: "🔗", topic_list: "💡", rss: "📡", csv_upload: "📄",
};

/* ── SVG icons ─────────────────────────────────────────────────────── */

const IconBatch = <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="7" height="7" rx="1.2"/><rect x="11" y="2" width="7" height="7" rx="1.2"/><rect x="2" y="11" width="7" height="7" rx="1.2"/><rect x="11" y="11" width="7" height="7" rx="1.2"/></svg>;
const IconUrl = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 3.5h-2a2 2 0 100 4h2"/><path d="M9.5 12.5h2a2 2 0 100-4h-2"/><line x1="5.5" y1="8" x2="10.5" y2="8"/></svg>;
const IconTopic = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="2"/><path d="M8 1.5V3M8 13v1.5M3.4 3.4l1 1M11.6 11.6l1 1M1.5 8H3M13 8h1.5M3.4 12.6l1-1M11.6 4.4l1-1"/></svg>;
const IconRss = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 10.5a3 3 0 013 3"/><path d="M2.5 5.5a8 8 0 018 8"/><circle cx="3.5" cy="12.5" r="1" fill="currentColor" stroke="none"/></svg>;
const IconCsv = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="1.5" width="12" height="13" rx="1.5"/><line x1="5" y1="5" x2="11" y2="5"/><line x1="5" y1="8" x2="11" y2="8"/><line x1="5" y1="11" x2="9" y2="11"/></svg>;
const SOURCE_SVG: Record<BatchSourceType, React.ReactNode> = {
  url_list: IconUrl, topic_list: IconTopic, rss: IconRss, csv_upload: IconCsv,
};

export default function BatchesPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch("/api/batches");
      if (res.ok) setBatches(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  useEffect(() => {
    const hasRunning = batches.some((b) => b.status === "running");
    if (!hasRunning) return;
    const t = setInterval(fetchBatches, 5000);
    return () => clearInterval(t);
  }, [batches, fetchBatches]);

  /* ── Loading ──────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-5 h-5 border-2 border-brand-text border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Empty state ──────────────────────────────────────────────────── */
  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6">
        <div className="w-16 h-16 rounded-2xl bg-surface2 flex items-center justify-center mb-5">
          {IconBatch}
        </div>
        <h2 className="text-sm font-semibold text-t1 mb-2">还没有批量任务</h2>
        <p className="text-xs text-t3 mb-6 text-center max-w-xs leading-relaxed">
          批量任务可以一次性处理多个内容源——粘贴 URL 列表、输入话题清单、订阅 RSS 源、或上传 CSV 文件。AI 会逐个生成视频，完成后统一查看。
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
        >
          创建第一个批次
        </button>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {([
            { label: "URL 列表", desc: "粘贴多个链接", svg: IconUrl },
            { label: "话题清单", desc: "输入话题列表", svg: IconTopic },
            { label: "RSS 订阅", desc: "订阅内容源", svg: IconRss },
            { label: "CSV 上传", desc: "表格批量导入", svg: IconCsv },
          ]).map((s) => (
            <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-bd text-xs text-t2">
              <span className="text-t3">{s.svg}</span>
              <span className="font-medium text-t1">{s.label}</span>
              <span className="hidden sm:inline text-t3">{s.desc}</span>
            </div>
          ))}
        </div>
        {showCreate && (
          <CreateBatchModal
            onClose={() => setShowCreate(false)}
            onCreated={(id) => { setShowCreate(false); fetchBatches(); router.push(`/batches/${id}`); }}
          />
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
            <h1 className="text-lg font-semibold text-t1">批量任务</h1>
            <p className="text-xs text-t3 mt-0.5">{batches.length} 个批次</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
          >
            新建批次
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <CreateBatchModal
            onClose={() => setShowCreate(false)}
            onCreated={(id) => {
              setShowCreate(false);
              fetchBatches();
              router.push(`/batches/${id}`);
            }}
          />
        )}

        {/* Batch list */}
        <div className="space-y-2">
          {batches.map((batch) => {
            const progress = batch.total > 0 ? Math.round((batch.done / batch.total) * 100) : 0;
            const isActive = batch.status === "running";
            const isDone = batch.status === "done";
            const isPartial = batch.status === "partial";
            return (
              <Link
                key={batch.id}
                href={`/batches/${batch.id}`}
                className="group block rounded-xl border border-bd bg-modal hover:border-bd-hover transition-all p-4"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? "bg-blue-400/10 text-blue-400" : isDone ? "bg-green-400/10 text-green-400" : isPartial ? "bg-brand-subtle text-brand-text" : "bg-surface2 text-t3"
                  }`}>
                    {IconBatch}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-t1 truncate group-hover:text-brand-text transition-colors">
                      {batch.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[batch.status]}`}>
                        {STATUS_LABELS[batch.status]}
                      </span>
                      <span className="text-[11px] text-t3 flex items-center gap-1">
                        <span className="text-t4">{SOURCE_SVG[batch.sourceType]}</span>
                        {SOURCE_LABELS[batch.sourceType]}
                      </span>
                      {batch.total > 0 && (
                        <span className="text-[11px] text-t4">
                          {batch.done}/{batch.total}
                        </span>
                      )}
                    </div>

                    {/* Progress bar — only for running */}
                    {isActive && (
                      <div className="mt-2">
                        <div className="h-1.5 rounded-full bg-surface2 overflow-hidden">
                          <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-t4">
                          <span>{progress}%</span>
                        </div>
                      </div>
                    )}

                    {/* Done/partial summary */}
                    {(isDone || isPartial) && batch.total > 0 && (
                      <p className="mt-1 text-[11px] text-t3">
                        {batch.done} 个完成{batch.failed > 0 && ` · ${batch.failed} 个失败`}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-t4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><polyline points="6,3 11,8 6,13"/></svg>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Create Batch Modal ──────────────────────────────────────────────

function CreateBatchModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [sourceType, setSourceType] = useState<BatchSourceType>("url_list");
  const [items, setItems] = useState("");
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("midnight-press");
  const [projectFormat, setProjectFormat] = useState<string>("video");
  const [ttsAuto, setTtsAuto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const itemList = items.split("\n").map((s) => s.trim()).filter(Boolean);
    if (itemList.length === 0) { setError("请输入至少一个链接或话题"); return; }
    if (!title.trim()) { setError("请输入批次名称"); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/batches", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), sourceType,
          sourceConfig: sourceType === "url_list" || sourceType === "rss" ? { urls: itemList } : { topics: itemList },
          projectConfig: { theme, projectFormat, ttsAuto },
          items: itemList,
        }),
      });
      if (res.ok) { const data = await res.json(); onCreated(data.id); }
      else { const data = await res.json(); setError(data.error ?? "创建失败"); }
    } catch { setError("网络错误"); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay">
      <div className="bg-modal rounded-2xl border border-bd w-full max-w-lg p-6 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-t1">新建批次</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-t3 hover:text-t1 hover:bg-surface2 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>
          </button>
        </div>

        {step === 1 ? (
          <>
            {/* Step 1: source type + content */}
            <label className="block text-xs font-medium text-t2 mb-2">输入方式</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(["url_list","topic_list"] as const).map((val) => (
                <button key={val} onClick={() => setSourceType(val)}
                  className={`p-3 rounded-xl border text-sm text-left transition-colors ${
                    sourceType === val ? "border-brand/50 bg-brand/10 text-t1" : "border-bd text-t2 hover:bg-surface"
                  }`}>
                  <span className="text-t3 mr-2">{SOURCE_SVG[val]}</span>
                  {val === "url_list" ? "URL 列表" : "话题列表"}
                </button>
              ))}
            </div>

            <label className="block text-xs font-medium text-t2 mb-1.5">
              {sourceType === "url_list" ? "文章链接（每行一个）" : "话题/关键词（每行一个）"}
            </label>
            <textarea value={items} onChange={(e) => setItems(e.target.value)} rows={8}
              className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-brand/50 resize-none mb-4"
              placeholder={sourceType === "url_list"
                ? "https://mp.weixin.qq.com/s/...\nhttps://example.com/blog/..."
                : "AI 如何改变教育\n量子计算入门\n气候变化的五个事实"} />

            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-t2 hover:text-t1 hover:bg-surface2 transition-colors">取消</button>
              <button onClick={() => setStep(2)} disabled={!items.trim()}
                className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-40 transition-colors">
                下一步
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Step 2: config */}
            <label className="block text-xs font-medium text-t2 mb-1.5">批次名称</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 outline-none focus:border-brand/50 mb-4"
              placeholder="例如：6月公众号内容批量" />

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-t2 mb-1">主题</label>
                <select value={theme} onChange={(e) => setTheme(e.target.value)}
                  className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2 text-sm text-t1 outline-none">
                  <option value="midnight-press">暗夜极简</option>
                  <option value="warm-white">暖白写实</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-t2 mb-1">输出格式</label>
                <select value={projectFormat} onChange={(e) => setProjectFormat(e.target.value)}
                  className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2 text-sm text-t1 outline-none">
                  <option value="video">16:9 视频</option>
                  <option value="graphic">9:16 图文卡片</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 mb-6 cursor-pointer">
              <input type="checkbox" checked={ttsAuto} onChange={(e) => setTtsAuto(e.target.checked)} className="rounded" />
              <span className="text-sm text-t2">自动合成 TTS 配音</span>
            </label>

            {error && (
              <div className="mb-4 rounded-lg bg-red-400/10 border border-red-400/20 px-3 py-2 text-sm text-red-400">{error}</div>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg text-sm text-t2 hover:text-t1 hover:bg-surface2 transition-colors">← 返回</button>
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-t2 hover:text-t1 hover:bg-surface2 transition-colors">取消</button>
              <button onClick={handleSubmit} disabled={submitting || !title.trim()}
                className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-40 transition-colors">
                {submitting ? "创建中…" : "创建并开始"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
