// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/'],
  },
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-prototype-builtins': 'off',
    },
  },
  {
    files: ['./src/**/__tests__/*.ts{x,}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
