# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server at http://localhost:5173
pnpm build        # Production build
pnpm preview      # Preview production build

pnpm test         # Run tests (vitest)
pnpm typecheck    # Type-check with vue-tsc

pnpm lint         # Run eslint + oxlint
pnpm format       # Format with oxfmt
pnpm fix          # Format + lint --fix

pnpm verify       # Full check: format + lint + typecheck + test
```

Run a single test file: `pnpm test -- path/to/file.test.ts`

## Architecture

This is a Vue 3 SPA (not Nuxt) using:

- **Vite** as the build tool
- **vue-router** with file-based routing via `vue-router/vite` plugin — pages go in `src/pages/`, routes are auto-generated into `src/route-map.d.ts`
- **Nuxt UI** (`@nuxt/ui`) as the component library, registered as a Vue plugin in `src/main.ts` and as a Vite plugin in `vite.config.ts`. The theme uses `primary: green`, `neutral: zinc`.
- **Tailwind CSS v4** (configured via the Nuxt UI Vite plugin)
- **Supabase** (`@supabase/supabase-js`) for backend

The app entry is `src/main.ts`, root component is `src/App.vue`, and global CSS is at `src/assets/css/main.css`.

## Development Workflow

This project follows a commit-by-commit approval process:

- Run `pnpm verify` before every commit — it must pass cleanly
- Write tests for each commit where testing makes sense
- Wait for explicit user approval before committing
- See `research.md` for the full migration plan and phase status

## Linting Rules

Key constraints enforced by `oxlint.config.ts`:

- No barrel files (`oxc/no-barrel-file`) — import directly from source files
- No default exports (`import/no-default-export`) — exception for `src/locales/*.ts`
- No circular imports (`import/no-cycle`)
- No CommonJS (`import/no-commonjs`)
- Vue props must use type-based declarations (`vue/define-props-declaration: type-based`)
- Vue refs must be typed (`vue/require-typed-ref`) — except in test files
- Vue emits must use type-literal declarations
