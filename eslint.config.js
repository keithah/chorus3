import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs['flat/recommended'],
  ...svelte.configs['flat/prettier'],
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '.gsd/', '.bg-shell/']
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022
      }
    }
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },
  {
    files: ['vite.config.ts', 'eslint.config.js', 'svelte.config.js'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
);
