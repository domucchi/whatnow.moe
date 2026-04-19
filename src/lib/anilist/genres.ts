import { anilistFetch } from './client';
import { GENRE_COLLECTION_QUERY } from './queries';
import { GenreCollectionResponseSchema } from './schemas';

// AniList's current genre list as of 2026-04. Ships as a fallback so the UI
// never renders an empty list if the network fetch fails at first request.
export const FALLBACK_GENRES: readonly string[] = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Hentai',
  'Horror',
  'Mahou Shoujo',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

let cached: string[] | null = null;
let inflight: Promise<string[]> | null = null;

// Module-level singleton. AniList's genre list changes on the order of years,
// so a process-lifetime cache is fine — no TTL, no DB round-trip.
export async function getGenres(): Promise<string[]> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await anilistFetch(GENRE_COLLECTION_QUERY, {}, GenreCollectionResponseSchema);
      const list = res.data.GenreCollection;
      if (list && list.length > 0) {
        cached = [...list].sort((a, b) => a.localeCompare(b));
        return cached;
      }
      cached = [...FALLBACK_GENRES];
      return cached;
    } catch {
      // Ignore — fall back to the hard-coded list. Leaves `cached` null so
      // the next call retries the live fetch.
      return [...FALLBACK_GENRES];
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
