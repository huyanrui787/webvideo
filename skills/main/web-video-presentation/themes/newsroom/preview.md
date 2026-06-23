# Newsroom Preview Card

Use this small file for title-chapter previews only. For full video generation, read the full design doc.

## Files
- Full design doc: `themes/newsroom/design.md`
- Preview card: `themes/newsroom/preview.md`

## Selection Metadata
- Slug: `newsroom`
- Tagline: Newsprint cream backdrop with ink-black serif type and banner red accent. Old-school broadsheet / documentary feel.
- Mood: light, newspaper, editorial, serif, documentary, warm
- Tone: authoritative, journalistic, direct, warm
- Formality: medium-high
- Density: high
- Scheme: light
- Best for: documentary / reportage, in-depth reviews, current-affairs commentary, AI product analysis, hot-topic interpretation
- Avoid for: light entertainment, brand image films, luxury / fashion, scenarios needing modern tech feel

## Visual Snapshot
Cream newsprint fills the frame — a warm off-white with the faintest paper texture, as if the slide were pulled straight from a broadsheet press. Ink-black Playfair Display headlines sit with zero border-radius, every corner sharp as a Linotype slug. A single banner-red accent stripe runs beneath the title, unmistakably NYT in its restrained authority. The typographic rhythm is dense and unhurried: serifs stack in columns, story hierarchy is built through weight and leading alone, and the whole composition feels reported rather than designed.

## Preview Ingredients
- Palette: shell=#ebe5d6 / surface=#f4ede0 / text=#1a1a1a / accent=#c9302c
- Typography: Playfair Display (display) + Noto Serif SC (Chinese display) + serif body pair
- Signature move: Zero border-radius on all containers — sharp newspaper corners throughout
- Signature move: Banner-red accent stripe beneath headlines, restrained NYT-style authority

## Preview Rules
- Build exactly one title chapter at 1920x1080 inside the fixed-stage model.
- Preserve the palette, type roles, and decorative vocabulary.
- Use the user's real title; do not copy demo content.
- Never place internal workflow text on the slide.
- Never place the theme name or slug on the slide itself.
