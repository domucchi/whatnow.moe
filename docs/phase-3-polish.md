# Phase 3 — Polish & deploy

> **Goal:** Ship it. Fill in remaining tests, accessibility, performance polish, OG images for shared URLs, and deploy to Vercel + Neon production.

## Steps

### 3.1 — Test coverage

- **`src/lib/anilist/schemas.test.ts`** — full coverage of known-good + known-bad AniList payloads (null `MediaListCollection`, empty `lists`, partial `media`).
- **`src/lib/cache/list-cache.test.ts`** — fresh / stale / missing / not-found-cached paths with DB mocked.
- **`src/features/match/api/get-matches.test.ts`** — all Phase 2 filter/sort variants plus unanimous mode.
- Aim: matching orchestrator and cache layer fully covered; UI not unit-tested (Playwright handles it).

### 3.2 — Playwright smoke test

- Install Playwright: `pnpm add -D @playwright/test msw`.
- Set up MSW handlers in `src/testing/mocks/anilist-handlers.ts` that intercept `https://graphql.anilist.co` and return fixtures from `src/testing/fixtures/` for 2–3 test usernames.
- `tests/e2e/match.spec.ts` (top-level `tests/e2e/` — not under `src/` since Playwright runs outside the app):
  - Navigate to `/`, fill form with two fixture usernames, submit.
  - Assert redirect to `/match/alice/bob`.
  - Assert grouped sections render with expected counts.
  - Assert clicking "Random pick" scrolls a card into view.

### 3.3 — Accessibility pass

- Run `pnpm dlx @axe-core/cli http://localhost:3000` on home and results pages.
- Keyboard-only walkthrough: tab order on form, filter sidebar, random-pick button.
- Verify focus rings visible, labels associated, `aria-live` on dynamic regions (random pick announcement, filter result count).

### 3.4 — OG images for shareable URLs

- Add `src/app/match/[...usernames]/opengraph-image.tsx` using Next.js's `ImageResponse`.
- Render a simple card: "matches for `alice` · `bob` · `charlie`" + site name. No DB call needed (static generation from params).
- Verify preview on `https://www.opengraph.xyz/` or equivalent.

### 3.5 — Performance polish

- Verify `next/image` is used for all AniList covers with `remotePatterns` in `next.config.ts`.
- Add `priority` to the first row of the results grid.
- Audit bundle with `pnpm build` — keep route bundles under 150 KB gzipped.
- Confirm `/match/[...]` is rendered on-demand (dynamic RSC) — not attempted at build.

### 3.6 — Migrations & production DB

- Switch from `drizzle-kit push` to proper migration files (`drizzle-kit generate` → commit the SQL → apply via `drizzle-kit migrate`).
- Create a Neon production branch; separate `DATABASE_URL_PROD`.
- Run migrations against prod branch.

### 3.7 — Vercel deploy

- Connect the GitHub repo to Vercel.
- Set env vars in Vercel: `DATABASE_URL` (prod), `ANILIST_USER_AGENT`.
- Configure preview deploys to use a Neon branch per PR (via Neon's Vercel integration).
- Verify first production deploy works end-to-end.

### 3.8 — (Optional) Vercel Cron for anime refresh

- `src/app/api/cron/refresh-anime/route.ts` — secured by `CRON_SECRET` header (add `CRON_SECRET` to `src/config/env.ts`).
- Query: find `anime` rows with `updated_at < now() - interval '7 days'` AND appearing in `user_planning_entries` — refetch from AniList and update.
- Register in `vercel.json` with `schedule: "0 4 * * *"` (daily at 04:00 UTC).

### 3.9 — README
- Write a project `README.md` covering: what it does, tech stack, local setup (Neon, `.env.local`, `pnpm install`, `pnpm db:push`, `pnpm dev`), deployment link, a screenshot.

## Done when

- All unit + Playwright tests pass in CI (GitHub Actions hooked to Vercel).
- Axe accessibility scan is clean on home and results pages.
- Shared `/match/...` URL renders a nice OG preview in a chat app.
- Production URL on Vercel serves the app; Neon prod DB is populated via first real requests.
- README exists with local-setup steps.
- `pnpm lint && pnpm typecheck && pnpm test` are all clean — bulletproof-react import rules still hold with all Phase 2 + 3 additions.
