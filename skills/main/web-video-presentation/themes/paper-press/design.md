---
version: 1
name: Paper Press
description: Midnight-press's daytime twin — same hot orange accent, same Instrument Serif voice, but on warm cream with paper texture.
colors:
  shell: "#d8cfb8"
  surface: "#efe7d6"
  surface-2: "#e8deca"
  text: "#1a1714"
  text-2: "#3a3028"
  text-mute: "#7a6a58"
  text-faint: "#a89a88"
  accent: "#ff4a2b"
  accent-soft: "rgba(255,74,43,0.10)"
  accent-glow: "rgba(255,74,43,0.22)"
  rule: "#c8bfa8"
typography:
  display-cn: { fontFamily: "Noto Serif SC", fontWeight: 700 }
  display-en: { fontFamily: "Instrument Serif", fontWeight: 400, fontStyle: "italic" }
  body: { fontFamily: "IBM Plex Sans", fontWeight: 400 }
  mono: { fontFamily: "IBM Plex Mono", fontWeight: 500 }
components:
  rule: { width: "100%", height: "1px", style: "solid", background: "rule", description: "Warm cream rule — understated, structural. Like a column rule in a magazine, present but never loud." }
  card: { borderRadius: "var(--r-card)", background: "surface", boxShadow: "0 2px 16px rgba(26,23,20,0.10)", description: "Cream card with subtle warm shadow. Distinguished from the shell by its lighter surface and paper-soft elevation." }
  hero-num: { font: "display-en", color: "accent", weight: 400, description: "Instrument Serif italic in hot orange. Tabular figures, 80-120px. The number is the thermal event on the warm page — like a red initial cap in a magazine spread." }
  stage-decoration: "Subtle paper texture at 5% opacity, multiply blend. Optional: warm center-weighted vignette (radial gradient, shell to slightly darker, 15% strength) for editorial focus."
---

## Design Philosophy
Paper Press is midnight-press's daytime twin — the same typographic DNA (Instrument Serif italic + hot orange accent), translated to a warm cream paper stage instead of espresso dark. Where midnight-press is cinematic and nocturnal, Paper Press is editorial and diurnal — a magazine read in morning light. The hot orange (#ff4a2b) carries the same thermal energy, but on cream it feels vibrant rather than dramatic. Instrument Serif italic retains its distinctive voice — refined, literary, slightly unconventional. The paper texture (multiply blend) provides physical tactility. This theme is for magazine-style content, lifestyle topics, everyday tool reviews, gentle tutorials, and accessible tech explainers. It is NOT for hardcore technical deep dives, hacker/security content, cyberpunk aesthetics, or pure entertainment.

## Colors
The palette is warm cream paper with a single hot orange spark. Shell (#d8cfb8) is warm cream — the paper color, warmer than newsprint, cooler than kraft. Surface (#efe7d6) is lighter cream for cards and elevated planes. Surface-2 (#e8deca) provides a mid-tone for nested elements. Text (#1a1714) is warm near-black — warmer and softer than pure black, like offset ink on uncoated paper. Text-2 (#3a3028) is warm dark brown for secondary copy. Text-mute (#7a6a58) and text-faint (#a89a88) descend through warm earth tones. The accent (#ff4a2b) is hot orange — the same accent as Midnight Press, creating a family relationship between the two themes. It touches hero numbers, section markers, and focal editorial emphasis at deliberately low opacity (10%, 22%). The rule (#c8bfa8) is a warm cream line — structural but gentle, like a column rule in a well-designed magazine.

## Typography
Instrument Serif italic at 400 weight is the voice — a distinctive editorial serif with unconventional proportions, sharp terminals, and a literary personality that feels both refined and slightly rebellious. The italic is structural — it IS the typeface identity. IBM Plex Sans at 400 handles body copy with clean neutrality — its geometric sans-serif character provides crisp contrast against Instrument Serif's expressive serif, creating the essential typographic tension. IBM Plex Mono at 500 serves technical content. CJK uses Noto Serif SC at 700 for display, matching Instrument Serif's editorial presence. Maximum two typefaces per slide. The italic-only display is a defining constraint.

## Layout & Components
The stage is warm cream paper with subtle texture (5% opacity, multiply blend) — providing tactility without competing with content. An optional warm center-weighted vignette (radial gradient, 15% strength) can focus attention for editorial layouts. Cards are lighter cream (surface) with subtle warm shadows — like magazine inserts on a cream page. Rules are 1px warm cream (#c8bfa8) — structural, gentle, like a column divider. Hero numbers are Instrument Serif italic in hot orange, tabular figures, 80-120px — the thermal event on the warm page, like a red drop cap in a magazine feature. Density is medium — room for editorial layouts with pull quotes, sidebars, and images. The rhythm is editorial: unhurried but not slow.

## Do's
1. Use Instrument Serif italic for all English display text — the italic is the typeface identity.
2. Use hot orange (#ff4a2b) ONLY for hero numbers, section markers, and focal editorial emphasis.
3. Apply the paper texture (5% opacity, multiply blend) consistently across all slides.
4. Pair Instrument Serif italic display with IBM Plex Sans body — the expressive/neutral contrast is the signature.
5. Use warm cream paper as the consistent stage — it is the daytime identity.
6. Consider a warm center vignette (15% strength) for text-heavy editorial slides.
7. Render CJK in Noto Serif SC at 700 weight to match Instrument Serif's editorial warmth.

## Don'ts
1. Never use pure black (#000000) for text — warm near-black (#1a1714) is the darkest permissible ink.
2. Never use more than one hot orange element per slide — the accent is a spark, not a fire.
3. Never fill a card with the hot orange accent — it is for type only, never for surfaces.
4. Never use Instrument Serif for body copy — it is a display typeface only.
5. Never use cool grays, cool blues, or any color outside the warm cream palette.
6. Never reduce the paper texture to 0% — the tactility is essential to the editorial feel.
7. Never use the hot orange for body text or any continuous reading text longer than 3 words.

## CJK Notes
Noto Serif SC at 700 weight for display and 400 weight for body carries the editorial literary character across scripts. CJK line-height minimum 1.75. The hot orange accent applies identically to CJK hero numbers and section markers. CJK has no italic; use weight shift for emphasis.
