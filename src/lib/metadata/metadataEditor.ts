export type MetadataEditorKind =
  | 'album'
  | 'artist'
  | 'song'
  | 'movie'
  | 'musicvideo'
  | 'tvshow'
  | 'episode';

export type MetadataEditorFieldFormat = 'string' | 'array.string' | 'integer' | 'float';
export type MetadataEditorFieldInput = 'text' | 'textarea' | 'number' | 'date' | 'url';
export type MetadataEditorActionIdKey =
  | 'albumid'
  | 'artistid'
  | 'songid'
  | 'movieid'
  | 'musicvideoid'
  | 'tvshowid'
  | 'episodeid';

export type MetadataEditorField = {
  key: string;
  label: string;
  input: MetadataEditorFieldInput;
  format?: MetadataEditorFieldFormat;
  readOnly?: boolean;
  min?: number;
  max?: number;
  step?: number;
};

export type MetadataEditorSection = {
  title: string;
  fields: readonly MetadataEditorField[];
};

export type MetadataEditorDefinition = {
  kind: MetadataEditorKind;
  title: string;
  method: string;
  idParam: string;
  idActionKey: MetadataEditorActionIdKey;
  displayKey: string;
  artFields?: {
    poster?: string;
    fanart?: string;
  };
  sections: readonly MetadataEditorSection[];
};

export type MetadataEditableAction =
  | { media: 'music'; kind: 'artist'; artistid: number }
  | { media: 'music'; kind: 'album'; albumid: number }
  | { media: 'music'; kind: 'song'; songid: number }
  | { media: 'movie'; movieid: number }
  | { media: 'episode'; episodeid: number }
  | { media: 'musicvideo'; musicvideoid: number }
  | { media: 'tvshow'; tvshowid: number };

export type MetadataEditorValues = Record<string, string>;
export type MetadataEditorPayload = Record<string, unknown>;

const text = (
  key: string,
  label: string,
  format?: MetadataEditorFieldFormat
): MetadataEditorField => ({
  key,
  label,
  input: 'text',
  format
});
const textarea = (
  key: string,
  label: string,
  format?: MetadataEditorFieldFormat,
  readOnly = false
): MetadataEditorField => ({ key, label, input: 'textarea', format, readOnly });
const number = (
  key: string,
  label: string,
  format: 'integer' | 'float',
  options: Pick<MetadataEditorField, 'min' | 'max' | 'step'> = {}
): MetadataEditorField => ({ key, label, input: 'number', format, ...options });
const date = (key: string, label: string): MetadataEditorField => ({ key, label, input: 'date' });
const url = (key: string, label: string): MetadataEditorField => ({ key, label, input: 'url' });

export const METADATA_EDITOR_DEFINITIONS: Record<MetadataEditorKind, MetadataEditorDefinition> = {
  album: {
    kind: 'album',
    title: 'Album',
    method: 'AudioLibrary.SetAlbumDetails',
    idParam: 'albumid',
    idActionKey: 'albumid',
    displayKey: 'title',
    sections: [
      {
        title: 'General',
        fields: [
          text('title', 'Title'),
          text('artist', 'Artist', 'array.string'),
          textarea('description', 'Description'),
          text('albumlabel', 'Label'),
          number('year', 'Year', 'integer', { min: 0, max: 9999 }),
          number('rating', 'Rating', 'float', { min: 0, max: 10, step: 0.1 })
        ]
      },
      {
        title: 'Tags',
        fields: [
          text('genre', 'Genres', 'array.string'),
          text('style', 'Styles', 'array.string'),
          textarea('theme', 'Themes', 'array.string'),
          textarea('mood', 'Moods', 'array.string')
        ]
      }
    ]
  },
  artist: {
    kind: 'artist',
    title: 'Artist',
    method: 'AudioLibrary.SetArtistDetails',
    idParam: 'artistid',
    idActionKey: 'artistid',
    displayKey: 'artist',
    sections: [
      {
        title: 'General',
        fields: [
          text('artist', 'Title'),
          textarea('description', 'Description'),
          text('formed', 'Formed'),
          text('disbanded', 'Disbanded'),
          text('born', 'Born'),
          text('died', 'Died'),
          text('yearsactive', 'Years Active', 'array.string')
        ]
      },
      {
        title: 'Tags',
        fields: [
          text('genre', 'Genres', 'array.string'),
          text('style', 'Styles', 'array.string'),
          textarea('instrument', 'Instruments', 'array.string'),
          textarea('mood', 'Moods', 'array.string')
        ]
      }
    ]
  },
  song: {
    kind: 'song',
    title: 'Song',
    method: 'AudioLibrary.SetSongDetails',
    idParam: 'songid',
    idActionKey: 'songid',
    displayKey: 'title',
    sections: [
      {
        title: 'General',
        fields: [
          text('title', 'Title'),
          text('artist', 'Artist', 'array.string'),
          text('albumartist', 'Album artist', 'array.string'),
          text('album', 'Album'),
          number('year', 'Year', 'integer', { min: 0, max: 9999 }),
          number('rating', 'Rating', 'float', { min: 0, max: 10, step: 0.1 }),
          number('track', 'Track', 'integer'),
          number('disc', 'Disc', 'integer')
        ]
      },
      { title: 'Tags', fields: [text('genre', 'Genres', 'array.string')] },
      { title: 'Information', fields: [textarea('file', 'File path', 'string', true)] }
    ]
  },
  movie: {
    kind: 'movie',
    title: 'Movie',
    method: 'VideoLibrary.SetMovieDetails',
    idParam: 'movieid',
    idActionKey: 'movieid',
    displayKey: 'title',
    artFields: { poster: 'thumbnail', fanart: 'fanart' },
    sections: [
      {
        title: 'General',
        fields: [
          text('title', 'Title'),
          textarea('plotoutline', 'Tagline'),
          textarea('plot', 'Plot'),
          text('studio', 'Studio', 'array.string'),
          number('year', 'Year', 'integer', { min: 0, max: 9999 }),
          text('mpaa', 'Content rating'),
          number('rating', 'Rating', 'float', { min: 0, max: 10, step: 0.1 }),
          text('imdbnumber', 'IMDb'),
          text('sorttitle', 'Sort title'),
          text('originaltitle', 'Original title')
        ]
      },
      {
        title: 'Tags',
        fields: [
          text('director', 'Directors', 'array.string'),
          text('writer', 'Writers', 'array.string'),
          text('genre', 'Genres', 'array.string'),
          text('country', 'Country', 'array.string'),
          text('set', 'Set'),
          textarea('tag', 'Tags', 'array.string')
        ]
      },
      { title: 'Trailer', fields: [url('trailer', 'URL')] },
      { title: 'Poster', fields: [url('thumbnail', 'URL')] },
      { title: 'Background', fields: [url('fanart', 'URL')] },
      { title: 'Information', fields: [textarea('file', 'File path', 'string', true)] }
    ]
  },
  musicvideo: {
    kind: 'musicvideo',
    title: 'Music Video',
    method: 'VideoLibrary.SetMusicVideoDetails',
    idParam: 'musicvideoid',
    idActionKey: 'musicvideoid',
    displayKey: 'title',
    artFields: { poster: 'thumbnail', fanart: 'fanart' },
    sections: [
      {
        title: 'General',
        fields: [
          text('title', 'Title'),
          text('artist', 'Artist', 'array.string'),
          text('album', 'Album'),
          textarea('plot', 'Plot'),
          text('studio', 'Studio', 'array.string'),
          number('year', 'Year', 'integer', { min: 0, max: 9999 }),
          number('rating', 'Rating', 'float', { min: 0, max: 10, step: 0.1 })
        ]
      },
      {
        title: 'Tags',
        fields: [
          text('director', 'Directors', 'array.string'),
          text('genre', 'Genres', 'array.string'),
          text('tag', 'Tags', 'array.string')
        ]
      },
      { title: 'Poster', fields: [url('thumbnail', 'URL')] },
      { title: 'Background', fields: [url('fanart', 'URL')] },
      { title: 'Information', fields: [textarea('file', 'File path', 'string', true)] }
    ]
  },
  tvshow: {
    kind: 'tvshow',
    title: 'TV Show',
    method: 'VideoLibrary.SetTVShowDetails',
    idParam: 'tvshowid',
    idActionKey: 'tvshowid',
    displayKey: 'title',
    artFields: { poster: 'thumbnail', fanart: 'fanart' },
    sections: [
      {
        title: 'General',
        fields: [
          text('title', 'Title'),
          textarea('plot', 'Plot'),
          text('studio', 'Studio', 'array.string'),
          text('mpaa', 'Content rating'),
          date('premiered', 'Premiered'),
          number('rating', 'Rating', 'float', { min: 0, max: 10, step: 0.1 }),
          text('imdbnumber', 'IMDb'),
          text('sorttitle', 'Sort title'),
          text('originaltitle', 'Original title')
        ]
      },
      {
        title: 'Tags',
        fields: [text('genre', 'Genres', 'array.string'), textarea('tag', 'Tags', 'array.string')]
      },
      { title: 'Poster', fields: [url('thumbnail', 'URL')] },
      { title: 'Background', fields: [url('fanart', 'URL')] }
    ]
  },
  episode: {
    kind: 'episode',
    title: 'Episode',
    method: 'VideoLibrary.SetEpisodeDetails',
    idParam: 'episodeid',
    idActionKey: 'episodeid',
    displayKey: 'title',
    sections: [
      {
        title: 'General',
        fields: [
          text('title', 'Title'),
          textarea('plot', 'Plot'),
          number('rating', 'Rating', 'float', { min: 0, max: 10, step: 0.1 }),
          date('firstaired', 'First aired'),
          text('originaltitle', 'Original title')
        ]
      },
      {
        title: 'Tags',
        fields: [
          text('director', 'Directors', 'array.string'),
          text('writer', 'Writers', 'array.string')
        ]
      },
      { title: 'Information', fields: [textarea('file', 'File path', 'string', true)] }
    ]
  }
};

function isMetadataRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function buildTvShowMetadataEditorSource(
  source: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!source) {
    return {};
  }

  const art = isMetadataRecord(source.art) ? source.art : {};
  const uniqueid = isMetadataRecord(source.uniqueid) ? source.uniqueid : {};
  const poster =
    (typeof art.poster === 'string' && art.poster) ||
    (typeof art.thumb === 'string' && art.thumb) ||
    (typeof source.thumbnail === 'string' ? source.thumbnail : undefined);
  const fanart =
    (typeof art.fanart === 'string' && art.fanart) ||
    (typeof source.fanart === 'string' ? source.fanart : undefined);
  const imdbFromUnique =
    typeof uniqueid.imdb === 'string'
      ? uniqueid.imdb
      : typeof uniqueid.IMDB === 'string'
        ? uniqueid.IMDB
        : undefined;

  const title =
    (typeof source.title === 'string' && source.title.trim()) ||
    (typeof source.label === 'string' && source.label.trim()) ||
    undefined;

  return {
    ...source,
    ...(title ? { title } : {}),
    thumbnail: poster,
    fanart,
    thumbnailOriginal: poster,
    fanartOriginal: fanart,
    imdbnumber: source.imdbnumber ?? imdbFromUnique
  };
}

export function metadataEditorDefinitionForAction(
  action: MetadataEditableAction | null | undefined
): MetadataEditorDefinition | null {
  if (!action) return null;
  if (action.media === 'music' && action.kind === 'artist')
    return METADATA_EDITOR_DEFINITIONS.artist;
  if (action.media === 'music' && action.kind === 'album') return METADATA_EDITOR_DEFINITIONS.album;
  if (action.media === 'music' && action.kind === 'song') return METADATA_EDITOR_DEFINITIONS.song;
  if (action.media === 'movie') return METADATA_EDITOR_DEFINITIONS.movie;
  if (action.media === 'episode') return METADATA_EDITOR_DEFINITIONS.episode;
  if (action.media === 'musicvideo') return METADATA_EDITOR_DEFINITIONS.musicvideo;
  if (action.media === 'tvshow') return METADATA_EDITOR_DEFINITIONS.tvshow;
  return null;
}

export function metadataEditorIdForAction(
  definition: MetadataEditorDefinition,
  action: MetadataEditableAction
): number | null {
  const value = metadataActionIdValue(action, definition.idActionKey);
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function metadataActionIdValue(
  action: MetadataEditableAction,
  key: MetadataEditorActionIdKey
): number | undefined {
  switch (key) {
    case 'albumid':
      return action.media === 'music' && action.kind === 'album' ? action.albumid : undefined;
    case 'artistid':
      return action.media === 'music' && action.kind === 'artist' ? action.artistid : undefined;
    case 'songid':
      return action.media === 'music' && action.kind === 'song' ? action.songid : undefined;
    case 'movieid':
      return action.media === 'movie' ? action.movieid : undefined;
    case 'musicvideoid':
      return action.media === 'musicvideo' ? action.musicvideoid : undefined;
    case 'tvshowid':
      return action.media === 'tvshow' ? action.tvshowid : undefined;
    case 'episodeid':
      return action.media === 'episode' ? action.episodeid : undefined;
  }
}

export function createMetadataEditorInitialValues(
  definition: MetadataEditorDefinition,
  source: Record<string, unknown> | null | undefined
): MetadataEditorValues {
  const record = source ?? {};
  const values: MetadataEditorValues = {};
  for (const field of definition.sections.flatMap((section) => section.fields)) {
    values[field.key] = formatEditorValue(field, readSourceValue(definition, record, field.key));
  }
  return values;
}

export function metadataEditorSourceKey(
  definition: MetadataEditorDefinition,
  source: Record<string, unknown> | null | undefined
): string {
  const record = source ?? {};
  const id = record[definition.idActionKey];
  const stableId =
    typeof id === 'number' || typeof id === 'string'
      ? String(id)
      : displayTitleForMetadataEditor(definition, record, definition.title);

  return `${definition.kind}:${stableId}`;
}

export function reconcileMetadataEditorValues(
  currentValues: MetadataEditorValues,
  nextValues: MetadataEditorValues,
  dirtyKeys: ReadonlySet<string>
): MetadataEditorValues {
  if (dirtyKeys.size === 0) return nextValues;

  return Object.fromEntries(
    Object.entries(nextValues).map(([key, value]) => [
      key,
      dirtyKeys.has(key) ? (currentValues[key] ?? '') : value
    ])
  );
}

export function createMetadataEditorSavePayload(
  definition: MetadataEditorDefinition,
  values: MetadataEditorValues,
  dirtyKeys: ReadonlySet<string> = new Set()
): MetadataEditorPayload {
  const payload: MetadataEditorPayload = {};
  const art: Record<string, string> = {};

  for (const field of definition.sections.flatMap((section) => section.fields)) {
    if (field.readOnly) continue;
    const normalized = normalizeFieldValue(field, values[field.key] ?? '');
    if (!shouldIncludeFieldValue(normalized, dirtyKeys.has(field.key))) continue;
    const artKey =
      definition.artFields?.poster === field.key
        ? 'poster'
        : definition.artFields?.fanart === field.key
          ? 'fanart'
          : null;
    if (artKey) {
      if (typeof normalized === 'string') {
        art[artKey] = normalized.trim();
      }
      continue;
    }
    payload[field.key] = normalized;
  }

  if (Object.keys(art).length > 0) {
    payload.art = art;
  }

  return payload;
}

export function displayTitleForMetadataEditor(
  definition: MetadataEditorDefinition,
  source: Record<string, unknown> | null | undefined,
  fallback: string
): string {
  const record = source ?? {};
  const value = record[definition.displayKey] ?? record.label ?? fallback;
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readSourceValue(
  definition: MetadataEditorDefinition,
  source: Record<string, unknown>,
  key: string
): unknown {
  if (definition.artFields?.poster === key) {
    return source.thumbnailOriginal ?? readArtValue(source, 'poster') ?? source.thumbnail;
  }
  if (definition.artFields?.fanart === key) {
    return source.fanartOriginal ?? readArtValue(source, 'fanart') ?? source.fanart;
  }
  return source[key];
}

function readArtValue(source: Record<string, unknown>, key: string): unknown {
  const art = source.art;
  return art && typeof art === 'object' ? (art as Record<string, unknown>)[key] : undefined;
}

function formatEditorValue(field: MetadataEditorField, value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ');
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
}

function normalizeFieldValue(field: MetadataEditorField, value: string): unknown {
  const trimmed = value.trim();
  if (field.format === 'array.string') {
    return trimmed
      ? trimmed
          .split(/[,\n]/u)
          .map((part) => part.trim())
          .filter(Boolean)
      : [];
  }
  if (field.format === 'integer') {
    if (!trimmed) return undefined;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (field.format === 'float') {
    if (!trimmed) return undefined;
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return trimmed;
}

function shouldIncludeFieldValue(value: unknown, isDirty: boolean): boolean {
  if (value === undefined) return false;
  if (typeof value === 'string') return isDirty || value.length > 0;
  if (Array.isArray(value)) return isDirty || value.length > 0;
  return true;
}
