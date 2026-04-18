import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import importPlugin from 'eslint-plugin-import';
import checkFile from 'eslint-plugin-check-file';
import prettier from 'eslint-config-prettier';

/**
 * Bulletproof-react architecture enforced via ESLint.
 * See https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md
 *
 * Rules summary:
 *  - Unidirectional imports: shared -> features -> app.
 *    `src/app` can import from everywhere; `src/features/*` cannot import from `src/app/*`;
 *    shared modules (`src/components`, `src/hooks`, `src/lib`, `src/types`, `src/utils`)
 *    cannot import from `src/features/*` or `src/app/*`.
 *  - No cross-feature imports: feature A cannot import from feature B. Add a new zone
 *    for every new feature under `src/features/`.
 *  - Kebab-case filenames and folders inside `src/` (except test folders).
 *  - `process.env.X` direct access is banned everywhere except `src/config/env.ts`.
 *  - `eslint-config-prettier` is applied last to disable stylistic rules that conflict
 *    with Prettier.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Bulletproof-react: import paths.
  {
    plugins: { import: importPlugin },
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // No cross-feature imports. Duplicate the block per feature as we add more.
            {
              target: './src/features/match',
              from: './src/features',
              except: ['./match'],
              message: 'Cross-feature imports are forbidden. Compose features at the app layer.',
            },

            // Unidirectional architecture: features cannot import from app.
            {
              target: './src/features',
              from: './src/app',
              message: 'Features cannot import from the app layer.',
            },

            // Unidirectional architecture: shared modules cannot import from features or app.
            {
              target: [
                './src/components',
                './src/hooks',
                './src/lib',
                './src/types',
                './src/utils',
              ],
              from: ['./src/features', './src/app'],
              message: 'Shared modules cannot import from features or the app layer.',
            },
          ],
        },
      ],
    },
  },

  // Bulletproof-react: kebab-case filenames and folders within src/.
  {
    plugins: { 'check-file': checkFile },
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        { '**/*.{ts,tsx}': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': ['error', { 'src/**/!(__tests__)': 'KEBAB_CASE' }],
    },
  },

  // No direct `process.env.X` access — force everything through `src/config/env.ts`.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/config/env.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // Matches the `process.env` node itself — catches `process.env.X`,
          // destructuring (`const { X } = process.env`), spread, etc.
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message: "Import `env` from '@/config/env' instead of reading `process.env` directly.",
        },
      ],
    },
  },

  // Prettier: must come last so it wins conflicts with stylistic rules above.
  prettier,

  // Global ignores (override eslint-config-next defaults since we're re-declaring).
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'drizzle/**']),
]);

export default eslintConfig;
