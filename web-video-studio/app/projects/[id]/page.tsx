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
import { PreviewWindow } from "@/components/preview-window";
import { PreviewLifecycleButton } from "@/components/preview-lifecycle-button";
import { useProjectStore } from "@/stores/project-store";
import { PlaybackBar } from "@/components/playback-bar";
import { WysiwygOverlay } from "@/components/wysiwyg-overlay";
import type { WysiwygEditEntry } from "@/components/wysiwyg-overlay";
import { ThemePickerPanel } from "@/components/theme-picker-panel";
import { AudioWorkbench } from "@/components/audio-workbench";
import { BgmWorkbench } from "@/components/bgm-workbench";
import { AvatarWorkbench } from "@/components/avatar-workbench";
import { ModelPickerPanel } from "@/components/model-picker-panel";
import { TokenStatsPanel } from "@/components/token-stats-panel";
import { IllustTimelineEditor } from "@/components/illust-timeline-editor";
import { ArticleLayoutEditor } from "@/components/article-layout-editor";
import { ArticleUploader } from "@/components/article-uploader";
import type { PreferredModel } from "@/lib/db/schema";
import type { ChapterProgress } from "@/components/chapter-progress-panel";
import type { ThemeMeta } from "@/app/api/themes/route";

type WS = "idle" | "running" | "done" | "error";
type WB = "audio" | "bgm" | "avatar" | "illust-timeline" | "article-layout" | null;

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
  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/projects/${id}`);
      if (r.status === 401) { router.replace(`/login?next=/projects/${id}`); return; }
      if (r.status === 404) { setPageState("notfound"); return; }
      if (!r.ok) throw new Error("load fail");
      const d = await r.json(); setProject(d); setThemeName(d.theme ?? ""); setPageState("ready");
    } catch (e: any) { setErrMsg(e.message); setPageState("error"); }
  }, [id, router]);
  useEffect(() => { load(); }, [load]);

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
      // Real-time Vite compile errors surfaced via SSE
      try { const d = JSON.parse(e.data); if (d.error) setDevError(d.error); } catch {}
    });
    es.addEventListener("build", (e: MessageEvent) => {
      try { const d = JSON.parse(e.data); setBuildJob((prev) => prev ? { ...prev, ...d } : d); } catch {}
    });
    es.onerror = () => { /* SSE reconnect is automatic */ };
    return () => es.close();
  }, [id]);

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
        if (prevDevPort.current !== null && !d.ready) setDevCrashed(true);
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

  const startDev = useCallback(async () => {
    setDevStarting(true); setDevError(null); setDevCrashed(false); setDevDegraded(false); setAiReadyForPreview(false);
    devStartingRef.current = true;
    sseGotDevPort.current = false; // allow polling to find the new port
    try {
      const r = await fetch(`/api/projects/${id}/dev-server`, { method: "POST" });
      if (!r.ok && r.status !== 409) { const d = await r.json().catch(() => ({})); setDevError(d.error ?? "fail"); }
    } catch { setDevError("network"); }
    setDevStarting(false);
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

  // ── Auto-trigger TTS when a chapter is built ──────────────────────────
  const handleChapterBuilt = useCallback(
    (chapterIds: string[]) => {
      if (
        project?.projectType === "illustration-video" ||
        project?.projectType === "illustrated-article"
      )
        return;

      const provider = project?.ttsProvider || DEFAULT_TTS_PROVIDER;
      const voice = project?.ttsVoice || DEFAULT_TTS_VOICE;

      // Always use full synthesis — it processes all registered chapters sequentially,
      // skipping already-synthesized mp3s. This avoids race conditions from concurrent
      // per-chapter requests overwriting each other's segments.json.
      fetch(`/api/projects/${id}/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, voice }),
      }).catch(() => {});
    },
    [id, project?.ttsVoice, project?.ttsProvider, project?.projectType]
  );

  // ─── Catch-up audio & bgm: detect already-built chapters missing audio ─
  // ─── Catch-up audio & bgm: detect already-built chapters missing audio ─
  const audioCatchupTriggered = useRef(false);
  useEffect(() => {
    if (audioCatchupTriggered.current) return;
    if (project?.status !== "done" && project?.status !== "building") return;
    // Only for video projects
    if (project?.projectType === "illustration-video" || project?.projectType === "illustrated-article") return;

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

  // ─── scaffold (auto-trigger when building) ────────────────────────────
  const scaffoldTriggered = useRef(false);
  useEffect(() => {
    if (scaffoldTriggered.current) return;
    if (userControlMode.current) return;
    if (scaffold !== "idle") return;
    if (project?.status !== "building") return;

    // Check if already scaffolded before triggering
    fetch(`/api/projects/${id}/scaffold`)
      .then(r => r.json())
      .then(d => {
        if (d.status === "done" || d.status === "running") return;
        scaffoldTriggered.current = true;
        fetch(`/api/projects/${id}/scaffold`, { method: "POST" }).catch(() => {});
      })
      .catch(() => {});
  }, [scaffold, project?.status, id]);

  // ─── scaffold stale detection ────────────────────────────────────────
  useEffect(() => {
    if (scaffold !== "idle" || project?.status !== "building") {
      setScaffoldStale(false);
      return;
    }
    const timer = setTimeout(() => setScaffoldStale(true), 30_000);
    return () => clearTimeout(timer);
  }, [scaffold, project?.status]);

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
      if (ok) setTimeout(poll, 5000);
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
  const fileMap: Array<{tab: "article" | "script" | "outline" | "rhythm" | "illustrations" | "source"; path: string}> = [
    { tab: "article", path: "article.md" },
    { tab: "rhythm", path: "rhythm.md" },
    { tab: "script", path: "script.md" },
    { tab: "outline", path: "outline.md" },
    { tab: "source", path: "source" },
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

  // ─── autostart ──────────────────────────────────────────────────────
  useEffect(() => {
    if (sp.get("autostart") !== "1" || autoDone || pageState !== "ready") return;
    const t = setTimeout(() => { triggerRef.current?.("请读取 article.md 并开始制作视频"); setAutoDone(true); }, 1000);
    return () => clearTimeout(t);
  }, [sp, autoDone, pageState]);

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
    // Refresh file contents so the file panel shows the new article
    setFileContents(prev => ({ ...prev, article: content }));
  }, []);

  // ─── postMessage helper ──────────────────────────────────────────────
  const post = useCallback((msg: any) => {
    iframeRef.current?.contentWindow?.postMessage(msg, window.location.origin);
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
  const play = useCallback(() => { setPlayState("playing"); post({ type: "start-auto" }); }, [post]);
  const pause = useCallback(() => { setPlayState("paused"); post({ type: "pause" }); }, [post]);
  const prevCh = useCallback(() => { post({ type: "prev-chapter" }); }, [post]);
  const nextCh = useCallback(() => { post({ type: "next-chapter" }); }, [post]);
  const setSpeed = useCallback((rate: number) => { setPlaySpeed(rate); post({ type: "set-speed", rate }); }, [post]);
  const refresh = useCallback(() => bumpIframeKey(), [bumpIframeKey]);
  const fullscreen = useCallback(() => iframeRef.current?.requestFullscreen?.(), []);
  const seek = useCallback((ch: number, step: number) => { post({ type: "seek-to-step", chapter: ch, step }); }, [post]);

  // ─── edit mode sync ──────────────────────────────────────────────────
  useEffect(() => {
    post({ type: previewMode === "edit" ? "edit-mode" : "exit-edit-mode" });
  }, [previewMode, post]);

  // ─── iframe msgs ────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: MessageEvent) => {
      // Only accept messages from our own iframe (localhost with known port)
      if (!e.origin.startsWith("http://localhost:")) return;
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
      const r = await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(opts) });
      if (r.ok) { const u = await r.json(); setProject(u); setThemeName(opts.theme); }
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
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === project?.title) { setEditingTitle(false); return; }
    try {
      const r = await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: trimmed }) });
      if (r.ok) { const u = await r.json(); setProject(u); }
    } catch {}
    setEditingTitle(false);
  }, [id, titleDraft, project?.title]);

  const onModelConfirm = useCallback(async (model: PreferredModel) => {
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

  const hasPreview = devPort !== null && scaffold === "done";
  const buildStatus = (buildJob?.status === "running" ? "running" : buildJob?.status === "done" ? "done" : "idle") as "idle" | "running" | "done" | "error";
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
    <div className="flex items-center justify-between px-3 h-10">
      <div className="flex items-center gap-2 min-w-0">
        <Link href="/studio" className="text-t3 hover:text-t1 shrink-0" title="返回">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 4l-6 6 6 6"/></svg>
        </Link>

        {/* Editable title */}
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={onTitleSave}
            onKeyDown={e => { if (e.key === "Enter") onTitleSave(); if (e.key === "Escape") setEditingTitle(false); }}
            className="text-sm font-semibold text-t1 bg-surface border border-bd rounded px-1.5 py-0.5 outline-none focus:border-accent min-w-0 w-40"
          />
        ) : (
          <span
            className="text-sm font-semibold text-t1 truncate cursor-pointer hover:text-accent transition-colors"
            onClick={() => { setTitleDraft(project.title); setEditingTitle(true); }}
            title="点击编辑标题"
          >
            {project.title}
          </span>
        )}

        {/* Project switcher dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setSwitcherOpen(v => !v)}
            className="text-t3 hover:text-t1 transition-colors px-0.5"
            title="切换项目"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 7L1 3h8z"/></svg>
          </button>
          {switcherOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setSwitcherOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-40 bg-modal border border-bd rounded-xl shadow-2xl w-64 max-h-72 overflow-y-auto py-1">
                {projectsList.length === 0 ? (
                  <p className="text-xs text-t3 px-3 py-4 text-center">暂无项目</p>
                ) : (
                  projectsList.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { router.push(`/projects/${p.id}`); setSwitcherOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-surface2 transition-colors truncate flex items-center gap-2 ${p.id === id ? "bg-accent/10 text-accent font-medium" : "text-t1"}`}
                    >
                      <span className="truncate flex-1">{p.title}</span>
                      {p.id === id && <span className="text-[10px] text-accent shrink-0">✓</span>}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 hidden sm:inline ${
          project.status === "done" ? "bg-green-500/10 text-green-500"
          : project.status === "building" ? "bg-blue-500/10 text-blue-500"
          : project.status === "illustrating" ? "bg-rose-500/10 text-rose-500"
          : project.status === "typesetting" ? "bg-teal-500/10 text-teal-500"
          : project.status === "writing" || project.status === "plan_checkpoint" || project.status === "illustration_planning" ? "bg-amber-500/10 text-amber-500"
          : "bg-surface-2 text-t3"
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
        {isStreaming && <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />}

        {/* Separator */}
        <span className="w-px h-4 bg-bd shrink-0 hidden sm:block" />

        {/* Model picker badge */}
        <button
          onClick={() => setModelPickerOpen(true)}
          className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 hidden sm:inline bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
          title="切换模型"
        >
          🤖 {MODEL_SHORT_LABELS[project.model ?? ""] ?? project.model}
        </button>

        {/* Token badge */}
        <button
          onClick={() => setTokenPanelOpen(true)}
          className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 hidden sm:inline bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors"
          title="Token 消耗"
        >
          ⚡ {fmtTokens(tokenTotal)}
        </button>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {scaffold === "done" && project.status !== "done" && (
          <button onClick={build} disabled={buildJob?.status === "running"} className={`text-xs px-2.5 py-1 rounded-lg transition-opacity ${buildJob?.status === "running" ? "text-t3 bg-surface border border-bd" : "bg-accent text-white hover:opacity-90"}`}>
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

      {modelPickerOpen && (
        <ModelPickerPanel current={project.model as PreferredModel} onConfirm={onModelConfirm} onClose={() => setModelPickerOpen(false)} title="选择主模型" subtitle="用于对话、规划、脚本生成" />
      )}

      {tokenPanelOpen && (
        <TokenStatsPanel projectId={id} onClose={() => setTokenPanelOpen(false)} />
      )}

      {wb && <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setWb(null)} />}
      {wb === "audio" && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 bg-modal border-l border-bd shadow-2xl overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-bd sticky top-0 bg-modal"><span className="text-sm font-semibold text-t1">语音合成</span><button onClick={() => setWb(null)} className="text-t3 hover:text-t1 text-lg">×</button></div>
          <AudioWorkbench projectId={id} ttsVoice={project.ttsVoice} ttsProvider={project.ttsProvider} onSynthDone={load} onSkip={() => setWb(null)} />
        </div>
      )}
      {wb === "bgm" && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 bg-modal border-l border-bd shadow-2xl overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-bd sticky top-0 bg-modal"><span className="text-sm font-semibold text-t1">背景音乐</span><button onClick={() => setWb(null)} className="text-t3 hover:text-t1 text-lg">×</button></div>
          <BgmWorkbench projectId={id} projectTitle={project.title} />
        </div>
      )}
      {wb === "avatar" && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 bg-modal border-l border-bd shadow-2xl overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-bd sticky top-0 bg-modal"><span className="text-sm font-semibold text-t1">数字人</span><button onClick={() => setWb(null)} className="text-t3 hover:text-t1 text-lg">×</button></div>
          <AvatarWorkbench projectId={id} />
        </div>
      )}

      {wb === "illust-timeline" && (
        <div className="fixed inset-y-0 right-0 z-50 w-[42rem] max-w-[90vw] bg-modal border-l border-bd shadow-2xl overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-bd sticky top-0 bg-modal">
            <span className="text-sm font-semibold text-t1">插图时间轴</span>
            <button onClick={() => setWb(null)} className="text-t3 hover:text-t1 text-lg">×</button>
          </div>
          <IllustTimelineEditor projectId={id} />
        </div>
      )}

      {wb === "article-layout" && (
        <div className="fixed inset-y-0 right-0 z-50 w-[42rem] max-w-[90vw] bg-modal border-l border-bd shadow-2xl overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-bd sticky top-0 bg-modal">
            <span className="text-sm font-semibold text-t1">图文排版</span>
            <button onClick={() => setWb(null)} className="text-t3 hover:text-t1 text-lg">×</button>
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
              <div className="h-0.5 bg-surface-2"><div className="h-full bg-accent transition-all duration-500" style={{ width: `${(doneChapters / totalChapters) * 100}%` }} /></div>
            )}
          </>
        }
        main={
          <div className="flex flex-col h-full">
            {hasPreview && displayChapters.length > 0 && (
              <PlaybackBar step={playStep} playbackState={playState} speed={playSpeed} totalChapters={chapters.length}
                onPlay={play} onPause={pause} onPrevChapter={prevCh} onNextChapter={nextCh} onSpeedChange={setSpeed} />
            )}
            <div className="flex-1 overflow-hidden">
              <ChatPanel projectId={id} projectTitle={project.title} devPort={devPort}
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
                onChapterBuilt={handleChapterBuilt}
                onIllustrationDone={load}
                onRebuildChapter={() => { fetch(`/api/projects/${id}/build-parallel`, { method: "POST" }).catch(() => {}); }}
                chapters={displayChapters} onChaptersChange={setChapters}
                projectFormat={project.projectFormat as any}
              />
            </div>
          </div>
        }
        preview={hasPreview && !floating ? (
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
            onPlay={play} onPause={pause} onPrevChapter={prevCh} onNextChapter={nextCh}
            onSpeedChange={setSpeed} onSubtitleToggle={() => setSubVisible(v => !v)}
            onRefreshPreview={refresh} onStopDevServer={() => { setDevPort(null); }} onFullscreen={fullscreen}
            previewMode={previewMode} chapters={displayChapters} chapterStepCounts={chStepCounts}
            onEnterEditMode={() => setPreviewMode("edit")} onExitEditMode={() => { setPreviewMode("preview"); setSelEl(null); setWholeCtx(null); setWholePage(false); }}
            onSeekToStep={seek} wholePageSelected={wholePage} onSelectWholePage={() => setWholePage(v => !v)}
            isDraggingAsset={dragAsset} dragOverIframe={dragOver} onDragOverIframe={setDragOver} onDropOnIframe={onDrop}
            cardIndex={0} cardTotal={1} onCardPrev={() => {}} onCardNext={() => {}} onExportCards={() => {}}
            autoPlayMode={autoMode} onToggleAutoPlayMode={() => setAutoMode(v => !v)}
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
          // Show ArticleUploader for illustration projects in writing phase
          (project.projectType === "illustration-video" || project.projectType === "illustrated-article") &&
          project.status === "writing" && !hasArticle ? (
            <ArticleUploader
              projectId={id}
              hasArticle={hasArticle}
              onUploaded={onArticleUploaded}
            />
          ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
            <div className="text-4xl">🎬</div>
            <p className="text-sm font-medium text-t1">预览控制</p>
            <p className="text-xs text-t3 max-w-xs">
              {scaffold === "idle"
                ? (scaffoldStale ? "脚手架尚未启动，请确认构建流程已触发。" : "AI 内容就绪后将自动进入构建阶段")
                : scaffold === "running"
                ? (scaffoldProgress ? `正在 ${scaffoldProgress.stage} (${scaffoldProgress.pct}%)` : "脚手架正在初始化…")
                : scaffold === "error"
                ? (scaffoldError ? `${scaffoldError.message.slice(0, 80)}` : "脚手架初始化失败")
                : devCrashed ? "开发服务器已断开" : "开发服务器未启动"}
            </p>
            <PreviewLifecycleButton
              scaffold={scaffold}
              scaffoldProgress={scaffoldProgress}
              scaffoldError={scaffoldError}
              scaffoldRetries={scaffoldRetries}
              devPort={devPort}
              devStarting={devStarting}
              devError={devError}
              devDegraded={devDegraded}
              buildStatus={buildStatus}
              buildDoneChapters={doneChapters}
              buildTotalChapters={totalChapters}
              buildErrorCount={buildErrorChapters}
              projectStatus={project?.status ?? "writing"}
              isStreaming={isStreaming}
              aiReadyForPreview={aiReadyForPreview}
              scaffoldStale={scaffoldStale}
              devCrashed={devCrashed}
              onStartScaffold={startScaffold}
              onStartDevServer={startDev}
              onStopDevServer={() => { setDevPort(null); }}
              onRefreshPreview={refresh}
              onRebuild={() => { fetch(`/api/projects/${id}/build-parallel`, { method: "POST" }).catch(() => {}); }}
              onFullscreen={fullscreen}
              onTakeManualControl={takeManualControl}
              onTryDegradedStart={startDev}
              variant="placeholder"
            />
            {devError && <p className="text-xs text-red-500">{devError}</p>}
          </div>
          )
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
            <button
              onClick={() => setThemeOpen(v => !v)}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${themeOpen ? "bg-accent text-white" : "text-t2 hover:text-t1"}`}
              title="切换主题"
            >
              🎨 {themes.find(t => t.name === themeName)?.nameZh || themeName || "主题"}
            </button>
            {/* Show illustration/typsetting buttons for relevant project types */}
            {(project.projectType === "illustration-video" || project.projectType === "illustrated-article") && (
              <>
                <button onClick={() => setWb(wb === "illust-timeline" ? null : "illust-timeline")}
                  className={`text-xs px-2 py-0.5 rounded transition-colors ${wb === "illust-timeline" ? "bg-accent text-white" : "text-t2 hover:text-t1"}`}>
                  🎨 插图
                </button>
                {project.projectType === "illustrated-article" && (
                  <button onClick={() => setWb(wb === "article-layout" ? null : "article-layout")}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${wb === "article-layout" ? "bg-accent text-white" : "text-t2 hover:text-t1"}`}>
                    📄 排版
                  </button>
                )}
              </>
            )}
            {(["audio", "bgm", "avatar"] as const).map(k => {
              const st = k === "audio" ? audioBtnStatus : k === "bgm" ? bgmBtnStatus : "idle";
              const dotCls = st === "idle" ? "hidden"
                : st === "running"
                  ? (k === "audio" ? "bg-yellow-400 animate-pulse" : "bg-purple-400 animate-pulse")
                  : "bg-green-400";
              return (
                <button key={k} onClick={() => setWb(wb === k ? null : k)}
                  className={`text-xs px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${wb === k ? "bg-accent text-white" : "text-t2 hover:text-t1"}`}>
                  <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${dotCls}`} />
                  {k === "audio" ? "语音" : k === "bgm" ? "音乐" : "数字人"}
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
          onPlay={play}
          onPause={pause}
          onPrevChapter={prevCh}
          onNextChapter={nextCh}
          onSpeedChange={setSpeed}
          onSubtitleToggle={() => setSubVisible(v => !v)}
          onRefreshPreview={refresh}
          onStopDevServer={() => { setDevPort(null); }}
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
