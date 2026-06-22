import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@ffmpeg-installer/ffmpeg", "fluent-ffmpeg", "playwright"],
  devIndicators: false,

  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      // Proxy /draw to AI Draw Nexus Vite dev server
      return [
        { source: "/draw", destination: "http://localhost:5173/draw/" },
        { source: "/draw/:path*", destination: "http://localhost:5173/draw/:path*" },
      ];
    }
    // Production: SPA fallback — serve index.html for client-side routes
    return [
      {
        source: "/draw/:path((?!index\\.html$|assets/).*)",
        destination: "/draw/index.html",
      },
    ];
  },
};

export default nextConfig;
