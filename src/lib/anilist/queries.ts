/**
 * AniList GraphQL queries. Kept as plain template strings; with only one endpoint
 * and a handful of queries, codegen is overkill — typed responses are enforced by
 * the Zod schemas in `./schemas.ts`.
 */

export const PLANNING_LIST_QUERY = /* GraphQL */ `
  query PlanningList($userName: String) {
    MediaListCollection(userName: $userName, type: ANIME, status: PLANNING) {
      lists {
        entries {
          media {
            id
            idMal
            title {
              romaji
              english
            }
            genres
            averageScore
            popularity
            episodes
            format
            status
            seasonYear
            siteUrl
            coverImage {
              medium
              large
            }
          }
        }
      }
    }
  }
`;
