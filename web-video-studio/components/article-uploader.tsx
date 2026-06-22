"use client";

import { useRef, useState } from "react";

interface ArticleUploaderProps {
  projectId: string;
  hasArticle: boolean;
  onUploaded: (content: string) => void;
}

type Mode = "default" | "paste" | "generate" | "url";

export function ArticleUploader({
  projectId,
  hasArticle,
  onUploaded,
}: ArticleUploaderProps) {
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
      await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "article.md", content }),
      });
      onUploaded(content);
    } finally {
      setLoading(false);
    }
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => upload(e.target?.result as string);
    reader.readAsText(file, "utf-8");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function uploadImageAndGetMarker(imageFile: File): Promise<string> {
    const form = new FormData();
    form.append("file", imageFile);
    const res = await fetch(`/api/projects/${projectId}/assets`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error("图片上传失败");
    const data = await res.json();
    const name = data.originalName ?? imageFile.name;
    return `\n![${name}](${data.url})\n`;
  }

  async function handlePastePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    // Case 1: pasting image files directly (screenshot, dragged file)
    const imageFiles = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter(Boolean) as File[];

    if (imageFiles.length > 0) {
      e.preventDefault();
      setUploadingImg(true);
      try {
        const markers = await Promise.all(imageFiles.map(uploadImageAndGetMarker));
        insertAtCursor(markers.join(""));
      } catch (err) { console.error(err); }
      finally { setUploadingImg(false); }
      return;
    }

    // Case 2: pasting rich HTML (e.g. from WeChat article)
    const html = e.clipboardData.getData("text/html");
    const plainText = e.clipboardData.getData("text/plain");

    if (html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Walk the DOM first to find which img nodes are actual content images
      // (i.e. they appear inline with text, not in decorative containers).
      // Collect (src, alt) in document order — only these will be downloaded.
      const contentImgs: Array<{ src: string; alt: string }> = [];
      const seenSrc = new Set<string>();

      const scanForContentImgs = (node: Node) => {
        if (node.nodeName === "IMG") {
          const el = node as HTMLImageElement;
          const src = el.dataset.src ?? el.dataset.lazySrc ?? el.getAttribute("src") ?? "";
          if (src && src.startsWith("http") && !src.startsWith("data:") && !seenSrc.has(src)) {
            seenSrc.add(src);
            contentImgs.push({ src, alt: el.alt || "图片" });
          }
          return; // don't descend into img
        }
        // Skip WeChat non-content sections: related-articles, follow widgets, ad blocks
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          const cls = el.className ?? "";
          const id = el.id ?? "";
          if (/related|recommend|follow|ad_|__ad|bottom_nav|profile|qr_/i.test(cls + id)) return;
        }
        node.childNodes.forEach(scanForContentImgs);
      };
      doc.body.childNodes.forEach(scanForContentImgs);

      console.log("[paste] content imgs found:", contentImgs.length);

      if (contentImgs.length > 0) {
        e.preventDefault();

        const textToInsert = plainText || html.replace(/<[^>]+>/g, "");
        insertAtCursor(textToInsert);

        setUploadingImg(true);
        (async () => {
          try {
            const res = await fetch(`/api/projects/${projectId}/assets/proxy-images`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ urls: contentImgs.map((i) => i.src) }),
            });
            if (!res.ok) return;
            const { results, errors, total } = await res.json() as {
              results: Array<{ original: string; local: string }>;
              errors: Array<{ url: string; status?: number; error?: string }>;
              total: number;
            };
            console.log(`[proxy-images] total=${total} ok=${results.length} failed=${errors.length}`);
            if (errors.length > 0) console.warn("[proxy-images] errors:", errors);

            const urlMap = new Map(results.map(({ original, local }) => [original, local]));

            // Walk doc to rebuild text with image markers at correct positions
            let rebuilt = "";
            const walk = (node: Node) => {
              if (node.nodeType === Node.TEXT_NODE) {
                rebuilt += node.textContent ?? "";
              } else if (node.nodeName === "IMG") {
                const el = node as HTMLImageElement;
                const src = el.dataset.src ?? el.dataset.lazySrc ?? el.getAttribute("src") ?? "";
                const localUrl = urlMap.get(src);
                if (localUrl) rebuilt += `\n![${el.alt || "图片"}](${localUrl})\n`;
              } else {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const el = node as Element;
                  const cls = el.className ?? "";
                  const id = el.id ?? "";
                  if (/related|recommend|follow|ad_|__ad|bottom_nav|profile|qr_/i.test(cls + id)) return;
                }
                node.childNodes.forEach(walk);
                const block = ["P","DIV","BR","H1","H2","H3","H4","LI","TR"];
                if (block.includes(node.nodeName)) rebuilt += "\n";
              }
            };
            doc.body.childNodes.forEach(walk);

            const cleaned = rebuilt.replace(/\n{3,}/g, "\n\n").trim();
            if (cleaned) setPasteText(cleaned);
          } catch (err) { console.error(err); }
          finally { setUploadingImg(false); }
        })();
        return;
      }
      // No content images — fall through to default paste
    }
  }

  function insertAtCursor(text: string) {
    const ta = pasteTextareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = pasteText.slice(0, start) + text + pasteText.slice(end);
      setPasteText(next);
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + text.length;
        ta.focus();
      }, 0);
    } else {
      setPasteText((prev) => prev + text);
    }
  }

  function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    upload(pasteText);
    setMode("default");
    setPasteText("");
  }

  async function handleGenerate() {
    if (!topic.trim()) return;
    setGenerating(true);
    setGeneratedText("");
    try {
      const res = await fetch(`/api/projects/${projectId}/generate-article`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      if (!res.ok || !res.body) throw new Error("生成失败");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setGeneratedText(full);
      }
      onUploaded(full);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  async function handleFetchUrl() {
    if (!urlInput.trim()) return;
    setUrlError("");
    setGenerating(true);
    setGeneratedText("");
    try {
      const res = await fetch(`/api/projects/${projectId}/fetch-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setUrlError(err.error ?? "解析失败，请检查链接是否可访问");
        return;
      }
      if (!res.body) { setUrlError("无响应"); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setGeneratedText(full);
      }
      onUploaded(full);
    } catch (e) {
      setUrlError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setGenerating(false);
    }
  }

  if (mode === "url") {
    return (
      <div className="flex flex-col h-full p-4 gap-3">
        {!generating && !generatedText ? (
          <>
            <p className="text-xs text-t2">粘贴文章链接，支持微信公众号、知乎、博客等</p>
            <input
              autoFocus
              type="url"
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setUrlError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleFetchUrl(); }}
              placeholder="https://mp.weixin.qq.com/s/..."
              className="rounded-xl border border-bd px-3 py-2 text-sm outline-none focus:border-bd-strong"
            />
            {urlError && (
              <p className="text-xs text-red-500">{urlError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setMode("default"); setUrlError(""); setUrlInput(""); }}
                className="flex-1 rounded-lg border border-bd py-2 text-sm text-t2 hover:bg-base"
              >
                取消
              </button>
              <button
                onClick={handleFetchUrl}
                disabled={!urlInput.trim()}
                className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-t1 hover:bg-accent-hover disabled:opacity-40"
              >
                解析文章
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto rounded-xl border border-bd p-3 text-xs font-mono text-t2 whitespace-pre-wrap">
              {generatedText}
              {generating && <span className="animate-pulse">▌</span>}
            </div>
            {!generating && (
              <p className="text-xs text-t3 text-center">文章已保存，可在上方编辑</p>
            )}
          </>
        )}
      </div>
    );
  }

  if (mode === "paste") {
    return (
      <div className="flex flex-col h-full p-4 gap-3">
        <p className="text-xs text-t3">
          直接粘贴文字，图片也可以 Cmd+V 粘贴，自动上传到素材库并插入位置标记
        </p>
        <div className="relative flex-1">
          <textarea
            ref={pasteTextareaRef}
            autoFocus
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            onPaste={handlePastePaste}
            placeholder="粘贴文章内容，图片直接 Cmd+V 粘贴…"
            className="w-full h-full rounded-xl border border-bd p-3 text-sm resize-none outline-none focus:border-bd-strong font-mono"
          />
          {uploadingImg && (
            <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center">
              <span className="text-xs text-t2 animate-pulse">上传图片中…</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("default")}
            className="flex-1 rounded-lg border border-bd py-2 text-sm text-t2 hover:bg-base"
          >
            取消
          </button>
          <button
            onClick={handlePasteSubmit}
            disabled={!pasteText.trim() || loading || uploadingImg}
            className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-t1 hover:bg-accent-hover disabled:opacity-40"
          >
            {loading ? "上传中…" : "确认"}
          </button>
        </div>
      </div>
    );
  }

  if (mode === "generate") {
    return (
      <div className="flex flex-col h-full p-4 gap-3">
        {!generating && !generatedText ? (
          <>
            <p className="text-xs text-t2">输入主题，AI 为你生成一篇科普文章</p>
            <textarea
              autoFocus
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
              }}
              placeholder="例：邮件是如何在 600ms 内送达的"
              rows={3}
              className="rounded-xl border border-bd p-3 text-sm resize-none outline-none focus:border-bd-strong"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setMode("default")}
                className="flex-1 rounded-lg border border-bd py-2 text-sm text-t2 hover:bg-base"
              >
                取消
              </button>
              <button
                onClick={handleGenerate}
                disabled={!topic.trim()}
                className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-t1 hover:bg-accent-hover disabled:opacity-40"
              >
                生成文章
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto rounded-xl border border-bd p-3 text-xs font-mono text-t2 whitespace-pre-wrap">
              {generatedText}
              {generating && <span className="animate-pulse">▌</span>}
            </div>
            {!generating && (
              <p className="text-xs text-t3 text-center">文章已保存，可在上方编辑</p>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`w-full rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center py-10 gap-3 transition-colors ${
          dragging
            ? "border-bd-strong bg-base"
            : "border-bd hover:border-bd-hover"
        }`}
      >
        <span className="text-3xl">{hasArticle ? "📄" : "📂"}</span>
        <p className="text-xs text-t2 text-center">
          {hasArticle ? "重新上传文章" : "拖拽或点击上传"}
          <br />
          <span className="text-t3">.md / .txt</span>
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".md,.txt,text/plain,text/markdown"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
      <div className="flex gap-3 text-xs text-t3">
        <button
          onClick={() => setMode("paste")}
          className="hover:text-t2 underline underline-offset-2"
        >
          粘贴文字
        </button>
        <span>·</span>
        <button
          onClick={() => setMode("url")}
          className="hover:text-t2 underline underline-offset-2"
        >
          链接导入
        </button>
        <span>·</span>
        <button
          onClick={() => setMode("generate")}
          className="hover:text-t2 underline underline-offset-2"
        >
          AI 生成
        </button>
      </div>
      {loading && (
        <p className="text-xs text-t3 animate-pulse">上传中…</p>
      )}
    </div>
  );
}
