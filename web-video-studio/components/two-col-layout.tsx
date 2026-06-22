"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PANEL_HEADER_H = 36;
const COLLAPSE_ANIM = "transition-all duration-200";

interface TwoColLayoutProps {
  navbar: React.ReactNode;
  main: React.ReactNode;
  panel: React.ReactNode;
  preview?: React.ReactNode;
  filePanelActions?: React.ReactNode;
  defaultPanelWidth?: number;
  defaultPanelWidthRatio?: number;
  defaultPreviewRatio?: number;
  minMainWidth?: number;
  minPanelWidth?: number;
}

export function TwoColLayout({
  navbar,
  main,
  panel,
  preview,
  filePanelActions,
  defaultPanelWidth = 480,
  defaultPanelWidthRatio,
  defaultPreviewRatio = 0.55,
  minMainWidth = 320,
  minPanelWidth = 240,
}: TwoColLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const [panelWidth, setPanelWidth] = useState(() => {
    if (defaultPanelWidthRatio && typeof window !== "undefined") {
      return Math.round(window.innerWidth * defaultPanelWidthRatio);
    }
    return defaultPanelWidth;
  });
  const hDragging = useRef(false);
  const hStartX = useRef(0);
  const hStartW = useRef(0);

  const [previewRatio, setPreviewRatio] = useState(defaultPreviewRatio);
  const [filePanelCollapsed, setFilePanelCollapsed] = useState(false);
  const savedRatioRef = useRef(defaultPreviewRatio);
  const vDragging = useRef(false);
  const vStartY = useRef(0);
  const vStartRatio = useRef(defaultPreviewRatio);

  function toggleFilePanel() {
    if (filePanelCollapsed) {
      setPreviewRatio(savedRatioRef.current);
      setFilePanelCollapsed(false);
    } else {
      savedRatioRef.current = previewRatio;
      setPreviewRatio(1);
      setFilePanelCollapsed(true);
    }
  }

  const onHMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    hDragging.current = true;
    hStartX.current = e.clientX;
    hStartW.current = panelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [panelWidth]);

  const onVMouseDown = useCallback((e: React.MouseEvent) => {
    if (filePanelCollapsed) return;
    e.preventDefault();
    vDragging.current = true;
    vStartY.current = e.clientY;
    vStartRatio.current = previewRatio;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, [previewRatio, filePanelCollapsed]);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (hDragging.current && containerRef.current) {
        const containerW = containerRef.current.offsetWidth;
        const delta = hStartX.current - e.clientX;
        const next = Math.min(containerW - minMainWidth, Math.max(minPanelWidth, hStartW.current + delta));
        setPanelWidth(next);
      }
      if (vDragging.current && rightRef.current) {
        const rightH = rightRef.current.offsetHeight;
        if (rightH === 0) return;
        const dy = e.clientY - vStartY.current;
        const deltaRatio = dy / rightH;
        const next = Math.min(0.85, Math.max(0.15, vStartRatio.current + deltaRatio));
        setPreviewRatio(next);
      }
    }
    function onMouseUp() {
      if (hDragging.current) { hDragging.current = false; document.body.style.cursor = ""; }
      if (vDragging.current) { vDragging.current = false; document.body.style.cursor = ""; }
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [minMainWidth, minPanelWidth]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-base">
      <div className="shrink-0 border-b border-bd bg-modal">
        {navbar}
      </div>

      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {main}
        </div>

        <div
          onMouseDown={onHMouseDown}
          className="w-1 shrink-0 cursor-col-resize bg-[var(--border)] hover:bg-accent transition-colors active:bg-accent select-none"
        />

        <div
          ref={rightRef}
          className="shrink-0 flex flex-col border-l border-bd bg-modal overflow-hidden"
          style={{ width: panelWidth }}
        >
          {preview ? (
            <>
              {/* Preview — expands when file panel collapsed */}
              <div
                className={`shrink-0 flex flex-col overflow-hidden border-b border-bd ${COLLAPSE_ANIM}`}
                style={{
                  height: filePanelCollapsed
                    ? `calc(100% - ${PANEL_HEADER_H}px)`
                    : `${previewRatio * 100}%`,
                }}
              >
                {preview}
              </div>

              {/* Vertical resizer — hidden when collapsed */}
              {!filePanelCollapsed && (
                <div
                  onMouseDown={onVMouseDown}
                  className="h-1 shrink-0 cursor-row-resize bg-[var(--border)] hover:bg-accent transition-colors active:bg-accent select-none"
                />
              )}

              {/* File panel with built-in collapse header */}
              <div
                className={`flex flex-col overflow-hidden ${COLLAPSE_ANIM} ${filePanelCollapsed ? "shrink-0" : "flex-1"}`}
                style={filePanelCollapsed ? { height: PANEL_HEADER_H } : undefined}
              >
                {/* Collapse/expand header bar */}
                <div
                  className="flex items-center px-3 border-b border-bd shrink-0 bg-modal"
                  style={{ height: PANEL_HEADER_H }}
                >
                  <span className="text-xs font-semibold text-t2 flex-1">项目文件</span>
                  {filePanelActions && (
                    <div className="flex items-center gap-1 mr-2">
                      {filePanelActions}
                    </div>
                  )}
                  <button
                    onClick={toggleFilePanel}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg bg-t1 text-base hover:opacity-80 transition-opacity"
                  >
                    {filePanelCollapsed ? "展开 ↑" : "收起 ↓"}
                  </button>
                </div>

                {/* Panel body */}
                {!filePanelCollapsed && (
                  <div className="flex-1 overflow-hidden flex flex-col">
                    {panel}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {panel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
