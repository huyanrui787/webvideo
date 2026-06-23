"use client";

import { useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ButtonMode = "idle" | "starting" | "running" | "error" | "stopped";

export interface PreviewLifecycleButtonProps {
  devPort: number | null;
  devStarting: boolean;
  devError: string | null;
  scaffold: "idle" | "running" | "done" | "error";
  scaffoldProgress?: { stage: string; pct: number } | null;
  buildDoneChapters: number;
  buildTotalChapters: number;
  onStartScaffold: () => void;
  onStartDevServer: () => void;
  onStopDevServer: () => void;
  onRefreshPreview: () => void;
  onFullscreen: () => void;
  variant: "titlebar" | "placeholder";
}

// ─── Mode derivation ─────────────────────────────────────────────────────────

export function deriveButtonMode(props: PreviewLifecycleButtonProps): ButtonMode {
  // dev server running → preview is active
  if (props.devPort !== null) return "running";

  // dev server starting
  if (props.devStarting) return "starting";

  // scaffold running
  if (props.scaffold === "running") return "starting";

  // error states
  if (props.devError) return "error";
  if (props.scaffold === "error") return "error";

  // scaffold done, waiting for dev start
  if (props.scaffold === "done") return "idle";

  // nothing started
  return "idle";
}

// ─── Visual resolver ─────────────────────────────────────────────────────────

interface ModeVisual {
  label: string;
  cssClass: string;
  disabled: boolean;
  showProgress: boolean;
}

function resolveMode(mode: ButtonMode, props: PreviewLifecycleButtonProps): ModeVisual {
  const pct = props.scaffoldProgress?.pct;
  const progressLabel = pct !== undefined ? ` ${pct}%` : "";

  switch (mode) {
    case "idle":
      if (props.scaffold === "done") {
        return { label: "启动预览", cssClass: "plb--primary", disabled: false, showProgress: false };
      }
      if (props.scaffold === "running") {
        return { label: `环境准备中${progressLabel}`, cssClass: "plb--working", disabled: true, showProgress: true };
      }
      if (props.buildTotalChapters > 0) {
        return { label: "启动预览", cssClass: "plb--primary", disabled: false, showProgress: false };
      }
      return { label: "等待 AI 内容", cssClass: "plb--idle", disabled: true, showProgress: false };

    case "starting":
      return { label: `启动中${progressLabel}`, cssClass: "plb--pending", disabled: true, showProgress: true };

    case "running":
      return { label: "预览中", cssClass: "plb--neutral", disabled: false, showProgress: false };

    case "error":
      return { label: props.devError ?? "启动失败", cssClass: "plb--danger", disabled: false, showProgress: false };

    case "stopped":
      return { label: "已停止", cssClass: "plb--warn", disabled: false, showProgress: false };
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PreviewLifecycleButton(props: PreviewLifecycleButtonProps) {
  const mode = deriveButtonMode(props);
  const vis = resolveMode(mode, props);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleClick = useCallback(() => {
    console.log("[preview-btn] handleClick", { mode, disabled: vis.disabled, scaffold: props.scaffold, devPort: props.devPort });
    if (vis.disabled) return;
    switch (mode) {
      case "idle":
        // scaffold may not be synced to store yet — if chapters exist, dev server is safe to start
        if (props.buildTotalChapters > 0 || props.scaffold === "done") {
          props.onStartDevServer();
        } else {
          props.onStartScaffold();
        }
        break;
      case "error":
        props.onStartDevServer();
        break;
      case "running":
        props.onRefreshPreview();
        break;
      case "stopped":
        props.onStartDevServer();
        break;
    }
  }, [mode, vis.disabled, props]);

  const hasDropdown = mode === "running" || mode === "stopped";

  // Inline variant
  if (props.variant === "placeholder") {
    return (
      <button
        onClick={handleClick}
        disabled={vis.disabled}
        className={`plb plb--lg ${vis.cssClass}`}
      >
        <span className="plb-label">{vis.label}</span>
        {vis.showProgress && props.scaffoldProgress && (
          <span className="plb-badge">{props.scaffoldProgress.pct}%</span>
        )}
      </button>
    );
  }

  // Titlebar variant
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={handleClick}
        disabled={vis.disabled}
        className={`plb plb--sm ${vis.cssClass}`}
      >
        <span className="plb-label">{vis.label}</span>
        {hasDropdown && (
          <span
            className={`plb-chevron ${dropdownOpen ? "plb-chevron--open" : ""}`}
            onClick={(e) => { e.stopPropagation(); setDropdownOpen((v) => !v); }}
          >
            ▾
          </span>
        )}
      </button>
      {hasDropdown && dropdownOpen && (
        <>
          <div className="plb-backdrop" onClick={() => setDropdownOpen(false)} />
          <div className="plb-dropdown">
            <button className="plb-dropdown-item" onClick={() => { props.onRefreshPreview(); setDropdownOpen(false); }}>
              ↻ 刷新预览
            </button>
            <button className="plb-dropdown-item" onClick={() => { props.onFullscreen(); setDropdownOpen(false); }}>
              ⛶ 全屏
            </button>
            <div className="plb-dropdown-sep" />
            <button
              className="plb-dropdown-item plb-dropdown-item--danger"
              onClick={() => { props.onStopDevServer(); setDropdownOpen(false); }}
            >
              ■ 停止预览
            </button>
          </div>
        </>
      )}
    </div>
  );
}
