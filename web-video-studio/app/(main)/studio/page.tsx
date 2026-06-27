"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Project } from "@/lib/db/schema";
import { STYLE_PRESETS, STYLE_PRESET_IDS } from "@/lib/illustration-style";

function formatRelativeTime(ts: number): string {
  const d = Math.floor(Date.now() / 1000) - ts;
  if (d < 60) return "刚刚";
  if (d < 3600) return `${Math.floor(d / 60)}分钟前`;
  if (d < 86400) return `${Math.floor(d / 3600)}小时前`;
  if (d < 86400 * 30) return `${Math.floor(d / 86400)}天前`;
  return new Date(ts * 1000).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

// ─── Types ────────────────────────────────────────────────────────────────

type ProductType = "article" | "illustration-video" | "illustrated-article" | "animation-video" | "manim" | "resume" | "draw" | "product-demo";
type InputMethod = "paste" | "ai" | "url" | "file" | null;
type Format = "video" | "graphic" | "manim" | "resume" | "draw";

interface ProductDef {
  id: ProductType;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

interface InputDef {
  id: Exclude<InputMethod, null>;
  label: string;
  icon: React.ReactNode;
}

// ─── Product definitions ──────────────────────────────────────────────────

const MAIN_PRODUCTS: ProductDef[] = [
  { id: "article", label: "普通视频", desc: "文字 → 口播视频", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="3" width="12" height="9" rx="1.5"/><polygon points="6,5.5 10,7.5 6,9.5"/></svg> },
  { id: "illustration-video", label: "绘图视频", desc: "文章 → 配图口播", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="1.5" width="12" height="12" rx="2"/><circle cx="5.5" cy="5.5" r="1.5"/><path d="M1.5 11l3.5-3.5 2 2L10 6.5l3.5 3.5"/></svg> },
  { id: "illustrated-article", label: "图文排版", desc: "文章 → 配图排版", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5h11M2 8h8M2 11h5"/><rect x="9" y="9" width="4" height="4" rx="1" strokeDasharray="1 1"/></svg> },
  { id: "animation-video", label: "动态视频", desc: "文章 → AI动画视频", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polygon points="3,2 13,6 13,10 3,14" strokeLinejoin="round"/><line x1="3" y1="6" x2="13" y2="6"/><line x1="3" y1="10" x2="13" y2="10"/><circle cx="5.5" cy="8" r="1" fill="currentColor" stroke="none"/></svg> },
];

const MORE_PRODUCTS: ProductDef[] = [
  { id: "product-demo", label: "产品讲解", desc: "网站 → 演示视频", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="1.5" width="12" height="9" rx="1.5"/><line x1="5.5" y1="12" x2="9.5" y2="12"/><line x1="7.5" y1="10.5" x2="7.5" y2="12"/></svg> },
  { id: "manim", label: "Manim 数学", desc: "3B1B 风格动画", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12.5l4-10 4 10"/><path d="M4 9.5h4"/><circle cx="11.5" cy="7" r="1.5"/></svg> },
  { id: "resume", label: "在线简历", desc: "响应式网页", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="1.5" width="11" height="12" rx="1.5"/><line x1="5" y1="5" x2="10" y2="5"/><line x1="5" y1="7.5" x2="10" y2="7.5"/><line x1="5" y1="10" x2="8" y2="10"/></svg> },
  { id: "draw", label: "智能绘图", desc: "架构图/流程图", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13.5l1.5-3 1.5 1.5L12 5.5 10 3.5 4 9.5l1 1.5z"/><path d="M10 3.5l1.5-1.5 2 2L12 5.5z"/></svg> },
];

// ─── Input method definitions ────────────────────────────────────────────

const INPUT_METHODS: InputDef[] = [
  { id: "paste", label: "粘贴文章", icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="1" width="6" height="3" rx="1"/><path d="M3 2.5H2a1 1 0 00-1 1v9a1 1 0 001 1h10a1 1 0 001-1v-9a1 1 0 00-1-1h-1"/><line x1="4.5" y1="6" x2="9.5" y2="6"/><line x1="4.5" y1="8" x2="9.5" y2="8"/><line x1="4.5" y1="10" x2="7.5" y2="10"/></svg> },
  { id: "ai", label: "AI 生成", icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 1.5l1.2 3.3 3.3.7-2.5 2.3.7 3.2-2.7-1.8-2.7 1.8.7-3.2-2.5-2.3 3.3-.7z"/></svg> },
  { id: "url", label: "链接导入", icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3H3a2 2 0 100 4h3"/><path d="M8 11h3a2 2 0 100-4H8"/><line x1="5" y1="7" x2="9" y2="7"/></svg> },
  { id: "file", label: "上传文件", icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="10" x2="7" y2="2"/><polyline points="4.5,5.5 7,3 9.5,5.5"/><path d="M2 10v2h10v-2"/></svg> },
];

// ─── Hero text per product ──────────────────────────────────────────────

const HERO_TEXT: Record<ProductType, { title: React.ReactNode; subtitle: string }> = {
  "article": {
    title: <>一键把文章变成<span className="text-amber-400">可发布的视频</span></>,
    subtitle: "不用写脚本、不用拍摄、不用剪辑，让内容轻松表达",
  },
  "illustration-video": {
    title: <>上传文章，<span className="text-amber-400">AI 自动配图</span>生成视频</>,
    subtitle: "小黑手绘插画 + 文字讲解，制作属于你的绘图视频",
  },
  "illustrated-article": {
    title: <>给文章配插画，<span className="text-amber-400">排版导出</span>公众号长文</>,
    subtitle: "AI 自动配图 + 图文排版，支持微信公众号 / HTML / Markdown",
  },
  "animation-video": {
    title: <>上传文章，<span className="text-amber-400">AI 自动生成动画</span>视频</>,
    subtitle: "文章转 AI 动画片段 + 配音，全自动合成 MP4",
  },
  "manim": {
    title: <>用<span className="text-amber-400">数学动画</span>讲清楚复杂概念</>,
    subtitle: "3Blue1Brown 风格的 Manim 动画，让知识可视化",
  },
  "resume": {
    title: <><span className="text-amber-400">在线简历</span>，即刻分享</>,
    subtitle: "响应式网页简历，一键分享链接给面试官",
  },
  "draw": {
    title: <>用 AI <span className="text-amber-400">画出</span>你的想法</>,
    subtitle: "架构图、流程图、UML、思维导图，AI 自动生成",
  },
  "product-demo": {
    title: <>一键把产品变成<span className="text-amber-400">演示视频</span></>,
    subtitle: "输入产品链接，AI 自动浏览、分析并生成讲解视频",
  },
};

// ─── Valid input methods per product ─────────────────────────────────────

const PRODUCT_INPUTS: Record<ProductType, InputMethod[]> = {
  "article": ["paste", "ai", "url", "file"],
  "illustration-video": ["paste", "ai", "url", "file"],
  "illustrated-article": ["paste", "ai", "url", "file"],
  "animation-video": ["paste", "ai", "url", "file"],
  "manim": ["ai"],
  "resume": [],
  "draw": ["paste"],
  "product-demo": ["url"],
};

// ══════════════════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // ── Two-layer state ──────────────────────────────────────────────
  const [productType, setProductType] = useState<ProductType>("article");
  const [inputMethod, setInputMethod] = useState<InputMethod>("ai");
  const [format, setFormat] = useState<Format>("video");

  // ── Legacy single-mode state (for backwards compat with input areas) ─
  // The input areas (paste/ai/url/file) react to inputMethod.
  // We keep the existing handler naming but they now check inputMethod.
  const mode = inputMethod ?? "ai"; // map null → "ai" (fallback for display)

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
  const [aiGeneratedContent, setAiGeneratedContent] = useState("");
  const [drawPrompt, setDrawPrompt] = useState("");
  const [drawGenerating, setDrawGenerating] = useState(false);
  const [refImages, setRefImages] = useState<File[]>([]);
  const [refExpanded, setRefExpanded] = useState(true);
  const [refReminded, setRefReminded] = useState(false);
  const [actionError, setActionError] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const [morePos, setMorePos] = useState({ top: 0, left: 0 });
  const refImageInputRef = useRef<HTMLInputElement>(null);
  const [selectedPreset, setSelectedPreset] = useState("xiaobei");
  const [styleEditorOpen, setStyleEditorOpen] = useState(false);
  const [illustrationCount, setIllustrationCount] = useState(10);
  const [customPresets, setCustomPresets] = useState<Record<string, { name: string; visualDna?: string; characterDescription?: string }>>({});
  const [presetPreviews, setPresetPreviews] = useState<Record<string, string | null>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load global settings (default style + custom presets)
  useEffect(() => {
    fetch("/api/settings").then(r => r.ok ? r.json() : null).then(data => {
      if (data?.defaultStylePreset) setSelectedPreset(data.defaultStylePreset);
    }).catch(() => {});
    fetch("/api/style-presets/custom").then(r => r.ok ? r.json() : null).then(data => {
      if (data?.presets) setCustomPresets(data.presets);
    }).catch(() => {});
  }, []);

  // Load preset previews (no auth needed, poll until ready)
  useEffect(() => {
    let active = true;
    fetch("/api/illustration-presets").then((r) => r.ok ? r.json() : null).then((data) => {
      if (!active || !data) return;
      setPresetPreviews(prev => ({ ...prev, ...data.previews }));
      if (data.pending?.length > 0) {
        fetch("/api/illustration-presets", { method: "POST" }).catch(() => {});
        // Poll every 8s for completion
        const timer = setInterval(async () => {
          const r2 = await fetch("/api/illustration-presets");
          if (!r2.ok) return;
          const d2 = await r2.json();
          if (!active) { clearInterval(timer); return; }
          setPresetPreviews(prev => ({ ...prev, ...d2.previews }));
          if (d2.pending?.length === 0) clearInterval(timer);
        }, 8000);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  // Show reference images only for illustration products
  const showRefPanel = productType === "illustration-video" || productType === "illustrated-article" || productType === "animation-video";

  // ── Product change: also reset input method if current is invalid ─
  const handleProductChange = useCallback((pt: ProductType) => {
    setProductType(pt);
    const valid = PRODUCT_INPUTS[pt];
    if (valid.length > 0 && !valid.includes(inputMethod ?? "paste")) {
      setInputMethod(valid[0]);
    } else if (valid.length === 0) {
      setInputMethod(null);
    }
    // Apply format defaults
    if (pt === "manim") setFormat("manim");
    else if (pt === "resume") setFormat("resume");
    else if (pt === "draw") setFormat("draw");
    else if (pt === "illustrated-article") setFormat("graphic");
    else if (pt === "illustration-video" || pt === "animation-video" || pt === "article") setFormat("video");
  }, [inputMethod]);

  // ── Delete project ──────────────────────────────────────────────
  async function handleDeleteProject() {
    if (!deleteId) return;
    setDeleting(true);
    const prev = recentProjects;
    setRecentProjects((list) => list.filter((p) => p.id !== deleteId));
    try {
      const r = await fetch(`/api/projects/${deleteId}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
    } catch { setRecentProjects(prev); }
    setDeleting(false); setDeleteId(null);
  }

  function toggleMore() {
    if (!moreOpen && moreBtnRef.current) {
      const r = moreBtnRef.current.getBoundingClientRect();
      setMorePos({ top: r.bottom + 4, left: r.left });
    }
    setMoreOpen((v) => !v);
  }

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
    setInputMethod("file");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }

  // ── URL fetch ───────────────────────────────────────────────────
  async function handleFetchUrl() {
    if (!urlValue.trim()) return;
    if (needsRefReminder()) {
      setActionError("💡 提示：你可以先上传参考图片，让内容提取更精准。也可以直接再次点击「抓取」跳过。");
      return;
    }
    setUrlError("");
    setFetchingUrl(true);

    const isProductUrl = !/mp\.weixin\.qq\.com|zhuanlan\.zhihu\.com|juejin\.cn|medium\.com|substack\.com/i.test(urlValue);
    const projectType = isProductUrl ? "product-demo" : productType === "illustration-video" ? "illustration-video" : productType === "illustrated-article" ? "illustrated-article" : undefined;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: urlValue.trim().split("/").pop()?.slice(0, 40) || "项目", projectFormat: format, projectType, styleConfig: showRefPanel ? { activePreset: selectedPreset } : undefined }),
      });
      if (!res.ok) throw new Error("创建项目失败");
      const project = await res.json();

      if (isProductUrl) {
        await fetch(`/api/projects/${project.id}/explore-product`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlValue }),
        });
        await uploadRefImages(project.id);
        router.push(`/projects/${project.id}?autostart=1`);
        return;
      }

      const fetchRes = await fetch(`/api/projects/${project.id}/fetch-url`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlValue }),
      });
      if (!fetchRes.ok || !fetchRes.body) {
        await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
        const err = await fetchRes.json().catch(() => ({}));
        setUrlError((err as { error?: string }).error ?? "解析失败，请检查链接是否可访问");
        return;
      }
      const reader = fetchRes.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; full += decoder.decode(value, { stream: true }); }
      await fetch(`/api/projects/${project.id}/files`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "article.md", content: full }),
      });
      await uploadRefImages(project.id);
      router.push(`/projects/${project.id}?autostart=1`);
    } catch { setUrlError("网络错误，请重试"); }
    finally { setFetchingUrl(false); }
  }

  async function handleExploreProduct() {
    if (!urlValue.trim()) return;
    setUrlError(""); setFetchingUrl(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: new URL(urlValue).hostname.replace("www.", "") + " 产品演示", projectFormat: format, projectType: "product-demo" }),
      });
      if (!res.ok) throw new Error("创建项目失败");
      const project = await res.json();
      const usernameEl = document.getElementById("product-username") as HTMLInputElement | null;
      const passwordEl = document.getElementById("product-password") as HTMLInputElement | null;
      const creds: Record<string, string> = { url: urlValue };
      if (usernameEl?.value && passwordEl?.value) { creds.username = usernameEl.value; creds.password = passwordEl.value; }
      await fetch(`/api/projects/${project.id}/explore-product`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(creds),
      });
      router.push(`/projects/${project.id}?autostart=1`);
    } catch (err: unknown) { setUrlError(err instanceof Error ? err.message : "探索失败"); }
    finally { setFetchingUrl(false); }
  }

  async function handleAiGenerate() {
    setActionError("");
    if (!aiTopic.trim()) return;
    if (needsRefReminder()) {
      setActionError("💡 提示：你可以先上传参考图片（支持文章截图、风格参考），让生成更贴合需求。也可以再次点击「AI 写文章」跳过。");
      return;
    }
    setAiGenerating(true); setAiPreview("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    try {
      const projectType = productType === "illustration-video" ? "illustration-video" : productType === "illustrated-article" ? "illustrated-article" : productType === "manim" ? "math-video" : undefined;
      const res = await fetch("/api/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: aiTopic.trim(), projectFormat: format, projectType, styleConfig: showRefPanel ? { activePreset: selectedPreset } : undefined }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("创建项目失败");
      const project = await res.json();
      const genRes = await fetch(`/api/projects/${project.id}/generate-article`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic.trim() }), signal: controller.signal,
      });
      if (!genRes.ok || !genRes.body) throw new Error("生成请求失败");
      const reader = genRes.body.getReader();
      const decoder = new TextDecoder();
      let totalText = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; const chunk = decoder.decode(value, { stream: true }); totalText += chunk; setAiPreview((prev) => prev + chunk); }
      if (!totalText.trim() || totalText.startsWith("[错误]")) {
        setActionError(`❌ ${totalText.replace("[错误]", "").trim() || "生成失败"}`); setAiPreview(""); setAiGenerating(false); return;
      }
      // Show the generated article for editing — don't redirect yet
      setAiGeneratedContent(totalText);
      setAiPreview("");
      setAiTopic(totalText); // Put in the "preview" area for display
      setAiGenerating(false);
    } catch (err) {
      if ((err as Error).name === "AbortError") setActionError("⏱ 生成超时（2分钟）");
      else setActionError(`❌ ${err instanceof Error ? err.message : "网络错误"}`);
      setAiGenerating(false);
    } finally { clearTimeout(timeout); }
  }

  async function handleDrawGenerate() {
    if (!drawPrompt.trim()) return;
    setDrawGenerating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: drawPrompt.trim().slice(0, 40), projectFormat: "draw", drawPrompt: drawPrompt.trim() }),
      });
      if (!res.ok) throw new Error();
      const project = await res.json();
      await uploadRefImages(project.id);
      router.push(`/projects/${project.id}?autostart=1`);
    } catch { setDrawGenerating(false); }
  }

  async function uploadRefImages(projectId: string) {
    for (const file of refImages) {
      const form = new FormData(); form.append("file", file);
      await fetch(`/api/projects/${projectId}/assets`, { method: "POST", body: form });
    }
  }

  function needsRefReminder() {
    if (!showRefPanel || refImages.length > 0 || refReminded) return false;
    setRefReminded(true); setRefExpanded(true);
    return true;
  }

  // ── Combined create ─────────────────────────────────────────────
  async function handleCreate() {
    const articleContent = content.trim();
    // Illustration/product/draw modes handle creation differently
    if (productType === "illustration-video" || productType === "illustrated-article" || productType === "animation-video") {
      // No content needed upfront for illustration / animation modes
    } else if (productType === "resume") {
      // Create blank resume project
    } else if (productType === "draw") {
      return handleDrawGenerate();
    } else if (!articleContent) {
      return;
    }
    if (needsRefReminder()) {
      setActionError("💡 提示：你可以先上传参考图片，让视频风格更精准。也可以直接再次点击「开始创作」跳过。");
      return;
    }
    setCreating(true);
    try {
      const body: Record<string, unknown> = { title: fileName || undefined, projectFormat: format };
      if (productType === "illustration-video") {
        body.projectType = "illustration-video"; body.title = "绘图视频";
      } else if (productType === "illustrated-article") {
        body.projectType = "illustrated-article"; body.title = "图文排版";
      } else if (productType === "animation-video") {
        body.projectType = "animation-video"; body.title = "动态视频";
      } else {
        body.articleContent = articleContent;
      }
      // Include selected style preset + illustration count for illustration projects
      if (showRefPanel) {
        const sc: any = { activePreset: selectedPreset, illustrationCount };
        const cp = customPresets[selectedPreset];
        if (cp) {
          sc.customPresets = { [selectedPreset]: { name: cp.name, visualDna: cp.visualDna, characterDescription: cp.characterDescription } };
        }
        body.styleConfig = sc;
      }
      const res = await fetch("/api/projects", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("创建项目失败");
      const project = await res.json();
      await uploadRefImages(project.id);
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setActionError(`创建失败：${err instanceof Error ? err.message : "网络错误，请重试"}`);
      setCreating(false);
    }
  }

  // ── Create project from AI-generated (and user-edited) article ──
  async function handleAiCreateProject() {
    const articleContent = aiTopic.trim();
    if (!articleContent) return;
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        title: (aiTopic.trim().slice(0, 40)) || "AI 生成文章",
        projectFormat: format,
        articleContent,
      };
      if (productType === "illustration-video") {
        body.projectType = "illustration-video";
      } else if (productType === "illustrated-article") {
        body.projectType = "illustrated-article";
      } else if (productType === "manim") {
        body.projectType = "math-video";
      }
      // Include style preset for illustration projects
      if (showRefPanel) {
        const sc: any = { activePreset: selectedPreset };
        const cp = customPresets[selectedPreset];
        if (cp) {
          sc.customPresets = { [selectedPreset]: { name: cp.name, visualDna: cp.visualDna, characterDescription: cp.characterDescription } };
        }
        body.styleConfig = sc;
      }
      const res = await fetch("/api/projects", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("创建项目失败");
      const project = await res.json();
      await uploadRefImages(project.id);
      router.push(`/projects/${project.id}?autostart=1`);
    } catch (err) {
      setActionError(`创建失败：${err instanceof Error ? err.message : "网络错误，请重试"}`);
      setCreating(false);
    }
  }

  // ── Computed state ──────────────────────────────────────────────
  const hasContent = content.trim().length > 0;
  const hero = HERO_TEXT[productType];
  const validInputs = PRODUCT_INPUTS[productType];
  const needsContent = productType !== "illustration-video" && productType !== "illustrated-article" && productType !== "resume" && productType !== "draw";
  const canSubmit = productType === "illustration-video" || productType === "illustrated-article" || productType === "resume" || productType === "draw"
    ? true
    : inputMethod === "url"
      ? urlValue.trim().length > 0
      : inputMethod === "ai"
        ? aiTopic.trim().length > 0
        : inputMethod === "paste" || inputMethod === "file"
          ? hasContent
          : false;

  // ── Render ──────────────────────────────────────────────────────
  return (
    <main className="flex flex-col items-center px-8 pt-16 pb-20">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-t1 leading-tight mb-3 text-balance">
          {hero.title}
        </h1>
        <p className="text-t2 text-base">{hero.subtitle}</p>
      </div>

      {/* Input card */}
      <div className="w-full max-w-3xl rounded-2xl border border-bd bg-modal shadow-sm">
        {/* ── Layer 1: Product type ── */}
        <div className="border-b border-bd px-3 py-2 flex items-center gap-1 overflow-x-auto">
          {MAIN_PRODUCTS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleProductChange(p.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm transition-colors ${
                productType === p.id
                  ? "bg-surface2 text-t1 font-medium"
                  : "text-t3 hover:text-t2 hover:bg-surface"
              }`}
            >
              {p.icon}
              <span>{p.label}</span>
            </button>
          ))}

          {/* More products dropdown */}
          <span className="w-px h-5 bg-bd mx-1 shrink-0" />
          <div className="relative shrink-0">
            <button
              ref={moreBtnRef}
              onClick={toggleMore}
              className={`flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm transition-colors ${
                ["product-demo","manim","resume","draw"].includes(productType)
                  ? "bg-surface2 text-t1 font-medium"
                  : "text-t3 hover:text-t2 hover:bg-surface"
              }`}
            >
              更多
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={`transition-transform ${moreOpen ? "rotate-180" : ""}`}>
                <polyline points="3,4.5 6,7.5 9,4.5"/>
              </svg>
            </button>
            {moreOpen && (
              <>
                <div className="fixed inset-0 z-50" onClick={() => setMoreOpen(false)} />
                <div className="fixed z-50 w-40 rounded-xl border border-bd bg-modal shadow-md py-1" style={{ top: morePos.top, left: morePos.left }}>
                  {MORE_PRODUCTS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { handleProductChange(p.id); setMoreOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        productType === p.id ? "bg-surface2 text-t1" : "text-t2 hover:bg-surface"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-medium">{p.label}</p>
                        <p className="text-[10px] text-t4">{p.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Format toggle */}
          {productType !== "manim" && productType !== "resume" && productType !== "draw" && (
            <div className="ml-auto shrink-0 flex items-center gap-1 rounded-lg border border-bd p-0.5">
              <button onClick={() => setFormat("video")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${format === "video" ? "bg-surface2 text-t1 font-medium" : "text-t4 hover:text-t3"}`}>
                <svg width="12" height="9" viewBox="0 0 12 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="0.5" y="0.5" width="11" height="8" rx="1"/></svg>
                视频
              </button>
              <button onClick={() => setFormat("graphic")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${format === "graphic" ? "bg-surface2 text-t1 font-medium" : "text-t4 hover:text-t3"}`}>
                <svg width="7" height="11" viewBox="0 0 7 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="0.5" y="0.5" width="6" height="10" rx="1"/></svg>
                图文
              </button>
            </div>
          )}
        </div>

        {/* ── Layer 2: Input method ── */}
        {validInputs.length > 0 && (
          <div className="border-b border-bd/50 px-3 py-1.5 flex items-center gap-1 overflow-x-auto bg-surface/30">
            {INPUT_METHODS.filter((im) => validInputs.includes(im.id)).map((im) => (
              <button
                key={im.id}
                onClick={() => setInputMethod(im.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
                  inputMethod === im.id
                    ? "bg-surface2 text-t1 font-medium"
                    : "text-t4 hover:text-t3 hover:bg-surface"
                }`}
              >
                {im.icon}
                <span>{im.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Input area ── */}
        <div className="px-6 py-8 min-h-[14rem] flex flex-col justify-center">
          {/* File upload */}
          {(inputMethod === "file") && (
            <div
              ref={dropRef}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !hasContent && fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-4 py-8 transition-colors cursor-pointer rounded-xl ${dragging ? "bg-brand-subtle" : ""}`}
            >
              {hasContent ? (
                <div className="w-full flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand-text flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5L8 1z"/><polyline points="8,1 8,5 12,5"/></svg>
                    </div>
                    <span className="text-sm font-medium text-t1">{fileName || "文档"}</span>
                    <button onClick={(e) => { e.stopPropagation(); setContent(""); setFileName(""); }}
                      className="ml-auto text-t4 hover:text-t2 transition-colors">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="2" y1="2" x2="11" y2="11"/><line x1="11" y1="2" x2="2" y2="11"/></svg>
                    </button>
                  </div>
                  <div className="rounded-xl bg-surface p-3">
                    <p className="text-xs text-t3 font-mono line-clamp-4 whitespace-pre-wrap">{content.slice(0, 400)}{content.length > 400 ? "…" : ""}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-bd-hover flex items-center justify-center text-t3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="16" x2="12" y2="8"/><polyline points="9,11 12,8 15,11"/><path d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2"/></svg>
                  </div>
                  <p className="text-sm text-t2">拖拽文件到这里，或<span className="text-brand-text cursor-pointer"> 点击上传</span></p>
                  <p className="text-xs text-t4">.md · .txt</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".md,.txt,text/plain,text/markdown" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); }} />
            </div>
          )}

          {/* Paste */}
          {inputMethod === "paste" && (
            <textarea autoFocus value={content} onChange={(e) => setContent(e.target.value)}
              placeholder={`粘贴文章内容${productType === "draw" ? "，描述你想画的图" : "，支持微信公众号等富文本"}…`}
              className="w-full flex-1 min-h-[14rem] resize-none bg-transparent text-sm text-t1 placeholder:text-input-placeholder outline-none" />
          )}

          {/* URL */}
          {inputMethod === "url" && (
            <div className="w-full flex flex-col gap-4">
              <input autoFocus type="url" value={urlValue}
                onChange={(e) => { setUrlValue(e.target.value); setUrlError(""); }}
                onKeyDown={(e) => e.key === "Enter" && (productType === "product-demo" ? handleExploreProduct() : handleFetchUrl())}
                placeholder="https://mp.weixin.qq.com/s/..."
                className="w-full rounded-xl border border-bd bg-input-bg px-4 py-3 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-brand/50" />
              {urlError && <p className="text-xs text-red-400">{urlError}</p>}
              {fetchingUrl && <p className="text-xs text-t3 animate-pulse">正在解析链接…</p>}
              {!urlError && !fetchingUrl && <p className="text-xs text-t4">支持微信公众号、知乎专栏、掘金、Medium 等平台的文章链接</p>}
            </div>
          )}

          {/* AI */}
          {inputMethod === "ai" && (
            <div className="w-full flex flex-col gap-4">
              {!aiGeneratedContent ? (
                <>
                  <input autoFocus type="text" value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !aiGenerating && handleAiGenerate()}
                    placeholder={`输入主题，例如：量子计算入门、区块链技术原理${productType === "manim" ? "、勾股定理可视化" : ""}…`}
                    className="w-full rounded-xl border border-bd bg-input-bg px-4 py-3 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-brand/50" />
                  {aiGenerating && (
                    <div className="rounded-xl bg-surface p-4">
                      <p className="text-xs text-t3 font-mono whitespace-pre-wrap animate-pulse">{aiPreview || "AI 正在生成文章…"}</p>
                    </div>
                  )}
                  {!aiGenerating && (
                    <p className="text-xs text-t4">AI 将根据主题自动生成{productType === "manim" ? "数学讲解文案" : "科普文章"}，再帮你制作成{productType === "manim" ? "Manim 动画" : "视频"}</p>
                  )}
                </>
              ) : (
                <>
                  <textarea autoFocus value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    rows={14}
                    className="w-full resize-none rounded-xl border border-bd bg-input-bg px-4 py-3 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-brand/50 font-mono leading-relaxed" />
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setAiGeneratedContent(""); setAiTopic(""); }}
                      className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-300 transition-colors">
                      重新生成
                    </button>
                    <p className="text-xs text-t4 flex-1">可编辑文章内容，确认后点击下方按钮进入制作</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Resume — no input needed */}
          {productType === "resume" && validInputs.length === 0 && (
            <div className="w-full flex flex-col items-center justify-center gap-3 py-8">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-t4">
                <rect x="4" y="3" width="24" height="26" rx="3"/><line x1="10" y1="10" x2="22" y2="10"/><line x1="10" y1="15" x2="22" y2="15"/><line x1="10" y1="20" x2="17" y2="20"/>
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium text-t1">在线简历</p>
                <p className="text-xs text-t3 mt-1 max-w-xs">立即创建一份响应式网页简历，<br />一键分享链接给面试官</p>
              </div>
            </div>
          )}

          {/* Product info card — shown when no input method is selected */}
          {(productType === "illustration-video" || productType === "illustrated-article") && validInputs.length > 0 && !inputMethod && (
            <div className="w-full flex flex-col items-center justify-center gap-3 py-8">
              <div className="text-center">
                <p className="text-sm font-medium text-t1">{productType === "illustration-video" ? "绘图视频" : "图文排版"}</p>
                <p className="text-xs text-t3 mt-1 max-w-xs">请在上方选择输入方式</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Style selector (illust products) ── */}
        {showRefPanel && (
          <div className="border-t border-bd px-5 py-3 space-y-2.5">
            <span className="text-[11px] text-t4 block">画面风格</span>
            <div className="flex gap-2 flex-wrap pb-1">
              {/* Main row: first 4 + selected or 5th */}
              {(() => {
                const first4 = STYLE_PRESET_IDS.slice(0, 4);
                // 5th slot: selected custom preset, or selected built-in outside first 4, or 5th built-in
                let fifth: { id: string; label: string; isCustom: boolean };
                if (selectedPreset && !first4.includes(selectedPreset)) {
                  const cp = customPresets[selectedPreset];
                  if (cp) {
                    fifth = { id: selectedPreset, label: cp.name, isCustom: true };
                  } else {
                    fifth = { id: selectedPreset, label: STYLE_PRESETS[selectedPreset]?.label ?? selectedPreset, isCustom: false };
                  }
                } else {
                  fifth = { id: STYLE_PRESET_IDS[4], label: STYLE_PRESETS[STYLE_PRESET_IDS[4]].label, isCustom: false };
                }
                return [...first4.map(id => ({ id, label: STYLE_PRESETS[id].label, isCustom: false })), fifth];
              })().map(({ id, label, isCustom }) => {
                const isSelected = selectedPreset === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedPreset(id)}
                    className={`shrink-0 w-[100px] rounded-xl overflow-hidden border-2 transition-all text-left ${
                      isSelected ? "border-amber-500" : isCustom ? "border-indigo-500/30 hover:border-indigo-500/50" : "border-zinc-700 hover:border-zinc-600"
                    }`}
                  >
                    <div className="h-[56px] bg-black flex items-center justify-center overflow-hidden">
                      {presetPreviews[id] ? (
                        <img src={presetPreviews[id]} alt={label} className="w-full h-full object-cover" />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-zinc-600">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                          <path d="M21 15l-5-5L5 21"/>
                        </svg>
                      )}
                    </div>
                    <div className={`px-2 py-1.5 text-[11px] font-medium truncate ${isSelected ? "text-amber-400" : isCustom ? "text-indigo-300" : "text-zinc-300"}`}>
                      {label}
                    </div>
                  </button>
                );
              })}
            </div>
            {/* More styles button (outside overflow container) */}
            <div className="relative shrink-0 self-start">
              <button
                onClick={() => setStyleEditorOpen(!styleEditorOpen)}
                className="w-[100px] rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-600 transition-colors flex flex-col items-center justify-center gap-1 px-2 py-3"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span className="text-[10px] text-zinc-500">更多风格</span>
              </button>
              {styleEditorOpen && (
                <>
                  <div className="fixed inset-0 z-50" onClick={() => setStyleEditorOpen(false)} />
                  <div className="absolute z-[60] top-full mt-2 right-0 w-[432px] rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl p-3 max-h-80 overflow-y-auto">
                    <div className="grid grid-cols-4 gap-2">
                      {[...Object.entries(customPresets).map(([id, cp]) => ({ id, label: cp.name, isCustom: true })),
                        ...STYLE_PRESET_IDS.map((id) => ({ id, label: STYLE_PRESETS[id].label, isCustom: false }))
                      ].map(({ id, label, isCustom }) => {
                        const isSelected = selectedPreset === id;
                        return (
                          <button
                            key={id}
                            onClick={() => { setSelectedPreset(id); setStyleEditorOpen(false); }}
                            className={`rounded-lg overflow-hidden border-2 transition-all text-left ${
                              isSelected
                                ? "border-amber-500"
                                : isCustom
                                  ? "border-indigo-500/30 hover:border-indigo-500/50"
                                  : "border-zinc-700 hover:border-zinc-600"
                            }`}
                          >
                            <div className="h-[45px] bg-black flex items-center justify-center overflow-hidden">
                              {presetPreviews[id] ? (
                                <img src={presetPreviews[id]} alt={label} className="w-full h-full object-cover" />
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-zinc-600">
                                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                                  <path d="M21 15l-5-5L5 21"/>
                                </svg>
                              )}
                            </div>
                            <div className={`px-1.5 py-1 text-[10px] truncate ${isSelected ? "text-amber-400" : isCustom ? "text-indigo-300" : "text-zinc-300"}`}>
                              {label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Illustration count slider (only for video, not article layout) */}
            {productType === "illustration-video" && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[11px] text-t4 shrink-0">图片数量</span>
                <input type="range" min={5} max={50} step={1} value={illustrationCount}
                  onChange={(e) => setIllustrationCount(parseInt(e.target.value))}
                  className="flex-1 h-1 accent-amber-500 max-w-[200px]" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-t1 tabular-nums w-8 text-right">{illustrationCount}</span>
                  <span className="text-[10px] text-t5">张</span>
                </div>
                <span className="text-[10px] text-t5">约 ¥{(illustrationCount * 0.04).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Bottom bar ── */}
        <div className="border-t border-bd px-5 py-3 flex items-center gap-3">
          <div />

          <div className="flex-1" />

          {actionError && (
            <div className="mr-2 p-2.5 rounded-lg bg-brand-subtle border border-brand/20 text-brand-text text-xs leading-relaxed max-w-xs">{actionError}</div>
          )}

          <button
            onClick={
              productType === "product-demo" ? handleExploreProduct :
              inputMethod === "url" ? handleFetchUrl :
              (inputMethod === "ai" && aiGeneratedContent) ? handleAiCreateProject :
              inputMethod === "ai" ? handleAiGenerate :
              productType === "draw" ? handleDrawGenerate : handleCreate
            }
            disabled={!canSubmit || creating || fetchingUrl || aiGenerating || drawGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-sm font-medium text-white disabled:opacity-40 transition-colors"
          >
            {(creating || fetchingUrl || aiGenerating || drawGenerating) ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {creating ? "创建中" : fetchingUrl ? "解析中" : aiGenerating ? "生成中" : "生成中"}
              </>
            ) : (
              <>
                {productType === "illustration-video" ? "创建绘图视频" :
                 productType === "illustrated-article" ? "创建图文排版" :
                 productType === "resume" ? "创建简历" :
                 productType === "draw" ? "生成绘图" :
                 (inputMethod === "ai" && aiGeneratedContent) ? "开始制作" :
                 inputMethod === "ai" ? "AI 生成文章" :
                 inputMethod === "url" ? "解析并生成" : "开始创作"}
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="2" y1="6.5" x2="11" y2="6.5"/><polyline points="7.5,3 11,6.5 7.5,10"/>
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent projects */}
      {recentProjects.length > 0 && (
        <div className="w-full max-w-3xl mt-14">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-sm font-semibold text-t1 uppercase tracking-wider">最近作品</h2>
            <Link href="/projects" className="text-xs text-t3 hover:text-t2 transition-colors">查看全部 →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentProjects.map((p) => (
              <div key={p.id} className="group relative">
                <Link href={`/projects/${p.id}`} className="block">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-surface2 border border-bd group-hover:border-bd-hover transition-colors">
                    {p.thumbnailUrl ? (
                      <img src={p.thumbnailUrl} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-surface2">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-t4"><rect x="3" y="2" width="22" height="24" rx="3"/><line x1="7" y1="9" x2="21" y2="9"/><line x1="7" y1="14" x2="21" y2="14"/><line x1="7" y1="19" x2="15" y2="19"/></svg>
                        <span className="text-[10px] text-t4 font-medium">{p.status === "writing" ? "写作中" : p.status === "done" ? "已完成" : "制作中"}</span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 text-[9px] font-medium px-1.5 py-0.5 rounded bg-black/50 text-white/80 backdrop-blur-sm">{p.projectFormat === "graphic" ? "9:16" : "16:9"}</span>
                    <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${p.status === "done" ? "bg-green-400" : p.status === "writing" ? "bg-amber-400" : "bg-blue-400"}`} />
                  </div>
                  <p className="mt-2.5 text-xs font-medium text-t1 truncate leading-snug">{p.title}</p>
                  <p className="mt-0.5 text-[11px] text-t4">{formatRelativeTime(p.updatedAt)}</p>
                </Link>
                <button
                  onClick={(e) => { e.preventDefault(); setDeleteId(p.id); }}
                  className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-black/60 hover:bg-red-500 text-white/70 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                  title="删除项目"
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M1.5 2.5h8M3.5 2.5V1.5h4v1M8.5 2.5v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay" onClick={() => setDeleteId(null)}>
          <div className="bg-modal border border-bd rounded-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-t1 mb-2">确认删除</p>
            <p className="text-xs text-t2 mb-6">项目将被永久删除，包括所有对话记录、生成内容和项目文件。此操作不可撤销。</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} disabled={deleting}
                className="px-4 py-2 rounded-lg text-xs font-medium text-t2 hover:text-t1 hover:bg-surface2 transition-colors">取消</button>
              <button onClick={handleDeleteProject} disabled={deleting}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50">
                {deleting ? "删除中…" : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
