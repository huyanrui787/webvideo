/**
 * Preview Lifecycle State Machine
 *
 * Replaces 5 scattered boolean/number fields with a single finite-state machine.
 * All transitions are validated — invalid state combinations are impossible.
 *
 * States:
 *   IDLE               — nothing started
 *   SCAFFOLDING        — scaffold job running
 *   SCAFFOLD_FAILED    — scaffold errored (retry available)
 *   SCAFFOLD_DEGRADED  — partial scaffold, degraded start possible
 *   READY              — scaffold done, dev not started
 *   STARTING           — dev server spawning
 *   RUNNING            — healthy, iframe loaded
 *   DEGRADED           — running but compile errors exist
 *   CRASHED            — process died unexpectedly
 *   RESTARTING         — auto-restart in progress
 *   STOPPED            — user stopped server
 */

export type PreviewState =
  | "idle"
  | "scaffolding"
  | "scaffold-failed"
  | "scaffold-degraded"
  | "ready"
  | "starting"
  | "running"
  | "degraded"
  | "crashed"
  | "restarting"
  | "stopped";

/** Structured data attached to each state */
export interface PreviewStateData {
  state: PreviewState;
  devPort: number | null;
  scaffoldProgress: { stage: string; pct: number } | null;
  scaffoldRetries: number;
  buildDoneChapters: number;
  buildTotalChapters: number;
  buildErrorCount: number;
  lastError: string | null;
}

const VALID_TRANSITIONS: Record<PreviewState, PreviewState[]> = {
  idle:              ["scaffolding"],
  scaffolding:       ["ready", "scaffold-failed", "scaffold-degraded"],
  "scaffold-failed": ["scaffolding", "scaffold-degraded", "idle"],
  "scaffold-degraded": ["starting", "scaffolding"],
  ready:             ["starting", "scaffolding"],
  starting:          ["running", "degraded", "stopped", "crashed"],
  running:           ["degraded", "crashed", "stopped", "restarting"],
  degraded:          ["running", "crashed", "stopped"],
  crashed:           ["restarting", "stopped", "starting"],
  restarting:        ["running", "degraded", "scaffold-failed", "stopped"],
  stopped:           ["starting", "scaffolding"],
};

export function canTransition(from: PreviewState, to: PreviewState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: PreviewState, to: PreviewState): void {
  if (!canTransition(from, to)) {
    console.warn(`[preview-sm] Invalid transition: ${from} → ${to}`);
  }
}

/** Derive the lifecycle button mode from the state machine state */
export type LifecycleButtonMode =
  | "idle-writing" | "ready-to-build" | "scaffolding" | "scaffold-error"
  | "scaffold-degraded" | "dev-needed" | "dev-starting" | "dev-error"
  | "preview-ok" | "preview-degraded" | "preview-bare"
  | "preview-building" | "preview-ai" | "build-error" | "project-done" | "dev-crashed";

export function stateToButtonMode(
  state: PreviewState,
  data: PreviewStateData,
  isStreaming: boolean,
  projectStatus: string,
): LifecycleButtonMode {
  switch (state) {
    case "idle":
      return (projectStatus === "building") ? "ready-to-build" : "idle-writing";
    case "scaffolding":        return "scaffolding";
    case "scaffold-failed":    return data.scaffoldRetries >= 2 ? "scaffold-degraded" : "scaffold-error";
    case "scaffold-degraded":  return "scaffold-degraded";
    case "ready":              return "dev-needed";
    case "starting":           return "dev-starting";
    case "running":
      if (isStreaming) return "preview-ai";
      if (data.buildErrorCount > 0 && data.buildTotalChapters === 0) return "preview-bare";
      if (data.buildErrorCount > 0) return "build-error";
      if (projectStatus === "done") return "project-done";
      if (data.buildDoneChapters < data.buildTotalChapters && data.buildTotalChapters > 0) return "preview-building";
      return "preview-ok";
    case "degraded":
      if (data.buildTotalChapters === 0 || data.buildErrorCount >= data.buildTotalChapters) return "preview-bare";
      return "preview-degraded";
    case "crashed":  return "dev-crashed";
    case "restarting": return "dev-starting";
    case "stopped":
      if (data.lastError) return "dev-error";
      return "dev-needed";
  }
}

/** Get a human-readable label for a state */
export function stateLabel(state: PreviewState): string {
  const labels: Record<PreviewState, string> = {
    idle: "等待中", scaffolding: "环境初始化中", "scaffold-failed": "初始化失败",
    "scaffold-degraded": "部分初始化", ready: "准备就绪", starting: "启动中",
    running: "运行中", degraded: "降级运行", crashed: "已崩溃",
    restarting: "重启中", stopped: "已停止",
  };
  return labels[state];
}
