---
version: 1
name: Sunset Zine
description: Independent risograph zine — warm peach paper, magenta accent, chunky Fraunces serif. Slightly scrappy, full of personality.
colors:
  shell: "#f7d8b5"
  surface: "#fbe8d3"
  surface-2: "#f2dcbf"
  text: "#2a1c12"
  text-2: "#4a2c18"
  text-mute: "#8a6258"
  text-faint: "#ba9888"
  accent: "#e6386b"
  accent-soft: "rgba(230,56,107,0.10)"
  accent-glow: "rgba(230,56,107,0.20)"
  rule: "#e6386b"
typography:
  display-cn: { fontFamily: "Noto Serif SC", fontWeight: 700 }
  display-en: { fontFamily: "Fraunces", fontWeight: 700 }
  body: { fontFamily: "Work Sans", fontWeight: 400 }
  mono: { fontFamily: "IBM Plex Mono", fontWeight: 500 }
components:
  rule: { width: "100%", height: "2px", style: "dashed", background: "accent", description: "Dashed magenta cut line — like a risograph trim mark. 2px weight, 10px/10px dash pattern. Slightly irregular character." }
  card: { borderRadius: "4px", background: "surface", boxShadow: "3px 3px 0 rgba(230,56,107,0.15)", description: "Warm peach card with an offset magenta-tinted shadow. Slight corner rounding — zine-appropriate, not precious." }
  hero-num: { font: "display-en", color: "accent", weight: 700, description: "Fraunces at 700 in riso magenta. Tabular figures, 80-120px. The number is chunky, confident, and slightly imperfect — like a hand-inked zine cover." }
  stage-decoration: "Coarse risograph paper texture at 7% opacity, multiply blend. Optional: offset misregistration effect on select elements (2px magenta shadow shifted right, 2px cyan shadow shifted left at 5% opacity)."
---

## Design Philosophy
Sunset Zine channels the energy of independent risograph publishing — warm, scrappy, expressive, and full of personality. The stage is warm peach paper (#f7d8b5) with a coarse paper texture that feels printed, not rendered. Magenta (#e6386b) is the riso accent — dashed cut lines, offset shadows, hero numbers — evoking the slightly imperfect registration of a real risograph print. Fraunces at 700 weight carries the voice with its chunky, distinctive serif character — it feels hand-set, not typeset. Work Sans provides clean body copy that lets Fraunces carry all the personality. This theme is for lifestyle vlogs, creative sharing, fun reviews, indie magazines, and social-media-native content. It is NOT for formal business, academic papers, B2B sales, or government communications.

## Colors
The palette is a warm peach and magenta two-chord. Shell (#f7d8b5) is warm peach paper — the zine stock. Surface (#fbe8d3) is lighter peach for cards and elevated planes. Surface-2 (#f2dcbf) provides a mid-tone. Text (#2a1c12) is warm dark brown — the riso ink color, never black. Text-2 (#4a2c18) is lighter brown for secondary copy. Text-mute (#8a6258) and text-faint (#ba9888) descend through warm brown-pinks. The accent (#e6386b) is riso magenta — bright, warm, slightly imperfect. It touches rules (dashed cut lines), hero numbers, section markers, and offset shadows. The rule IS the accent color — there is no separate rule tone; the magenta cut line is both rule and accent. Offset shadow effects use the accent at 15% opacity.

## Typography
Fraunces at 700 weight carries the voice — a chunky, humanist serif with distinctive character, soft terminals, and a hand-set quality that feels perfect for zine culture. Work Sans at 400 weight handles body copy — a clean, friendly sans-serif with open apertures that provides neutral support without competing with Fraunces. The Fraunces/Work Sans pairing creates the essential typographic tension: expressive serif voice + clean sans-serif substance. IBM Plex Mono at 500 serves technical content. CJK uses Noto Serif SC at 700 for display, matching Fraunces's chunky warmth. The typographic system supports the risograph aesthetic — slightly imperfect, full of character.

## Layout & Components
The stage is warm peach paper with a coarse risograph texture (7% opacity, multiply blend) — visible enough to feel printed, subtle enough to never distract. Dashed magenta cut lines (2px, 10px/10px pattern) serve as both rules and decorative elements — like trim marks on a zine page. Cards are warm peach (surface) with offset magenta-tinted shadows (3px right, 3px down, no blur) — evoking misregistration without being messy. Hero numbers are Fraunces at 700 in riso magenta, tabular figures, 80-120px — chunky, confident, slightly imperfect. Optional: a subtle misregistration overlay (2px magenta offset right, 2px cyan offset left, both at 5% opacity) on headlines for authentic riso character. Density is medium — room for expressive layouts. Animations should have spring-overshoot character.

## Do's
1. Apply the risograph paper texture (7% opacity, multiply blend) consistently — it is the physical context.
2. Use dashed magenta rules (2px, 10px/10px) for all dividers — they are the zine's visual signature.
3. Use offset shadows (no blur) instead of soft shadows — the riso aesthetic is sharp and slightly imperfect.
4. Favor Fraunces serif for all display text — its chunky warmth is the zine's typographic voice.
5. Keep the color palette limited to peach, brown, and magenta — riso printing works in limited ink colors.
6. Allow slight visual imperfection — the zine aesthetic embraces the handmade, not the pixel-perfect.
7. Use spring-overshoot animation curves — they match the scrappy, energetic character.

## Don'ts
1. Never use pure black (#000000) — warm brown (#2a1c12) is the darkest ink.
2. Never use soft, blurred shadows — offset shadows (no blur) are the risograph vocabulary.
3. Never use geometric sans-serif for display — Fraunces's chunky serif is the complete display identity.
4. Never introduce cool colors — no blues, greens, or cool grays in the palette.
5. Never use gradient transitions — the riso aesthetic is flat, layered, and graphic.
6. Never over-polish — the zine character lives in the slight imperfections.
7. Never fill a card with magenta — the accent is for lines and type, not surfaces.

## CJK Notes
Noto Serif SC at 700 weight for display and 400 weight for body matches Fraunces's chunky, warm serif character. CJK line-height minimum 1.75. The offset misregistration effect works with CJK but should be tested — CJK characters are denser and the offset may reduce legibility. Consider applying the misregistration only to display-sized CJK text.
