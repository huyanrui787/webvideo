"use client";

import { useState, useCallback } from "react";
import type { ScaffoldError } from "@/stores/project-store";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ButtonMode =
  | "idle-writing"
  | "ready-to-build"
  | "scaffolding"
  | "scaffold-error"
  | "scaffold-degraded"   // scaffold partial failure but may still work
  | "dev-needed"
  | "dev-starting"
  | "dev-error"
  | "dev-crashed"
  | "preview-ok"          // fully working
  | "preview-degraded"    // working but some chapters have errors
  | "preview-bare"        // dev server running but no chapters compile
  | "preview-building"
  | "preview-ai"
  | "build-error"
  | "project-done";

export interface PreviewLifecycleButtonProps {
  scaffold: "idle" | "running" | "done" | "error";
  scaffoldProgress?: { stage: string; pct: number } | null;
  scaffoldError?: ScaffoldError | null;
  scaffoldRetries?: number;
  devPort: number | null;
  devStarting: boolean;
  devError: string | null;
  devDegraded?: boolean;
  buildStatus: "idle" | "running" | "done" | "error";
  buildDoneChapters: number;
  buildTotalChapters: number;
  buildErrorCount: number;
  projectStatus: string;
  isStreaming: boolean;
  aiReadyForPreview: boolean;
  scaffoldStale: boolean;
  devCrashed: boolean;
  onStartScaffold: () => void;
  onStartDevServer: () => void;
  onStopDevServer: () => void;
  onRefreshPreview: () => void;
  onRebuild: () => void;
  onFullscreen: () => void;
  onTryDegradedStart?: () => void;
  onViewScaffoldLogs?: () => void;
  variant: "titlebar" | "placeholder";
}

// ─── Mode derivation (fixed priority) ────────────────────────────────────────

export function deriveButtonMode(props: PreviewLifecycleButtonProps): ButtonMode {
  // Tier 1: scaffold is actively running
  if (props.scaffold === "running") return "scaffolding";

  // Tier 2: dev port exists — preview is active at some level
  if (props.devPort !== null) {
    if ((props.devDegraded ?? false) && props.buildErrorCount >= Math.max(props.buildTotalChapters, 1)) return "preview-bare";
    if (props.devDegraded ?? false) return "preview-degraded";
    if (props.buildErrorCount > 0 && (props.buildStatus === "error" || props.buildStatus === "idle")) return "build-error";
    if (props.buildStatus === "running") return "preview-building";
    if (props.isStreaming) return "preview-ai";
    if (props.projectStatus === "done") return "project-done";
    return "preview-ok";
  }

  // Tier 3: dev-related error states (only when no port)
  if (props.devCrashed) return "dev-crashed";
  if (props.devError) return "dev-error";
  if (props.devStarting) return "dev-starting";

  // Tier 4: scaffold states (no dev port yet)
  if (props.scaffold === "error") {
    // After 2+ retries, suggest degraded start
    if ((props.scaffoldRetries ?? 0) >= 2) return "scaffold-degraded";
    return "scaffold-error";
  }

  // Tier 5: scaffold done — ready for dev
  if (props.scaffold === "done") return "dev-needed";

  // Tier 6: ready to scaffold
  if (props.projectStatus === "building" || props.scaffoldStale) return "ready-to-build";

  // Tier 7: waiting
  return "idle-writing";
}

// ─── Mode → visual resolver ──────────────────────────────────────────────────

interface ModeVisual {
  label: string;
  icon: string;
  cssClass: string;
  disabled: boolean;
  showChevron: boolean;
  showProgress: boolean;
}

function resolveMode(mode: ButtonMode, props: PreviewLifecycleButtonProps): ModeVisual {
  switch (mode) {
    case "idle-writing":
      return { label: "等待内容就绪", icon: "⌛", cssClass: "plb--idle", disabled: true, showChevron: false, showProgress: false };

    case "ready-to-build":
      return {
        label: `初始化项目环境${props.aiReadyForPreview ? " · AI 就绪" : ""}`,
        icon: "▶", cssClass: "plb--call", disabled: false, showChevron: false, showProgress: false,
      };

    case "scaffolding": {
      const p = props.scaffoldProgress;
      const label = p ? `${stageLabel(p.stage)} ${p.pct}%` : "环境初始化中…";
      return { label, icon: "", cssClass: "plb--working", disabled: true, showChevron: false, showProgress: true };
    }

    case "scaffold-error": {
      const e = props.scaffoldError;
      const label = e?.type ? `初始化失败 · ${errorTypeLabel(e.type)}` : "重试初始化";
      return { label, icon: "↻", cssClass: "plb--danger", disabled: false, showChevron: false, showProgress: false };
    }

    case "scaffold-degraded":
      return { label: "跳过初始化 · 尝试启动", icon: "⚠", cssClass: "plb--warning", disabled: false, showChevron: false, showProgress: false };

    case "dev-needed":
      return {
        label: `启动预览${props.aiReadyForPreview ? " · AI 就绪" : ""}`,
        icon: "▶", cssClass: "plb--primary", disabled: false, showChevron: false, showProgress: false,
      };

    case "dev-starting":
      return { label: "启动开发服务器…", icon: "", cssClass: "plb--pending", disabled: true, showChevron: false, showProgress: false };

    case "dev-error":
      return { label: "重试启动", icon: "↻", cssClass: "plb--warning", disabled: false, showChevron: false, showProgress: false };

    case "dev-crashed":
      return { label: "重新连接", icon: "↻", cssClass: "plb--warn", disabled: false, showChevron: false, showProgress: false };

    case "preview-ok":
      return { label: "预览中", icon: "✓", cssClass: "plb--ok", disabled: false, showChevron: true, showProgress: false };

    case "preview-degraded":
      return {
        label: `预览 · ${props.buildDoneChapters}/${props.buildTotalChapters || 1} 章`,
        icon: "⚠", cssClass: "plb--warn-ok", disabled: false, showChevron: true, showProgress: false,
      };

    case "preview-bare":
      return { label: "框架运行 · 无章节", icon: "△", cssClass: "plb--bare", disabled: false, showChevron: true, showProgress: false };

    case "preview-building": {
      const d = props.buildDoneChapters;
      const t = props.buildTotalChapters || 1;
      return { label: `构建中 ${d}/${t}`, icon: "⚡", cssClass: "plb--neutral", disabled: false, showChevron: true, showProgress: true };
    }

    case "preview-ai":
      return { label: "AI 工作中…", icon: "↻", cssClass: "plb--neutral", disabled: false, showChevron: true, showProgress: false };

    case "build-error":
      return { label: `构建异常 ×${props.buildErrorCount || 1}`, icon: "⚠", cssClass: "plb--warning", disabled: false, showChevron: true, showProgress: false };

    case "project-done":
      return { label: "项目已完成", icon: "✓", cssClass: "plb--done", disabled: false, showChevron: true, showProgress: false };

    default:
      return { label: "预览", icon: "🎬", cssClass: "plb--neutral", disabled: false, showChevron: false, showProgress: false };
  }
}

function stageLabel(stage: string): string {
  const map: Record<string, string> = {
    "npm-install": "安装依赖", "vite-create": "创建项目", "theme-copy": "复制主题",
    "cleanup": "清理", "done": "完成",
  };
  return map[stage] ?? stage;
}

function errorTypeLabel(type: string): string {
  const map: Record<string, string> = {
    network: "网络问题", npm: "依赖安装", vite: "Vite 错误",
    disk: "磁盘空间", timeout: "超时", unknown: "未知错误",
  };
  return map[type] ?? type;
}

// ─── Tooltip builder ──────────────────────────────────────────────────────────

function buildTooltip(mode: ButtonMode, props: PreviewLifecycleButtonProps): string {
  switch (mode) {
    case "scaffolding": {
      const p = props.scaffoldProgress;
      return p ? `脚手架运行中：${stageLabel(p.stage)} (${p.pct}%)` : "脚手架正在初始化，请等待完成";
    }
    case "scaffold-error": {
      const e = props.scaffoldError;
      const retries = props.scaffoldRetries ?? 0;
      return e
        ? `${e.message}\n建议：${e.suggestion}\n已重试 ${retries} 次`
        : `脚手架初始化失败，已重试 ${retries} 次，点击重试`;
    }
    case "scaffold-degraded":
      return "脚手架部分失败，但核心文件可能仍可用。尝试跳过错误启动开发服务器（可能不可用）";
    case "preview-degraded":
      return `${props.buildDoneChapters}/${props.buildTotalChapters} 章编译通过，${props.buildErrorCount} 章有错误。预览可正常播放通过的章节`;
    case "preview-bare":
      return "开发服务器运行中，但无成功编译的章节。请在编辑器中修复章节代码";
    default:
      return "";
  }
}

// ─── Main component ──────────────────────────────────────────────────────────

export function PreviewLifecycleButton(props: PreviewLifecycleButtonProps) {
  const mode = deriveButtonMode(props);
  const vis = resolveMode(mode, props);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [errorExpanded, setErrorExpanded] = useState(false);

  const handleClick = useCallback(() => {
    if (vis.disabled) return;
    switch (mode) {
      case "ready-to-build":
      case "scaffold-error":
        props.onStartScaffold();
        break;
      case "scaffold-degraded":
        props.onTryDegradedStart?.();
        break;
      case "dev-needed":
        props.onStartDevServer();
        break;
      case "dev-error":
      case "dev-crashed":
        props.onStartDevServer();
        break;
      case "preview-ok":
      case "preview-degraded":
      case "preview-bare":
      case "preview-building":
      case "preview-ai":
      case "build-error":
      case "project-done":
        props.onRefreshPreview();
        break;
      default:
        break;
    }
  }, [vis.disabled, mode, props]);

  const handleChevronClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (vis.showChevron) setDropdownOpen((v) => !v);
  }, [vis.showChevron]);

  const hasDropdown =
    mode === "preview-ok" || mode === "preview-degraded" || mode === "preview-bare" ||
    mode === "preview-building" || mode === "preview-ai" ||
    mode === "build-error" || mode === "project-done";

  const dropdownItems = hasDropdown
    ? [
        { label: "刷新预览", icon: "↻", onClick: props.onRefreshPreview, danger: false },
        { label: "重启开发服务器", icon: "↺", onClick: props.onStartDevServer, danger: false },
        { label: "停止预览", icon: "■", onClick: props.onStopDevServer, danger: true },
        { label: "重新构建", icon: "⬡", onClick: props.onRebuild, danger: false },
        { label: "全屏", icon: "⛶", onClick: props.onFullscreen, danger: false },
      ]
    : [];

  const showSpinner = mode === "dev-starting" || mode === "scaffolding";
  const showPulseDot = mode === "preview-ai";
  const showErrorDetail = (mode === "scaffold-error" || mode === "scaffold-degraded") && (props.scaffoldError ?? null);

  const progressPct =
    mode === "scaffolding" && (props.scaffoldProgress ?? null)
      ? (props.scaffoldProgress ?? { pct: 0 }).pct
      : props.buildTotalChapters > 0
        ? Math.round((props.buildDoneChapters / props.buildTotalChapters) * 100)
        : 0;

  const sizeClass = props.variant === "titlebar" ? "plb--sm" : "plb--lg";
  const tooltip = buildTooltip(mode, props);

  return (
    <div className="relative shrink-0">
      <button
        onClick={handleClick}
        disabled={vis.disabled}
        className={`plb ${sizeClass} ${vis.cssClass}`}
        title={tooltip || undefined}
      >
        {showSpinner && <span className="plb-spinner" />}
        {!showSpinner && <span className="plb-icon">{vis.icon}</span>}
        <span className="plb-label">{vis.label}</span>
        {showPulseDot && <span className="plb-dot" />}
        {vis.showChevron && (
          <span onClick={handleChevronClick} className={`plb-chevron ${dropdownOpen ? "plb-chevron--open" : ""}`}>
            ▾
          </span>
        )}
      </button>

      {/* Progress bar */}
      {vis.showProgress && (
        <div className="plb-progress">
          <div className="plb-progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {/* Error detail expander */}
      {showErrorDetail && (
        <div className="plb-error-detail">
          <button
            className="plb-error-toggle"
            onClick={() => setErrorExpanded((v) => !v)}
          >
            {errorExpanded ? "收起" : "查看详情"}
          </button>
          {errorExpanded && props.scaffoldError && (
            <div className="plb-error-body">
              <div className="plb-error-type">{errorTypeLabel(props.scaffoldError.type)}</div>
              <div className="plb-error-msg">{props.scaffoldError.message}</div>
              <div className="plb-error-suggestion">{props.scaffoldError.suggestion}</div>
              <div className="plb-error-retries">已重试 {props.scaffoldRetries ?? 0} 次</div>
            </div>
          )}
        </div>
      )}

      {/* Dropdown */}
      {dropdownOpen && hasDropdown && (
        <>
          <div className="plb-backdrop" onClick={() => setDropdownOpen(false)} />
          <div className="plb-dropdown">
            {dropdownItems.map((item, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); item.onClick(); setDropdownOpen(false); }}
                className={`plb-dropdown-item${item.danger ? " plb-dropdown-item--danger" : ""}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
            {props.devPort && (
              <>
                <div className="plb-dropdown-sep" />
                <div className="plb-dropdown-info">端口 :{props.devPort}</div>
                {props.devDegraded && (
                  <div className="plb-dropdown-info plb-dropdown-info--warn">部分章节有编译错误</div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PreviewLifecycleButton;
