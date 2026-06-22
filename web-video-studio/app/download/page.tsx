import type { Metadata } from "next";
import { DownloadClient } from "./DownloadClient";

export const metadata: Metadata = {
  title: "下载桌面客户端 — WebVideo Studio",
  description: "下载 WebVideo Studio macOS 桌面客户端，获得原生视频制作体验。",
};

export default function DownloadPage() {
  return <DownloadClient />;
}
