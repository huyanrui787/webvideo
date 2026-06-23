---
version: 1
name: Chalk Garden
description: Friendly chalkboard classroom — Patrick Hand everywhere, chalk-yellow on warm black. Intentionally informal and encouraging.
colors:
  shell: "#1a1a1a"
  surface: "#1e1e24"
  surface-2: "#262630"
  text: "#f4f4f5"
  text-2: "#c8c8d0"
  text-mute: "#787880"
  text-faint: "#484850"
  accent: "#fde047"
  accent-soft: "rgba(253,224,71,0.12)"
  accent-glow: "rgba(253,224,71,0.25)"
  rule: "#fde047"
typography:
  display-cn: { fontFamily: "Noto Sans SC", fontWeight: 700 }
  display-en: { fontFamily: "Patrick Hand", fontWeight: 400 }
  body: { fontFamily: "Patrick Hand", fontWeight: 400 }
  mono: { fontFamily: "Patrick Hand", fontWeight: 400 }
components:
  rule: { width: "100%", height: "2px", style: "dashed", background: "accent", description: "Dashed chalk-yellow line — like a teacher underlining a key point. Rough, hand-drawn character. Dash pattern: 6px/6px for a quick, informal rhythm." }
  card: { borderRadius: "8px", background: "surface-2", boxShadow: "0 2px 8px rgba(0,0,0,0.6)", description: "Soft dark card with slight rounding — enough to feel friendly, not enough to feel designed. Like a chalkboard eraser resting on the board." }
  hero-num: { font: "display-en", color: "accent", weight: 400, description: "Patrick Hand in chalk yellow. Large (100px+) but deliberately informal — the number looks like it was written by hand, not typeset." }
  stage-decoration: "Subtle film grain overlay at 8% opacity + soft vignette (radial gradient from transparent center to shell at edges, 25% strength). Simulates the texture of a real chalkboard surface."
---

## Design Philosophy
Chalk Garden is the friendly classroom — the teacher who stays after class to explain it one more time. Everything is rendered in Patrick Hand, a warm handwritten font that deliberately refuses typographic perfection. The dark chalkboard backdrop with its subtle film grain and vignette creates a cozy, focused learning environment. Chalk yellow (#fde047) serves as the accent — dashes, highlights, and hero numbers — exactly the color of fresh chalk on a well-used board. This theme is for educational content, explainers, tutorials, and any video where the relationship between presenter and audience should feel like a conversation, not a lecture. It is intentionally informal, warm, and encouraging. It is NOT for formal business, luxury brands, or anything requiring polish.

## Colors
The palette is three colors: warm near-black (#1a1a1a) as the chalkboard, off-white (#f4f4f5) as the chalk text, and chalk yellow (#fde047) as the accent. Surface and surface-2 are subtle lifts from black — just enough to feel like a separate plane on the board. The yellow accent carries the teaching energy: underlines, circles, arrows, section markers. Text is slightly warm off-white (never pure white) to feel like chalk rather than LED. Text-mute and text-faint simulate chalk that's been partially erased — readable but clearly secondary. There are no other colors. The constraint is the charm.

## Typography
Patrick Hand is the ONLY typeface in this theme — display, body, labels, numbers, everything. This is intentional: the handwriting carries the entire personality. At display sizes, it feels like a teacher's board writing — big, clear, friendly. At body sizes, it feels like notebook notes — personal, approachable. There is no monospace, no serif, no sans-serif. The single-typeface constraint is what makes the theme work: if you introduce a professional font, the handwriting instantly feels like a gimmick instead of a deliberate choice. For CJK, this theme is NOT compatible — Chinese handwriting fonts have fundamentally different character and Chinese text in Patrick Hand would be illegible. CJK content should use a different theme.

## Layout & Components
The stage is a chalkboard — dark, slightly textured, with soft vignetted edges that pull focus to center. Dashed chalk-yellow rules (2px, 6px/6px dash) underline key points and separate sections with quick, hand-drawn rhythm. Cards are soft dark rectangles with slight rounding (8px) — like a section of the board wiped clean and framed. Hero numbers are Patrick Hand at 100px+ in chalk yellow — big, handwritten, and deliberately informal. Film grain (8% opacity) and vignette (25% radial gradient from center) provide the physical texture of a real chalkboard. Density is medium — enough room for diagrams and bullet points, but never crowded. Animations should feel springy and organic, never mechanical.

## Do's
1. Use Patrick Hand for every character of text on every slide — no exceptions, no mixing with other fonts.
2. Keep the film grain overlay at exactly 8% opacity — enough to feel, not enough to distract.
3. Use dashed chalk-yellow rules with the 6px/6px pattern for all underlines and section dividers.
4. Render hero numbers at 100px+ in chalk yellow — handwritten, informal, confident.
5. Favor bullet points and short phrases over long paragraphs — this is a chalkboard, not a textbook.
6. Apply the vignette consistently across all slides — it is part of the chalkboard illusion.
7. Use warm, encouraging language in the content — the visual tone and verbal tone must match.

## Don'ts
1. Never use any other typeface alongside Patrick Hand — mixing fonts breaks the chalkboard illusion completely.
2. Never use pure white (#ffffff) — always the warm off-white (#f4f4f5) that reads as chalk.
3. Never use a solid rule — all rules are dashed, evoking chalk underlining on a board.
4. Never use sharp corners (0 border-radius) — minimum 4px rounding everywhere to maintain friendliness.
5. Never use CJK content with this theme — Patrick Hand has no CJK equivalent and substitution would destroy the aesthetic.
6. Never remove the film grain and vignette — they are the physical texture that makes the chalkboard read as real.
7. Never use the accent color for large filled surfaces — chalk yellow is for lines and text, not backgrounds.

## CJK Notes
This theme is NOT CJK compatible. Patrick Hand has no CJK character set, and any CJK handwriting font substitute would carry fundamentally different visual character — Chinese handwriting fonts are calligraphic, not casual-English-notebook. CJK content should use chalk-garden's structural patterns with a different theme, or the content should be entirely Latin-script.
