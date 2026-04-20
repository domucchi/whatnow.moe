# Phase 2 — Design + UX features

> **Goal:** Implement the design supplied via Claude Design tool, then ship sort dropdown, filter sidebar, random-pick button, and unanimous-only mode. All filter/sort state lives in the URL so results are shareable.

> **Prerequisite:** Phase 1 is fully working end-to-end. A design has been provided.

> **Architecture reminder:** new components live in `src/features/match/components/`. New filter state schema extends `src/features/match/validation/match-request.ts`. Matching SQL in `src/lib/db/queries/matches.ts` already has the parameters stubbed from Phase 1.

## Steps

### 2.0 — Design implementation pass

- Review the supplied design and map each element to existing components (`username-list-form`, `anime-card`, `match-section`, `match-results`, `match-results-skeleton`, `match-results-error`).
- Create `docs/design-mapping.md` noting any new shared components, spacing/typography tokens, and shadcn overrides needed.
- Update `src/app/globals.css` / Tailwind theme tokens to match the design palette (still dark-only).
- Implement page-by-page. Keep behavior identical — this pass is pure visual redesign.
- **Done when:** every Phase 1 flow still works and visually matches the design.

### 2.1 — Sort dropdown

- **`src/features/match/components/sort-dropdown.tsx`** (`'use client'`) — shadcn `<DropdownMenu>`.
  - Options: `matches` (default), `score`, `popularity`, `year`.
  - URL-synced via `nuqs` (`useQueryState('sort')`).
- Extend `getMatches` signature to accept `sort`; switch `ORDER BY` on the param (keep `match_count DESC` first; vary the secondary key).
- Parse `searchParams` in `src/app/page.tsx` and pass to `getMatches`.

### 2.2 — Filter sidebar (broken into sub-steps)

- **2.2a — Extend Zod schema** — in `src/features/match/validation/match-request.ts`, wire up `genres?: string[]`, `formats?: ('TV'|'MOVIE'|'OVA'|'ONA'|'SPECIAL')[]`, `yearMin?`, `yearMax?`, `minScore?`, `includeAiring?: boolean`. Parse from URL.
- **2.2b — Wire filters into SQL** — in `src/lib/db/queries/matches.ts`, add the `WHERE` clauses from the overview (guarded by nullable params). Extend unit tests in `src/features/match/api/get-matches.test.ts`.
- **2.2c — Genre list source** — fetch AniList's `GenreCollection` query once (either at build time into a static JSON, or cached in a new `genres` meta table fetched on first request). Add the query to `src/lib/anilist/queries.ts` and a schema in `src/lib/anilist/schemas.ts`.
- **2.2d — Filter sidebar component** (`src/features/match/components/filter-sidebar.tsx`, `'use client'`):
  - Desktop: sticky sidebar. Mobile: shadcn `<Sheet>` triggered by a filter button.
  - Controls: genre multi-select (`<Checkbox>` list), format multi-select, year range (`<Slider>` 1960–current), min score (`<Slider>` 0–100), "include currently airing" `<Checkbox>`.
  - All controls URL-synced via `nuqs`.
  - "Reset filters" button clears URL params.
- **2.2e — Hook into results page** — parse all filter params in `src/app/page.tsx`, pass to `getMatches`, re-render sections.

### 2.3 — Random pick

- **`src/features/match/components/random-pick-button.tsx`** (`'use client'`):
  - Receives the currently-visible (post-filter/sort) anime list as a prop from the RSC page.
  - On click → cycles through random cards for ~1s with CSS animation, lands on one, scrolls into view, applies a highlight ring.
  - Accessibility: announces "Random pick: `title`" via `aria-live`.

### 2.4 — Unanimous mode

- Add `mode: 'any' | 'all'` (default `'any'`) to the Zod schema + URL params.
- In the matching SQL, when `mode = 'all'`, replace `HAVING COUNT(DISTINCT upe.user_id) >= 2` with `HAVING COUNT(DISTINCT upe.user_id) = $usernamesLength`.
- UI: `<Switch>` "Unanimous only" next to the sort dropdown.

## Done when

- Design is fully implemented across home, results, loading, error states.
- Sorting works and persists in URL; back-button restores previous sort.
- All filters apply correctly; URL is shareable and encodes the exact filter state.
- Random pick animates and highlights one card from the current visible set.
- Unanimous toggle reduces results to only anime everyone wants.
- Matching SQL variants have unit tests in `src/features/match/api/get-matches.test.ts`.
- `bun run lint && bun run typecheck` still clean; no cross-feature-import violations introduced.
