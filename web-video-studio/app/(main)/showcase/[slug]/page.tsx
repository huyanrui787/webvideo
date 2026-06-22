"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DEMOS, getDemoBySlug } from "../meta";
import {
  ParticleDemo, WaveDemo, NetworkDemo, ChartPieDemo, ChartBarDemo, ChartLineDemo,
  GaugeDemo, SvgRevealDemo, TextGlowDemo, DrawPathDemo, TypeWriterDemo, CounterDemo,
  GeoGlobeDemo, MagneticDemo, CircuitDemo, StaggerDemo, FlowChartDemo, LoadingDemo,
  StickFigureDemo, MoonPhaseDemo, LineDrawDemo, GameDemo, EditorialDemo,
} from "../demos";
import type React from "react";

interface UserEffect {
  slug: string;
  title: string;
  tagline: string;
  category: string;
  useCases: string[];
  techTags: string[];
  aiHint: string;
  code: string | null;
}

const DEMO_MAP: Record<string, React.ComponentType> = {
  "chart-pie": ChartPieDemo,
  "chart-bar": ChartBarDemo,
  "chart-line": ChartLineDemo,
  "geo-globe": GeoGlobeDemo,
  "magnetic-field": MagneticDemo,
  "network-graph": NetworkDemo,
  "particle-field": ParticleDemo,
  "wave-form": WaveDemo,
  "counter": CounterDemo,
  "svg-reveal": SvgRevealDemo,
  "typewriter": TypeWriterDemo,
  "gauge": GaugeDemo,
  "circuit": CircuitDemo,
  "stagger": StaggerDemo,
  "text-glow": TextGlowDemo,
  "draw-path": DrawPathDemo,
  "flow-chart": FlowChartDemo,
  "loading": LoadingDemo,
  "stick-figure": StickFigureDemo,
  "moon-phase": MoonPhaseDemo,
  "line-draw": LineDrawDemo,
  "game": GameDemo,
  "editorial": EditorialDemo,
};

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-black/[0.08]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-sm font-medium text-black/70">{q}</span>
        <span className={`text-black/40 text-lg shrink-0 transition-transform ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && (
        <p className="pb-4 text-sm text-black/50 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function DemoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const meta = getDemoBySlug(slug);
  const [seekTime, setSeekTime] = useState<number | undefined>(undefined);
  const [seekMode, setSeekMode] = useState(false);
  const [userEffect, setUserEffect] = useState<UserEffect | null>(null);
  const [loadingUser, setLoadingUser] = useState(!meta);
  const [notFound, setNotFound] = useState(false);

  // If not in static meta, try loading from DB
  useEffect(() => {
    if (meta) return;
    setLoadingUser(true);
    fetch(`/api/effects/${slug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && !data.error) setUserEffect(data as UserEffect);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingUser(false));
  }, [slug, meta]);

  // Reset seek on slug change
  useEffect(() => { setSeekMode(false); setSeekTime(undefined); }, [slug]);

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-black/40 text-sm">
        加载中…
      </div>
    );
  }

  if (notFound && !meta && !userEffect) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-black/40 text-sm">
        动画不存在 —{" "}
        <Link href="/showcase" className="text-indigo-500 underline ml-1">返回展示台</Link>
      </div>
    );
  }

  // User-added effect from DB — same layout as builtin, but with code viewer instead of demo component
  if (!meta && userEffect) {
    return (
      <div className="flex-1 overflow-y-auto bg-white text-t1" style={{ fontFamily: "system-ui, sans-serif" }}>
        {/* Nav */}
        <nav className="sticky top-0 z-20 border-b border-black/[0.07] bg-white/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/showcase" className="text-black/40 hover:text-black/70 text-sm transition-colors">← 动画展示</Link>
              <span className="text-black/15">·</span>
              <span className="text-sm text-black/60">{userEffect.title}</span>
            </div>
            <button
              onClick={() => router.push("/projects")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-sm font-medium text-white transition-colors"
            >
              用这个风格新建项目 →
            </button>
          </div>
        </nav>

        <div className="flex">
          {/* Left sidebar */}
          <aside className="hidden lg:flex flex-col w-52 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto border-r border-black/[0.06] py-4">
            {DEMOS.map((d) => (
              <Link
                key={d.slug}
                href={`/showcase/${d.slug}`}
                className="px-4 py-2.5 text-sm transition-colors truncate text-black/40 hover:text-black/70 hover:bg-black/[0.03]"
              >
                {d.title}
              </Link>
            ))}
            <div className="px-4 py-2.5 text-sm font-medium text-indigo-600 bg-indigo-50 border-r-2 border-indigo-500 truncate">
              {userEffect.title}
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Hero */}
            <section className="px-8 py-12 border-b border-black/[0.06]">
              <div className="flex flex-wrap gap-2 mb-4">
                {userEffect.useCases.map((tag) => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-black/[0.06] text-black/50">{tag}</span>
                ))}
                {userEffect.techTags.map((tag) => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">{tag}</span>
                ))}
              </div>
              <h1 className="text-4xl font-black mb-3 text-black">{userEffect.title}</h1>
              <p className="text-lg text-black/50 mb-8">{userEffect.tagline}</p>

              {/* Hero — live preview via iframe */}
              <div
                className="rounded-2xl overflow-hidden border border-black/[0.08] shadow-sm w-full"
                style={{ aspectRatio: "16/6" }}
              >
                <iframe
                  src={`/api/effects/${slug}/preview`}
                  className="w-full h-full border-0"
                  title={userEffect.title}
                  allow="autoplay"
                />
              </div>
            </section>

            {/* Code viewer */}
            {userEffect.code && (
              <section className="px-8 py-12 border-b border-black/[0.06]">
                <h2 className="text-xl font-bold mb-6 text-black/80">特效源代码</h2>
                <div className="rounded-xl border border-black/[0.08] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-black/[0.03] border-b border-black/[0.08]">
                    <span className="text-xs text-black/40 font-mono">showcase-effects/{slug}/code.tsx</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(userEffect.code ?? ""); }}
                      className="text-xs text-black/40 hover:text-black/70 transition-colors px-2 py-0.5 rounded hover:bg-black/[0.04]"
                    >复制</button>
                  </div>
                  <pre className="p-4 overflow-x-auto text-xs leading-relaxed text-black/60 bg-black/[0.02] max-h-96">
                    <code>{userEffect.code}</code>
                  </pre>
                </div>
              </section>
            )}

            {/* CTA */}
            <section className="px-8 py-16">
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-8 py-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2 text-black/80">用「{userEffect.title}」风格开始你的第一个视频</h2>
                  <p className="text-sm text-black/40 mb-6">上传文章，AI 自动生成脚本 + 章节代码，全程陪跑</p>
                  <button
                    onClick={() => router.push("/projects")}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    新建项目 →
                  </button>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  const DemoComponent = DEMO_MAP[slug];

  if (!meta) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-white text-t1" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-black/[0.07] bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/showcase" className="text-black/40 hover:text-black/70 text-sm transition-colors">
              ← 动画展示
            </Link>
            <span className="text-black/15">·</span>
            <span className="text-sm text-black/60">{meta.title}</span>
          </div>
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-sm font-medium text-white transition-colors"
          >
            用这个风格新建项目 →
          </button>
        </div>
      </nav>

      <div className="flex">
        {/* Left sidebar: all demos from meta */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto border-r border-black/[0.06] py-4">
          {DEMOS.map((d) => (
            <Link
              key={d.slug}
              href={`/showcase/${d.slug}`}
              className={`px-4 py-2.5 text-sm transition-colors truncate ${
                d.slug === slug
                  ? "text-indigo-600 bg-indigo-50 border-r-2 border-indigo-500"
                  : "text-black/40 hover:text-black/70 hover:bg-black/[0.03]"
              }`}
            >
              {d.title}
            </Link>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Hero */}
          <section className="px-8 py-12 border-b border-black/[0.06]">
            <div className="flex flex-wrap gap-2 mb-4">
              {meta.useCases.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-black/[0.06] text-black/50">{tag}</span>
              ))}
              {meta.techTags.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">{tag}</span>
              ))}
            </div>
            <h1 className="text-4xl font-black mb-3 text-black">{meta.title}</h1>
            <p className="text-lg text-black/50 mb-8">{meta.tagline}</p>

            {/* Hero demo */}
            <div
              className="rounded-2xl overflow-hidden border border-black/[0.08] shadow-sm w-full"
              style={{ aspectRatio: "16/6", background: meta.bg, position: "relative" }}
            >
              {DemoComponent ? (
                // Pass seekTime only when seek mode is active — undefined = rAF loop
                <DemoComponent {...(seekMode && seekTime !== undefined ? { stepTime: seekTime } as Record<string, unknown> : {})} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-black/20 text-sm">
                  演示预览
                </div>
              )}
            </div>

            {/* Seek controls — verify render-mode compatibility */}
            {DemoComponent && (
              <div className="mt-4 rounded-xl border border-black/[0.08] bg-black/[0.02] px-4 py-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-black/50 font-medium shrink-0">渲染 Seek 测试</span>
                  <button
                    onClick={() => {
                      const next = !seekMode;
                      setSeekMode(next);
                      if (next) setSeekTime(1.0);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                      seekMode
                        ? "bg-indigo-600 text-white"
                        : "bg-black/[0.06] text-black/50 hover:text-black/80"
                    }`}
                  >
                    {seekMode ? "● Seek 模式" : "○ 实时模式"}
                  </button>
                  {seekMode && (
                    <span className="text-xs font-mono text-indigo-600">
                      t = {(seekTime ?? 0).toFixed(2)}s
                    </span>
                  )}
                </div>
                {seekMode && (
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={0.05}
                    value={seekTime ?? 0}
                    onChange={(e) => setSeekTime(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                )}
                {!seekMode && (
                  <p className="text-xs text-black/30">
                    开启 Seek 模式后拖动滑块，验证特效在任意时间点渲染是否正确（用于 MP4 帧截取）
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Use cases */}
          <section className="px-8 py-12 border-b border-black/[0.06]">
            <h2 className="text-xl font-bold mb-8 text-black/80">适合哪些场景？</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {meta.scenarios.map((s) => (
                <div key={s.title} className="rounded-xl border border-black/[0.08] bg-black/[0.02] p-5">
                  <div className="text-2xl mb-3">{s.icon}</div>
                  <h3 className="font-semibold text-black/80 mb-1.5 text-sm">{s.title}</h3>
                  <p className="text-xs text-black/40 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Tech description */}
          <section className="px-8 py-12 border-b border-black/[0.06]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              <div>
                <h2 className="text-xl font-bold mb-6 text-black/80">这个动画是怎么做的？</h2>
                <div className="space-y-4">
                  {meta.techDesc.map((p, i) => (
                    <p key={i} className="text-sm text-black/50 leading-relaxed">{p}</p>
                  ))}
                </div>
              </div>
              <div
                className="rounded-2xl overflow-hidden border border-black/[0.08]"
                style={{ aspectRatio: "4/3", background: meta.bg, position: "relative" }}
              >
                {DemoComponent && <DemoComponent />}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="px-8 py-12 border-b border-black/[0.06]">
            <div>
              <h2 className="text-xl font-bold mb-6 text-black/80">常见问题</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
                {meta.faqs.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="px-8 py-16">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-8 py-10 flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2 text-black/80">用「{meta.title}」风格开始你的第一个视频</h2>
                <p className="text-sm text-black/40 mb-6">上传文章，AI 自动生成脚本 + 章节代码，全程陪跑</p>
                <button
                  onClick={() => router.push("/projects")}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
                >
                  新建项目 →
                </button>
              </div>
              <ul className="space-y-2 shrink-0">
                {meta.ctaBullets.map((b) => (
                  <li key={b} className="text-sm text-black/50 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
