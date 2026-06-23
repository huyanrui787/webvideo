---
version: 1
name: Dark Botanical
description: Magazine-cover sophistication — near-black with warm botanical accents. Cormorant italic carries the voice; soft blurred light pools add depth without illustration.
colors:
  shell: "#0a0a0a"
  surface: "#141312"
  surface-2: "#1c1a18"
  text: "#e8e4df"
  text-2: "#b8b0a8"
  text-mute: "#6a6258"
  text-faint: "#3a3228"
  accent: "#d4a574"
  accent-soft: "rgba(212,165,116,0.10)"
  accent-glow: "rgba(212,165,116,0.18)"
  rule: "#2a2824"
typography:
  display-cn: { fontFamily: "Noto Serif SC", fontWeight: 700 }
  display-en: { fontFamily: "Cormorant", fontWeight: 400, fontStyle: "italic" }
  body: { fontFamily: "IBM Plex Sans", fontWeight: 400 }
  mono: { fontFamily: "IBM Plex Mono", fontWeight: 500 }
components:
  rule: { width: "100%", height: "1px", style: "solid", background: "rule", description: "Ultra-thin warm dark rule — barely visible, structurally present. Separates without announcing itself." }
  card: { borderRadius: "var(--r-card)", background: "surface-2", boxShadow: "0 4px 32px rgba(0,0,0,0.6)", description: "Dark elevated card with deep, soft shadow. May receive a subtle warm light pool behind it (radial gradient, accent at 5% opacity) to create dimensional depth." }
  hero-num: { font: "display-en", color: "accent", weight: 400, description: "Cormorant italic in warm bronze. Elegant, refined, never loud. The number whispers luxury — 80-120px, tabular figures, with a feather-soft text-shadow." }
  stage-decoration: "Soft blurred light pool — a large radial gradient (center at roughly 40% from top, 50% horizontal) using accent at 3-5% opacity with a wide blur radius. Creates dimensional depth without illustration."
---

## Design Philosophy
Dark Botanical is the visual language of a high-end magazine cover — sophisticated, warm, and deeply considered. Near-black (#0a0a0a) forms the stage, lifted just above pure black to feel like a velvet curtain rather than a void. The warm botanical accent (#d4a574) — a bronze that sits between clay and gold — provides the only chromatic warmth. Blurred light pools float behind cards, creating dimensional depth without any illustrative elements. Cormorant italic carries the editorial voice with its refined, literary character. This theme is for brand stories, fashion/beauty, lifestyle content, cultural commentary, and premium product launches. It is NOT for technical content, fast-paced news, or anything requiring high information density.

## Colors
The palette is a study in near-black restraint with a single warm bloom. Shell (#0a0a0a) is the velvet-dark stage — warmer than #000, cooler than espresso. Surface (#141312) and surface-2 (#1c1a18) create subtle elevation through extremely fine luminance steps — cards don't contrast through color, they announce through shadow and the light pool behind them. The warm bronze accent (#d4a574) touches hero numbers, section markers, light pools, and exactly one focal element per slide. It never fills a card, never touches body text, never appears in rules. Text color (#e8e4df) is a warm off-white — never pure white — carrying the same amber undertone as the accent, creating a cohesive warm-dark atmosphere. The text hierarchy descends through warm grays (#b8b0a8, #6a6258, #3a3228) that all share the bronze undertone.

## Typography
Cormorant italic is the voice — an editorial serif with distinctive character, refined proportions, and the presence of a magazine masthead. It handles headlines, hero numbers, and pull quotes at 400 weight in italic — the italic is structural, not decorative; it IS the typeface. IBM Plex Sans at 400 handles body copy with clean neutrality — its job is to be legible and invisible, letting Cormorant carry all the personality. IBM Plex Mono at 500 serves technical content and numerical data. CJK uses Noto Serif SC at 700, matching Cormorant's serif editorial character. The type scale favors large display sizes with generous line-height — this theme breathes. Maximum two typefaces per slide; never use Cormorant for body copy or extended reading.

## Layout & Components
The stage is near-black velvet with a single soft light pool — a large radial gradient in the accent color at 3-5% opacity, centered slightly above the visual center, creating a sense of light falling on a dark surface. This light pool is the primary stage decoration and should appear on most slides (exceptions: full-bleed images, title cards). Cards are dark, elevated, with deep soft shadows (4px/32px blur) — they float above the dark stage. The rule is a 1px warm dark line (#2a2824) — structural but barely visible, like a stitch in dark fabric. Hero numbers are Cormorant italic in warm bronze at 80-120px, tabular figures, with a feather-soft text-shadow — they whisper luxury, never shout. Density is low — generous padding (96px+ horizontal), ample breathing room. The rhythm is slow, cinematic, editorial.

## Do's
1. Place a soft radial light pool (accent at 3-5% opacity, wide blur) behind the primary card on most slides.
2. Use Cormorant italic for all display text — the italic is the typeface identity, not an emphasis variant.
3. Keep density low — one major idea per slide, generous padding, slow rhythm.
4. Use the warm off-white (#e8e4df) for all primary text — never pure white, never cool white.
5. Apply deep, soft card shadows (4px/32px blur minimum) to create elevation in the near-black space.
6. Maintain consistent light pool position across a deck — the pool is part of the stage, not per-slide decoration.
7. Render CJK with Noto Serif SC at 700 weight to match Cormorant's editorial serif character.

## Don'ts
1. Never use pure black (#000000) — shell (#0a0a0a) is the darkest permitted value.
2. Never use more than one accent-colored element per slide — the bronze is precious, not plentiful.
3. Never fill a card with the accent color — bronze is for type and light, never for surfaces.
4. Never use cool grays, cool blues, or any color outside the warm-dark palette.
5. Never use Cormorant for body copy — it is a display typeface and fatigues at reading sizes.
6. Never exceed 3 cards on a single slide — low density is non-negotiable.
7. Never use sharp-drop shadows or hard edges — all shadows and transitions must feel soft and atmospheric.

## CJK Notes
Noto Serif SC at 700 weight matches Cormorant italic's editorial serif presence for CJK display. CJK body copy uses Noto Serif SC at 400 weight with 1.75 line-height. CJK has no italic variant — use weight shift (400 to 700) for emphasis, consistent with the warm, refined editorial tone.
