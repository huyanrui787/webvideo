---
version: 1
name: Dune
description: Architecture portfolio restraint — near-accent-less, muted clay on sand, maximal breathing room. The quietest theme in the collection.
colors:
  shell: "#dcc8a5"
  surface: "#f0e6d2"
  surface-2: "#e8dcbf"
  text: "#1f1a14"
  text-2: "#3a2a18"
  text-mute: "#7a6a58"
  text-faint: "#a09888"
  accent: "#8c6a48"
  accent-soft: "rgba(140,106,72,0.08)"
  accent-glow: "rgba(140,106,72,0.12)"
  rule: "#d4c098"
typography:
  display-cn: { fontFamily: "Noto Serif SC", fontWeight: 400 }
  display-en: { fontFamily: "Inter", fontWeight: 300 }
  body: { fontFamily: "Source Serif 4", fontWeight: 400 }
  mono: { fontFamily: "JetBrains Mono", fontWeight: 400 }
components:
  rule: { width: "100%", height: "1px", style: "solid", background: "rule", description: "Barely-there sand rule — more texture than structure. It separates without asserting, like a fold in paper." }
  card: { borderRadius: "var(--r-card)", background: "surface", boxShadow: "none", description: "Card with no shadow, no border — distinguished from the stage only by its slightly lighter surface. Elevation through luminance alone, no depth cues." }
  hero-num: { font: "display-en", color: "accent", weight: 300, description: "Inter at 300 weight in muted clay. Tabular figures, 80-100px, understated to the point of near-invisibility. The number is present but does not demand attention." }
  stage-decoration: "No decoration whatsoever — no gradients, no textures, no grids, no borders. The stage is pure sand (#dcc8a5). Breathing room is the only ornament."
---

## Design Philosophy
Dune is the quietest theme in the collection — an exercise in architectural restraint. It was built for content that speaks through substance, not presentation: architecture portfolios, gallery exhibitions, designer case studies, premium brand films. The visual language is near-accent-less: muted clay (#8c6a48) is the only chromatic presence, and it is used so sparingly it barely registers. The stage is warm sand (#dcc8a5) — no gradients, no textures, no grids, no borders. Cards are distinguished from the stage by luminance alone — no shadows, no outlines. Maximal breathing room (140px horizontal, 100px vertical padding) is the active ingredient. The rhythm is the slowest in the collection (1.75s transitions). Everything here is about what is removed, not what is added. If you cannot justify an element's presence through necessity, remove it — that is the Dune design principle.

## Colors
The palette is a study in monochromatic warmth with a single muted anchor. Shell (#dcc8a5) is warm sand — the stage floor, and also the primary design statement. Surface (#f0e6d2) is lighter sand — cards live here, separated from the stage by the subtlest possible luminance shift. Surface-2 (#e8dcbf) offers a tertiary plane when nested cards are necessary. Text (#1f1a14) is warm near-black — never pure black, carrying the same clay undertone as the accent. The accent (#8c6a48) is muted clay — used at ultra-low opacity for accent-soft (8%) and accent-glow (12%). It touches hero numbers (at 300 weight, barely visible) and occasionally a section marker. It never fills a surface, never appears in rules, and never competes for attention. Text hierarchy descends through warm earth tones. The accent's job is to exist, not to perform.

## Typography
Inter at 300 weight (extra-light) carries display text — its geometric neutrality and thin stroke create an architectural, considered presence that never raises its voice. Source Serif 4 at 400 weight handles body copy with literary warmth — the serif provides texture in an otherwise texture-free environment. JetBrains Mono at 400 serves technical content. The type scale favors restraint: display text rarely exceeds 64px, body text sits at 18-20px with 1.6 line-height. CJK uses Noto Serif SC at 400 weight for display — matching the quiet, refined character. Maximum two typefaces per slide. No bold weights are used — the theme achieves hierarchy through size, position, and whitespace alone. The absence of typographic weight contrast is intentional: it forces the designer to use spatial relationships for hierarchy instead.

## Layout & Components
The stage is pure sand — #dcc8a5, uninterrupted by any decoration. No gradients, no textures, no grids, no borders, no stage frame. Cards are distinguished from the stage by luminance only: surface (#f0e6d2) on shell (#dcc8a5), with zero shadow and zero border. Elevation is communicated through color alone. Padding is the most generous in the collection: 140px horizontal, 100px vertical stage padding. Cards receive 64px horizontal, 56px vertical internal padding. Gaps between elements are at minimum 48px. The rule is a 1px sand line (#d4c098) — barely perceptible, functioning more as texture than structure. Hero numbers are Inter at 300 weight in muted clay, tabular figures, 80-100px — present but undemanding. Density is the lowest in the collection. Transitions are the slowest (1.75s). Everything breathes.

## Do's
1. Maintain maximum breathing room — 140px horizontal / 100px vertical stage padding, 48px+ gaps between elements.
2. Use luminance alone (surface vs shell) to distinguish cards — never add shadows, borders, or outlines.
3. Keep the accent ultra-subdued — 8-12% opacity maximum for any accent-derived color.
4. Use Source Serif 4 for all extended reading — its literary serif provides texture in the texture-free space.
5. Allow slides with no accent color whatsoever — many Dune slides look entirely monochromatic.
6. Use the slowest transition timing (1.75s) available — Dune's rhythm is contemplative, not brisk.
7. Render CJK with Noto Serif SC at 300-400 weight to match Inter's extra-light architectural presence.

## Don'ts
1. Never add any stage decoration — no gradients, textures, grids, borders, or frames on the stage.
2. Never use bold or black font weights — hierarchy comes from size, position, and space, never from weight.
3. Never fill a card or element with the accent color — muted clay is for type only, at 300 weight.
4. Never use shadows on cards — elevation is communicated through luminance shift alone.
5. Never crowd elements — if content feels tight, split it across more slides rather than reducing padding.
6. Never use pure white or pure black — every color carries the warm sand/clay undertone.
7. Never exceed 2 elements (headline + body, or card + label) on a single slide in the default layout.

## CJK Notes
Noto Serif SC at 300-400 weight handles CJK display and body with the quiet, refined character that defines Dune. CJK line-height minimum 1.85 (higher than the standard 1.75) to match the theme's generous breathing room. CJK thin weights (300) are legible at display sizes (48px+) but must be tested — below 36px, step up to 400 weight for readability.
