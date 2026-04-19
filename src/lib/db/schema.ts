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

// `citext` extension is enabled in `drizzle/0000_*.sql`. On a fresh DB use
// `pnpm db:migrate` — `db:push` skips migration files and fails on this type.
const citext = customType<{ data: string; driverData: string }>({
  dataType: () => 'citext',
});

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

// `id` is AniList's media id; `malId` mirrors AniList's `idMal` so a MAL list
// can join without a second AniList lookup.
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

// `anime_id` index exists because the match query's GROUP BY hits it hot.
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
