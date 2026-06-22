import Link from "next/link";
import { ParticleCanvas } from "./particle-canvas";

export function LandingHero() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#06060a]"
      aria-label="Hero"
    >
      {/* Particle background — fills the entire hero */}
      <ParticleCanvas className="z-0" />

      {/* Subtle vignette overlay — just darkens edges, leaves center visible */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(6,6,10,0.6) 85%, rgba(6,6,10,0.9) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-sm text-indigo-300 mb-8 animate-fade-in backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
          </span>
          AI 驱动的视频制作平台
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-t1 leading-tight animate-fade-in-up">
          一键把文章变成
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">
            可发布的视频
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="mt-6 text-lg md:text-xl text-t2 max-w-2xl mx-auto animate-fade-in-up"
          style={{ animationDelay: "150ms" }}
        >
          不用写脚本、不用拍摄、不用剪辑。
          <br className="hidden sm:block" />
          AI 自动将你的内容转化为专业级网页视频演示，支持屏幕录制、配音合成与多平台发布。
        </p>

        {/* CTAs */}
        <div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
          style={{ animationDelay: "300ms" }}
        >
          <Link
            href="/register"
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-base hover:from-indigo-400 hover:to-violet-500 transition-all shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 hover:scale-105"
          >
            开始免费使用 →
          </Link>
          <a
            href="#features"
            className="px-8 py-3.5 rounded-2xl border border-white/10 text-t1 font-medium text-base hover:bg-white/5 backdrop-blur-sm transition-all"
          >
            了解更多
          </a>
        </div>

        {/* Stats row */}
        <div
          className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-12 text-sm text-t3 animate-fade-in"
          style={{ animationDelay: "500ms" }}
        >
          {[
            { num: "4", label: "种输入方式" },
            { num: "24", label: "种内置动画" },
            { num: "4", label: "步完成制作" },
            { num: "16:9", label: "+ 9:16 双格式" },
          ].map(({ num, label }) => (
            <div key={label} className="text-center">
              <span className="block text-2xl font-bold text-t1">{num}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
