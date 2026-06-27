import { ScrollReveal } from "./scroll-reveal";
import { SectionHeading } from "./section-heading";

const STEPS = [
  {
    step: 1,
    title: "内容撰写",
    description: "上传文章、粘贴链接或输入主题，AI 自动生成口播稿和分章大纲，一次对齐脚本、主题、素材和开发模式。",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    step: 2,
    title: "网页开发",
    description: "AI 自动搭建 Vite + React 项目，按章节逐个构建交互式网页演示——每步独占整屏，内容驱动动画。",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    step: 3,
    title: "音频合成（可选）",
    description: "为每步配音自动合成 TTS 语音，支持多种语音提供商——AI 旁白与画面完美同步。",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    ),
  },
  {
    step: 4,
    title: "录屏与发布",
    description: "录制或导出最终视频——16:9 横屏适合视频平台，9:16 竖屏适合图文平台，一键分发。",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
];

export function LandingHowItWorks() {
  return (
    <section className="py-24 md:py-32 px-6 bg-surface" aria-label="工作流程">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <SectionHeading
            title="四步完成视频制作"
            subtitle="从文章到可发布视频，AI 驱动每一步"
          />
        </ScrollReveal>

        {/* Desktop: horizontal steps with connecting line */}
        <div className="hidden md:grid grid-cols-4 gap-6 relative">
          {/* Connecting line */}
          <div className="absolute top-12 left-[12.5%] right-[12.5%] h-px bg-bd-strong" />

          {STEPS.map((s, i) => (
            <ScrollReveal key={s.step} delay={i * 120}>
              <div className="relative text-center">
                <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center text-lg font-bold mx-auto mb-4 relative z-10">
                  {s.step}
                </div>
                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand-text flex items-center justify-center mx-auto mb-3">
                  {s.icon}
                </div>
                <h3 className="text-base font-semibold text-t1 mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-t2 leading-relaxed">
                  {s.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Mobile: vertical steps */}
        <div className="md:hidden space-y-6">
          {STEPS.map((s, i) => (
            <ScrollReveal key={s.step} delay={i * 100}>
              <div className="flex gap-4 items-start">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center text-sm font-bold">
                  {s.step}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-brand-text">{s.icon}</span>
                    <h3 className="text-base font-semibold text-t1">
                      {s.title}
                    </h3>
                  </div>
                  <p className="text-sm text-t2 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
