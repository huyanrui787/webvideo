/**
 * PPTX Export — converts chapter blueprints into editable .pptx files.
 *
 * Template → Slide Layout Mapping:
 *   hero-title     → TITLE_SLIDE
 *   step-reveal    → BULLET_SLIDE
 *   data-spotlight → CHART_SLIDE
 *   side-by-side   → TWO_CONTENT
 *   flow-diagram   → DIAGRAM_SLIDE
 *   code-showcase  → CODE_SLIDE
 *   quote-card     → QUOTE_SLIDE
 *   grid-gallery   → GALLERY_SLIDE
 */

import PptxGenJS from "pptxgenjs";
import path from "path";
import fs from "fs";
import { projectDir } from "@/lib/projects";
import type { ChapterBlueprint as ChapterBlueprintType } from "@/lib/chapter-blueprint";

// ── Slide layout → PPTX layout mapping ────────────────────────────────────

const TEMPLATE_TO_LAYOUT: Record<string, string> = {
  "hero-title": "TITLE_SLIDE",
  "step-reveal": "TITLE_AND_BODY",
  "data-spotlight": "BLANK",
  "side-by-side": "COMPARISON",
  "flow-diagram": "BLANK",
  "code-showcase": "BLANK",
  "quote-card": "BLANK",
  "grid-gallery": "BLANK",
};

// ── Main export function ───────────────────────────────────────────────────

export async function exportToPPTX(
  projectId: string,
  blueprints: ChapterBlueprintType[]
): Promise<Buffer> {
  const pptx = new PptxGenJS();

  // Presentation metadata
  pptx.layout = "LAYOUT_WIDE"; // 16:9
  pptx.title = blueprints.map((bp) => bp.title).join(" · ");

  for (const bp of blueprints) {
    for (let i = 0; i < bp.steps.length; i++) {
      const step = bp.steps[i]!;
      const layout = step.layout;

      // Choose slide layout
      const slide = pptx.addSlide();

      // Add chapter title as subtitle
      if (i === 0) {
        slide.addText(bp.title, {
          x: 0.5, y: 0.1, w: "90%", h: 0.3,
          fontSize: 12, italic: true, color: "888888",
        });
      }

      // Extract text content from slots
      if (layout.mode === "template") {
        const slots = layout.slots as Record<string, any>;
        const textParts: string[] = [];

        for (const [key, value] of Object.entries(slots)) {
          if (typeof value === "string" && value.trim()) {
            textParts.push(value);
          } else if (typeof value === "object" && value?.heading) {
            textParts.push(value.heading);
            if (value.body) textParts.push(value.body);
          } else if (Array.isArray(value)) {
            for (const item of value) {
              if (typeof item === "string") textParts.push(`• ${item}`);
              else if (item?.heading) textParts.push(`${item.heading}`);
              else if (item?.label) textParts.push(`${item.label}: ${item.value ?? ""}`);
            }
          }
        }

        // Add text to slide
        if (textParts.length > 0) {
          slide.addText(textParts.join("\n"), {
            x: 0.5, y: 0.5, w: "90%", h: "90%",
            fontSize: 16,
            align: layout.template === "hero-title" ? "center" : "left",
            valign: layout.template === "hero-title" ? "middle" : "top",
          });
        }

        // Add media references as notes
        const mediaRefs: string[] = [];
        const scanForMedia = (obj: any) => {
          if (!obj || typeof obj !== "object") return;
          if (obj.type && obj.src) mediaRefs.push(`${obj.type}: ${obj.src}`);
          for (const v of Object.values(obj)) {
            if (typeof v === "object") scanForMedia(v);
          }
        };
        scanForMedia(slots);
        if (mediaRefs.length > 0) {
          slide.addNotes(`Media references:\n${mediaRefs.join("\n")}`);
        }
      }

      // Add narration as speaker notes
      if (step.narration) {
        slide.addNotes(`Narration:\n${step.narration}`);
      }
    }
  }

  // Save to buffer
  const output = (await pptx.write({ outputType: "nodebuffer" })) as ArrayBuffer;
  return Buffer.from(output);
}

/** Load blueprints from disk for a project */
export function loadBlueprintsFromDisk(projectId: string): ChapterBlueprintType[] {
  const presDir = path.join(projectDir(projectId), "presentation");
  const blueprintsDir = path.join(projectDir(projectId), ".blueprints");
  if (!fs.existsSync(blueprintsDir)) return [];

  const blueprints: ChapterBlueprintType[] = [];
  for (const file of fs.readdirSync(blueprintsDir)) {
    if (!file.endsWith(".json")) continue;
    try {
      blueprints.push(JSON.parse(fs.readFileSync(path.join(blueprintsDir, file), "utf-8")));
    } catch { /* skip malformed */ }
  }

  // Sort by orderHint if available
  blueprints.sort((a, b) => (a.orderHint ?? 0) - (b.orderHint ?? 0));
  return blueprints;
}
