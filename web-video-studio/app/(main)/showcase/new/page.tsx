"use client";

import { useState } from "react";
import Link from "next/link";

type Step = "input" | "converting" | "preview" | "saving" | "done";

const PLACEHOLDER = `// 从 OpenProcessing 复制过来的 p5.js 代码
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(10, 10, 20);
  // ...
}`;

function toComponentName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function NewEffectPage() {
  const [step, setStep] = useState<Step>("input");
  const [source, setSource] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [useCases, setUseCases] = useState("");
  const [techTags, setTechTags] = useState("");
  const [effectCode, setEffectCode] = useState("");
  const [aiHint, setAiHint] = useState("");
  const [error, setError] = useState("");

  function handleTitleChange(v: string) {
    setTitle(v);
    if (!slug || slug === slugify(title)) setSlug(slugify(v));
  }

  async function handleConvert() {
    if (!source.trim() || !title.trim() || !slug.trim()) {
      setError("请填写标题、slug 和源码");
      return;
    }
    setError("");
    setStep("converting");

    const name = toComponentName(slug);
    const res = await fetch("/api/effects/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, name, slug }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? `转换失败 (HTTP ${res.status})`);
      setStep("input");
      return;
    }

    const data = await res.json() as { effectCode: string; aiHint: string };
    setEffectCode(data.effectCode);
    setAiHint(data.aiHint);
    setStep("preview");
  }

  async function handleSave() {
    setStep("saving");
    setError("");

    const res = await fetch("/api/effects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        title,
        tagline: tagline || title,
        category: toComponentName(slug),
        useCases: useCases.split(",").map((s) => s.trim()).filter(Boolean),
        techTags: techTags.split(",").map((s) => s.trim()).filter(Boolean),
        aiHint,
        effectCode,
        sourceType: "user",
      }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "保存失败");
      setStep("preview");
      return;
    }

    setStep("done");
  }

  const inputCls = "w-full bg-black/[0.04] border border-black/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 placeholder:text-black/25 text-black";

  return (
    <div className="flex-1 overflow-y-auto bg-white text-black min-h-full" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-black/[0.07] bg-white/90 backdrop-blur-md">
        <div className="px-8 h-14 flex items-center gap-3">
          <Link href="/showcase" className="text-black/40 hover:text-black/70 text-sm transition-colors">
            ← 动画展示
          </Link>
          <span className="text-black/15">·</span>
          <span className="text-sm text-black/60">新增特效</span>
        </div>
      </nav>

      <div className="px-8 py-10">

        {/* Done state */}
        {step === "done" && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">✓</div>
            <h2 className="text-xl font-bold mb-2">特效已入库</h2>
            <p className="text-black/40 text-sm mb-8">
              已保存到数据库并写入 showcase-effects/{slug}/code.tsx
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href={`/showcase/${slug}`}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition-colors"
              >
                查看详情页
              </Link>
              <button
                onClick={() => { setStep("input"); setSource(""); setTitle(""); setSlug(""); setEffectCode(""); setAiHint(""); }}
                className="px-5 py-2.5 rounded-xl border border-black/15 text-black/60 hover:text-black hover:border-black/30 text-sm font-medium transition-colors"
              >
                继续添加
              </button>
            </div>
          </div>
        )}

        {/* Input / Converting / Preview states */}
        {step !== "done" && (
          <div className={`grid grid-cols-1 gap-8 ${step !== "input" ? "lg:grid-cols-2" : "max-w-2xl"}`}>
            {/* Left: form */}
            <div className="space-y-5">
              <h1 className="text-2xl font-black">从 p5.js 添加新特效</h1>
              <p className="text-sm text-black/40 leading-relaxed">
                从 OpenProcessing 复制特效源码，AI 自动改写为兼容视频渲染的 React + useSeekableCanvas 格式。
              </p>

              {/* Title + slug */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-black/50 mb-1.5">特效名称</label>
                  <input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="粒子流场" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-black/50 mb-1.5">slug（英文）</label>
                  <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="flow-field" className={`${inputCls} font-mono`} />
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs text-black/50 mb-1.5">一句话说明（可选）</label>
                <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="粒子跟随鼠标轨迹流动的视觉特效" className={inputCls} />
              </div>

              {/* Use cases + tech tags */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-black/50 mb-1.5">适用场景（逗号分隔）</label>
                  <input value={useCases} onChange={(e) => setUseCases(e.target.value)} placeholder="科技氛围, 开场钩子" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-black/50 mb-1.5">技术标签（逗号分隔）</label>
                  <input value={techTags} onChange={(e) => setTechTags(e.target.value)} placeholder="Canvas 2D, 粒子系统" className={inputCls} />
                </div>
              </div>

              {/* Source code */}
              <div>
                <label className="block text-xs text-black/50 mb-1.5">p5.js 源码</label>
                <textarea
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder={PLACEHOLDER}
                  rows={22}
                  className="w-full bg-black/[0.03] border border-black/10 rounded-xl px-3 py-2.5 text-xs font-mono text-black outline-none focus:border-indigo-500 placeholder:text-black/20 resize-y leading-relaxed"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  ⚠ {error}
                </p>
              )}

              <button
                onClick={handleConvert}
                disabled={step === "converting" || step === "saving"}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-sm font-semibold text-white transition-colors"
              >
                {step === "converting" ? "AI 改写中…" : "AI 改写 →"}
              </button>
            </div>

            {/* Right: preview / code */}
            <div className="space-y-4">
              {step === "converting" && (
                <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-black/10 bg-black/[0.02]">
                  <div className="flex gap-1 mb-3">
                    {[0, 0.15, 0.3].map((d) => (
                      <span key={d} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                  <p className="text-sm text-black/40">AI 正在改写代码…</p>
                </div>
              )}

              {(step === "preview" || step === "saving") && effectCode && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-black/80">改写结果</h2>
                    {aiHint && (
                      <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {aiHint}
                      </span>
                    )}
                  </div>

                  {/* Code preview */}
                  <div className="relative rounded-2xl border border-black/[0.08] bg-[#1e1e1e] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
                      <span className="text-xs font-mono text-white/40">showcase-effects/{slug}/code.tsx</span>
                      <button onClick={() => navigator.clipboard.writeText(effectCode)} className="text-xs text-white/30 hover:text-white/60 transition-colors">复制</button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-white/75 overflow-auto max-h-96 leading-relaxed">{effectCode}</pre>
                  </div>

                  {/* AI hint editable */}
                  <div>
                    <label className="block text-xs text-black/50 mb-1.5">AI 使用提示（可修改）</label>
                    <input value={aiHint} onChange={(e) => setAiHint(e.target.value)} className={inputCls} />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep("input")}
                      className="flex-1 py-2.5 rounded-xl border border-black/15 text-black/60 hover:text-black hover:border-black/30 text-sm font-medium transition-colors"
                    >
                      ← 重新编辑
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={step === "saving"}
                      className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 text-sm font-semibold text-white transition-colors"
                    >
                      {step === "saving" ? "保存中…" : "✓ 确认入库"}
                    </button>
                  </div>
                </>
              )}

              {step === "input" && (
                <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-dashed border-black/10 text-black/20 text-sm">
                  填写左侧信息后点击「AI 改写」
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
