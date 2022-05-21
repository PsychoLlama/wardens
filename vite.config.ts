import { defineConfig } from 'vite';
import * as path from 'path';
import { builtinModules } from 'module';

export default defineConfig({
  build: {
    lib: {
      entry: path.join(__dirname, './src/index.ts'),
      name: 'bobcat',
      fileName: (format: string) => `bobcat.${format}.js`,
    },
    rollupOptions: {
      external: builtinModules,
      output: {
        globals: Object.fromEntries(
          builtinModules.map((modName) => [modName, modName]),
        ),
      },
    },
  },
});
