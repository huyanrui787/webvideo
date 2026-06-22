"use client";

import { useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ButtonMode =
  | "idle-writing"
  | "ready-to-build"
  | "scaffolding"
  | "scaffold-error"
  | "dev-needed"
  | "dev-starting"
  | "dev-error"
  | "preview-active"
  | "preview-active-building"
  | "preview-active-ai"
  | "build-error"
  | "project-done"
  | "dev-crashed";

export interface PreviewLifecycleButtonProps {
  scaffold: "idle" | "running" | "done" | "error";
  devPort: number | null;
  devStarting: boolean;
  devError: string | null;
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
  onTakeManualControl: () => void;
  variant: "titlebar" | "placeholder";
}

// ─── Mode derivation ─────────────────────────────────────────────────────────

export function deriveButtonMode(props: PreviewLifecycleButtonProps): ButtonMode {
  if (props.scaffold === "error") return "scaffold-error";
  if (props.scaffold === "running") return "scaffolding";
  if (props.devError) return "dev-error";
  if (props.devStarting) return "dev-starting";

  if (props.devPort !== null) {
    if (props.buildErrorCount > 0 && (props.buildStatus === "error" || props.buildStatus === "idle"))
      return "build-error";
    if (props.buildStatus === "running") return "preview-active-building";
    if (props.isStreaming) return "preview-active-ai";
    if (props.projectStatus === "done") return "project-done";
    return "preview-active";
  }

  if (props.scaffold === "done") {
    if (props.devCrashed) return "dev-crashed";
    return "dev-needed";
  }
  if (props.projectStatus === "building" || props.scaffoldStale) return "ready-to-build";
  return "idle-writing";
}

// ─── Mode → composed class resolver ──────────────────────────────────────────

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

    case "scaffolding":
      return { label: "环境初始化中…", icon: "", cssClass: "plb--working", disabled: true, showChevron: false, showProgress: false };

    case "scaffold-error":
      return { label: "重试初始化", icon: "↻", cssClass: "plb--danger", disabled: false, showChevron: false, showProgress: false };

    case "dev-needed":
      return {
        label: `启动预览${props.aiReadyForPreview ? " · AI 就绪" : ""}`,
        icon: "▶", cssClass: "plb--primary", disabled: false, showChevron: false, showProgress: false,
      };

    case "dev-starting":
      return { label: "启动开发服务器…", icon: "", cssClass: "plb--pending", disabled: true, showChevron: false, showProgress: false };

    case "dev-error":
      return { label: "重试启动", icon: "↻", cssClass: "plb--warning", disabled: false, showChevron: false, showProgress: false };

    case "preview-active":
      return { label: "刷新", icon: "↻", cssClass: "plb--neutral", disabled: false, showChevron: true, showProgress: false };

    case "preview-active-building": {
      const d = props.buildDoneChapters;
      const t = props.buildTotalChapters || 1;
      return { label: `构建中 ${d}/${t}`, icon: "⚡", cssClass: "plb--neutral", disabled: false, showChevron: true, showProgress: true };
    }

    case "preview-active-ai":
      return { label: "AI 工作中…", icon: "↻", cssClass: "plb--neutral", disabled: false, showChevron: true, showProgress: false };

    case "build-error":
      return { label: `构建异常 ×${props.buildErrorCount || 1}`, icon: "⚠", cssClass: "plb--warning", disabled: false, showChevron: true, showProgress: false };

    case "project-done":
      return { label: "项目已完成", icon: "✓", cssClass: "plb--done", disabled: false, showChevron: true, showProgress: false };

    case "dev-crashed":
      return { label: "重新连接", icon: "↻", cssClass: "plb--warn", disabled: false, showChevron: false, showProgress: false };

    default:
      return { label: "预览", icon: "🎬", cssClass: "plb--neutral", disabled: false, showChevron: false, showProgress: false };
  }
}

// ─── Main component ──────────────────────────────────────────────────────────

export function PreviewLifecycleButton(props: PreviewLifecycleButtonProps) {
  const mode = deriveButtonMode(props);
  const vis = resolveMode(mode, props);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleClick = useCallback(() => {
    if (vis.disabled) return;
    props.onTakeManualControl();

    switch (mode) {
      case "ready-to-build":
      case "scaffold-error":
        props.onStartScaffold();
        break;
      case "dev-needed":
        props.onStartDevServer();
        break;
      case "dev-error":
      case "dev-crashed":
        props.onStartDevServer();
        break;
      case "preview-active":
      case "preview-active-building":
      case "preview-active-ai":
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

  // Dropdown items
  const hasDropdown =
    mode === "preview-active" || mode === "preview-active-building" ||
    mode === "preview-active-ai" || mode === "build-error" || mode === "project-done";

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
  const showPulseDot = mode === "preview-active-ai";

  const progressPct =
    props.buildTotalChapters > 0
      ? Math.round((props.buildDoneChapters / props.buildTotalChapters) * 100)
      : 0;

  const sizeClass = props.variant === "titlebar" ? "plb--sm" : "plb--lg";

  return (
    <div className="relative shrink-0">
      <button
        onClick={handleClick}
        disabled={vis.disabled}
        className={`plb ${sizeClass} ${vis.cssClass}`}
        title={
          mode === "idle-writing" ? "AI 正在分析内容，完成后方可构建"
          : mode === "ready-to-build" ? "初始化项目开发环境（运行 scaffold.sh）"
          : mode === "scaffolding" ? "脚手架正在初始化，请等待完成"
          : mode === "scaffold-error" ? "脚手架初始化失败，点击重试"
          : mode === "dev-needed" ? "启动 Vite 开发服务器进行预览"
          : mode === "dev-starting" ? "开发服务器启动中…"
          : mode === "dev-error" ? (props.devError ?? "启动失败，点击重试")
          : mode === "dev-crashed" ? "开发服务器已断开，点击重连"
          : mode === "preview-active" ? "刷新预览"
          : mode === "preview-active-building" ? `构建进度 ${props.buildDoneChapters}/${props.buildTotalChapters} 章节`
          : mode === "preview-active-ai" ? "AI 正在生成内容，可刷新查看"
          : mode === "build-error" ? `${props.buildErrorCount} 个章节构建失败`
          : mode === "project-done" ? "项目已完成"
          : ""
        }
      >
        {/* Spinner */}
        {showSpinner && <span className="plb-spinner" />}

        {/* Icon */}
        {!showSpinner && <span className="plb-icon">{vis.icon}</span>}

        {/* Label */}
        <span className="plb-label">{vis.label}</span>

        {/* Pulse dot for AI streaming */}
        {showPulseDot && <span className="plb-dot" />}

        {/* Chevron */}
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
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PreviewLifecycleButton;
