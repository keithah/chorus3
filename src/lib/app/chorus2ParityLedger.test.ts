import { describe, expect, test } from 'vitest';

import {
  CHORUS2_PARITY_KIND_VALUES,
  CHORUS2_PARITY_LEDGER,
  CHORUS2_PARITY_STATUS_VALUES,
  getChorus2ParityRowById,
  getChorus2ParityRowsByFamily,
  getChorus2ParityRowsByStatus,
  type Chorus2ParityKind,
  type Chorus2ParityRow,
  type Chorus2ParityStatus
} from './chorus2ParityLedger';

const REQUIRED_ROUTE_FAMILIES = [
  'addon',
  'album',
  'artist',
  'browser',
  'category',
  'epg',
  'help',
  'input',
  'lab',
  'landing',
  'local-playlist',
  'movie',
  'musicvideo',
  'playlist',
  'pvr',
  'search',
  'settings',
  'shell',
  'thumbs',
  'tvshow'
] as const;

const REQUIRED_NAV_SURFACES = [
  'music',
  'music/genres',
  'music/top',
  'music/artists',
  'music/albums',
  'music/videos',
  'movies/recent',
  'movies',
  'tvshows/recent',
  'tvshows',
  'browser',
  'pvr/tv',
  'pvr/radio',
  'pvr/recordings',
  'addons/all',
  'addons/video',
  'addons/audio',
  'addons/executable',
  'settings/*',
  'thumbsup',
  'playlists',
  'help'
] as const;

const REQUIRED_JSON_RPC_METHODS = [
  'Input.Left',
  'Input.Up',
  'Input.Right',
  'Input.Down',
  'Input.Back',
  'Input.Select',
  'Input.ContextMenu',
  'Input.Info',
  'Input.Home',
  'Input.SendText',
  'Input.ExecuteAction',
  'Player.PlayPause',
  'Player.Stop',
  'Player.GoTo',
  'Player.SetRepeat',
  'Player.SetShuffle',
  'Player.Seek',
  'Player.GetActivePlayers',
  'Player.GetProperties',
  'Player.GetItem',
  'Application.GetProperties',
  'Application.SetVolume',
  'Application.SetMute',
  'Application.Quit',
  'System.GetProperties',
  'System.Shutdown',
  'System.Reboot',
  'System.Suspend',
  'System.Hibernate',
  'Playlist.Insert',
  'Playlist.Remove',
  'Playlist.Clear',
  'Playlist.GetItems',
  'PVR.Record',
  'PVR.ToggleTimer',
  'PVR.AddTimer',
  'PVR.DeleteTimer',
  'Addons.ExecuteAddon',
  'Files.PrepareDownload',
  'AudioLibrary.SetAlbumDetails',
  'AudioLibrary.SetArtistDetails',
  'AudioLibrary.SetSongDetails',
  'AudioLibrary.Scan',
  'AudioLibrary.Clean',
  'VideoLibrary.SetEpisodeDetails',
  'VideoLibrary.SetMovieDetails',
  'VideoLibrary.SetTVShowDetails',
  'VideoLibrary.SetMusicVideoDetails',
  'VideoLibrary.Scan',
  'VideoLibrary.Clean',
  'VideoLibrary.RefreshMovie',
  'VideoLibrary.RefreshTVShow',
  'VideoLibrary.RefreshEpisode'
] as const;

const UNSAFE_TEXT_PATTERN =
  /(Authorization|Basic\b|token=|password=|localStorage|sessionStorage|https?:\/\/[^\s/]+:[^\s/]+@|(?:^|\s)\/(?:home|Users|tmp)\/)/u;
const IGNORED_EVIDENCE_PATTERN = /(?:^|\/)\.gsd\//u;
const ABSOLUTE_EVIDENCE_PATTERN = /^(?:[A-Za-z]:)?\//u;

function rowLabel(row: Pick<Chorus2ParityRow, 'id'>): string {
  return `ledger row ${row.id}`;
}

function rowsForSurface(kind: Chorus2ParityKind, surface: string): readonly Chorus2ParityRow[] {
  return CHORUS2_PARITY_LEDGER.filter((row) => row.kind === kind && row.surface === surface);
}

describe('CHORUS2_PARITY_LEDGER', () => {
  test('exports stable readonly value sets used by ledger rows', () => {
    expect(CHORUS2_PARITY_KIND_VALUES).toEqual(['route', 'nav', 'control', 'action', 'jsonrpc']);
    expect(CHORUS2_PARITY_STATUS_VALUES).toEqual([
      'implemented',
      'missing',
      'deferred',
      'out-of-scope'
    ]);
  });

  test('contains valid, complete, uniquely identified, report-safe rows', () => {
    const ids = new Set<string>();
    const validKinds = new Set<Chorus2ParityKind>(CHORUS2_PARITY_KIND_VALUES);
    const validStatuses = new Set<Chorus2ParityStatus>(CHORUS2_PARITY_STATUS_VALUES);

    for (const row of CHORUS2_PARITY_LEDGER) {
      expect(row.id, `${rowLabel(row)} id`).toMatch(/^[a-z0-9]+:[a-z0-9-]+:[a-z0-9-]+$/u);
      expect(ids.has(row.id), `${rowLabel(row)} duplicate id`).toBe(false);
      ids.add(row.id);
      expect(validKinds.has(row.kind), `${rowLabel(row)} kind`).toBe(true);
      expect(validStatuses.has(row.status), `${rowLabel(row)} status`).toBe(true);
      expect(row.family.trim(), `${rowLabel(row)} family`).not.toBe('');
      expect(row.surface.trim(), `${rowLabel(row)} surface`).not.toBe('');
      expect(row.owner.trim(), `${rowLabel(row)} owner`).not.toBe('');
      expect(row.evidence.length, `${rowLabel(row)} evidence`).toBeGreaterThan(0);
      for (const evidence of row.evidence) {
        expect(evidence.trim(), `${rowLabel(row)} blank evidence`).not.toBe('');
        expect(evidence, `${rowLabel(row)} absolute evidence`).not.toMatch(
          ABSOLUTE_EVIDENCE_PATTERN
        );
        expect(evidence, `${rowLabel(row)} ignored evidence`).not.toMatch(IGNORED_EVIDENCE_PATTERN);
        expect(evidence, `${rowLabel(row)} unsafe evidence`).not.toMatch(UNSAFE_TEXT_PATTERN);
      }
      for (const text of [row.family, row.surface, row.owner, row.notes ?? '']) {
        expect(text, `${rowLabel(row)} unsafe report text`).not.toMatch(UNSAFE_TEXT_PATTERN);
      }
    }
  });

  test('covers required Chorus2 route families without overclaiming aliases', () => {
    for (const family of REQUIRED_ROUTE_FAMILIES) {
      expect(
        CHORUS2_PARITY_LEDGER.some((row) => row.kind === 'route' && row.family === family),
        `missing route family ${family}`
      ).toBe(true);
    }

    expect(getChorus2ParityRowById('route:shell:root')?.status).toBe('implemented');
    expect(getChorus2ParityRowById('route:settings:settings')?.status).toBe('implemented');
    expect(getChorus2ParityRowById('route:addon:addons-addonid')?.status).toBe('implemented');
    const movieAlias = getChorus2ParityRowById('route:movie:movies');
    expect(movieAlias?.status).toBe('implemented');
    expect(movieAlias?.owner).toBe('M006/S04');
    expect(movieAlias?.evidence).toEqual(
      expect.arrayContaining([
        'src/lib/app/appRouter.ts',
        'src/lib/app/appRouter.test.ts',
        'src/App.test.ts'
      ])
    );

    const tvAlias = getChorus2ParityRowById('route:tvshow:tvshows');
    expect(tvAlias?.status).toBe('implemented');
    expect(tvAlias?.owner).toBe('M006/S04');
    expect(tvAlias?.evidence).toEqual(
      expect.arrayContaining([
        'src/lib/app/appRouter.ts',
        'src/lib/app/appRouter.test.ts',
        'src/App.test.ts'
      ])
    );
    const remoteRoute = getChorus2ParityRowById('route:input:remote');
    expect(remoteRoute?.status).toBe('implemented');
    expect(remoteRoute?.evidence).toEqual(
      expect.arrayContaining([
        'src/lib/app/appRouter.ts',
        'src/lib/components/RemoteInputPanel.svelte',
        'src/App.test.ts'
      ])
    );
  });

  test('covers required nav/menu surfaces', () => {
    for (const surface of REQUIRED_NAV_SURFACES) {
      expect(
        rowsForSurface('nav', surface).length,
        `missing nav surface ${surface}`
      ).toBeGreaterThan(0);
    }
  });

  test('covers visible remote controls and command/json-rpc families with conservative ownership', () => {
    for (const method of REQUIRED_JSON_RPC_METHODS) {
      expect(rowsForSurface('jsonrpc', method).length, `missing jsonrpc ${method}`).toBeGreaterThan(
        0
      );
    }

    const implementedRemoteControls = [
      'left',
      'up',
      'right',
      'down',
      'back',
      'select',
      'contextmenu',
      'info',
      'home'
    ];

    for (const control of implementedRemoteControls) {
      const row = rowsForSurface('control', control)[0];
      expect(row, `missing remote control ${control}`).toBeDefined();
      expect(row?.status, `remote control ${control} status`).toBe('implemented');
      expect(row?.owner, `remote control ${control} owner`).toBe('M006/S03');
      expect(row?.evidence, `remote control ${control} evidence`).toEqual(
        expect.arrayContaining([
          'src/lib/components/RemoteInputPanel.svelte',
          'src/lib/components/RemoteInputPanel.test.ts',
          'src/App.test.ts'
        ])
      );
    }

    for (const control of [
      'sendtext',
      'executeaction',
      'osd',
      'playpause',
      'stop',
      'volumeup',
      'volumedown'
    ]) {
      const row = rowsForSurface('control', control)[0];
      expect(row, `missing remote control ${control}`).toBeDefined();
      expect(row?.status, `remote control ${control} status`).toBe('missing');
      expect(row?.owner, `remote control ${control} owner`).toBe('M006/S03');
    }

    for (const method of implementedRemoteControls.map((control) =>
      control === 'contextmenu'
        ? 'Input.ContextMenu'
        : `Input.${control.charAt(0).toUpperCase()}${control.slice(1)}`
    )) {
      const row = rowsForSurface('jsonrpc', method)[0];
      expect(row, `${method} row`).toBeDefined();
      expect(row?.status, `${method} status`).toBe('implemented');
      expect(row?.evidence, `${method} evidence`).toEqual(
        expect.arrayContaining([
          'src/lib/kodi/methods.ts',
          'src/lib/kodi/methods.test.ts',
          'src/lib/stores/remoteInputDispatch.svelte.ts',
          'src/lib/stores/remoteInputDispatch.test.ts'
        ])
      );
    }

    for (const method of ['Input.SendText', 'Input.ExecuteAction']) {
      const row = rowsForSurface('jsonrpc', method)[0];
      expect(row?.status, `${method} status`).toBe('missing');
      expect(row?.owner, `${method} owner`).toBe('M006/S03');
    }

    const inputRemoteAction = getChorus2ParityRowById('action:remote:input-remote-controls');
    expect(inputRemoteAction?.status).toBe('implemented');
    expect(inputRemoteAction?.evidence).toEqual(
      expect.arrayContaining([
        'src/lib/components/RemoteInputPanel.svelte',
        'src/lib/stores/remoteInputDispatch.svelte.ts',
        'src/App.test.ts'
      ])
    );

    for (const method of [
      'Application.Quit',
      'System.Shutdown',
      'System.Reboot',
      'System.Suspend',
      'System.Hibernate'
    ]) {
      const row = rowsForSurface('jsonrpc', method)[0];
      expect(row?.status, `${method} guarded status`).toBe('deferred');
      expect(row?.owner, `${method} D043 owner`).toContain('D043');
    }
  });

  test('lookup helpers are deterministic and do not expose mutable ledger arrays', () => {
    const missingRows = getChorus2ParityRowsByStatus('missing');
    expect(missingRows.length).toBeGreaterThan(0);
    expect(missingRows).toEqual(
      [...missingRows].sort((left, right) => left.id.localeCompare(right.id))
    );
    expect(missingRows).not.toBe(CHORUS2_PARITY_LEDGER);

    const remoteRows = getChorus2ParityRowsByFamily('remote');
    expect(remoteRows.every((row) => row.family === 'remote')).toBe(true);
    expect(remoteRows).toEqual(
      [...remoteRows].sort((left, right) => left.id.localeCompare(right.id))
    );
    expect(remoteRows).not.toBe(CHORUS2_PARITY_LEDGER);

    const knownRow = getChorus2ParityRowById('jsonrpc:player:play-pause');
    expect(knownRow?.surface).toBe('Player.PlayPause');
    expect(getChorus2ParityRowById('jsonrpc:player:does-not-exist')).toBeUndefined();
  });
});
