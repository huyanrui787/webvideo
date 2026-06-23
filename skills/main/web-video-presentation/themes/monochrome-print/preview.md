# Monochrome Print Preview Card

Use this small file for title-chapter previews only. For full video generation, read the full design doc.

## Files
- Full design doc: `themes/monochrome-print/design.md`
- Preview card: `themes/monochrome-print/preview.md`

## Selection Metadata
- Slug: `monochrome-print`
- Tagline: Off-white paper with ink-black serif text and single ink-blue accent. Quiet, sophisticated, considered.
- Mood: light, print, minimal, serif, monochrome, sophisticated
- Tone: literary, considered, neutral, honest
- Formality: high
- Density: high
- Scheme: light
- Best for: deep-reading adaptations, academic / intellectual content, brand stories, premium products, culture / arts commentary
- Avoid for: entertainment / gaming, children's content, promotions / fast-moving consumer goods, marketing needing visual punch

## Visual Snapshot
An off-white paper field holds nothing but type and the thinnest possible rules — 1px solid hairlines and 4px refined corner radii that whisper rather than declare. Source Serif runs at display scale in pure ink-black, while the single ink-blue accent marks only what must be marked: a chapter number, a datum, the one fact that matters. There is no decoration, no gradient, no glow. The visual confidence comes entirely from what is withheld — the breathable whitespace, the considered leading, and the quiet authority of a page that trusts the reader. It evokes Monocle, Wallpaper, MIT Press: culture built from restraint.

## Preview Ingredients
- Palette: shell=#f5f3ee / surface=#fbfaf6 / text=#0a0a0a / accent=#1d4ed8
- Typography: Source Serif (display + body, single serif family throughout)
- Signature move: 1px solid hairline rules with 4px refined corner radii — the only decorative element
- Signature move: Ink-blue accent used exclusively for the single most important datum on the slide

## Preview Rules
- Build exactly one title chapter at 1920x1080 inside the fixed-stage model.
- Preserve the palette, type roles, and decorative vocabulary.
- Use the user's real title; do not copy demo content.
- Never place internal workflow text on the slide.
- Never place the theme name or slug on the slide itself.
