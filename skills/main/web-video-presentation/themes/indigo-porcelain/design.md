---
version: 1
name: Indigo Porcelain
description: Deep indigo as the ink itself — academic gravitas, scholarly restraint, like a Chinese journal of contemporary thought or blue-and-white porcelain.
colors:
  shell: "#e4e8ec"
  surface: "#f1f3f5"
  surface-2: "#e8eaee"
  text: "#0a1f3d"
  text-2: "#1a3058"
  text-mute: "#5a6a88"
  text-faint: "#9aa8b8"
  accent: "#1e3a8a"
  accent-soft: "rgba(30,58,138,0.08)"
  accent-glow: "rgba(30,58,138,0.15)"
  rule: "#0a1f3d"
typography:
  display-cn: { fontFamily: "Noto Serif SC", fontWeight: 700 }
  display-en: { fontFamily: "Playfair Display", fontWeight: 400, fontStyle: "italic" }
  body: { fontFamily: "IBM Plex Sans", fontWeight: 400 }
  mono: { fontFamily: "IBM Plex Mono", fontWeight: 500 }
components:
  rule: { width: "100%", height: "1px", style: "solid", background: "rule", description: "Indigo rule — the same color as the text. Structural but understated, like a ruled margin in a scholarly journal." }
  card: { borderRadius: "var(--r-card)", background: "surface", boxShadow: "none", description: "Card distinguished from shell only by its slightly cooler white surface. No shadows — elevation through color and spatial separation alone." }
  hero-num: { font: "display-en", color: "accent", weight: 400, description: "Playfair Display italic in bright indigo. Tabular figures, 72-100px. Academic precision — the number informs, never performs." }
  stage-decoration: "None. No gradients, no textures, no grids, no borders. The stage is pure porcelain white (#e4e8ec). Decoration would undermine the scholarly purity."
---

## Design Philosophy
Indigo Porcelain is built for academic gravitas — the visual language of a Chinese journal of contemporary thought, or the quiet confidence of blue-and-white porcelain. Deep indigo (#0a1f3d) IS the ink — body text, headlines, and rules are all rendered in indigo, not black. A brighter indigo (#1e3a8a) serves as the accent for hero numbers and section markers, but it's a refinement of the text color, not a foreign chromatic intrusion. The stage is porcelain white (#e4e8ec) — clean, cool, utterly without decoration. Playfair Display italic carries the English voice with scholarly refinement; Noto Serif SC carries the CJK voice with equal gravitas. This theme is for academic/research presentations, AI/data deep dives, Chinese contemporary culture topics, technical launches, and long-form intellectual content. It is NOT for entertainment, marketing, fast-moving consumer content, or casual vlogs.

## Colors
The palette is a single indigo axis on porcelain white. Shell (#e4e8ec) is the porcelain stage — cooler and more refined than warm paper, evoking the blue-white of classic Chinese ceramics. Surface (#f1f3f5) and surface-2 (#e8eaee) create subtle elevation through barely-perceptible luminance shifts. Text (#0a1f3d) IS deep indigo — the ink for all primary content. This is the defining color decision: indigo replaces black as the default ink. Text-2 (#1a3058) is a lighter indigo for secondary copy. Text-mute (#5a6a88) and text-faint (#9aa8b8) descend through blue-gray tones. The accent (#1e3a8a) is a brighter indigo — a refinement of the text color, never a different color family. It touches hero numbers, section markers, and focal highlights at deliberately low opacity (8%, 15%). There are no warm colors, no greens, no reds — the indigo axis is the complete chromatic vocabulary. The palette's restraint IS its authority.

## Typography
Playfair Display italic at 400 weight is the English voice — a refined transitional serif with high stroke contrast, carrying the scholarly, considered character. The italic is structural — it IS the typeface identity, not an emphasis variant. IBM Plex Sans at 400 handles body copy with clean neutrality — its job is to deliver academic prose with maximum legibility and zero personality, letting Playfair carry all the character. IBM Plex Mono at 500 serves code, data, and technical content. CJK uses Noto Serif SC at 700 for display — matching Playfair's serif editorial presence and the scholarly tone. The type scale favors restraint: display rarely exceeds 64px, body at 18-20px with 1.6 line-height. Maximum two typefaces per slide. Never use bold sans-serif for display — the serif italic is the complete display vocabulary.

## Layout & Components
The stage is pure porcelain white — no decoration whatsoever. No gradients, no textures, no grids, no borders, no stage frame. This absence is the theme's strongest visual statement: the content must carry the stage through substance alone. Cards are distinguished from the stage by their slightly cooler white surface (#f1f3f5) — no shadows, no borders, no outlines. Elevation through color alone. Rules are 1px indigo (#0a1f3d) — the same color as the text, functioning as structural dividers, not decorative elements. Hero numbers are Playfair Display italic in bright indigo (#1e3a8a), tabular figures, 72-100px — scholarly, precise, never performative. Density is medium — room for academic diagrams and structured argument, but never crowded. The aesthetic is the absence of aesthetic — pure, clean, intellectual.

## Do's
1. Use deep indigo (#0a1f3d) as the primary text color for ALL body copy, headlines, and rules.
2. Use bright indigo (#1e3a8a) ONLY for hero numbers, section markers, and focal academic highlights.
3. Keep the stage completely undecorated — no gradients, textures, grids, or borders.
4. Use Playfair Display italic for all English display text — the italic is structural, not decorative.
5. Distinguish cards from the stage through luminance alone — no shadows, no borders, no outlines.
6. Favor Noto Serif SC for CJK display to maintain serif continuity with the scholarly editorial character.
7. Maintain generous margins (80px+ horizontal) — scholarly content needs breathing room for footnotes and references.

## Don'ts
1. Never use pure black (#000000) for text — deep indigo (#0a1f3d) is the darkest permissible ink.
2. Never add any stage decoration — the porcelain-white void is the theme's primary design statement.
3. Never use non-indigo accent colors — no red, green, orange, or warm tones in the palette.
4. Never use bold sans-serif for English display — Playfair Display italic is the complete display vocabulary.
5. Never use shadows or elevation effects on cards — the flat, shadowless aesthetic is fundamental.
6. Never use Playfair Display for body copy — it is a display typeface only.
7. Never crowd elements — if an academic argument feels tight, split across more slides.

## CJK Notes
Noto Serif SC at 700 weight for display and 400 weight for body carries the scholarly, literary character across scripts. The indigo-ink effect (text = #0a1f3d) applies identically to CJK — all primary CJK copy is rendered in deep indigo. CJK line-height minimum 1.75. CJK italic does not exist — use weight shift (400 to 700) or the bright indigo accent for emphasis, consistent with the scholarly restraint.
