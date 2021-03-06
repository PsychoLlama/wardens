import { defineConfig } from 'vite';
import * as path from 'path';
import { builtinModules } from 'module';
import dts from 'vite-dts';

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: path.join(__dirname, './src/index.ts'),
      name: 'wardens',
      fileName: (format: string) => `wardens.${format}.js`,
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
