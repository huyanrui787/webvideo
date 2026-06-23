---
version: 1
name: Kraft Paper
description: Old notebook aesthetic — brown ink on kraft paper, warm and tactile. Fraunces serif + copper accent. Hand-crafted character.
colors:
  shell: "#dccab0"
  surface: "#eedfc7"
  surface-2: "#e4d4b8"
  text: "#2a1e13"
  text-2: "#3a2a18"
  text-mute: "#7a6658"
  text-faint: "#a89888"
  accent: "#a35b2a"
  accent-soft: "rgba(163,91,42,0.10)"
  accent-glow: "rgba(163,91,42,0.18)"
  rule: "#2a1e13"
typography:
  display-cn: { fontFamily: "Noto Serif SC", fontWeight: 700 }
  display-en: { fontFamily: "Fraunces", fontWeight: 700 }
  body: { fontFamily: "Source Serif 4", fontWeight: 400 }
  mono: { fontFamily: "IBM Plex Mono", fontWeight: 500 }
components:
  rule: { width: "100%", height: "1px", style: "solid", background: "rule", description: "Brown rule — same color as the text. Like a hand-ruled line in a traveler's notebook. Warm and understated." }
  card: { borderRadius: "var(--r-card)", background: "surface-2", boxShadow: "0 2px 12px rgba(42,30,19,0.12)", description: "Warm kraft card with a brown-tinted paper shadow. Like a piece of cardstock resting on kraft paper — soft, tactile, grounded." }
  hero-num: { font: "display-en", color: "accent", weight: 700, description: "Fraunces at 700 in copper brown. Tabular figures, 80-100px. The number carries warmth without heat." }
  stage-decoration: "Coarse kraft paper texture at 6% opacity, multiply blend. Optional: deckled edge effect or subtle paper fiber texture for physical tactility."
---

## Design Philosophy
Kraft Paper is the old notebook aesthetic — brown ink on warm kraft paper, the visual language of field journals, travelers' notebooks, and hand-bound books. The text IS brown (#2a1e13), not black — like walnut ink on unbleached paper. Copper (#a35b2a) serves as the accent for hero numbers and editorial emphasis, but it's a refinement of the brown ink, not a foreign color. Fraunces carries the voice — a warm, humanist serif with distinctive character that feels hand-set rather than typeset. The stage has a coarse paper texture that provides physical tactility. This theme is for book reviews/literary content, history/nostalgia, independent magazines/zines, handcraft/food topics, and slow-living humanities content. It is NOT for tech/futurism, corporate compliance, quantitative finance, or modernist design.

## Colors
The palette is warm browns on kraft — a monochromatic axis with a single copper bloom. Shell (#dccab0) is kraft paper — warm, unbleached, slightly textured. Surface (#eedfc7) is lighter kraft for cards and elevated planes. Surface-2 (#e4d4b8) provides a mid-tone for nested elements. Text (#2a1e13) IS dark brown — the ink color, warmer and softer than black. This is the defining color: brown replaces black as the default ink, creating the notebook feel. Text-2 (#3a2a18) is lighter brown for secondary copy. Text-mute (#7a6658) and text-faint (#a89888) descend through warm gray-browns. The accent (#a35b2a) is copper — a brighter, redder brown that serves as editorial emphasis. It touches hero numbers, section markers, and focal highlights at deliberately low opacity (10%, 18%). There are no cool colors anywhere — the palette is warm from shell to accent.

## Typography
Fraunces at 700 weight carries the voice — a warm, humanist serif with distinctive character, soft terminals, and a hand-set quality that feels personal rather than industrial. Source Serif 4 at 400 weight handles body copy — its lower stroke contrast makes it more readable at body sizes while maintaining serif continuity with Fraunces. The typographic system is intentionally serif-dominant — this is a reading theme, and serifs carry the literary, hand-crafted character. IBM Plex Mono at 500 serves technical content. CJK uses Noto Serif SC at 700 for display, matching Fraunces's literary warmth. Maximum two typefaces per slide. Never use geometric sans-serif — it contradicts the hand-crafted aesthetic.

## Layout & Components
The stage is kraft paper with a coarse paper texture (6% opacity, multiply blend) — visible enough to feel, subtle enough to never distract. Cards are lighter kraft (surface-2) with brown-tinted shadows — like cardstock resting on kraft paper. The shadow color uses text at 12% opacity. Rules are 1px brown (#2a1e13) — the same color as the ink, like a hand-ruled notebook line. Hero numbers are Fraunces at 700 weight in copper (#a35b2a), tabular figures, 80-100px — editorial emphasis that feels warm, not urgent. Density is medium — room for literary layouts but never crowded. The overall feel is tactile, personal, hand-crafted.

## Do's
1. Use brown (#2a1e13) as the primary text color for ALL body copy — brown IS the ink, never black.
2. Use copper (#a35b2a) ONLY for hero numbers, section markers, and focal editorial emphasis.
3. Apply the kraft paper texture (6% opacity, multiply blend) consistently across all slides.
4. Favor serif typefaces (Fraunces, Source Serif 4) for all reading text — serifs carry the hand-crafted warmth.
5. Use brown-tinted shadows (text at 12% opacity) instead of neutral black shadows.
6. Maintain a warm, unhurried pace — this theme rewards patience.
7. Render CJK in Noto Serif SC to maintain serif continuity with the literary character.

## Don'ts
1. Never use pure black (#000000) for text — brown (#2a1e13) is the darkest permissible ink.
2. Never use cool colors — no blues, greens, or cool grays anywhere in the palette.
3. Never use geometric sans-serif for display or body — it contradicts the hand-crafted aesthetic.
4. Never use pure white (#ffffff) — the lightest color is the kraft surface (#eedfc7).
5. Never use heavy shadows or sharp drop-shadows — all shadows must feel paper-soft.
6. Never over-saturate the copper accent — it is an editorial refinement, not a signal flare.
7. Never remove the paper texture — the tactility is essential to the notebook illusion.

## CJK Notes
Noto Serif SC at 700 weight for display and 400 weight for body carries the serif literary warmth across scripts. The brown-ink effect (text = #2a1e13) applies identically to CJK — all primary CJK copy is rendered in brown, creating the same notebook feel. CJK line-height minimum 1.75. CJK has no italic; use copper accent for emphasis.
