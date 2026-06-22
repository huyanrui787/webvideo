import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";
import { SectionHeading } from "./section-heading";

const USE_CASES = [
  {
    title: "文章讲解",
    tag: "内容创作者",
    description: "把博客、公众号文章、论文转化为有节奏、有画面的视频讲解，适合知识类、科普类内容。",
    href: "/register",
    gradient: "from-emerald-500/20 to-teal-500/10",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
      </svg>
    ),
  },
  {
    title: "数据故事",
    tag: "数据分析师",
    description: "自动生成动画图表——饼图、柱状图、折线图、仪表盘——让数据自己讲故事，告别静态截图。",
    href: "/register",
    gradient: "from-amber-500/20 to-orange-500/10",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    title: "代码讲解",
    tag: "技术博主",
    description: "终端打字机动画、代码高亮分步展示、架构图动态绘制——让技术教程不再只有屏幕截图。",
    href: "/register",
    gradient: "from-cyan-500/20 to-blue-500/10",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
  },
  {
    title: "产品演示",
    tag: "产品经理",
    description: "将产品功能拆解为逐步骤演示——从问题到方案到操作——比录屏更具节奏感和叙事力。",
    href: "/register",
    gradient: "from-rose-500/20 to-pink-500/10",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    title: "时间线叙事",
    tag: "历史 / 品牌",
    description: "用时间轴动画串联关键节点，适合品牌故事、项目里程碑、历史回顾等时间驱动的内容。",
    href: "/register",
    gradient: "from-purple-500/20 to-indigo-500/10",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

export function LandingUseCases() {
  return (
    <section className="py-24 md:py-32 px-6" aria-label="应用场景">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <SectionHeading
            title="适合什么样的内容？"
            subtitle="五种项目类型，覆盖主流视频内容创作场景"
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {USE_CASES.map((uc, i) => (
            <ScrollReveal key={uc.title} delay={i * 100}>
              <Link
                href={uc.href}
                className={`group block rounded-2xl border border-bd bg-gradient-to-br ${uc.gradient} p-6 hover:scale-[1.02] transition-all duration-300 h-full`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
                    {uc.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-t1">
                      {uc.title}
                    </h3>
                    <span className="text-xs text-t3">{uc.tag}</span>
                  </div>
                </div>
                <p className="text-sm text-t2 leading-relaxed">
                  {uc.description}
                </p>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
