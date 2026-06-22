import type { CSSProperties } from "react";

interface MediaFrameProps {
  src: string;
  fit?: "cover" | "contain" | "fill";
  aspectRatio?: string;
  stepTime?: number;
  className?: string;
  style?: CSSProperties;
}

/** Image/video container with configurable fit and aspect ratio. */
export function MediaFrame({
  src,
  fit = "cover",
  aspectRatio = "16/9",
  stepTime: _stepTime,
  className,
  style,
}: MediaFrameProps) {
  const isVideo = /\.(mp4|webm|mov|avi)$/i.test(src ?? "");
  return (
    <div
      className={className}
      style={{
        aspectRatio,
        overflow: "hidden",
        borderRadius: "var(--radius-md, 8px)",
        background: "var(--surface-2, rgba(255,255,255,0.06))",
        ...style,
      }}
    >
      {isVideo ? (
        <video
          src={src}
          style={{ width: "100%", height: "100%", objectFit: fit }}
          muted
          loop
          playsInline
        />
      ) : (
        <img
          src={src}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: fit }}
        />
      )}
    </div>
  );
}
