import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    exclude: ['.direnv', 'node_modules', 'dist', '.git', '.cache'],
    coverage: {
      include: ['src'],
    },
  },
});
