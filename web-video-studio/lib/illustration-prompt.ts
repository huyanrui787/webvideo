/**
 * Build an English image-generation prompt from an IllustrationShot record.
 * Used by the illustrations/generate API to call DashScope wanx-v1.
 */
import type { IllustrationShot } from "@/lib/db/schema";

export function buildImagePrompt(shot: IllustrationShot): string {
  const elements = safeParseArray(shot.elements);
  const labels = safeParseArray(shot.labels);

  const structureHint = STRUCTURE_HINTS[shot.structureType] ?? "";
  const elementsLine = elements.length > 0 ? `Elements: ${elements.join(" / ")}` : "";
  const labelsLine = labels.length > 0 ? `Chinese handwritten labels: ${labels.join(" / ")}` : "";

  return [
    "Generate one standalone 16:9 horizontal Chinese article illustration.",
    "",
    "Visual DNA:",
    "Pure white background. Minimalist black hand-drawn line art. Slightly wobbly pen",
    "lines. Lots of empty white space. Sparse red/orange/blue handwritten Chinese",
    "annotations. Clean absurd product-sketch feeling. No gradients, no shadows, no",
    "paper texture, no complex background, no commercial vector style, no PPT",
    "infographic look, no cute mascot poster, no children's illustration, no realistic UI.",
    "",
    "Recurring IP character required:",
    "小黑, a small solid-black absurd creature with white dot eyes, tiny thin legs,",
    "blank serious expression, slightly uneven hand-drawn body shape. 小黑 must",
    "perform the core conceptual action, not decorate the scene. Make 小黑 serious,",
    "deadpan, and slightly bizarre, not cute.",
    "",
    `Theme: ${shot.theme}`,
    `Structure type: ${shot.structureType}${structureHint ? ` (${structureHint})` : ""}`,
    `Core idea: ${shot.coreIdea}`,
    shot.xiaoheiAction ? `Composition: ${shot.xiaoheiAction}` : "",
    elementsLine,
    labelsLine,
    "Color use: Black line art + red/orange/blue sparse annotations.",
    "",
    "Constraints: One core structure only. Main subject 40-60% of frame. At least 35%",
    "empty white space. Max 5-8 short Chinese handwritten labels. No title in corner.",
    "No structure type label. No formal chart. No reused examples.",
  ]
    .filter(Boolean)
    .join("\n");
}

function safeParseArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Brief English hints for each structure type, appended to the prompt. */
const STRUCTURE_HINTS: Record<string, string> = {
  Workflow: "left-to-right flow with orange arrows",
  "系统局部": "3-5 core modules, 小黑 interacting with one key module",
  "前后对比": "left chaos vs right order, orange arrow between",
  "角色状态": "2-4 small state icons, one short label each",
  "概念隐喻": "one large absurd object or machine, few inputs, one output",
  "方法分层": "stacked layers, 小黑 carrying bricks beside it",
  "地图路线": "one winding path, few nodes, 小黑 walking or leading",
  "小漫画分镜": "2-4 small comic panels, fail-to-success arc",
};
