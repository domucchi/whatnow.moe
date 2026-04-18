import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Native Vite 8 / Vitest 4 replacement for vite-tsconfig-paths — reads
    // `tsconfig.json`'s `paths` so `@/*` resolves the same way it does in Next.
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.tsx'],
  },
});
