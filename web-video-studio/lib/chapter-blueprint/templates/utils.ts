/**
 * Shared utilities for template generators.
 * Extracted from the monolithic compiler to avoid duplication across templates.
 */

import type { StyleOverrides } from "../types";

export function styleOverridesToProp(ov?: StyleOverrides): string {
  if (!ov) return "";
  const parts: string[] = [];
  if (ov.accentColor) parts.push(`"--accent-local": "${ov.accentColor}"`);
  if (ov.customProperties) {
    for (const [k, v] of Object.entries(ov.customProperties)) {
      parts.push(`"${k}": "${v}"`);
    }
  }
  return parts.length > 0 ? ` style={{ ${parts.join(", ")} }}` : "";
}

export function extraClasses(ov?: StyleOverrides): string {
  if (!ov?.extraClasses) return "";
  return ` ${ov.extraClasses}`;
}

export function bgClass(ov?: StyleOverrides): string {
  if (!ov?.backgroundStyle || ov.backgroundStyle === "solid") return "";
  return ` bg-${ov.backgroundStyle}`;
}

export function mediaToJsx(
  media: { type: string; src: string; alt?: string; fit?: string; width?: number; height?: number } | undefined,
  indent: string = ""
): string {
  if (!media) return "null /* no media */";
  const { src, alt = "", type, fit = "contain" } = media;
  const styleParts = [`objectFit: "${fit}"`];
  if (media.width) styleParts.push(`width: ${media.width}`);
  if (media.height) styleParts.push(`height: ${media.height}`);
  const style = `{{ ${styleParts.join(", ")} }}`;

  if (type === "video") {
    return `${indent}<video src="${src}" style={${style}} autoPlay muted loop playsInline />`;
  }
  if (!media.width && !media.height) {
    return `${indent}<img src="${src}" alt="${alt}" style={{ objectFit: "${fit}", width: 640, height: 360 }} />`;
  }
  return `${indent}<img src="${src}" alt="${alt}" style={${style}} />`;
}

// ── HTML escape helpers ────────────────────────────────────────────────────

export function escHtml(s: string | undefined | null): string {
  if (s == null) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function escAttr(s: string | undefined | null): string {
  if (s == null) return "";
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

export function escTemplate(s: string | undefined | null): string {
  if (s == null) return "";
  return s.replace(/`/g, "\\`").replace(/\$/g, "\\$");
}
