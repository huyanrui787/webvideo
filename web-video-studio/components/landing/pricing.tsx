import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";
import { SectionHeading } from "./section-heading";

const PLANS = [
  {
    name: "Free",
    nameZh: "免费版",
    price: "¥0",
    period: "永久",
    description: "体验 AI 视频制作的核心能力",
    features: [
      "每月 5 个项目",
      "720p 导出",
      "基础动画效果",
      "2 种主题可选",
      "MiniMax TTS 语音",
      "社区支持",
    ],
    cta: "免费开始",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Starter",
    nameZh: "入门版",
    price: "¥49",
    period: "月",
    description: "适合个人创作者和小型团队",
    features: [
      "每月 20 个项目",
      "1080p 无水印导出",
      "全部 24 种动画效果",
      "全部主题可用",
      "所有 TTS 语音提供商",
      "并行章节构建",
      "自定义主题",
      "邮件支持",
    ],
    cta: "开始入门",
    href: "/register",
    highlighted: true,
  },
  {
    name: "Pro",
    nameZh: "专业版",
    price: "¥149",
    period: "月",
    description: "适合全职内容创作者",
    features: [
      "每月 100 个项目",
      "4K 超清导出",
      "全部高级功能",
      "所有 AI 模型可用",
      "优先 AI 处理队列",
      "无限并行构建",
      "自定义品牌 / 白标",
      "专属客户支持",
    ],
    cta: "升级专业",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Enterprise",
    nameZh: "企业版",
    price: "定制",
    period: "年",
    description: "适合团队和机构批量制作",
    features: [
      "无限项目",
      "无限存储空间",
      "API 接口访问",
      "私有部署可选",
      "SLA 服务保障",
      "专属客户成功经理",
      "定制培训和 onboarding",
      "合同 / 发票支持",
    ],
    cta: "联系我们",
    href: "mailto:hello@webvideostudio.com",
    highlighted: false,
  },
];

export function LandingPricing() {
  return (
    <section id="pricing" className="py-24 md:py-32 px-6" aria-label="定价方案">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <SectionHeading
            title="选择适合你的方案"
            subtitle="从免费开始，按需升级——所有方案都包含核心 AI 能力"
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan, i) => (
            <ScrollReveal key={plan.name} delay={i * 100}>
              <div
                className={`relative rounded-2xl border p-6 h-full flex flex-col transition-all duration-300 ${
                  plan.highlighted
                    ? "border-amber-600/30 bg-brand-subtle scale-[1.02]"
                    : "border-bd bg-surface hover:border-amber-600/10"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand text-white text-xs font-medium">
                    最受欢迎
                  </div>
                )}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-sm font-medium text-t2">
                      {plan.name}
                    </span>
                    <span className="text-xs text-t3">
                      {plan.nameZh}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-t1">
                      {plan.price}
                    </span>
                    <span className="text-sm text-t3">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="text-xs text-t3 mt-1">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-t2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 mt-0.5 text-brand-text"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block text-center py-2.5 rounded-xl text-sm font-medium transition-all ${
                    plan.highlighted
                      ? "bg-brand text-white hover:bg-brand-hover"
                      : "border border-bd text-t1 hover:bg-surface2"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
