import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";
import { SectionHeading } from "./section-heading";

const CATEGORIES = [
  {
    name: "数据可视化",
    effects: ["饼图 / 环形图", "柱状图 / 折线图", "数字滚动计数器", "仪表盘指针"],
    gradient: "from-emerald-500/20 to-teal-500/20",
    icon: "📊",
  },
  {
    name: "技术演示",
    effects: ["电路流图", "节点网络图", "打字机终端", "SVG 路径绘制"],
    gradient: "from-cyan-500/20 to-blue-500/20",
    icon: "⚡",
  },
  {
    name: "创意视觉",
    effects: ["粒子场", "波形频谱", "月相演变", "发光文字"],
    gradient: "from-violet-500/20 to-purple-500/20",
    icon: "✨",
  },
  {
    name: "叙事场景",
    effects: ["3D 地球飞线", "火柴人动画", "加载动画", "图文编辑排版"],
    gradient: "from-rose-500/20 to-pink-500/20",
    icon: "🎬",
  },
];

export function LandingAnimationShowcase() {
  return (
    <section className="py-24 md:py-32 px-6 bg-surface" aria-label="动画效果">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <SectionHeading
            title="24 种内置动画，开箱即用"
            subtitle="AI 根据内容自动选择最合适的视觉演示效果"
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {CATEGORIES.map((cat, i) => (
            <ScrollReveal key={cat.name} delay={i * 100}>
              <div
                className={`rounded-2xl border border-bd bg-gradient-to-br ${cat.gradient} p-6`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{cat.icon}</span>
                  <h3 className="text-lg font-semibold text-t1">
                    {cat.name}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.effects.map((e) => (
                    <span
                      key={e}
                      className="px-3 py-1 rounded-lg bg-surface border border-bd text-xs text-t2"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={300}>
          <div className="text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              免费注册，体验全部动画 →
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
