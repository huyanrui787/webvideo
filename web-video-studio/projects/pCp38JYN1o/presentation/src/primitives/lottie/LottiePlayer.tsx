// @ts-nocheck
"use client";
import { useEffect, useRef, type CSSProperties } from "react";

interface LottiePlayerProps {
  /** Path or URL to a Lottie JSON file */
  src: string;
  /** Auto-play on mount. Default: true */
  autoplay?: boolean;
  /** Loop the animation. Default: true */
  loop?: boolean;
  /** Playback speed multiplier. Default: 1 */
  speed?: number;
  /**
   * In seek mode (stepTime provided), scrubs to this position.
   * stepTime is mapped assuming the clip covers `clipDuration` seconds.
   */
  stepTime?: number;
  /** Expected total clip duration in seconds (for seek mapping). Default: 3 */
  clipDuration?: number;
  style?: CSSProperties;
  className?: string;
}

/**
 * Lottie animation player. Wraps lottie-web for seekable playback.
 *
 * Usage:
 *   <LottiePlayer src="/animations/santa.json" loop stepTime={stepTime} />
 *   <LottiePlayer src="/animations/logo-reveal.json" loop={false} clipDuration={2} />
 */
export function LottiePlayer({
  src,
  autoplay = true,
  loop = true,
  speed = 1,
  stepTime,
  clipDuration = 3,
  style,
  className,
}: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const animRef = useRef<any>(null);

  useEffect(() => {
    let anim: { destroy(): void; setSpeed(s: number): void; goToAndStop(f: number, b: boolean): void; totalFrames: number };
    import("lottie-web").then((lottie) => {
      if (!containerRef.current) return;
      anim = lottie.default.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop,
        autoplay: stepTime === undefined ? autoplay : false,
        path: src,
      });
      anim.setSpeed(speed);
      animRef.current = anim;

      if (stepTime !== undefined) {
        anim.addEventListener("DOMLoaded", () => {
          const frame = (stepTime / clipDuration) * anim.totalFrames;
          anim.goToAndStop(frame, true);
        });
      }
    });

    return () => { anim?.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, loop, autoplay, speed]);

  // Seek: update frame when stepTime changes
  useEffect(() => {
    const anim = animRef.current;
    if (anim && stepTime !== undefined) {
      const frame = (stepTime / clipDuration) * anim.totalFrames;
      anim.goToAndStop(Math.max(0, frame), true);
    }
  }, [stepTime, clipDuration]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        ...style,
      }}
    />
  );
}
