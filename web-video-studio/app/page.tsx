import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/nav";
import { LandingHero } from "@/components/landing/hero";
import { LandingFeatures } from "@/components/landing/features";
import { LandingHowItWorks } from "@/components/landing/how-it-works";
import { LandingUseCases } from "@/components/landing/use-cases";
import { LandingAnimationShowcase } from "@/components/landing/animation-showcase";
import { LandingPricing } from "@/components/landing/pricing";
import { LandingCTA } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "AI驱动的视频制作平台 | 一键把文章变成视频",
  description:
    "Web Video Studio 是一款 AI 驱动的网页视频制作平台。上传文章、粘贴链接或输入主题，AI 自动生成分章大纲、构建交互式网页演示、合成语音旁白，一键导出 16:9 视频或 9:16 图文卡片。",
  alternates: { canonical: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Web Video Studio",
  url: "https://webvideostudio.com",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  description:
    "AI-powered web video production platform that turns articles, scripts, and blog posts into cinematic 16:9 video presentations with one click.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "CNY",
    availability: "https://schema.org/InStock",
  },
  author: {
    "@type": "Organization",
    name: "Web Video Studio",
  },
  featureList: [
    "AI-powered article to video conversion",
    "24 built-in animation effects",
    "Multiple visual themes",
    "16:9 video and 9:16 graphic card output",
    "TTS audio synthesis",
    "WeChat and Chinese platform integration",
  ],
};

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingUseCases />
        <LandingAnimationShowcase />
        <LandingPricing />
        <LandingCTA />
      </main>
      <LandingFooter />

      {/* JSON-LD Structured Data for SEO / AI crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
    </>
  );
}
