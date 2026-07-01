import { graphql, HttpResponse } from 'msw';

import { fixtures } from '@/testing/fixtures/anilist-responses';
import type { AnilistMedia, PlanningListResponse } from '@/lib/anilist/schemas';

type E2eMediaId = (typeof E2E_MEDIA_IDS)[keyof typeof E2E_MEDIA_IDS];

const anilist = graphql.link('https://graphql.anilist.co');

export const E2E_MEDIA_IDS = {
  cowboyBebop: 9_990_001,
  frieren: 9_990_002,
} as const;

const fixtureUsers: Record<string, PlanningListResponse> = {
  e2e_alice: planningResponse([
    e2eMedia(fixtures.cowboyBebop, E2E_MEDIA_IDS.cowboyBebop),
    e2eMedia(fixtures.frieren, E2E_MEDIA_IDS.frieren),
  ]),
  e2e_bob: planningResponse([
    e2eMedia(fixtures.cowboyBebop, E2E_MEDIA_IDS.cowboyBebop),
    e2eMedia(fixtures.frieren, E2E_MEDIA_IDS.frieren),
  ]),
  e2e_charlie: planningResponse([e2eMedia(fixtures.cowboyBebop, E2E_MEDIA_IDS.cowboyBebop)]),
};

export const anilistHandlers = [
  anilist.query('PlanningList', ({ variables }) => {
    const username = typeof variables.userName === 'string' ? variables.userName.toLowerCase() : '';

    return HttpResponse.json(
      fixtureUsers[username] ?? {
        data: { MediaListCollection: null },
      },
    );
  }),
  anilist.query('GenreCollection', () =>
    HttpResponse.json({
      data: {
        GenreCollection: ['Action', 'Adventure', 'Drama', 'Fantasy', 'Sci-Fi'],
      },
    }),
  ),
];

function e2eMedia(item: AnilistMedia, id: E2eMediaId): AnilistMedia {
  return {
    ...item,
    id,
    idMal: null,
    coverImage: { medium: null, large: null },
  };
}

function planningResponse(media: AnilistMedia[]): PlanningListResponse {
  return {
    data: {
      MediaListCollection: {
        lists: [
          {
            entries: media.map((item) => ({
              media: item,
            })),
          },
        ],
      },
    },
  };
}
