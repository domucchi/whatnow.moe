# Phase 1 — Lean MVP

> **Goal:** A user can visit `/`, enter 2–10 AniList usernames, and land on `/match/u1/u2/...` that renders anime common to their PLANNING lists, grouped by match count. Postgres caches AniList responses. Errors are typed and shown clearly.

> **UI note:** Keep the UI intentionally minimal in this phase — default shadcn styling, plain layouts, no custom design work. Once Phase 1 is functional end-to-end, a real design will be supplied (from Claude Design tool) and implemented at the start of Phase 2.

> **Architecture:** Bulletproof-react layout. `src/lib/*` holds framework-agnostic libraries (AniList client, DB, cache). `src/features/match/*` holds all matching-specific code (orchestrator, components, types, validation). `src/app/*` is thin — route entries that call feature code.

> **Multi-provider readiness:** Phase 1 is AniList-only, but a few shapes are pre-wired for the [future MyAnimeList addition](./future-multi-provider.md): `provider` is a parameter on users, errors accept a `provider` argument, and `idMal` is captured from AniList responses into `anime.mal_id`. No extra work beyond what's spelled out below.

## Steps

### 1.1 — AniList client layer (`src/lib/anilist/`)

- **`queries.ts`** — export GQL query strings as template literals:
  - `PLANNING_LIST_QUERY` — variables `{ userName: String }`, returns `MediaListCollection(userName, type: ANIME, status: PLANNING)` with `media { id, idMal, title{romaji,english}, genres, averageScore, popularity, episodes, format, status, seasonYear, siteUrl, coverImage{medium,large} }`. `idMal` populates `anime.mal_id` for later MAL support.
- **`schemas.ts`** — Zod schemas mirroring the response: `AnilistMediaSchema`, `MediaListCollectionSchema`, `PlanningListResponseSchema`. Use `.nullable()` where AniList may return null (it will for unknown users).
- **`errors.ts`** — typed error classes: `UserNotFoundError(provider, username)`, `RateLimitError(provider)`, `ProviderDownError(provider)`, `ProviderSchemaError(provider, cause)`. Each extends `Error` with a discriminator `name` for `error.tsx` to branch on. Phase 1 always passes `provider: 'anilist'`; the shape is ready for MAL later.
- **`client.ts`** — `async function anilistFetch<T>(query, variables, schema): Promise<T>`:
  - POST to `https://graphql.anilist.co` with `Content-Type: application/json` and `User-Agent: env.ANILIST_USER_AGENT`.
  - On 200 → parse JSON → `schema.parse`; throw `AnilistSchemaError` on Zod failure.
  - On 429 → read `Retry-After`, retry with backoff up to 2 times; then throw `RateLimitError`.
  - On 5xx → exponential backoff up to 2 retries; then throw `AniListDownError`.
  - On 404 or `MediaListCollection === null` → throw `UserNotFoundError(username)`.
- **Tests (colocated):** `src/lib/anilist/schemas.test.ts` — known-good + known-bad JSON fixtures.

### 1.2 — DB query helpers (`src/lib/db/queries/`)

- **`users.ts`** — all functions take `(provider, username)` so MAL slots in without a signature change. Phase 1 callers pass `'anilist'` as a literal.
  - `upsertUser(provider, username, externalId?)` — returns the row id; `ON CONFLICT (provider, username) DO UPDATE`.
  - `markUserNotFound(provider, username)` — sets `not_found = true`, `last_fetched_at = now()`.
  - `getUserMeta(provider, username)` — `{ id, last_fetched_at, not_found } | null`.
- **`anime.ts`**
  - `upsertAnimeBatch(animes)` — bulk insert with `ON CONFLICT (id) DO UPDATE` on mutable fields.
- **`matches.ts`**
  - `replaceUserPlanningEntries(userId, animeIds[])` — transaction: delete existing for user, insert new set.
  - `getMatches({ usernames, onlyFinished, filters?, sort? })` — the SQL from overview. Returns typed `AnimeWithMatchInfo[]`. Filters & sort nullable/disabled in Phase 1; the parameters already exist so Phase 2 just wires them up.

### 1.3 — Cache layer (`src/lib/cache/list-cache.ts`)

- **`ensureUserListCached(provider, username): Promise<void>`** — takes `provider` so MAL plugs in later without touching callers. Phase 1 callers always pass `'anilist'`.
  - Look up `getUserMeta(provider, username)`.
  - If `not_found` and younger than 5 min → throw `UserNotFoundError(provider, username)`.
  - If `last_fetched_at` < 1h → return (fresh).
  - If 1h–24h → return immediately, kick off background refresh via Next's `after()` helper.
  - If > 24h or missing → synchronously fetch from AniList, upsert user, upsert anime batch (including `mal_id` from `idMal`), replace planning entries, set `last_fetched_at`.
- **Tests (colocated):** `src/lib/cache/list-cache.test.ts` — fresh / stale / missing / not-found cached paths with DB mocked.

### 1.4 — Match feature (`src/features/match/`)

- **`types/index.ts`** — `MatchRequest`, `AnimeWithMatchInfo`, `MatchGroup = { groupCount: number; total: number; animes: AnimeWithMatchInfo[] }`, `MatchResult = MatchGroup[]`.
- **`validation/match-request.ts`** — Zod schema consumed by both form and server action:
  - `usernames: z.array(z.string().regex(/^[A-Za-z0-9_]{1,32}$/)).min(2).max(10).transform(dedupe-lowercase)`
  - `onlyFinished: z.boolean().default(true)`
  - Phase 2 fields (genres, formats, yearMin, yearMax, minScore, sort, mode) — declare as `.optional()` now so types are stable.
  - **URL parsing helper** `parseUsernameSegment(segment): { provider, username }` — split on first `:`; if the left side is a known provider, use it; else treat the whole segment as an `anilist` username. Phase 1 only ever sees non-prefixed segments; this keeps `/match/alice/bob` stable when MAL lands and `/match/mal:alice/bob` becomes valid.
- **`utils/group-by-match-count.ts`** — pure function; takes rows with `match_count` and returns `MatchGroup[]` sorted desc.
- **`api/get-matches.ts`** — orchestrator, called by the RSC page:
  - Validate + normalize request against `validation/match-request.ts`.
  - `await Promise.all(usernames.map(ensureUserListCached))` — throws typed errors if any user not found / rate limited.
  - Call `getMatches(...)` from `@/lib/db/queries/matches`.
  - Group via `group-by-match-count` and return `MatchResult`.
- **`api/submit-match.ts`** — `'use server'` action:
  - Accept `FormData`, parse with Zod, return `{ errors }` on failure.
  - On success → `redirect('/match/' + usernames.join('/'))`.
- **Tests (colocated):** `src/features/match/api/get-matches.test.ts` — 2-user, 3-user, 5-user fixtures; user-not-found propagation; tiebreak ordering (score > popularity > title); grouping; `onlyFinished` on/off.

### 1.5 — Components (`src/features/match/components/`)

Minimal styling — unstyled beyond shadcn primitive defaults.

- **`username-list-form.tsx`** (`'use client'`):
  - `useActionState` against `@/features/match/api/submit-match`.
  - Starts with 2 rows; "+ Add user" up to 10; remove row button per row.
  - Per-row inline error from the action's return.
  - Inputs: shadcn `<Input>`. Submit: shadcn `<Button>`.
- **`match-section.tsx`** (RSC):
  - Props: `{ group: MatchGroup; totalUsers: number }`.
  - Header: "3 of 3 want to watch · 12 anime".
  - Grid: `grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4`.
- **`anime-card.tsx`** (RSC):
  - `<a href={siteUrl} target="_blank" rel="noopener">` wraps the card.
  - `next/image` for cover, title (english || romaji), score, genres as shadcn `<Badge>`s, small matched-users pill strip.

### 1.6 — Route entries (`src/app/`)

Keep these thin — they import from the feature.

- **`src/app/page.tsx`**:
  - Server component. Renders `<h1>` + tagline + `<UsernameListForm />` from `@/features/match/components/username-list-form`.
- **`src/app/match/[...usernames]/page.tsx`** (RSC):
  - `const { usernames } = await params;`
  - Map each segment through `parseUsernameSegment` (returns `{ provider: 'anilist', username }` for all Phase 1 URLs).
  - Call `getMatches({ users, onlyFinished: true })` from `@/features/match/api/get-matches` where `users: { provider, username }[]`.
  - Render header ("Matches for alice, bob, charlie" + "Edit users" link to `/`).
  - Loop over `MatchResult[]` → render `<MatchSection>` per group.
  - Empty state: centered text, no illustration.
- **`src/app/match/[...usernames]/loading.tsx`** — skeleton grid using shadcn `<Skeleton>`.
- **`src/app/match/[...usernames]/error.tsx`** (`'use client'`) — switches on `error.name`, reading `error.provider` and `error.username` when set:
  - `UserNotFoundError` → "User `X` not found on AniList."
  - `RateLimitError` → "AniList is rate-limiting us — try in a minute."
  - `ProviderDownError` → "Something went wrong fetching from AniList."
  - Default → generic fallback.

### 1.7 — `next.config.ts`

- `images.remotePatterns` for `s4.anilist.co` and `img.anili.st`.

### 1.8 — Test plumbing

- Install: `pnpm add -D vitest @vitest/ui`.
- Create `vitest.config.ts` with the `@/*` path alias mirrored from `tsconfig.json` (via `vite-tsconfig-paths`).
- Scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.
- `src/testing/fixtures/` — JSON fixtures for AniList responses (used by tests in 1.1 and 1.4).

## Done when

- `/` renders the form (2 rows + add/remove).
- Submitting 2 real usernames redirects to `/match/u1/u2` and shows grouped results from a cold cache (~2 AniList fetches).
- Reloading within 1h shows results with zero AniList fetches (verify via server log / Neon query log).
- Submitting an invalid username shows the inline Zod error without hitting the server.
- Submitting a nonexistent user shows "User `xyz` not found" via `error.tsx`.
- 3+ users show correctly grouped sections.
- `pnpm test` passes matching + schema + cache unit tests.
- `pnpm lint && pnpm typecheck` stay clean (bulletproof import rules didn't flag anything).

## Hand-off to Phase 2

Once Phase 1 is done, pause and import the design from Claude Design tool. Phase 2 begins with implementing that design over the existing minimal UI, then layering on sort / filter / random-pick / unanimous mode.
