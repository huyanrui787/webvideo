---
version: 1
name: Neon Cyber
description: Cyberpunk dark with electric cyan glow, dual-tone neon text-shadows, grid overlay, and deep navy depths
colors:
  shell: "#04060f"
  surface: "#0a0f1c"
  surface-2: "#0f1528"
  text: "#e8f4ff"
  text-2: "#b0c8e0"
  text-mute: "#6a80a0"
  text-faint: "#3a4a60"
  accent: "#00ffcc"
  accent-2: "#ff00aa"
  accent-soft: "rgba(0,255,204,0.10)"
  accent-glow: "rgba(0,255,204,0.40)"
  rule: "#1a2a40"
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
    fontFamily: "Clash Display"
    fontWeight: 700
  body:
    fontFamily: "Satoshi"
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
    description: Subtle dark blue divider. Visible enough to organize, dark enough to preserve the deep-navy atmosphere. Never accent-colored — neon is for content, not structure
  card:
    borderRadius: var(--r-card)
    background: surface-2
    boxShadow: "0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,255,204,0.08)"
    description: Glass-adjacent dark card — surface-2 background with a subtle cyan border-glow. Not true glass morphism (no backdrop-blur), but a neon-edged dark panel that suggests tech interface
  card-glass:
    borderRadius: var(--r-card)
    background: "rgba(10,15,28,0.8)"
    boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,204,0.15)"
    backdropFilter: "blur(12px)"
    description: True glass card for overlay panels, modals, and HUD elements. Backdrop blur over the grid pattern creates depth without breaking the cyberpunk atmosphere
  hero-num:
    font: display-en
    color: accent
    weight: 700
    description: Clash Display 700 with cyan text-shadow glow. Stats, counters, version numbers, threat levels. The neon number is a HUD readout — it glows like a terminal display
  stage-decoration:
    description: Cyan grid pattern overlay — a 64px grid with 1px cyan lines at 8-12% opacity, overlaid on the entire stage. Creates the cyberspace substrate. Additionally, the stage has a very subtle radial gradient from surface (center) to shell (edges), creating depth behind the grid
---

## Overview

Neon Cyber is the cyberpunk theme. It was built for AI evaluations, web3 content, cybersecurity presentations, and any context that wants to feel like it was assembled in a neon-lit terminal at 3am. The emotional register is electric futurism — sharp, cool, and slightly dangerous. Deep navy depths (#04060f through #0f1528) create a void-like darkness that feels digital rather than natural — this is the dark of unlit screens and server racks, not the dark of night. Electric cyan (#00ffcc) provides the primary glow, with magenta (#ff00aa) as a restricted secondary accent for dual-tone neon effects.

This theme is for medium-density, technically-oriented content. It handles text, code, and data comfortably. But it is NOT for warm or emotional content, NOT for traditional corporate presentations, NOT for print or editorial material, and NOT for anything that needs to feel safe, trustworthy, or conventional. Neon Cyber is deliberately a little dangerous — the magenta accent is there specifically to create an edge of instability within the otherwise cool cyan order.

Clash Display carries the headline voice — a contemporary display font with sharp terminals and high contrast that reads as futuristic without being gimmicky. Satoshi handles body text with clean geometric precision. JetBrains Mono provides the terminal/IDE layer for code and data. The signature visual is the dual-tone neon text-shadow: cyan primary glow with magenta offset, creating the chromatic aberration of a neon sign seen through night rain.

## Colors

### Palette

- **Shell (#04060f)** — Maximum depth blue-black. Not neutral black — this is the color of deep ocean or unlit data center. The darkest color in any theme. Creates the void in which the grid and neon exist.
- **Surface (#0a0f1c)** — Deep navy blue. Primary card and content surface. Slightly lifted from shell with a distinct blue undertone that reads as "screen dark" rather than "room dark."
- **Surface-2 (#0f1528)** — Slightly lifted navy. Used for nested cards, code blocks, data panels. The blue is slightly more pronounced — enough to register as a distinct plane.
- **Text (#e8f4ff)** — Near-white with a perceptible cyan tint. Not warm, not neutral — deliberately cool. Reads as white against dark navy but carries the cyan atmosphere into the text itself. Like terminal text on a CRT.
- **Text-2 (#b0c8e0)** — Cool blue-white secondary text. Supporting copy, descriptions, metadata. Still in the cyan family but pulled back toward neutral.
- **Text-Mute (#6a80a0)** — Muted blue-gray. Labels, captions, terminal prompts, UI chrome. The color of inactive interface elements in a dark IDE.
- **Text-Faint (#3a4a60)** — Deep blue-gray at the edge of legibility. Grid labels, structural chrome, placeholder text. Visible only when attention is directed to it.
- **Accent (#00ffcc)** — Electric cyan. The primary neon. A pure, saturated cyan at roughly 170 degrees on the hue wheel — the color of a fresh terminal prompt, a neon sign on a cyberpunk street, the glow of a bioluminescent future. This is the light source.
- **Accent-2 (#ff00aa)** — Electric magenta. The secondary neon, used EXCLUSIVELY for the dual-tone neon text-shadow effect. Never as a fill, never as a background, never as a standalone text color. Its only purpose is the chromatic counterpoint to cyan in the neon glow effect.
- **Accent-Soft (rgba(0,255,204,0.10))** — Translucent cyan for hover backgrounds, selection indicators, grid line highlights.
- **Accent-Glow (rgba(0,255,204,0.40))** — Cyan at full glow intensity. For text-shadows, box-shadow glows, focus rings, and the card border shimmer.
- **Rule (#1a2a40)** — Dark blue divider. The color of inactive grid lines or unpowered neon tubes. Present to organize but dim enough to never compete with the glow.

### Defaults

- Body text against dark surfaces uses text (#e8f4ff). The cyan-tinted white maintains atmosphere even in body copy.
- Accent (#00ffcc) touches: headline glow (text-shadow), hero numbers, active navigation, card borders (subtle), grid line highlights, data point emphasis, code syntax highlighting. Cyan is the light — use it wherever you want the audience to feel illumination.
- Accent-2 (#ff00aa) touches: the offset layer in dual-tone text-shadows ONLY. Never as a fill, text color, border, or background. Magenta is the chromatic ghost — always offset by at least 2px from any cyan element it accompanies.
- Dual-tone text-shadow formula: `0 0 8px rgba(0,255,204,0.4), 2px 2px 0 rgba(255,0,170,0.3)` — cyan glow centered, magenta offset bottom-right. This is the signature neon outline. Apply to primary headlines and hero numbers only.
- Text-mute (#6a80a0) is the default for terminal-style labels, timestamps, and structural chrome.
- Never use pure white (#ffffff). The cyan-tinted text (#e8f4ff) is the maximum brightness — pure white reads as a bug, not a feature.

## Typography

### Font Family

- **Clash Display (700, 600, 500)** — The headline voice. A contemporary display font from Fontshare with sharp, angular terminals and tall x-height. Reads as futuristic and designed — the typographic equivalent of a custom HUD interface. 700 for primary headlines, 600 for subheads, 500 for tertiary display elements. The sharp terminals echo the angularity of the grid overlay.
- **Satoshi (400, 500, 700)** — The body voice. A clean geometric sans-serif from Fontshare, designed as a modern workhorse. 400 for body, 500 for labels and kickers, 700 for body-level emphasis. Its neutrality provides a calm substrate for Clash Display's drama.
- **JetBrains Mono (500)** — The code voice. Terminal output, code blocks, data readouts, system messages. The monospace carries the developer/terminal metaphor — essential for the cyberpunk authenticity.
- **Noto Sans SC (700)** — The CJK display voice. Chinese/Japanese/Korean text. Sans-serif aligns with the futuristic character — serif CJK would read as historical, not cyberpunk.

### Type Scale

- **Display (72–108px)**: Clash Display 700. Headline wordmarks. Line-height: 1.1. Must use the dual-tone neon text-shadow at this size — it is the signature treatment.
- **H1 (48–60px)**: Clash Display 700. Section titles. Line-height: 1.2. Dual-tone text-shadow at reduced intensity.
- **H2 (32–40px)**: Clash Display 600. Card titles, subheads. Line-height: 1.25. Single cyan glow only (no magenta offset at this size — the offset becomes illegible below 48px).
- **H3 (22–28px)**: Satoshi 700. Card interior headings, data panel titles. Line-height: 1.3. No glow — structural text should not glow.
- **Body (16–20px)**: Satoshi 400. Body copy. Line-height: 1.5. No glow, no color — clean reading text.
- **Caption (14–16px)**: Satoshi 400. Supporting text, descriptions. Line-height: 1.5.
- **Label (12–14px)**: Satoshi 500. Kickers, tags, navigation, terminal prompts. Letter-spacing: +0.06em for all-caps.
- **Mono (14–18px)**: JetBrains Mono 500. Code, terminal output, data readouts. Line-height: 1.6. Cyan color (#00ffcc) for active terminal prompts, text-mute for inert output.

### Signature Treatments

- Dual-tone neon text-shadow on display headlines: `text-shadow: 0 0 8px rgba(0,255,204,0.4), 2px 2px 0 rgba(255,0,170,0.3)`. The cyan glow is centered, creating the primary neon tube. The magenta shadow is offset bottom-right, creating the chromatic fringe. This is the defining typographic effect of the theme.
- Single cyan glow for sub-display headings (H2, hero numbers): `text-shadow: 0 0 6px rgba(0,255,204,0.35)`. No magenta offset — the single glow is cleaner for smaller sizes.
- Hero numbers are Clash Display 700 in cyan (#00ffcc) with the single cyan glow. Large (96–144px). Stats, version numbers, threat levels, data counters. The HUD readout aesthetic.
- Terminal-style labels use JetBrains Mono 500 in text-mute (#6a80a0) with a cyan prompt prefix (e.g., "> system.status"). The prompt character is accent; the label text is muted.
- Code blocks are JetBrains Mono 500 on surface-2 (#0f1528) with no glow. Syntax highlighting uses cyan for keywords, text for identifiers, text-mute for comments.

### Typography Principles

- Line-height: body text at 1.5 (standard for dark themes), mono at 1.6 (extra leading for code readability on dark backgrounds), display at 1.1–1.2 (tight for neon impact).
- Maximum 2 typefaces visible simultaneously (Clash Display + Satoshi, or Satoshi + JetBrains Mono). Never all three.
- Glow hierarchy: only Clash Display text above 48px gets the dual-tone treatment. Clash Display at 32–47px gets single cyan glow. Below 32px, no glow at all — glow on body text is illegible.
- Letter-spacing: 0 for body and display. -0.01em for Clash Display above 72px (its sharp terminals benefit from mild tightening). +0.06em for all-caps Satoshi labels.
- Never faux-italic. Clash Display and Satoshi both have stylistic integrity that faux-italic destroys. Emphasis through glow (cyan) or weight shift.

## Layout

### Canvas System

The stage is 1920x1080. Neon Cyber uses a deep-navy stage with a cyan grid overlay at 64px intervals. The grid is always present — it is the cyberspace substrate, the coordinate system of the digital world. Content floats above the grid on cards and panels. The layout is modular and grid-aligned: cards snap to the 64px grid, creating a sense that everything is positioned within a digital coordinate space.

Layouts tend toward asymmetrical — content is often weighted to one side with data panels or terminal output on the other. Centered layouts are permitted but less characteristic. The grid overlay creates a natural grid system — use it. Cards should align to grid lines. Elements that don't align to the grid feel like they're glitching.

### Padding and Gap Scale

- Stage padding: 96px horizontal, 80px vertical. Standard padding, but content must align to the 64px grid within it.
- Card internal padding: 40px horizontal, 32px vertical. Cards must contain content with enough room that text never touches the glow-border.
- Gap between cards: 24px, aligned to grid (not quite 64px, but visible as intentional spacing). May increase to 40px for dramatic separation.
- Gap between headline and body: 32px. The headline's glow needs breathing room.
- Gap between body and data panel: 24px.
- Navigation zone: bottom 48px, styled as a terminal status bar with JetBrains Mono labels.

### Key Layout Patterns

- **Terminal + Data (default)**: Left side: headline in Clash Display with dual-tone glow and body text in Satoshi. Right side: terminal-style data panel in JetBrains Mono on a surface-2 card with cyan border glow. The cyberpunk explainer.
- **Full-Screen Grid**: Content distributed across the grid, with data points at specific grid coordinates. Cards snap to grid intersections. The arrangement feels like a tactical display or network map.
- **HUD Overlay**: A glass card (card-glass with backdrop-blur) floating over the grid, containing critical data or a call to action. The glass sits slightly above the grid plane — the blur of the grid beneath creates genuine depth.
- **Big Number HUD**: Hero number in Clash Display 700 at 120–160px, cyan with glow, centered or left-aligned. Terminal-style label below. Grid visible behind, reinforcing the coordinate-space aesthetic.
- **Code Window**: A full-width or two-thirds-width card with JetBrains Mono code, syntax-highlighted. Terminal chrome (window buttons or prompt line) at top. The code-as-visual pattern for developer-focused content.

## Depth and Elevation

Shadow philosophy: neon-edged depth. Cards float above the grid with dark shadows and subtle cyan border glows. The elevation system has three levels: grid plane (stage background), card plane (surface-2 with subtle border glow), and glass plane (card-glass with backdrop-blur, floating highest). The grid is the ground; cards are the interface; glass is the overlay.

- Grid plane: the stage background with the 64px grid pattern. Flat. The coordinate system.
- Card plane: surface-2 background with `box-shadow: 0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,255,204,0.08)`. The 1px cyan border-glow is the neon edge — subtle but definitive.
- Glass plane: `background: rgba(10,15,28,0.8); backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,204,0.15)`. True transparency with blur — when a glass card appears, the grid blurs beneath it.
- Text glow is the fourth dimension of depth: glowing text floats above non-glowing text, creating a hierarchy without elevation change.
- Maximum of one glass card per slide. Glass is for critical focus elements, not general layout.

## Signature Elements

1. **Dual-Tone Neon Text-Shadow**: Headlines in Clash Display 700 get a two-layer text-shadow: centered cyan glow + offset magenta ghost. The effect replicates the chromatic fringe of a neon sign — the cyan is the tube, the magenta is the light bleeding through atmosphere. This is the most recognizable visual element in the theme. Restricted to display text above 48px.

2. **Cyan Grid Overlay**: A 64px grid with 1px cyan lines at 8–12% opacity, covering the entire stage. The grid is the cyberspace coordinate system — it says "this is a digital space." Cards and content snap to grid lines. The grid must always be present — it is as essential as the vignette in Midnight Press.

3. **Glass Card with Backdrop Blur**: The card-glass variant uses genuine CSS backdrop-filter blur over the grid. When a glass card appears, the grid blurs beneath it, creating the most convincing depth effect in the theme system. This is the "HUD overlay" — the piece of critical information that floats above the data space.

## Do's and Don'ts

### Do

1. Use the dual-tone neon text-shadow on all Clash Display headlines above 48px. It is the defining typographic effect.
2. Keep the 64px cyan grid overlay visible on every slide. The grid is the cyberspace substrate.
3. Use accent-2 (#ff00aa) ONLY as the offset layer in the dual-tone text-shadow. Never as a fill, text color, or border.
4. Use card-glass with backdrop-blur for exactly one element per slide — the critical HUD overlay that needs maximum attention.
5. Snap all cards and major elements to the 64px grid. Grid alignment is the coordinate system of the digital space.
6. Use JetBrains Mono for all code, terminal output, and data readouts. The terminal voice is essential to cyberpunk authenticity.
7. Use the cyan accent (#00ffcc) for headlines, hero numbers, card border glows, navigation highlights, and terminal prompts.
8. Apply the single cyan glow (`text-shadow: 0 0 6px rgba(0,255,204,0.35)`) to sub-display headings between 32–48px.
9. Use surface-2 (#0f1528) for code blocks and data panels — it provides enough contrast against surface for code to be readable.
10. Render all CJK headlines in Noto Sans SC 700 with the single cyan glow — the dual-tone effect at CJK character density becomes visually chaotic.

### Don't

1. Never use accent-2 (#ff00aa) as a fill color, text color, border, or background. Magenta is the ghost in the text-shadow, nothing more.
2. Never apply the dual-tone text-shadow to text below 48px. The magenta offset becomes illegible blur at smaller sizes.
3. Never apply any glow effect to body text. Glowing body text is illegible. Glow is for display elements only.
4. Never omit the grid overlay from any slide. The grid is the theme's atmospheric constant — its absence is as conspicuous as a missing vignette.
5. Never use true white (#ffffff) for any element. The cyan-tinted text (#e8f4ff) is the maximum brightness.
6. Never use a warm color anywhere in the palette. Neon Cyber is deliberately cool — warm colors destroy the cyberspace atmosphere.
7. Never use more than one glass card per slide. Glass is for critical focus — two glass cards compete and confuse.
8. Never use a non-monospace font for code or terminal output. The terminal metaphor requires JetBrains Mono — Satoshi or Clash Display in a code block breaks immersion.
9. Never center-align body text. Left-alignment is standard. Right-alignment is permitted for terminal-style data panels.
10. Never use rounded corners larger than 8px (r-card default). Cyberpunk interfaces have modest radius — large radius reads as mobile-app, not terminal.
11. Never add a secondary pattern alongside the grid. The grid is the only pattern — additional textures dilute its impact.
12. Never use the dual-tone effect on more than one headline per slide. Two glowing headlines create visual interference patterns that reduce legibility.

## CJK & International Content

Chinese, Japanese, and Korean text uses Noto Sans SC at 700 weight for display and 400 for body. The sans-serif character aligns with the futuristic, digital aesthetic — serif CJK in a cyberpunk context reads as anachronistic. Clash Display is the Latin headline voice; Noto Sans SC 700 is the CJK headline voice — both should feel modern, sharp, and designed.

CJK line-height minimum is 1.7 (compared to 1.5 for Latin body). CJK characters are denser and demand more vertical separation on dark backgrounds — the high contrast of light text on dark navy makes cramped CJK text particularly fatiguing.

CJK dual-tone treatment: the dual-tone text-shadow is designed for Latin letterforms with their varied ascenders, descenders, and counters. CJK characters are uniformly dense squares — the magenta offset creates visual noise rather than chromatic fringe. For CJK headlines, use the SINGLE cyan glow only: `text-shadow: 0 0 8px rgba(0,255,204,0.4)`. No magenta offset. The single glow preserves the neon atmosphere without the chromatic chaos.

Mixed Latin-CJK headlines: when CJK characters appear in a headline, use Noto Sans SC for the entire headline with single cyan glow. The Latin portion rendered in Noto Sans SC will look slightly different from Clash Display, but consistency within the headline block is more important than font-matching across scripts. Clash Display and Noto Sans SC should not mix in a single headline.

Terminal-style CJK: for data panels and terminal readouts that contain CJK, use JetBrains Mono for Latin portions and Noto Sans SC for CJK. The mono/sans-serif mix in a terminal context is authentic — real terminals use mixed fonts for mixed scripts.

CJK in the grid: the 64px grid dimensions are unaffected by script. Grid alignment remains consistent. CJK labels on grid axes use Satoshi 500 at label size with +0.04em letter-spacing.

For right-to-left scripts: text alignment mirrors to right. The dual-tone neon shadow offsets mirror: magenta offset to bottom-left instead of bottom-right. The grid remains unchanged — coordinate systems are culturally neutral.
