import { describe, expect, it } from 'vitest';
import {
  STORE_CHUNK_BY_MODULE,
  storeChunkNameForId,
  storeChunkNameForModule,
  storeModuleNameFromId
} from './storeChunkManifest';

describe('store chunk manifest', () => {
  it('classifies every non-test store module explicitly', () => {
    const storeModules = Object.keys(import.meta.glob('./*.ts'))
      .filter((path) => !path.endsWith('.test.ts'))
      .filter((path) => path !== './storeChunkManifest.ts')
      .map((path) => path.slice(2).replace(/(?:\.svelte)?\.ts$/u, ''))
      .sort();

    expect(Object.keys(STORE_CHUNK_BY_MODULE).sort()).toEqual(storeModules);
  });

  it('keeps shell stores and route stores in their intended chunks', () => {
    expect(storeChunkNameForModule('playerDispatch')).toBe('stores-shell');
    expect(storeChunkNameForModule('videoLibrary')).toBe('stores-route');
    expect(storeChunkNameForId('/workspace/src/lib/stores/localPlayer.svelte.ts')).toBe(
      'stores-shell'
    );
    expect(storeChunkNameForId('/workspace/src/lib/stores/mediaSearch.svelte.ts')).toBe(
      'stores-route'
    );
  });

  it('fails closed for unclassified store modules', () => {
    expect(storeModuleNameFromId('/workspace/src/lib/stores/example.svelte.ts')).toBe('example');
    expect(() => storeChunkNameForModule('example')).toThrow('Unclassified store module: example');
  });
});
