import { useEffect, useRef, useCallback } from "react";

type DrawFn = (ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => void;

interface UseSeekableCanvasOptions {
  /** Canvas pixel width. Default: 1920 */
  width?: number;
  /** Canvas pixel height. Default: 1080 */
  height?: number;
  /**
   * stepTime (seconds elapsed within step) from App in seek/render mode.
   * When provided, draws exactly one frame at t=stepTime and stops.
   * When undefined, runs requestAnimationFrame loop starting from 0.
   */
  stepTime?: number;
  /**
   * Delay before animation starts, in seconds. Default: 0
   * In rAF mode, drawing starts after this delay.
   * In seek mode, t=0 until delay passes.
   */
  delay?: number;
  /** FPS cap for rAF mode. Default: 60 */
  fps?: number;
}

/**
 * Unified Canvas hook for seekable animations.
 *
 * In interactive mode: runs a requestAnimationFrame loop, calling draw(ctx, t)
 * where t is seconds since animation started.
 *
 * In seek mode (stepTime provided): calls draw(ctx, stepTime - delay) once,
 * synchronously after mount. No rAF loop.
 *
 * `draw` receives:
 *   ctx  — 2D context (already cleared)
 *   t    — seconds elapsed since animation start (clamped ≥ 0)
 *   w, h — canvas dimensions
 *
 * Usage:
 *   const ref = useSeekableCanvas({ stepTime, draw: (ctx, t, w, h) => {
 *     ctx.fillStyle = "#ff0";
 *     ctx.fillRect(0, 0, w * Math.min(1, t), h);
 *   }});
 *   return <canvas ref={ref} />;
 */
export function useSeekableCanvas(
  draw: DrawFn,
  { width = 1920, height = 1080, stepTime, delay = 0, fps = 60 }: UseSeekableCanvasOptions = {},
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  const renderFrame = useCallback((t: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRef.current(ctx, Math.max(0, t - delay), canvas.width, canvas.height);
  }, [delay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;

    if (stepTime !== undefined) {
      // Seek mode: single deterministic frame
      renderFrame(stepTime);
      return;
    }

    // Interactive rAF loop
    const interval = 1000 / fps;
    let startTs: number | null = null;
    let lastTs = 0;
    let rafId: number;

    const loop = (ts: number) => {
      if (!startTs) startTs = ts;
      const elapsed = ts - startTs;
      if (elapsed - lastTs >= interval) {
        lastTs = elapsed;
        renderFrame(elapsed / 1000);
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepTime, width, height, renderFrame]);

  return canvasRef;
}
