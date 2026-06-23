---
version: 1
name: Bold Signal
description: Hero pitch-deck dark — a single hot orange focal card against a dark gradient backdrop
colors:
  shell: "#0c0c0c"
  surface: "#1a1a1a"
  surface-2: "#242424"
  text: "#f5f5f5"
  text-2: "#c4c4c4"
  text-mute: "#7a7a7a"
  text-faint: "#4a4a4a"
  accent: "#ff5722"
  accent-soft: "rgba(255,87,34,0.12)"
  accent-glow: "rgba(255,87,34,0.35)"
  rule: "#2a2a2a"
color-aliases:
  c-bg: shell
  c-bg-card: surface
  c-fg: text
  c-fg-mute: text-mute
  c-accent: accent
typography:
  display-cn:
    fontFamily: "Noto Sans SC"
    fontWeight: 700
  display-en:
    fontFamily: "Archivo Black"
    fontWeight: 900
  body:
    fontFamily: "Space Grotesk"
    fontWeight: 400
  mono:
    fontFamily: "JetBrains Mono"
    fontWeight: 500
spacing:
  stage-pad-x: "96px"
  stage-pad-y: "80px"
components:
  rule:
    width: 100%
    height: 1px
    style: solid
    background: rule
    description: Thin hairline divider, barely perceptible against dark surfaces. Used sparingly — only to separate navigation chrome from content, never between content blocks
  card:
    borderRadius: var(--r-card)
    background: surface-2
    boxShadow: "0 4px 24px rgba(0,0,0,0.4)"
    description: Dark elevated card. The accent-colored variant (background: accent with text: shell) is the SIGNATURE focal card — the one card on stage that demands attention. Maximum one accent card per slide
  hero-num:
    font: display-en
    color: accent
    weight: 900
    description: Archivo Black at 900 weight, tabular figures, rendered in hot orange. Section numbers, counters, and big-data callouts. Use tnum OpenType feature for tabular spacing
  stage-decoration:
    description: Diagonal dark gradient anchored from bottom-left to top-right. shell base with a linear-gradient at 145deg transitioning into surface, creating directional tension. No pattern overlay — the gradient IS the texture
---

## Overview

Bold Signal is the pitch-deck theme. It was built for the moment when you have twelve seconds and three words to land. The emotional register is confidence without arrogance — a single hot orange focal card floating in a dark, directional gradient that pulls the eye diagonally across the stage. Everything here is designed for low density: one big idea per slide, delivered at maximum typographic weight. The stage is sparse by design. Negative space is not a byproduct; it is the active ingredient that gives the focal card its power.

This theme is NOT for long-form reading, NOT for data-dense tables, NOT for multi-column layouts, and NOT for anything that needs to feel soft, approachable, or conversational. It is a blunt instrument for declarative statements. Archivo Black at 900 weight carries the voice — there is no font on this stage that speaks louder. Space Grotesk handles everything else, receding into clean support with its geometric neutrality. Tabular section numbers in hot orange anchor the navigation, telling the audience exactly where they are in the arc.

The signature move is the accent-colored focal card: a single surface-2 card that flips its background to #ff5722 and its text to #0c0c0c, creating a thermal event on an otherwise cool-dark stage. Use it once per slide. Use it for the thing you want nobody to miss. If everything is orange, nothing is orange. The discipline of restraint is what makes Bold Signal work — every element on stage must justify its existence against the gravitational pull of negative space.

## Colors

### Palette

- **Shell (#0c0c0c)** — Deep near-black, warmer than #000 but cooler than charcoal. The stage floor. Never used as a surface fill — it is the void everything else sits on. At 95% black, it preserves enough warmth to avoid the cold sterility of pure black.
- **Surface (#1a1a1a)** — Dark card gray, just lifted enough from shell to register as a distinct plane. Primary card background. The 6% luminance difference from shell is intentional: enough to separate, not enough to distract.
- **Surface-2 (#242424)** — Slightly lighter dark gray. Used for nested cards, hover states, and the default card background before the accent flip. The baseline card color against which the accent card contrasts.
- **Text (#f5f5f5)** — Warm off-white, intentionally NOT pure #fff. Pure white blows out against dark backgrounds at display sizes; this 96% white reads as white while preserving contrast comfort and avoiding halo artifacts on OLED and high-contrast displays.
- **Text-2 (#c4c4c4)** — Secondary text. Supporting body copy, descriptions, metadata. Still readable at body sizes but clearly subordinate to primary text. Luminance sits at roughly 77%, creating a clear step down from text.
- **Text-Mute (#7a7a7a)** — Tertiary text. Labels, captions, timestamps. Intentionally low contrast — these elements are for chrome, not content. Should be legible but never draw attention away from body copy.
- **Text-Faint (#4a4a4a)** — Quaternary text. Only for decorative elements, grid line labels, placeholder indicators, and disabled states. Near the threshold of legibility against dark surfaces — use at minimum 14px.
- **Accent (#ff5722)** — Hot orange. The ONLY warm color on stage. Sits at roughly 15 degrees on the hue wheel — redder than amber, warmer than vermillion. This is the signal in "Bold Signal." It must dominate every other color on stage through sheer thermal contrast against the cool-dark backdrop.
- **Accent-Soft (rgba(255,87,34,0.12))** — Translucent accent for hover backgrounds, selection indicators, subtle accent washes on cards that are NOT the focal card. Low enough opacity to tint without competing.
- **Accent-Glow (rgba(255,87,34,0.35))** — Accent at glow intensity. For text-shadows on hero numbers, focus rings, and the accent card's subtle outer glow. Strong enough to read as luminous, transparent enough to avoid garishness.
- **Rule (#2a2a2a)** — Dark divider. Barely visible against surface/surface-2 — a structural element, not a visual one. Its job is to separate without announcing itself.

### Defaults

- Body text against surface/surface-2 always uses text (#f5f5f5). Never text-2 for primary body copy.
- Body text against the accent focal card always uses shell (#0c0c0c) — never white, never text-2. The maximum contrast on the accent card must feel grounded, not inverted.
- Accent color touches: focal cards (full fill), hero numbers, section markers (01, 02, 03), active nav indicators, key action buttons or CTAs. These are the ONLY elements allowed to use accent.
- Accent color never touches: body paragraphs, secondary labels, muted chrome, any text smaller than 16px, links within running text, or any element that appears more than once per slide.
- Text-mute is the default label color. Text-faint is the default chrome and decoration color.
- Never use pure white (#ffffff) for any text, border, or fill. Always step down to #f5f5f5.
- The rule color (#2a2a2a) is the only permitted divider color. Never use accent as a divider.

## Typography

### Font Family

- **Archivo Black (900)** — The voice. Display only. Headlines, hero numbers, slide titles. Never at sizes below 36px. Never for more than 12 words. This font IS the brand on this theme. Its massive x-height and tight aperture command attention without shouting. Every letterform is built for impact at scale.
- **Space Grotesk (400/500/700)** — The substance. Body copy, labels, navigation, metadata. Geometric sans-serif with a neutral, technical character that recedes cleanly against Archivo Black's dominance. Its job is to be invisible — if the audience notices the body font, the hierarchy has failed. Use 400 for body, 500 for labels and kickers, 700 for subheads that are not important enough for Archivo Black.
- **JetBrains Mono (500)** — The metadata. Code snippets, numerical data, tabular information, technical labels, file paths. Monospace rigor for technical credibility. Its taller x-height and distinct letterforms ensure code remains readable at small sizes even on dark backgrounds.
- **Noto Sans SC (700)** — The CJK voice. Chinese/Japanese/Korean display text. Matches Archivo Black's weight and confidence for mixed-language slides. Sans-serif geometry aligns with Space Grotesk's character while carrying sufficient weight for display hierarchy.

### Type Scale

- **Display (96–144px)**: Archivo Black 900. Headline wordmark. One per slide maximum. Line-height: 1.1. Letter-spacing: -0.02em for optical tightening at large sizes.
- **H1 (48–64px)**: Archivo Black 900. Section titles, major declarations. Line-height: 1.15.
- **H2 (32–40px)**: Archivo Black 900 or Space Grotesk 700. Subheads, card titles. Line-height: 1.25.
- **H3 (24–28px)**: Space Grotesk 700. Card interior headings. Line-height: 1.3.
- **Body (18–22px)**: Space Grotesk 400. Body copy. Line-height: 1.5 minimum, 1.6 preferred.
- **Caption (14–16px)**: Space Grotesk 400. Supporting text, descriptions, metadata. Line-height: 1.5.
- **Label (12–14px)**: Space Grotesk 500. Kickers, tags, navigation chrome, section markers. Letter-spacing: +0.08em when all-caps.
- **Mono (14–18px)**: JetBrains Mono 500. Code, numbers, technical data. Line-height: 1.6.

### Signature Treatments

- Hero numbers are ALWAYS Archivo Black 900 in accent color (#ff5722). Always tabular figures (tnum OpenType feature enabled). Always large (120px minimum). Never inline with body text — always isolated in their own block.
- Italic in this theme does not exist. Archivo Black has no italic variant. Space Grotesk italic is prohibited — it undermines the geometric rigor that defines the theme's visual character. Emphasis is achieved through weight, color, or scale, never slant.
- All-caps labels (kickers, section markers, navigation items) are Space Grotesk 500 with exactly +0.08em letter-spacing. Never use Archivo Black for all-caps at label sizes — it becomes a solid black rectangle.
- Mono is ONLY for code snippets, numerical tables, file paths, terminal output, and technical metadata. Never for body copy. Never for labels. Never for navigation.
- Under 36px, Archivo Black must never appear. Below this threshold, its tight aperture and extreme weight cause letterform collapse, especially on dark backgrounds where halation exaggerates the problem.

### Typography Principles

- Maximum 2 typefaces visible simultaneously on any given slide (display + body, or body + mono). Never all three. The third typeface may exist in the theme but must not co-occur.
- Line-height minimum 1.5 for all body text. Display text can use 1.1–1.2 for single-line headlines; 1.3 for two-line headlines.
- Letter-spacing: 0 for body text, -0.02em for display text above 64px (optical tightening at large sizes), +0.08em for all-caps labels.
- Font-weight contrast is the primary hierarchy tool — size alone is insufficient. The 500-weight gap between Archivo Black 900 and Space Grotesk 400 creates unambiguous visual hierarchy even when both are at similar sizes.
- Never faux-bold any font. Use only the weights configured in the theme. If a weight does not exist in the font file, do not simulate it with CSS.

## Layout

### Canvas System

The stage is 1920x1080 pixels. Bold Signal uses a centered, single-column layout philosophy with generous negative space. Content gravity is center-weighted — the focal card sits at the visual center, which is approximately 5% above geometric center to account for the bottom-third weight of navigation chrome. The diagonal gradient background (linear-gradient at 145deg from shell to surface) provides directional energy without competing with content — the eye is pulled diagonally but the content remains stable at center.

Multi-column layouts are prohibited in the general case. Two-column layouts are permitted ONLY for explicit comparison slides (before/after, problem/solution, then/now), and only when both columns use identical card treatment — neither column gets the accent card. The accent in comparison slides is reserved for a verdict indicator, arrow, or connector between the columns.

### Padding and Gap Scale

- Stage padding: 96px horizontal, 80px vertical. Generous but not cinematic — this is a pitch deck, not a film. The padding must feel ample but never wasteful.
- Card internal padding: 48px horizontal minimum, 40px vertical minimum. Cards must breathe. Content touching card edges signals crowding.
- Gap between adjacent cards (horizontal or vertical): 24px. Consistent and unvaried.
- Gap between headline and body text: 32px. This gap is structural — it separates the declarative from the explanatory.
- Gap between body text and action/label: 16px. Tighter, indicating association.
- Navigation chrome zone: bottom 64px of the stage, starting 80px from the bottom edge. This 64px band is the only permitted location for slide numbers, progress indicators, and section markers.

### Key Layout Patterns

- **Centered Hero (default)**: Single focal card, vertically and horizontally centered. Headline either above the card or integrated as the card's top content. One supporting line below. Generous negative space on all sides — minimum 400px clear space in every direction from card edge to stage edge.
- **Split Comparison**: Two equal-width cards side by side with exactly 24px gap. Both cards use surface-2 (never accent). Accent is reserved for a connector element between them — an arrow, a vs marker, a delta indicator. Used exclusively for before/after, problem/solution, and competitive comparison slides.
- **Big Number**: Hero number in accent at 144–200px, perfectly centered both horizontally and vertically. One-word or short-phrase label below in Space Grotesk 400, text-2 color. Nothing else on stage. No card — the number floats directly on the gradient background.
- **Stacked Cards**: Maximum 3 cards in a vertical stack, center-aligned horizontally. The top card MAY be the accent focal card. Cards below are surface-2. Each card carries one idea. The stack communicates sequence, priority, or hierarchy.
- **Title + Body**: Single headline in Archivo Black, single paragraph of body text below in Space Grotesk. No card. Used for title slides and section dividers.

## Depth and Elevation

Shadow philosophy: paper-lifted. Cards sit 4–8px above the stage with soft, dark, directional shadows. The effect is of heavyweight paper stock resting on a dark table, lit from above-left. The accent focal card uses a subtle accent-glow box-shadow in addition to the elevation shadow, creating a thermal halo — as if the card is warm to the touch, radiating heat into the cool dark. No glass morphism. No heavy blur. No neon. No drop-shadow on text elements.

- Default card shadow: `0 4px 24px rgba(0,0,0,0.4)` — soft, deep, ambient occlusion feel.
- Accent focal card shadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 40px rgba(255,87,34,0.15)` — same elevation plus warm halo.
- No shadows on text elements. No text-stroke. No filter: drop-shadow().
- Hovered/interactive cards may elevate to `0 8px 32px rgba(0,0,0,0.5)` to indicate interactivity, but this is only relevant for interactive preview contexts.

## Signature Elements

1. **Accent Focal Card**: A single surface-2 card that inverts to accent-fill (#ff5722) with dark text (#0c0c0c). This is the primary visual event on every slide. It is the reason this theme exists. Everything else on stage exists to support the focal card or to provide breathing room around it. Maximum one per slide. Never adjacent to another accent element.

2. **Diagonal Gradient Backdrop**: A linear gradient from bottom-left to top-right at 145 degrees, transitioning shell into surface. Creates directional energy — the eye moves upward and rightward, the natural reading direction for forward momentum. The gradient is subtle (shell to surface is only a 6% luminance shift) but directional. It must never be reversed (315deg) within a single deck — consistency of direction is part of the theme's identity.

3. **Tabular Section Numbers**: Hero numbers in Archivo Black 900 at 120–200px, rendered in accent orange (#ff5722). Section numbers (01, 02, 03...) or data callouts (85%, 3.2x, $14M). Always use tnum OpenType feature for monospaced tabular figures. Always isolated from body text — they occupy their own visual space as graphic elements, not as text. The section number tells the audience where they are; the data callout tells them what matters.

## Do's and Don'ts

### Do

1. Use exactly one accent focal card per slide. Place it where you want the audience looking first — typically center or center-top.
2. Keep headlines under 12 words. Archivo Black 900 at display sizes is not built for sentences — it is built for declarations.
3. Use tabular figures (tnum OpenType feature) for all numerical data. Proportional figures destroy the geometric alignment that makes numbers credible.
4. Maintain at least 500px of clear space around the focal card in all directions. Negative space is the active ingredient that gives the card its power.
5. Use section numbers (01, 02, 03) in the bottom navigation zone to anchor the deck's narrative arc and give the audience a sense of progression.
6. Pair every accent focal card slide with at least one surface-2-only card slide adjacent in the sequence, creating a contrast rhythm of thermal/cool/thermal/cool.
7. Keep the diagonal gradient direction at 145deg across an entire deck. Consistency of direction builds subliminal momentum.
8. Limit body text to 3 lines maximum per card. If the idea needs more text, it needs another card or another slide.
9. Use Space Grotesk 500 with exactly +0.08em letter-spacing for all all-caps kickers, labels, and chrome text.
10. Render all CJK headlines in Noto Sans SC 700 — it matches Archivo Black's weight presence and maintains the theme's bold character across scripts.

### Don't

1. Never use more than one accent-colored card on screen simultaneously. Two accent cards cancel each other out and destroy the focal point.
2. Never use pure white (#ffffff) for any text, border, or fill anywhere in the theme. Use #f5f5f5 as the maximum white.
3. Never use Archivo Black at sizes below 36px. It was not designed for small sizes — letterforms collapse, counters close, and legibility fails, especially on dark backgrounds.
4. Never place body text directly on the shell (#0c0c0c) background without a card beneath it. Body text needs a surface to sit on.
5. Never use the accent color (#ff5722) for body paragraphs, inline links within body text, or any continuous reading text longer than 3 words.
6. Never add a secondary pattern, texture, or noise overlay to the stage background. The diagonal gradient IS the texture. Additional decoration dilutes the theme's clarity.
7. Never exceed 3 cards on a single slide. Four or more cards violates the low-density principle and makes individual cards too small to carry meaning.
8. Never center-align body text that spans more than 2 lines. Center-alignment is for headlines and single-line statements. Body text is always left-aligned (or right-aligned for RTL scripts).
9. Never use italic styling on any element. Archivo Black has no italic. Space Grotesk italic is configured as prohibited. Emphasis comes from weight, color, or scale — never slant.
10. Never mix Archivo Black and Space Grotesk within a single text block or heading. One typeface per semantic element. A headline is Archivo Black; its subhead may be Space Grotesk 700 as a separate element.
11. Never use the accent color as a divider, border, or rule. Rules are always #2a2a2a. Accent is for content, not structure.
12. Never place two accent elements adjacent without at least 200px of neutral space between them. Accent elements repel each other visually.

## CJK & International Content

Chinese, Japanese, and Korean text uses Noto Sans SC at 700 weight for display, matching the visual weight and presence of Archivo Black 900. For CJK body copy, use Noto Sans SC at 400 weight — there is no CJK serif body font in this theme, as Bold Signal's geometric sans-serif character is fundamental to its identity and carries through all scripts.

CJK line-height must be minimum 1.75 (compared to 1.5 for Latin body text). CJK characters occupy square em-boxes and require more vertical breathing room to maintain readability at body sizes. This is non-negotiable — Latin line-height values applied to CJK text produce cramped, illegible blocks.

CJK characters have no italic variant in any font. Since Bold Signal prohibits italic entirely, this is naturally consistent — emphasis in CJK is achieved through color (accent) or weight shift (400 to 700), never through faux-italic simulation.

Mixed Latin-CJK layouts: when a headline contains both Latin and CJK characters, use Noto Sans SC for the entire headline to ensure consistent x-height, stroke weight, and vertical alignment. Archivo Black and Noto Sans SC must never appear in the same headline — they have fundamentally different proportions, x-heights, and stroke contrasts that create jarring disharmony when adjacent.

CJK punctuation: full-width punctuation inherits the font's built-in spacing and must not receive additional letter-spacing. The CJK character grid provides inherent rhythm — adding letter-spacing destroys it. For mixed-script labels (e.g., "第03章 / Chapter 03"), use Space Grotesk for the Latin portion and Noto Sans SC for the CJK portion, separated by a slash rendered in text-mute. The slash serves as a script-transition marker.

For right-to-left scripts (Arabic, Hebrew): text-2 color is the default, left-alignment is replaced with right-alignment, and the diagonal gradient direction should NOT be mirrored — it remains 145deg to maintain deck-level consistency. Card padding remains symmetric.
