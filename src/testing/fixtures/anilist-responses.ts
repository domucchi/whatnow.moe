import type { PlanningListResponse } from '@/lib/anilist/schemas';

// Real AniList responses often include null titles/scores; fixtures mirror
// that so tests catch nullability bugs.
const cowboyBebop = {
  id: 1,
  idMal: 1,
  title: { romaji: 'Cowboy Bebop', english: 'Cowboy Bebop' },
  genres: ['Action', 'Sci-Fi'],
  averageScore: 86,
  popularity: 500000,
  episodes: 26,
  format: 'TV',
  status: 'FINISHED',
  seasonYear: 1998,
  siteUrl: 'https://anilist.co/anime/1',
  coverImage: {
    medium: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/1.jpg',
    large: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/1.jpg',
  },
};

const frieren = {
  id: 154587,
  idMal: 52991,
  title: {
    romaji: 'Sousou no Frieren',
    english: 'Frieren: Beyond Journey\u2019s End',
  },
  genres: ['Adventure', 'Drama', 'Fantasy'],
  averageScore: 92,
  popularity: 450000,
  episodes: 28,
  format: 'TV',
  status: 'FINISHED',
  seasonYear: 2023,
  siteUrl: 'https://anilist.co/anime/154587',
  coverImage: {
    medium: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/154587.jpg',
    large: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/154587.jpg',
  },
};

const ongoingShow = {
  id: 999,
  idMal: null,
  title: { romaji: 'Some Currently Airing', english: null },
  genres: ['Comedy'],
  averageScore: null,
  popularity: 1000,
  episodes: null,
  format: 'TV',
  status: 'RELEASING',
  seasonYear: 2026,
  siteUrl: 'https://anilist.co/anime/999',
  coverImage: { medium: null, large: null },
};

export const twoEntryPlanningResponse: PlanningListResponse = {
  data: {
    MediaListCollection: {
      lists: [
        {
          entries: [{ media: cowboyBebop }, { media: frieren }],
        },
      ],
    },
  },
};

export const mixedStatusPlanningResponse: PlanningListResponse = {
  data: {
    MediaListCollection: {
      lists: [
        {
          entries: [{ media: cowboyBebop }, { media: ongoingShow }],
        },
      ],
    },
  },
};

export const emptyPlanningResponse: PlanningListResponse = {
  data: {
    MediaListCollection: { lists: [] },
  },
};

export const userNotFoundResponse: PlanningListResponse = {
  data: { MediaListCollection: null },
};

export const fixtures = {
  cowboyBebop,
  frieren,
  ongoingShow,
};
