---
version: 1
name: Forest Ink
description: The green IS the ink — forest green text on warm ivory paper. Vintage National Geographic editorial calm, grounded and patient.
colors:
  shell: "#ece7da"
  surface: "#f5f1e8"
  surface-2: "#e8e2d0"
  text: "#1a2e1f"
  text-2: "#2a4a2f"
  text-mute: "#6a7a6a"
  text-faint: "#9aaa9a"
  accent: "#4d7a4d"
  accent-soft: "rgba(77,122,77,0.10)"
  accent-glow: "rgba(77,122,77,0.18)"
  rule: "#1a2e1f"
typography:
  display-cn: { fontFamily: "Noto Serif SC", fontWeight: 700 }
  display-en: { fontFamily: "Playfair Display", fontWeight: 700 }
  body: { fontFamily: "Source Serif 4", fontWeight: 400 }
  mono: { fontFamily: "IBM Plex Mono", fontWeight: 500 }
components:
  rule: { width: "100%", height: "1px", style: "solid", background: "rule", description: "Forest green rule — the same color as the text, not a separate accent. Like a ruled notebook line in green ink." }
  card: { borderRadius: "var(--r-card)", background: "surface", boxShadow: "0 2px 16px rgba(26,46,31,0.08)", description: "Warm ivory card with a subtle green-tinted shadow — soil, not shadow. Distinguished from shell by luminance and the faintest warmth." }
  hero-num: { font: "display-en", color: "accent", weight: 700, description: "Playfair Display in forest green at 700 weight. Tabular figures, 80-120px. The number carries the green accent tone distinct from the deeper body text green." }
  stage-decoration: "Warm ivory paper texture — subtle grain at 5% opacity, multiply blend. Optional: soft deckled edge effect at stage boundaries (gradient fade to shell at 20px from edges)."
---

## Design Philosophy
Forest Ink inverts the typical color hierarchy: the green IS the primary text color, not the accent. Body copy, headlines, and rules are all rendered in forest green (#1a2e1f) on warm ivory paper (#ece7da). A brighter botanical green (#4d7a4d) serves as the true accent — touching hero numbers, section markers, and focal elements — but it's a refinement of the text color, not a foreign chromatic intrusion. The effect is of old National Geographic pages: grounded, literary, documentary, warm. This theme is for nature/sustainability content, outdoor brands, documentary/nonfiction, cultural observation, and slow-living topics. It is NOT for tech/cyberpunk, fast fashion, financial trading, or neon nightlife. The emotional register is patient, grounded, and quietly authoritative — like a naturalist's field journal.

## Colors
The palette is built on a single chromatic axis: green. Shell (#ece7da) is warm ivory — the paper. Surface (#f5f1e8) is lighter ivory for cards and elevated planes. Text (#1a2e1f) IS forest green — deep, earthy, the color of pine needles in shade. This is the ink color for ALL primary text: headlines, body, rules, navigation. Text-2 (#2a4a2f) is lighter forest green for secondary copy. Text-mute (#6a7a6a) introduces a gray-green for labels and captions. The accent (#4d7a4d) is a brighter botanical green — a refinement of the text green, not a different color family. It touches hero numbers, section markers, and focal highlights. Accent-soft and accent-glow are deliberately low-opacity (10%, 18%) — the accent should feel like a subtle botanical bloom, not an alert. There are no cool blues, no warm reds, no purples — the green axis is the complete chromatic vocabulary.

## Typography
Playfair Display at 700 weight carries the voice — a refined transitional serif with high stroke contrast, evoking the masthead of a vintage nature magazine. Source Serif 4 at 400 weight handles body copy with literary warmth — its lower stroke contrast makes it more readable at body sizes while maintaining serif continuity with Playfair. IBM Plex Mono at 500 serves technical and numerical content. The typographic system is intentionally serif-dominant — this is a reading theme, and serifs carry the natural, grounded character. CJK uses Noto Serif SC at 700 for display, matching Playfair's editorial presence. Maximum two typefaces per slide. Never use sans-serif for extended reading — the serif texture is fundamental to the natural, literary character.

## Layout & Components
The stage is warm ivory paper with subtle grain (5% opacity, multiply blend) — barely perceptible, providing physical tactility. Cards are lighter ivory (surface) with subtle green-tinted shadows (soil, not shadow). The shadow color uses text at 8% opacity — tying it to the ink color family. Rules are 1px forest green (#1a2e1f) — the same color as the text, like a ruled notebook line. Hero numbers are Playfair Display at 700 weight in the botanical green accent (#4d7a4d), tabular figures, 80-120px. Stage decoration is minimal — paper grain only, no grids, no borders, no gradients. Density is medium — room for editorial layouts but never crowded. The rhythm is patient and unhurried, matching the natural-world subject matter.

## Do's
1. Use forest green (#1a2e1f) as the primary text color for all body copy, headlines, and rules.
2. Use the brighter botanical green (#4d7a4d) ONLY for hero numbers, section markers, and focal highlights.
3. Maintain the warm ivory paper background — it is the physical context that makes green text feel natural.
4. Apply subtle paper grain (5% opacity, multiply blend) to the stage — it provides tactility without distraction.
5. Favor serif typefaces (Playfair Display, Source Serif 4) for all reading text — serifs carry the natural character.
6. Use green-tinted shadows (text color at 8% opacity) rather than neutral black shadows — they feel organic.
7. Render CJK in Noto Serif SC to maintain continuity with the serif-dominant typographic system.

## Don'ts
1. Never use pure black for text — the green ink (#1a2e1f) IS the darkest permissible text color.
2. Never introduce non-green accent colors — no red, blue, purple, or orange anywhere in the palette.
3. Never use sans-serif for extended reading — serif typography is fundamental to the literary-nature character.
4. Never use stark white (#ffffff) — the warm ivory (#ece7da) is the lightest color in the palette.
5. Never use bright or saturated greens for body text — the deep forest green (#1a2e1f) is the intended text color.
6. Never add heavy textures, noise, or dramatic effects — subtlety is the theme's strength.
7. Never use the botanical green accent (#4d7a4d) for body copy — it is for focal elements only.

## CJK Notes
Noto Serif SC at 700 weight for display and 400 weight for body matches the serif-dominant, literary character across scripts. CJK line-height minimum 1.75 for body text. The green-ink effect (text = #1a2e1f) applies identically to CJK text — all primary CJK copy is rendered in forest green, creating the same vintage documentary feel across scripts.
