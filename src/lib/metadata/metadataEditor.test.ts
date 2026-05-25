import { describe, expect, it } from 'vitest';

import {
  createMetadataEditorInitialValues,
  createMetadataEditorSavePayload,
  metadataEditorDefinitionForAction,
  METADATA_EDITOR_DEFINITIONS
} from './metadataEditor';

describe('Chorus2 metadata editor parity schema', () => {
  it('defines every Chorus2 editor screen with its multi-field sections', () => {
    expect(METADATA_EDITOR_DEFINITIONS.album.sections.map((section) => section.title)).toEqual([
      'General',
      'Tags'
    ]);
    expect(METADATA_EDITOR_DEFINITIONS.artist.sections.map((section) => section.title)).toEqual([
      'General',
      'Tags'
    ]);
    expect(METADATA_EDITOR_DEFINITIONS.song.sections.map((section) => section.title)).toEqual([
      'General',
      'Tags',
      'Information'
    ]);
    expect(METADATA_EDITOR_DEFINITIONS.movie.sections.map((section) => section.title)).toEqual([
      'General',
      'Tags',
      'Trailer',
      'Poster',
      'Background',
      'Information'
    ]);
    expect(METADATA_EDITOR_DEFINITIONS.musicvideo.sections.map((section) => section.title)).toEqual(
      ['General', 'Tags', 'Poster', 'Background', 'Information']
    );
    expect(METADATA_EDITOR_DEFINITIONS.tvshow.sections.map((section) => section.title)).toEqual([
      'General',
      'Tags',
      'Poster',
      'Background'
    ]);
    expect(METADATA_EDITOR_DEFINITIONS.episode.sections.map((section) => section.title)).toEqual([
      'General',
      'Tags',
      'Information'
    ]);

    expect(METADATA_EDITOR_DEFINITIONS.movie.sections.flatMap((section) => section.fields)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'plotoutline' }),
        expect.objectContaining({ key: 'originaltitle' }),
        expect.objectContaining({ key: 'trailer' }),
        expect.objectContaining({ key: 'thumbnail' }),
        expect.objectContaining({ key: 'fanart' }),
        expect.objectContaining({ key: 'file', readOnly: true })
      ])
    );
  });

  it('maps every card action to the matching Chorus2 SetDetails method and id parameter', () => {
    expect(
      metadataEditorDefinitionForAction({ media: 'music', kind: 'artist', artistid: 1 })
    ).toMatchObject({ method: 'AudioLibrary.SetArtistDetails', idParam: 'artistid' });
    expect(
      metadataEditorDefinitionForAction({ media: 'music', kind: 'album', albumid: 2 })
    ).toMatchObject({ method: 'AudioLibrary.SetAlbumDetails', idParam: 'albumid' });
    expect(
      metadataEditorDefinitionForAction({ media: 'music', kind: 'song', songid: 3 })
    ).toMatchObject({ method: 'AudioLibrary.SetSongDetails', idParam: 'songid' });
    expect(metadataEditorDefinitionForAction({ media: 'movie', movieid: 4 })).toMatchObject({
      method: 'VideoLibrary.SetMovieDetails',
      idParam: 'movieid'
    });
    expect(metadataEditorDefinitionForAction({ media: 'episode', episodeid: 5 })).toMatchObject({
      method: 'VideoLibrary.SetEpisodeDetails',
      idParam: 'episodeid'
    });
    expect(
      metadataEditorDefinitionForAction({ media: 'musicvideo', musicvideoid: 6 })
    ).toMatchObject({ method: 'VideoLibrary.SetMusicVideoDetails', idParam: 'musicvideoid' });
    expect(metadataEditorDefinitionForAction({ media: 'tvshow', tvshowid: 7 })).toMatchObject({
      method: 'VideoLibrary.SetTVShowDetails',
      idParam: 'tvshowid'
    });
  });

  it('keeps Chorus2 field labels for the multi-section editors', () => {
    const fieldsByKey = (kind: keyof typeof METADATA_EDITOR_DEFINITIONS) =>
      Object.fromEntries(
        METADATA_EDITOR_DEFINITIONS[kind].sections
          .flatMap((section) => section.fields)
          .map((field) => [field.key, field.label])
      );

    expect(fieldsByKey('movie')).toMatchObject({
      plotoutline: 'Tagline',
      mpaa: 'Content rating',
      imdbnumber: 'IMDb',
      director: 'Directors',
      writer: 'Writers',
      genre: 'Genres',
      tag: 'Tags',
      thumbnail: 'URL',
      fanart: 'URL',
      file: 'File path'
    });
    expect(fieldsByKey('artist')).toMatchObject({
      artist: 'Title',
      yearsactive: 'Years Active',
      genre: 'Genres',
      style: 'Styles',
      instrument: 'Instruments',
      mood: 'Moods'
    });
    expect(fieldsByKey('episode')).toMatchObject({
      firstaired: 'First aired',
      director: 'Directors',
      writer: 'Writers',
      file: 'File path'
    });
  });

  it('preserves every writable Chorus2 editor field in save payloads', () => {
    for (const definition of Object.values(METADATA_EDITOR_DEFINITIONS)) {
      const source = Object.fromEntries(
        definition.sections
          .flatMap((section) => section.fields)
          .map((field) => [field.key, sourceValueForField(field.format)])
      );
      const values = createMetadataEditorInitialValues(definition, source);
      const payload = createMetadataEditorSavePayload(definition, values);

      for (const field of definition.sections.flatMap((section) => section.fields)) {
        if (field.readOnly) {
          expect(payload, `${definition.kind}.${field.key}`).not.toHaveProperty(field.key);
          continue;
        }

        if (definition.artFields?.poster === field.key) {
          expect(payload, `${definition.kind}.${field.key}`).toHaveProperty('art.poster');
          expect(payload, `${definition.kind}.${field.key}`).not.toHaveProperty(field.key);
          continue;
        }

        if (definition.artFields?.fanart === field.key) {
          expect(payload, `${definition.kind}.${field.key}`).toHaveProperty('art.fanart');
          expect(payload, `${definition.kind}.${field.key}`).not.toHaveProperty(field.key);
          continue;
        }

        expect(payload, `${definition.kind}.${field.key}`).toHaveProperty(field.key);
      }
    }
  });

  it('normalizes song editor arrays numbers and read-only file fields for JSON-RPC save', () => {
    const values = createMetadataEditorInitialValues(METADATA_EDITOR_DEFINITIONS.song, {
      title: 'Sinnerman',
      artist: ['Nina Simone'],
      albumartist: ['Nina Simone'],
      genre: ['Soul'],
      year: 1965,
      rating: 9.2,
      track: 1,
      disc: 1,
      file: 'smb://nas/music/sinnerman.flac'
    });

    values.title = 'New Sinnerman';
    values.artist = 'Nina Simone, Live Band';
    values.albumartist = 'Nina Simone\nCompilation Artist';
    values.genre = 'Soul, Jazz';
    values.year = '1966';
    values.rating = '9.5';
    values.track = '2';
    values.disc = '1';
    values.file = 'smb://should-not-be-sent';

    expect(createMetadataEditorSavePayload(METADATA_EDITOR_DEFINITIONS.song, values)).toEqual({
      title: 'New Sinnerman',
      artist: ['Nina Simone', 'Live Band'],
      albumartist: ['Nina Simone', 'Compilation Artist'],
      year: 1966,
      rating: 9.5,
      track: 2,
      disc: 1,
      genre: ['Soul', 'Jazz']
    });
    expect(
      createMetadataEditorSavePayload(METADATA_EDITOR_DEFINITIONS.song, values, new Set(['album']))
    ).toEqual(
      expect.objectContaining({
        album: ''
      })
    );
  });

  it('maps movie poster and fanart editor values into Kodi art payloads', () => {
    const values = createMetadataEditorInitialValues(METADATA_EDITOR_DEFINITIONS.movie, {
      title: 'Big Buck Bunny',
      studio: ['Blender'],
      director: ['Sacha Goedegebure'],
      genre: ['Animation'],
      tag: ['open movie'],
      art: {
        poster: 'image://old-poster.jpg/',
        fanart: 'image://old-fanart.jpg/'
      },
      file: 'smb://nas/movies/bbb.mkv'
    });

    values.thumbnail = 'image://new-poster.jpg/';
    values.fanart = 'image://new-fanart.jpg/';
    values.tag = 'open movie\nshort';

    expect(createMetadataEditorSavePayload(METADATA_EDITOR_DEFINITIONS.movie, values)).toEqual(
      expect.objectContaining({
        title: 'Big Buck Bunny',
        studio: ['Blender'],
        director: ['Sacha Goedegebure'],
        genre: ['Animation'],
        tag: ['open movie', 'short'],
        art: {
          poster: 'image://new-poster.jpg/',
          fanart: 'image://new-fanart.jpg/'
        }
      })
    );
    expect(
      createMetadataEditorSavePayload(METADATA_EDITOR_DEFINITIONS.movie, values)
    ).not.toHaveProperty('file');
    expect(
      createMetadataEditorSavePayload(METADATA_EDITOR_DEFINITIONS.movie, values)
    ).not.toHaveProperty('thumbnail');
  });

  it('keeps dirty empty poster and fanart values so artwork can be cleared', () => {
    const values = createMetadataEditorInitialValues(METADATA_EDITOR_DEFINITIONS.movie, {
      title: 'Big Buck Bunny',
      art: {
        poster: 'image://old-poster.jpg/',
        fanart: 'image://old-fanart.jpg/'
      }
    });

    values.thumbnail = '';
    values.fanart = '';

    expect(
      createMetadataEditorSavePayload(
        METADATA_EDITOR_DEFINITIONS.movie,
        values,
        new Set(['thumbnail', 'fanart'])
      )
    ).toEqual({
      title: 'Big Buck Bunny',
      art: {
        poster: '',
        fanart: ''
      }
    });
  });
});

function sourceValueForField(format: unknown): unknown {
  if (format === 'array.string') return ['First', 'Second'];
  if (format === 'integer') return 2026;
  if (format === 'float') return 8.5;
  return 'Safe value';
}
