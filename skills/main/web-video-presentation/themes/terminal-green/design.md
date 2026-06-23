---
version: 1
name: Terminal Green
description: Matrix / 80s terminal — monospace only, phosphor green glow on true black. CRT scanlines. No serifs, no sans, no exceptions.
colors:
  shell: "#050a05"
  surface: "#0a0f0a"
  surface-2: "#0f150f"
  text: "#d3f0d3"
  text-2: "#a0d0a0"
  text-mute: "#508050"
  text-faint: "#305030"
  accent: "#00ff88"
  accent-soft: "rgba(0,255,136,0.12)"
  accent-glow: "rgba(0,255,136,0.40)"
  rule: "#00ff88"
typography:
  display-cn: { fontFamily: "JetBrains Mono", fontWeight: 700 }
  display-en: { fontFamily: "JetBrains Mono", fontWeight: 700 }
  body: { fontFamily: "JetBrains Mono", fontWeight: 400 }
  mono: { fontFamily: "JetBrains Mono", fontWeight: 500 }
components:
  rule: { width: "100%", height: "1px", style: "solid", background: "accent", description: "Phosphor green rule — solid, glowing, like a terminal cursor line. 1px weight with a subtle green text-shadow glow." }
  card: { borderRadius: "0", background: "surface", boxShadow: "0 0 0 1px #00ff88", description: "Zero-radius card with a 1px phosphor green border. No fill, no shadow — the border is the only elevation cue, like a terminal window frame." }
  hero-num: { font: "display-en", color: "accent", weight: 700, description: "JetBrains Mono at 700 in phosphor green with strong text-shadow glow (0 0 12px rgba(0,255,136,0.5)). The number pulses like a CRT readout." }
  stage-decoration: "CRT scanline overlay — alternating 1px transparent / 1px black at 8% opacity across the entire stage. Subtle screen curvature vignette (radial, 10% strength). Optional: slight chromatic aberration on phosphor text."
---

## Design Philosophy
Terminal Green is a time machine to the 1980s — a monospace-only theme that evokes CRT terminals, phosphor displays, and the hacker aesthetic of early computing. JetBrains Mono is the ONLY typeface — display, body, labels, code, numbers, everything. There are no serifs, no sans-serifs, no alternatives. The stage is true near-black (#050a05) with CRT scanlines and a subtle screen-curvature vignette. Phosphor green (#d3f0d3) is the text color — the color of characters on a green-screen monitor. A brighter phosphor accent (#00ff88) touches rules, borders, hero numbers, and text-shadow glows. This theme is for CLI tutorials, hacker/security content, technical demos, command-line walkthroughs, and retro-tech tributes. It is NOT for formal business, brand marketing, fashion/beauty, children's content, or non-technical audiences. IMPORTANT: CJK in monospace is unreadable at video scale — this theme is NOT CJK compatible.

## Colors
The palette is pure terminal: black, phosphor green, and brighter phosphor. Shell (#050a05) is true near-black — the CRT screen when powered on but displaying nothing. Not pure #000 (which would feel dead), but a barely-perceptible green-tinged black that feels alive. Surface (#0a0f0a) and surface-2 (#0f150f) create subtle elevation planes distinguished primarily by the green border, not luminance. Text (#d3f0d3) is phosphor green — the color of characters on a green-screen monitor. It is the default color for ALL text. Text-2 (#a0d0a0) is dimmer phosphor for secondary content. Text-mute (#508050) and text-faint (#305030) descend through dimmer green tones — like text at lower brightness levels. The accent (#00ff88) is a brighter, more saturated phosphor green — used for borders, rules, hero numbers, and text-shadow glows. Accent-glow at 40% is powerful enough for luminous CRT effects. There are NO other colors — no warm tones, no cool tones outside green, no neutrals.

## Typography
JetBrains Mono is the ONLY typeface in this theme — at 700 weight for display (headlines, hero numbers), 500 weight for labels and code emphasis, and 400 weight for body and code. The single-typeface constraint is the defining typographic characteristic: it creates an uncompromising terminal aesthetic where everything is rendered in monospace. This means proportional typefaces simply do not exist on this stage. Line-height for body text is 1.6 minimum — monospace needs more vertical breathing room than proportional type. Letter-spacing is 0 — monospace provides its own rhythm. Tabular figures are inherent in monospace — all numbers align automatically. CJK is NOT supported — Chinese/Japanese/Korean characters in monospace are unreadable at video scale. The theme is Latin-script only (with extended Latin, Cyrillic support).

## Layout & Components
The stage is a CRT screen — near-black with scanline overlay (alternating 1px transparent / 1px black at 8% opacity) and a subtle screen-curvature vignette (radial gradient, 10% strength). Cards are zero-radius with a 1px phosphor green border — no fill, no shadow. They read as terminal windows or dialog boxes. Rules are 1px solid phosphor green lines — terminal separators. Hero numbers are JetBrains Mono at 700 with a strong text-shadow glow (0 0 12px at 50% accent opacity) — they should feel like glowing CRT readouts. All text may optionally carry a subtle phosphor text-shadow (0 0 2px at 20% accent opacity) for authentic CRT character. Density is medium — terminal content tends toward lists and commands, not paragraphs. The cursor (if used in animations) is a blinking █ block in accent green.

## Do's
1. Use JetBrains Mono for EVERY character of text — display, body, labels, code, numbers, everything.
2. Apply the CRT scanline overlay at 8% opacity on every slide — it is the physical context.
3. Use phosphor green (#d3f0d3) as the default text color — brighter accent (#00ff88) only for emphasis.
4. Add a subtle text-shadow glow (0 0 2-4px at 15-20% accent) to key text elements.
5. Use 0 border-radius everywhere — terminals have sharp corners.
6. Render hero numbers with a strong glow (0 0 12px at 50%) — they are CRT readouts.
7. Use the cursor block character (█) for any animated cursor effects.

## Don'ts
1. Never use any typeface other than JetBrains Mono — no serifs, no sans-serifs, no alternatives.
2. Never use any color outside the green phosphor family — no red, blue, yellow, or white.
3. Never use rounded corners — terminals are sharp-edged, 0 radius only.
4. Never use pure black (#000000) — the shell (#050a05) must carry a microscopic green undertone.
5. Never use CJK content — monospace CJK is unreadable at video scale.
6. Never use soft shadows or elevation effects — borders are the only depth cue.
7. Never remove the scanline overlay — it is the physical signature of the CRT aesthetic.

## CJK Notes
CRITICAL: Terminal Green is NOT CJK compatible. Chinese, Japanese, and Korean characters in monospace are unreadable at video scale — CJK glyphs require proportional spacing and higher stroke density than monospace can provide. For CJK technical content, use blueprint (engineering) or neon-cyber (futuristic technical) instead. This theme should only be used for Latin-script content.
