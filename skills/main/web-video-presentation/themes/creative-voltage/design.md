---
version: 1
name: Creative Voltage
description: Retro-punk creative studio energy — saturated blue, neon yellow, halftone dots. Syne + Space Mono for expressive precision.
colors:
  shell: "#001a4d"
  surface: "#0033b8"
  surface-2: "#0044dd"
  text: "#ffffff"
  text-2: "#c8d0ff"
  text-mute: "#7a80cc"
  text-faint: "#4a5099"
  accent: "#d4ff00"
  accent-soft: "rgba(212,255,0,0.15)"
  accent-glow: "rgba(212,255,0,0.35)"
  rule: "#d4ff00"
typography:
  display-cn: { fontFamily: "Noto Sans SC", fontWeight: 700 }
  display-en: { fontFamily: "Syne", fontWeight: 700 }
  body: { fontFamily: "Space Mono", fontWeight: 400 }
  mono: { fontFamily: "Space Mono", fontWeight: 700 }
components:
  rule: { width: "100%", height: "2px", style: "solid", background: "accent", description: "Solid neon yellow rule — electric, confident. Used as an energy bar, not a separator. Always full-width, never partial." }
  card: { borderRadius: "0", background: "surface-2", boxShadow: "0 0 0 2px #d4ff00", description: "Zero-radius card with neon yellow outline. No fill, no shadow — the outline is the statement. Halftone dot overlay at 5% inside the card." }
  hero-num: { font: "display-en", color: "accent", weight: 700, description: "Syne at 700 weight in neon yellow. Tabular figures with a bright text-shadow glow (0 0 20px rgba(212,255,0,0.4)). The number crackles." }
  stage-decoration: "Halftone dot pattern (dots at 3px spacing, 15% opacity in neon yellow) across the entire stage. Optional: offset text shadows in neon yellow creating a misregistration print effect on headlines."
---

## Design Philosophy
Creative Voltage channels the energy of a retro-futuristic design studio — the kind with a risograph in the corner and a neon sign on the wall. Saturated royal blue (#001a4d) is the stage floor, intensifying to electric blue (#0033b8) on surfaces. Neon yellow (#d4ff00) is the single chromatic accent — every rule, outline, hero number, and highlight glows with it. Syne (geometric serif-display hybrid) carries the voice with its distinctive wide proportions and sharp terminals. Space Mono provides the technical precision that keeps the energy grounded — this is expressive, not chaotic. Halftone dots across the stage are the texture fingerprint. The theme is built for creative portfolios, design talks, music/art content, and visual culture topics.

## Colors
The palette is a two-chord electric composition: deep-to-bright blue (shell #001a4d through surface-2 #0044dd) creates a saturated, immersive backdrop, while neon yellow (#d4ff00) provides the single chromatic spark. White text (#ffffff) reads cleanly against the blue depths. Secondary text (#c8d0ff) carries a blue cast that harmonizes with the backdrop. The neon yellow accent touches rules, outlines, hero numbers, section markers, and text-shadow glows — but NEVER fills a card or surface. Halftone dots use the accent color at 15% opacity. The accent-glow at 35% is powerful enough for luminous text-shadows and focus rings. There are no warm neutrals, no earth tones — this is an electric, cool+hot palette where the heat comes entirely from the yellow.

## Typography
Syne at 700 weight is the voice — a geometric serif-display hybrid with distinctive wide proportions, sharp terminals, and an unmistakable presence. It carries headlines, hero numbers, and section titles. Space Mono at 400 handles body copy with monospace precision — the contrast between Syne's expressive geometry and Space Mono's technical rigor is the typographic engine of this theme. Space Mono at 700 serves as the monospace weight for code and numerical data. CJK uses Noto Sans SC at 700, matching Syne's geometric character and visual weight. Maximum 2 typefaces visible simultaneously. Tabular figures mandatory for all numbers. Never use italic styling — emphasis comes from color (neon yellow) or weight shift.

## Layout & Components
The stage is saturated blue with a halftone dot overlay (3px spacing, 15% opacity, neon yellow) — the dots are the texture fingerprint and must appear on every slide. Cards use 0 border-radius with a 2px neon yellow outline (no fill color change, no shadow) — the outline IS the card treatment. Full-width solid neon yellow rules act as energy bars separating sections. Hero numbers are Syne at 700 in neon yellow with a luminous text-shadow (0 0 20px at 40% opacity) — they should feel like they're glowing. For headlines, consider an offset text-shadow in neon yellow (2px right, 2px down, no blur) creating a misregistration print effect. Density is medium — room for creative layouts but not data-dense tables.

## Do's
1. Use neon yellow exclusively for rules, outlines, hero numbers, and text-shadow glows — never as a fill.
2. Apply the halftone dot overlay at exactly 3px spacing and 15% accent opacity on every slide.
3. Use 0 border-radius on all cards and containers — sharp edges match the electric, punk energy.
4. Pair Syne headlines with Space Mono body text — the expressive/precise contrast is the typographic signature.
5. Add a neon yellow text-shadow glow to hero numbers — it distinguishes the number as a graphic element.
6. Use full-width rules (never partial-width) — they function as energy bars, not subtle separators.
7. Render CJK with Noto Sans SC at 700 weight to match Syne's geometric presence.

## Don'ts
1. Never fill a card with neon yellow — the accent is for lines and type, never for surfaces.
2. Never use rounded corners — 0 radius everywhere, the sharpness is part of the energy.
3. Never use warm earth tones, browns, or muted colors — the palette is electric blue + neon yellow only.
4. Never place body text directly on the shell without a card — the saturated blue needs a surface buffer for readability.
5. Never use more than two typefaces on one slide — Syne + Space Mono is the complete system.
6. Never reduce the halftone dot opacity below 10% — the texture must read as intentional, not accidental.
7. Never use the neon yellow for body text or any continuous reading text longer than 3 words.

## CJK Notes
Noto Sans SC at 700 weight handles CJK display with geometric sans-serif character matching Syne's modern proportions. CJK body copy uses Noto Sans SC at 400 weight with 1.75 line-height. For the offset-print effect on CJK headlines, apply the text-shadow to the entire headline — the effect works across scripts. CJK has no italic; use weight shift for emphasis.
