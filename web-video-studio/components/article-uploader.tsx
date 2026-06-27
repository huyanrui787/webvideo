"use client";

import { useRef, useState } from "react";

interface ArticleUploaderProps {
  projectId: string;
  hasArticle: boolean;
  onUploaded: (content: string) => void;
}

type Mode = "default" | "paste" | "generate" | "url";

const IconUpload = <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="11" y1="15" x2="11" y2="7"/><polyline points="8,10 11,7 14,10"/><path d="M3.5 16v1.5a1 1 0 001 1h13a1 1 0 001-1V16"/></svg>;
const IconFile = <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12.5 1.5H5a1 1 0 00-1 1v17a1 1 0 001 1h12a1 1 0 001-1V7L12.5 1.5z"/><polyline points="12.5,1.5 12.5,7 17.5,7"/></svg>;
const IconCheck = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2.5,8 5.5,11 13.5,3"/></svg>;

export function ArticleUploader({ projectId, hasArticle, onUploaded }: ArticleUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("default");
  const [pasteText, setPasteText] = useState("");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pasteTextareaRef = useRef<HTMLTextAreaElement>(null);

  async function upload(content: string) {
    setLoading(true);
    try {
      await fetch(`/api/projects/${projectId}/files`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "article.md", content }) });
      onUploaded(content);
    } finally { setLoading(false); }
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => upload(e.target?.result as string);
    reader.readAsText(file, "utf-8");
  }

  function handleDrop(e: React.DragEvent) { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }

  async function uploadImageAndGetMarker(imageFile: File): Promise<string> {
    const form = new FormData(); form.append("file", imageFile);
    const res = await fetch(`/api/projects/${projectId}/assets`, { method: "POST", body: form });
    if (!res.ok) throw new Error("图片上传失败");
    const data = await res.json();
    return `\n![${data.originalName ?? imageFile.name}](${data.url})\n`;
  }

  async function handlePastePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const imageFiles = Array.from(e.clipboardData.items).filter((item) => item.kind === "file" && item.type.startsWith("image/")).map((item) => item.getAsFile()).filter(Boolean) as File[];
    if (imageFiles.length > 0) { e.preventDefault(); setUploadingImg(true); try { const markers = await Promise.all(imageFiles.map(uploadImageAndGetMarker)); insertAtCursor(markers.join("")); } catch {} finally { setUploadingImg(false); } return; }
    const html = e.clipboardData.getData("text/html");
    const plainText = e.clipboardData.getData("text/plain");
    if (html) {
      const parser = new DOMParser(); const doc = parser.parseFromString(html, "text/html");
      const contentImgs: Array<{ src: string; alt: string }> = []; const seenSrc = new Set<string>();
      const scanForContentImgs = (node: Node) => {
        if (node.nodeName === "IMG") { const el = node as HTMLImageElement; const src = el.dataset.src ?? el.dataset.lazySrc ?? el.getAttribute("src") ?? ""; if (src && src.startsWith("http") && !src.startsWith("data:") && !seenSrc.has(src)) { seenSrc.add(src); contentImgs.push({ src, alt: el.alt || "图片" }); } return; }
        if (node.nodeType === Node.ELEMENT_NODE) { const el = node as Element; const cls = el.className ?? ""; if (/related|recommend|follow|ad_|__ad|bottom_nav|profile|qr_/i.test(cls + (el.id ?? ""))) return; }
        node.childNodes.forEach(scanForContentImgs);
      };
      doc.body.childNodes.forEach(scanForContentImgs);
      if (contentImgs.length > 0) {
        e.preventDefault(); insertAtCursor(plainText || html.replace(/<[^>]+>/g, ""));
        setUploadingImg(true);
        (async () => {
          try {
            const res = await fetch(`/api/projects/${projectId}/assets/proxy-images`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ urls: contentImgs.map((i) => i.src) }) });
            if (!res.ok) return;
            const { results } = await res.json() as { results: Array<{ original: string; local: string }> };
            const urlMap = new Map(results.map(({ original, local }) => [original, local]));
            let rebuilt = "";
            const walk = (node: Node) => {
              if (node.nodeType === Node.TEXT_NODE) { rebuilt += node.textContent ?? ""; }
              else if (node.nodeName === "IMG") { const el = node as HTMLImageElement; const src = el.dataset.src ?? el.dataset.lazySrc ?? el.getAttribute("src") ?? ""; const localUrl = urlMap.get(src); if (localUrl) rebuilt += `\n![${el.alt || "图片"}](${localUrl})\n`; }
              else { if (node.nodeType === Node.ELEMENT_NODE) { const el = node as Element; if (/related|recommend|follow|ad_|__ad|bottom_nav|profile|qr_/i.test((el.className ?? "") + (el.id ?? ""))) return; } node.childNodes.forEach(walk); if (["P","DIV","BR","H1","H2","H3","H4","LI","TR"].includes(node.nodeName)) rebuilt += "\n"; }
            };
            doc.body.childNodes.forEach(walk);
            const cleaned = rebuilt.replace(/\n{3,}/g, "\n\n").trim();
            if (cleaned) setPasteText(cleaned);
          } catch {} finally { setUploadingImg(false); }
        })(); return;
      }
    }
  }

  function insertAtCursor(text: string) {
    const ta = pasteTextareaRef.current;
    if (ta) { const start = ta.selectionStart; const end = ta.selectionEnd; const next = pasteText.slice(0, start) + text + pasteText.slice(end); setPasteText(next); setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + text.length; ta.focus(); }, 0); }
    else setPasteText((prev) => prev + text);
  }

  function handlePasteSubmit() { if (!pasteText.trim()) return; upload(pasteText); setMode("default"); setPasteText(""); }
  async function handleGenerate() { if (!topic.trim()) return; setGenerating(true); setGeneratedText(""); try { const res = await fetch(`/api/projects/${projectId}/generate-article`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic }) }); if (!res.ok || !res.body) throw new Error("生成失败"); const reader = res.body.getReader(); const decoder = new TextDecoder(); let full = ""; while (true) { const { done, value } = await reader.read(); if (done) break; full += decoder.decode(value, { stream: true }); setGeneratedText(full); } upload(full); } catch {} finally { setGenerating(false); } }
  async function handleFetchUrl() { if (!urlInput.trim()) return; setUrlError(""); setGenerating(true); setGeneratedText(""); try { const res = await fetch(`/api/projects/${projectId}/fetch-url`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: urlInput }) }); if (!res.ok) { const err = await res.json().catch(() => ({})); setUrlError(err.error ?? "解析失败"); return; } if (!res.body) { setUrlError("无响应"); return; } const reader = res.body.getReader(); const decoder = new TextDecoder(); let full = ""; while (true) { const { done, value } = await reader.read(); if (done) break; full += decoder.decode(value, { stream: true }); setGeneratedText(full); } upload(full); } catch (e) { setUrlError(e instanceof Error ? e.message : "网络错误"); } finally { setGenerating(false); } }

  /* ── URL mode ── */
  if (mode === "url") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs text-t3">粘贴文章链接，支持微信公众号、知乎专栏、博客等平台</p>
        <input autoFocus type="url" value={urlInput} onChange={(e) => { setUrlInput(e.target.value); setUrlError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleFetchUrl(); }}
          placeholder="https://mp.weixin.qq.com/s/..."
          className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-brand/50" />
        {urlError && <p className="text-xs text-red-400">{urlError}</p>}
        {generating && (
          <div className="rounded-xl bg-surface p-3 text-xs text-t3 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
            {generatedText}<span className="animate-pulse">▌</span>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => { setMode("default"); setUrlError(""); setUrlInput(""); }}
            className="flex-1 rounded-lg border border-bd py-2 text-xs text-t2 hover:bg-surface2 transition-colors">取消</button>
          <button onClick={handleFetchUrl} disabled={!urlInput.trim() || generating}
            className="flex-1 rounded-lg bg-brand hover:bg-brand-hover py-2 text-xs font-medium text-white disabled:opacity-40 transition-colors">
            {generating ? "解析中…" : "解析文章"}
          </button>
        </div>
      </div>
    );
  }

  /* ── Paste mode ── */
  if (mode === "paste") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs text-t3">直接粘贴文字。图片也可以 Cmd+V 粘贴，自动上传到素材库</p>
        <div className="relative">
          <textarea ref={pasteTextareaRef} autoFocus value={pasteText} onChange={(e) => setPasteText(e.target.value)}
            onPaste={handlePastePaste} placeholder="粘贴文章内容…" rows={6}
            className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-brand/50 resize-none font-mono" />
          {uploadingImg && <div className="absolute inset-0 bg-base/70 rounded-xl flex items-center justify-center"><span className="text-xs text-t3 animate-pulse">上传图片中…</span></div>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMode("default")} className="flex-1 rounded-lg border border-bd py-2 text-xs text-t2 hover:bg-surface2 transition-colors">取消</button>
          <button onClick={handlePasteSubmit} disabled={!pasteText.trim() || loading || uploadingImg}
            className="flex-1 rounded-lg bg-brand hover:bg-brand-hover py-2 text-xs font-medium text-white disabled:opacity-40 transition-colors">
            {loading ? "上传中…" : "确认上传"}
          </button>
        </div>
      </div>
    );
  }

  /* ── AI Generate mode ── */
  if (mode === "generate") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs text-t3">输入主题，AI 为你生成一篇科普文章</p>
        <textarea autoFocus value={topic} onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
          placeholder="例如：邮件是如何在 600ms 内送达的" rows={3}
          className="w-full rounded-xl border border-input-bd bg-input-bg px-3 py-2.5 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-brand/50 resize-none" />
        {generating && (
          <div className="rounded-xl bg-surface p-3 text-xs text-t3 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
            {generatedText}<span className="animate-pulse">▌</span>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => setMode("default")}
            className="flex-1 rounded-lg border border-bd py-2 text-xs text-t2 hover:bg-surface2 transition-colors">取消</button>
          <button onClick={handleGenerate} disabled={!topic.trim() || generating}
            className="flex-1 rounded-lg bg-brand hover:bg-brand-hover py-2 text-xs font-medium text-white disabled:opacity-40 transition-colors">
            {generating ? "生成中…" : "生成文章"}
          </button>
        </div>
      </div>
    );
  }

  /* ── Default mode ── */
  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center py-8 gap-3 transition-colors ${
          dragging ? "border-brand/40 bg-brand-subtle" : "border-bd hover:border-bd-hover hover:bg-surface2"
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dragging ? "bg-brand-subtle text-brand-text" : "bg-surface2 text-t3"}`}>
          {hasArticle ? IconFile : IconUpload}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-t1">{hasArticle ? "重新上传文章" : "上传文章"}</p>
          <p className="text-xs text-t3 mt-1">拖拽 .md / .txt 文件，或点击选择</p>
        </div>
        <input ref={fileRef} type="file" accept=".md,.txt,text/plain,text/markdown" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {/* Alternative modes */}
      <div className="flex items-center justify-center gap-1 text-xs text-t3">
        <span>或</span>
        <button onClick={() => setMode("paste")} className="px-2 py-1 rounded-md hover:text-t1 hover:bg-surface2 transition-colors font-medium text-t2">粘贴文字</button>
        <span>·</span>
        <button onClick={() => setMode("url")} className="px-2 py-1 rounded-md hover:text-t1 hover:bg-surface2 transition-colors font-medium text-t2">链接导入</button>
        <span>·</span>
        <button onClick={() => setMode("generate")} className="px-2 py-1 rounded-md hover:text-t1 hover:bg-surface2 transition-colors font-medium text-t2">AI 生成</button>
      </div>

      {loading && <p className="text-xs text-t3 text-center animate-pulse">上传中…</p>}
    </div>
  );
}
