# Future: MyAnimeList support

Not built now — captured here so Phase 0–3 decisions don't make it painful to add later.

## Why it matters

A good chunk of anime fans use MyAnimeList (MAL), not AniList. If someone wants to match their list against a friend who only uses MAL, we need either (a) a provider abstraction, or (b) a one-way import. A provider abstraction is the clean answer.

## Reality check on the MAL side

- **MAL REST v2** (`api.myanimelist.net/v2`) requires a registered **Client ID** (free, takes 5 min on MAL dev portal). Reading a user's public PLAN_TO_WATCH list just needs the client ID in a header — no OAuth.
- **OAuth** is needed only for private lists or writes — out of scope, same as with AniList.
- **Jikan** (`api.jikan.moe`) is an unofficial REST wrapper that scrapes MAL with no auth. Useful as a fallback or for quick prototyping, but rate-limited (3 req/s) and not officially supported. We'll default to MAL v2 with Client ID and can fall back to Jikan if needed.
- **Rate limits** (MAL v2): documented as lenient; not publicly numbered. We use the same cache layer and should be fine.
- **Statuses**: MAL uses `plan_to_watch` / `watching` / `completed` / `on_hold` / `dropped`. AniList uses `PLANNING` / `CURRENT` / `COMPLETED` / `PAUSED` / `DROPPED`. Different strings, same concepts — normalize.
- **Fields returned**: a subset of what AniList gives. Crucially MAL does not return a sibling AniList ID, but AniList's `Media.idMal` gives us the MAL ID for free.

## The identifier problem

Same anime, different IDs on each service. We need a way to recognize "One Piece on AniList" and "One Piece on MAL" as the same row.

**Decision:** canonical `anime.id` stays as AniList's ID (most reliable, richest metadata), with a nullable `mal_id` column. When we fetch a list from MAL, we look up the AniList entry by `mal_id`; if not found, we fetch the AniList entry once (via AniList's `Media(idMal: $id)` query) and insert it with both IDs. AniList stays the source of truth for metadata; MAL is treated as a user-list source only.

This means **we add `mal_id` to the `anime` table from day 1**, populated from AniList's `idMal` field (already in the GQL response). Zero cost now, massive payoff later.

## Pre-payments we're making now (cheap future-proofing)

1. **Users table gets a `provider` column** (`anilist` | `mal`), default `'anilist'`. Unique constraint becomes `(provider, username)` instead of `username`. Rename the table from `anilist_users` to just `users`. One-time annoyance now; a real migration later if skipped.
2. **`anime.mal_id` column** (nullable, indexed) — populated from AniList's `idMal` on every list fetch.
3. **Error classes take a `provider` argument** — `UserNotFoundError(provider, username)`. Phase 1 always passes `"anilist"`, but the shape is ready.
4. **URL schema allows an optional `provider:` prefix on each `u` query param**:
   - `/?u=alice&u=bob` → both anilist (default, current state).
   - `/?u=anilist:alice&u=mal:bob` → mixed providers (future).
   - Parser rule: for each `u` value, split on first `:`; if left side is a known provider, use it, else treat the whole value as an anilist username.
   - **Guarantees:** every Phase 1 URL stays valid after MAL lands. No broken shares.
5. **Matching SQL already joins through `user_planning_entries` on user id**, not username — so no SQL change needed when users gain providers.

## Things we're deferring (don't over-engineer now)

- **`src/lib/providers/` structure.** Keep Phase 1 as `src/lib/anilist/`. When MAL lands, rename to `src/lib/providers/anilist/` and add `src/lib/providers/mal/` alongside a shared `provider-contract.ts` interface. Mechanical rename; no logic changes.
- **Per-row provider selector in the form.** Phase 1 form stays anilist-only. When MAL lands, each row gets a small provider dropdown.
- **Status normalization layer.** Trivial to add when we have two providers; premature now.
- **A genuine provider interface** (`interface AnimeListProvider { fetchPlanningList(username) }`). Phase 1's AniList client is written as a single function that matches this shape anyway — the extraction is renaming an import.
- **Anything MAL-auth-related** — OAuth, writes, private lists. Out of scope forever unless someone asks.

## When MAL is added later (rough plan)

1. Rename `src/lib/anilist/` → `src/lib/providers/anilist/`. Add `src/lib/providers/provider-contract.ts` with the interface.
2. Build `src/lib/providers/mal/` — client, queries (well, REST calls), schemas, errors. Same shape as AniList provider.
3. Update `ensureUserListCached` to dispatch on `provider`.
4. Add provider parsing to `src/app/page.tsx` (via the existing `parseUsernamesFromSearchParams` helper, which already delegates to `parseUsernameSegment`) and the Zod schema.
5. Update `UsernameListForm` to include per-row provider select.
6. Migration: backfill `provider = 'anilist'` on existing users (no-op if the column already has that default).
7. Add MAL-specific tests mirroring the AniList tests.

Estimated effort: ~2 days once AniList Phase 3 is done.

## Client ID setup (for when we add MAL)

- Register an app at https://myanimelist.net/apis
- Add `MAL_CLIENT_ID` to `src/config/env.ts` (treat as server-only, never expose to client)
- Include in requests as `X-MAL-CLIENT-ID` header
