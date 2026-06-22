"use client";

import { useEffect, useState } from "react";
import type { PreferredModel } from "@/lib/db/schema";

interface ModelPickerPanelProps {
  current: PreferredModel;
  onConfirm: (model: PreferredModel) => void | Promise<void>;
  onClose: () => void;
  title?: string;      // e.g. "选择主 Agent 模型" or "选择 Coding 模型"
  subtitle?: string;   // e.g. "负责对话、规划、脚本生成"
}

const MODEL_LABELS: Record<PreferredModel, string> = {
  "deepseek-chat": "DeepSeek V3",
  "deepseek-reasoner": "DeepSeek R1",
  "deepseek-v4-flash": "DeepSeek V4 Flash",
  "deepseek-v4-pro": "DeepSeek V4 Pro",
  "claude-sonnet-4-6": "Claude Sonnet",
  "claude-opus-4-8": "Claude Opus",
};

const MODEL_DESCRIPTIONS: Record<PreferredModel, string> = {
  "deepseek-chat": "速度快，价格低，适合日常对话",
  "deepseek-reasoner": "推理型，复杂任务表现好",
  "deepseek-v4-flash": "V4 轻量版，速度优先",
  "deepseek-v4-pro": "V4 完整版，质量与速度平衡",
  "claude-sonnet-4-6": "Claude Sonnet，通用能力强",
  "claude-opus-4-8": "Claude Opus，最高质量",
};

const MODEL_ORDER: PreferredModel[] = [
  "deepseek-v4-pro",
  "deepseek-v4-flash",
  "deepseek-chat",
  "deepseek-reasoner",
  "claude-sonnet-4-6",
  "claude-opus-4-8",
];

export function ModelPickerPanel({ current, onConfirm, onClose, title, subtitle }: ModelPickerPanelProps) {
  const [selected, setSelected] = useState<PreferredModel>(current);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const changed = selected !== current;

  async function confirm() {
    if (!changed || saving) return;
    setSaving(true);
    try {
      await onConfirm(selected);
      onClose();
    } catch (e) {
      setSaving(false);
      console.error("[ModelPicker] confirm failed:", e);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col bg-modal h-full shadow-2xl"
        style={{ width: "min(380px, 100vw)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-bd shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-t1">{title ?? "选择模型"}</h2>
            <p className="text-xs text-t3 mt-0.5">
              {subtitle ?? `当前：${MODEL_LABELS[current]}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface2 text-t3 hover:text-t2 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {MODEL_ORDER.map(m => {
            const isSelected = selected === m;
            const isCurrent = m === current;
            return (
              <div
                key={m}
                onClick={() => setSelected(m)}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-accent text-accent-text"
                    : "hover:bg-surface2 text-t2"
                }`}
              >
                <span className={`shrink-0 mt-1.5 w-2 h-2 rounded-full ${
                  isCurrent
                    ? "bg-emerald-400"
                    : isSelected
                      ? "bg-[var(--accent-text)]"
                      : "bg-t3"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{MODEL_LABELS[m]}</p>
                  <p className={`text-xs truncate ${
                    isSelected ? "text-accent-text/65" : "text-t3"
                  }`}>
                    {MODEL_DESCRIPTIONS[m]}
                  </p>
                </div>
                {isCurrent && (
                  <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ${
                    isSelected
                      ? "bg-[var(--accent-text)]/20 text-accent-text"
                      : "bg-emerald-500/15 text-emerald-400"
                  }`}>
                    当前
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t border-bd shrink-0">
          <button
            onClick={confirm}
            disabled={!changed || saving}
            className="w-full rounded-xl bg-accent py-2.5 text-sm font-medium text-accent-text hover:bg-accent-hover disabled:opacity-40 transition-colors"
          >
            {saving
              ? "切换中…"
              : changed
                ? `✓ 切换到「${MODEL_LABELS[selected]}」`
                : "未修改"}
          </button>
        </div>
      </div>
    </div>
  );
}