# anilist-match — Overview

A rebuild of the legacy PoC at `../anilist-match-legacy`. Compares N AniList users' PLANNING lists and surfaces anime they could watch together.

## Why rebuild

The legacy version was a Next.js 13 MVP with no cache, 2-user-only matching, client-side `fetch` in `useEffect`, generic error handling, no shareable URLs, and a hardcoded dark theme. The AniList query shape and the "FINISHED-only" default are worth keeping; everything else gets redone.

## Design approach

**Phase 1 ships with intentionally minimal UI** — unstyled beyond shadcn primitive defaults, functional over pretty. Once Phase 1 works end-to-end, a design will be supplied (from Claude Design tool) and implemented before Phase 2's UX features. This keeps the initial build focused on correctness and lets the design inform later work.

## Architecture: Bulletproof React

This project follows the conventions from [bulletproof-react](https://github.com/alan2207/bulletproof-react/tree/master), adapted for Next.js App Router. The rules that shape our code organization:

- **Feature-based modules.** Most application code lives under `src/features/<feature>/` (not under `app/` or a flat `components/`). A feature is self-contained — its own `api/`, `components/`, `hooks/`, `types/`, `utils/` subfolders as needed.
- **Unidirectional imports.** Code flows shared → features → app. `src/app/` can import from features and shared modules; features can import from shared modules only; shared modules import from nothing app- or feature-specific. Enforced by ESLint `import/no-restricted-paths`.
- **No cross-feature imports.** Feature A never imports from feature B. Compose features at the app layer. Enforced by ESLint.
- **Absolute imports only.** `@/*` maps to `src/*`. No `../../../`.
- **Kebab-case files and folders.** Enforced by `eslint-plugin-check-file`.
- **No barrel files.** Import paths point at concrete modules, not `index.ts` re-exports.
- **TypeScript strict mode + Prettier + Husky + lint-staged** gate every commit.
- **Co-located types, schemas, and API declarations.** An API request declaration owns its request/response types, its Zod schema, and its fetcher together.
- **Env vars validated at startup** via Zod in `src/config/env.ts`. Reading `process.env.X` directly is banned by ESLint.
- **Error boundaries at route and feature level**, not just top-level.

Next.js specifics: `src/app/` is the Next router folder (pages / layouts / route handlers / server actions that are framework-coupled). Server Actions specific to a feature live in `src/features/<feature>/api/` and are re-exported or called from thin `src/app/...` entry points.

## Tech stack

- **Framework:** Next.js 17 App Router, RSC-first, Server Actions for form submit
- **Language:** TypeScript (strict)
- **Styling:** Tailwind v4 + shadcn/ui primitives. Dark theme only (no toggle)
- **Database:** Neon Postgres + Drizzle ORM (branch-per-preview on Vercel)
- **AniList client:** plain typed `fetch` + Zod response validation
- **Form validation:** Zod shared between client (inline errors) and Server Action
- **URL state:** nuqs for filter/sort query params (Phase 2)
- **Testing:** Vitest unit tests + one Playwright smoke with MSW
- **Code quality:** ESLint (with bulletproof-react import rules), Prettier, Husky + lint-staged, `eslint-plugin-check-file`
- **Deployment:** Vercel + Neon

## Project structure (bulletproof-react adapted for Next.js)

```
/Users/domucchi/Code/personal/anilist-match
├── src/
│   ├── app/                              Next.js App Router (routes only; thin)
│   │   ├── layout.tsx                    root layout, dark theme hardcoded
│   │   ├── page.tsx                      home — renders features/match/components/username-list-form
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── globals.css
│   │   └── match/[...usernames]/
│   │       ├── page.tsx                  RSC — calls features/match/api/get-matches
│   │       ├── loading.tsx               skeleton grid
│   │       └── error.tsx                 typed errors surfaced here
│   │
│   ├── components/                       shared UI primitives (not features)
│   │   └── ui/                           shadcn primitives
│   │
│   ├── config/
│   │   └── env.ts                        Zod-validated env vars
│   │
│   ├── features/
│   │   └── match/
│   │       ├── api/
│   │       │   ├── get-matches.ts        orchestrator — called by RSC page
│   │       │   └── submit-match.ts       Server Action
│   │       ├── components/
│   │       │   ├── username-list-form.tsx
│   │       │   ├── anime-card.tsx
│   │       │   ├── match-section.tsx
│   │       │   ├── filter-sidebar.tsx        Phase 2
│   │       │   ├── sort-dropdown.tsx          Phase 2
│   │       │   └── random-pick-button.tsx    Phase 2
│   │       ├── types/
│   │       │   └── index.ts
│   │       ├── utils/
│   │       │   └── group-by-match-count.ts
│   │       └── validation/
│   │           └── match-request.ts      shared Zod schema (form + action)
│   │
│   ├── lib/                              reusable libraries (no app / feature logic)
│   │   ├── anilist/
│   │   │   ├── client.ts                 fetch + retry + 429 backoff
│   │   │   ├── queries.ts                GQL query strings
│   │   │   ├── schemas.ts                Zod schemas
│   │   │   └── errors.ts                 UserNotFoundError, RateLimitError, ...
│   │   ├── cache/
│   │   │   └── list-cache.ts             get-or-fetch + staleness
│   │   └── db/
│   │       ├── index.ts                  drizzle client
│   │       ├── schema.ts                 tables
│   │       └── queries/
│   │           ├── users.ts
│   │           ├── anime.ts
│   │           └── matches.ts            matching SQL
│   │
│   ├── testing/
│   │   ├── fixtures/                     sample AniList payloads
│   │   └── mocks/                        MSW handlers
│   │
│   ├── types/                            globally shared types
│   └── utils/                            globally shared utils
│
├── drizzle/                              migrations
├── docs/                                 phase plans (this folder)
├── .husky/
├── .prettierrc
├── drizzle.config.ts
├── eslint.config.mjs                     import-path + kebab-case rules
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json                         strict; "@/*" path alias
└── .env.local                            DATABASE_URL, ANILIST_USER_AGENT
```

**Why only one feature?** Right now the whole app is one feature (`match`). The structure still pays off: `lib/` stays free of app-specific concerns, the Next router folder stays thin, and if we ever add a second feature (saved matches, user profiles, stats dashboard) it drops into `src/features/` without restructuring.

## Data model (Drizzle / Postgres)

Schema is shaped for single-provider (AniList) now but is forward-compatible with the planned [MyAnimeList addition](./future-multi-provider.md) — the `provider` column and `anime.mal_id` are cheap to add now and painful to retrofit later.

```
users
  id              serial pk
  provider        text not null default 'anilist'   -- 'anilist' | 'mal' (future)
  username        citext not null
  external_id     integer                           -- user id on the provider
  last_fetched_at timestamptz
  not_found       boolean default false             -- cache 404s briefly (5 min)
  unique (provider, username)

anime
  id              integer pk                         -- canonical = AniList media id
  mal_id          integer unique                     -- from AniList's idMal (may be null)
  title_romaji    text
  title_english   text
  genres          text[]
  average_score   integer
  popularity      integer
  episodes        integer
  format          text                               -- TV, MOVIE, OVA, ONA, ...
  status          text                               -- FINISHED, RELEASING, ...
  season_year     integer
  site_url        text
  cover_medium    text
  cover_large     text
  updated_at      timestamptz

user_planning_entries
  user_id         int fk -> users.id
  anime_id        int fk -> anime.id
  pk (user_id, anime_id)

index user_planning_entries (anime_id)
index anime (mal_id)
```

**Cache rules:**

- Fresh if `last_fetched_at` < 1 hour → serve from DB
- Stale (1h–24h) → serve from DB, background-refresh
- Older than 24h or missing → fetch synchronously, upsert, serve
- `not_found = true` → return 404 without re-hitting AniList for 5 minutes

## Matching algorithm

One SQL statement in `src/lib/db/queries/matches.ts`:

```sql
SELECT a.*,
       COUNT(DISTINCT upe.user_id) AS match_count,
       ARRAY_AGG(au.username ORDER BY au.username) AS matched_users
FROM user_planning_entries upe
JOIN anilist_users au ON au.id = upe.user_id
JOIN anime a          ON a.id  = upe.anime_id
WHERE au.username = ANY($usernames)
  AND ($onlyFinished = false OR a.status = 'FINISHED')
  -- Phase 2 filters slot in here (genres, formats, year range, min score)
GROUP BY a.id
HAVING COUNT(DISTINCT upe.user_id) >= 2
ORDER BY match_count DESC,
         a.average_score DESC NULLS LAST,
         a.popularity    DESC NULLS LAST,
         COALESCE(a.title_english, a.title_romaji) ASC;
```

Results grouped in JS by `match_count` (via `src/features/match/utils/group-by-match-count.ts`) and rendered as sections ("All 3 want to watch · 12 anime", "2 of 3 · 47 anime", …).

## Phases

- **[Phase 0 — Scaffold](./phase-0-scaffold.md)** — Next.js project, deps, Neon, Drizzle, shadcn, bulletproof-react tooling (ESLint rules, Prettier, Husky, env validation), dark theme
- **[Phase 1 — Lean MVP](./phase-1-mvp.md)** — N-user matching end-to-end with cache, shareable URLs, minimal UI
- **[Phase 2 — Design + UX features](./phase-2-ux.md)** — implement the supplied design, then add sort / filters / random pick / unanimous mode
- **[Phase 3 — Polish & deploy](./phase-3-polish.md)** — more tests, Playwright, OG images, a11y, Vercel deploy

## Future

- **[MyAnimeList support](./future-multi-provider.md)** — not built in Phases 0–3, but the schema, URL format, and error shapes are designed so it's a mechanical addition later.

## Open decisions (non-blocking)

- **"Only FINISHED" default:** `true` (matches legacy + "watch together now" intent). Easy to flip.
- **Max users per match:** 10.
- **Cache TTL:** 1h fresh / 24h stale. Tune after observing real usage.
- **OAuth / private lists:** out of scope. Public AniList PLANNING lists only.
