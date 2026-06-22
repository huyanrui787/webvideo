"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { FileTreeNode } from "@/app/api/projects/[id]/files-tree/route";
import type { ChapterProgress } from "./chapter-progress-panel";

interface CodeFileTreeProps {
  projectId: string;
  chapters: ChapterProgress[];
  devPort?: number | null;
}

const CHAPTER_STATUS_ICON: Record<ChapterProgress["status"], string> = {
  pending: "○",
  building: "◌",
  review: "◎",
  done: "●",
  error: "✕",
  validating: "◎",
  skipped: "−",
  timeout: "⏱",
};
const CHAPTER_STATUS_COLOR: Record<ChapterProgress["status"], string> = {
  pending: "text-t4",
  building: "text-purple-500",
  review: "text-yellow-500",
  done: "text-green-500",
  error: "text-red-500",
  validating: "text-purple-400",
  skipped: "text-t4",
  timeout: "text-orange-500",
};

function chapterIdFromPath(dirName: string): string {
  // e.g. "coldopen" or "01-coldopen" → "coldopen"
  return dirName.replace(/^\d+-/, "");
}

function langFromName(name: string): string {
  if (name.endsWith(".tsx") || name.endsWith(".ts")) return "typescript";
  if (name.endsWith(".css")) return "css";
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".html")) return "html";
  return "text";
}

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "mov"]);

type PreviewKind = "svg" | "image" | "video" | "primitive" | null;

function detectPreview(name: string): PreviewKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "svg") return "svg";
  if (IMAGE_EXTS.has(ext)) return "image";
  if (VIDEO_EXTS.has(ext)) return "video";
  return null;
}

// Returns the component name (e.g. "GeoGlobe") if the path points at a
// primitive, else null. Pattern: presentation/src/primitives/<cat>/<Name>.tsx
function extractPrimitiveName(filePath: string): string | null {
  const m = filePath.match(/^presentation\/src\/primitives\/[^/]+\/([A-Z][A-Za-z0-9]+)\.tsx$/);
  return m ? m[1] : null;
}

interface TreeNodeProps {
  node: FileTreeNode;
  depth: number;
  expanded: Set<string>;
  selected: string | null;
  chapters: ChapterProgress[];
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
}

function TreeNode({
  node,
  depth,
  expanded,
  selected,
  chapters,
  onToggle,
  onSelect,
}: TreeNodeProps) {
  const indent = depth * 12;

  if (node.type === "dir") {
    const isOpen = expanded.has(node.path);
    // Check if this dir is a chapter directory
    const chId = chapterIdFromPath(node.name);
    const chapterInfo = chapters.find(
      (c) => c.id === chId || c.id === node.name
    );

    return (
      <div>
        <button
          onClick={() => onToggle(node.path)}
          className="flex items-center gap-1 w-full text-left py-0.5 hover:bg-surface2 rounded transition-colors group"
          style={{ paddingLeft: `${indent + 4}px` }}
        >
          <span className="text-t3 text-xs w-3 shrink-0">
            {isOpen ? "▾" : "▸"}
          </span>
          <span className="text-xs text-t2 font-medium truncate flex-1">
            {node.name}
          </span>
          {chapterInfo && (
            <span
              className={`text-xs shrink-0 mr-1 ${CHAPTER_STATUS_COLOR[chapterInfo.status]} ${chapterInfo.status === "building" ? "animate-pulse" : ""}`}
              title={chapterInfo.status}
            >
              {CHAPTER_STATUS_ICON[chapterInfo.status]}
            </span>
          )}
        </button>
        {isOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                selected={selected}
                chapters={chapters}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File node
  const isSelected = selected === node.path;
  const ext = node.name.split(".").pop() ?? "";
  const extColor: Record<string, string> = {
    tsx: "text-blue-400",
    ts: "text-blue-300",
    css: "text-purple-400",
    json: "text-yellow-500",
    md: "text-t3",
    html: "text-orange-400",
  };

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={`flex items-center gap-1.5 w-full text-left py-0.5 rounded transition-colors ${
        isSelected ? "bg-surface3" : "hover:bg-surface2"
      }`}
      style={{ paddingLeft: `${indent + 4}px` }}
    >
      <span className={`text-xs font-mono shrink-0 ${extColor[ext] ?? "text-t4"}`}>
        ·
      </span>
      <span className={`text-xs truncate ${isSelected ? "text-t1 font-medium" : "text-t2"}`}>
        {node.name}
      </span>
    </button>
  );
}

export function CodeFileTree({ projectId, chapters, devPort }: CodeFileTreeProps) {
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const initializedRef = useRef(false);

  const loadTree = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/files-tree`);
    const data = await res.json();
    setTree(data.tree ?? []);
    setExists(data.exists ?? false);
    setLoading(false);

    // Auto-expand chapters dir only on first load — never reset user's open state
    if (!initializedRef.current && data.tree) {
      const chaptersNode = data.tree.find((n: FileTreeNode) => n.name === "chapters");
      if (chaptersNode) {
        setExpanded(new Set(["presentation/src/chapters"]));
      }
      initializedRef.current = true;
    }
  }, [projectId]);

  useEffect(() => {
    loadTree();
    // Refresh tree every 5s while building
    const interval = setInterval(loadTree, 5000);
    return () => clearInterval(interval);
  }, [loadTree]);

  async function handleSelectFile(filePath: string) {
    setSelected(filePath);
    // Binary previews don't need file content — skip the fetch.
    if (detectPreview(filePath.split("/").pop() ?? "")) {
      setFileContent(null);
      setLoadingFile(false);
      return;
    }
    setLoadingFile(true);
    setFileContent(null);
    const res = await fetch(`/api/projects/${projectId}/files?path=${encodeURIComponent(filePath)}`);
    if (res.ok) {
      const { content } = await res.json();
      setFileContent(content);
    }
    setLoadingFile(false);
  }

  const selectedPrimitive = selected ? extractPrimitiveName(selected) : null;

  function handleToggleDir(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-t3">
        加载中…
      </div>
    );
  }

  if (!exists) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
        <p className="text-3xl">📁</p>
        <p className="text-xs text-t3 text-center">
          脚手架初始化后，这里会显示 presentation/src/ 的文件结构
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* File tree */}
      <div className="flex-shrink-0 overflow-y-auto border-b border-bd" style={selected ? { maxHeight: "45%" } : undefined}>
        <div className="px-1 py-2">
          <p className="text-xs text-t3 font-mono px-3 mb-1 select-none">
            presentation/src/
          </p>
          {tree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              depth={0}
              expanded={expanded}
              selected={selected}
              chapters={chapters}
              onToggle={handleToggleDir}
              onSelect={handleSelectFile}
            />
          ))}
        </div>
      </div>

      {/* File content preview */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {selected ? (
          <>
            <div className="px-3 py-1.5 border-b border-bd shrink-0 flex items-center gap-2">
              <span className="text-xs text-t3 font-mono truncate flex-1">
                {selected.split("/").pop()}
              </span>
              <button
                onClick={() => { setSelected(null); setFileContent(null); }}
                className="text-xs text-t4 hover:text-t2"
              >
                ✕
              </button>
            </div>
            {(() => {
              const previewKind = detectPreview(selected.split("/").pop() ?? "");
              const primitiveName = selectedPrimitive;
              if (previewKind) {
                // Binary previews (svg/image/video) — no source view, no fixed height.
                const rawUrl = `/api/projects/${projectId}/file-raw?path=${encodeURIComponent(selected)}`;
                return (
                  <div className="flex-1 overflow-auto p-4 bg-base flex items-center justify-center min-h-0">
                    {previewKind === "svg" && (
                      <object data={rawUrl} type="image/svg+xml" className="max-w-full max-h-full" />
                    )}
                    {previewKind === "image" && (
                      <img src={rawUrl} alt="" className="max-w-full max-h-full object-contain" />
                    )}
                    {previewKind === "video" && (
                      <video src={rawUrl} controls className="max-w-full max-h-full" />
                    )}
                  </div>
                );
              }
              if (primitiveName) {
                // Primitive .tsx — embed the dev server's presentation, which
                // is the running demo. Source code below for reference.
                return (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-3 py-1.5 border-b border-bd shrink-0 text-[11px] text-t3 flex items-center gap-1.5">
                      <span className="font-semibold text-t2">{primitiveName}</span>
                      <span>·</span>
                      <span>下方为运行中的演示，在里面点触达使用此 Primitive 的章节查看效果</span>
                    </div>
                    {devPort ? (
                      <div className="flex-1 bg-black min-h-0">
                        <iframe
                          src={`http://127.0.0.1:${devPort}?pid=${projectId}&primitive=${encodeURIComponent(primitiveName)}`}
                          className="w-full h-full border-0"
                          title={`${primitiveName} 演示`}
                        />
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-xs text-t3 p-4">
                        预览服务未启动，先在主预览窗口启动 dev server
                      </div>
                    )}
                    <div className="max-h-[40%] overflow-y-auto border-t border-bd">
                      {loadingFile ? (
                        <div className="text-xs text-t3 p-3 animate-pulse">读取中…</div>
                      ) : (
                        <pre className="text-xs font-mono text-t2 p-3 whitespace-pre-wrap break-all leading-relaxed">
                          {fileContent ?? ""}
                        </pre>
                      )}
                    </div>
                  </div>
                );
              }
              return (
                <div className="flex-1 overflow-y-auto">
                  {loadingFile ? (
                    <div className="text-xs text-t3 p-3 animate-pulse">读取中…</div>
                  ) : (
                    <pre className="text-xs font-mono text-t2 p-3 whitespace-pre-wrap break-all leading-relaxed">
                      {fileContent ?? ""}
                    </pre>
                  )}
                </div>
              );
            })()}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-t4">
            点击文件查看内容
          </div>
        )}
      </div>
    </div>
  );
}
