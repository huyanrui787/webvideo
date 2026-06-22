"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface WysiwygEditEntry {
  chapter: string;
  step: number;
  selector: string;
  selectorIndex: number;
  translate: string | null;
  width: string | null;
  height: string | null;
  hidden: boolean;
}

export interface SelectedElementInfo {
  tagName: string;
  className: string;
  textContent: string;
  rect: { x: number; y: number; width: number; height: number };
  chapterId: string;
  stepIndex: number;
  selector: string;
  selectorIndex: number;
  // legacy fields used by ChatPanel
  xpath?: string;
  isConditionalStep?: boolean;
}

interface WysiwygOverlayProps {
  projectId: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  editMode: boolean;
  selectedElement: SelectedElementInfo | null;
  onCommitEdit: (entry: WysiwygEditEntry) => Promise<void>;
  onDeleteEdit: (key: string) => Promise<void>;
  onResetEdit: (entry: Pick<WysiwygEditEntry, "chapter" | "step" | "selector" | "selectorIndex">) => Promise<void>;
  onSendToIframe: (msg: object) => void;
}

interface OverlayRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const HANDLE_DIRS = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
type HandleDir = typeof HANDLE_DIRS[number];

const HANDLE_STYLE: Record<HandleDir, { top?: string; bottom?: string; left?: string; right?: string; transform?: string }> = {
  nw: { top: "-4px", left: "-4px" },
  n:  { top: "-4px", left: "50%", transform: "translateX(-50%)" },
  ne: { top: "-4px", right: "-4px" },
  e:  { top: "50%", right: "-4px", transform: "translateY(-50%)" },
  se: { bottom: "-4px", right: "-4px" },
  s:  { bottom: "-4px", left: "50%", transform: "translateX(-50%)" },
  sw: { bottom: "-4px", left: "-4px" },
  w:  { top: "50%", left: "-4px", transform: "translateY(-50%)" },
};

const HANDLE_CURSOR: Record<HandleDir, string> = {
  nw: "nw-resize", n: "n-resize", ne: "ne-resize", e: "e-resize",
  se: "se-resize", s: "s-resize", sw: "sw-resize", w: "w-resize",
};

function editKey(e: Pick<WysiwygEditEntry, "chapter" | "step" | "selector" | "selectorIndex">): string {
  return `${e.chapter}:${e.step}:${e.selector}:${e.selectorIndex}`;
}

export function WysiwygOverlay({
  projectId,
  iframeRef,
  containerRef,
  editMode,
  selectedElement,
  onCommitEdit,
  onDeleteEdit,
  onResetEdit,
  onSendToIframe,
}: WysiwygOverlayProps) {
  // The overlay rect is in container-relative coordinates
  const [overlayRect, setOverlayRect] = useState<OverlayRect | null>(null);
  const [iframeScale, setIframeScale] = useState({ x: 1, y: 1 });
  const [iframeOffset, setIframeOffset] = useState({ left: 0, top: 0 });

  // Resize state
  const resizeStateRef = useRef<{
    dir: HandleDir;
    startX: number;
    startY: number;
    originW: number;
    originH: number;
    originLeft: number;
    originTop: number;
    stageW: number;
    stageH: number;
  } | null>(null);

  // Debounce timer for API calls during live drag
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastElementRef = useRef<SelectedElementInfo | null>(null);
  lastElementRef.current = selectedElement;

  // Sync iframe geometry every rAF (iframe rect + scale)
  useEffect(() => {
    if (!editMode) return;
    let rafId: number;
    function tick() {
      const iframe = iframeRef.current;
      const container = containerRef.current;
      if (iframe && container) {
        const ifr = iframe.getBoundingClientRect();
        const con = container.getBoundingClientRect();
        const newOffset = { left: ifr.left - con.left, top: ifr.top - con.top };
        const newScale = {
          x: ifr.width > 0 ? ifr.width / 1920 : 1,
          y: ifr.height > 0 ? ifr.height / 1080 : 1,
        };
        setIframeOffset(newOffset);
        setIframeScale(newScale);
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [editMode, iframeRef, containerRef]);

  // Convert iframe-space rect (iframe-viewport px) to container-relative position.
  // el.getBoundingClientRect() inside iframe returns coords relative to the iframe's
  // own viewport origin (0,0 = top-left of iframe), NOT the page viewport.
  // Correct formula: containerLeft = (iframe.left - container.left) + rect.x
  const toContainerRect = useCallback((rect: { x: number; y: number; width: number; height: number }): OverlayRect => {
    const container = containerRef.current?.getBoundingClientRect();
    const iframe = iframeRef.current?.getBoundingClientRect();
    if (!container || !iframe) return { left: rect.x, top: rect.y, width: rect.width, height: rect.height };
    return {
      left: (iframe.left - container.left) + rect.x,
      top: (iframe.top - container.top) + rect.y,
      width: rect.width,
      height: rect.height,
    };
  }, [containerRef, iframeRef]);

  // Update overlay when selected element changes
  useEffect(() => {
    if (!selectedElement) { setOverlayRect(null); return; }
    setOverlayRect(toContainerRect(selectedElement.rect));
  }, [selectedElement, toContainerRect]);

  // Listen for live element-transform messages to update overlay position during drag
  useEffect(() => {
    if (!editMode) return;
    function onMsg(e: MessageEvent) {
      if (e.data?.type === "element-transform") {
        const { rect, final, chapter, step, selector, selectorIndex, translate } = e.data.data as {
          rect: { x: number; y: number; width: number; height: number };
          final: boolean;
          chapter: string;
          step: number;
          selector: string;
          selectorIndex: number;
          translate: string;
        };
        setOverlayRect(toContainerRect(rect));
        if (final && lastElementRef.current) {
          const entry: WysiwygEditEntry = {
            chapter, step, selector, selectorIndex,
            translate,
            width: null, height: null, hidden: false,
          };
          onCommitEdit(entry);
        }
      } else if (e.data?.type === "element-resized") {
        const { rect, chapter, step, selector, selectorIndex, width, height } = e.data.data as {
          rect: { x: number; y: number; width: number; height: number };
          chapter: string; step: number; selector: string; selectorIndex: number;
          width: string | null; height: string | null;
        };
        setOverlayRect(toContainerRect(rect));
        const el = lastElementRef.current;
        if (el) {
          const entry: WysiwygEditEntry = {
            chapter, step, selector, selectorIndex,
            translate: null, width, height, hidden: false,
          };
          onCommitEdit(entry);
        }
      } else if (e.data?.type === "element-deleted") {
        setOverlayRect(null);
        const { chapter, step, selector, selectorIndex } = e.data.data as Pick<WysiwygEditEntry, "chapter" | "step" | "selector" | "selectorIndex">;
        const entry: WysiwygEditEntry = {
          chapter, step, selector, selectorIndex,
          translate: null, width: null, height: null, hidden: true,
        };
        onCommitEdit(entry);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [editMode, toContainerRect, onCommitEdit]);

  // Handle resize from parent overlay handles
  const handleResizePointerDown = useCallback((e: React.PointerEvent, dir: HandleDir) => {
    if (!overlayRect || !selectedElement) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const stageW = overlayRect.width / iframeScale.x;
    const stageH = overlayRect.height / iframeScale.y;

    resizeStateRef.current = {
      dir,
      startX: e.clientX,
      startY: e.clientY,
      originW: stageW,
      originH: stageH,
      originLeft: overlayRect.left,
      originTop: overlayRect.top,
      stageW,
      stageH,
    };
  }, [overlayRect, selectedElement, iframeScale]);

  const handleResizePointerMove = useCallback((e: React.PointerEvent) => {
    const rs = resizeStateRef.current;
    if (!rs || !overlayRect) return;
    e.preventDefault();

    const dx = e.clientX - rs.startX;
    const dy = e.clientY - rs.startY;
    const stageDx = dx / iframeScale.x;
    const stageDy = dy / iframeScale.y;

    let newW = rs.originW;
    let newH = rs.originH;

    const dir = rs.dir;
    if (dir.includes("e")) newW = Math.max(20, rs.originW + stageDx);
    if (dir.includes("w")) newW = Math.max(20, rs.originW - stageDx);
    if (dir.includes("s")) newH = Math.max(20, rs.originH + stageDy);
    if (dir.includes("n")) newH = Math.max(20, rs.originH - stageDy);

    // Update preview rect
    let newLeft = overlayRect.left;
    let newTop = overlayRect.top;
    if (dir.includes("w")) newLeft = rs.originLeft + dx - (newW - rs.originW) * iframeScale.x;
    if (dir.includes("n")) newTop = rs.originTop + dy - (newH - rs.originH) * iframeScale.y;

    setOverlayRect({
      left: newLeft,
      top: newTop,
      width: Math.round(newW * iframeScale.x),
      height: Math.round(newH * iframeScale.y),
    });

    // Send live resize to iframe
    onSendToIframe({ type: "apply-resize", width: Math.round(newW), height: Math.round(newH) });
  }, [overlayRect, iframeScale, onSendToIframe]);

  const handleResizePointerUp = useCallback((_e: React.PointerEvent) => {
    resizeStateRef.current = null;
    // element-resized message from iframe triggers onCommitEdit
  }, []);

  // Toolbar actions
  function handleDelete() {
    onSendToIframe({ type: "delete-selected" });
  }

  function handleReset() {
    const el = selectedElement;
    if (!el) return;
    const key = editKey({ chapter: el.chapterId, step: el.stepIndex, selector: el.selector, selectorIndex: el.selectorIndex });
    onResetEdit({ chapter: el.chapterId, step: el.stepIndex, selector: el.selector, selectorIndex: el.selectorIndex });
    onSendToIframe({ type: "reset-selected" });
    setOverlayRect(null);
  }

  if (!editMode || !overlayRect) return null;

  const toolbarTop = overlayRect.top - 32;
  const toolbarVisible = overlayRect.top > 32;

  return (
    <div className="absolute inset-0 pointer-events-none z-20" style={{ overflow: "visible" }}>
      {/* Selection box */}
      <div
        style={{
          position: "absolute",
          left: overlayRect.left,
          top: overlayRect.top,
          width: overlayRect.width,
          height: overlayRect.height,
          boxSizing: "border-box",
          border: "2px solid #6366f1",
          pointerEvents: "none",
        }}
      >
        {/* Resize handles */}
        {HANDLE_DIRS.map((dir) => (
          <div
            key={dir}
            data-no-advance=""
            onPointerDown={(e) => handleResizePointerDown(e, dir)}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerUp}
            style={{
              position: "absolute",
              width: 8,
              height: 8,
              background: "white",
              border: "2px solid #6366f1",
              borderRadius: "50%",
              boxSizing: "border-box",
              cursor: HANDLE_CURSOR[dir],
              pointerEvents: "auto",
              zIndex: 1,
              ...HANDLE_STYLE[dir],
            }}
          />
        ))}
      </div>

      {/* Toolbar */}
      {selectedElement && (
        <div
          style={{
            position: "absolute",
            left: overlayRect.left,
            top: toolbarVisible ? toolbarTop : overlayRect.top + overlayRect.height + 4,
            display: "flex",
            alignItems: "center",
            gap: 4,
            pointerEvents: "auto",
            zIndex: 10,
          }}
          data-no-advance=""
        >
          {/* Element label */}
          <span
            style={{
              background: "#6366f1",
              color: "white",
              fontSize: 11,
              padding: "1px 6px",
              borderRadius: 4,
              fontFamily: "monospace",
              whiteSpace: "nowrap",
              userSelect: "none",
            }}
          >
            {selectedElement.tagName}
            {selectedElement.className ? `.${selectedElement.className.trim().split(/\s+/)[0]}` : ""}
          </span>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            title="删除元素 (Delete)"
            style={{
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: 4,
              padding: "1px 7px",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >
            ✕
          </button>

          {/* Reset button */}
          <button
            onClick={handleReset}
            title="重置编辑"
            style={{
              background: "rgba(255,255,255,0.9)",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              padding: "1px 7px",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >
            ↺
          </button>
        </div>
      )}
    </div>
  );
}
