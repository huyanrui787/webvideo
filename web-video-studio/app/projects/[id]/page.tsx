"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DEFAULT_TTS_PROVIDER, DEFAULT_TTS_VOICE, DEFAULT_BGM_TRACK_ID, DEFAULT_BGM_VOLUME } from "@/lib/voice-meta";
import type { Project } from "@/lib/db/schema";
import { TwoColLayout } from "@/components/two-col-layout";
import { ChatPanel } from "@/components/chat-panel";
import { FilePanel } from "@/components/file-panel";
import { InlinePreview } from "@/components/inline-preview";
import { IllustPlayer } from "@/components/illust-player";
import { useIllustrationPipeline } from "./useIllustrationPipeline";
import { PreviewWindow } from "@/components/preview-window";
import { PreviewLifecycleButton } from "@/components/preview-lifecycle-button";
import { useProjectStore } from "@/stores/project-store";
import { PlaybackBar } from "@/components/playback-bar";
import { WysiwygOverlay } from "@/components/wysiwyg-overlay";
import type { WysiwygEditEntry } from "@/components/wysiwyg-overlay";
import { ThemePickerPanel } from "@/components/theme-picker-panel";
import { ProjectStyleEditor } from "@/components/project-style-editor";
import { AudioWorkbench } from "@/components/audio-workbench";
import { BgmWorkbench } from "@/components/bgm-workbench";
import { AvatarWorkbench } from "@/components/avatar-workbench";
import { ModelPickerPanel } from "@/components/model-picker-panel";
import { TokenStatsPanel } from "@/components/token-stats-panel";
import { ArticleLayoutEditor } from "@/components/article-layout-editor";
import { ArticleUploader } from "@/components/article-uploader";
import type { PreferredModel } from "@/lib/db/schema";
import type { ChapterProgress } from "@/components/chapter-progress-panel";
import type { ThemeMeta } from "@/app/api/themes/route";

type WS = "idle" | "running" | "done" | "error";
type WB = "audio" | "bgm" | "avatar" | "article-layout" | null;

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sp = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const iframeContainerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<((text: string) => void) | null>(null);
  const userControlMode = useRef(false);        // user took manual control → suppress auto-triggers
  const prevDevPort = useRef<number | null>(null); // track devPort for crash detection
  const devStartingRef = useRef(false);          // track if user explicitly requested dev server
  const sseGotDevPort = useRef(false);           // SSE has delivered dev port → suppress polling
  const audioSynthTriggered = useRef(false);      // prevent duplicate audio synthesis triggers

  const [pageState, setPageState] = useState<"loading" | "ready" | "error" | "notfound">("loading");
  const [errMsg, setErrMsg] = useState("");

  // ── Store-based state (shared across components) ────────────────────
  const devPort = useProjectStore((s) => s.devPort);
  const devStarting = useProjectStore((s) => s.devStarting);
  const devError = useProjectStore((s) => s.devError);
  const devCrashed = useProjectStore((s) => s.devCrashed);
  const devDegraded = useProjectStore((s) => s.devDegraded);
  const setDevDegraded = useProjectStore((s) => s.setDevDegraded);
  const aiReadyForPreview = useProjectStore((s) => s.aiReadyForPreview);
  const setAiReadyForPreview = useProjectStore((s) => s.setAiReadyForPreview);
  const scaffold = useProjectStore((s) => s.scaffold);
  const scaffoldStale = useProjectStore((s) => s.scaffoldStale);
  const scaffoldProgress = useProjectStore((s) => s.scaffoldProgress);
  const scaffoldError = useProjectStore((s) => s.scaffoldError);
  const scaffoldRetries = useProjectStore((s) => s.scaffoldRetries);
  const setScaffoldProgress = useProjectStore((s) => s.setScaffoldProgress);
  const setScaffoldError = useProjectStore((s) => s.setScaffoldError);
  const incScaffoldRetries = useProjectStore((s) => s.incScaffoldRetries);
  const iframeKey = useProjectStore((s) => s.iframeKey);
  const playState = useProjectStore((s) => s.playState);
  const playStep = useProjectStore((s) => s.playStep);
  const playSpeed = useProjectStore((s) => s.playSpeed);
  const subVisible = useProjectStore((s) => s.subVisible);
  const autoMode = useProjectStore((s) => s.autoMode);
  const chapters = useProjectStore((s) => s.chapters);
  const chStepCounts = useProjectStore((s) => s.chStepCounts);
  const buildJob = useProjectStore((s) => s.buildJob);
  const project = useProjectStore((s) => s.project);
  const isStreaming = useProjectStore((s) => s.isStreaming);
  const previewMode = useProjectStore((s) => s.previewMode);
  const floating = useProjectStore((s) => s.floating);
  const wholePage = useProjectStore((s) => s.wholePage);

  // ── Store setters ────────────────────────────────────────────────────
  const setDevPort = useProjectStore((s) => s.setDevPort);
  const setDevStarting = useProjectStore((s) => s.setDevStarting);
  const setDevError = useProjectStore((s) => s.setDevError);
  const setDevCrashed = useProjectStore((s) => s.setDevCrashed);
  const setScaffold = useProjectStore((s) => s.setScaffold);
  const setScaffoldStale = useProjectStore((s) => s.setScaffoldStale);
  const bumpIframeKey = useProjectStore((s) => s.bumpIframeKey);
  const setPlayState = useProjectStore((s) => s.setPlayState);
  const setPlayStep = useProjectStore((s) => s.setPlayStep);
  const setPlaySpeed = useProjectStore((s) => s.setPlaySpeed);
  const setSubVisible = useProjectStore((s) => s.setSubVisible);
  const setAutoMode = useProjectStore((s) => s.setAutoMode);
  const setChapters = useProjectStore((s) => s.setChapters);
  const setChStepCounts = useProjectStore((s) => s.setChStepCounts);
  const setBuildJob = useProjectStore((s) => s.setBuildJob);
  const setProject = useProjectStore((s) => s.setProject);
  const resetForNavigation = useProjectStore((s) => s.resetForNavigation);
  const setIsStreaming = useProjectStore((s) => s.setIsStreaming);
  const setPreviewMode = useProjectStore((s) => s.setPreviewMode);
  const setFloating = useProjectStore((s) => s.setFloating);
  const setWholePage = useProjectStore((s) => s.setWholePage);
  const [renderSt, setRenderSt] = useState<WS>("idle");
  const [renderProg, setRenderProg] = useState("");
  const [pubSt, setPubSt] = useState<WS>("idle");
  const [miaodaUrl, setMiaodaUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [selEl, setSelEl] = useState<any>(null);
  const [wholeCtx, setWholeCtx] = useState<any>(null);

  const [themeOpen, setThemeOpen] = useState(false);
  const [styleEditorOpen, setStyleEditorOpen] = useState(false);
  const [themeName, setThemeName] = useState("");
  const [themes, setThemes] = useState<ThemeMeta[]>([]);

  const [fileCollapsed, setFileCollapsed] = useState(false);
  const [openTab, setOpenTab] = useState<"article" | "script" | "outline" | "rhythm" | "illustrations" | "source" | null>(null);
  const [fileContents, setFileContents] = useState<Partial<Record<"article" | "script" | "outline" | "rhythm" | "illustrations" | "source", string>>>({});
  const [wb, setWb] = useState<WB>(null);

  // ── Audio / BGM button status indicators ───────────────────────────────
  const [audioBtnStatus, setAudioBtnStatus] = useState<"idle" | "running" | "done">("idle");
  const [bgmBtnStatus, setBgmBtnStatus] = useState<"idle" | "running" | "done">("idle");

  const [autoDone, setAutoDone] = useState(false);
  const [dragAsset, setDragAsset] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Article state (for illustration-video / illustrated-article projects)
  const [hasArticle, setHasArticle] = useState(false);
  const [articleContent, setArticleContent] = useState("");

  // ─── navbar extras: title edit / project switcher / model / tokens ──
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [tokenPanelOpen, setTokenPanelOpen] = useState(false);
  const [tokenTotal, setTokenTotal] = useState(0);

  // ─── fetch project ──────────────────────────────────────────────────
  const prevIdRef = useRef<string | null>(null);
  const load = useCallback(async () => {
    // Stop dev server for the previous project before loading the new one.
    // This prevents Vite process leaks when navigating between projects.
    if (prevIdRef.current && prevIdRef.current !== id) {
      fetch(`/api/projects/${prevIdRef.current}/dev-server`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      }).catch(() => {});
    }
    prevIdRef.current = id;
    try {
      const r = await fetch(`/api/projects/${id}`);
      if (r.status === 401) { router.replace(`/login?next=/projects/${id}`); return; }
      if (r.status === 404) { setPageState("notfound"); return; }
      if (!r.ok) throw new Error("load fail");
      // Reset per-project refs and store on navigation
      resetForNavigation();
      prevDevPort.current = null;
      sseGotDevPort.current = false;
      userControlMode.current = false;
      devStartingRef.current = false;
      startDevSerial.current = 0;
      const d = await r.json(); setProject(d); setThemeName(d.theme ?? ""); setPageState("ready");
    } catch (e: any) { setErrMsg(e.message); setPageState("error"); }
  }, [id, router]);
  useEffect(() => { load(); }, [load]);

  // Stop dev server when leaving this project page entirely (not just switching between projects).
  useEffect(() => {
    return () => {
      fetch(`/api/projects/${id}/dev-server`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      }).catch(() => {});
    };
  }, [id]);

  // ─── SSE event stream — instant state updates without polling ──────────
  useEffect(() => {
    const es = new EventSource(`/api/projects/${id}/events`);
    es.addEventListener("scaffold", (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data);
        setScaffold(d.status);
        if (d.status === "done") { setScaffoldError(null); setScaffoldProgress(null); }
        if (d.error) setScaffoldError(d.error);
      } catch {}
    });
    es.addEventListener("scaffold-progress", (e: MessageEvent) => {
      try { const d = JSON.parse(e.data); setScaffoldProgress(d); } catch {}
    });
    es.addEventListener("dev-server", (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data);
        if (d.port) { sseGotDevPort.current = true; setDevPort(d.port); setDevStarting(false); setDevError(null); setDevCrashed(false); setDevDegraded(d.degraded ?? false); }
        else setDevPort(null);
      } catch {}
    });
    es.addEventListener("dev-stderr", (e: MessageEvent) => {
      // Vite stderr — only treat as error if it looks like a compile error,
      // not warnings or info messages
      try {
        const d = JSON.parse(e.data);
        if (d.error && /error|Error|ERROR/.test(d.error)) setDevError(d.error);
      } catch {}
    });
    es.addEventListener("build", (e: MessageEvent) => {
      try { const d = JSON.parse(e.data); setBuildJob((prev) => prev ? { ...prev, ...d } : d); } catch {}
    });
    es.addEventListener("status-change", (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data);
        setProject((prev: any) => prev ? { ...prev, status: d.status } : prev);
        if (d.status === "done") {
          setBuildJob((prev: any) => prev ? { ...prev, status: "done" } : null);
          // Only trigger once — prevent feedback loop from repeated done events
          if (!audioSynthTriggered.current) triggerAudioSynthesis();
        }
      } catch {}
    });
    // SSR event handler calls this — project is guaranteed loaded at this point
    function triggerAudioSynthesis() {
      if (audioSynthTriggered.current) return;
      audioSynthTriggered.current = true;
      const provider = project?.ttsProvider || DEFAULT_TTS_PROVIDER;
      const voice = project?.ttsVoice || DEFAULT_TTS_VOICE;
      fetch(`/api/projects/${id}/synthesize`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extract", provider, voice }),
      }).then(() => {
        fetch(`/api/projects/${id}/synthesize`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, voice }),
        }).catch(() => {});
      }).catch(() => {});
    }
    es.addEventListener("chapter-built", (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data);
        setChapters((prev: any[]) => {
          const next = [...(prev || [])];
          const idx = next.findIndex((c: any) => c.id === d.chapterId);
          if (idx >= 0) next[idx] = { ...next[idx], status: "done" as const };
          else next.push({ id: d.chapterId, title: d.title || d.chapterId, status: "done" as const });
          return next;
        });
      } catch {}
    });
    es.addEventListener("render", (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data);
        setRenderSt(d.status as WS);
        if (d.progress) setRenderProg(d.progress);
      } catch {}
    });
    es.addEventListener("illustrations-ready", (e: MessageEvent) => {
      // Pipeline handled by useIllustrationPipeline hook
    });
    es.onerror = () => { /* SSE reconnect is automatic */ };
    return () => es.close();
  }, [id]);

  // ─── audio synthesis: trigger on page load when project is already done ──
  // Separate effect because project loads async and SSE effect depends only on [id].
  useEffect(() => {
    if (project?.status !== "done") return;
    if (audioSynthTriggered.current) return;
    audioSynthTriggered.current = true;
    const provider = project?.ttsProvider || DEFAULT_TTS_PROVIDER;
    const voice = project?.ttsVoice || DEFAULT_TTS_VOICE;
    // Step 1: extract narrations → audio-segments.json (required by synthesize-audio)
    fetch(`/api/projects/${id}/synthesize`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "extract", provider, voice }),
    }).then(() => {
      // Step 2: synthesize audio from extracted segments
      fetch(`/api/projects/${id}/synthesize`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, voice }),
      }).catch(() => {});
    }).catch(() => {});
  }, [project?.status, project?.projectType, project?.ttsProvider, project?.ttsVoice, id]);

  // ─── dev polling — immediate fetch + exponential backoff fallback ──────
  useEffect(() => {
    let ok = true;
    let attempts = 0;

    const poll = async () => {
      if (!ok || sseGotDevPort.current) return;
      try {
        const r = await fetch(`/api/projects/${id}/dev-server`);
        const d = await r.json();
        if (!ok || sseGotDevPort.current) return;
        attempts++;
        if (d.ready && d.port) {
          setDevPort(d.port); setDevStarting(false); setDevError(null); setDevCrashed(false); setDevDegraded(d.degraded ?? false);
          devStartingRef.current = false;
          prevDevPort.current = d.port;
          sseGotDevPort.current = true;
          return;
        }
        if (prevDevPort.current !== null && !d.ready) {
          setDevCrashed(true);
          // Auto-restart on crash (up to 3 times, tracked by server)
          fetch(`/api/projects/${id}/dev-server/restart`, { method: "POST" }).catch(() => {});
        }
        // Only retry if port not yet known and not too many attempts
        if (attempts >= 15) { setDevError("开发服务器启动超时"); return; }
        const delay = Math.min(1000 * Math.pow(2, Math.min(attempts - 1, 4)), 16000);
        if (ok && !sseGotDevPort.current) setTimeout(poll, delay);
      } catch {
        if (ok && !sseGotDevPort.current) setTimeout(poll, 8000);
      }
    };

    // Immediate fetch on mount
    poll();

    return () => { ok = false; };
  }, [id]);

  const startDevSerial = useRef(0);
  const startDev = useCallback(async () => {
    const serial = ++startDevSerial.current;
    setDevStarting(true); setDevError(null); setDevCrashed(false); setDevDegraded(false); setAiReadyForPreview(false);
    devStartingRef.current = true;
    sseGotDevPort.current = false;
    try {
      const r = await fetch(`/api/projects/${id}/dev-server`, { method: "POST" });
      if (serial !== startDevSerial.current) return; // stale — ignore
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        if (serial === startDevSerial.current && (d.port || d.noDevServer)) { setDevPort(d.port ?? null); setDevStarting(false); }
      } else if (r.status !== 409) {
        const d = await r.json().catch(() => ({}));
        if (serial === startDevSerial.current) setDevError(d.error ?? "fail");
      }
    } catch {
      if (serial !== startDevSerial.current) return;
      setDevError("network");
    }
    if (serial === startDevSerial.current) setDevStarting(false);
  }, [id]);

  const stopDev = useCallback(async () => {
    setDevPort(null);
    fetch(`/api/projects/${id}/dev-server`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" }),
    }).catch(() => {});
  }, [id]);

  const startScaffold = useCallback(async () => {
    incScaffoldRetries();
    setScaffoldError(null);
    try {
      await fetch(`/api/projects/${id}/scaffold`, { method: "POST" });
    } catch { /* SSE will update scaffold status */ }
  }, [id, incScaffoldRetries, setScaffoldError]);

  const takeManualControl = useCallback(() => {
    userControlMode.current = true;
  }, []);

  // Reset manual control when project reaches a new phase (user likely wants auto again)
  useEffect(() => {
    if (project?.status === "writing") userControlMode.current = false;
  }, [project?.status]);

  // Audio synthesis is now auto-triggered by SSE chapter-built events (unified source of truth)

  // ─── Catch-up audio & bgm: detect already-built chapters missing audio ─
  // ─── Catch-up audio & bgm: detect already-built chapters missing audio ─
  const audioCatchupTriggered = useRef(false);
  useEffect(() => {
    if (audioCatchupTriggered.current) return;
    if (project?.status !== "done" && project?.status !== "building") return;

    // Check chapters from all sources (memory + filesystem)
    const memTotal = chapters.length > 0 ? chapters.length : (buildJob?.chapters?.length ?? 0);
    if (memTotal > 0) {
      triggerCatchup();
    } else {
      // Check filesystem via files-tree API (read-only, lists presentation/src/)
      fetch(`/api/projects/${id}/files-tree`)
        .then(r => r.json())
        .then(d => {
          const chaptersNode = d.tree?.find((n: any) => n.name === "chapters");
          const count = chaptersNode?.children?.length ?? 0;
          if (count > 0) triggerCatchup();
        })
        .catch(() => {});
    }

    function triggerCatchup() {
      if (audioCatchupTriggered.current) return;
      audioCatchupTriggered.current = true;

      const provider = project?.ttsProvider || DEFAULT_TTS_PROVIDER;
      const voice = project?.ttsVoice || DEFAULT_TTS_VOICE;
      fetch(`/api/projects/${id}/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, voice }),
      }).catch(() => {});

      fetch(`/api/projects/${id}/bgm`)
        .then(r => r.json())
        .then(d => {
          if (!d.configured) {
            fetch(`/api/projects/${id}/bgm`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trackId: DEFAULT_BGM_TRACK_ID, trackName: "默认配乐（轻快叙事）", volume: DEFAULT_BGM_VOLUME }),
            }).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [project?.status, chapters.length, buildJob?.chapters?.length, project?.ttsVoice, project?.ttsProvider, project?.projectType, id]);

  // ─── scaffold ───────────────────────────────────────────────────────
  useEffect(() => {
    let ok = true;
    const loop = async () => {
      if (!ok) return;
      try {
        const r = await fetch(`/api/projects/${id}/scaffold`);
        const d = await r.json();
        if (!ok) return;
        setScaffold(d.status as WS);
        if (d.status === "done" || d.status === "error") return; // stop once done/error
      } catch {}
      if (ok) setTimeout(loop, 5000);
    };
    loop();
    return () => { ok = false; };
  }, [id]);

  // ─── scaffold (now auto-triggered server-side by ProjectSetStatus("building")) ──

  // ─── build ──────────────────────────────────────────────────────────
  useEffect(() => {
    let ok = true;
    const loop = async () => {
      if (!ok) return;
      try {
        const r = await fetch(`/api/projects/${id}/build-parallel`);
        const d = await r.json();
        if (!ok) return;
        if (d.status !== "idle") setBuildJob(d);
        if (d.status !== "running") return; // stop when not running
      } catch {}
      if (ok) setTimeout(loop, 3000);
    };
    loop();
    return () => { ok = false; };
  }, [id]);

  // ─── render poll ────────────────────────────────────────────────────
  useEffect(() => {
    if (renderSt !== "running") return;
    let ok = true;
    const poll = async () => {
      if (!ok) return;
      try {
        const r = await fetch(`/api/projects/${id}/render`);
        const d = await r.json();
        if (!ok) return;
        setRenderProg(d.progress ?? "");
        if (d.status === "done") setRenderSt("done");
        else if (d.status === "error") setRenderSt("error");
        else setTimeout(poll, 2000);
      } catch {}
    };
    poll();
    return () => { ok = false; };
  }, [id, renderSt]);

  // ─── themes ─────────────────────────────────────────────────────────
  useEffect(() => { fetch("/api/themes").then(r => r.json()).then(setThemes).catch(() => {}); }, []);

  // ─── projects list (for switcher) ────────────────────────────────────
  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then((list: Project[]) => setProjectsList(list || [])).catch(() => {});
  }, [id]);

  // ─── token summary (for badge) ───────────────────────────────────────
  useEffect(() => {
    fetch(`/api/projects/${id}/token-usage`)
      .then(r => r.json())
      .then(d => { if (d?.summary) setTokenTotal(d.summary.reduce((s: number, r: any) => s + r.totalTokens, 0)); })
      .catch(() => {});
  }, [id]);

  // ─── audio / bgm status polling for toolbar button indicators ─────────
  const MAX_AUDIO_POLLS = 120; // ~10 min; stop after project done or limit reached
  useEffect(() => {
    let ok = true;
    let polls = 0;
    const poll = async () => {
      if (!ok) return;
      try {
        const r = await fetch(`/api/projects/${id}/audio-status`);
        if (!ok || !r.ok) return;
        polls++;
        const d = await r.json();
        if (d.global.running) setAudioBtnStatus("running");
        else if (d.global.total > 0 && d.global.done === d.global.total) setAudioBtnStatus("done");
        else setAudioBtnStatus("idle");
      } catch { /* ignore */ }
      if (ok && polls < MAX_AUDIO_POLLS) setTimeout(poll, 5000);
    };
    poll();
    return () => { ok = false; };
  }, [id]);

  useEffect(() => {
    let ok = true;
    let polls = 0;
    const poll = async () => {
      if (!ok) return;
      try {
        const r = await fetch(`/api/projects/${id}/bgm`);
        if (!ok || !r.ok) return;
        polls++;
        const d = await r.json();
        if (d.aiGen?.status === "running") setBgmBtnStatus("running");
        else if (d.configured) setBgmBtnStatus("done");
        else setBgmBtnStatus("idle");
      } catch { /* ignore */ }
      if (ok && polls < MAX_AUDIO_POLLS) setTimeout(poll, 5000);
    };
    poll();
    return () => { ok = false; };
  }, [id]);

  // ─── project files ──────────────────────────────────────────────────
  const isIllustType = project?.projectType === "illustration-video" || project?.projectType === "illustrated-article" || project?.projectType === "animation-video";
  const fileMap: Array<{tab: "article" | "script" | "outline" | "rhythm" | "illustrations" | "source"; path: string}> = [
    { tab: "article", path: "article.md" },
    ...(isIllustType ? [] : [
      { tab: "rhythm" as const, path: "rhythm.md" },
      { tab: "outline" as const, path: "outline.md" },
      { tab: "source" as const, path: "source" },
    ]),
    { tab: "script", path: "script.md" },
    { tab: "illustrations", path: "illustrations.json" },
  ];
  const loadFiles = useCallback(async () => {
    const result: typeof fileContents = {};
    for (const f of fileMap) {
      try {
        const r = await fetch(`/api/projects/${id}/files?path=${encodeURIComponent(f.path)}`);
        if (r.ok) { const d = await r.json(); if (d.content != null) result[f.tab] = d.content; }
      } catch {}
    }
    setFileContents(result);
    // Sync article state for illustration projects
    if (result.article) { setHasArticle(true); setArticleContent(result.article); }
  }, [id]);
  useEffect(() => {
    loadFiles();
    // Refresh files every 10 seconds regardless of openTab state
    const interval = setInterval(() => { loadFiles(); }, 10000);
    return () => { clearInterval(interval); };
  }, [id, loadFiles]);

  // ─── autostart: AI begins building (only on fresh projects) ────────────
  const idRef = useRef(id);
  idRef.current = id;
  useEffect(() => {
    if (sp.get("autostart") !== "1" || autoDone || pageState !== "ready") return;
    const t = setTimeout(async () => {
      // Only autostart if no existing chat messages — prevents duplicate
      // messages and the misleading "interrupted" recovery banner.
      try {
        const r = await fetch(`/api/projects/${idRef.current}/chat`);
        const d = await r.json();
        if (d?.messages?.length > 0) { setAutoDone(true); return; }
      } catch { /* proceed with autostart if check fails */ }
      triggerRef.current?.("请读取 article.md 并开始制作视频");
      setAutoDone(true);
    }, 1000);
    return () => clearTimeout(t);
  }, [sp, autoDone, pageState]);

  // ─── auto-start dev server on mount if scaffold/project is done ──────
  const autoStartedDev = useRef(false);
  useEffect(() => {
    if (autoStartedDev.current) return;
    const pt = project?.projectType;
    if (!pt) return;
    // Illustration projects use IllustPlayer, not Vite dev server
    const isIllust = pt === "illustration-video" || pt === "illustrated-article";
    if (isIllust) return;

    // If project is already done, start dev server immediately
    if (project?.status === "done") {
      autoStartedDev.current = true;
      startDev();
      return;
    }

    // Otherwise wait for scaffold to finish
    fetch(`/api/projects/${id}/scaffold`).then(r => r.json()).then(d => {
      if (d.status === "done" && !autoStartedDev.current) {
        autoStartedDev.current = true;
        startDev();
      }
    }).catch(() => {});
  }, [id, startDev, project?.projectType, project?.status]);

  // ══════════════════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════════════════
  // Illustration-video auto-pipeline — system-driven, no AI signals needed
  // Flow: writing → (AI plans shots → illustrations.json) → (system generates
  // images via API directly) → (AI builds chapters with embedded images)
  // ══════════════════════════════════════════════════════════════════════
  const isIllust = project?.projectType === "illustration-video" || project?.projectType === "illustrated-article" || project?.projectType === "animation-video";
  const projectRef = useRef(project);
  projectRef.current = project;
  const isAnimMode = project?.projectType === "animation-video";
  const { illGenRunning, illGenProgress, illGenShots, doneRef: autoGenDoneRef } = useIllustrationPipeline(
    id, isIllust, isAnimMode ? "anim" : "illust",
  );
  // ─── floating ───────────────────────────────────────────────────────
  const openFloating = useCallback(() => setFloating(true), []);
  const closeFloating = useCallback(() => setFloating(false), []);

  // ─── actions ────────────────────────────────────────────────────────
  const build = useCallback(async () => {
    try { await fetch(`/api/projects/${id}/build-parallel`, { method: "POST" }); } catch {}
  }, [id]);

  const render = useCallback(async () => {
    setRenderSt("running");
    try { await fetch(`/api/projects/${id}/render`, { method: "POST" }); } catch { setRenderSt("error"); }
  }, [id]);

  const publish = useCallback(async () => {
    setPubSt("running");
    try {
      const r = await fetch(`/api/projects/${id}/publish`, { method: "POST" });
      const d = await r.json();
      if (d.url) setMiaodaUrl(d.url);
      setPubSt("done");
    } catch { setPubSt("error"); }
  }, [id]);

  const copy = useCallback(async () => {
    if (!miaodaUrl) return;
    await navigator.clipboard.writeText(miaodaUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }, [miaodaUrl]);

  const share = useCallback(async () => {
    if (miaodaUrl) { copy(); return; }
    try {
      const r = await fetch(`/api/projects/${id}/publish`, { method: "POST" });
      const d = await r.json();
      if (d.url) { setMiaodaUrl(d.url); setPubSt("done"); await navigator.clipboard.writeText(d.url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch {}
  }, [id, miaodaUrl, copy]);

  // ─── article ──────────────────────────────────────────────────────────
  const onArticleUploaded = useCallback((content: string) => {
    setArticleContent(content);
    setHasArticle(true);
    setFileContents(prev => ({ ...prev, article: content }));
    // Auto-trigger full illustration-video pipeline — zero user prompts needed
    setTimeout(() => {
      triggerRef.current?.(
        "请执行绘图视频全自动流程：\n" +
        "1. 读 article.md → 写 script.md（口播稿，--- 分隔节拍，20-50 个节拍）\n" +
        "2. 为每个节拍设计 1 张 16:9 全屏插画 → 写入 illustrations.json\n" +
        "3. 系统检测到文件后自动生图和配音\n" +
        "4. 完成后系统通知你 → 调用 ProjectSetStatus('done')\n" +
        "全程自动，不等待确认。"
      );
    }, 1000);
  }, []);

  // ─── postMessage helper ──────────────────────────────────────────────
  const post = useCallback((msg: any) => {
    iframeRef.current?.contentWindow?.postMessage(msg, "*");
  }, []);

  // ─── wysiwyg edit ────────────────────────────────────────────────────
  const onSendToIframe = useCallback((msg: object) => { post(msg); }, [post]);

  const onCommitEdit = useCallback(async (entry: WysiwygEditEntry) => {
    try {
      await fetch(`/api/projects/${id}/wysiwyg-edits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
    } catch {}
  }, [id]);

  const onDeleteEdit = useCallback(async (key: string) => {
    try {
      await fetch(`/api/projects/${id}/wysiwyg-edits?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
    } catch {}
  }, [id]);

  const onResetEdit = useCallback(async (entry: Pick<WysiwygEditEntry, "chapter" | "step" | "selector" | "selectorIndex">) => {
    try {
      await fetch(`/api/projects/${id}/wysiwyg-edits?key=${encodeURIComponent(`${entry.chapter}:${entry.step}:${entry.selector}:${entry.selectorIndex}`)}`, {
        method: "DELETE",
      });
    } catch {}
  }, [id]);

  // ─── playback ───────────────────────────────────────────────────────
  const togglePlayback = useCallback(() => {
    console.log("[page] togglePlayback", { playState, autoMode });
    if (playState === "playing") { setPlayState("paused"); post({ type: "pause" }); }
    else { setPlayState("playing"); post(autoMode ? { type: "start-auto" } : { type: "start-manual" }); }
  }, [post, playState, autoMode]);
  const pause = useCallback(() => { console.log("[page] pause"); setPlayState("paused"); post({ type: "pause" }); }, [post]);
  const prevCh = useCallback(() => { post({ type: "prev-chapter" }); }, [post]);
  const nextCh = useCallback(() => { post({ type: "next-chapter" }); }, [post]);
  const setSpeed = useCallback((rate: number) => { setPlaySpeed(rate); post({ type: "set-speed", rate }); }, [post]);
  const refresh = useCallback(() => bumpIframeKey(), [bumpIframeKey]);
  const fullscreen = useCallback(() => iframeRef.current?.requestFullscreen?.(), []);
  const seek = useCallback((ch: number, step: number) => { post({ type: "seek-to-step", chapter: ch, step }); }, [post]);
  const toggleAutoMode = useCallback(() => {
    const next = !autoMode;
    console.log("[page] toggleAutoMode", { next });
    setAutoMode(next);
    post(next ? { type: "start-auto" } : { type: "start-manual" });
  }, [post, autoMode, setAutoMode]);

  // ─── edit mode sync ──────────────────────────────────────────────────
  useEffect(() => {
    post({ type: previewMode === "edit" ? "edit-mode" : "exit-edit-mode" });
  }, [previewMode, post]);

  // ─── iframe msgs ────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: MessageEvent) => {
      // Only accept messages from our own iframe (localhost with known port)
      if (!e.origin.startsWith("http://localhost:") && !e.origin.startsWith("http://127.0.0.1:")) return;
      const d = e.data; if (!d || typeof d !== "object") return;
      switch (d.type) {
        case "step-changed": { const p = d.data ?? d; setPlayStep(p); break; }
        case "playback-ended": setPlayState("ended"); break;
        case "playback-started": setPlayState("playing"); break;
        case "playback-paused": setPlayState("paused"); break;
        case "chapter-list": { const list = d.data ?? d; if (Array.isArray(list)) { setChapters(list); const counts: Record<number, number> = {}; list.forEach((c: any, i: number) => { counts[i] = (c.stepCount ?? c.narrations?.length ?? 1) - 1; }); setChStepCounts(counts); } else if (Array.isArray(d.chapters)) { setChapters(d.chapters); if (d.stepCounts) setChStepCounts(d.stepCounts); } break; }
        case "chapters-info": { const list = d.data ?? d; if (Array.isArray(list)) { setChapters(list); const counts: Record<number, number> = {}; list.forEach((c: any, i: number) => { counts[i] = (c.stepCount ?? c.narrations?.length ?? 1) - 1; }); setChStepCounts(counts); } break; }
        case "presentation-end": setPlayState("ended"); break;
        case "element-selected": { const p = d.data ?? d; setSelEl({ tagName: p.tagName, className: p.className, textContent: p.textContent, chapterId: p.chapterId, stepIndex: p.stepIndex, xpath: p.xpath, selectorIndex: p.selectorIndex, rect: p.rect }); setWholeCtx(null); break; }
        case "whole-page-selected": { const p = d.data ?? d; setWholeCtx({ chapterId: p.chapterId, chapterTitle: p.chapterTitle, stepIndex: p.stepIndex }); setSelEl(null); setWholePage(true); break; }
      }
    };
    window.addEventListener("message", fn);
    return () => window.removeEventListener("message", fn);
  }, []);

  // ─── ckpt ───────────────────────────────────────────────────────────
  const onCkpt = useCallback(async (opts: { theme: string; devMode: "sequential" | "parallel"; orientation: "landscape" | "portrait" }) => {
    try {
      // 1. Save project settings
      const r = await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(opts) });
      if (r.ok) { const u = await r.json(); setProject(u); setThemeName(opts.theme); }
      // 2. Auto-transition to building — no longer depends on AI calling ProjectSetStatus
      await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "building" }) });
      setProject((p: any) => p ? { ...p, status: "building" } : p);
      // 3. Auto-trigger scaffold — one-click flow
      fetch(`/api/projects/${id}/scaffold`, { method: "POST" }).catch(() => {});
    } catch {}
  }, [id]);

  const onStreamEnd = useCallback(async () => {
    try { const r = await fetch(`/api/projects/${id}`); if (r.ok) setProject(await r.json()); } catch {}
    loadFiles();
  }, [id, loadFiles]);

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false); setDragAsset(false);
    const aid = e.dataTransfer.getData("text/plain"); if (!aid) return;
    try { await fetch(`/api/projects/${id}/assets/from-library`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assetId: aid }) }); } catch {}
  }, [id]);

  const onThemePick = useCallback(async (theme: string) => {
    try {
      await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme }) });
      setThemeName(theme); setProject(p => p ? { ...p, theme } : null); setThemeOpen(false);
    } catch {}
  }, [id]);

  const onSaveFile = useCallback(async (tab: "script" | "outline", content: string) => {
    const map: Record<string, string> = { script: "script.md", outline: "outline.md" };
    const path = map[tab]; if (!path) return;
    try { await fetch(`/api/projects/${id}/files?path=${encodeURIComponent(path)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }); } catch {}
  }, [id]);

  // ─── navbar callbacks ─────────────────────────────────────────────────
  const onTitleSave = useCallback(async () => {
    const trimmed = (titleDraft ?? "").trim();
    if (!trimmed || trimmed === project?.title) { setEditingTitle(false); return; }
    try {
      const r = await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: trimmed }) });
      if (r.ok) { const u = await r.json(); setProject(u); }
    } catch {}
    setEditingTitle(false);
  }, [id, titleDraft, project?.title]);

  const onModelConfirm = useCallback(async (model: string) => {
    try {
      const r = await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model }) });
      if (r.ok) { const u = await r.json(); setProject(u); }
    } catch {}
  }, [id]);

  // ─── loading / error / notfound ─────────────────────────────────────
  if (pageState === "loading") return <div className="h-screen bg-base flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-bd border-t-accent rounded-full" /></div>;
  if (pageState === "notfound") return <div className="h-screen bg-base flex items-center justify-center"><div className="text-center max-w-sm"><p className="text-lg font-semibold text-t1 mb-2">项目不存在</p><Link href="/studio" className="inline-block rounded-xl bg-accent px-6 py-2 text-sm font-medium text-white hover:opacity-90">返回首页</Link></div></div>;
  if (pageState === "error") return <div className="h-screen bg-base flex items-center justify-center"><div className="text-center max-w-sm"><p className="text-red-500 text-sm mb-4">{errMsg}</p><button onClick={load} className="rounded-xl bg-accent px-6 py-2 text-sm font-medium text-white">重试</button></div></div>;
  if (!project) return null;

  const hasPreview = devPort !== null;
  const buildStatus: "idle" | "running" | "done" | "error" =
    buildJob?.status === "running" ? "running" :
    buildJob?.status === "done" ? "done" :
    buildJob?.status === "error" || buildJob?.status === "partial" ? "error" :
    "idle";
  const doneChapters = buildJob?.chapters?.filter((c: any) => c.status === "done").length ?? 0;
  const totalChapters = buildJob?.chapters?.length ?? 1;
  const buildErrorChapters = buildJob?.chapters?.filter((c: any) => c.status === "error" || c.status === "timeout").length ?? 0;

  // Merge chapters: prefer iframe-based, fallback to buildJob during build phase
  const displayChapters: ChapterProgress[] =
    chapters.length > 0 ? chapters
    : buildJob?.chapters?.map((c: any) => ({
        id: c.id,
        title: c.title ?? c.id,
        status: c.status as ChapterProgress["status"],
        error: c.error,
        tscErrors: c.tscErrors,
      })) ?? [];

  const MODEL_SHORT_LABELS: Record<string, string> = {
    "deepseek-chat": "DS V3", "deepseek-reasoner": "DS R1", "deepseek-v4-flash": "DS V4 Flash",
    "deepseek-v4-pro": "DS V4 Pro", "claude-sonnet-4-6": "Sonnet", "claude-opus-4-8": "Opus",
  };

  function fmtTokens(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
    return String(n);
  }

  const Navbar = (
    <div className="flex items-center justify-between px-4 h-12 border-b border-bd">
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/studio" className="text-t3 hover:text-t1 shrink-0" title="返回首页">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 14l-5-5 5-5"/></svg>
        </Link>

        {/* Editable title */}
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={onTitleSave}
            onKeyDown={e => { if (e.key === "Enter") onTitleSave(); if (e.key === "Escape") setEditingTitle(false); }}
            className="text-sm font-semibold text-t1 bg-surface border border-bd rounded-lg px-2 py-1 outline-none focus:border-brand/50 min-w-0 w-48"
          />
        ) : (
          <button
            className="flex items-center gap-1.5 text-sm font-semibold text-t1 truncate hover:text-brand-text transition-colors group"
            onClick={() => { setTitleDraft(project?.title ?? ""); setEditingTitle(true); }}
            title="点击编辑标题"
          >
            <span className="truncate">{project.title}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-t4 opacity-0 group-hover:opacity-100 transition-opacity"><path d="M8 1.5l2.5 2.5-6 6L1 10.5l.5-3.5z"/></svg>
          </button>
        )}

        {/* Status badge */}
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium ${
          project.status === "done" ? "bg-green-400/10 text-green-400"
          : project.status === "building" || project.status === "illustrating" || project.status === "typesetting" || project.status === "audio" ? "bg-blue-400/10 text-blue-400"
          : project.status === "writing" || project.status === "plan_checkpoint" || project.status === "illustration_planning" || project.status === "audio_checkpoint" ? "bg-brand-subtle text-brand-text"
          : "bg-surface2 text-t3"
        }`}>
          {project.status === "writing" ? "写作中"
            : project.status === "plan_checkpoint" ? "计划确认"
            : project.status === "illustration_planning" ? "插图规划"
            : project.status === "building" ? "构建中"
            : project.status === "illustrating" ? "插图中"
            : project.status === "typesetting" ? "排版中"
            : project.status === "audio_checkpoint" ? "音频确认"
            : project.status === "audio" ? "音频合成"
            : project.status === "done" ? "已完成"
            : project.status}
        </span>
        {isStreaming && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />}

        {/* Separator */}
        <span className="w-px h-4 bg-bd shrink-0" />

        {/* Model picker */}
        <button
          onClick={() => setModelPickerOpen(true)}
          className="text-[11px] px-2 py-0.5 rounded-full shrink-0 bg-brand/10 text-brand-text hover:bg-brand/10 transition-colors flex items-center gap-1"
          title="切换模型"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="5.5" r="4"/><path d="M5.5 1.5v8M1.5 5.5h8"/></svg>
          {MODEL_SHORT_LABELS[project.model ?? ""] ?? project.model}
        </button>

        {/* Token badge */}
        <button
          onClick={() => setTokenPanelOpen(true)}
          className="text-[11px] px-2 py-0.5 rounded-full shrink-0 bg-brand-subtle text-brand-text hover:bg-brand-hover/20 transition-colors flex items-center gap-1"
          title="Token 消耗"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><polyline points="1.5,7.5 4,3.5 6.5,7 8.5,2.5"/><polyline points="6.5,2.5 9,2.5 8.5,5.5"/></svg>
          {fmtTokens(tokenTotal)}
        </button>

        {/* Project switcher */}
        <div className="relative shrink-0">
          <button
            onClick={() => setSwitcherOpen(v => !v)}
            className="text-[11px] px-2 py-0.5 rounded-full bg-surface2 border border-bd text-t3 hover:text-t1 hover:border-bd-hover transition-colors flex items-center gap-1"
            title="切换项目"
          >
            切换
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="2,3 4,5 6,3"/></svg>
          </button>
          {switcherOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setSwitcherOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-40 bg-modal border border-bd rounded-xl shadow-md w-64 max-h-72 overflow-y-auto py-1">
                {projectsList.length === 0 ? (
                  <p className="text-xs text-t3 px-3 py-4 text-center">暂无项目</p>
                ) : (
                  projectsList.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { router.push(`/projects/${p.id}`); setSwitcherOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-surface2 transition-colors truncate flex items-center gap-2 ${p.id === id ? "bg-brand/10 text-brand-text font-medium" : "text-t1"}`}
                    >
                      <span className="truncate flex-1">{p.title}</span>
                      {p.id === id && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="2,6 5,9 10,3"/></svg>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {scaffold === "done" && project.status !== "done" && (
          <button onClick={build} disabled={buildJob?.status === "running"}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              buildJob?.status === "running"
                ? "text-t3 bg-surface border border-bd cursor-default"
                : "bg-brand text-white hover:bg-brand-hover"
            }`}>
            {buildJob?.status === "running" ? "构建中…" : "构建"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {themeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setThemeOpen(false)}>
          <div className="bg-modal border border-bd rounded-2xl shadow-2xl p-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <ThemePickerPanel themes={themes} selected={project.theme ?? "midnight-press"} onSelect={onThemePick} onClose={() => setThemeOpen(false)} />
          </div>
        </div>
      )}

      {styleEditorOpen && (
        <ProjectStyleEditor projectId={id} onClose={() => setStyleEditorOpen(false)} />
      )}

      {modelPickerOpen && (
        <ModelPickerPanel current={project.model as PreferredModel} onConfirm={onModelConfirm} onClose={() => setModelPickerOpen(false)} title="选择主模型" subtitle="用于对话、规划、脚本生成" />
      )}

      {tokenPanelOpen && (
        <TokenStatsPanel projectId={id} onClose={() => setTokenPanelOpen(false)} />
      )}

      {wb && <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setWb(null)} />}
      {wb === "audio" && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 bg-modal border-l border-bd shadow-2xl overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-bd sticky top-0 bg-modal z-10"><span className="text-sm font-semibold text-t1">语音合成</span><button onClick={() => setWb(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-t3 hover:text-t1 hover:bg-surface2 transition-colors"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg></button></div>
          <AudioWorkbench projectId={id} ttsVoice={project.ttsVoice} ttsProvider={project.ttsProvider} onSynthDone={load} onSkip={() => setWb(null)} />
        </div>
      )}
      {wb === "bgm" && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 bg-modal border-l border-bd shadow-2xl overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-bd sticky top-0 bg-modal"><span className="text-sm font-semibold text-t1">背景音乐</span><button onClick={() => setWb(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-t3 hover:text-t1 hover:bg-surface2 transition-colors"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg></button></div>
          <BgmWorkbench projectId={id} projectTitle={project.title} />
        </div>
      )}
      {wb === "avatar" && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 bg-modal border-l border-bd shadow-2xl overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-bd sticky top-0 bg-modal"><span className="text-sm font-semibold text-t1">数字人</span><button onClick={() => setWb(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-t3 hover:text-t1 hover:bg-surface2 transition-colors"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg></button></div>
          <AvatarWorkbench projectId={id} />
        </div>
      )}

      {wb === "article-layout" && (
        <div className="fixed inset-y-0 right-0 z-50 w-[42rem] max-w-[90vw] bg-modal border-l border-bd shadow-2xl overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-bd sticky top-0 bg-modal">
            <span className="text-sm font-semibold text-t1">图文排版</span>
            <button onClick={() => setWb(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-t3 hover:text-t1 hover:bg-surface2 transition-colors"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg></button>
          </div>
          <ArticleLayoutEditor projectId={id} />
        </div>
      )}

      <TwoColLayout
        defaultPanelWidthRatio={0.6}
        navbar={
          <>
            {Navbar}
            {buildJob?.status === "running" && (
              <div className="h-[2px] bg-surface2"><div className="h-full bg-brand transition-all duration-500" style={{ width: `${(doneChapters / totalChapters) * 100}%` }} /></div>
            )}
          </>
        }
        main={
          <div className="flex flex-col h-full">
            {hasPreview && displayChapters.length > 0 && (
              <PlaybackBar step={playStep} playbackState={playState} speed={playSpeed} totalChapters={chapters.length}
                onPlay={togglePlayback} onPause={pause} onPrevChapter={prevCh} onNextChapter={nextCh} onSpeedChange={setSpeed} />
            )}
            {/* Article uploader — for illustration projects in writing phase */}
            {(project.projectType === "illustration-video" || project.projectType === "illustrated-article" || project.projectType === "animation-video") &&
              project.status === "writing" && !hasArticle && (
              <div className="shrink-0 border-b border-bd bg-surface px-4 py-3">
                <ArticleUploader projectId={id} hasArticle={hasArticle} onUploaded={onArticleUploaded} />
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <ChatPanel projectId={id} projectTitle={project.title} devPort={devPort}
                illGenRunning={illGenRunning} illGenProgress={illGenProgress} illGenShots={illGenShots}
                onRegisterTrigger={fn => { triggerRef.current = fn; }}
                selectedElement={selEl} wholePageContext={wholeCtx}
                onCheckpointConfirmed={onCkpt}
                onDevServerNeeded={() => {
                  if (userControlMode.current) {
                    setAiReadyForPreview(true);  // just flag — user will click button
                  } else {
                    startDev();                   // auto-start
                  }
                }}
                onStreamEnd={onStreamEnd} onStreamingChange={setIsStreaming}
                onBuildingStart={() => {
                  setBuildJob({ status: "running", chapters: [] });
                  if (userControlMode.current) {
                    setAiReadyForPreview(true);  // just flag — user will click button
                  } else {
                    fetch(`/api/projects/${id}/scaffold`, { method: "POST" }).catch(() => {});
                  }
                }}
                onProjectDone={load} onAudioCheckpoint={load}
                onIllustrationDone={() => { load(); }}
                onRebuildChapter={() => { fetch(`/api/projects/${id}/build-parallel`, { method: "POST" }).catch(() => {}); }}
                chapters={displayChapters} onChaptersChange={setChapters}
                projectFormat={project.projectFormat as any}
              />
            </div>
          </div>
        }
        preview={isIllust ? (
          <IllustPlayer projectId={id} />
        ) : hasPreview && !floating ? (
          <InlinePreview
            projectId={id} project={project} devPort={devPort} iframeKey={iframeKey} iframeRef={iframeRef}
            isGraphic={project.projectFormat === "graphic"}
            scaffoldStatus={scaffold} devServerStarting={devStarting} devServerError={devError}
            onStartDevServer={startDev}
            isStreaming={isStreaming} aiReadyForPreview={aiReadyForPreview} scaffoldStale={scaffoldStale} devCrashed={devCrashed}
            devDegraded={devDegraded} scaffoldProgress={scaffoldProgress} scaffoldError={scaffoldError} scaffoldRetries={scaffoldRetries}
            buildDoneChapters={doneChapters} buildTotalChapters={totalChapters} buildErrorCount={buildErrorChapters}
            onStartScaffold={startScaffold} onRebuild={() => { fetch(`/api/projects/${id}/build-parallel`, { method: "POST" }).catch(() => {}); }}
            onTakeManualControl={takeManualControl} onTryDegradedStart={startDev}
            playbackState={playState} playbackStep={playStep} playbackSpeed={playSpeed}
            totalChapters={chapters.length} subtitleVisible={subVisible}
            onPlay={togglePlayback} onPause={pause} onPrevChapter={prevCh} onNextChapter={nextCh}
            onSpeedChange={setSpeed} onSubtitleToggle={() => setSubVisible(v => !v)}
            onRefreshPreview={refresh} onStopDevServer={stopDev} onFullscreen={fullscreen}
            previewMode={previewMode} chapters={displayChapters} chapterStepCounts={chStepCounts}
            onEnterEditMode={() => setPreviewMode("edit")} onExitEditMode={() => { setPreviewMode("preview"); setSelEl(null); setWholeCtx(null); setWholePage(false); }}
            onSeekToStep={seek} wholePageSelected={wholePage} onSelectWholePage={() => setWholePage(v => !v)}
            isDraggingAsset={dragAsset} dragOverIframe={dragOver} onDragOverIframe={setDragOver} onDropOnIframe={onDrop}
            cardIndex={0} cardTotal={1} onCardPrev={() => {}} onCardNext={() => {}} onExportCards={() => {}}
            autoPlayMode={autoMode} onToggleAutoPlayMode={toggleAutoMode}
            renderStatus={renderSt} renderProgress={renderProg} buildStatus={buildStatus} publishStatus={pubSt}
            miaodaUrl={miaodaUrl} copied={copied} onShare={share}
            onStartRender={render} onStartBuild={build} onPublish={publish} onCopyLink={copy}
            onOpenFloating={openFloating} currentThemeName={themeName}
            iframeContainerRef={iframeContainerRef}
            wysiwygOverlay={
              <WysiwygOverlay
                projectId={id}
                iframeRef={iframeRef}
                containerRef={iframeContainerRef}
                editMode={previewMode === "edit"}
                selectedElement={selEl}
                onCommitEdit={onCommitEdit}
                onDeleteEdit={onDeleteEdit}
                onResetEdit={onResetEdit}
                onSendToIframe={onSendToIframe}
              />
            }
          />
        ) : !floating ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-5">
            <div className="w-16 h-16 rounded-2xl bg-surface2 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-t4">
                <rect x="3" y="2" width="22" height="24" rx="3"/>
                <polygon points="11,8 11,20 21,14" fill="currentColor" stroke="none" opacity="0.3"/>
                <polygon points="11,8 11,20 21,14" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-t1 mb-1">
                {scaffold === "idle" ? "等待构建" : scaffold === "running" ? "正在初始化" : scaffold === "error" ? "初始化失败" : devCrashed ? "服务器已断开" : "预览未启动"}
              </h3>
              <p className="text-xs text-t3 max-w-xs leading-relaxed">
                {scaffold === "idle"
                  ? (scaffoldStale ? "脚手架尚未启动，请确认构建流程已触发。" : "AI 内容就绪后会自动进入构建阶段")
                  : scaffold === "running"
                  ? (scaffoldProgress ? `${scaffoldProgress.stage} (${scaffoldProgress.pct}%)` : "脚手架正在初始化…")
                  : scaffold === "error"
                  ? (scaffoldError ? scaffoldError.message.slice(0, 80) : "脚手架初始化失败")
                  : devCrashed ? "请尝试重新启动开发服务器" : "点击下方按钮启动预览"}
              </p>
            </div>
            <PreviewLifecycleButton
              scaffold={scaffold}
              scaffoldProgress={scaffoldProgress}
              devPort={devPort}
              devStarting={devStarting}
              devError={devError}
              buildDoneChapters={doneChapters}
              buildTotalChapters={totalChapters}
              onStartScaffold={startScaffold}
              onStartDevServer={startDev}
              onStopDevServer={stopDev}
              onRefreshPreview={refresh}
              onFullscreen={fullscreen}
              variant="placeholder"
            />
            {devError && <p className="text-xs text-red-400">{devError}</p>}
          </div>
        ) : null}
        panel={
          <FilePanel projectId={id} project={project} chapters={displayChapters} files={fileContents}
            onOpenFile={tab => setOpenTab(tab)} openFileTab={openTab} onCloseFile={() => setOpenTab(null)}
            devPort={devPort} scaffoldStatus={scaffold} devServerStarting={devStarting}
            onStartDevServer={startDev} onOpenPreview={startDev} onSaveFile={onSaveFile}
            collapsed={fileCollapsed} onToggleCollapse={() => setFileCollapsed(v => !v)}
          />
        }
        filePanelActions={
          <>
            {/* Theme */}
            <button
              onClick={() => setThemeOpen(v => !v)}
              className={`h-6 px-2 rounded text-[11px] transition-colors flex items-center gap-1 shrink-0 ${themeOpen ? "bg-brand/10 text-brand-text" : "text-t3 hover:text-t1 hover:bg-surface2"}`}
              title="切换主题"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="5.5" cy="5.5" r="3"/><path d="M5.5 2a3.5 3.5 0 000 7"/></svg>
              {themes.find(t => t.name === themeName)?.nameZh || "主题"}
            </button>

            {/* Style */}
            {isIllust && (
              <button
                onClick={() => setStyleEditorOpen(v => !v)}
                className={`h-6 px-2 rounded text-[11px] transition-colors flex items-center gap-1 shrink-0 ${styleEditorOpen ? "bg-brand/10 text-brand-text" : "text-t3 hover:text-t1 hover:bg-surface2"}`}
                title="画面风格"
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="2.5"/>
                  <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.93 2.93l1.06 1.06M12.01 12.01l1.06 1.06M2.93 13.07l1.06-1.06M12.01 3.99l1.06-1.06"/>
                </svg>
                风格
              </button>
            )}

            {/* Audio tools — icon-only with status dot */}
            {(["audio","bgm","avatar"] as const).map(k => {
              const st = k === "audio" ? audioBtnStatus : k === "bgm" ? bgmBtnStatus : "idle";
              const running = st === "running";
              const done = st === "done";
              const title = k === "audio" ? "语音" : k === "bgm" ? "音乐" : "数字人";
              return (
                <button key={k} onClick={() => setWb(wb === k ? null : k)}
                  className={`h-6 px-2 rounded text-[11px] transition-colors flex items-center gap-1 shrink-0 relative ${wb === k ? "bg-brand/10 text-brand-text" : running ? "text-brand-text" : done ? "text-green-400" : "text-t3 hover:text-t1 hover:bg-surface2"}`}
                  title={title}
                >
                  {k === "audio" ? (
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v3a2 2 0 002 2h.5l3 2V0l-3 2H4a2 2 0 00-2 2z"/></svg>
                  ) : k === "bgm" ? (
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="3" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="3" cy="5.5" r="1.2"/><line x1="6.8" y1="4" x2="4.2" y2="4.8"/><line x1="4.2" y1="6.2" x2="6.8" y2="7"/></svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="4" r="2"/><path d="M2.5 9c0-1.5 1.3-3 3-3s3 1.5 3 3"/></svg>
                  )}
                  <span>{title}</span>
                  {running && <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />}
                  {done && <span className="w-1 h-1 rounded-full bg-green-400" />}
                </button>
              );
            })}

          </>
        }
      />

      {/* Floating preview window */}
      {floating && hasPreview && devPort !== null && (
        <PreviewWindow
          projectId={id}
          project={project}
          devPort={devPort}
          iframeKey={iframeKey}
          iframeRef={iframeRef}
          isGraphic={project.projectFormat === "graphic"}
          playbackState={playState}
          playbackStep={playStep}
          playbackSpeed={playSpeed}
          totalChapters={chapters.length}
          subtitleVisible={subVisible}
          onPlay={togglePlayback}
          onPause={pause}
          onPrevChapter={prevCh}
          onNextChapter={nextCh}
          onSpeedChange={setSpeed}
          onSubtitleToggle={() => setSubVisible(v => !v)}
          onRefreshPreview={refresh}
          onStopDevServer={stopDev}
          onFullscreen={fullscreen}
          previewMode={previewMode}
          chapters={displayChapters}
          chapterStepCounts={chStepCounts}
          onEnterEditMode={() => setPreviewMode("edit")}
          onExitEditMode={() => { setPreviewMode("preview"); setSelEl(null); setWholeCtx(null); setWholePage(false); }}
          onSeekToStep={seek}
          wholePageSelected={wholePage}
          onSelectWholePage={() => setWholePage(v => !v)}
          isDraggingAsset={dragAsset}
          dragOverIframe={dragOver}
          onDragOverIframe={setDragOver}
          onDropOnIframe={onDrop}
          cardIndex={0}
          cardTotal={1}
          onCardPrev={() => {}}
          onCardNext={() => {}}
          onExportCards={() => {}}
          renderStatus={renderSt}
          renderProgress={renderProg}
          buildStatus={buildStatus}
          publishStatus={pubSt}
          miaodaUrl={miaodaUrl}
          copied={copied}
          scaffoldStatus={scaffold}
          devServerStarting={devStarting} devServerError={devError} devCrashed={devCrashed}
          isStreaming={isStreaming} aiReadyForPreview={aiReadyForPreview} scaffoldStale={scaffoldStale}
          buildDoneChapters={doneChapters} buildTotalChapters={totalChapters} buildErrorCount={buildErrorChapters}
          onStartScaffold={startScaffold} onStartDevServer={startDev}
          onRebuild={() => { fetch(`/api/projects/${id}/build-parallel`, { method: "POST" }).catch(() => {}); }}
          onTakeManualControl={takeManualControl}
          onStartRender={render}
          onStartBuild={build}
          onPublish={publish}
          onCopyLink={copy}
          onShare={share}
          onClose={closeFloating}
        />
      )}
    </>
  );
}
