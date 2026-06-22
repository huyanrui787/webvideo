"use client";

interface RecordingGuideCardProps {
  devPort: number | null;
  hasAudio: boolean;
}

export function RecordingGuideCard({ devPort, hasAudio }: RecordingGuideCardProps) {
  const autoUrl = devPort ? `http://localhost:${devPort}?auto=1` : null;
  const manualUrl = devPort ? `http://localhost:${devPort}` : null;

  return (
    <div className="mx-3 my-2 rounded-2xl border-2 border-green-200 bg-green-50 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-base">🎬</span>
        <span className="text-sm font-semibold text-t1">准备录屏</span>
      </div>

      {hasAudio ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-modal border border-green-100 p-3">
            <p className="text-xs font-medium text-t2 mb-1">Auto 模式（推荐）</p>
            <p className="text-xs text-t2 leading-relaxed mb-2">
              音频已合成。打开页面 → 按 Space 启动 → 整片自动播完 → 停止录制。
              音视频天然同步，无需后期对轨。
            </p>
            {autoUrl && (
              <a
                href={autoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-xs text-green-700 font-mono bg-green-100 px-2 py-1 rounded hover:bg-green-200"
              >
                {autoUrl}
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-modal border border-green-100 p-3">
          <p className="text-xs font-medium text-t2 mb-1">Manual 模式</p>
          <p className="text-xs text-t2 leading-relaxed mb-2">
            打开页面，录屏后手动点击推进，后期用任意剪辑工具配音。
          </p>
          {manualUrl && (
            <a
              href={manualUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs text-green-700 font-mono bg-green-100 px-2 py-1 rounded hover:bg-green-200"
            >
              {manualUrl}
            </a>
          )}
        </div>
      )}

      <div className="text-xs text-t3 space-y-1">
        <p className="font-medium text-t2">推荐录屏工具</p>
        <p>macOS：QuickTime Player / OBS Studio</p>
        <p>Windows：OBS Studio</p>
        <p className="mt-1">录制区域选 1920×1080 窗口，帧率 60fps。</p>
      </div>
    </div>
  );
}
