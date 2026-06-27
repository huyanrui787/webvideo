"use client";

import { useState, useMemo } from "react";
import { MarkdownEditor } from "./markdown-editor";

interface FileViewerSheetProps {
  projectId: string;
  filename: string;
  label: string;
  content: string;
  readOnly?: boolean;
  onClose: () => void;
  onSave?: (content: string) => Promise<void>;
}

function isJsonFile(filename: string) {
  return filename.toLowerCase().endsWith(".json");
}

function formatJson(raw: string): { formatted: string; error: string | null } {
  try {
    return { formatted: JSON.stringify(JSON.parse(raw), null, 2), error: null };
  } catch {
    return { formatted: raw, error: "JSON 解析失败，显示原始内容" };
  }
}

export function FileViewerSheet({
  filename,
  content: initialContent,
  readOnly = false,
  onClose,
  onSave,
}: FileViewerSheetProps) {
  const isJson = isJsonFile(filename);
  const { formatted: initialFormatted, error: parseError } = useMemo(
    () => (isJson ? formatJson(initialContent) : { formatted: initialContent, error: null }),
    [isJson, initialContent]
  );

  const [content, setContent] = useState(initialFormatted);
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = content;
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleSave() {
    if (!onSave) return;
    setSaving(true);
    await onSave(content);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-bd shrink-0">
        <button
          onClick={onClose}
          className="text-xs text-t3 hover:text-t2 shrink-0 transition-colors"
        >
          ‹ 项目文件
        </button>
        <span className="text-t4 text-xs shrink-0">/</span>
        <span className="text-xs font-medium text-t1 truncate flex-1 min-w-0">{filename}</span>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          title="复制文件内容"
          className={`text-xs px-2 py-1 rounded-md transition-colors shrink-0 ${
            copied
              ? "bg-green-500/15 text-green-400"
              : "text-t3 hover:text-t1 hover:bg-surface2"
          }`}
        >
          {copied ? "✓ 已复制" : "⎘ 复制"}
        </button>

        {/* Preview / Edit toggle — only for editable non-JSON files */}
        {!readOnly && !isJson && (
          <div className="flex items-center rounded-lg border border-bd overflow-hidden shrink-0">
            <button
              onClick={() => setMode("preview")}
              className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                mode === "preview"
                  ? "bg-accent text-accent-text"
                  : "text-t3 hover:text-t2"
              }`}
            >
              预览
            </button>
            <button
              onClick={() => setMode("edit")}
              className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                mode === "edit"
                  ? "bg-accent text-accent-text"
                  : "text-t3 hover:text-t2"
              }`}
            >
              编辑
            </button>
          </div>
        )}

        {/* Save — only in edit mode */}
        {!readOnly && onSave && mode === "edit" && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs px-2.5 py-1 rounded-lg bg-accent text-accent-text hover:bg-accent-hover disabled:opacity-50 font-medium transition-colors shrink-0"
          >
            {saving ? "…" : saved ? "✓ 已保存" : "保存"}
          </button>
        )}

        <button
          onClick={onClose}
          className="text-t3 hover:text-t1 text-base leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-surface2 transition-colors shrink-0"
        >
          ×
        </button>
      </div>

      {/* JSON parse error */}
      {isJson && parseError && (
        <div className="px-3 py-1.5 text-xs text-amber-500 bg-brand-subtle border-b border-brand/20 shrink-0">
          {parseError}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isJson ? (
          <pre className="flex-1 overflow-auto p-3 text-xs font-mono text-t2 leading-relaxed whitespace-pre">
            {content}
          </pre>
        ) : (
          <MarkdownEditor
            content={content}
            readOnly={readOnly}
            mode={mode}
            placeholder="文件内容…"
            onChange={setContent}
          />
        )}
      </div>
    </div>
  );
}
