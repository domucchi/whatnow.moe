import { setupServer } from 'msw/node';

import { anilistHandlers } from './anilist-handlers';

export const server = setupServer(...anilistHandlers);
