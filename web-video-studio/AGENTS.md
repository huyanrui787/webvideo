<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Design Context

See parent `PRODUCT.md` and `DESIGN.md` at repo root for the full spec. Quick reference for agent work:

- **Register:** product (studio workspace is the primary surface; landing page is secondary)
- **Creative North Star:** 白描画室 — monochrome base + one solid accent, typography carries hierarchy, color only signals function
- **Palette:** single solid indigo accent (`#6366f1`, ≤5% of any screen) on near-black dark base (`#0a0a0c`) / near-white light base (`#f7f7f8`). 5-tier text opacity ramp (92% → 12%). Status colors: green `#4ade80`, amber `#fbbf24`, red `#f87171`, blue `#60a5fa`
- **Typography:** Source Serif 4 for landing headings, Arial/system sans for body and all app UI. Mono for code only. Max 2 fonts per page.
- **Radius:** 12px for app components, 16px for landing cards. Never exceed 16px on cards.
- **Elevation:** flat-by-default. Background brightness tiers (`surface-dim` → `surface` → `surface-bright`) create depth. Shadows only on hover/dropdown/modal, never decorative.
- **Anti-AI rules (hard):** No CSS gradients anywhere. No colored box-shadow glow. No Inter/Roboto/Geist fonts. No glassmorphism. No nested cards. No gradient text (`background-clip: text`). No eyebrow kickers above every section. No numbered section markers (01/02/03). No border-left >1px as decoration.

When editing UI files, run `node .agents/skills/impeccable/scripts/context.mjs` once per session to load the full design context.
