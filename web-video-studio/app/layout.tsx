import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://webvideostudio.com"),
  title: {
    default: "Web Video Studio - AI驱动的视频制作平台 | 一键把文章变成视频",
    template: "%s | Web Video Studio",
  },
  description:
    "Web Video Studio 是一款 AI 驱动的网页视频制作平台，一键将文章、博客、微信公众号内容转化为专业的 16:9 视频或 9:16 图文卡片。无需编写脚本、拍摄或剪辑——AI 自动完成从内容到视频的全流程。",
  keywords: [
    "AI视频制作",
    "文章转视频",
    "AI视频生成",
    "网页视频",
    "公众号视频",
    "知识科普视频",
    "代码讲解视频",
    "数据可视化动画",
  ],
  authors: [{ name: "Web Video Studio" }],
  creator: "Web Video Studio",
  publisher: "Web Video Studio",
  openGraph: {
    type: "website",
    siteName: "Web Video Studio",
    locale: "zh_CN",
    title: "Web Video Studio - AI驱动的视频制作平台",
    description: "一键把文章变成可发布的视频。无需脚本、拍摄或剪辑——AI 自动完成全流程。",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Web Video Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Video Studio - AI驱动的视频制作平台",
    description: "一键把文章变成可发布的视频。无需脚本、拍摄或剪辑——AI 自动完成全流程。",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var r=t==='dark'||t==='light'?t:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',r)}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Prevent FOUC: apply theme before first paint / hydration */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
