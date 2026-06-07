import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { storeChunkNameForId } from './src/lib/stores/storeChunkManifest';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/lib/kodi/')) return 'kodi';
          if (id.includes('/src/lib/stores/')) return storeChunkNameForId(id);
          if (id.includes('/src/lib/app/')) return 'app-core';
          if (id.includes('/src/lib/app-shell/')) return 'app-shell';
          if (id.includes('/src/lib/media/')) return 'media-core';
          if (id.includes('/src/lib/metadata/')) return 'metadata';
          if (id.includes('/src/lib/i18n/localeCore.ts')) return 'locale-core';
          if (
            id.includes('/src/lib/i18n/runtimeTranslationContext.ts') ||
            id.includes('/src/lib/i18n/runtimeTranslationState.svelte.ts') ||
            id.includes('/src/lib/i18n/locales/en.ts')
          ) {
            return 'runtime-i18n';
          }
          if (id.includes('/src/lib/i18n/locales/de.ts')) return 'locale-de';
          if (
            id.includes('/src/lib/components/media-search/') ||
            id.includes('/src/lib/components/MediaSearchPanel.svelte')
          ) {
            return 'media-search';
          }
          if (id.includes('/src/lib/theme/')) return 'theme';
          if (id.includes('/src/lib/video/')) return 'video-core';
          if (id.includes('/src/lib/i18n/') || id.includes('/src/lib/safety/')) return 'text-core';
        }
      }
    }
  },
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
    fileParallelism: false,
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts']
  }
});
