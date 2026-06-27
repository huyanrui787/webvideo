"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChatSimple } from "./useChatSimple";
import type { AnyPart } from "@/lib/types";
import type { ProjectFormat } from "@/lib/db/schema";
import { GraphicPlanCheckpointCard } from "./graphic-plan-checkpoint-card";
import type { GraphicCheckpointData } from "./graphic-plan-checkpoint-card";
import { PlanCheckpointCard } from "./plan-checkpoint-card";
import type { CheckpointData } from "./plan-checkpoint-card";
import { ChapterProgressPanel } from "./chapter-progress-panel";
import type { ChapterProgress } from "./chapter-progress-panel";
import { MusicCheckpointCard } from "./music-checkpoint-card";
import { IllustrationCheckpointCard } from "./illustration-checkpoint-card";
import type { IllustrationResult } from "./illustration-checkpoint-card";
import type { ShotItem } from "@/app/api/projects/[id]/illustrate/route";
import { ContentCheckpointCard } from "./content-checkpoint-card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BuildProgressCard } from "./build-progress-card";
import { ToolCallsBlock } from "./chat-tool-calls";
import { extractJsonBlocks } from "@/lib/chat/json-extractor";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanCheckpointMsg {
  type: "plan_checkpoint";
  data: CheckpointData & Partial<GraphicCheckpointData>;
}
interface ChapterStatusMsg {
  type: "chapter_status";
  data: { chapterId: string; title: string; status: ChapterProgress["status"] };
}
interface ChapterReviewMsg {
  type: "chapter_review";
  data: { chapterId: string; title: string; status: "done"; chapterNumber: number };
}
interface AudioCheckpointMsg {
  type: "audio";
  data: { chapterCount: number; stepCount: number };
}
interface RecordingGuideMsg {
  type: "recording_guide";
  data: { hasAudio: boolean };
}
interface MusicCheckpointMsg {
  type: "music_checkpoint";
  data: { articleTitle?: string };
}
interface IllustrationCheckpointMsg {
  type: "illustration_checkpoint";
  data: { shotList: ShotItem[] };
}
interface IllustrationGenerateMsg {
  type: "illustration_generate";
  data: { shotCount: number; chapters?: string[] };
}
interface CardStatusMsg {
  type: "card_status";
  data: { cardId: string; title: string; status: "building" | "done" | "error" };
}
interface CardReviewMsg {
  type: "card_review";
  data: { cardId: string; title: string; status: "done" };
}
interface CardsDoneMsg {
  type: "cards_done";
  data: { cardCount: number };
}
interface SynthProgressMsg {
  type: "synth_progress";
  data: { lines: string[]; completed: number; total: number; status: string };
}

type AnnotationMsg =
  | PlanCheckpointMsg
  | ChapterStatusMsg
  | ChapterReviewMsg
  | AudioCheckpointMsg
  | RecordingGuideMsg
  | MusicCheckpointMsg
  | IllustrationCheckpointMsg
  | IllustrationGenerateMsg
  | CardStatusMsg
  | CardReviewMsg
  | CardsDoneMsg
  | SynthProgressMsg;

interface ChatPanelProps {
  projectId: string;
  projectTitle?: string;
  devPort?: number | null;
  selectedElement?: {
    tagName: string;
    className: string;
    textContent: string;
    chapterId: string;
    stepIndex: number;
    isConditionalStep?: boolean;
    xpath?: string;
    selector?: string;
    selectorIndex?: number;
  } | null;
  wholePageContext?: {
    chapterId: string;
    chapterTitle: string;
    stepIndex: number;
  } | null;
  onCheckpointConfirmed?: (opts: {
    theme: string;
    devMode: "sequential" | "parallel";
    orientation: "landscape" | "portrait";
  }) => void;
  onIllustrationDone?: (illustrations: IllustrationResult[]) => void;
  onRegisterTrigger?: (fn: (text: string) => void) => void;
  onDevServerNeeded?: () => void;
  onProjectDone?: () => void;
  onAudioCheckpoint?: () => void;
  onStreamEnd?: () => void;
  onStreamError?: (error: Error) => void;
  onStreamingChange?: (isStreaming: boolean) => void;
  onBuildingStart?: () => void;
  chapters?: ChapterProgress[];
  onChaptersChange?: (chapters: ChapterProgress[]) => void;
  projectFormat?: ProjectFormat;
  projectStatus?: string;
  onCardStatusChange?: (cards: Array<{ id: string; title: string; status: "pending" | "building" | "done" | "error" }>) => void;
  contentCheckpoint?: boolean;
  contentStats?: { scriptWords: number; outlineChapters: number; outlineSteps: number };
  onContentConfirm?: () => void;
  onRebuildChapter?: (chapterId: string) => void;
  illGenRunning?: boolean;
  illGenProgress?: { done: number; total: number } | null;
  illGenShots?: Array<{ id: string; chapterId: string; status: "pending" | "generating" | "done" | "error" }>;
}

export function ChatPanel({
  projectId,
  projectTitle,
  devPort,
  selectedElement,
  wholePageContext,
  onCheckpointConfirmed,
  onIllustrationDone,
  onRegisterTrigger,
  onDevServerNeeded,
  onProjectDone,
  onAudioCheckpoint,
  onStreamEnd,
  onStreamError,
  onStreamingChange,
  onBuildingStart,
  chapters: externalChapters,
  onChaptersChange,
  projectFormat,
  onCardStatusChange,
  contentCheckpoint,
  contentStats,
  onContentConfirm,
  onRebuildChapter,
  projectStatus,
  illGenRunning,
  illGenProgress,
  illGenShots,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [annotations, setAnnotations] = useState<Record<string, AnnotationMsg>>({});
  const [internalChapters, setInternalChapters] = useState<ChapterProgress[]>([]);
  const [cards, setCardsState] = useState<Array<{ id: string; title: string; status: "pending" | "building" | "done" | "error" }>>([]);
  // Track which signal keys have already been processed — avoids setState loops
  const processedKeysRef = useRef(new Set<string>());

  // Use external chapters if provided, otherwise internal
  const chapters = externalChapters ?? internalChapters;
  function setChapters(updater: ChapterProgress[] | ((prev: ChapterProgress[]) => ChapterProgress[])) {
    if (typeof updater === "function") {
      // Use React's functional update to avoid stale closure
      setInternalChapters((prev) => {
        const next = updater(externalChapters ?? prev);
        onChaptersChange?.(next);
        return next;
      });
    } else {
      setInternalChapters(updater);
      onChaptersChange?.(updater);
    }
  }

  const [streamError, setStreamError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // ── Auto-resume state machine ──────────────────────────────────────────────
  const AUTO_RESUME_MAX = 30;
  const WATCHDOG_TIMEOUT_MS = 90_000;

  const autoResumeCountRef = useRef(0);
  const loadingStartTimeRef = useRef<number | null>(null);
  const watchdogFiredRef = useRef(false);
  // IDs of messages that were already in DB when the page loaded — signals from
  // these should NOT trigger side-effects (they already ran in a previous session).
  const historyMsgIdsRef = useRef(new Set<string>());
  const [pendingImages, setPendingImages] = useState<Array<{ dataUrl: string; name: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Sanitize: strip any part that would crash Chat.makeRequest ──────
  function sanitizeMessages(msgs: any[]) {
    return msgs.map((m: any) => ({
      ...m,
      parts: Array.isArray(m.parts)
        ? m.parts.filter((p: any) => {
            if (p == null || typeof p !== "object") return false;
            if (p.type === "text") return typeof p.text === "string";
            if ((p.type || "").startsWith("tool-")) return typeof (p.toolName || p.name) === "string" && p.state != null;
            return true; // keep other types (image, file, etc.)
          })
        : [],
    })).filter((m: any) => m.parts.length > 0);
  }

  const { messages, sendMessage, setMessages, isLoading, stop } = useChatSimple({
    api: `/api/projects/${projectId}/chat`,
    onError: (err) => {
      const msg = err?.message ?? "连接中断";
      setStreamError(msg.includes("刷新") ? msg : `${msg} — 刷新页面即可恢复`);
      onStreamError?.(err);
    },
    onFinish: () => { /* auto-resume handled by maybeAutoResume below */ },
  });

  // Ref for synchronous message access (needed by auto-resume watchdog)
  const messagesRef = useRef<any[]>([]);
  messagesRef.current = messages;

  // Load persisted history once on mount
  const historyLoadedRef = useRef(false);
  useEffect(() => {
    if (historyLoadedRef.current) return;
    historyLoadedRef.current = true;
    fetch(`/api/projects/${projectId}/chat`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.messages?.length) {
          // Filter and sanitize messages loaded from history.
          // The ai SDK's Chat.makeRequest iterates parts and accesses .state on tool-invocation parts.
          // Any null/undefined part or tool-invocation without .state crashes with:
          //   Cannot read properties of undefined (reading 'state')
          const valid = d.messages
            .map((m: any) => ({
              ...m,
              parts: Array.isArray(m.parts)
                ? m.parts.filter((p: any) => {
                    if (p == null || typeof p !== "object") return false;
                    if (p.type === "text") return typeof p.text === "string";
                    if (p.type === "tool-invocation") return typeof p.toolName === "string" && p.state != null;
                    return false; // drop unknown part types
                  })
                : [],
            }))
            .filter((m: any) => m.parts.length > 0);
          // Deduplicate before setting — prevents React "duplicate key" warning
          const seen = new Set<string>();
          const unique = valid.filter((m: { id: string }) => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });
          // Record all history message IDs before setting them — signals from
          // these messages must not re-trigger side-effects.
          unique.forEach((m: { id: string }) => historyMsgIdsRef.current.add(m.id));
          setMessages(unique);
        }
      })
      .finally(() => setHistoryLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Also treat as loading if last message has pending tool invocations
  const lastMsg = messages[messages.length - 1];
  const hasPendingTools = lastMsg?.parts?.some(
    (p: any) => (p.type === "tool-invocation" || p.type === "tool-call") && p.state !== "result" && p.state !== "output"
  ) ?? false;
  // No need to recalculate — useChatSimple provides isLoading directly

  // ── Utility: extract text from a UIMessage ────────────────────────────────

  function getMessageText(msg: any): string {
    const parts = msg?.parts ?? [];
    return parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text ?? "")
      .join("");
  }

  function isTruncatedText(text: string): boolean {
    if (!text || text.length < 50) return false;
    const jsonStarts = (text.match(/```json\s*\{/g) || []).length;
    const jsonEnds = (text.match(/```\s*$/gm) || []).length;
    if (jsonStarts > jsonEnds) return true;
    return /[a-zA-Z一-鿿]$/.test(text.trim());
  }

  // ── Auto-resume: detect truncation and send "继续" after delay ────────────

  function maybeAutoResume(reason: string) {
    if (autoResumeCountRef.current >= AUTO_RESUME_MAX) {
      autoResumeCountRef.current = 0;
      return;
    }
    autoResumeCountRef.current++;
    setStreamError(null);

    // Brief delay to let SDK state settle after stop/error before re-sending.
    // Prevents the ai v6.0.208 race condition where makeRequest's finally block
    // crashes because activeResponse hasn't been fully cleaned up.
    setTimeout(() => {
      sendMessage({
        role: "user",
        parts: [{ type: "text", text: "继续。" }],
      });
    }, 300);
  }

  // ── Watchdog: detect stuck isLoading state ────────────────────────────────

  useEffect(() => {
    if (!isLoading || watchdogFiredRef.current) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - (loadingStartTimeRef.current ?? 0);
      if (elapsed >= WATCHDOG_TIMEOUT_MS) {
        watchdogFiredRef.current = true;
        console.warn("[chat:watchdog] isLoading stuck for", elapsed, "ms — forcing stop");
        stop();
        maybeAutoResume("watchdog");
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isLoading, stop]);

  // Track loading start time
  useEffect(() => {
    if (isLoading && !loadingStartTimeRef.current) {
      loadingStartTimeRef.current = Date.now();
    } else if (!isLoading) {
      loadingStartTimeRef.current = null;
      watchdogFiredRef.current = false;
    }
  }, [isLoading]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLoadingRef = useRef(false);

  // Re-sync project state after each AI turn ends
  // Note: building/done transitions are now SSE-driven (see page.tsx status-change listener).
  // The old message-parsing approach is replaced — keep onBuildingStart for backwards compat but
  // it's now triggered by SSE events in the parent component.
  useEffect(() => {
    if (prevLoadingRef.current !== isLoading) {
      onStreamingChange?.(isLoading);
    }
    if (prevLoadingRef.current && !isLoading && !streamError) {
      onStreamEnd?.();
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, status, onStreamEnd, messages]);

  // Note: chapter-built detection is now SSE-driven (page.tsx status-change + chapter-built events).
  // The old message-parsing approach has been removed. Chapter status is unified in the parent.

  useEffect(() => {
    onRegisterTrigger?.((text: string) => {
      sendMessage({ role: "user", parts: [{ type: "text", text }] });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendMessage]);

  const initialScrollDone = useRef(false);
  useEffect(() => {
    if (!messages.length) return;
    const behavior = initialScrollDone.current ? "smooth" : "instant";
    initialScrollDone.current = true;
    bottomRef.current?.scrollIntoView({ behavior });
  }, [messages]);

  // Parse structured JSON signals from assistant messages
  useEffect(() => {
    for (const m of messages) {
      if (m.role !== "assistant") continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parts = (m as any).parts ?? [];
      const text = parts
        .filter((p: AnyPart) => p.type === "text")
        .map((p: AnyPart) => p.text ?? "")
        .join("");

      // Whether this message was already in DB when the page loaded
      const isHistoryMsg = historyMsgIdsRef.current.has(m.id);

      // Extract JSON blocks with brace-counting (handles nested `}` in strings)
      const jsonBlocks = extractJsonBlocks(text);
      for (const raw of jsonBlocks) {
        const parsed = raw as AnnotationMsg;
        const subId = (parsed.type === "chapter_status" || parsed.type === "card_status" || parsed.type === "card_review")
          ? `-${(parsed.data as any).chapterId ?? (parsed.data as any).cardId ?? ""}`
          : "";
        const key = `${m.id}-${parsed.type}${subId}`;
        if (annotations[key]) continue;
        if (processedKeysRef.current.has(key)) continue;
        processedKeysRef.current.add(key);

        // ── Display-only signals: always render cards, even for history ──
        if (parsed.type === "plan_checkpoint") {
          setAnnotations((prev) => ({ ...prev, [key]: parsed }));
        } else if (parsed.type === "illustration_checkpoint") {
          setAnnotations((prev) => ({ ...prev, [key]: parsed }));
        } else if (parsed.type === "music_checkpoint") {
          setAnnotations((prev) => ({ ...prev, [key]: parsed }));
        } else if (parsed.type === "chapter_review") {
          setAnnotations((prev) => ({ ...prev, [key]: parsed }));
          if (!isHistoryMsg && parsed.data.chapterNumber === 1) {
            onDevServerNeeded?.();
          }
        }

        // ── Side-effect signals: skip for history messages ──────────────
        if (
          parsed.type !== "plan_checkpoint" &&
          parsed.type !== "illustration_checkpoint" &&
          parsed.type !== "music_checkpoint" &&
          parsed.type !== "chapter_review" &&
          !isHistoryMsg
        ) {
          if (parsed.type === "audio") {
            onAudioCheckpoint?.();
            onDevServerNeeded?.();
          } else if (parsed.type === "chapter_status") {
            const { chapterId, title, status: chapStatus } = parsed.data;
            setChapters((prev) => {
              const exists = prev.find((c) => c.id === chapterId);
              if (exists) {
                return prev.map((c) =>
                  c.id === chapterId ? { ...c, status: chapStatus } : c
                );
              }
              return [...prev, { id: chapterId, title, status: chapStatus }];
            });
          } else if (parsed.type === "card_status") {
            const { cardId, title: cardTitle, status: cardStatus } = parsed.data;
            setCardsState((prev) => {
              const exists = prev.find((c) => c.id === cardId);
              const next = exists
                ? prev.map((c) => c.id === cardId ? { ...c, status: cardStatus } : c)
                : [...prev, { id: cardId, title: cardTitle, status: cardStatus }];
              onCardStatusChange?.(next);
              return next;
            });
            onDevServerNeeded?.();
          } else if (parsed.type === "card_review") {
            const { cardId, title: cardTitle } = parsed.data;
            setCardsState((prev) => {
              const exists = prev.find((c) => c.id === cardId);
              const next: typeof prev = exists
                ? prev.map((c) => c.id === cardId ? { ...c, status: "done" as const } : c)
                : [...prev, { id: cardId, title: cardTitle, status: "done" as const }];
              onCardStatusChange?.(next);
              return next;
            });
            onDevServerNeeded?.();
          } else if (parsed.type === "cards_done") {
            onProjectDone?.();
          } else if (parsed.type === "illustration_generate") {
            // Auto-trigger image generation — no user confirmation needed
            const shotCount = parsed.data?.shotCount ?? 0;
            if (shotCount > 0) {
              fetch(`/api/projects/${projectId}/illustrations/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ concurrency: 2 }),
              }).then(r => r.json()).then(d => {
                console.log(`[illustration_generate] done=${d.doneCount} errors=${d.errorCount}`);
                onIllustrationDone?.([]);
              }).catch(() => {});
            }
          }
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  function fileToDataUrl(file: File): Promise<{ dataUrl: string; name: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result as string, name: file.name });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function addImageFiles(files: FileList | File[]) {
    const all = Array.from(files);
    const images = all.filter((f) => f.type.startsWith("image/"));
    const videos = all.filter((f) => f.type.startsWith("video/"));

    if (images.length) {
      const results = await Promise.all(images.map(fileToDataUrl));
      setPendingImages((prev) => [...prev, ...results].slice(0, 4));
    }

    for (const video of videos) {
      const form = new FormData();
      form.append("file", video);
      await fetch(`/api/projects/${projectId}/assets`, { method: "POST", body: form });
    }
    if (videos.length) {
      // Inject a notice into the chat input so AI knows a video was uploaded
      setInput((prev) => (prev ? prev + "\n" : "") + `[已上传视频素材：${videos.map((v) => v.name).join("、")}]`);
    }
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItems = items.filter((item) => item.type.startsWith("image/"));
      if (!imageItems.length) return;
      e.preventDefault();
      const files = imageItems.map((item) => item.getAsFile()).filter(Boolean) as File[];
      addImageFiles(files);
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildElementContext(): string {
    if (wholePageContext) {
      return `[编辑模式 · 选中整个步骤页面]\n` +
        `- 章节：${wholePageContext.chapterId}（${wholePageContext.chapterTitle}），步骤：${wholePageContext.stepIndex + 1}\n` +
        `- 文件：presentation/src/chapters/${wholePageContext.chapterId}/\n` +
        `\n用户想修改这整个步骤页面：`;
    }
    if (!selectedElement) return "";
    return `[编辑模式 · 当前选中元素]\n` +
      `- 章节：${selectedElement.chapterId}，步骤：${selectedElement.stepIndex + 1}\n` +
      `- 标签：<${selectedElement.tagName}> ${selectedElement.className ? `class="${selectedElement.className}"` : ""}\n` +
      `- 文本：${selectedElement.textContent || "（无文本内容）"}\n` +
      (selectedElement.xpath ? `- XPath：${selectedElement.xpath}\n` : "") +
      (selectedElement.selector ? `- Selector：${selectedElement.selector}[${selectedElement.selectorIndex ?? 0}]\n` : "") +
      (selectedElement.isConditionalStep ? `- 注意：此元素位于条件步骤内\n` : "") +
      `\n用户意图：`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((!input.trim() && pendingImages.length === 0) || isLoading) return;
    setStreamError(null);
    autoResumeCountRef.current = 0;
    watchdogFiredRef.current = false;
    const ctx = buildElementContext();
    const text = ctx ? ctx + input : input;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [];
    if (text) parts.push({ type: "text", text });
    for (const img of pendingImages) {
      // Extract actual mediaType from data URL (e.g. "image/jpeg")
      const mediaType = img.dataUrl.split(";")[0].replace("data:", "") || "image/png";
      parts.push({ type: "file", mediaType, url: img.dataUrl });
    }
    sendMessage({ role: "user", parts });
    setInput("");
    setPendingImages([]);
  }

  function triggerSend(text: string) {
    setStreamError(null);
    sendMessage({ role: "user", parts: [{ type: "text", text }] });
  }


  return (
    <div className="flex flex-col h-full">
{/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2">
        {messages.length === 0 && historyLoaded && (
          <div className="text-center text-sm text-t3 pt-8 px-4">
            <p className="text-2xl mb-2">🎬</p>
            <p>上传文章后，我会帮你生成口播稿和开发计划</p>
          </div>
        )}
        {messages.length === 0 && !historyLoaded && (
          <div className="text-center text-sm text-t3 pt-8 px-4">
            <p className="animate-pulse">加载对话记录…</p>
          </div>
        )}
        {/* Recovery notice: last message was user AND not currently loading → conversation may have been interrupted */}
        {historyLoaded && messages.length > 0 && messages[messages.length - 1]?.role === "user" && !isLoading && (
          <div className="mx-3 mb-2 p-2 rounded text-xs bg-brand-subtle text-amber-600 border border-brand/20 flex items-center gap-2">
            <span>⚡</span>
            <span>上次对话可能未完成。已保存的内容不会丢失，发送消息即可续接。</span>
          </div>
        )}
        {/* Render-time dedup: Set-based O(n) — also skip invisible auto-resume messages. */}
        {(function renderMessages() {
          const seen = new Set<string>();
          const result: typeof messages = [];
          for (const m of messages) {
            if (seen.has(m.id)) continue;
            seen.add(m.id);
            const parts = (m as any).parts ?? [];
            const text = parts.filter((p: any) => p.type === "text").map((p: any) => p.text ?? "").join("");
            if (m.role === "user" && text === "继续。") continue;
            result.push(m);
          }
          return result.map((m) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parts = (m as any).parts ?? [];
          const fullText = parts
            .filter((p: AnyPart) => p.type === "text")
            .map((p: AnyPart) => p.text ?? "")
            .join("");

          // Strip JSON code blocks from display
          const displayText = fullText
            .replace(/```json\s*\{[\s\S]*?\}\s*```\n?/g, "")
            .trim();

          const toolParts = parts.filter((p: AnyPart) =>
            String(p.type ?? "").startsWith("tool-")
          );

          // Find annotations belonging to this message
          const msgAnnotations = Object.entries(annotations)
            .filter(([key]) => key.startsWith(m.id))
            .map(([, v]) => v);

          const isLastMsg = m.id === messages[messages.length - 1]?.id;
          const msgStreaming = isLoading && isLastMsg;

          return (
            <div key={m.id}>
              {m.role === "user" && (
                <div className="px-3 flex justify-end">
                  <div className="max-w-[85%] flex flex-col items-end gap-1">
                    {/* Image attachments */}
                    {parts.filter((p: AnyPart) => p.type === "file").map((p: AnyPart, fi: number) => (
                      p.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={fi}
                          src={p.url}
                          alt="附图"
                          className="max-h-48 max-w-full rounded-xl border border-bd-strong object-contain"
                        />
                      )
                    ))}
                    {fullText && (
                      <div className="bg-surface3 text-t1 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap border border-bd">
                        {fullText}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {m.role !== "user" && (displayText || (!msgStreaming && toolParts.length > 0)) && (
                <div className="px-3">
                  <div className="bg-surface2 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed text-t1 markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{
                      // Preserve intentional line breaks: single \n → <br> before markdown parsing
                      displayText.replace(/(?<!\n)\n(?!\n)/g, "  \n")
                    }</ReactMarkdown>
                    <ToolCallsBlock parts={parts} isStreaming={msgStreaming} />
                  </div>
                </div>
              )}
              {/* Render cards for this message */}
              {msgAnnotations.map((ann, i) => {
                if (ann.type === "plan_checkpoint" && onCheckpointConfirmed && projectFormat === "graphic") {
                  return (
                    <GraphicPlanCheckpointCard
                      key={i}
                      projectId={projectId}
                      data={{ cardCount: ann.data.cardCount ?? 0, titles: ann.data.titles, recommendedThemes: ann.data.recommendedThemes }}
                      onConfirmed={onCheckpointConfirmed}
                    />
                  );
                }
                if (ann.type === "plan_checkpoint" && onCheckpointConfirmed && projectFormat !== "graphic") {
                  return (
                    <PlanCheckpointCard
                      key={i}
                      projectId={projectId}
                      data={{
                        scriptWordCount: (ann.data as CheckpointData).scriptWordCount ?? 0,
                        outlineChapters: (ann.data as CheckpointData).outlineChapters ?? 0,
                        outlineSteps: (ann.data as CheckpointData).outlineSteps ?? 0,
                        recommendedThemes: ann.data.recommendedThemes,
                      }}
                      onConfirmed={onCheckpointConfirmed}
                    />
                  );
                }
                if (ann.type === "illustration_checkpoint") {
                  // Don't trigger side-effects for history messages
                  const isHistory = historyMsgIdsRef.current.has(m.id);
                  if (!ann.data.shotList || ann.data.shotList.length === 0) {
                    if (isHistory) return null;
                    return (
                      <AutoSkipIllustration
                        key={i}
                        onSkipped={() => onIllustrationDone?.([])}
                      />
                    );
                  }
                  return (
                    <IllustrationCheckpointCard
                      key={i}
                      projectId={projectId}
                      shotList={ann.data.shotList}
                      onConfirmed={isHistory ? () => {} : (illustrations) => onIllustrationDone?.(illustrations)}
                      onSkipped={isHistory ? () => {} : () => onIllustrationDone?.([])}
                    />
                  );
                }
                                if (ann.type === "music_checkpoint") {
                  return (
                    <MusicCheckpointCard
                      key={i}
                      projectId={projectId}
                      articleTitle={ann.data.articleTitle ?? projectTitle}
                      onConfirm={() => onProjectDone?.()}
                      onSkip={() => onProjectDone?.()}
                    />
                  );
                }
              })}
            </div>
          );
        })}
        )()}
        {/* ── Build progress card (appears when chapters are being built) ── */}
        {(() => {
          const hasActive = chapters.some(c => c.status === "building" || c.status === "pending" || c.status === "review");
          const allDone = chapters.length > 0 && chapters.every(c => c.status === "done");
          if (!hasActive && !allDone) return null;
          return <BuildProgressCard chapters={chapters} onRebuildChapter={onRebuildChapter} />;
        })()}
        {contentCheckpoint && onContentConfirm && (
          <ContentCheckpointCard
            projectId={projectId}
            scriptWordCount={contentStats?.scriptWords ?? 0}
            outlineChapters={contentStats?.outlineChapters ?? 0}
            outlineSteps={contentStats?.outlineSteps ?? 0}
            onConfirm={onContentConfirm}
          />
        )}
        {(isLoading || illGenRunning) && (
          <div className="px-3">
            <div className="flex items-center gap-2.5 bg-brand-subtle border border-brand/20 rounded-xl px-4 py-2.5">
              <span className="flex gap-1 items-end h-4 shrink-0">
                {['#d97706', '#b45309', '#92400e'].map((color, i) => (
                  <span
                    key={i}
                    className="w-1.5 rounded-full animate-pulse"
                    style={{ height: "12px", animationDelay: `${i * 0.15}s`, animationDuration: "0.9s", backgroundColor: color }}
                  />
                ))}
              </span>
              <span className="text-sm font-medium text-brand-text">
                {illGenRunning && illGenProgress
                  ? `生图中 ${illGenProgress.done}/${illGenProgress.total}`
                  : "任务执行中"}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {streamError && !isLoading && (
        <div className="px-3 pb-2 shrink-0">
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2">
            <span className="text-red-400 shrink-0 text-xs">⚠</span>
            <span className="text-xs text-red-600 flex-1 truncate">连接中断：{streamError}</span>
            <button
              onClick={() => {
                setStreamError(null);
                const lastUserMsg = messages.filter(m => m.role === "user").pop();
                if (lastUserMsg) {
                  sendMessage({ role: "user" as const, parts: lastUserMsg.parts });
                } else {
                  triggerSend("请继续。");
                }
              }}
              className="text-xs font-medium text-red-600 hover:text-red-800 underline shrink-0"
            >
              重试 →
            </button>
          </div>
        </div>
      )}


      {/* Selected element / whole-page context chip */}
      {(selectedElement || wholePageContext) && (
        <div className="px-3 pb-1 shrink-0">
          <div className="flex items-center gap-2 rounded-lg bg-surface2 border border-bd px-3 py-1.5">
            <span className="text-t3 shrink-0 text-xs">◈</span>
            {wholePageContext ? (
              <span className="text-xs text-t2 flex-1 truncate">
                <span className="font-medium">整个步骤页面</span>
                <span className="text-t3"> · {wholePageContext.chapterTitle || wholePageContext.chapterId} Step {wholePageContext.stepIndex + 1}</span>
              </span>
            ) : selectedElement && (
              <span className="text-xs text-t2 flex-1 truncate">
                <span className="font-medium">{selectedElement.tagName}</span>
                {selectedElement.textContent && (
                  <span className="text-t3"> · "{selectedElement.textContent.slice(0, 40)}{selectedElement.textContent.length > 40 ? "…" : ""}"</span>
                )}
                <span className="text-t3"> · Ch.{selectedElement.chapterId} Step {selectedElement.stepIndex + 1}</span>
              </span>
            )}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="border-t border-bd p-3 flex flex-col gap-2"
      >
        {/* Pending image previews */}
        {pendingImages.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {pendingImages.map((img, i) => (
              <div key={i} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="h-16 w-16 object-cover rounded-lg border border-bd"
                />
                <button
                  type="button"
                  onClick={() => setPendingImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent text-t1 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          {/* Image/video upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 text-t3 hover:text-t2 p-2 rounded-xl hover:bg-surface2 transition-colors"
            title="上传图片或视频素材（图片会附加到对话，视频会存入项目素材库）"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <circle cx="5.5" cy="6.5" r="1" fill="currentColor"/>
              <path d="M1.5 11l3.5-3.5 2.5 2.5 2-2 3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) addImageFiles(e.target.files); e.target.value = ""; }}
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="发消息给 AI…"
            className="flex-1 rounded-xl border border-bd px-3 py-2 text-sm outline-none focus:border-bd-strong focus:ring-2 focus:ring-input-focus"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={() => { stop(); setStreamError(null); }}
              className="rounded-xl bg-red-500 hover:bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              停止
            </button>
          ) : (
            <button
              type="submit"
              disabled={(!input.trim() && pendingImages.length === 0) || isLoading}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-text hover:bg-accent-hover disabled:opacity-40 transition-colors"
            >
              发送
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function AutoSkipIllustration({ onSkipped }: { onSkipped: () => void }) {
  const calledRef = useRef(false);
  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    onSkipped();
  }, [onSkipped]);
  return null;
}
