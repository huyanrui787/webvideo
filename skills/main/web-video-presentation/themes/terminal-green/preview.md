# Terminal Green Preview Card

Use this small file for title-chapter previews only. For full video generation, read the full design doc.

## Files
- Full design doc: `design.md`
- Preview card: `preview.md`

## Selection Metadata
- Slug: `terminal-green`
- Tagline: True-black with phosphor-green accent. JetBrains Mono everywhere. Matrix / 80s terminal.
- Mood: dark, terminal, hacker, monospace, phosphor
- Tone: geeky, retro, precise
- Formality: low
- Density: medium
- Scheme: dark
- Best for: CLI工具教程, 黑客/安全, 技术演示
- Avoid for: 正式商务, 品牌营销, 时尚/美妆

## Visual Snapshot
A true-black screen glows with phosphor-green text, every character rendered in JetBrains Mono at a uniform monospaced width. Faint CRT scanlines run horizontally across the frame, slightly dimming every other row in the classic interlaced-display pattern. A subtle green text-shadow bloom radiates from every glyph, the phosphor glow bleeding just slightly into the black. The composition is all right angles — zero border-radius, everything snapped to a monospace grid. A blinking green block cursor sits at the end of the title line, mid-blink. The frame feels like a VT100 terminal that has been running since 1983.

## Preview Ingredients
- Palette: shell=#050a05 / surface=#0a0f0a / text=#d3f0d3 / accent=#00ff88
- Typography: JetBrains Mono display + JetBrains Mono body + JetBrains Mono
- Signature move: CRT scanline overlay with phosphor-green text-shadow bloom on every glyph
- Signature move: JetBrains Mono everywhere — monospaced grid, zero border-radius, blinking block cursor

## Preview Rules
- Build exactly one title chapter at 1920x1080 inside the fixed-stage model.
- Preserve the palette, type roles, and decorative vocabulary.
- Use the user's real title; do not copy demo slide content.
- Never place internal workflow text on the slide.
- Never place the theme name or slug on the slide itself.
