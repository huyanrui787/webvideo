"use client";

import { useEffect, useRef, useState, use } from "react";
import type { Project } from "@/lib/db/schema";

type Tab = "ppt" | "video";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const SPEED_MIN = 0.5;
const SPEED_MAX = 2;
const SPEED_STEP = 0.1;

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<Tab>("ppt");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderDone, setRenderDone] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetch(`/api/share/${id}/info`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setProject(data.project);
        setRenderDone(data.renderDone ?? false);
        const q = new URLSearchParams(window.location.search);
        if (q.get("tab") === "video" && data.renderDone) setTab("video");
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false));
  }, [id]);

  // ── PPT playback state ──
  const [autoMode, setAutoMode] = useState(false);
  const [playbackState, setPlaybackState] = useState<"idle" | "playing" | "paused" | "ended">("idle");
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [endedDismissed, setEndedDismissed] = useState(false);

  useEffect(() => {
    if (playbackState !== "ended") setEndedDismissed(false);
  }, [playbackState]);

  function sendToIframe(msg: object) {
    iframeRef.current?.contentWindow?.postMessage(msg, "*");
  }

  function handlePlay() {
    const msg = autoMode ? "start-auto" : "start-manual";
    if (playbackState === "ended") {
      sendToIframe({ type: "seek-chapter", chapter: 0 });
    }
    sendToIframe({ type: msg });
    setPlaybackState("playing");
  }

  function handlePause() {
    sendToIframe({ type: "pause" });
    setPlaybackState("paused");
  }

  function handleSpeedChange(rate: number) {
    setSpeed(rate);
    sendToIframe({ type: "set-speed", rate });
  }

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data?.type === "presentation-end") setPlaybackState("ended");
      else if (e.data?.type === "playback-paused") setPlaybackState("paused");
      else if (e.data?.type === "playback-resumed") setPlaybackState("playing");
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <span className="text-sm text-white/40 animate-pulse">加载中…</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-white/60 mb-2">{error || "项目未找到"}</p>
          <p className="text-xs text-white/30">此链接可能已失效</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0c] text-white">
      {/* ── Top bar ── */}
      <div className="flex items-center h-9 px-4 border-b border-white/10 shrink-0">
        <span className="text-xs text-white/50 mr-4">Web Video Studio</span>
        <div className="flex items-center gap-0.5 ml-auto">
          {/* Tab toggle */}
          <div className="flex items-center rounded border border-white/10 mr-2">
            <button
              onClick={() => setTab("ppt")}
              className={`px-3 py-0.5 text-[11px] font-medium transition-colors ${tab === "ppt" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50"}`}
            >PPT</button>
            <button
              onClick={() => renderDone && setTab("video")}
              disabled={!renderDone}
              className={`px-3 py-0.5 text-[11px] font-medium transition-colors ${
                tab === "video" ? "bg-white/10 text-white" : renderDone ? "text-white/30 hover:text-white/50" : "text-white/10 cursor-not-allowed"
              }`}
            >视频</button>
          </div>
          <button
            onClick={() => iframeRef.current?.contentWindow?.location.reload()}
            className="text-white/30 hover:text-white/80 text-sm px-2 transition-colors"
            title="刷新"
          >↺</button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-h-0 bg-black">
        {tab === "ppt" ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative h-full" style={{ aspectRatio: "16/9", maxWidth: "100%", maxHeight: "100%" }}>
              <iframe
                ref={iframeRef}
                src={`/share/${id}/index.html`}
                allow="autoplay"
                className="absolute inset-0 w-full h-full border-0"
                title="演示"
              />
              {/* Playback ended overlay */}
              {playbackState === "ended" && !endedDismissed && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black/60 backdrop-blur-sm">
                  <p className="text-base font-semibold text-white/80">播放完毕</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEndedDismissed(true)}
                      className="px-4 py-1.5 rounded-lg border border-white/20 text-xs text-white/50 hover:text-white/80 hover:border-white/30 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handlePlay}
                      className="px-4 py-1.5 rounded-lg bg-white/90 text-black text-xs font-medium hover:bg-white transition-colors"
                    >
                      ↺ 重播
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `black url(/api/projects/${id}/assets/poster.jpg) center/contain no-repeat`,
            }}
          >
            <video
              src={`/api/projects/${id}/render?stream=1`}
              controls
              preload="none"
              className="max-w-full max-h-full"
              style={{ aspectRatio: "16/9", background: "black" }}
            />
          </div>
        )}
      </div>

      {/* ── Bottom bar (PPT only) ── */}
      {tab === "ppt" && (
        <div className="shrink-0 border-t border-white/10 bg-[#0a0a0c]">
          {/* Control row */}
          <div className="flex items-center gap-1.5 px-3" style={{ height: 40 }}>
            {/* Auto / Manual toggle */}
            <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.02] p-0.5 shrink-0">
              <button
                onClick={() => setAutoMode(true)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
                  autoMode ? "bg-white/90 text-black shadow-sm" : "text-white/30 hover:text-white/50"
                }`}
              >
                ▶ 自动
              </button>
              <button
                onClick={() => setAutoMode(false)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
                  !autoMode ? "bg-white/90 text-black shadow-sm" : "text-white/30 hover:text-white/50"
                }`}
              >
                ⏹ 手动
              </button>
            </div>

            <div className="flex-1" />

            {/* Play/Pause (auto only) */}
            {autoMode && (
              <>
                {playbackState === "playing" ? (
                  <button onClick={handlePause} className="text-xs bg-white/10 text-white/60 border border-white/10 px-2.5 py-1 rounded-md font-medium hover:bg-white/20 shrink-0">⏸</button>
                ) : playbackState === "paused" ? (
                  <button onClick={handlePlay} className="text-xs bg-white text-black px-2.5 py-1 rounded-md font-medium hover:opacity-80 shrink-0">▶ 继续</button>
                ) : playbackState === "ended" ? (
                  <button onClick={handlePlay} className="text-xs bg-white text-black px-2.5 py-1 rounded-md font-medium hover:opacity-80 shrink-0">↺ 重播</button>
                ) : (
                  <button onClick={handlePlay} className="text-xs bg-white text-black px-2.5 py-1 rounded-md font-medium hover:opacity-80 shrink-0">▶ 播放</button>
                )}

                {/* Speed */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setSpeedOpen((v) => !v)}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-white/30 hover:text-white/50 hover:border-white/20 font-medium"
                  >{speed}x</button>
                  {speedOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setSpeedOpen(false)} />
                      <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-50 bg-[#111] border border-white/10 rounded-xl shadow-xl p-3 min-w-[160px]">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-white/30">播放速度</span>
                          <span className="text-xs font-semibold">{speed}x</span>
                        </div>
                        <input
                          type="range"
                          min={SPEED_MIN}
                          max={SPEED_MAX}
                          step={SPEED_STEP}
                          value={speed}
                          onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                          className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <div className="flex justify-between mt-1">
                          <span className="text-[9px] text-white/20">0.5x</span>
                          <span className="text-[9px] text-white/20">1x</span>
                          <span className="text-[9px] text-white/20">2x</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
