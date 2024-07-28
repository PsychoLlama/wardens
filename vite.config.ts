import { defineConfig } from 'vite';
import * as path from 'path';
import { builtinModules } from 'module';

export default defineConfig({
  build: {
    lib: {
      entry: path.join(import.meta.dirname, './src/index.ts'),
      fileName: 'wardens',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: builtinModules,
    },
  },
});
