# Phase 3 — Polish & deploy

> **Goal:** Ship it. Fill in remaining tests, accessibility, performance polish, OG images for shared URLs, and deploy to Vercel + Neon production.

## Steps

### 3.1 — Test coverage

- **`src/lib/anilist/schemas.test.ts`** — full coverage of known-good + known-bad AniList payloads (null `MediaListCollection`, empty `lists`, partial `media`).
- **`src/lib/cache/list-cache.test.ts`** — fresh / stale / missing / not-found-cached paths with DB mocked.
- **`src/features/match/api/get-matches.test.ts`** — all Phase 2 filter/sort variants plus unanimous mode.
- Aim: matching orchestrator and cache layer fully covered; UI not unit-tested (Playwright handles it).

### 3.2 — Playwright smoke test

- Install Playwright: `bun add -D @playwright/test msw`.
- Set up MSW handlers in `src/testing/mocks/anilist-handlers.ts` that intercept `https://graphql.anilist.co` and return fixtures from `src/testing/fixtures/` for 2–3 test usernames.
- `tests/e2e/match.spec.ts` (top-level `tests/e2e/` — not under `src/` since Playwright runs outside the app):
  - Navigate to `/`, fill form with two fixture usernames, submit.
  - Assert the URL becomes `/?u=alice&u=bob` and results render in place (no separate route).
  - Assert the form stays visible at the top and can be edited without navigating away.
  - Assert grouped sections render with expected counts.
  - Assert clicking "Random pick" scrolls a card into view.

### 3.3 — Accessibility pass

- Run `bunx @axe-core/cli http://localhost:3000` on home and results pages.
- Keyboard-only walkthrough: tab order on form, filter sidebar, random-pick button.
- Verify focus rings visible, labels associated, `aria-live` on dynamic regions (random pick announcement, filter result count).

### 3.4 — OG images for shareable URLs

- Add `src/app/opengraph-image.tsx` using Next.js's `ImageResponse`.
- Ideal: read `searchParams` and render "matches for `alice` · `bob` · `charlie`" + site name. If Next doesn't expose `searchParams` to `opengraph-image.tsx` in the current version, fall back to a generic site-wide OG ("whatnow.moe — find anime you and your friends all want to watch") and accept that per-match previews are lost. Call this out as a trade-off of the single-page design, not a blocker.
- Verify preview on `https://www.opengraph.xyz/` or equivalent.

### 3.5 — Performance polish

- Verify `next/image` is used for all AniList covers with `remotePatterns` in `next.config.ts`.
- Add `priority` to the first row of the results grid.
- Audit bundle with `bun build` — keep route bundles under 150 KB gzipped.
- Confirm `/` is rendered on-demand (dynamic RSC) whenever `searchParams` are present — not attempted at build.

### 3.6 — Migrations & production DB

- Switch from `drizzle-kit push` to proper migration files (`drizzle-kit generate` → commit the SQL → apply via `drizzle-kit migrate`).
- Create a Neon production branch; separate `DATABASE_URL_PROD`.
- Run migrations against prod branch.

### 3.7 — CI-gated Vercel deploy

The Vercel Git integration is intentionally NOT connected — Vercel's default auto-deploy does not wait for GitHub Actions, so a failing build could still ship. Instead `.github/workflows/ci.yml` drives the production deploy via the Vercel CLI, and only after `check` passes.

- Run `bunx vercel@latest login` and `vercel link` once locally to register the project with the Vercel org; capture `orgId` and `projectId` from `.vercel/project.json`.
- Add three GitHub repo secrets: `VERCEL_TOKEN` (from https://vercel.com/account/tokens), `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Set env vars in Vercel Project Settings (NOT as GitHub secrets): `DATABASE_URL` and `ANILIST_USER_AGENT` for Production. `vercel pull --environment=production` fetches them into `.vercel/.env.production.local` at build time.
- On pushes to `main`, `check` runs first (lint, typecheck, test). On success, `deploy-production` runs `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`. PRs are not deployed — they only run `check`.
- Confirm in Vercel dashboard that Project → Settings → Git shows "No Git Repository Connected".

### 3.8 — (Optional) Vercel Cron for anime refresh

- `src/app/api/cron/refresh-anime/route.ts` — secured by `CRON_SECRET` header (add `CRON_SECRET` to `src/config/env.ts`).
- Query: find `anime` rows with `updated_at < now() - interval '7 days'` AND appearing in `user_planning_entries` — refetch from AniList and update.
- Register in `vercel.json` with `schedule: "0 4 * * *"` (daily at 04:00 UTC).

### 3.9 — README

- Write a project `README.md` covering: what it does, tech stack, local setup (Neon, `.env.local`, `bun install`, `bun db:push`, `bun dev`), deployment link, a screenshot.

## Done when

- All unit + Playwright tests pass in CI (GitHub Actions gates every Vercel deploy).
- Axe accessibility scan is clean on home and results pages.
- Shared `/?u=...` URL renders a nice OG preview in a chat app (or, if `searchParams` aren't available to `opengraph-image.tsx`, the generic site OG is good enough).
- Production URL on Vercel serves the app; Neon prod DB is populated via first real requests.
- README exists with local-setup steps.
- `bun lint && bun typecheck && bun test` are all clean — bulletproof-react import rules still hold with all Phase 2 + 3 additions.
