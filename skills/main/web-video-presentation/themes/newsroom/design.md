---
version: 1
name: Newsroom
description: Newspaper documentary light — banner red on cream paper, zero-radius sharp corners, quiet print authority
colors:
  shell: "#ebe5d6"
  surface: "#f4ede0"
  surface-2: "#fdfaf4"
  text: "#1a1a1a"
  text-2: "#3a3a3a"
  text-mute: "#6a6a6a"
  text-faint: "#9a9a9a"
  accent: "#c9302c"
  accent-soft: "rgba(201,48,44,0.08)"
  accent-glow: "rgba(201,48,44,0.20)"
  rule: "#d4cfc4"
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
    fontFamily: "Playfair Display"
    fontWeight: 700
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
    description: Newsprint hairline — the fundamental structural element. Separates headlines from body, articles from sidebars, content from footnotes. Thin, modest, essential. The rule IS the layout system
  card:
    borderRadius: 0px
    background: surface-2
    boxShadow: "none"
    description: Zero-radius flat panel — newspapers do not round corners. No shadow — ink on paper has no elevation. Cards are distinguished by background tone and rules alone
  hero-num:
    font: display-en italic
    color: accent
    weight: 700
    description: Playfair Display 700 italic. Oversized edition numbers, volume markers, pull-quote page references. Italic is the newsroom's dramatic voice — the banner headline number
  stage-decoration:
    description: Subtle paper texture — a very light grain/noise overlay at 4-6% opacity that simulates newsprint fiber. Visible only on close inspection; subliminal at viewing distance. Creates the physical substrate metaphor
---

## Overview

Newsroom is the newspaper documentary theme. It is built on the visual language of print journalism: cream paper stock, banner red accents, sharp zero-radius corners, and the quiet authority of serif typography. The emotional register is institutional credibility — this theme lends weight to whatever it presents by invoking the trust we place in edited, printed, fact-checked media. It does not persuade through beauty or spectacle; it persuades through the implication that someone checked the facts before this went to press.

This theme is for documentaries, in-depth reviews, current affairs commentary, and historical analysis. It handles high text density comfortably — Newsroom is the highest-density theme in the system. You can fill a slide with words here and it will look like a newspaper page, not like a design mistake. But it is NOT for pitches, NOT for marketing, NOT for anything that needs to feel exciting or dynamic, and NOT for slides with fewer than 20 words. Newsroom looks empty and lost without text.

Playfair Display carries the headline voice — a high-contrast Didone serif with sharp thins and bold thicks that speaks in banner headlines and editorial authority. Source Serif 4 handles body text with the readability of a typeface designed for extended reading. IBM Plex Mono provides the data layer for statistics and technical content. The paper texture overlay whispers "this is printed matter" without ever being explicitly visible.

## Colors

### Palette

- **Shell (#ebe5d6)** — Newsprint cream, slightly darker than surface to provide stage definition. The color of aged newspaper stock — warm, slightly yellowed, never sterile white. This is the stage background, visible in the margins around cards.
- **Surface (#f4ede0)** — Primary card and content surface. Lighter than shell, the color of fresh newsprint. Warmer than ivory, cooler than butter. Most content sits on this color.
- **Surface-2 (#fdfaf4)** — Near-white cream. Used for pull quotes, callout boxes, and editorial sidebars that need to lift slightly from the main content. The difference from surface is subtle — just enough to register as distinct without creating harsh contrast.
- **Text (#1a1a1a)** — Ink black. Not pure #000 — real ink on real paper never achieves absolute black. This 90% black reads as black while preserving the organic print metaphor. Primary body and headline text.
- **Text-2 (#3a3a3a)** — Secondary text. Supporting paragraphs, secondary headlines, deck copy. Dark enough for extended reading, light enough to establish hierarchy below primary text.
- **Text-Mute (#6a6a6a)** — Muted gray. Bylines, datelines, captions, photo credits. The gray of small print in newspaper classifieds — legible but never prominent.
- **Text-Faint (#9a9a9a)** — Faint gray. Page numbers, section markers, structural chrome. The gray of elements that must exist but should never attract attention during reading.
- **Accent (#c9302c)** — Banner red. The red of newspaper nameplates and breaking-news headers. Slightly deeper than pure red — this is ink red, not screen red. Sits at roughly 0 degrees hue with reduced saturation for print credibility.
- **Accent-Soft (rgba(201,48,44,0.08))** — Translucent accent for subtle highlights, sidebar headers, and editorial markup backgrounds.
- **Accent-Glow (rgba(201,48,44,0.20))** — Accent at emphasis intensity. Rarely used — reserved for breaking-news indicators and critical call-to-action markers.
- **Rule (#d4cfc4)** — Warm gray hairline. The color of newspaper column rules — present enough to separate, neutral enough to ignore. This is the most-used color after text and surface.

### Defaults

- Body text against surface/surface-2 always uses text (#1a1a1a). Black ink on cream paper — the fundamental print relationship.
- Body text against shell uses text (#1a1a1a). The contrast is sufficient and the ink-on-paper metaphor holds.
- Accent color touches: banner headlines, breaking-news markers, edition numbers, pull-quote marks, active section indicators. Accent in Newsroom signals urgency or importance — use it sparingly to preserve this meaning.
- Accent color never touches: body paragraphs, bylines, captions, running text of any kind, or more than one element per slide. A newspaper with everything in red is a tabloid — Newsroom is a broadsheet.
- Rules are the primary layout tool. Every content boundary gets a rule. Rules are #d4cfc4, 1px solid. Never accent-colored, never thicker than 1px, never dashed or dotted.
- Pure white (#ffffff) is prohibited. Even the lightest surface is cream-tinted. Pure white on screens adjacent to cream reads as a different medium.

## Typography

### Font Family

- **Playfair Display (700, 700 italic)** — The headline voice. A high-contrast Didone serif with sharp transitions between thick verticals and thin horizontals. Banner headlines, section titles, deck copy. 700 weight for all display usage — the hairline thins are an essential part of its character and would vanish at lighter weights. Italic at 700 for pull quotes, edition numbers, and emphasis headlines.
- **Source Serif 4 (400, 600, 700)** — The reading voice. Body copy, extended text, captions. A workhorse serif designed for readability at text sizes. 400 for body (ample for reading), 600 for subheads within body, 700 for emphasis and labels that need serif authority.
- **IBM Plex Mono (500)** — The data voice. Statistics, numerical tables, code, technical footnotes. The monospace provides a clean contrast to the serif-dominant typography without introducing a sans-serif that would feel anachronistic.
- **Noto Serif SC (700)** — The CJK headline voice. Chinese/Japanese/Korean headlines and display text. Serif CJK is essential — a sans-serif CJK headline in Newsroom would read as a different publication entirely.

### Type Scale

- **Display (64–96px)**: Playfair Display 700. Banner headlines. Line-height: 1.1. The extreme stroke contrast of Didone serifs requires tight leading — loose leading fragments the letterforms.
- **H1 (40–56px)**: Playfair Display 700. Section titles, major headlines. Line-height: 1.15.
- **H2 (28–36px)**: Playfair Display 700 or Source Serif 4 700. Subheads, deck copy. Line-height: 1.25.
- **H3 (20–24px)**: Source Serif 4 600. Card headers, sidebar titles. Line-height: 1.3.
- **Body (16–18px)**: Source Serif 4 400. Body copy. Line-height: 1.6 — generous leading for extended reading, as print demands.
- **Caption (13–15px)**: Source Serif 4 400. Captions, photo credits, supporting text. Line-height: 1.5.
- **Label (11–13px)**: Source Serif 4 600. Bylines, datelines, section markers. Letter-spacing: +0.04em for all-caps labels.
- **Mono (14–16px)**: IBM Plex Mono 500. Statistics, data tables, code. Line-height: 1.6.

### Signature Treatments

- Banner headlines are Playfair Display 700, always in text (#1a1a1a), never in accent. The banner headline gets its power from size and the Didone stroke contrast, not from color. Accent on a headline means "breaking news" — use only for that semantic purpose.
- Pull quotes use Playfair Display 700 italic, text-2 (#3a3a3a), centered or indented, framed by rules above and below. The italic carries the human voice within the institutional page.
- Edition numbers and hero numbers use Playfair Display 700 italic in accent (#c9302c). Large (120px+), often bleeding off the top of a card. These are the graphic punctuation of the newsroom.
- Bylines and datelines are Source Serif 4 600 at label size, text-mute (#6a6a6a). Always separated from headlines by a 1px rule. Format: "BY AUTHOR NAME | DATE | LOCATION" with the pipe as separator.
- Mono elements are for data only. Statistical tables, numerical comparisons, source citations in footnote format.

### Typography Principles

- Line-height in Newsroom is higher than any other theme: 1.6 minimum for body text. Print reading at distance requires more leading than screen reading up close. This is non-negotiable.
- Maximum 2 typefaces visible simultaneously (Playfair + Source Serif, or Source Serif + IBM Plex Mono). The serif dominance means sans-serif never appears — this is a serif-only theme with mono for data.
- Font-weight shifts within Source Serif 4 (400 to 600 to 700) are the primary hierarchy tool within body text. Never use color for hierarchy within body — weight alone must suffice.
- Italic in Playfair Display is for the human voice: pull quotes, emphasis statements, editorial asides. Italic in Source Serif 4 is for book titles, foreign terms, and academic conventions. These two italics serve different semantic purposes and must not be confused.
- Never faux-italic, faux-bold, or faux-small-caps any font. Use only the weights and styles built into each font file.

## Layout

### Canvas System

The stage is 1920x1080. Newsroom uses a multi-column newspaper layout philosophy — the only theme in the system designed for high-density information architecture. Content flows in columns separated by 1px rules. The headline spans the full width above the fold; body text flows into 2–3 columns below. This is literally the newspaper metaphor executed at slide scale.

The layout adapts to content density. Single-story slides use a two-column body with a full-width headline. Multi-story slides use a three-column grid with rules between columns. Sidebar elements (pull quotes, data cards, related links) slot into the rightmost column. The system is flexible but the rule-based structure is constant — Newsroom without rules between columns is not Newsroom.

### Padding and Gap Scale

- Stage padding: 96px horizontal, 80px vertical. Ample but not cinematic — the padding is a generous margin around the page, not a frame.
- Card internal padding: 40px horizontal, 32px vertical. Cards represent articles or sections — they need enough padding for the text to breathe but not so much that density is compromised.
- Column gap: 32px, centered on a 1px rule. The rule occupies the center of the gap: 15.5px space, 1px rule, 15.5px space.
- Gap between headline and body: 24px, with a rule spanning the content width between them.
- Gap between body paragraphs: 16px. Paragraphs are close cousins — the gap is minimal.
- Gap between articles (vertical stack): 32px, with a 1px rule between them.
- Navigation zone: bottom 48px, containing page number (right-aligned) and section name (left-aligned).

### Key Layout Patterns

- **Full-Page Story (default)**: Headline spanning full content width at top. Optional deck (subheadline) below in Source Serif 4 600. 1px rule. Body in two columns with rule between. Byline above headline in label style. This is the standard article layout.
- **Multi-Story Spread**: Three columns of equal width, each containing a smaller headline (H3) and body text. Rules between all columns. The top of the spread may have a shared section header spanning all columns. Used for topic overviews and digest slides.
- **Banner Headline**: Single Playfair Display 700 headline at 72–96px, centered, in text color. One-line deck below. 1px rule. Nothing else on the slide — this is the section-break slide, the chapter title of the documentary.
- **Pull Quote + Data**: Left column: pull quote in Playfair Display 700 italic at 40–56px, accent color, with attribution below. Right column: data points or statistics in IBM Plex Mono on a surface-2 card. Rule between columns.
- **Sidebar Layout**: Main article in left 65% of content width. Sidebar in right 30% with surface-2 background, containing related data, timeline, or key facts. Rule separating them.

## Depth and Elevation

Shadow philosophy: absolute flatness. Newsroom rejects depth entirely. There are no shadows, no elevation, no layers, no z-index trickery. Every element sits flat on the same plane — ink on paper. Cards are distinguished by background color alone (surface-2 against surface). The paper texture overlay applies uniformly to the entire stage — every element is on the same piece of paper, and paper does not cast shadows on itself.

This is the most restrictive depth rule in the system, and it is essential to the theme's character. The moment a shadow appears, the newsprint metaphor breaks and the slide becomes a screen interface. Rules do the structural work that shadows do in other themes — they separate, they organize, they create hierarchy through division rather than elevation.

- All cards: box-shadow: none. Border-radius: 0px.
- No text shadows on any element.
- No glow effects. Even accent-glow is used only for interactive indicators in preview contexts, never on static slides.
- The paper texture is a global overlay at 4–6% opacity: a fine noise pattern applied to the stage as a pseudo-element. It must be subtle enough to be invisible unless specifically looked for.

## Signature Elements

1. **Zero-Radius Everything**: No rounded corners anywhere in the theme. Cards, buttons, dividers, images — all are 0px border-radius. This is the single most recognizable visual trait of Newsroom. The sharp corner is the newspaper corner. It signals that this content was printed, not rendered.

2. **The 1px Rule**: The rule (#d4cfc4, 1px solid) is the theme's structural backbone. Headlines separated from body by rules. Columns separated by rules. Articles separated by rules. Footnotes separated from text by rules. The rule is a typographic character — as essential as the period or the em-dash — and it must be used consistently. No other divider style is permitted.

3. **Paper Texture Substrate**: A subtle noise/grain overlay at 4–6% opacity across the entire stage. It simulates the fiber of newsprint — invisible at a glance, but its absence would be felt as a cold, sterile screen. It converts the stage from a digital surface into a physical one. This is the theme's only non-typographic, non-chromatic element.

## Do's and Don'ts

### Do

1. Use 1px rules (#d4cfc4, solid) to separate every semantic section — headline from body, columns from each other, articles from each other.
2. Maintain zero border-radius on every element. Check cards, images, code blocks, and captions — radius anywhere breaks the print metaphor.
3. Use Playfair Display 700 for all headlines and only headlines. Its high-contrast Didone strokes are for display, never for body text.
4. Use Source Serif 4 400 for all body text with exactly 1.6 line-height. The leading is as important as the font choice.
5. Put a byline (Source Serif 4 600, text-mute, label size) on every content slide. Bylines anchor the journalistic voice.
6. Use the accent color (#c9302c) to mean "important" — breaking news headers, critical data points, edition numbers. Never use it decoratively.
7. Keep the paper texture at 4–6% opacity. If you can see it without looking for it, it is too strong.
8. Use IBM Plex Mono for all numerical data, statistics, and tabular information. Data gets the mono voice — it is distinct from editorial prose.
9. Align all body text left, rag right. Justified text is for narrow newspaper columns, not for slide-scale reading. Never justify.
10. Render all CJK headlines in Noto Serif SC 700 — the serif character must carry across scripts to maintain the print metaphor.

### Don't

1. Never use border-radius on any element. Not 2px, not 4px, not 8px. Zero radius everywhere, no exceptions.
2. Never apply a box-shadow to any card, image, or element. Flatness is absolute. Shadows break the newsprint metaphor irreparably.
3. Never use Playfair Display for body text or any text below 20px. Its hairline thin strokes disappear at small sizes on cream backgrounds.
4. Never use a sans-serif display font. The serif is the voice of print authority. Sans-serif headlines read as web or broadcast, not newsroom.
5. Never use pure white (#ffffff) or pure black (#000000). The cream and ink colors are calibrated for the newsprint metaphor.
6. Never omit the rule between headline and body on full-story slides. The rule is structural, not decorative — its absence is as noticeable as a missing period.
7. Never use more than one accent-colored element per slide. Red means important. Two red things means nothing is important.
8. Never use dashed, dotted, or double rules. All rules are 1px solid. The rule's authority comes from its consistency and simplicity.
9. Never center-align body text. Headlines may center for section-break slides, but body text is always left-aligned.
10. Never add a second texture, gradient, or pattern alongside the paper grain. The grain is the only texture — more would be noise, not atmosphere.
11. Never use drop caps at display sizes. Drop caps are a narrow-column print convention that does not translate to slide-scale reading.
12. Never let the paper texture exceed 8% opacity. A heavy grain reads as a dirty screen, not newsprint.

## CJK & International Content

Chinese, Japanese, and Korean text uses Noto Serif SC at 700 weight for headlines, matching Playfair Display's serif authority. For CJK body copy, use Noto Serif SC at 400 weight — the serif carries reading credibility across scripts. The transition from Latin serif to CJK serif should feel like switching from the Times to the Asahi Shimbun — same medium, different script, same editorial gravity.

CJK line-height must be minimum 1.8 (compared to 1.6 for Latin body). CJK characters are denser information carriers and demand more vertical separation to maintain readability at the same point size. This is especially critical in Newsroom, where text density is already high — cramped CJK text becomes illegible faster than cramped Latin text.

CJK has no italic. Newsroom uses italic for pull quotes, emphasis, and the human editorial voice. In CJK-only slides this tool is unavailable. Compensate through: (a) accent color on key phrases (breaking-news semantics), (b) typographic scale — increase the size of emphasized CJK text by one step on the type scale, and (c) spatial isolation — a centered single-line CJK statement carries the same weight as an italic pull quote.

Mixed Latin-CJK body text: Source Serif 4 handles Latin, Noto Serif SC handles CJK. The two serif typefaces at body size are compatible — both are designed for extended reading. Use Source Serif 4 for punctuation adjacent to Latin text, Noto Serif SC punctuation for CJK-adjacent marks. The transition between scripts should feel seamless.

CJK punctuation: full-width marks use Noto Serif SC's built-in spacing and justification. Do not add letter-spacing. For vertical CJK layout (rare but permitted for artistic effect in title slides), use the font's vertical metrics and right-to-left column flow — but this is an advanced option, not the default.

Bylines in mixed scripts: "作者: Author Name | 日期 | 地點" — Noto Serif SC for CJK, Source Serif 4 for Latin, pipes (|) in text-mute as separators. The pipe is script-neutral.
