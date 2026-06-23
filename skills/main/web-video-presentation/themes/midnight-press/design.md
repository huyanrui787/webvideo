---
version: 1
name: Midnight Press
description: Warm cinematic dark — espresso depths with a hot orange-red accent and filmic vignette
colors:
  shell: "#0d0b09"
  surface: "#1a1714"
  surface-2: "#24211d"
  text: "#f5f0e5"
  text-2: "#c4bdb2"
  text-mute: "#8a8278"
  text-faint: "#5a5450"
  accent: "#ff4a2b"
  accent-soft: "rgba(255,74,43,0.10)"
  accent-glow: "rgba(255,74,43,0.30)"
  rule: "#2a2520"
color-aliases:
  c-bg: shell
  c-bg-card: surface
  c-fg: text
  c-fg-mute: text-mute
  c-accent: accent
typography:
  display-cn:
    fontFamily: "Noto Serif SC"
    fontWeight: 700
  display-en:
    fontFamily: "Instrument Serif"
    fontWeight: 400
  body:
    fontFamily: "IBM Plex Sans"
    fontWeight: 400
  mono:
    fontFamily: "IBM Plex Mono"
    fontWeight: 500
spacing:
  stage-pad-x: "140px"
  stage-pad-y: "100px"
components:
  rule:
    width: 100%
    height: 1px
    style: solid
    background: rule
    description: Warm dark hairline. Used to separate editorial sections — between headline and body, between body and footer. A structural pause rendered as a line
  card:
    borderRadius: var(--r-card)
    background: surface-2
    boxShadow: "none"
    description: Flat dark card — no shadow. Midnight Press rejects elevation as a metaphor. Cards are flat planes distinguished by color alone, like pages in a book spread
  hero-num:
    font: display-en
    color: accent
    weight: 400
    description: Instrument Serif italic at 400 weight. Chapter numbers, timestamps, and numerical callouts. Italic is essential — it is the voice of literary emphasis
  stage-decoration:
    description: Cinematic vignette — a radial gradient centered at stage center, transparent at 60% radius and darkening to shell at edges. Creates a filmic frame that draws the eye inward. No grain, no pattern overlay — the vignette alone carries the cinema metaphor
---

## Overview

Midnight Press is the cinematic editorial theme. Its emotional register sits at the intersection of a late-night film screening and a leather-bound book — warm, serious, and deeply atmospheric. The palette is built on espresso tones rather than pure black: shell at #0d0b09 has brown undertones that read as organic, not digital. Hot orange-red (#ff4a2b) provides the only burst of temperature — like the glow of a cigarette or the reflection of a marquee on wet asphalt. The stage is framed by a radial vignette that darkens the edges, pulling the eye relentlessly toward center content without ever calling attention to the mechanism.

This theme is built for content that rewards attention: developer tutorials, AI evaluations, technical deep dives, cinematic narrative. It handles medium text density comfortably — you can put a paragraph on screen without betraying the theme's character. But it is NOT for corporate pitches, NOT for cheerful or casual content, and NOT for anything that needs to feel fast or lightweight. Midnight Press rewards the patient viewer.

Instrument Serif carries the literary voice at 400 weight, with italic as its primary mode of emphasis — not bold, not color, but the slant of a fountain pen. IBM Plex Sans handles body copy with technical clarity, and IBM Plex Mono provides the code and data layer. The 140x100px stage padding creates cinematic breathing room that makes every slide feel framed, considered, and unhurried.

## Colors

### Palette

- **Shell (#0d0b09)** — Espresso black with warm brown undertones. Warmer than #000, cooler than sepia. The base of the stage and the vignette's terminal color. Never used as a surface; it is the darkness that frames the frame.
- **Surface (#1a1714)** — Warm dark brown-gray, the color of a coffee table in low light. Primary card and content surface. Sits close to shell in luminance but distinct in warmth, creating subtle separation.
- **Surface-2 (#24211d)** — Slightly lifted warm dark. Used for nested cards, callout boxes, and code blocks. The extra lift provides enough contrast for content differentiation without breaking the warm-dark envelope.
- **Text (#f5f0e5)** — Warm off-white with a cream undertone. Reads as white against dark surfaces but carries enough warmth to feel analog — like the paper of a vintage paperback, not the screen of a phone. Never pure white.
- **Text-2 (#c4bdb2)** — Warm secondary text. The color of aged paper in lamplight. Used for supporting body copy and descriptions. Still warm, still readable, but clearly subordinate.
- **Text-Mute (#8a8278)** — Muted warm gray. Labels, captions, timestamps, bylines. The color of pencil marks in a book margin — present but not insistent.
- **Text-Faint (#5a5450)** — Deep warm gray at the edge of legibility. Decorative elements, page numbers, structural chrome that must exist but must never be noticed.
- **Accent (#ff4a2b)** — Hot orange-red, leaning slightly more red than Bold Signal's orange. The emotional temperature spike — this is the ember, the flare, the marquee glow. Sits at approximately 10 degrees on the hue wheel.
- **Accent-Soft (rgba(255,74,43,0.10))** — Translucent accent for hover states and subtle washes. Low enough to tint without heating.
- **Accent-Glow (rgba(255,74,43,0.30))** — Accent at glow intensity. For text-shadows, focus indicators, and the rare luminous element.
- **Rule (#2a2520)** — Warm dark divider. The color of a book spine shadow. Separates without announcing.

### Defaults

- All body text against surface/surface-2 uses text (#f5f0e5). The warmth of the text color must match the warmth of the background — cool text on warm dark feels broken.
- Accent color touches: hero numbers in Instrument Serif italic, chapter markers, active navigation, key call-to-action indicators, the occasional single-word emphasis in body copy.
- Accent color never touches: body paragraphs, multi-word phrases, labels, captions, or any element that appears more than twice per slide.
- Text-mute is the default for bylines, dates, and metadata. Text-faint is for structural chrome only.
- Never use pure white (#ffffff) or pure black (#000000). Both destroy the warm analog character.
- The vignette must always use shell (#0d0b09) as its terminal color, matching the stage background exactly.

## Typography

### Font Family

- **Instrument Serif (400, 400 italic)** — The literary voice. Display headlines, pull quotes, chapter titles. A refined serif with editorial character — neither too delicate nor too heavy. Italic is the primary mode of emphasis: it is the difference between a headline stated and a headline felt. Use 400 roman for most headlines; use 400 italic for emphasis lines, pull quotes, and hero numbers.
- **IBM Plex Sans (400, 500, 600)** — The technical substance. Body copy, labels, navigation, interface elements. A workhorse sans-serif with enough personality to feel authored but enough neutrality to recede when needed. 400 for body, 500 for labels and kickers, 600 for subheads that need sans-serif clarity.
- **IBM Plex Mono (500)** — The code voice. Code blocks, terminal output, numerical data, file paths, technical labels. Shares DNA with IBM Plex Sans for seamless integration but maintains monospace rigor.
- **Noto Serif SC (700)** — The CJK literary voice. Chinese/Japanese/Korean display text. Serif for CJK preserves the literary character across scripts — this is a reading theme, and serif CJK reinforces that.

### Type Scale

- **Display (72–120px)**: Instrument Serif 400 or 400 italic. Headlines and pull quotes. Line-height: 1.15.
- **H1 (48–64px)**: Instrument Serif 400. Section titles. Line-height: 1.2.
- **H2 (32–40px)**: Instrument Serif 400 or IBM Plex Sans 600. Subheads. Line-height: 1.3.
- **H3 (24–28px)**: IBM Plex Sans 600. Card titles, callout headers. Line-height: 1.35.
- **Body (18–22px)**: IBM Plex Sans 400. Body copy. Line-height: 1.6 minimum — the extra leading reinforces the unhurried editorial pace.
- **Caption (14–16px)**: IBM Plex Sans 400. Supporting text, descriptions. Line-height: 1.5.
- **Label (12–14px)**: IBM Plex Sans 500. Kickers, bylines, navigation, metadata. Letter-spacing: +0.06em.
- **Mono (14–18px)**: IBM Plex Mono 500. Code, data, technical content. Line-height: 1.6.

### Signature Treatments

- Instrument Serif italic is the voice of emphasis. Use it for hero numbers, pull quotes, chapter titles that need emotional weight, and single-line emphasis statements. Never use it for body paragraphs or multi-line text longer than 15 words.
- Hero numbers are ALWAYS Instrument Serif italic at 400 weight, rendered in accent (#ff4a2b). Always proportional figures (not tabular) — the italic slant makes tabular spacing impossible, and the literary character doesn't demand it.
- IBM Plex Sans 600 is the maximum weight for sans-serif elements. Never bold IBM Plex Sans beyond 600 — the 700 weight of IBM Plex Sans introduces too much mechanical contrast against Instrument Serif's refined strokes.
- Mono elements (IBM Plex Mono 500) are for code and data only. Never for labels, never for body, never for navigation. The monospace voice is the voice of technical authority and must be reserved.
- Under 16px, Instrument Serif must never appear. Below this threshold, its fine serifs and delicate stroke contrast become fragile, especially on dark backgrounds with warm text.

### Typography Principles

- Line-height is the primary pacing tool in Midnight Press. Body text at 1.6 leads the eye slowly; display text at 1.15 compresses for impact. The ratio between them (roughly 1.4x) creates the editorial rhythm.
- Maximum 2 typefaces visible simultaneously (Instrument Serif + IBM Plex Sans, or IBM Plex Sans + IBM Plex Mono). Never all three on one slide.
- Italic is the ONLY permitted emphasis mechanism on Instrument Serif. Never use color alone for emphasis on serif text — the italic carries the meaning. On IBM Plex Sans, weight shift (400 to 600) is the emphasis mechanism; never italicize sans-serif elements.
- Letter-spacing: 0 for body and display, -0.01em for display above 72px (mild optical tightening for serif), +0.06em for labels.
- Never faux-italicize any font. Instrument Serif has a true italic designed for the purpose. IBM Plex Sans italic is configured as prohibited.

## Layout

### Canvas System

The stage is 1920x1080. Midnight Press uses a centered, single-column layout with exceptionally generous padding — 140px horizontal, 100px vertical. This is the most padded theme in the system, and the padding is non-negotiable. It creates the cinematic frame: content floats in a sea of warm darkness, surrounded by the radial vignette. The effect is of a single page illuminated on a dark table — intimate, focused, undisturbed.

Two-column layouts are permitted for comparison and code-with-explanation patterns. Three-column is permitted only for data tables or metrics dashboards. Four-column is never permitted. The generous padding means that even two-column layouts feel spacious — columns never crowd each other.

### Padding and Gap Scale

- Stage padding: 140px horizontal, 100px vertical. Cinematic breathing room. These values are non-negotiable for any slide that wants the full Midnight Press atmosphere.
- Card internal padding: 56px horizontal, 48px vertical. Cards must feel like they contain considered space, not crammed content.
- Gap between adjacent cards: 32px. Wider than other themes — the extra gap complements the generous stage padding.
- Gap between headline and body: 40px. A clear structural break.
- Gap between body paragraphs: 24px. Paragraphs are distinct thoughts; the gap says so.
- Gap between body and label/byline: 20px.
- Navigation zone: bottom 72px of stage, starting 100px from bottom edge.

### Key Layout Patterns

- **Centered Editorial (default)**: Single content block centered vertically and horizontally. Headline in Instrument Serif, body in IBM Plex Sans, generous space on all sides. The vignette frames the content naturally.
- **Code + Explanation**: Two-column layout. Left column: explanation in IBM Plex Sans (55% width). Right column: code in IBM Plex Mono on a surface-2 card (40% width). 5% gap. The code column is visually heavier to balance the wider text column.
- **Pull Quote**: A single line of Instrument Serif italic at 64–80px, centered, in accent color. Attribution line below in IBM Plex Sans 400, text-mute. Nothing else on stage. Pure cinematic punctuation between sections.
- **Chapter Title**: Chapter number in Instrument Serif italic, accent, 120–160px. Chapter title below in Instrument Serif 400, 48–64px. Both centered. The vignette darkens more aggressively on these slides for dramatic effect.
- **Stacked Cards**: Maximum 3 cards in vertical stack. Each card is surface-2 with flat treatment (no shadow). Cards read as stacked paper, not floating planes.

## Depth and Elevation

Shadow philosophy: flat. Midnight Press rejects depth as a metaphor. Cards are distinguished by color alone — surface-2 against surface, surface against shell. The vignette provides the only depth cue on the stage, and it is atmospheric, not structural. No card shadows. No drop shadows on text. No elevation system.

The rejection of shadows is intentional and thematic: this is a flat, printed, literary space. Pages in a book do not cast shadows on each other — they sit flush. The vignette does all the atmospheric work. When an element needs distinction, it gets a color change or a rule — never a shadow.

- Default card: no shadow (box-shadow: none). Background color alone provides separation.
- No text shadows. No glow effects on text except the accent-glow for hero numbers, and even that is sparing.
- The vignette is implemented as a radial gradient on the stage background: `radial-gradient(ellipse at center, transparent 60%, shell 100%)`. It must never be replaced with a linear gradient or a border-based frame.

## Signature Elements

1. **Cinematic Vignette**: A radial gradient centered on the stage, transparent through 60% of the radius and darkening to shell at the edges. The vignette is the theme's primary atmospheric device — it frames every slide without ever being explicitly visible. It creates the cinema metaphor: the screen is a pool of light in darkness.

2. **Instrument Serif Italic Emphasis**: The italic of Instrument Serif is the most emotionally charged typographic element in the system. A single line of italic in accent color can carry more feeling than a paragraph of roman. It is used for hero numbers, pull quotes, chapter markers, and the one-line emotional punctuation between sections.

3. **Espresso Palette**: The warm brown-black base. Not pure black, not cool dark — specifically warm. Every color in the palette has brown or cream undertones. The effect, combined with the vignette, is of a film screening in a wood-paneled room. The warmth makes long-form content feel inviting rather than sterile — critical for a theme designed for tutorials and deep dives.

## Do's and Don'ts

### Do

1. Use the vignette on every slide. It is the theme's atmospheric constant. Slides without it feel naked and digital.
2. Use Instrument Serif italic for any single-line statement that needs emotional weight — pull quotes, hero numbers, chapter titles, emphasis lines.
3. Maintain the full 140px horizontal and 100px vertical stage padding. Reducing padding destroys the cinematic frame.
4. Pair code blocks (IBM Plex Mono on surface-2) with explanatory text (IBM Plex Sans on surface) on adjacent cards for tutorial and explainer slides.
5. Use text (#f5f0e5) for all body copy against dark surfaces. The cream undertone is essential — pure white text breaks the analog character.
6. Limit Instrument Serif usage to 2 elements per slide maximum — one headline, one emphasis line. More dilutes its impact.
7. Use proportional figures (default) for all numbers in Instrument Serif. Tabular figures fight the italic and the literary character.
8. Render all CJK display text in Noto Serif SC 700 to preserve the literary serif character across scripts.
9. Use the pull-quote layout (single italic line, centered, accent color) as section dividers between major content blocks.
10. Keep body paragraph width under 700px even with the generous stage padding. Line length discipline preserves readability.

### Don't

1. Never apply a box-shadow to any card or element. The theme is flat by design. Depth comes from the vignette, not from elevation.
2. Never use pure white (#ffffff) or pure black (#000000) anywhere. Both destroy the warm analog palette.
3. Never use Instrument Serif at sizes below 16px. Its fine serifs and delicate strokes fail at small sizes on dark backgrounds.
4. Never use Instrument Serif for body paragraphs or any text longer than 15 words. It is a display face — extended reading in serif at display weight on dark backgrounds causes eye strain.
5. Never bold Instrument Serif beyond its native 400 weight. The font has no bold variant — faux-bolding destroys its delicate stroke contrast.
6. Never add a grain, noise, or texture overlay. The vignette alone carries the atmosphere. Additional effects clutter the frame.
7. Never center-align body text. Center is for headlines, pull quotes, and single-line statements only. Body text is always left-aligned.
8. Never use IBM Plex Sans italic. The italic of the sans-serif competes with Instrument Serif's italic and fragments the emphasis system.
9. Never use the accent color for more than 3 words consecutively in running text. Accent is for punctuation, not paragraphs.
10. Never exceed 3 cards on a single slide. The generous padding means 4+ cards cannot fit without violating minimum card dimensions.
11. Never flip or rotate the vignette. It is always centered, always radial, always uniform. Directional vignettes break the cinema metaphor.
12. Never use a pure saturated color other than the accent. Secondary accents dilute the thermal contrast that makes #ff4a2b effective.

## CJK & International Content

Chinese, Japanese, and Korean text uses Noto Serif SC at 700 weight for display, preserving the literary serif character that defines the theme. For CJK body copy, use Noto Serif SC at 400 weight — the serif carries the reading experience across scripts. The transition from Instrument Serif to Noto Serif SC at the script boundary must feel natural: both are serif, both have editorial character, and Noto Serif SC's 700 weight matches Instrument Serif's display presence.

CJK line-height must be minimum 1.8 (compared to 1.6 for Latin body text). CJK characters require more vertical space due to their square em-boxes and higher information density per character. This is especially critical in Midnight Press, where body leading is already generous — CJK leading must be proportionally more generous still.

Italic does not exist in CJK typography. Since Instrument Serif italic is the theme's primary emphasis mechanism, CJK slides lose their strongest emotional tool. Compensate through: (a) accent color on key CJK display phrases, (b) increased font weight (700 for emphasis within 400 body), and (c) spatial isolation — a single CJK phrase centered alone on a card carries the same weight as italic in Latin.

Mixed Latin-CJK layouts: when a headline contains both scripts, use Noto Serif SC for the full headline. Instrument Serif and Noto Serif SC have different x-heights and stroke contrasts that are visibly jarring when adjacent. For body text that mixes scripts, IBM Plex Sans handles Latin portions while Noto Serif SC handles CJK — the sans-serif/serif difference at body size is acceptable and expected.

CJK punctuation: full-width marks inherit Noto Serif SC's built-in spacing. Do not adjust letter-spacing on CJK text. For mixed-script bylines and metadata (e.g., "作者: Author Name"), use Noto Serif SC for CJK characters and IBM Plex Sans for Latin, with colon in the script of the preceding character.

For right-to-left scripts: text alignment mirrors to right, card layout remains centered, and the vignette remains centered — the cinematic frame is culturally universal.
