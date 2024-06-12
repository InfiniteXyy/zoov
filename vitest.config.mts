import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: { reporter: ['text', 'clover'], include: ['src'] },
    setupFiles: ['./vitest.setup.ts'],
  },
});
