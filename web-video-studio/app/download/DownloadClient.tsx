"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_DOWNLOAD_URL || "/api/download";

const PLATFORM = process.env.NEXT_PUBLIC_DOWNLOAD_PLATFORM || "macOS";

export function DownloadClient() {
  const [downloading, setDownloading] = useState(false);
  const [detectedOS, setDetectedOS] = useState<string | null>(null);

  useEffect(() => {
    // Detect platform from user agent
    const ua = navigator.userAgent;
    if (ua.includes("Mac")) setDetectedOS("macOS");
    else if (ua.includes("Win")) setDetectedOS("Windows");
    else if (ua.includes("Linux")) setDetectedOS("Linux");
    else setDetectedOS("unknown");
  }, []);

  function handleDownload() {
    setDownloading(true);
    // Trigger download via hidden iframe to avoid navigation
    const a = document.createElement("a");
    a.href = DOWNLOAD_URL;
    a.download = "WebVideo-Studio.dmg";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloading(false), 2000);
  }

  const isCompatible = detectedOS === "macOS";
  const showWarning = detectedOS && !isCompatible;

  return (
    <main className="min-h-screen bg-base text-t1 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-t3 hover:text-t1 transition-colors mb-12"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回首页
        </Link>

        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-brand flex items-center justify-center shadow-sm">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-2">WebVideo Studio 桌面客户端</h1>
        <p className="text-sm text-t3 mb-8 leading-relaxed">
          原生 macOS 应用体验 — 更快的启动速度、系统级快捷键、Dock 图标、
          离线使用。适合日常高频视频制作。
        </p>

        {/* Platform badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface2 border border-bd text-xs text-t2 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          当前仅支持 {PLATFORM}
        </div>

        {/* Download button */}
        {showWarning ? (
          <div className="rounded-xl border border-brand/30 bg-brand-subtle px-5 py-4 text-sm text-t2">
            <p className="font-medium text-brand-text mb-1">
              当前仅提供 macOS 版本
            </p>
            <p className="text-t3">
              检测到你的系统是 {detectedOS}。我们正在开发 {detectedOS} 版本，敬请期待。
              你仍可使用{" "}
              <Link href="/" className="underline text-accent">
                Web 版
              </Link>
              。
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-brand text-white font-semibold text-lg hover:bg-brand-hover transition-all shadow-sm disabled:opacity-60 disabled:cursor-wait"
            >
              {downloading ? (
                <>
                  <svg
                    className="animate-spin w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      fill="currentColor"
                      className="opacity-75"
                    />
                  </svg>
                  正在下载…
                </>
              ) : (
                <>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3v12M8 11l4 4 4-4" />
                    <rect x="3" y="15" width="18" height="6" rx="2" />
                  </svg>
                  下载 {PLATFORM} 客户端
                </>
              )}
            </button>

            <p className="text-xs text-t4 mt-4">
              文件大小约 300 MB · 需要 {PLATFORM} 12.0 或更高版本
            </p>
            <div className="mt-3 rounded-lg bg-surface2 border border-bd px-4 py-2.5 text-left">
              <p className="text-xs font-medium text-t2 mb-1">
                ⚠️ 提示「已损坏」或「无法验证开发者」
              </p>
              <p className="text-xs text-t3 leading-relaxed">
                这是 macOS Gatekeeper 的正常行为（app 未经过 Apple 公证）。将 app 拖入 Applications 后，打开<strong> 终端 </strong>运行：
              </p>
              <code className="block mt-1.5 px-3 py-2 rounded-lg bg-surface text-xs text-accent font-mono select-all">
                xattr -cr /Applications/WebVideo\ Studio.app
              </code>
              <p className="text-xs text-t3 mt-1.5">
                之后双击 app 即可正常启动。
              </p>
            </div>
          </>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-3 mt-12 text-left">
          {[
            {
              icon: "⚡",
              title: "原生性能",
              desc: "启动更快，系统级快捷键，与 Mac 深度集成。",
            },
            {
              icon: "🔒",
              title: "数据本地",
              desc: "所有项目文件和 API Key 加密存储在本地。",
            },
            {
              icon: "🔄",
              title: "自动更新",
              desc: "新版本发布时自动提示下载更新。",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-bd bg-modal px-4 py-3"
            >
              <div className="text-lg mb-1">{item.icon}</div>
              <h3 className="text-xs font-semibold text-t1 mb-0.5">
                {item.title}
              </h3>
              <p className="text-[11px] text-t3 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-10 flex items-center justify-center gap-6 text-xs text-t4">
          <Link href="/login" className="hover:text-t1 transition-colors">
            登录 Web 版
          </Link>
          <span>·</span>
          <a
            href={DOWNLOAD_URL}
            className="hover:text-t1 transition-colors"
          >
            直接下载 DMG
          </a>
        </div>
      </div>
    </main>
  );
}
