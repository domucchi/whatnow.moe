# Phase 0 — Scaffold

> **Goal:** A fresh Next.js 17 project installed, connected to a Neon Postgres database, with an initial Drizzle schema pushed, dark theme applied, and the full [bulletproof-react](https://github.com/alan2207/bulletproof-react) tooling in place (strict TS, ESLint import rules, Prettier, Husky, env validation).

## Prerequisites

- Node 20+ and bun installed
- A Neon account (https://neon.tech)
- This directory exists and is empty: `/Users/domucchi/Code/personal/anilist-match`

## Steps

### 0.1 — Create Next.js project

- Run `bun create next-app .` inside the anilist-match folder.
- Answers: TypeScript ✓, ESLint ✓, Tailwind ✓, **`src/` dir ✓** (bulletproof-react requires this), App Router ✓, import alias `@/*` → `./src/*`, Turbopack ✓.
- Verify `bun dev` boots.

### 0.2 — Install core dependencies

```
bun add drizzle-orm @neondatabase/serverless zod nuqs
bun add -D drizzle-kit @types/node
```

### 0.3 — Initialize shadcn/ui

- Run `bunx shadcn@latest init`. Pick Default style, Neutral base color, CSS variables, components path `@/components/ui`.
- Add primitives: `button input label skeleton sheet badge dropdown-menu checkbox slider`.
- Commit the generated `src/components/ui/` files.

### 0.4 — TypeScript strict mode

- In `tsconfig.json` under `compilerOptions`, ensure: `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`, `"noFallthroughCasesInSwitch": true`.
- Confirm the path alias: `"paths": { "@/*": ["./src/*"] }`.
- Run `bunx tsc --noEmit` — clean.

### 0.5 — Prettier

```
bun add -D prettier prettier-plugin-tailwindcss
```

- `.prettierrc`:
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "trailingComma": "all",
    "printWidth": 100,
    "tabWidth": 2,
    "useTabs": false,
    "plugins": ["prettier-plugin-tailwindcss"]
  }
  ```
- `.prettierignore`: `node_modules`, `.next`, `drizzle/`, `bun.lock`.
- Add script: `"format": "prettier --write ."` and `"format:check": "prettier --check ."`.

### 0.6 — ESLint with bulletproof-react rules

Extend the Next default config to enforce our architecture.

```
bun add -D eslint-plugin-check-file eslint-plugin-import eslint-config-prettier
```

- `eslint.config.mjs` should include:
  - **Unidirectional imports** via `import/no-restricted-paths`:
    - `src/features/*` cannot import from `src/app/*`
    - `src/components`, `src/hooks`, `src/lib`, `src/types`, `src/utils` cannot import from `src/features/*` or `src/app/*`
  - **No cross-feature imports**:
    - `src/features/match` cannot import from `src/features` except itself (`./match`)
    - (Template ready for future features — duplicate the block.)
  - **Kebab-case filenames and folders** via `check-file/filename-naming-convention` and `check-file/folder-naming-convention` (scope: `src/**/!(__tests__)`).
  - **No direct `process.env` access** except in `src/config/env.ts` (via `no-restricted-syntax`).
  - **Prettier as last extends** so Prettier wins formatting conflicts.
- Run `bun lint` — clean.

### 0.7 — Husky + lint-staged pre-commit gate

```
bun add -D husky lint-staged
bunx husky init
```

- `.husky/pre-commit`: `bunx lint-staged` (one line).
- `package.json` `"lint-staged"`:
  ```json
  {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
  ```
- Add a separate pre-push hook `.husky/pre-push` that runs `bun typecheck && bun test` so commits stay fast but broken code can't be pushed.

### 0.8 — Env var validation (`src/config/env.ts`)

- Install: already have `zod`.
- Create `src/config/env.ts`:
  - Zod schema for `DATABASE_URL` (URL), `ANILIST_USER_AGENT` (non-empty string), `NODE_ENV` (enum).
  - `.parse(process.env)` at module load; throw on invalid config.
  - Export the parsed object as `env`.
- All code must import from `@/config/env` instead of reading `process.env` (enforced by ESLint rule from 0.6).
- Use `@t3-oss/env-nextjs` as an alternative if you want client/server split validation — optional.

### 0.9 — Create Neon project

- Create a new Neon project via dashboard or CLI.
- Grab the pooled connection string.
- Write `.env.local`:
  ```
  DATABASE_URL=postgresql://...neon.tech/...?sslmode=require
  ANILIST_USER_AGENT=anilist-match (https://github.com/<you>/anilist-match)
  ```
- Confirm `.env.local` is in `.gitignore` (Next default).

### 0.10 — Wire up Drizzle

- `drizzle.config.ts`: driver `neon-http`, schema at `./src/lib/db/schema.ts`, out at `./drizzle`.
- `src/lib/db/index.ts`: Drizzle client using `@neondatabase/serverless` + `env.DATABASE_URL` from `@/config/env`.
- `src/lib/db/schema.ts` with the three tables (`users`, `anime`, `user_planning_entries`) + indexes on `user_planning_entries.anime_id` and `anime.mal_id`. Use `citext` for `users.username`. Include `users.provider` (default `'anilist'`) and `anime.mal_id` (nullable) from day 1 — see [future-multi-provider.md](./future-multi-provider.md).
- First migration file `drizzle/0000_init.sql` starts with `CREATE EXTENSION IF NOT EXISTS citext;` before the tables.
- Run `bunx drizzle-kit generate` then `bunx drizzle-kit push`. Verify tables in Neon console.

### 0.11 — Dark theme (hardcoded)

- In `src/app/layout.tsx`, add `className="dark"` permanently to `<html>`.
- Keep `darkMode: 'class'` in `tailwind.config.ts`.
- Customize `.dark` tokens in `src/app/globals.css` or accept shadcn defaults.
- Replace default `page.tsx` with a placeholder `<h1>anilist-match</h1>` — real UI in Phase 1.

### 0.12 — Package scripts & sanity check

- `package.json` scripts:
  ```json
  {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "prepare": "husky"
  }
  ```
- Run `bun lint && bun typecheck && bun format:check` — all clean.
- Run `bun dev` → localhost:3000 shows the placeholder h1 on a dark background.
- Run `bun db:studio` → the three empty tables are visible.

### 0.13 — Initial commit

- Commit everything as `chore: scaffold project with bulletproof-react tooling`. First commit should include Husky + lint-staged so every future commit runs through them.

## Done when

- `bun dev` shows a dark page with "anilist-match"
- `bun db:studio` lists the three tables
- `.env.local` exists and is gitignored
- `src/components/ui/` has all the shadcn primitives
- `bun lint`, `bun typecheck`, `bun format:check` are all clean
- Attempting a commit with a TypeScript error or ESLint violation is blocked by the pre-commit hook (verify by breaking something intentionally)

## Notes

- No Vercel deploy yet — that's Phase 3. Phase 0 is strictly local.
- Nothing under `src/features/` exists yet — that's intentional. Features show up in Phase 1.
