/**
 * Build an English image-generation prompt from an IllustrationShot record.
 * Fully style-aware: uses active style's character name, color guidance,
 * label style, structure hints, and space rules. Neutralizes legacy "小黑"
 * references from AI-generated shot descriptions.
 */
import type { IllustrationShot } from "@/lib/db/schema";
import type { StyleConfig, PresetParts } from "./illustration-style";
import { resolveActiveStyle } from "./illustration-style";

export function buildImagePrompt(
  shot: IllustrationShot,
  styleHint?: string,
  styleConfig?: StyleConfig | null,
): string {
  const active = resolveActiveStyle(styleConfig ?? null);
  const isDefaultStyle = !styleConfig || styleConfig.activePreset === "xiaobei" || !styleConfig.activePreset;

  // ── Neutralize legacy "小黑" in shot content ─────────────────
  const neutralName = isDefaultStyle ? "小黑" : active.characterName;
  const coreIdea = isDefaultStyle ? (shot.coreIdea ?? "") : (shot.coreIdea ?? "").replace(/小黑/g, neutralName);
  const xiaoheiAction = isDefaultStyle ? (shot.xiaoheiAction ?? "") : (shot.xiaoheiAction ?? "").replace(/小黑/g, neutralName);
  const elements = safeParseArray(shot.elements);
  const neutralElements = isDefaultStyle ? elements : elements.map((e: string) => e.replace(/小黑/g, neutralName));
  const labels = safeParseArray(shot.labels);

  const structureHint = active.structureHints[shot.structureType] ?? "";
  const elementsLine = neutralElements.length > 0 ? `Elements: ${neutralElements.join(" / ")}` : "";
  const labelsLine = labels.length > 0 ? `Labels: ${labels.join(" / ")}` : "";
  const styleLine = styleHint ? `Style direction: ${styleHint}` : "";

  // ── Global override ─────────────────────────────────────────
  if ((styleConfig as any)?.globalOverride) {
    return [
      (styleConfig as any).globalOverride,
      "",
      `Theme: ${shot.theme}`,
      `Core idea: ${coreIdea}`,
      xiaoheiAction ? `Action: ${xiaoheiAction}` : "",
      elementsLine,
      labelsLine,
      styleLine,
    ].filter(Boolean).join("\n");
  }

  // ── Full style-aware prompt assembly ─────────────────────────
  return [
    `Generate one standalone 16:9 widescreen landscape illustration (NOT square, NOT portrait). The composition must fill the full horizontal frame.`,
    "",
    `--- VISUAL STYLE ---`,
    active.visualDna,
    "",
    `--- CHARACTER ---`,
    active.characterDescription,
    "",
    `Color guide:`,
    active.colorGuidance,
    "",
    `Label style:`,
    active.labelStyle,
    "",
    `--- CONTENT ---`,
    `Theme: ${shot.theme}`,
    `Structure type: ${shot.structureType}${structureHint ? ` (${structureHint})` : ""}`,
    `Core idea: ${coreIdea}`,
    xiaoheiAction ? `Action: ${xiaoheiAction}` : "",
    elementsLine,
    labelsLine,
    styleLine,
    "",
    `--- COMPOSITION ---`,
    active.spaceRule,
    "One core structure only. No structure type label. No formal chart. No reused examples.",
  ].filter(Boolean).join("\n");
}

function safeParseArray(raw: string): string[] {
  try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; }
  catch { return []; }
}
