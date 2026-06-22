import { ScrollReveal } from "./scroll-reveal";
import { SectionHeading } from "./section-heading";

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    title: "四种输入方式",
    description: "上传 Markdown 文件、粘贴文章内容、导入公众号链接、或让 AI 根据主题自动生成——多种方式，随你选择。",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: "全自动 AI 流水线",
    description: "内容撰写 → 网页开发 → 音频合成 → 屏幕录制，AI 自动完成每一步，你只需确认关键节点。",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    title: "24 种内置动画效果",
    description: "从数据图表到粒子场、从打字机到 3D 地球——内置丰富的视觉演示原语，AI 自动选择最合适的动画。",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "多主题多风格",
    description: "暗色极简、暖白写实、赛博科幻——多种视觉主题可选，AI 根据内容自动推荐最佳匹配。",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: "两种输出格式",
    description: "16:9 横屏视频适合 B 站、YouTube 等平台；9:16 竖屏图文卡片适合小红书、公众号——一键切换。",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    title: "中文生态深度集成",
    description: "支持微信公众号链接一键导入，输出格式适配国内主流平台，TTS 旁白支持中文语音合成。",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-24 md:py-32 px-6" aria-label="核心功能">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <SectionHeading
            title="为什么选择 Web Video Studio？"
            subtitle="不只是视频工具——它是你的 AI 视频制作团队"
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 80}>
              <div className="group rounded-2xl border border-bd bg-surface hover:bg-surface2 hover:border-indigo-500/20 transition-all duration-300 p-6 h-full">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-t1 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-t2 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
