import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
      $components: fileURLToPath(new URL('./src/lib/components', import.meta.url)),
      $stores: fileURLToPath(new URL('./src/lib/stores', import.meta.url))
    },
    ...(process.env.VITEST ? { conditions: ['browser'] } : {})
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts']
  }
});
