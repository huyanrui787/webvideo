import type { CSSProperties } from "react";
interface AvatarProps { src: string; size?: number; shape?: "circle" | "square"; className?: string; style?: CSSProperties; }
export function Avatar({ src, size = 64, shape = "circle", className, style }: AvatarProps) {
  return <img src={src} className={className} style={{ width: size, height: size, objectFit: "cover", borderRadius: shape === "circle" ? "50%" : "var(--radius-md)", ...style }} />;
}
