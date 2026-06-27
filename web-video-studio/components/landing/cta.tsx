import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

export function LandingCTA() {
  return (
    <section className="py-24 md:py-32 px-6" aria-label="开始使用">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-t1 leading-tight">
            准备好开始创作了吗？
          </h2>
          <p className="mt-4 text-lg text-t2 max-w-xl mx-auto">
            免费注册，几分钟内将你的第一篇文章变成可发布的视频。
          </p>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-10 py-4 rounded-2xl bg-brand text-white font-semibold text-lg hover:bg-brand-hover transition-colors shadow-sm"
            >
              免费注册 →
            </Link>
            <Link
              href="/login"
              className="px-10 py-4 rounded-2xl border border-bd text-t1 font-medium text-lg hover:bg-surface transition-all"
            >
              已有账号？登录
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <p className="mt-8 text-xs text-t3">
            无需信用卡 · 免费版永久可用 · 随时升级
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
