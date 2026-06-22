"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────

type ExportFormat = "wechat" | "markdown" | "html";
type ExportState = "idle" | "loading" | "done" | "error";

interface ArticleExportPanelProps {
  projectId: string;
  projectTitle?: string;
  onClose: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ArticleExportPanel({ projectId, projectTitle, onClose }: ArticleExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>("wechat");
  const [state, setState] = useState<ExportState>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // ─── Generate export ────────────────────────────────────────────────

  async function generate() {
    setState("loading");
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/articles/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "导出失败");
      }

      const data = await res.json();
      setResult(data.content);
      setState("done");

      // Load preview
      try {
        const previewRes = await fetch(`/api/projects/${projectId}/articles/preview`);
        if (previewRes.ok) {
          setPreviewHtml(await previewRes.text());
        }
      } catch {
        // preview is optional
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "导出失败");
      setState("error");
    }
  }

  // ─── Copy ───────────────────────────────────────────────────────────

  async function copyToClipboard() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select and copy
      const ta = document.createElement("textarea");
      ta.value = result;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // ─── Download ───────────────────────────────────────────────────────

  function download() {
    if (!result) return;
    const ext = format === "markdown" ? ".md" : ".html";
    const mime = format === "markdown" ? "text/markdown" : "text/html";
    const blob = new Blob([result], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectTitle ?? "article"}${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">导出图文排版</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-lg leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Format selector */}
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">导出格式</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {([
                { id: "wechat", label: "微信公众号", desc: "直接粘贴到公众号编辑器", hint: "推荐" },
                { id: "markdown", label: "Markdown", desc: "发布到知乎 / Notion / GitHub", hint: "" },
                { id: "html", label: "完整 HTML", desc: "自建博客 / 独立页面", hint: "" },
              ] as Array<{ id: ExportFormat; label: string; desc: string; hint: string }>).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setFormat(opt.id); setState("idle"); setResult(null); }}
                  className={`relative rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                    format === opt.id
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  {opt.hint && (
                    <span className="absolute -top-2 -right-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                      {opt.hint}
                    </span>
                  )}
                  <p className={`text-sm font-medium ${format === opt.id ? "text-zinc-900" : "text-zinc-600"}`}>
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Info banner */}
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
            {format === "wechat"
              ? "微信公众号格式使用内联样式，图片依赖服务器 URL。如需长期使用，请先将图片上传到 CDN。"
              : format === "markdown"
              ? "Markdown 格式包含图片 URL 引用，可直接粘贴到支持 Markdown 的平台。"
              : "完整 HTML 页面包含所有样式，可独立打开。"}
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={state === "loading"}
            className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 transition-colors"
          >
            {state === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full" />
                生成中…
              </span>
            ) : (
              "✨ 生成导出内容"
            )}
          </button>

          {/* Error */}
          {state === "error" && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Preview */}
          {previewHtml && state === "done" && (
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">预览</p>
              <div className="rounded-xl border border-zinc-200 overflow-hidden bg-white max-h-80 overflow-y-auto">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-80 border-0"
                  title="Export preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}

          {/* Result textarea (debug / fallback) */}
          {state === "done" && result && (
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                导出内容 ({format === "markdown" ? "Markdown" : "HTML"})
              </p>
              <textarea
                readOnly
                value={result}
                rows={10}
                className="w-full rounded-xl border border-zinc-200 p-3 text-xs font-mono text-zinc-700 bg-zinc-50 resize-y"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {state === "done" && (
          <div className="flex gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
            <button
              onClick={copyToClipboard}
              className="flex-1 rounded-xl border border-zinc-300 bg-white py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              {copied ? "✓ 已复制" : "📋 复制到剪贴板"}
            </button>
            <button
              onClick={download}
              className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              ⬇ 下载文件
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
