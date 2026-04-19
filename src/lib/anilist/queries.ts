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

export const GENRE_COLLECTION_QUERY = /* GraphQL */ `
  query GenreCollection {
    GenreCollection
  }
`;
