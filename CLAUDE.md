# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Web Video Studio is an AI-powered video production platform that converts articles, scripts, and blog posts into cinematic video presentations. It runs as a Next.js 16.2.7 app with an optional Electron desktop wrapper, SQLite persistence, and an AI agent that writes structured chapter blueprints compiled into React components.

## Common commands

All commands run from `web-video-studio/`:

```bash
npm run dev              # Next.js dev server on port 3100
npm run build            # Production build
npm run lint             # ESLint
npm run electron:dev     # Electron dev (compile TS then launch)
npm run electron:build:dmg  # Full macOS DMG build (next build → tsc → rebuild → electron-builder → sign)
```

There is no test suite — verification is manual (run the app, check the preview iframe).

## Repository layout

```
webvideo/
├─ web-video-studio/     # Main Next.js + Electron app
│  ├─ app/               # App Router (pages, API routes, layouts)
│  ├─ lib/               # All business logic (see below)
│  ├─ components/        # React components (landing/ + app UI)
│  ├─ stores/            # Zustand store (single project-store.ts)
│  ├─ electron/          # Electron shell (main, preload, menu, server, bootstrap)
│  ├─ data/              # SQLite database (studio.db in WAL mode)
│  ├─ projects/          # Per-project directories (content, Vite presentations, assets)
│  ├─ scripts/           # Build/signing scripts, backfill utilities
│  └─ docs/              # Architecture design documents
├─ frontend-slides/      # Vite presentation templates used as scaffold source
├─ skills/               # Skill definitions (main/ + aux/ subdirectories)
└─ docs/                 # Cross-project documentation
```

## Architecture: the production pipeline

The app converts source content into video through four stages:

1. **Writing** — AI generates `article.md` → `rhythm.md` → `script.md` → `outline.md`
2. **Building** — AI outputs `ChapterBlueprint` JSON → validator → compiler → TSX/CSS/narration files. Chapters are React components inside a Vite presentation project.
3. **Illustrating** (optional) — AI plans shots → generates images via gpt-image-2 or HeyGen
4. **Rendering** — Playwright screenshots each slide → ffmpeg assembles MP4

## Blueprint system (the core architecture)

AI does **not** write code directly. It outputs structured `ChapterBlueprint` JSON, and a deterministic compiler translates it to TSX. Three tiers:

- **Tier 1 (80%)**: Pick a template + fill slots. 14 templates in `lib/chapter-blueprint/templates/`
- **Tier 2 (15%)**: Compose from 11 primitives (Reveal, Stagger, Counter, ParticleField, etc.)
- **Tier 3 (5%)**: Custom JSX/CSS escape hatch, constrained by L3 design rules

Three-layer validation: L1 Zod schema → L2 semantic rules → L3 design constraints.

Key files:
- `lib/chapter-blueprint/types.ts` — all type definitions, template IDs, slot schemas
- `lib/chapter-blueprint/compiler.ts` — deterministic blueprint→TSX compiler
- `lib/chapter-blueprint/validator.ts` — three-layer validator
- `lib/chapter-blueprint/templates/` — 14 templates + registry

To add a template: create it in `templates/` → register in `registry.ts` → add to `TEMPLATE_IDS` and `SLOT_SCHEMAS` in `types.ts` → update enum in `tools.ts`.

## Agent/tool system

The AI agent (`lib/agent/`) uses Vercel AI SDK tool calling. Tools defined in `lib/agent/tools.ts` include: `ProjectRead`, `ProjectWrite`, `ProjectList`, `Bash`, `ValidateBlueprint`, `CompileChapter`, `GenerateImage`, `ReadChaptersTs`, `WriteChaptersTs`, and more. All tool schemas use Zod with path-traversal protection and command whitelisting.

The system prompt (`lib/agent/system-prompt.ts`, ~1300 lines) is built dynamically from project state, skill references, and user config.

## Skill system

Skills are directories under `skills/main/` (project-driving) and `skills/aux/` (user-enabled). Each has a `SKILL.md` manifest. `lib/skills.ts` discovers them at startup. Skill context is loaded into the AI system prompt via `lib/agent/skill-context.ts`.

## Key lib/ modules

| Module | Purpose |
|---|---|
| `db/index.ts`, `db/schema.ts` | Drizzle ORM + SQLite with auto-migration on startup |
| `auth.ts` | JWT sessions (HS256, 7-day `__sid` cookie) |
| `middleware.ts` | Auth gate: public paths bypass, everything else needs valid JWT |
| `events.ts` | In-process EventEmitter + SSE streaming for project lifecycle events |
| `scaffold.ts` | Clone Vite presentation template, npm install |
| `parallel-build.ts` | Concurrent chapter blueprint → compiled TSX |
| `dev-servers.ts` | Per-project Vite dev server lifecycle for preview iframe |
| `preview-state-machine.ts` | 5-state lifecycle: idle → starting → running → error/stopped |
| `render.ts` | Spawns detached worker: Playwright screenshots + ffmpeg assembly |
| `render-config.ts` | Resolution presets: preview(720p) / standard(1080p) / high(1440p) / ultra(4K) |
| `skills.ts` | Skill discovery, loading, reference file reading |
| `projects.ts` | Project file CRUD with path-traversal protection |
| `billing/` | Stripe + WeChat Pay, credit system, subscription plans |
| `fal.ts`, `heygen.ts` | External AI service wrappers |

## State management

Single Zustand store (`stores/project-store.ts`) with slices: Dev, Scaffold, Build, Playback, Preview, Project, StateMachine. `resetForNavigation()` clears all slices on project switch.

## Auth model

Middleware extracts JWT from `__sid` cookie, injects `x-user-id` and `x-user-role` headers. API routes use `lib/api-helpers.ts` (`getUserId()`, `requireProjectAccess()`) which read those headers. Public paths: `/`, `/login`, `/register`, `/download`, `/share/*`, `/draw`, plus webhooks and asset serving.

## Next.js version note

This project uses Next.js **16.2.7** — APIs, conventions, and file structure may differ from your training data. Read `node_modules/next/dist/docs/` before writing Next.js-specific code.
