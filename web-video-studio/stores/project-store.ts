"use client";

import { create } from "zustand";
import type { ChapterProgress } from "@/components/chapter-progress-panel";
import type { PlaybackStep } from "@/components/playback-bar";
import type { Project } from "@/lib/db/schema";
import {
  type PreviewState,
  type PreviewStateData,
  assertTransition,
} from "@/lib/preview-state-machine";

// ─── Types ───────────────────────────────────────────────────────────────────

type WS = "idle" | "running" | "done" | "error";
type WB = "audio" | "bgm" | "avatar" | "illust-timeline" | "article-layout" | null;

/** Structured scaffold error for transparent user feedback */
export interface ScaffoldError {
  type: "network" | "npm" | "vite" | "disk" | "timeout" | "unknown";
  message: string;
  suggestion: string;
}

interface DevSlice {
  devPort: number | null;
  devStarting: boolean;
  devError: string | null;
  devCrashed: boolean;
  devDegraded: boolean;
  setDevPort: (port: number | null) => void;
  setDevStarting: (v: boolean) => void;
  setDevError: (e: string | null) => void;
  setDevCrashed: (v: boolean) => void;
  setDevDegraded: (v: boolean) => void;
}

interface ScaffoldSlice {
  scaffold: WS;
  scaffoldStale: boolean;
  scaffoldProgress: { stage: string; pct: number } | null;
  scaffoldError: ScaffoldError | null;
  scaffoldRetries: number;
  setScaffold: (s: WS) => void;
  setScaffoldStale: (v: boolean) => void;
  setScaffoldProgress: (p: { stage: string; pct: number } | null) => void;
  setScaffoldError: (e: ScaffoldError | null) => void;
  incScaffoldRetries: () => void;
}

interface BuildSlice {
  buildJob: { status: string; chapters?: any[] } | null;
  chapters: ChapterProgress[];
  chStepCounts: Record<number, number>;
  setBuildJob: (j: { status: string; chapters?: any[] } | null) => void;
  setChapters: (c: ChapterProgress[] | ((prev: ChapterProgress[]) => ChapterProgress[])) => void;
  setChStepCounts: (c: Record<number, number>) => void;
}

interface PlaybackSlice {
  playState: "idle" | "playing" | "paused" | "ended";
  playStep: PlaybackStep | null;
  playSpeed: number;
  subVisible: boolean;
  autoMode: boolean;
  setPlayState: (s: "idle" | "playing" | "paused" | "ended") => void;
  setPlayStep: (s: PlaybackStep | null) => void;
  setPlaySpeed: (v: number) => void;
  setSubVisible: (v: boolean) => void;
  setAutoMode: (v: boolean) => void;
}

interface PreviewSlice {
  previewMode: "preview" | "edit";
  floating: boolean;
  wholePage: boolean;
  iframeKey: number;
  setPreviewMode: (m: "preview" | "edit") => void;
  setFloating: (v: boolean) => void;
  setWholePage: (v: boolean) => void;
  bumpIframeKey: () => void;
}

interface ProjectSlice {
  project: Project | null;
  isStreaming: boolean;
  aiReadyForPreview: boolean;
  setProject: (p: Project | null) => void;
  setIsStreaming: (v: boolean) => void;
  setAiReadyForPreview: (v: boolean) => void;
  resetForNavigation: () => void;
}

// State machine slice — canonical lifecycle state
interface StateMachineSlice {
  previewState: PreviewState;
  previewStateData: PreviewStateData;
  /** Transition to a new state. Returns true if accepted. */
  transition: (to: PreviewState, data?: Partial<PreviewStateData>) => boolean;
  /** Reset the state machine to idle */
  resetStateMachine: () => void;
}

export type ProjectStore = DevSlice & ScaffoldSlice & BuildSlice & PlaybackSlice & PreviewSlice & ProjectSlice & StateMachineSlice;

const INITIAL_STATE_DATA: PreviewStateData = {
  state: "idle", devPort: null, scaffoldProgress: null,
  buildDoneChapters: 0, buildTotalChapters: 0,
  lastError: null,
};

export const useProjectStore = create<ProjectStore>((set) => ({
  // ── Dev ──
  devPort: null, devStarting: false, devError: null, devCrashed: false, devDegraded: false,
  setDevPort: (port) => set({ devPort: port }),
  setDevStarting: (v) => set({ devStarting: v }),
  setDevError: (e) => set({ devError: e }),
  setDevCrashed: (v) => set({ devCrashed: v }),
  setDevDegraded: (v) => set({ devDegraded: v }),

  // ── Scaffold ──
  scaffold: "idle", scaffoldStale: false, scaffoldProgress: null, scaffoldError: null, scaffoldRetries: 0,
  setScaffold: (s) => set({ scaffold: s }),
  setScaffoldStale: (v) => set({ scaffoldStale: v }),
  setScaffoldProgress: (p) => set({ scaffoldProgress: p }),
  setScaffoldError: (e) => set({ scaffoldError: e }),
  incScaffoldRetries: () => set((s) => ({ scaffoldRetries: s.scaffoldRetries + 1 })),

  // ── Build ──
  buildJob: null, chapters: [], chStepCounts: {},
  setBuildJob: (j) => set({ buildJob: j }),
  setChapters: (c) => set((s) => ({ chapters: typeof c === "function" ? c(s.chapters) : c })),
  setChStepCounts: (c) => set({ chStepCounts: c }),

  // ── Playback ──
  playState: "idle", playStep: null, playSpeed: 1, subVisible: true, autoMode: true,
  setPlayState: (ps) => set({ playState: ps }),
  setPlayStep: (ps) => set({ playStep: ps }),
  setPlaySpeed: (v) => set({ playSpeed: v }),
  setSubVisible: (v) => set({ subVisible: v }),
  setAutoMode: (v) => set({ autoMode: v }),

  // ── Preview ──
  previewMode: "preview", floating: false, wholePage: false, iframeKey: 0,
  setPreviewMode: (m) => set({ previewMode: m }),
  setFloating: (v) => set({ floating: v }),
  setWholePage: (v) => set({ wholePage: v }),
  bumpIframeKey: () => set((s) => ({ iframeKey: s.iframeKey + 1 })),

  // ── Project ──
  project: null, isStreaming: false, aiReadyForPreview: false,
  setProject: (p) => set({ project: p }),
  setIsStreaming: (v) => set({ isStreaming: v }),
  setAiReadyForPreview: (v) => set({ aiReadyForPreview: v }),
  resetForNavigation: () => set({
    devPort: null, devStarting: false, devError: null, devCrashed: false, devDegraded: false,
    scaffold: "idle", scaffoldStale: false, scaffoldProgress: null, scaffoldError: null, scaffoldRetries: 0,
    buildJob: null, chapters: [], chStepCounts: {},
    playState: "idle", playStep: null, playSpeed: 1, subVisible: true, autoMode: true,
    previewMode: "preview", floating: false, wholePage: false, iframeKey: 0,
    isStreaming: false, aiReadyForPreview: false,
    previewState: "idle",
    previewStateData: INITIAL_STATE_DATA,
  }),

  // ── State Machine ──
  previewState: "idle",
  previewStateData: INITIAL_STATE_DATA,
  transition: (to, data) => {
    let accepted = false;
    set((s) => {
      try {
        assertTransition(s.previewState, to);
        accepted = true;
      } catch {
        accepted = false;
        return {};
      }
      return {
        previewState: to,
        previewStateData: { ...s.previewStateData, ...data, state: to },
      };
    });
    return accepted;
  },
  resetStateMachine: () => set({
    previewState: "idle",
    previewStateData: INITIAL_STATE_DATA,
  }),
}));
