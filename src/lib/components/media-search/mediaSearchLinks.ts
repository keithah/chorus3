import type { MediaSearchScope } from '$lib/stores/mediaSearch.svelte';

export const LOCAL_SEARCH_LINKS = [
  ['all', 'All Media'],
  ['movie', 'Movies'],
  ['tvshow', 'TV Shows'],
  ['artist', 'Artists'],
  ['album', 'Albums'],
  ['song', 'Songs']
] as const satisfies readonly [MediaSearchScope, string][];

export type ExternalSearchProviderId =
  | 'google'
  | 'imdb'
  | 'tmdb'
  | 'tvdb'
  | 'soundcloud'
  | 'youtube';

export interface ExternalSearchProvider {
  id: ExternalSearchProviderId;
  label: string;
  buildUrl: (query: string) => string;
}

export const EXTERNAL_SEARCH_PROVIDERS: readonly ExternalSearchProvider[] = [
  {
    id: 'google',
    label: 'Google',
    buildUrl: (query) => `https://www.google.com/webhp?#q=${query}`
  },
  {
    id: 'imdb',
    label: 'IMDb',
    buildUrl: (query) => `https://www.imdb.com/find/?s=all&q=${query}`
  },
  { id: 'tvdb', label: 'TVDb', buildUrl: (query) => `https://thetvdb.com/search?query=${query}` },
  {
    id: 'tmdb',
    label: 'TMDb',
    buildUrl: (query) => `https://www.themoviedb.org/search?query=${query}`
  },
  {
    id: 'soundcloud',
    label: 'SoundCloud',
    buildUrl: (query) => `https://soundcloud.com/search?q=${query}`
  },
  {
    id: 'youtube',
    label: 'YouTube',
    buildUrl: (query) => `https://www.youtube.com/results?search_query=${query}`
  }
];
