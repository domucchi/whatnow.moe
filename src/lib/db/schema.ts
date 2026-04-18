import { sql } from 'drizzle-orm';
import {
  boolean,
  customType,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * Case-insensitive text via Postgres's `citext` extension.
 * The extension is enabled by the initial migration (`drizzle/0000_*.sql`).
 * On a fresh database, run `pnpm db:migrate` — `db:push` bypasses migration
 * files and will fail on the `citext` column type until the extension exists.
 */
const citext = customType<{ data: string; driverData: string }>({
  dataType: () => 'citext',
});

/**
 * Tracked AniList / MyAnimeList users whose planning lists we've fetched.
 * `provider` is forward-compatible with the planned MAL addition — see
 * `docs/future-multi-provider.md`. Phase 1 only writes `'anilist'`.
 */
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    provider: text('provider').notNull().default('anilist'),
    username: citext('username').notNull(),
    externalId: integer('external_id'),
    lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
    notFound: boolean('not_found').notNull().default(false),
  },
  (table) => [uniqueIndex('users_provider_username_unique').on(table.provider, table.username)],
);

/**
 * Anime metadata. Canonical `id` is AniList's media id. `malId` is captured
 * from AniList's `idMal` field so we can later join against a MAL-sourced list
 * without a second AniList lookup.
 */
export const anime = pgTable(
  'anime',
  {
    id: integer('id').primaryKey(),
    malId: integer('mal_id').unique(),
    titleRomaji: text('title_romaji'),
    titleEnglish: text('title_english'),
    genres: text('genres')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    averageScore: integer('average_score'),
    popularity: integer('popularity'),
    episodes: integer('episodes'),
    format: text('format'),
    status: text('status'),
    seasonYear: integer('season_year'),
    siteUrl: text('site_url'),
    coverMedium: text('cover_medium'),
    coverLarge: text('cover_large'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('anime_mal_id_idx').on(table.malId)],
);

/**
 * Many-to-many: each row means "user X has anime Y in their PLANNING list".
 * Indexed on anime_id so the match query's GROUP BY scales.
 */
export const userPlanningEntries = pgTable(
  'user_planning_entries',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('user_planning_entries_pk').on(table.userId, table.animeId),
    index('user_planning_entries_anime_id_idx').on(table.animeId),
  ],
);
