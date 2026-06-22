"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Batch, BatchSourceType, BatchStatus } from "@/lib/db/schema";

const STATUS_LABELS: Record<BatchStatus, string> = {
  pending: "等待中",
  running: "运行中",
  done: "已完成",
  partial: "部分完成",
  cancelled: "已取消",
};

const STATUS_COLORS: Record<BatchStatus, string> = {
  pending: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  running: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  done: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  partial: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  cancelled: "bg-zinc-500/10 border-zinc-500/20 text-zinc-400",
};

const SOURCE_LABELS: Record<BatchSourceType, string> = {
  url_list: "URL 列表",
  topic_list: "话题列表",
  rss: "RSS 订阅",
  csv_upload: "CSV 上传",
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
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  // Poll for running batches
  useEffect(() => {
    const hasRunning = batches.some((b) => b.status === "running");
    if (!hasRunning) return;
    const t = setInterval(fetchBatches, 5000);
    return () => clearInterval(t);
  }, [batches, fetchBatches]);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-t1">批量任务</h1>
            <p className="text-sm text-t2 mt-1">
              批量导入文章链接或话题，自动生成多个视频
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium hover:from-indigo-400 hover:to-violet-500 transition-all"
          >
            + 新建批次
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
        {loading ? (
          <div className="text-center text-t3 py-20">加载中…</div>
        ) : batches.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">⊞</div>
            <p className="text-t2 mb-4">还没有批量任务</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 rounded-xl bg-surface border border-bd text-sm text-t1 hover:bg-surface2 transition-all"
            >
              创建第一个批次
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch) => {
              const progress = batch.total > 0
                ? Math.round((batch.done / batch.total) * 100)
                : 0;
              return (
                <Link
                  key={batch.id}
                  href={`/batches/${batch.id}`}
                  className="block rounded-2xl border border-bd bg-surface hover:bg-surface2 transition-all p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">⊞</span>
                      <div>
                        <h3 className="text-sm font-semibold text-t1">
                          {batch.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[batch.status]}`}>
                            {STATUS_LABELS[batch.status]}
                          </span>
                          <span className="text-[11px] text-t3">
                            {SOURCE_LABELS[batch.sourceType]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {batch.status === "running" && (
                    <div className="mb-2">
                      <div className="h-1.5 rounded-full bg-surface2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[11px] text-t3">
                        <span>{batch.done}/{batch.total} 完成</span>
                        <span>{progress}%</span>
                      </div>
                    </div>
                  )}

                  {(batch.status === "done" || batch.status === "partial") && (
                    <div className="flex items-center gap-1 text-[11px] text-t3">
                      <span>✅ {batch.done} 成功</span>
                      {batch.failed > 0 && <span>· ❌ {batch.failed} 失败</span>}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Batch Modal ────────────────────────────────────────────────────────

function CreateBatchModal({
  onClose,
  onCreated,
}: {
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
    const itemList = items
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (itemList.length === 0) {
      setError("请输入至少一个链接或话题");
      return;
    }
    if (!title.trim()) {
      setError("请输入批次名称");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          sourceType,
          sourceConfig: sourceType === "url_list" || sourceType === "rss"
            ? { urls: itemList }
            : { topics: itemList },
          projectConfig: { theme, projectFormat, ttsAuto },
          items: itemList,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onCreated(data.id);
      } else {
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
      <div className="bg-modal rounded-2xl border border-bd w-full max-w-lg p-6 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-t1">新建批次</h2>
          <button onClick={onClose} className="text-t3 hover:text-t1">✕</button>
        </div>

        {step === 1 ? (
          <>
            {/* Input type selection */}
            <label className="block text-sm font-medium text-t1 mb-2">输入方式</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {([
                ["url_list", "粘贴 URL 列表"],
                ["topic_list", "话题 / 关键词"],
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

            <label className="block text-sm font-medium text-t1 mb-1.5">
              {sourceType === "url_list" ? "文章链接（每行一个）" : "话题/关键词（每行一个）"}
            </label>
            <textarea
              value={items}
              onChange={(e) => setItems(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-accent transition-all resize-none mb-4"
              placeholder={
                sourceType === "url_list"
                  ? "https://mp.weixin.qq.com/s/...\nhttps://example.com/blog/..."
                  : "AI 如何改变教育\n量子计算入门\n气候变化的五个事实"
              }
            />

            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-t2 hover:text-t1">取消</button>
              <button
                onClick={() => setStep(2)}
                disabled={!items.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium disabled:opacity-50 transition-all"
              >
                下一步 →
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Config step */}
            <label className="block text-sm font-medium text-t1 mb-1.5">批次名称</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 outline-none focus:border-accent transition-all mb-4"
              placeholder="例如：6月公众号内容批量"
            />

            <div className="grid grid-cols-2 gap-3 mb-4">
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
              <div>
                <label className="block text-xs text-t2 mb-1">输出格式</label>
                <select
                  value={projectFormat}
                  onChange={(e) => setProjectFormat(e.target.value)}
                  className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2 text-sm text-t1 outline-none"
                >
                  <option value="video">16:9 视频</option>
                  <option value="graphic">9:16 图文卡片</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 mb-6">
              <input
                type="checkbox"
                checked={ttsAuto}
                onChange={(e) => setTtsAuto(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-t2">自动合成 TTS 配音</span>
            </label>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setStep(1)} className="px-4 py-2 rounded-xl text-sm text-t2 hover:text-t1">← 返回</button>
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-t2 hover:text-t1">取消</button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !title.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium disabled:opacity-50 transition-all"
              >
                {submitting ? "创建中…" : "创建并开始"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
