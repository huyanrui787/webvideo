# Midnight Press Preview Card

Use this small file for title-chapter previews only. For full video generation, read the full design doc.

## Files
- Full design doc: `themes/midnight-press/design.md`
- Preview card: `themes/midnight-press/preview.md`

## Selection Metadata
- Slug: `midnight-press`
- Tagline: Warm dark backdrop with a single hot accent. Cinematic, editorially refined, developer-aesthetic.
- Mood: dark, cinematic, terminal, developer, warm
- Tone: literary, sober, polished, warm
- Formality: medium-high
- Density: medium
- Scheme: dark
- Best for: developer tutorials, AI / tool reviews, geek product intros, technical deep dives, cinematic narrative
- Avoid for: children's education, casual lifestyle vlog, outdoor brands, medical / health

## Visual Snapshot
The frame opens on warm espresso black — not the cold void of #000, but a deep brown-black that recalls a darkened screening room. A single hot-orange accent cuts through the vignette like a struck match, pulling the eye to the title set in Instrument Serif italic for English and Noto Serif SC for Chinese. The 140x100 padding breathes generous editorial whitespace around the text block, while the soft darkened edges of the vignette push depth toward center. The result is literary, cinematic, and quietly authoritative — a developer's private cinema.

## Preview Ingredients
- Palette: shell=#0d0b09 / surface=#1a1714 / text=#f5f0e5 / accent=#ff4a2b
- Typography: Instrument Serif italic (English display) + Noto Serif SC (Chinese display) + editorial body pair
- Signature move: Vignette overlay darkening frame edges, cinema-screen depth
- Signature move: 140x100 generous padding breathing editorial negative space around the text block

## Preview Rules
- Build exactly one title chapter at 1920x1080 inside the fixed-stage model.
- Preserve the palette, type roles, and decorative vocabulary.
- Use the user's real title; do not copy demo content.
- Never place internal workflow text on the slide.
- Never place the theme name or slug on the slide itself.
