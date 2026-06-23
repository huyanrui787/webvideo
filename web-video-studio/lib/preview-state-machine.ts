/**
 * Preview Lifecycle State Machine (v2 — simplified)
 *
 * 5 states, 5 button modes. All transitions are validated.
 *
 * States:
 *   IDLE     — nothing started, or scaffold done but dev not started
 *   STARTING — dev server being spawned (scaffold→vite startup, all one phase)
 *   RUNNING  — dev server healthy, iframe loaded
 *   ERROR    — something failed (scaffold, dev start, crash — all one bucket)
 *   STOPPED  — user explicitly stopped
 */

export type PreviewState = "idle" | "starting" | "running" | "error" | "stopped";

/** Structured data attached to each state */
export interface PreviewStateData {
  state: PreviewState;
  devPort: number | null;
  scaffoldProgress: { stage: string; pct: number } | null;
  buildDoneChapters: number;
  buildTotalChapters: number;
  lastError: string | null;
}

const VALID_TRANSITIONS: Record<PreviewState, PreviewState[]> = {
  idle:     ["starting"],
  starting: ["running", "error", "stopped"],
  running:  ["error", "stopped", "idle"],
  error:    ["starting", "idle"],
  stopped:  ["starting", "idle"],
};

export function canTransition(from: PreviewState, to: PreviewState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: PreviewState, to: PreviewState): void {
  if (!canTransition(from, to)) {
    console.warn(`[preview-sm] Ignored invalid transition: ${from} → ${to}`);
  }
}

/** 5 button modes — one per logical user-facing state */
export type LifecycleButtonMode = "idle" | "starting" | "running" | "error" | "stopped";

export function stateToButtonMode(
  state: PreviewState,
  _data?: PreviewStateData,
): LifecycleButtonMode {
  switch (state) {
    case "idle":     return "idle";
    case "starting": return "starting";
    case "running":  return "running";
    case "error":    return "error";
    case "stopped":  return "stopped";
  }
}

export function stateLabel(state: PreviewState): string {
  const labels: Record<PreviewState, string> = {
    idle: "等待中", starting: "启动中", running: "运行中", error: "出错", stopped: "已停止",
  };
  return labels[state];
}
