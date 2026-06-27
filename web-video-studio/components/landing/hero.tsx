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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-bd bg-surface text-xs text-t2 mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
          </span>
          AI 驱动的视频制作平台
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-t1 leading-tight text-balance animate-fade-in-up">
          一键把文章变成
          <br />
          <span className="text-brand-text">
            可发布的视频
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="mt-6 text-base md:text-lg text-t2 max-w-2xl mx-auto animate-fade-in-up"
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
            className="px-8 py-3.5 rounded-2xl bg-brand text-white font-semibold text-base hover:bg-brand-hover transition-colors"
          >
            开始免费使用 →
          </Link>
          <a
            href="#features"
            className="px-8 py-3.5 rounded-2xl border border-bd text-t1 font-medium text-base hover:bg-surface transition-colors"
          >
            了解更多
          </a>
        </div>

        {/* Stats row */}
        <div
          className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-12 text-xs text-t3 animate-fade-in"
          style={{ animationDelay: "500ms" }}
        >
          {[
            { num: "4", label: "种输入方式" },
            { num: "24", label: "种内置动画" },
            { num: "4", label: "步完成制作" },
            { num: "16:9", label: "+ 9:16 双格式" },
          ].map(({ num, label }) => (
            <div key={label} className="text-center">
              <span className="block text-xl font-bold text-t1">{num}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
