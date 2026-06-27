import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@ffmpeg-installer/ffmpeg", "fluent-ffmpeg", "playwright"],
  devIndicators: false,
  typescript: {
    // TODO: fix pre-existing type errors from dependency upgrades, then remove this
    ignoreBuildErrors: true,
  },

};

export default nextConfig;
