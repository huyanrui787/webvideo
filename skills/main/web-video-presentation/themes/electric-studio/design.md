---
version: 1
name: Electric Studio
description: Clean corporate light with a single electric-blue accent — B2B polish, bottom-bar signature, white-stage clarity
colors:
  shell: "#0a0a0a"
  surface: "#ffffff"
  surface-2: "#f5f7fa"
  text: "#0a0a0a"
  text-2: "#3a3f47"
  text-mute: "#7a808a"
  text-faint: "#aaaeb5"
  accent: "#4361ee"
  accent-soft: "rgba(67,97,238,0.08)"
  accent-glow: "rgba(67,97,238,0.25)"
  rule: "#e0e3e8"
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
    fontFamily: "Manrope"
    fontWeight: 800
  body:
    fontFamily: "Manrope"
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
    description: Subtle light gray divider. Barely visible against white surfaces — structural, never decorative. Used between content sections and to separate chrome from content
  card:
    borderRadius: var(--r-card)
    background: surface-2
    boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)"
    description: Clean white-gray card with the subtlest possible shadow — just enough to register as a distinct plane without feeling like elevation. Corporate restraint in shadow form
  hero-num:
    font: display-en
    color: accent
    weight: 800
    description: Manrope 800 at large size in electric blue. Revenue numbers, growth metrics, quarter indicators. Bold but not aggressive — corporate confidence, not pitch-deck drama
  stage-decoration:
    description: A 4px solid accent-colored (#4361ee) bar spanning the full width of the stage, anchored to the bottom edge. This is the ONLY decoration on the stage. No vignette, no pattern, no gradient — the bar is the signature. It grounds the white stage with a single electric pulse
---

## Overview

Electric Studio is the B2B corporate theme. It was built for investor roadshows, enterprise product launches, quarterly earnings presentations, and any context where credibility must be established before excitement can be earned. The emotional register is polished professionalism — clean, crisp, and focused. A white stage (#ffffff) floats inside a dark shell (#0a0a0a) letterbox, creating the impression of a bright, well-lit studio against a darkened control room. The silhouette says "we are in a serious room doing serious work."

This theme is for medium-density content: you can include data charts, metrics callouts, bullet points, and multi-card layouts without betraying the aesthetic. But it is NOT for casual content, NOT for entertainment, NOT for storytelling or narrative, and NOT for slides dominated by photography. Electric Studio is a font-and-data theme — images are supporting actors, never leads.

Manrope carries the entire Latin typographic voice at 800 weight for display and 400 for body. Its geometric, slightly technical character reads as modern engineering rather than design embellishment. IBM Plex Mono provides the data layer. The singular electric blue (#4361ee) is the only color beyond the grayscale spectrum — one accent, used with precision, anchoring the 4px bottom bar that is this theme's visual signature.

## Colors

### Palette

- **Shell (#0a0a0a)** — Deep near-black. Used for the letterbox/stage background that frames the white content area. Creates a crisp, high-contrast frame around the white stage. Never used as a content surface.
- **Surface (#ffffff)** — Pure clean white. The content stage. This is the only theme that uses true white as a primary surface — the corporate context demands it. The white must feel bright, clean, and uncompromised.
- **Surface-2 (#f5f7fa)** — Very light blue-gray. Used for cards, data panels, and secondary content areas that need to distinguish themselves from the white stage. The blue undertone is nearly imperceptible — it reads as "white, but different" rather than "blue."
- **Text (#0a0a0a)** — Near-black text matching shell. Ink on white paper — maximum contrast for maximum clarity. The corporate context permits near-black where editorial contexts demand slightly softened blacks.
- **Text-2 (#3a3f47)** — Dark blue-gray. Secondary text, supporting body copy, descriptions. Cooler than pure gray to harmonize with the electric blue accent without competing.
- **Text-Mute (#7a808a)** — Muted blue-gray. Labels, captions, chart annotations, footnotes. Readable but clearly subordinate.
- **Text-Faint (#aaaeb5)** — Light gray. Decorative elements, grid lines, disabled states. Chrome that must exist but must recede.
- **Accent (#4361ee)** — Electric blue. The ONE color beyond grayscale. A saturated mid-blue with enough depth to feel serious and enough energy to feel electric. Sits at roughly 230 degrees on the hue wheel — cooler than ultramarine, warmer than cyan. This is a blue that means business.
- **Accent-Soft (rgba(67,97,238,0.08))** — Translucent accent for hover backgrounds, chart fills, and subtle data highlighting. Nearly invisible as a color, perceptible as a warmth shift.
- **Accent-Glow (rgba(67,97,238,0.25))** — Accent at glow intensity. For the bottom bar's subtle upward glow, focus rings, and interactive indicators.
- **Rule (#e0e3e8)** — Light gray divider. Present enough to organize, subtle enough to ignore. The color of a well-designed spreadsheet gridline.

### Defaults

- Body text against surface (#ffffff) always uses text (#0a0a0a). Maximum contrast for corporate clarity.
- Body text against surface-2 (#f5f7fa) uses text (#0a0a0a). The contrast remains sufficient.
- Accent color touches: the 4px bottom bar (mandatory on every slide), primary data highlights in charts, active navigation indicators, key CTA elements, hero numbers. These are the ONLY elements allowed to use accent.
- Accent color never touches: body paragraphs, secondary labels, running text, dividers, borders, cards (as fill), or any element that repeats more than twice per slide. Restraint defines the corporate character — a splash of blue is electric; a wash of blue is wallpaper.
- Text-mute (#7a808a) is the default for chart labels, axis text, and footnotes.
- The 4px bottom bar must be present on every slide. It is the only stage decoration. No slide is complete without it.

## Typography

### Font Family

- **Manrope (800, 600, 500, 400)** — The complete Latin voice. A modern geometric sans-serif with a technical, slightly futuristic character that reads as "engineered" rather than "designed." 800 weight for display headlines (its ExtraBold is punchy without being aggressive), 600 for subheads, 500 for labels and kickers, 400 for body copy. The single-family approach is intentional — corporate coherence through typographic uniformity.
- **IBM Plex Mono (500)** — The data voice. Code, statistics, numerical tables, technical specifications. Provides the monospace rigor that Manrope's proportional geometry cannot.
- **Noto Sans SC (700)** — The CJK display voice. Chinese/Japanese/Korean headlines and body text. Sans-serif aligns with Manrope's geometric character — a serif CJK font would introduce an editorial quality that contradicts the corporate-modern positioning.

### Type Scale

- **Display (72–104px)**: Manrope 800. Headline wordmarks, section titles. Line-height: 1.1. Letter-spacing: -0.02em for optical tightening at large sizes.
- **H1 (48–60px)**: Manrope 800. Primary slide titles. Line-height: 1.15.
- **H2 (32–40px)**: Manrope 800 or 600. Card titles, section headers. Line-height: 1.25.
- **H3 (22–28px)**: Manrope 600. Card interior headings. Line-height: 1.3.
- **Body (16–20px)**: Manrope 400. Body copy. Line-height: 1.5 minimum, 1.55 preferred.
- **Caption (14–16px)**: Manrope 400. Descriptions, supporting text. Line-height: 1.5.
- **Label (12–14px)**: Manrope 500. Kickers, tags, navigation, chart labels. Letter-spacing: +0.04em for all-caps.
- **Mono (14–16px)**: IBM Plex Mono 500. Code, data tables, numerical callouts. Line-height: 1.5.

### Signature Treatments

- Manrope 800 ExtraBold carries the full display weight. It is punchy without the aggression of a 900-weight black — corporate confidence, not pitch-deck shouting. Every headline uses it.
- Hero numbers are Manrope 800 in accent (#4361ee). Large (96–144px), proportional figures, solo or with a short label. Revenue numbers, growth percentages, quarter markers — the metrics that matter.
- All-caps labels use Manrope 500 with +0.04em letter-spacing. Modest spacing — corporate labels should feel tight and precise, not sprawling.
- Mono is strictly for data: tables, charts, code, specifications. Its job is technical credibility. It never appears in headlines, labels, or navigation.
- Manrope 400 body text is the reading default. No italic variant needed — emphasis in Electric Studio comes from weight (400 to 600) or color (accent for single data points), never from slant.

### Typography Principles

- Uniform type family: Manrope handles display, subhead, body, and labels. This is rare and intentional — corporate coherence through singularity of voice. The single family creates an unbroken typographic surface.
- Maximum 2 typefaces visible simultaneously (Manrope + IBM Plex Mono). The mono is only for data — on text-only slides, only Manrope appears.
- Emphasis hierarchy: weight shift (400 to 600 to 800) is the primary mechanism. Accent color is for data emphasis only, never for prose emphasis. Size is the tertiary mechanism.
- Line-height discipline: 1.5 for body, 1.1–1.3 for display. The corporate context demands tighter, more efficient typography than editorial or cinematic themes.
- Letter-spacing: 0 for body and most display. -0.02em for display above 72px (optical tightening). +0.04em for all-caps labels. Never more than +0.06em — wide tracking reads as fashion, not corporate.
- Never use italic. Manrope's italic is a geometric slant that undermines the font's engineered character. Emphasis through weight only.

### Typography Principles

- Line-height is tighter than editorial themes: 1.5 for body text (vs 1.6 for Newsroom). Corporate content at slide scale can afford slightly tighter leading — the audience is expected to scan, not read deeply.
- Font-weight contrast within the single Manrope family is the sole hierarchy mechanism. The 400-weight gap between body (400) and display (800) creates unambiguous hierarchy without introducing a second font. Subheads at 600 bridge the gap.
- Never faux-bold or faux-italic any font. Manrope has a complete weight range — use the real weights.
- Under 14px, Manrope 400 is the minimum. Below this, the geometric letterforms lose clarity. Labels at 12px must use Manrope 500 for the slightly increased stroke weight.

## Layout

### Canvas System

The stage is 1920x1080. Electric Studio uses a white content stage (#ffffff) centered inside a dark shell (#0a0a0a) letterbox. The dark shell creates a crisp frame around the white content — content never extends to the full 1920x1080. Instead, content is inset by a minimum of 48px on all sides, creating the dark letterbox border. The 4px accent bar sits at the absolute bottom of the white content area, spanning its full width.

Layout is grid-based and modular. Content is organized into cards on a clean white field. The grid is invisible but felt — cards align to a 12-column invisible grid with 24px gutters. Multi-card layouts are common and encouraged: 2-column, 3-column, and 4-column card grids are all valid patterns, unlike the single-column restriction of Bold Signal.

### Padding and Gap Scale

- Stage padding: 96px horizontal, 80px vertical (plus the 48px dark letterbox frame beyond). Content feels centered and contained.
- Card internal padding: 40px horizontal, 32px vertical. Cards must contain content comfortably but efficiently — corporate slides value information density.
- Gap between cards: 24px in grid layouts. Consistent gutters create a unified grid rhythm.
- Gap between headline and body: 28px. Tighter than editorial themes — corporate slides move faster.
- Gap between body and supporting elements (chart, table, secondary card): 32px.
- Navigation zone: bottom 56px of the content area, above the 4px accent bar. The bar sits at the absolute bottom; navigation floats just above it.

### Key Layout Patterns

- **Title + Metrics Grid (default)**: Headline at top in Manrope 800. Subhead below in Manrope 400, text-2. Three or four metric cards in a horizontal row below, each with a hero number in accent and a label in text-mute. The default corporate overview slide.
- **Two-Column Analysis**: Left column (55%): explanatory text or bullet points in Manrope 400. Right column (40%): data visualization, chart, or metrics card. 5% gap. The corporate explainer pattern.
- **Card Grid**: 2x2 or 3x2 grid of surface-2 cards, each with a small heading (Manrope 600) and body text. Used for feature grids, capability overviews, and comparison slides.
- **Big Number + Explanation**: Hero number in Manrope 800, accent, 120–160px, left-aligned. Supporting paragraph to the right. A data-storytelling layout for quarterly results and metric deep-dives.
- **Full-Width Chart**: Headline, optional subhead, then a data visualization spanning the full content width. The chart itself uses accent for primary data series, text-mute for axes, and surface-2 for the chart background.

## Depth and Elevation

Shadow philosophy: barely-there elevation. Cards use the most subtle shadows in the system — just enough to register as distinct planes without creating a layered, dimensional feel. The effect is of paper sheets resting on a white desk — they are separate objects, but only just. This is corporate restraint applied to depth: cards are distinct but not dramatic.

- Default card shadow: `0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)` — a two-layer shadow. The first layer (1px blur, 6% opacity) creates the immediate contact shadow. The second (2px y-offset, 8px blur, 4% opacity) creates the soft lift. Combined they read as "slightly raised" without feeling dimensional.
- No card ever uses a shadow stronger than 0.08 cumulative opacity.
- No text shadows. No glow effects. No backdrop blur. No glass morphism.
- The 4px accent bar at the bottom is flat — no shadow, no gradient, no glow. It is a stripe of color, nothing more.
- Hover states (interactive contexts only) may increase to `0 2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)` — a subtle lift that indicates interactivity without animation.

## Signature Elements

1. **4px Bottom Accent Bar**: A 4px solid bar in accent blue (#4361ee), spanning the full width of the white content area, anchored to the bottom edge. Present on every slide. This is the electric pulse that gives the theme its name — a single stripe of color that grounds the white stage and provides the only chromatic anchor. No slide is complete without it. Its position at the bottom creates a foundation — the content sits on the blue line like a building on its foundation.

2. **Dark Letterbox Frame**: The white content stage (#ffffff) is surrounded by a dark shell (#0a0a0a) frame — minimum 48px on all sides. This creates the studio metaphor: a bright, well-lit presentation surface viewed from a darkened control room. The letterbox distinguishes Electric Studio from themes where content extends edge-to-edge — this is a presentation, not a page.

3. **Single-Accent Discipline**: Electric blue (#4361ee) is the ONLY chromatic color in the theme. There is no secondary accent, no complementary color, no warm/cool balance. The grayscale palette (white through dark gray) does all the structural work. The blue does all the emotional work. This singular focus is what makes it "electric" — a single current in an otherwise neutral field.

## Do's and Don'ts

### Do

1. Include the 4px accent bottom bar on every single slide. It is the theme's visual constant. A slide without it is an unfinished slide.
2. Maintain the dark letterbox frame — minimum 48px of shell (#0a0a0a) visible around the white content area on all four sides.
3. Use Manrope 800 for all headlines. There is no second display font — Manrope 800 carries every headline in the deck.
4. Use surface-2 (#f5f7fa) cards for any content block that needs to separate from the white stage — data panels, metrics cards, callout boxes.
5. Use the accent color (#4361ee) for exactly these elements: the bottom bar, hero numbers, primary data series in charts, active nav indicators, and one CTA per slide maximum.
6. Align all cards to an invisible 12-column grid with 24px gutters. Grid discipline is corporate discipline.
7. Use IBM Plex Mono 500 for all data tables, numerical comparisons, and technical specifications.
8. Keep body text at 16–20px with 1.5 line-height. Corporate readability demands clarity, not atmosphere.
9. Use proportional figures for hero numbers — Manrope's figures are designed proportional and look awkward when forced tabular.
10. Render all CJK text in Noto Sans SC — 700 for headlines, 400 for body. Sans-serif preserves the corporate-modern character.

### Don't

1. Never omit the 4px bottom bar from any slide. It is the theme's signature. Its absence is incorrect.
2. Never use a color other than #4361ee as an accent anywhere in the theme. No secondary accent. No warm color for "variety." One accent, period.
3. Never fill a card with the accent color. Accent is for text, lines, and the bottom bar — never for backgrounds or large fills.
4. Never use a box-shadow stronger than the defined card shadow. Heavy shadows read as marketing, not corporate.
5. Never use Manrope for body text below 400 weight or above 600. 300 is too light for slide reading; 800 is for display only.
6. Never add a texture, pattern, gradient, or vignette to the white content area. The surface is clean white — decoration undermines the corporate clarity.
7. Never use italic on any element. Manrope italic undermines the geometric-engineered character. Emphasis through weight only.
8. Never stretch the 4px bottom bar to a different height. It is 4px. 2px is a hairline. 8px is a footer. 4px is the signature.
9. Never use pure white text on any surface. Even on the dark letterbox, text that crosses into the shell zone should use surface-2 or text-mute, never pure white.
10. Never exceed 6 cards on a single slide. The grid can accommodate up to 3x2, but 4x2 creates cards too small for meaningful content.
11. Never mix Manrope with another sans-serif display font. Manrope is the only sans-serif voice — adding a second fragments the unified typographic surface.
12. Never let the dark letterbox frame drop below 48px width. The frame is structural — below 48px it reads as a mistake, not a design choice.

## CJK & International Content

Chinese, Japanese, and Korean text uses Noto Sans SC at 700 weight for display and 400 for body. The sans-serif character aligns with Manrope's geometric-engineered aesthetic — both are modern, clean, and technical. Serif CJK would introduce an editorial or traditional quality that contradicts Electric Studio's corporate-modern positioning.

CJK line-height minimum is 1.7 (compared to 1.5 for Latin body). CJK characters pack more information per em-box and demand proportionally more leading. The corporate context permits slightly tighter CJK leading than editorial themes (which require 1.8), but never as tight as Latin.

CJK has no italic. Electric Studio already prohibits italic on all Latin text, so no adaptation is needed — the weight-shift emphasis system (400 to 600 to 700) that serves Latin also serves CJK naturally.

Mixed Latin-CJK headlines: use Noto Sans SC for the full headline when CJK characters are present. Manrope and Noto Sans SC have compatible geometric proportions, but direct adjacency within a single headline creates visible rhythm breaks due to different x-heights and stroke modulation.

CJK punctuation: full-width marks use Noto Sans SC's built-in spacing without modification. For mixed-script corporate labels (e.g., "Q4 收入 / Revenue"), use Noto Sans SC for CJK, Manrope for Latin, with slash in text-mute as script transition marker.

Data tables with mixed scripts: use IBM Plex Mono for numerical data regardless of script. Column headers in CJK use Noto Sans SC 500 at label size with +0.04em letter-spacing (matching Manrope 500 label treatment). The mono numbers anchor the data; the sans-serif headers label it.

The 4px bottom bar is script-agnostic — it remains accent blue regardless of content language. Its position and dimensions never change.
