"use client";

import { create } from "zustand";
import type { ChapterProgress } from "@/components/chapter-progress-panel";
import type { PlaybackStep } from "@/components/playback-bar";
import type { Project } from "@/lib/db/schema";

// ─── Types ───────────────────────────────────────────────────────────────────

type WS = "idle" | "running" | "done" | "error";
type WB = "audio" | "bgm" | "avatar" | "illust-timeline" | "article-layout" | null;

interface DevSlice {
  devPort: number | null;
  devStarting: boolean;
  devError: string | null;
  devCrashed: boolean;
  setDevPort: (port: number | null) => void;
  setDevStarting: (v: boolean) => void;
  setDevError: (e: string | null) => void;
  setDevCrashed: (v: boolean) => void;
}

interface ScaffoldSlice {
  scaffold: WS;
  scaffoldStale: boolean;
  setScaffold: (s: WS) => void;
  setScaffoldStale: (v: boolean) => void;
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
}

export type ProjectStore = DevSlice & ScaffoldSlice & BuildSlice & PlaybackSlice & PreviewSlice & ProjectSlice;

export const useProjectStore = create<ProjectStore>((set) => ({
  // ── Dev ──
  devPort: null, devStarting: false, devError: null, devCrashed: false,
  setDevPort: (port) => set({ devPort: port }),
  setDevStarting: (v) => set({ devStarting: v }),
  setDevError: (e) => set({ devError: e }),
  setDevCrashed: (v) => set({ devCrashed: v }),

  // ── Scaffold ──
  scaffold: "idle", scaffoldStale: false,
  setScaffold: (s) => set({ scaffold: s }),
  setScaffoldStale: (v) => set({ scaffoldStale: v }),

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
}));
