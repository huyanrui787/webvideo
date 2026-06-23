---
version: 1
name: Monochrome Print
description: Minimalist print light — ink blue accent on warm off-white, 1px hairline rules, refined 4px radius, the beauty of absence
colors:
  shell: "#f5f3ee"
  surface: "#fbfaf6"
  surface-2: "#f5f2ec"
  text: "#0a0a0a"
  text-2: "#2a2a2a"
  text-mute: "#5a5a5a"
  text-faint: "#8a8a8a"
  accent: "#1d4ed8"
  accent-soft: "rgba(29,78,216,0.06)"
  accent-glow: "rgba(29,78,216,0.15)"
  rule: "#d8d4cc"
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
    fontFamily: "Source Serif 4"
    fontWeight: 600
  body:
    fontFamily: "Source Serif 4"
    fontWeight: 400
  mono:
    fontFamily: "IBM Plex Mono"
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
    description: THE definitive component. 1px solid hairline in warm gray — this rule carries the entire structural system. Every content boundary, every section break, every header-body separation uses this exact rule. It is the only line weight and style in the theme. Its consistency IS the aesthetic
  card:
    borderRadius: var(--r-card)
    background: surface-2
    boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
    description: Subtly lifted card — barely perceptible shadow (3% opacity, 2px blur), 4px refined radius. The card is so subtle that a viewer might not consciously register it as a separate plane. It exists at the threshold of perception
  hero-num:
    font: display-en italic
    color: accent
    weight: 600
    description: Source Serif 4 600 italic with tabular figures. Chapter numbers, page references, data callouts. The italic carries the literary voice within the restrained framework. Tabular figures for numerical dignity
  stage-decoration:
    description: None. No pattern, no vignette, no gradient, no grain, no texture, no glow. The absence IS the signature. The stage is a warm off-white void that content floats in — the negative space is the decoration
---

## Overview

Monochrome Print is the highest-formality theme in the system. It was built for deep reading, academic content, brand heritage stories, cultural commentary, and any context where the content must speak without the designer's hand being visible. The emotional register is considered neutrality — like a well-edited literary journal or a museum catalog. Nothing shouts. Nothing glows. Nothing competes. Every element on stage must justify its existence through necessity, not decoration.

This theme is for high-density, text-heavy content. It handles paragraphs, footnotes, pull quotes, and extended reading comfortably. But it is NOT for pitches, NOT for entertainment, NOT for emotional persuasion, NOT for casual content, and NOT for anything that needs to feel dynamic or exciting. Monochrome Print is the theme you choose when you believe the ideas are interesting enough to survive without graphic support.

Source Serif 4 carries both display (600 weight) and body (400 weight) in a unified serif voice — there is no second Latin type family. This is the only monotype theme in the system. The singular voice creates an unbroken reading surface where hierarchy is established through weight, size, and spatial positioning alone. IBM Plex Mono provides the data layer. Ink blue (#1d4ed8) is the only color beyond grayscale — a deep, unsaturated blue that reads as "the other ink," not as an accent. The absence of decoration is the defining feature: no pattern, no vignette, no gradient, no texture. The beauty is in the restraint.

## Colors

### Palette

- **Shell (#f5f3ee)** — Warm off-white with a hint of gray. The stage background. Slightly darker than surface to provide subtle stage definition. The color of uncoated book paper — not cream, not white, but a considered neutral between them.
- **Surface (#fbfaf6)** — Very warm near-white. Primary card and content surface. The color of premium book stock — white enough to read as white, warm enough to feel physical. This is the reading surface.
- **Surface-2 (#f5f2ec)** — Slightly darker warm off-white. Used for cards, pull quotes, and secondary content areas. The difference from surface is subtle — typically 2-3% luminance — just enough to register under scrutiny.
- **Text (#0a0a0a)** — Near-black ink. Not pure #000 — real printing ink on real paper has depth, not absolute black. This 96% black preserves the organic print quality while providing maximum readability.
- **Text-2 (#2a2a2a)** — Dark gray. Secondary text, supporting paragraphs, deck copy. Close enough to primary text to maintain the monochrome character, distinct enough to establish information hierarchy.
- **Text-Mute (#5a5a5a)** — Medium gray. Bylines, captions, footnotes, page references. The gray of scholarly apparatus — essential but subordinate.
- **Text-Faint (#8a8a8a)** — Light gray. Page numbers, section markers, decorative structural elements. At the edge of noticeability, by design.
- **Accent (#1d4ed8)** — Ink blue. NOT a bright accent — this is "the other ink color." A deep, unsaturated blue with significant black in its mix. Sits at roughly 225 degrees on the hue wheel with heavily reduced saturation and luminance. This blue means "scholarly reference" or "editorial markup" — it is the color of a blue pencil used by an editor, not a highlighter used by a student.
- **Accent-Soft (rgba(29,78,216,0.06))** — Barely perceptible blue tint. For hover backgrounds and subtle data highlighting. At 6% opacity, it reads as a warmth shift, not a color.
- **Accent-Glow (rgba(29,78,216,0.15))** — Accent at maximum intensity. For interactive focus indicators and link underlines. Still subdued — this theme does not glow.
- **Rule (#d8d4cc)** — Warm gray hairline. THE structural color. The 1px rule is the only non-typographic element that appears throughout the theme. Its color is calibrated to be visible enough to organize content but recessive enough to never be the thing you look at.

### Defaults

- Body text against surface (#fbfaf6) always uses text (#0a0a0a). The black-on-white print relationship is the foundation.
- Body text against surface-2 (#f5f2ec) uses text (#0a0a0a). The slightly darker surface does not change text color — monochrome consistency.
- Accent (#1d4ed8) touches: hero numbers (italic), hyperlinks within text, active navigation indicators, chart data series, editorial markup. Accent in Monochrome Print signals a reference — a pointer to more, not a decorative highlight.
- Accent never touches: body paragraphs, headlines (headlines are always text color), dividers (always rule color), card backgrounds, or any text element longer than 5 words.
- The 1px rule (#d8d4cc) is the only permitted divider. Its color, weight, and style are invariant.
- Pure white (#ffffff) is prohibited. Even the lightest surface (#fbfaf6) is warm. Pure white adjacent to warm off-white reads as a different medium.

## Typography

### Font Family

- **Source Serif 4 (600, 600 italic, 400, 400 italic)** — The complete Latin voice. A refined serif typeface designed for extended reading with excellent screen rendering. 600 weight for all headlines and display text — the SemiBold provides sufficient presence without the drama of a 700 Bold. 600 italic for hero numbers, pull quotes, and editorial emphasis. 400 for body text — light enough for comfortable extended reading, substantial enough for clarity. 400 italic for book titles, foreign terms, and academic convention. This is the only Latin type family in the theme — the monotype approach is intentional and defining.
- **IBM Plex Mono (500)** — The data voice. Statistics, code, numerical tables, technical specifications. Provides the only typographic contrast in the theme — the shift from serif to mono signals "this is data, not prose."
- **Noto Serif SC (700)** — The CJK voice. Chinese/Japanese/Korean display and body text. Serif CJK is essential — it preserves the literary, academic character across scripts. A sans-serif CJK font would introduce a modernist quality that contradicts the theme's considered traditionalism.

### Type Scale

- **Display (64–88px)**: Source Serif 4 600. Headlines, chapter titles, section openers. Line-height: 1.15. Never in accent color — headlines are always text (#0a0a0a).
- **H1 (40–56px)**: Source Serif 4 600. Primary headings. Line-height: 1.2.
- **H2 (28–36px)**: Source Serif 4 600. Subheads, card titles. Line-height: 1.3.
- **H3 (20–24px)**: Source Serif 4 600. Card interior headings, sidebar titles. Line-height: 1.35.
- **Body (16–18px)**: Source Serif 4 400. Body copy. Line-height: 1.6 — generous for extended reading, as print demands. The reading experience is the priority.
- **Caption (14–16px)**: Source Serif 4 400. Captions, footnotes, supporting text. Line-height: 1.5.
- **Label (12–14px)**: Source Serif 4 600. Bylines, datelines, navigation, page references. Letter-spacing: +0.04em for all-caps labels. Small caps (via font-variant) preferred over all-caps where the font supports it.
- **Mono (14–16px)**: IBM Plex Mono 500. Data tables, code, numerical references. Line-height: 1.6.

### Signature Treatments

- Headlines are always Source Serif 4 600 in text color (#0a0a0a). Never accent. Never italic (italic is for emphasis within body, not for structural headlines). The headline's authority comes from size and the serif's refined stroke contrast, not from color.
- Hero numbers are Source Serif 4 600 italic in accent (#1d4ed8). Always tabular figures (tnum). Chapter numbers, page references, data callouts. The italic carries the literary voice — this is the voice of a footnote that demands attention.
- Pull quotes use Source Serif 4 400 italic at 24–32px, text-2 (#2a2a2a), centered or indented. The italic distinguishes the human voice from the institutional prose. A 1px rule above and below frames the quote.
- The 1px rule (#d8d4cc) separates every content boundary. Headline from body, body from footer, article from sidebar. The rule IS the layout system — it is the only divider, the only structural element, the only non-typographic component.
- Mono elements are for data only — never for labels, never for navigation, never for body text. The shift to mono signals a shift in content mode: prose to data.

### Typography Principles

- Single type family for Latin: Source Serif 4 handles every Latin typographic role from 88px display to 12px labels. This is unique among the themes and is the core typographic discipline. Hierarchy comes from weight (600 vs 400), style (roman vs italic), size, and spatial position — never from typeface change.
- Line-height is generous: 1.6 for body text. Extended serif reading on screens demands more leading than sans-serif. The theme prioritizes reading comfort over information density.
- Maximum 2 typefaces visible simultaneously: Source Serif 4 + IBM Plex Mono. On text-only slides, only Source Serif 4 appears — the pure monotype experience.
- Italic usage is strictly semantic: (a) emphasis within body text (400 italic), (b) pull quotes and editorial voice (400 italic), (c) hero numbers (600 italic), (d) book titles, foreign terms, and academic conventions (400 italic). Never use italic decoratively — every italicization must have a grammatical or semantic justification.
- Letter-spacing: 0 for body and most display. -0.01em for display above 64px (mild optical tightening for serif). +0.04em for labels. Never exceed +0.06em.
- Small caps (via font-variant: small-caps) are preferred over all-caps for labels and bylines. Source Serif 4 supports true small caps — use them.

## Layout

### Canvas System

The stage is 1920x1080. Monochrome Print uses a centered, single-column layout with clear, unadorned structure. Content is organized by rules, not by cards or panels. The headline sits atop the content area; a 1px rule separates it from body text; body text flows in a single column; a 1px rule may separate body from footer. This is the layout of a printed page adapted to the stage — no columns (unless in a two-article comparison), no grid, no modular panels. Just text in space, organized by hairline rules.

The stage background is shell (#f5f3ee), providing a subtle frame around the slightly lighter surface (#fbfaf6) content area. The difference between shell and surface is minimal — perhaps 2% luminance — creating an ambient frame rather than an explicit border.

### Padding and Gap Scale

- Stage padding: 96px horizontal, 80px vertical. Standard padding — the content needs room to breathe but the layout doesn't demand the cinematic generosity of Midnight Press.
- Content area maximum width: 800px. Body text should never span the full 1728px content width — a reading-friendly measure is essential for a text-focused theme. The 800px content column is centered within the stage padding.
- Card internal padding: 40px horizontal, 32px vertical. Cards are used sparingly — they exist for content that genuinely needs to separate from the main text flow.
- Gap between headline and rule: 16px.
- Rule: 1px.
- Gap between rule and body: 24px.
- Gap between body paragraphs: 16px. Paragraphs are sequential thoughts — the gap is minimal.
- Gap between body and footer rule: 32px.
- Navigation zone: bottom 48px, containing page reference (right) and section title (left), separated by a centered 1px rule.

### Key Layout Patterns

- **Standard Page (default)**: Headline in Source Serif 4 600, 40–56px. 1px rule. Body text in Source Serif 4 400 at 16–18px, single column, 800px max width. Optional footer with page reference. This is the default layout for text content.
- **Chapter Opener**: Chapter number in Source Serif 4 600 italic, accent, 72–96px. Chapter title below in Source Serif 4 600, text, 48–64px. 1px rule. Optional epigraph in Source Serif 4 400 italic, text-2. Generous space above and below. The section-break slide.
- **Pull Quote Page**: Centered pull quote in Source Serif 4 400 italic at 32–40px, text-2. 1px rule above and below, spanning 400px centered. Attribution below in Source Serif 4 600 at label size, text-mute. Nothing else on stage. The editorial punctuation slide.
- **Data + Text**: Left-aligned body text occupying 60% of the content area. Right-aligned data panel in IBM Plex Mono on a surface-2 card occupying 30%. 1px rule separating them. The scholarly article-with-figures layout.
- **Footnote Cascade**: Body text in primary position. Footnote references (superscript numbers in accent) link to footnote text at the bottom of the content area, separated by a 1px rule spanning 25% of the content width, left-aligned. The academic paper layout.

## Depth and Elevation

Shadow philosophy: threshold-of-perception. Monochrome Print rejects visible depth. Cards use the barest possible shadow — 3% opacity, 2px blur — that a viewer will not consciously register. The shadow exists to satisfy the technical requirement of distinguishing a card from its background; aesthetically, the theme reads as completely flat. This is the printed page: ink on paper has no depth, only color contrast.

- Default card shadow: `0 1px 2px rgba(0,0,0,0.03)` — 3% opacity. At this level, the shadow is subliminal. Remove it and the card feels slightly wrong; keep it and nobody sees it.
- No card ever exceeds this shadow intensity. No hover elevation. No interactive lift.
- No text shadows on any element. No glow effects of any kind. Even accent-glow is used only for interactive indicators, never for static content.
- No glass morphism, no backdrop blur, no transparency effects.
- The only visual separation tools are: color contrast (surface vs surface-2, 2-3% luminance difference) and the 1px rule (#d8d4cc). These two tools constitute the entire depth vocabulary.

## Signature Elements

1. **The 1px Rule**: A single hairline in #d8d4cc. 1px solid. No other width, no other style, no other color. This rule organizes every slide — between headline and body, between body and footer, between articles, between text and data. Its absolute consistency is the design system. The rule says "this content is structured" without saying "look at me." It is the invisible hand of the editor.

2. **The Monotype Voice**: Source Serif 4 is the only Latin type family. Display, headlines, subheads, body, captions, labels — all Source Serif 4. The hierarchy is built entirely through weight (600 vs 400), style (roman vs italic), size, and space. No second typeface provides contrast or relief. This is the most disciplined typographic system in any theme — and the most distinctive because of it.

3. **The Absence of Decoration**: No pattern. No vignette. No gradient. No texture. No grain. No glow. No neon. No shadow (visible). The stage is a warm off-white field that content sits in. Every decorative element that exists in other themes has been deliberately, conspicuously removed. The absence is the aesthetic. When everything else is gone, what remains — the typography, the rules, the spacing — must be perfect, because there is nothing else to look at.

## Do's and Don'ts

### Do

1. Use the 1px rule (#d8d4cc, solid) between every semantic section. It is the only structural element — use it consistently and pervasively.
2. Use Source Serif 4 for every Latin typographic element. Display, headline, body, caption, label — one family, one voice.
3. Use the accent color (#1d4ed8) only for: hero numbers (italic), hyperlinks, editorial markup references, and data series in charts. Maximum 4 occurrences per slide.
4. Maintain body text within a maximum 800px column width, centered in the stage. Wider text degrades reading comfort and betrays the print metaphor.
5. Use tabular figures (tnum) for all numerical data including hero numbers. Tabular figures are the typographic signal of information credibility.
6. Set body text line-height to exactly 1.6. The reading experience is the priority — this leading is non-negotiable.
7. Use the chapter opener layout (hero number + title + rule) consistently at section boundaries to establish rhythm.
8. Separate the byline from the headline with a 1px rule on every authored content slide. The byline is Source Serif 4 600 at label size, text-mute.
9. Use IBM Plex Mono 500 for all data tables, statistics, and code. The mono signals a content mode shift from prose to data.
10. Render all CJK text in Noto Serif SC — 700 for headlines and display, 400 for body. The serif character must carry across scripts.

### Don't

1. Never introduce a second Latin type family. Source Serif 4 is the only voice. Adding a sans-serif for "contrast" destroys the monotype discipline.
2. Never use a box-shadow stronger than the defined card shadow (3% opacity). Visible shadows belong to other themes.
3. Never use the accent color (#1d4ed8) for headlines, body text, or any text element longer than 5 words. Accent is for reference, not for voice.
4. Never add a pattern, texture, vignette, gradient, or grain to the stage. The absence of decoration is the defining aesthetic.
5. Never use a rule that is not exactly 1px solid #d8d4cc. No 2px rules, no dashed rules, no accent-colored rules, no double rules.
6. Never use pure white (#ffffff) or pure black (#000000). The off-white and near-black are calibrated for the print metaphor.
7. Never use italic decoratively. Every italicization must have grammatical or semantic justification — emphasis, citation, foreign term, editorial voice, or hero number.
8. Never use Source Serif 4 below 400 weight. The Regular (400) is the minimum — lighter weights available in the font file are prohibited for readability.
9. Never center-align body text. Center is for chapter openers and pull quotes only. Body text is left-aligned, rag right.
10. Never use drop caps. Drop caps are a narrow-column print convention — at slide scale they create awkward spacing and break the reading rhythm.
11. Never stretch body text beyond 800px width. If the content area is wider, increase side margins — do not widen the text column.
12. Never use a non-serif font for CJK content. Noto Serif SC is the only CJK font — a sans-serif CJK font would introduce modernism into a theme defined by its considered traditionalism.

## CJK & International Content

Chinese, Japanese, and Korean text uses Noto Serif SC at 700 weight for display and 400 for body. The serif character is essential — Monochrome Print's identity is built on the literary, academic, print-traditional character that only serif type can provide. A sans-serif CJK font would introduce a modernist, digital quality that contradicts every design decision in the theme.

CJK line-height minimum is 1.8 (compared to 1.6 for Latin body). CJK characters require proportionally more leading due to their higher information density per character and their square em-box proportions. The leading should feel generous but not wasteful — the same considered spacing that defines the Latin typography.

CJK italic does not exist. Monochrome Print uses italic extensively for semantic purposes: emphasis, pull quotes, hero numbers, citations. In CJK-only contexts, compensate through: (a) accent color on key phrases (the "editorial markup" semantic), (b) weight shift from 400 to 700 for emphasis within body (equivalent to italic emphasis), and (c) spatial isolation — a centered, isolated CJK phrase carries the voice-weight of an italic pull quote. The hero number treatment (600 italic in Latin) becomes Noto Serif SC 700 in accent color for CJK chapter numbers.

Mixed Latin-CJK body text: Source Serif 4 handles Latin portions. Noto Serif SC handles CJK portions. Both are serif; both are designed for extended reading; both have compatible color (stroke density) at body sizes. Punctuation follows the script of the preceding character. The transition between scripts should be invisible to the reader — if the reader notices the font change, the typesetting has failed.

CJK punctuation: full-width marks use Noto Serif SC's built-in metrics without adjustment. Do not add letter-spacing to CJK text — the character grid provides inherent rhythm that added spacing would destroy. For mixed-script labels (e.g., "第三章 / Chapter 3"), use Noto Serif SC 700 for CJK, Source Serif 4 600 for Latin, with the slash in text-mute as script transition.

Small caps: Source Serif 4 supports true small caps for Latin labels. Noto Serif SC does not support small caps for CJK — CJK label treatment should use the full-size character at the label scale rather than simulated small caps. This is an acceptable script-level variation.

For right-to-left scripts: text alignment mirrors to right. The 1px rule remains left-aligned (or right-aligned in RTL context) at 25% content width for footnote separators. The content area maximum width of 800px is maintained — reading measure discipline is script-independent.
