import Link from "next/link";

const FOOTER_LINKS = [
  {
    group: "产品",
    links: [
      { label: "功能特性", href: "#features" },
      { label: "定价方案", href: "#pricing" },
      { label: "动画展示", href: "/showcase" },
    ],
  },
  {
    group: "资源",
    links: [
      { label: "使用文档", href: "#" },
      { label: "更新日志", href: "#" },
      { label: "常见问题", href: "#" },
    ],
  },
  {
    group: "公司",
    links: [
      { label: "关于我们", href: "#" },
      { label: "联系我们", href: "mailto:hello@webvideostudio.com" },
      { label: "隐私政策", href: "#" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-bd bg-surface" role="contentinfo">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white">
                W
              </div>
              <span className="text-sm font-semibold tracking-tight text-t1">
                Web Video Studio
              </span>
            </div>
            <p className="text-sm text-t3 leading-relaxed">
              AI 驱动的网页视频制作平台。
              <br />
              让内容创作回归表达本身。
            </p>
          </div>

          {/* Link groups */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.group}>
              <h4 className="text-sm font-semibold text-t1 mb-3">
                {group.group}
              </h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-t2 hover:text-t1 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-bd flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-t3">
            &copy; {new Date().getFullYear()} Web Video Studio. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-xs text-t3 hover:text-t2 transition-colors">
              服务条款
            </Link>
            <Link href="#" className="text-xs text-t3 hover:text-t2 transition-colors">
              隐私政策
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
