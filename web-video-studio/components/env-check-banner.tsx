"use client";

import { useEffect, useState } from "react";

interface CheckItem {
  icon: string;
  label: string;
  detail: string;
  action?: string;
  actionLabel?: string;
}

export function EnvCheckBanner() {
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [allOk, setAllOk] = useState(true);
  const [visible, setVisible] = useState(false);
  const [installingPL, setInstallingPL] = useState(false);

  useEffect(() => {
    // Only run in Electron context
    const api = (window as any).electronAPI;
    if (!api) return;

    api.runBootstrapChecks().then((result: any) => {
      if (!result) return;
      const items: CheckItem[] = [
        {
          icon: result.checks.sqlite.ok ? "✅" : "❌",
          label: "数据库引擎 (SQLite)",
          detail: result.checks.sqlite.detail,
        },
        {
          icon: result.checks.ffmpeg.ok ? "✅" : "⚠️",
          label: "FFmpeg",
          detail: result.checks.ffmpeg.detail,
          ...(!result.checks.ffmpeg.ok
            ? { action: "brew install ffmpeg", actionLabel: "需手动安装" }
            : {}),
        },
        {
          icon: result.checks.playwright.ok ? "✅" : "⚠️",
          label: "Playwright Chromium (视频录制)",
          detail: result.checks.playwright.detail,
          ...(!result.checks.playwright.ok
            ? { action: "install-playwright", actionLabel: "点击安装" }
            : {}),
        },
        {
          icon: result.checks.skills.ok ? "✅" : "❌",
          label: "技能库 (Skills)",
          detail: result.checks.skills.detail,
        },
        {
          icon: result.checks.database.ok ? "✅" : "❌",
          label: "本地数据库",
          detail: result.checks.database.detail,
        },
      ];
      setChecks(items);
      setAllOk(result.ok);
      setVisible(!result.ok); // Only show if something needs attention
    });
  }, []);

  async function handleInstallPlaywright() {
    const api = (window as any).electronAPI;
    if (!api) return;
    setInstallingPL(true);
    try {
      const result = await api.installPlaywrightChromium();
      if (result.ok) {
        // Refresh checks
        const refreshed = await api.runBootstrapChecks();
        if (refreshed) {
          setChecks((prev) =>
            prev.map((c) =>
              c.label.includes("Playwright")
                ? { ...c, icon: "✅", detail: "Playwright Chromium ready", action: undefined, actionLabel: undefined }
                : c
            )
          );
          const allGood = Object.values(refreshed.checks).every((c: any) => c.ok);
          setAllOk(allGood);
          if (allGood) setVisible(false);
        }
      } else {
        alert(`安装失败: ${result.message}`);
      }
    } finally {
      setInstallingPL(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="mx-4 mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🔧</span>
        <h3 className="text-sm font-semibold text-t1">环境检测</h3>
        <span className="text-xs text-t3">
          {allOk ? "所有检查通过" : "部分组件需要安装才能使用完整功能"}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {checks.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 text-xs text-t2"
          >
            <span className="w-4 text-center shrink-0">{item.icon}</span>
            <span className="font-medium w-44 shrink-0">{item.label}</span>
            <span className="text-t3 truncate flex-1">
              {item.detail}
            </span>
            {item.action === "install-playwright" && (
              <button
                onClick={handleInstallPlaywright}
                disabled={installingPL}
                className="shrink-0 px-2.5 py-1 rounded-md bg-accent hover:bg-accent-hover text-accent-text text-xs font-medium disabled:opacity-40 transition-colors"
              >
                {installingPL ? "安装中…" : item.actionLabel}
              </button>
            )}
            {item.action && item.action !== "install-playwright" && (
              <code className="shrink-0 px-2 py-0.5 rounded bg-surface2 text-xs text-t4">
                {item.action}
              </code>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() => setVisible(false)}
        className="mt-3 text-xs text-t4 hover:text-t2 transition-colors"
      >
        关闭
      </button>
    </div>
  );
}
