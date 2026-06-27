"use client";

import { useEffect, useRef, useState } from "react";

interface AvatarConfig {
  photoUrl: string;
  photoName: string;
}

interface ChapterJob {
  id: string;
  status: "pending" | "generating" | "done" | "error";
}

interface AvatarJob {
  status: "idle" | "merging-audio" | "uploading" | "generating" | "downloading" | "done" | "error";
  progress: string;
  error?: string;
  chapters?: ChapterJob[];
}

interface AvatarWorkbenchProps {
  projectId: string;
}

const STATUS_LABEL: Record<AvatarJob["status"], string> = {
  idle: "未开始",
  "merging-audio": "合并音频中…",
  uploading: "上传中…",
  generating: "HeyGen 生成中…",
  downloading: "下载中…",
  done: "已完成",
  error: "生成失败",
};

export function AvatarWorkbench({ projectId }: AvatarWorkbenchProps) {
  const [config, setConfig] = useState<AvatarConfig | null>(null);
  const [job, setJob] = useState<AvatarJob>({ status: "idle", progress: "" });
  const [hasFinalVideo, setHasFinalVideo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewUrl = useRef<string | null>(null);

  useEffect(() => {
    fetchStatus();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function fetchStatus() {
    const res = await fetch(`/api/projects/${projectId}/avatar`);
    if (!res.ok) return;
    const d = await res.json();
    setConfig(d.config ?? null);
    setJob(d.job ?? { status: "idle", progress: "" });
    setHasFinalVideo(d.hasFinalVideo ?? false);

    if (["merging-audio", "uploading", "generating", "downloading"].includes(d.job?.status)) {
      startPoll();
    }
  }

  function startPoll() {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/projects/${projectId}/avatar`);
      if (!res.ok) return;
      const d = await res.json();
      setJob(d.job ?? { status: "idle", progress: "" });
      setHasFinalVideo(d.hasFinalVideo ?? false);

      const active = ["merging-audio", "uploading", "generating", "downloading"];
      if (!active.includes(d.job?.status)) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
      }
    }, 5000);
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");

    const fd = new FormData();
    fd.append("photo", file);

    const res = await fetch(`/api/projects/${projectId}/avatar`, { method: "POST", body: fd });
    const data = await res.json();

    if (res.ok && data.ok) {
      setConfig(data.config);
    } else {
      setUploadError(data.error ?? "上传失败");
    }
    setUploading(false);
    if (e.target) e.target.value = "";
  }

  async function handleGenerate() {
    if (!config) return;
    const res = await fetch(`/api/projects/${projectId}/avatar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate" }),
    });
    const d = await res.json();
    if (d.status === "started" || d.status === "already-running") {
      setJob({ status: "merging-audio", progress: "启动中…" });
      startPoll();
    }
  }

  async function handleDelete() {
    await fetch(`/api/projects/${projectId}/avatar`, { method: "DELETE" });
    setConfig(null);
    setJob({ status: "idle", progress: "" });
    setHasFinalVideo(false);
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  const isBusy = ["merging-audio", "uploading", "generating", "downloading"].includes(job.status);

  return (
    <div className="border-t border-bd bg-modal shrink-0">
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs font-medium text-t2 flex items-center gap-1.5">
          👤 数字人
        </span>
        <div className="flex items-center gap-1.5">
          {hasFinalVideo && (
            <a
              href={`/api/projects/${projectId}/avatar/download`}
              download="avatar.mp4"
              className="text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-2 py-0.5 hover:bg-indigo-50 transition-colors"
            >
              ↓ 下载
            </a>
          )}
          {config && !isBusy && (
            <button
              onClick={handleDelete}
              className="text-xs text-t4 hover:text-red-400 transition-colors"
              title="重置"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="px-3 pb-3 space-y-2">
        {/* No config — upload photo */}
        {!config && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <p className="text-xs text-t3 leading-relaxed">
              上传正脸照片，用 HeyGen AI 把口播音频合成为真人说话视频。
            </p>
            {uploadError && (
              <p className="text-xs text-red-500">{uploadError}</p>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-xl border-2 border-dashed border-bd py-3 text-xs text-t3 hover:border-indigo-300 hover:text-amber-600 disabled:opacity-50 transition-colors"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-bd-hover border-t-amber-600 rounded-full" />
                  上传中…
                </span>
              ) : (
                "点击上传正脸照片"
              )}
            </button>
          </>
        )}

        {/* Config ready — show status */}
        {config && (
          <>
            {/* Avatar ready badge */}
            <div className="flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2">
              <span className="text-amber-600 text-sm">✓</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-indigo-700">照片已上传</p>
                <p className="text-[10px] text-brand-text truncate">
                  {config.photoName}
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-brand-text hover:text-indigo-600 border border-indigo-200 rounded px-1.5 py-0.5"
              >
                换照片
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>

            {/* Job progress */}
            {isBusy && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-t2">
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-bd border-t-amber-600 rounded-full shrink-0" />
                  <span className="truncate">{job.progress || STATUS_LABEL[job.status]}</span>
                </div>
                {job.chapters && job.chapters.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {job.chapters.map((c) => {
                      const colors = {
                        pending: "text-t4 bg-base",
                        generating: "text-indigo-600 bg-indigo-50 animate-pulse",
                        done: "text-green-600 bg-green-50",
                        error: "text-red-500 bg-red-50",
                      };
                      const icons = { pending: "○", generating: "◌", done: "●", error: "✕" };
                      return (
                        <span key={c.id} className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${colors[c.status]}`}>
                          {icons[c.status]} {c.id}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Done */}
            {job.status === "done" && hasFinalVideo && (
              <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2 flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-xs text-green-700 font-medium flex-1">数字人视频已生成</span>
                <a
                  href={`/api/projects/${projectId}/avatar/download`}
                  download="avatar.mp4"
                  className="text-xs bg-green-600 text-t1 px-2.5 py-1 rounded-lg hover:bg-green-500 transition-colors font-medium"
                >
                  ↓ 下载 MP4
                </a>
              </div>
            )}

            {/* Error */}
            {job.status === "error" && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 space-y-1">
                <p className="text-xs text-red-600">{job.error ?? "生成失败"}</p>
                <button
                  onClick={handleGenerate}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >
                  重试
                </button>
              </div>
            )}

            {/* Idle — generate button */}
            {(job.status === "idle" || job.status === "done") && !isBusy && (
              <button
                onClick={handleGenerate}
                className="w-full rounded-xl bg-indigo-600 py-2 text-xs font-medium text-t1 hover:bg-brand transition-colors"
              >
                {job.status === "done" ? "↺ 重新生成" : "▶ 生成数字人视频"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
