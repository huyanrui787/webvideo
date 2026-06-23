---
version: 1
name: Blueprint
description: Engineering blueprint — the visual language of technical documentation. Cyan on midnight navy, IBM Plex Mono everywhere.
colors:
  shell: "#0a121f"
  surface: "#0e1830"
  surface-2: "#111d38"
  text: "#e6f0ff"
  text-2: "#a8c8e8"
  text-mute: "#5a7a9a"
  text-faint: "#3a5a7a"
  accent: "#5fc7e8"
  accent-soft: "rgba(95,199,232,0.10)"
  accent-glow: "rgba(95,199,232,0.20)"
  rule: "#5fc7e8"
typography:
  display-cn: { fontFamily: "Noto Sans SC", fontWeight: 700 }
  display-en: { fontFamily: "IBM Plex Mono", fontWeight: 600 }
  body: { fontFamily: "IBM Plex Sans", fontWeight: 400 }
  mono: { fontFamily: "IBM Plex Mono", fontWeight: 500 }
components:
  rule: { width: "100%", height: "2px", style: "dashed", background: "accent", description: "Dashed cyan drafting line — the visual anchor of the blueprint. 2px weight with 8px dash / 8px gap pattern. Separates sections like a technical drawing callout line." }
  card: { borderRadius: "var(--r-card)", background: "surface-2", boxShadow: "0 2px 12px rgba(0,0,0,0.5)", description: "Dark technical card with tight shadow. No accent-colored cards — emphasis comes from cyan borders and rules, not filled surfaces." }
  hero-num: { font: "mono", color: "accent", weight: 600, description: "IBM Plex Mono in cyan at 600 weight. Numerical callouts rendered in tabular figures with a subtle cyan text-shadow glow. Always isolated — never inline with body text." }
  stage-decoration: "60px drafting grid drawn in cyan at 4% opacity over the entire stage. Grid lines are 1px solid. Optional: subtle blueprint paper texture (white lines on blue, inverted for dark scheme) at 3% opacity."
---

## Design Philosophy
Blueprint is built for technical authority — architecture diagrams, system breakdowns, API references, engineering tutorials. The visual language is borrowed directly from technical drafting: cyan lines on midnight navy, dashed callout rules, precise grid structures, and monospace typography carrying equal weight as display. Every design decision asks: "Would this belong on an engineering drawing?" If the answer is no, it does not belong on this stage. The emotional register is precise, methodical, and serious — but never cold. The cyan against dark navy carries warmth through its association with phosphor and drafting-room fluorescence. This theme is for technical deep dives, system architecture walkthroughs, and any content where credibility depends on visible precision.

## Colors
Midnight navy (#0a121f) is the stage floor — deep enough to feel technical, blue enough to feel alive. Surface (#0e1830) and surface-2 (#111d38) create subtle elevation planes distinguished primarily by the 60px grid, not by luminance contrast. Cyan (#5fc7e8) is the sole chromatic accent — it touches rules, grid lines, hero numbers, code highlighting, and navigation indicators. It never fills a card or a surface. Text is a cool off-white (#e6f0ff) with a subtle blue cast that harmonizes with the navy backdrop. Secondary text (#a8c8e8) is cyan-desaturated, tertiary (#5a7a9a) recedes into the blueprint. The palette has exactly one warm tone: none. This is a cool-scheme theme by design — warmth would undermine the engineering credibility.

## Typography
IBM Plex Mono is the hero — used for display, code, technical labels, and numerical data. At 600 weight it commands authority; at 500 weight it delivers technical body copy with monospace rigor. IBM Plex Sans handles extended reading (paragraphs, descriptions) where monospace would fatigue the eye. The IBM Plex superfamily creates perfect optical harmony between sans and mono — identical x-height, identical stroke contrast, identical letterform DNA. CJK uses Noto Sans SC at 700 weight for display, matching IBM Plex's geometric character. For code blocks, IBM Plex Mono at 500 weight with cyan syntax highlighting. Tabular figures (tnum) are mandatory for all numerical data. No serif typefaces exist in this theme.

## Layout & Components
The stage is built on a 60px drafting grid drawn in cyan at 4% opacity — every element snaps to grid. Dashed cyan rules (2px, 8px/8px dash pattern) separate sections like technical drawing callout lines. Cards use surface-2 with tight, technical shadows — never accent-filled, never glowing. Hero numbers are IBM Plex Mono at 600 weight in cyan, with a subtle text-shadow glow that evokes phosphor instrumentation readouts. Maximum information density — this theme supports multi-column layouts, code blocks, diagrams, and tables simultaneously. Padding is tighter than editorial themes (48px horizontal, 40px vertical for cards) to accommodate technical content density. The 60px grid is the primary decorative element — no textures, no gradients, no illustrations.

## Do's
1. Snap all elements to the 60px drafting grid — alignment to grid is the theme's primary structural integrity.
2. Use dashed cyan rules (not solid, not any other color) for all section dividers and callout lines.
3. Use IBM Plex Mono for all display text, code, numbers, and technical labels — sans only for extended reading.
4. Enable tabular figures (tnum) for all numerical data — proportional figures violate the drafting aesthetic.
5. Use cyan only for rules, grid, hero numbers, and code highlights — never as a background fill.
6. Maintain consistent dash pattern (8px dash / 8px gap) on all dashed rules across the entire deck.
7. Allow multi-column layouts — this theme is built for density, not scarcity.

## Don'ts
1. Never use serif typefaces — the IBM Plex ecosystem (Sans + Mono) is the complete typographic palette.
2. Never fill a card with the accent color — cyan is for lines and type, never for surfaces.
3. Never use rounded corners on code blocks or technical diagrams — 0 radius for all technical content containers.
4. Never use warm colors — no red, orange, yellow, or warm green anywhere in the palette.
5. Never break the 60px grid alignment — off-grid elements read as errors in this theme.
6. Never use gradients, textures, or noise on the stage background — the grid is the only decoration.
7. Never use text-shadow glow on body text — it is reserved exclusively for hero numbers and code highlights.

## CJK Notes
Noto Sans SC at 700 weight handles all CJK display with clean geometric sans-serif character matching IBM Plex's engineering aesthetic. CJK body copy at 400 weight with 1.75 line-height minimum. CJK in monospace context should use Noto Sans SC (there is no CJK monospace font at video scale that is readable) — set it at matching visual weight to the surrounding IBM Plex Mono.
