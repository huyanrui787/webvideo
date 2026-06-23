---
version: 1
name: Bauhaus Bold
description: Modernist manifesto — pure off-white, primary blue, brutalist energy. Built for bold opinions, not gentle persuasion.
colors:
  shell: "#f0eee8"
  surface: "#fafaf7"
  surface-2: "#ebe8e0"
  text: "#0a0a0a"
  text-2: "#2a2a2a"
  text-mute: "#6b6b6b"
  text-faint: "#a0a0a0"
  accent: "#1a4cdb"
  accent-soft: "rgba(26,76,219,0.12)"
  accent-glow: "rgba(26,76,219,0.22)"
  rule: "#0a0a0a"
typography:
  display-cn: { fontFamily: "Noto Sans SC", fontWeight: 900 }
  display-en: { fontFamily: "Archivo Black", fontWeight: 900 }
  body: { fontFamily: "Inter", fontWeight: 400 }
  mono: { fontFamily: "JetBrains Mono", fontWeight: 500 }
components:
  rule: { width: "100%", height: "4px", style: "solid", background: "rule", description: "Heavy black rule — a Bauhaus structural element, not a separator. 4px is the minimum thickness that reads as conviction." }
  card: { borderRadius: "0", background: "surface", boxShadow: "4px 4px 0 #0a0a0a", description: "Zero-radius card with offset solid black shadow. The shadow is a graphic element, not an atmospheric one — it sits hard right and hard down, no blur." }
  hero-num: { font: "display-en", color: "accent", weight: 900, description: "Archivo Black at 900 weight in primary blue. Massive (120px+), tabular figures, isolated in their own block. The number IS the slide." }
  stage-decoration: "4px solid black border framing the entire 1920x1080 stage. No gradient, no noise — the frame is the only decoration and it must be exactly 4px on all four sides."
---

## Design Philosophy
Bauhaus Bold is the theme of declarative conviction. It speaks in manifestos, not suggestions. The visual language is pure interwar modernism: off-white paper, primary blue accent, heavy black structural lines, zero-radius geometry. Every element on stage must justify its existence through function — decoration is structural, never ornamental. The emotional register is confident without arrogance, graphic without aggression. This theme works best for product launches, design talks, brand manifestos, and any content where the thesis is strong enough to stand in a room with empty walls and a single spotlight. It is NOT for warmth, softness, nostalgia, or anything that wants to feel approachable.

## Colors
The palette is a three-player drama: off-white (#f0eee8) as the stage floor, near-black (#0a0a0a) as the ink and structural steel, and primary blue (#1a4cdb) as the sole chromatic accent. The blue touches hero numbers, section markers, and exactly one focal element per slide — nothing else. It never touches body text, labels, rules, or chrome. The off-white shell is warmer than pure white, giving the stage paper-like tactility that prevents the high-contrast geometry from feeling clinical. Surface (#fafaf7) is nearly indistinguishable from shell — cards don't pop forward through color contrast, they announce themselves through the 4px offset shadow. This is a light-scheme theme where contrast comes from form, not luminance.

## Typography
Archivo Black at 900 weight carries the voice — it is the only display typeface and must never appear below 36px. Its massive x-height and closed apertures create an unmissable graphic presence. Inter at 400 handles body copy with clean geometric neutrality, receding completely against Archivo Black's dominance. JetBrains Mono serves technical metadata and code. CJK is handled by Noto Sans SC at 900 weight for display — matching Archivo Black's visual mass. For Latin-CJK mixed headlines, use Noto Sans SC for the entire headline to maintain consistent stroke weight and proportion. Maximum two typefaces visible simultaneously; never all three on one slide.

## Layout & Components
Content sits on a single-column, center-weighted axis. The stage is framed by a 4px solid black border on all four sides — this is the Bauhaus frame, and it is non-negotiable. Cards have 0 border-radius and use offset solid shadows (4px right, 4px down, zero blur) — never box-shadow with blur, never drop-shadow. The hero number (section number, data callout) is the primary graphic event: Archivo Black 900 in primary blue, 120px minimum, tabular figures, never inline with text. Rules are 4px solid black lines — structural beams, not hairline dividers. No gradients, no textures, no noise overlays. Negative space is generous; cards need at least 200px breathing room in all directions. Density is low — one idea per slide, delivered at maximum weight.

## Do's
1. Use exactly one accent-blue element per slide — a hero number, a section marker, or a single card border. Never two.
2. Keep headlines under 10 words. Archivo Black at display sizes is for declarations, not sentences.
3. Maintain the 4px black stage border on every slide — it is the theme's primary structural signature.
4. Use tabular figures (tnum) for all numerical data — proportional figures destroy the geometric rhythm.
5. Set all card border-radius to 0 — rounded corners contradict Bauhaus geometry.
6. Use the offset shadow (4px 4px 0 #0a0a0a) on any card that needs elevation — never use blurred shadows.
7. Render CJK display at 900 weight in Noto Sans SC to match Archivo Black's presence.

## Don'ts
1. Never use rounded corners on any element — 0 radius everywhere, no exceptions.
2. Never use gradients, textures, noise, or vignettes — the Bauhaus frame and offset shadow are the only visual effects.
3. Never use any color outside the palette — no secondary accents, no semantic colors, no tinted backgrounds.
4. Never use Archivo Black below 36px — letterforms collapse and counters close at small sizes.
5. Never center-align body text spanning more than 2 lines — body text is always left-aligned.
6. Never use bordered cards with a different border color — the 4px black frame is the only border vocabulary.
7. Never place body text directly on the shell background without a card beneath it.

## CJK Notes
Noto Sans SC at 900 weight for display matches Archivo Black's visual mass and graphic presence. CJK body copy uses Noto Sans SC at 400 weight with minimum 1.75 line-height. CJK has no italic — use weight shift (400 to 700) for emphasis, consistent with the theme's no-italic rule.
