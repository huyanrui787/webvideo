---
version: 1
name: Swiss IKB
description: Massimo Vignelli / Helvetica Forever energy — ultra-thin weights, crisp 64px grid, IKB as the sole saturated anchor. Modernist precision.
colors:
  shell: "#e8e8e6"
  surface: "#fafaf8"
  surface-2: "#eeecea"
  text: "#0a0a0a"
  text-2: "#2a2a2a"
  text-mute: "#6b6b6b"
  text-faint: "#9a9a9a"
  accent: "#002fa7"
  accent-soft: "rgba(0,47,167,0.06)"
  accent-glow: "rgba(0,47,167,0.12)"
  rule: "#0a0a0a"
typography:
  display-cn: { fontFamily: "Noto Sans SC", fontWeight: 300 }
  display-en: { fontFamily: "Inter", fontWeight: 200 }
  body: { fontFamily: "Inter", fontWeight: 400 }
  mono: { fontFamily: "JetBrains Mono", fontWeight: 400 }
components:
  rule: { width: "100%", height: "1px", style: "solid", background: "rule", description: "Hairline black rule — 1px, precise, structural. Swiss minimalism: the rule exists to organize space, not to be seen." }
  card: { borderRadius: "0", background: "surface", boxShadow: "none", description: "Zero-radius card with no shadow. Minimal elevation — distinguished from the stage by its slightly whiter surface. The card is a spatial organizer, not a visual element." }
  hero-num: { font: "display-en", color: "accent", weight: 200, description: "Inter at 200 weight (extra-light) in IKB. Tabular figures, 72-120px. The number is architectural — present through precision, not weight." }
  stage-decoration: "64px grid drawn in black at 4% opacity — a 1px hairline grid across the entire stage. The grid is the only decoration and serves as the structural skeleton for all content alignment."
---

## Design Philosophy
Swiss IKB channels the spirit of Massimo Vignelli and the International Typographic Style — ultra-thin weights, crisp structural grids, and International Klein Blue as the sole saturated anchor. The stage is off-white (#e8e8e6) with a 64px hairline grid drawn at 4% opacity — the grid IS the decoration, serving as the structural skeleton for all content alignment. Inter at 200 weight (extra-light) carries the voice — so thin it borders on fragile, yet impossibly precise. IKB (#002fa7) is the ONLY saturated color on stage — it touches hero numbers, section markers, and the occasional rule or border, but never fills a surface. This theme is for AI/tech product launches, annual reports, design/engineering talks, academic presentations, and information-driven design. It is NOT for emotional storytelling, craft/vintage, children's content, or warm/soft brands. IMPORTANT: This theme is NOT CJK compatible at 200 weight — Chinese characters are unreadable at extra-light weights.

## Colors
The palette is near-monochromatic with a single saturated anchor. Shell (#e8e8e6) is off-white with a microscopic cool undertone — the Swiss paper. Surface (#fafaf8) is slightly whiter — cards live here, distinguished by the subtlest luminance shift. Surface-2 (#eeecea) provides a tertiary plane. Text (#0a0a0a) is near-black — used at 200 weight for display (architectural), 400 weight for body (legible). Text-2 (#2a2a2a) is dark gray for secondary copy. Text-mute (#6b6b6b) and text-faint (#9a9a9a) descend through neutral grays. The accent (#002fa7) is International Klein Blue — deep, saturated, absolute. It touches hero numbers, section markers, grid labels, and occasionally a rule. At accent-soft (6%) and accent-glow (12%), it is used with extreme restraint. There are no warm colors, no secondary accents — the palette is black, white, gray, and IKB.

## Typography
Inter at 200 weight (extra-light) is the voice — impossibly thin, architectural, precise. It carries English display text at 48px+ with a presence that is simultaneously fragile and authoritative. Inter at 400 weight handles body copy — the same typeface at a legible weight creates a seamless hierarchy through weight contrast alone. The 200-to-400 weight gap within Inter is the primary typographic hierarchy tool — size alone is insufficient; the weight contrast IS the hierarchy. JetBrains Mono at 400 serves code and technical content. CJK is NOT supported at 200 weight — Chinese characters require minimum 300 weight for legibility, and 200-weight CJK is unreadable at any size. CJK displays should use Noto Sans SC at 300 weight (the lightest legible CJK weight) with the understanding that the ultra-thin Swiss character cannot be fully replicated across scripts.

## Layout & Components
The stage is off-white with a 64px hairline grid drawn in black at 4% opacity — 1px lines, precise and structural. Every element snaps to this grid. The grid IS the stage decoration — no textures, no gradients, no borders, no stage frame. Cards have 0 border-radius, no shadow, and are distinguished from the stage only by their slightly whiter surface — elevation through luminance alone. Rules are 1px black hairlines — structural dividers that organize space without drawing attention. Hero numbers are Inter at 200 weight in IKB, tabular figures, 72-120px — architectural, present through precision rather than weight. Density is high — this theme supports multi-column layouts, data tables, and information-dense slides. Padding is precise: 96px horizontal, 80px vertical, aligned to the 64px grid.

## Do's
1. Snap every element to the 64px grid — off-grid elements read as errors in this theme.
2. Use Inter at 200 weight for all English display text — the ultra-thin weight IS the Swiss character.
3. Use IKB (#002fa7) as the ONLY chromatic color on stage — maximum one IKB element per slide.
4. Maintain 0 border-radius on all elements — rounded corners contradict Swiss geometry.
5. Use weight contrast (200 vs 400) within Inter for hierarchy — size alone is insufficient.
6. Keep the 64px grid visible at exactly 4% opacity on most slides — it is the structural signature.
7. Allow high information density — Swiss design accommodates complexity through precise organization.

## Don'ts
1. Never use Inter at 200 weight below 36px — the hairline strokes become illegible at small sizes.
2. Never use CJK at weights below 300 — Chinese characters are structurally unreadable at 200 weight.
3. Never use any warm color — no red, orange, yellow, or warm green in the palette.
4. Never use rounded corners — 0 radius everywhere, no exceptions.
5. Never use shadows or elevation effects — cards are distinguished by luminance alone.
6. Never use more than one IKB element per slide — the blue is a precision instrument, not a decoration.
7. Never use serif typefaces — the geometric sans-serif unity is fundamental to the Swiss character.

## CJK Notes
CRITICAL: Swiss IKB at 200 weight is NOT CJK compatible. Chinese, Japanese, and Korean characters have complex stroke structures that collapse to illegible blobs at 200 weight. Noto Sans SC at 300 weight is the minimum legible weight for CJK display — this preserves some of the Swiss lightness but fundamentally compromises the ultra-thin character. For content requiring CJK, consider indigo-porcelain (scholarly) or monochrome-print (editorial) as alternatives that preserve the intellectual character with CJK-safe typography.
