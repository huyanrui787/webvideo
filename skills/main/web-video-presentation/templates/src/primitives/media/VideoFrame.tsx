import type { CSSProperties } from "react";
interface VideoFrameProps { src: string; fit?: "contain" | "cover"; autoplay?: boolean; className?: string; style?: CSSProperties; }
export function VideoFrame({ src, fit = "cover", autoplay = true, className, style }: VideoFrameProps) {
  return <video src={src} className={className} autoPlay={autoplay} muted loop playsInline style={{ width: "100%", height: "100%", objectFit: fit, borderRadius: "var(--radius-md)", ...style }} />;
}
