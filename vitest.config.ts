import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: { reporter: ['text'], excludeNodeModules: true },
    setupFiles: ['./vitest.setup.ts'],
  },
});
