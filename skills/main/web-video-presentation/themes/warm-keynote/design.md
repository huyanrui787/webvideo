---
version: 1
name: Warm Keynote
description: Modern SaaS keynote warmth — cream paper, teal accent, glass-morphism cards with backdrop blur. Spring-like, polished, approachable.
colors:
  shell: "#FDFBF7"
  surface: "#FFFFFF"
  surface-2: "#F5F0EB"
  text: "#43302B"
  text-2: "#5a4038"
  text-mute: "#8a7068"
  text-faint: "#baa8a0"
  accent: "#14B8A6"
  accent-soft: "rgba(20,184,166,0.10)"
  accent-glow: "rgba(20,184,166,0.18)"
  rule: "#E8E0D8"
typography:
  display-cn: { fontFamily: "Noto Sans SC", fontWeight: 700 }
  display-en: { fontFamily: "Inter", fontWeight: 700 }
  body: { fontFamily: "Inter", fontWeight: 400 }
  mono: { fontFamily: "JetBrains Mono", fontWeight: 500 }
components:
  rule: { width: "100%", height: "1px", style: "solid", background: "rule", description: "Warm beige rule — gentle and structural. Understated, like a guide line on warm paper." }
  card: { borderRadius: "var(--r-card-lg)", background: "rgba(255,255,255,0.7)", boxShadow: "0 8px 32px rgba(67,48,43,0.08)", description: "Glass slab card with backdrop-blur. Large rounded corners (32px), semi-transparent surface, soft warm shadow. The signature glass-morphism treatment." }
  hero-num: { font: "display-en", color: "text", weight: 900, description: "Inter at 900 weight (font-black) in warm brown text color. Tabular figures, 96-144px. Grounded authority — the number leads through weight, not color." }
  stage-decoration: "Warm 40px grid drawn in text color at 3% opacity across the entire stage. Optional: soft warm gradient accent at bottom-right (radial, teal at 5% opacity) for depth."
---

## Design Philosophy
Warm Keynote is built for the modern SaaS keynote — polished enough for a product launch, warm enough to feel human. The stage is warm cream (#FDFBF7) with a 40px warm grid drawn at barely-perceptible opacity. Cards use glass-morphism: semi-transparent white surface (rgba 70% opacity) with backdrop-blur and large 32px rounded corners — they float above the grid like polished glass slabs. Teal (#14B8A6) is the sole chromatic accent, touching section markers, navigation indicators, and the occasional focal element. Inter at 900 weight (font-black) carries hero numbers in the warm brown text color — the number leads through typographic weight, not through color contrast. This theme is for SaaS product keynotes, B2B product launches, tool/product explainers, and team presentations. It is NOT for dark/cyber aesthetics, gaming/entertainment, craft/vintage, or literary/poetry content.

## Colors
The palette is warm cream, brown ink, and a single teal accent. Shell (#FDFBF7) is warm cream — the stage floor, slightly warmer than pure white, evoking premium paper. Surface (#FFFFFF) is white — used at 70% opacity for glass cards, behind backdrop-blur. Surface-2 (#F5F0EB) is a slightly warmer off-white for non-glass card variants. Text (#43302B) is warm brown — not black, carrying the same warm undertone as the shell. This is the ink color for all primary text AND hero numbers. Text-2 (#5a4038) is lighter brown for secondary copy. Text-mute (#8a7068) and text-faint (#baa8a0) descend through warm beige-browns. The accent (#14B8A6) is teal — the only cool color in the palette, providing precise contrast against the warm cream/brown foundation. It touches section markers, navigation indicators, and focal highlights at deliberately low opacity (10%, 18%). The rule (#E8E0D8) is warm beige — structural but gentle.

## Typography
Inter at 700 weight carries the English voice — a clean geometric sans-serif with polished proportions and confident presence. Inter at 900 weight (font-black) is reserved exclusively for hero numbers — the thickest weight in the Inter family, used at 96-144px in the warm brown text color. Inter at 400 weight handles body copy — the single-typeface system creates a cohesive, polished hierarchy through weight contrast alone. JetBrains Mono at 500 serves code and technical content. CJK uses Noto Sans SC at 700 for display, matching Inter's geometric cleanliness. The 400-700-900 weight progression within Inter is the complete hierarchy tool — size alone is insufficient; the weight steps create unambiguous visual organization.

## Layout & Components
The stage is warm cream with a 40px grid drawn in the text color at 3% opacity — a subtle organizational skeleton that provides structure without decoration. Cards are glass slabs: 70% opacity white background, backdrop-blur, 32px border-radius, and soft warm shadows (8px/32px blur at 8% text-color opacity). The glass-morphism treatment is the defining component signature — cards should feel like polished glass resting on warm paper. Rules are 1px warm beige lines — structural and understated. Hero numbers are Inter at 900 weight in warm brown (#43302B), tabular figures, 96-144px — authoritative through weight, not color contrast. An optional soft radial gradient (teal at 5% opacity, bottom-right) can add subtle depth. Density is medium — room for product screenshots, feature grids, and keynote layouts. Animations should feel springy and polished.

## Do's
1. Use glass-morphism cards (70% white + backdrop-blur + 32px radius) as the default card treatment.
2. Use Inter at 900 weight (font-black) for hero numbers in the warm brown text color.
3. Apply the 40px warm grid at 3% opacity on most slides — it is the organizational signature.
4. Use teal (#14B8A6) ONLY for section markers, navigation indicators, and focal highlights.
5. Maintain the warm cream/brown/teal palette — the warmth is the theme's emotional register.
6. Keep card border-radius at 32px — the large rounding is fundamental to the glass-slab character.
7. Use springy, polished animation curves — the motion should match the glass-morphism refinement.

## Don'ts
1. Never use the teal accent for hero numbers — hero numbers use warm brown at 900 weight, not color.
2. Never use dark or black backgrounds — the stage is warm cream, always.
3. Never use sharp corners (0 border-radius) — minimum 8px rounding everywhere, 32px on cards.
4. Never fill a card with the teal accent — it is for type and navigation, not surfaces.
5. Never use cold grays or pure black — every neutral carries the warm cream/brown undertone.
6. Never omit the backdrop-blur on glass cards — it is the defining glass-morphism characteristic.
7. Never use serif typefaces — the sans-serif unity is essential to the SaaS keynote character.

## CJK Notes
Noto Sans SC at 700 weight for display and 400 weight for body matches Inter's clean geometric character. CJK line-height minimum 1.75. The glass-morphism card treatment and warm grid work identically across scripts. CJK hero numbers at 900 weight require Noto Sans SC at 900 — test for legibility and step down to 700 if the 900 weight appears too dense.
