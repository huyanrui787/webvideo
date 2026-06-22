"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Project } from "@/lib/db/schema";

function formatRelativeTime(ts: number): string {
  const d = Math.floor(Date.now() / 1000) - ts;
  if (d < 60) return "刚刚";
  if (d < 3600) return `${Math.floor(d / 60)}分钟前`;
  if (d < 86400) return `${Math.floor(d / 3600)}小时前`;
  if (d < 86400 * 30) return `${Math.floor(d / 86400)}天前`;
  return new Date(ts * 1000).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

type InputMode = "file" | "paste" | "url" | "ai" | "product" | "manim" | "resume" | "draw";
type Format = "video" | "graphic" | "manim" | "resume" | "draw";

export default function HomePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<InputMode>("ai");
  const [format, setFormat] = useState<Format>("video");
  const [dragging, setDragging] = useState(false);
  const [content, setContent] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [fileName, setFileName] = useState("");
  const [creating, setCreating] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [aiTopic, setAiTopic] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState("");
  const [drawPrompt, setDrawPrompt] = useState("");
  const [drawGenerating, setDrawGenerating] = useState(false);
  const [refImages, setRefImages] = useState<File[]>([]);
  const [refExpanded, setRefExpanded] = useState(true);
  const [refReminded, setRefReminded] = useState(false);
  const [actionError, setActionError] = useState("");
  const refImageInputRef = useRef<HTMLInputElement>(null);

  // Redirect to login if unauthorized
  useEffect(() => {
    fetch("/api/projects")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: Project[]) => setRecentProjects(data.slice(0, 4)))
      .catch(() => router.replace("/login"));
  }, [router]);

  function readFile(file: File) {
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    const reader = new FileReader();
    reader.onload = (e) => setContent(e.target?.result as string ?? "");
    reader.readAsText(file, "utf-8");
    setMode("file");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }

  async function handleFetchUrl() {
    if (!urlValue.trim()) return;
    if (needsRefReminder()) {
      setActionError("💡 提示：你可以先上传参考图片，让内容提取更精准。也可以直接再次点击「抓取」跳过。");
      return;
    }
    setUrlError("");
    setFetchingUrl(true);

    // Detect if this is a product site (not an article/blog platform)
    const isProductUrl = !/mp\.weixin\.qq\.com|zhuanlan\.zhihu\.com|juejin\.cn|medium\.com|substack\.com/i.test(urlValue);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: urlValue.trim().split("/").pop()?.slice(0, 40) || "产品演示",
          projectFormat: format,
          projectType: isProductUrl ? "product-demo" : undefined,
        }),
      });
      if (!res.ok) throw new Error("创建项目失败");
      const project = await res.json();

      // Product demo: trigger exploration instead of article fetch
      if (isProductUrl) {
        await fetch(`/api/projects/${project.id}/explore-product`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlValue }),
        });
        await uploadRefImages(project.id);
        router.push(`/projects/${project.id}?autostart=1`);
        return;
      }

      const fetchRes = await fetch(`/api/projects/${project.id}/fetch-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlValue }),
      });
      if (!fetchRes.ok || !fetchRes.body) {
        // Clean up and show error
        await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
        const err = await fetchRes.json().catch(() => ({}));
        setUrlError((err as { error?: string }).error ?? "解析失败，请检查链接是否可访问");
        return;
      }
      // Stream the content — then redirect with autostart
      const reader = fetchRes.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
      }
      // Write article content
      await fetch(`/api/projects/${project.id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "article.md", content: full }),
      });
      await uploadRefImages(project.id);
      router.push(`/projects/${project.id}?autostart=1`);
    } catch {
      setUrlError("网络错误，请重试");
    } finally {
      setFetchingUrl(false);
    }
  }

  async function handleExploreProduct() {
    if (!urlValue.trim()) return;
    setUrlError("");
    setFetchingUrl(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: new URL(urlValue).hostname.replace("www.", "") + " 产品演示",
          projectFormat: format,
          projectType: "product-demo",
        }),
      });
      if (!res.ok) throw new Error("创建项目失败");
      const project = await res.json();

      // Read optional credentials from form
      const usernameEl = document.getElementById("product-username") as HTMLInputElement | null;
      const passwordEl = document.getElementById("product-password") as HTMLInputElement | null;
      const creds: Record<string, string> = { url: urlValue };
      if (usernameEl?.value && passwordEl?.value) {
        creds.username = usernameEl.value;
        creds.password = passwordEl.value;
      }

      // Trigger product exploration
      await fetch(`/api/projects/${project.id}/explore-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      router.push(`/projects/${project.id}?autostart=1`);
    } catch (err: any) {
      setUrlError(err.message ?? "探索失败，请检查链接是否可访问");
      setFetchingUrl(false);
    }
  }

  async function handleAiGenerate() {
    setActionError("");
    if (!aiTopic.trim()) return;
    if (needsRefReminder()) {
      setActionError("💡 提示：你可以先上传参考图片（支持文章截图、风格参考），让生成更贴合你的需求。也可以直接再次点击「AI 写文章」跳过。");
      return;
    }
    setAiGenerating(true);
    setAiPreview("");
    try {
      // Create project first
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: aiTopic.trim(), projectFormat: format }),
      });
      if (!res.ok) throw new Error("创建项目失败");
      const project = await res.json();

      // Stream article generation
      const genRes = await fetch(`/api/projects/${project.id}/generate-article`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic.trim() }),
      });
      if (!genRes.ok || !genRes.body) throw new Error("生成请求失败");

      const reader = genRes.body.getReader();
      const decoder = new TextDecoder();
      let totalText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        totalText += chunk;
        setAiPreview((prev) => prev + chunk);
      }

      if (!totalText.trim() || totalText.startsWith("[错误]")) {
        setAiPreview(totalText || "生成失败，请重试");
        setAiGenerating(false);
        return;
      }

      await uploadRefImages(project.id);
      router.push(`/projects/${project.id}?autostart=1`);
    } catch (err) {
      setActionError(`生成失败：${err instanceof Error ? err.message : "网络错误，请重试"}`);
      setAiGenerating(false);
    }
  }

  async function handleDrawGenerate() {
    if (!drawPrompt.trim()) return;
    setDrawGenerating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: drawPrompt.trim().slice(0, 40), projectFormat: "draw", drawPrompt: drawPrompt.trim() }),
      });
      if (!res.ok) throw new Error();
      const project = await res.json();
      await uploadRefImages(project.id);
      router.push(`/projects/${project.id}?autostart=1`);
    } catch {
      setDrawGenerating(false);
    }
  }

  async function uploadRefImages(projectId: string) {
    for (const file of refImages) {
      const form = new FormData();
      form.append("file", file);
      await fetch(`/api/projects/${projectId}/assets`, { method: "POST", body: form });
    }
  }

  function needsRefReminder() {
    if (refImages.length > 0 || refReminded) return false;
    setRefReminded(true);
    setRefExpanded(true);
    return true; // Still returns true, but callers should show a toast instead of silently blocking
  }

  async function handleCreate() {
    const articleContent = content.trim();
    if (!articleContent) return;
    if (needsRefReminder()) {
      setActionError("💡 提示：你可以先上传参考图片，让视频风格更精准。也可以直接再次点击「开始创作」跳过。");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: fileName || undefined, projectFormat: format, articleContent }),
      });
      if (!res.ok) throw new Error("创建项目失败");
      const project = await res.json();
      await uploadRefImages(project.id);
      router.push(`/projects/${project.id}?autostart=1`);
    } catch (err) {
      setActionError(`创建失败：${err instanceof Error ? err.message : "网络错误，请重试"}`);
      setCreating(false);
      setCreating(false);
    }
  }

  const hasContent = content.trim().length > 0;
  const canSubmit = mode === "url" ? urlValue.trim().length > 0 : mode === "ai" ? aiTopic.trim().length > 0 : mode === "draw" ? drawPrompt.trim().length > 0 : hasContent;

  return (
    <main className="flex flex-col items-center px-8 pt-16 pb-20">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-t1 leading-tight mb-3">
            一键把文章变成<span className="text-indigo-400">可发布的视频</span>
          </h1>
          <p className="text-t3 text-base">
            不用写脚本、不用拍摄、不用剪辑，让内容轻松表达
          </p>
        </div>

        {/* Input card */}
        <div className="w-full max-w-3xl rounded-2xl border border-bd bg-modal overflow-hidden shadow-lg">
          <div className="flex max-h-[calc(100vh-12rem)] min-h-[26rem]">
            {/* Left: mode selector */}
            <div className="w-44 shrink-0 min-h-0 border-r border-bd p-3 flex flex-col gap-1.5 overflow-y-auto">
              <button
                onClick={() => setMode("ai")}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                  mode === "ai"
                    ? "bg-surface2 text-t1"
                    : "text-t3 hover:text-t2 hover:bg-surface"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mode === "ai" ? "bg-violet-500/20 text-violet-400" : "bg-surface2 text-t3"}`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 1l1.5 3.5L13 6l-3.5 1.5L8 11l-1.5-3.5L3 6l3.5-1.5z"/>
                    <path d="M13 10l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium leading-tight">AI 生成</p>
                  <p className="text-[10px] text-t4 mt-0.5 leading-snug">输入主题即可</p>
                </div>
              </button>

              <button
                onClick={() => setMode("file")}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                  mode === "file"
                    ? "bg-surface2 text-t1"
                    : "text-t3 hover:text-t2 hover:bg-surface"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mode === "file" ? "bg-indigo-500/20 text-indigo-400" : "bg-surface2 text-t3"}`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 1H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V6L9 1z"/>
                    <polyline points="9,1 9,6 14,6"/>
                    <line x1="8" y1="10" x2="8" y2="13"/><line x1="6.5" y1="11.5" x2="9.5" y2="11.5"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium leading-tight">上传文件</p>
                  <p className="text-[10px] text-t4 mt-0.5 leading-snug">.md · .txt</p>
                </div>
              </button>

              <button
                onClick={() => setMode("paste")}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                  mode === "paste"
                    ? "bg-surface2 text-t1"
                    : "text-t3 hover:text-t2 hover:bg-surface"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mode === "paste" ? "bg-indigo-500/20 text-indigo-400" : "bg-surface2 text-t3"}`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="10" height="12" rx="1"/>
                    <path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1"/>
                    <line x1="5" y1="8" x2="9" y2="8"/><line x1="5" y1="11" x2="9" y2="11"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium leading-tight">粘贴文章</p>
                  <p className="text-[10px] text-t4 mt-0.5 leading-snug">文字 · 微信</p>
                </div>
              </button>

              <button
                onClick={() => setMode("url")}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                  mode === "url"
                    ? "bg-surface2 text-t1"
                    : "text-t3 hover:text-t2 hover:bg-surface"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mode === "url" ? "bg-indigo-500/20 text-indigo-400" : "bg-surface2 text-t3"}`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13H13a3 3 0 000-6h-.5A5 5 0 003 9"/>
                    <path d="M6 9H3a3 3 0 000 6h3"/>
                    <line x1="6" y1="12" x2="10" y2="12"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium leading-tight">链接导入</p>
                  <p className="text-[10px] text-t4 mt-0.5 leading-snug">公众号 · 博客</p>
                </div>
              </button>

              <button
                onClick={() => setMode("product")}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                  mode === "product"
                    ? "bg-surface2 text-t1"
                    : "text-t3 hover:text-t2 hover:bg-surface"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mode === "product" ? "bg-rose-500/20 text-rose-400" : "bg-surface2 text-t3"}`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1.5" y="2.5" width="13" height="11" rx="1.5"/>
                    <path d="M5 8.5l2 2 4-4"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium leading-tight">产品讲解</p>
                  <p className="text-[10px] text-t4 mt-0.5 leading-snug">网站 · 演示</p>
                </div>
              </button>

              <button
                onClick={() => { setMode("manim"); setFormat("manim"); }}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                  mode === "manim"
                    ? "bg-surface2 text-t1"
                    : "text-t3 hover:text-t2 hover:bg-surface"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mode === "manim" ? "bg-purple-500/20 text-purple-400" : "bg-surface2 text-t3"}`}>
                  <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 11l-2-4.5L5 2"/>
                    <path d="M11 11l2-4.5L11 2"/>
                    <line x1="7" y1="12" x2="9" y2="0.5"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium leading-tight">Manim 数学</p>
                  <p className="text-[10px] text-t4 mt-0.5 leading-snug">3B1B 风格动画</p>
                </div>
              </button>

              <button
                onClick={() => { setMode("resume"); setFormat("resume"); }}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                  mode === "resume"
                    ? "bg-surface2 text-t1"
                    : "text-t3 hover:text-t2 hover:bg-surface"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mode === "resume" ? "bg-cyan-500/20 text-cyan-400" : "bg-surface2 text-t3"}`}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 0.5h8a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2v-9a2 2 0 012-2z"/>
                    <line x1="4" y1="4" x2="10" y2="4"/>
                    <line x1="4" y1="7" x2="10" y2="7"/>
                    <line x1="4" y1="10" x2="8" y2="10"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium leading-tight">在线简历</p>
                  <p className="text-[10px] text-t4 mt-0.5 leading-snug">响应式网页</p>
                </div>
              </button>

              <button
                onClick={() => { setMode("draw"); setFormat("draw"); }}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                  mode === "draw"
                    ? "bg-surface2 text-t1"
                    : "text-t3 hover:text-t2 hover:bg-surface"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mode === "draw" ? "bg-amber-500/20 text-amber-400" : "bg-surface2 text-t3"}`}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1.5" y="1.5" width="11" height="11" rx="1.5"/>
                    <line x1="4" y1="8" x2="10" y2="8"/>
                    <polyline points="7,4 10,7 7,10"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium leading-tight">智能绘图</p>
                  <p className="text-[10px] text-t4 mt-0.5 leading-snug">架构图/流程图</p>
                </div>
              </button>
            </div>

            {/* Right: input area */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto">
              {(mode === "file" || mode === "manim" || mode === "resume") && (
                <div
                  ref={dropRef}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !hasContent && fileRef.current?.click()}
                  className={`flex-1 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
                    dragging ? "bg-indigo-500/5" : ""
                  }`}
                >
                  {hasContent ? (
                    <div className="w-full h-full p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5L8 1z"/>
                            <polyline points="8,1 8,5 12,5"/>
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-t1">{fileName || "文档"}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setContent(""); setFileName(""); }}
                          className="ml-auto text-t4 hover:text-t2 transition-colors"
                        >
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <line x1="2" y1="2" x2="11" y2="11"/><line x1="11" y1="2" x2="2" y2="11"/>
                          </svg>
                        </button>
                      </div>
                      <div className="flex-1 rounded-xl bg-surface p-3 overflow-hidden">
                        <p className="text-xs text-t3 font-mono line-clamp-6 whitespace-pre-wrap">{content.slice(0, 400)}{content.length > 400 ? "…" : ""}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-bd-hover flex items-center justify-center text-t3">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="10" y1="14" x2="10" y2="6"/><polyline points="7,9 10,6 13,9"/>
                          <path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2"/>
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-t2">拖拽文件到这里，或<span className="text-indigo-400 cursor-pointer"> 点击上传</span></p>
                        <p className="text-xs text-t4 mt-1">.md · .txt</p>
                      </div>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".md,.txt,text/plain,text/markdown"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); }}
                  />
                </div>
              )}

              {mode === "paste" && (
                <textarea
                  autoFocus
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="粘贴文章内容，支持微信公众号等富文本…"
                  className="flex-1 resize-none bg-transparent px-5 py-4 text-sm text-t1 placeholder:text-input-placeholder outline-none"
                />
              )}

              {mode === "url" && (
                <div className="flex-1 flex flex-col px-5 py-4 gap-3">
                  <input
                    autoFocus
                    type="url"
                    value={urlValue}
                    onChange={(e) => { setUrlValue(e.target.value); setUrlError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()}
                    placeholder="https://mp.weixin.qq.com/s/..."
                    className="w-full rounded-xl border border-bd bg-input-bg px-3 py-2.5 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-indigo-500/50"
                  />
                  {urlError && <p className="text-xs text-red-400">{urlError}</p>}
                  {fetchingUrl && (
                    <p className="text-xs text-t3 animate-pulse">正在解析链接…</p>
                  )}
                </div>
              )}

              {mode === "product" && (
                <div className="flex-1 flex flex-col px-5 py-4 gap-3">
                  <input
                    autoFocus
                    type="url"
                    value={urlValue}
                    onChange={(e) => { setUrlValue(e.target.value); setUrlError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleExploreProduct()}
                    placeholder="https://example.com — 输入产品网站链接"
                    className="w-full rounded-xl border border-bd bg-input-bg px-3 py-2.5 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-rose-500/50"
                  />
                  <p className="text-xs text-t4">系统会自动浏览网页、截图、分析功能，然后生成产品讲解视频</p>
                  {/* Login credentials (optional) */}
                  <details className="text-xs">
                    <summary className="text-t3 cursor-pointer hover:text-t2">🔐 需要登录？点击展开填写账密</summary>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        id="product-username"
                        placeholder="用户名 / 邮箱"
                        className="flex-1 rounded-lg border border-bd bg-input-bg px-2.5 py-1.5 text-xs text-t1 placeholder:text-input-placeholder outline-none focus:border-rose-500/50"
                      />
                      <input
                        type="password"
                        id="product-password"
                        placeholder="密码"
                        className="flex-1 rounded-lg border border-bd bg-input-bg px-2.5 py-1.5 text-xs text-t1 placeholder:text-input-placeholder outline-none focus:border-rose-500/50"
                      />
                    </div>
                  </details>
                  {urlError && <p className="text-xs text-red-400">{urlError}</p>}
                  {fetchingUrl && (
                    <p className="text-xs text-t3 animate-pulse">正在探索产品网站…</p>
                  )}
                </div>
              )}

              {mode === "ai" && (
                <div className="flex-1 flex flex-col px-5 py-4 gap-3">
                  <input
                    autoFocus
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !aiGenerating && handleAiGenerate()}
                    placeholder="输入主题，例如：量子计算入门、区块链技术原理…"
                    className="w-full rounded-xl border border-bd bg-input-bg px-3 py-2.5 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-violet-500/50"
                  />
                  {aiGenerating && (
                    <div className="flex-1 rounded-xl bg-surface p-3 overflow-hidden">
                      <p className="text-xs text-t3 font-mono line-clamp-6 whitespace-pre-wrap animate-pulse">
                        {aiPreview || "AI 正在生成文章…"}
                      </p>
                    </div>
                  )}
                  {!aiGenerating && (
                    <p className="text-xs text-t4">AI 将根据主题自动生成一篇科普文章，再帮你制作成视频</p>
                  )}
                </div>
              )}

              {mode === "draw" && (
                <div className="flex-1 flex flex-col px-5 py-4 gap-3">
                  <textarea
                    autoFocus
                    value={drawPrompt}
                    onChange={(e) => setDrawPrompt(e.target.value)}
                    placeholder="描述你想画的图，例如：微服务架构图，包含 API 网关、用户服务、订单服务、消息队列…"
                    rows={4}
                    className="flex-1 resize-none rounded-xl border border-bd bg-input-bg px-3 py-2.5 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-amber-500/50"
                  />
                  {!drawGenerating && (
                    <p className="text-xs text-t4">支持架构图、流程图、UML 图、思维导图等，AI 自动生成可编辑的矢量图</p>
                  )}
                </div>
              )}

              {/* Reference images strip */}
              {refExpanded && (
                <div className={`border-t px-4 py-3 flex flex-col gap-2 transition-colors ${refReminded && refImages.length === 0 ? "border-indigo-400/50 bg-indigo-500/5" : "border-bd"}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {refImages.map((f, i) => (
                      <div key={i} className="relative group w-12 h-12 shrink-0">
                        <img
                          src={URL.createObjectURL(f)}
                          alt={f.name}
                          className="w-12 h-12 object-cover rounded-lg border border-bd"
                        />
                        <button
                          onClick={() => setRefImages((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-t1 text-base rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >×</button>
                      </div>
                    ))}
                    <button
                      onClick={() => refImageInputRef.current?.click()}
                      className="w-12 h-12 shrink-0 rounded-lg border border-dashed border-bd-hover flex items-center justify-center text-t4 hover:text-t3 hover:border-bd-strong transition-colors"
                      title="添加图片"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/>
                      </svg>
                    </button>
                    <input
                      ref={refImageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) setRefImages((prev) => [...prev, ...Array.from(e.target.files!)].slice(0, 8));
                        e.target.value = "";
                      }}
                    />
                  </div>
                  <p className={`text-[10px] transition-colors ${refReminded && refImages.length === 0 ? "text-indigo-400" : "text-t4"}`}>
                    {refReminded && refImages.length === 0
                      ? "有 logo 或参考风格图吗？上传后 AI 规划时会参考，也可以跳过直接生成"
                      : "参考图片会在 AI 规划前上传到项目素材库，最多 8 张"}
                  </p>
                </div>
              )}
              </div>

              {/* Bottom bar */}
              <div className="shrink-0 border-t border-bd px-4 py-3 flex items-center gap-3">
                {/* Format picker */}
                <div className="flex items-center gap-1 rounded-lg border border-bd p-0.5">
                  <button
                    onClick={() => setFormat("video")}
                    title="视频演示 16:9"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                      format === "video"
                        ? "bg-surface2 text-t1 font-medium"
                        : "text-t4 hover:text-t3"
                    }`}
                  >
                    <svg width="12" height="9" viewBox="0 0 12 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="0.5" y="0.5" width="11" height="8" rx="1"/>
                    </svg>
                    视频
                  </button>
                  <button
                    onClick={() => setFormat("graphic")}
                    title="图文卡片 9:16"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                      format === "graphic"
                        ? "bg-surface2 text-t1 font-medium"
                        : "text-t4 hover:text-t3"
                    }`}
                  >
                    <svg width="7" height="11" viewBox="0 0 7 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="0.5" y="0.5" width="6" height="10" rx="1"/>
                    </svg>
                    图文
                  </button>
                </div>

                {/* Reference image toggle */}
                <button
                  onClick={() => setRefExpanded((v) => !v)}
                  title="添加参考图片（可选）"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                    refExpanded || refImages.length > 0
                      ? "border-indigo-400/50 text-indigo-400 bg-indigo-500/10"
                      : "border-bd text-t4 hover:text-t3 hover:border-bd-hover"
                  }`}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="2.5" width="11" height="8" rx="1"/>
                    <circle cx="4.5" cy="5.5" r="1"/>
                    <path d="M1.5 10l3-3 2 2 1.5-1.5 3 3"/>
                  </svg>
                  {refImages.length > 0 ? `参考图 ${refImages.length}` : "参考图片"}
                </button>

                <div className="flex-1" />

                {mode === "product" ? (
                  <button
                    onClick={handleExploreProduct}
                    disabled={!urlValue.trim() || fetchingUrl}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-sm font-medium text-white disabled:opacity-40 transition-colors"
                  >
                    {fetchingUrl ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        探索中
                      </>
                    ) : (
                      <>
                        🔍 探索产品并生成
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="2" y1="6.5" x2="11" y2="6.5"/><polyline points="7.5,3 11,6.5 7.5,10"/>
                        </svg>
                      </>
                    )}
                  </button>
                ) : mode === "url" ? (
                  <button
                    onClick={handleFetchUrl}
                    disabled={!urlValue.trim() || fetchingUrl}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-medium text-white disabled:opacity-40 transition-colors"
                  >
                    {fetchingUrl ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        解析中
                      </>
                    ) : "解析并生成"}
                  </button>
                ) : mode === "ai" ? (
                  <>
                    {actionError && (
                      <div className="mb-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                        {actionError}
                      </div>
                    )}
                    <button
                      onClick={handleAiGenerate}
                      disabled={!aiTopic.trim() || aiGenerating}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-sm font-medium text-white disabled:opacity-40 transition-colors"
                  >
                    {aiGenerating ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        生成中
                      </>
                    ) : (
                      <>
                        AI 生成文章
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="2" y1="6.5" x2="11" y2="6.5"/><polyline points="7.5,3 11,6.5 7.5,10"/>
                        </svg>
                      </>
                    )}
                  </button>
                  </>
                ) : mode === "draw" ? (
                  <button
                    onClick={handleDrawGenerate}
                    disabled={!drawPrompt.trim() || drawGenerating}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-sm font-medium text-white disabled:opacity-40 transition-colors"
                  >
                    {drawGenerating ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        生成中
                      </>
                    ) : (
                      <>
                        ✏️ 生成绘图
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="2" y1="6.5" x2="11" y2="6.5"/><polyline points="7.5,3 11,6.5 7.5,10"/>
                        </svg>
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    {actionError && (
                      <div className="mb-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                        {actionError}
                      </div>
                    )}
                    <button
                      onClick={handleCreate}
                      disabled={!canSubmit || creating}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-medium text-white disabled:opacity-40 transition-colors"
                  >
                    {creating ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        创建中
                      </>
                    ) : (
                      <>
                        开始生成
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="2" y1="6.5" x2="11" y2="6.5"/><polyline points="7.5,3 11,6.5 7.5,10"/>
                        </svg>
                      </>
                    )}
                  </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent projects */}
        {recentProjects.length > 0 && (
          <div className="w-full max-w-3xl mt-14">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-t1">最近作品</h2>
              <Link href="/projects" className="text-sm text-t3 hover:text-t2 transition-colors">
                查看全部 →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {recentProjects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="group block">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-surface2">
                    {p.thumbnailUrl ? (
                      <img src={p.thumbnailUrl} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-t4">
                          <rect x="4" y="3" width="20" height="22" rx="3"/>
                          <line x1="8" y1="9" x2="20" y2="9"/><line x1="8" y1="13" x2="20" y2="13"/>
                          <line x1="8" y1="17" x2="14" y2="17"/>
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl" />
                  </div>
                  <p className="mt-2 text-xs font-medium text-t1 truncate">{p.title}</p>
                  <p className="text-[11px] text-t4">{formatRelativeTime(p.updatedAt)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
  );
}
