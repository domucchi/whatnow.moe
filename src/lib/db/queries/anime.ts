import { sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { anime } from '@/lib/db/schema';

export type NewAnimeRow = typeof anime.$inferInsert;

/**
 * Bulk upsert anime metadata. Uses `ON CONFLICT (id) DO UPDATE` so repeated
 * fetches of the same AniList entries refresh scores/popularity/etc.
 *
 * `updated_at` is always set to `now()` on conflict so we can later purge
 * anime that have aged out, via a Vercel cron or similar.
 */
export async function upsertAnimeBatch(rows: NewAnimeRow[]): Promise<void> {
  if (rows.length === 0) return;

  await db
    .insert(anime)
    .values(rows)
    .onConflictDoUpdate({
      target: anime.id,
      set: {
        malId: sql`excluded.mal_id`,
        titleRomaji: sql`excluded.title_romaji`,
        titleEnglish: sql`excluded.title_english`,
        genres: sql`excluded.genres`,
        averageScore: sql`excluded.average_score`,
        popularity: sql`excluded.popularity`,
        episodes: sql`excluded.episodes`,
        format: sql`excluded.format`,
        status: sql`excluded.status`,
        seasonYear: sql`excluded.season_year`,
        siteUrl: sql`excluded.site_url`,
        coverMedium: sql`excluded.cover_medium`,
        coverLarge: sql`excluded.cover_large`,
        updatedAt: sql`now()`,
      },
    });
}
