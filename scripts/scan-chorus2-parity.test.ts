import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  extractAppRoutes,
  extractCommandHandlers,
  extractDynamicJsonRpcMethods,
  extractJsonRpcMethods,
  extractNavPaths,
  extractRemoteControlTypes,
  formatScanSummary,
  normalizeParityId,
  scanChorus2Parity
} from './scan-chorus2-parity.mjs';

const testRoots: string[] = [];

function createFixture(files: Record<string, string>): string {
  const root = join(tmpdir(), `chorus3-parity-${randomUUID()}`);
  testRoots.push(root);

  for (const [path, contents] of Object.entries(files)) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }

  return root;
}

afterEach(() => {
  for (const root of testRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe('Chorus2 parity source scanner helpers', () => {
  it('normalizes stable parity ids for downstream ledger joins', () => {
    expect(normalizeParityId('route', 'Movie', 'movie/:id')).toBe('route:movie:movie-id');
    expect(normalizeParityId('nav', 'settings', 'Settings / Web')).toBe(
      'nav:settings:settings-web'
    );
    expect(normalizeParityId('control', 'remote', 'ContextMenu')).toBe(
      'control:remote:context-menu'
    );
    expect(normalizeParityId('jsonrpc', 'Input', 'Input.SendText')).toBe('jsonrpc:input:send-text');
    expect(normalizeParityId('action', 'input', 'input:send')).toBe('action:input:input-send');
  });

  it('extracts CoffeeScript appRoutes and reports malformed blocks as diagnostics', () => {
    const source = `
      class Router
        appRoutes:
          'music': 'music'
          'movies/:id': 'movie'
          "tvshows/:showId/seasons": "tvshowSeasons"
          ""        : "homePage"
          invalid route row
        other: true
    `;

    expect(extractAppRoutes(source, '/tmp/chorus2/src/router.coffee')).toEqual({
      diagnostics: [
        '[scan] src/router.coffee:8 skipped malformed appRoutes row: invalid route row'
      ],
      items: [
        {
          evidence: ['src/router.coffee:7'],
          family: 'home-page',
          id: 'route:home-page:root',
          kind: 'route',
          surface: ''
        },
        {
          evidence: ['src/router.coffee:5'],
          family: 'movie',
          id: 'route:movie:movies-id',
          kind: 'route',
          surface: 'movies/:id'
        },
        {
          evidence: ['src/router.coffee:4'],
          family: 'music',
          id: 'route:music:music',
          kind: 'route',
          surface: 'music'
        },
        {
          evidence: ['src/router.coffee:6'],
          family: 'tvshow-seasons',
          id: 'route:tvshow-seasons:tvshows-show-id-seasons',
          kind: 'route',
          surface: 'tvshows/:showId/seasons'
        }
      ]
    });
  });

  it('extracts main navigation paths, remote controls, command handlers, and literal JSON-RPC methods', () => {
    const navSource = `
      navMain = [
        ['music', '/music']
        ['movies', '/movies']
        { title: 'Web', path: '/settings/web' }
      ]
    `;
    const remoteSource = `
      <button data-type="Left">Left</button>
      <button data-type='Info'>Info</button>
      <button data-type="Home">Home</button>
    `;
    const handlersSource = `
      App.commands.setHandler "input:send", ->
      App.reqres.setHandler 'player:open', ->
      app.commands.setHandler "library:video:scan", ->
    `;
    const rpcSource = `
      methods = ['JSONRPC.Ping', "VideoLibrary.GetMovies"]
      kodiRequest('Input.Left')
    `;

    expect(extractNavPaths(navSource, 'src/app/navigation.coffee').items).toEqual([
      {
        evidence: ['src/app/navigation.coffee:4'],
        family: 'movies',
        id: 'nav:movies:movies',
        kind: 'nav',
        surface: '/movies'
      },
      {
        evidence: ['src/app/navigation.coffee:3'],
        family: 'music',
        id: 'nav:music:music',
        kind: 'nav',
        surface: '/music'
      },
      {
        evidence: ['src/app/navigation.coffee:5'],
        family: 'settings',
        id: 'nav:settings:settings-web',
        kind: 'nav',
        surface: '/settings/web'
      }
    ]);
    expect(extractRemoteControlTypes(remoteSource, 'src/views/remote.eco').items).toEqual([
      {
        evidence: ['src/views/remote.eco:4'],
        family: 'remote',
        id: 'control:remote:home',
        kind: 'control',
        surface: 'Home'
      },
      {
        evidence: ['src/views/remote.eco:3'],
        family: 'remote',
        id: 'control:remote:info',
        kind: 'control',
        surface: 'Info'
      },
      {
        evidence: ['src/views/remote.eco:2'],
        family: 'remote',
        id: 'control:remote:left',
        kind: 'control',
        surface: 'Left'
      }
    ]);
    expect(extractCommandHandlers(handlersSource, 'src/app/handlers.coffee').items).toEqual([
      {
        evidence: ['src/app/handlers.coffee:2'],
        family: 'input',
        id: 'action:input:input-send',
        kind: 'action',
        surface: 'input:send'
      },
      {
        evidence: ['src/app/handlers.coffee:4'],
        family: 'library',
        id: 'action:library:library-video-scan',
        kind: 'action',
        surface: 'library:video:scan'
      },
      {
        evidence: ['src/app/handlers.coffee:3'],
        family: 'player',
        id: 'action:player:player-open',
        kind: 'action',
        surface: 'player:open'
      }
    ]);
    expect(extractJsonRpcMethods(rpcSource, 'src/app/rpc.coffee').items).toEqual([
      {
        evidence: ['src/app/rpc.coffee:3'],
        family: 'input',
        id: 'jsonrpc:input:left',
        kind: 'jsonrpc',
        surface: 'Input.Left'
      },
      {
        evidence: ['src/app/rpc.coffee:2'],
        family: 'jsonrpc',
        id: 'jsonrpc:jsonrpc:ping',
        kind: 'jsonrpc',
        surface: 'JSONRPC.Ping'
      },
      {
        evidence: ['src/app/rpc.coffee:2'],
        family: 'video-library',
        id: 'jsonrpc:video-library:get-movies',
        kind: 'jsonrpc',
        surface: 'VideoLibrary.GetMovies'
      }
    ]);
  });

  it('expands commandNameSpace getCommand helpers, including dynamic remote data-type controls', () => {
    const source = `
      commandNameSpace: 'Input'
      sendText: -> @getCommand('SendText')
      click: (type) -> @getCommand(type)
      <button data-type="Left"></button>
      <button data-type="Up"></button>
      <button data-type="Right"></button>
      <button data-type="Down"></button>
      <button data-type="Back"></button>
      <button data-type="Select"></button>
      <button data-type="ContextMenu"></button>
      <button data-type="Info"></button>
      <button data-type="Home"></button>
    `;

    expect(extractDynamicJsonRpcMethods(source, 'src/views/remote.coffee').items).toEqual(
      [
        'Input.Back',
        'Input.ContextMenu',
        'Input.Down',
        'Input.Home',
        'Input.Info',
        'Input.Left',
        'Input.Right',
        'Input.Select',
        'Input.SendText',
        'Input.Up'
      ].map((surface) => ({
        evidence: expect.arrayContaining(['src/views/remote.coffee:2']),
        family: 'input',
        id: normalizeParityId('jsonrpc', 'Input', surface),
        kind: 'jsonrpc',
        surface
      }))
    );
  });
});

describe('scanChorus2Parity', () => {
  it('scans fixture trees deterministically, collapses duplicates, and keeps evidence repo-relative', () => {
    const root = createFixture({
      'src/router.coffee': `
        appRoutes:
          'music': 'music'
          'music': 'music'
          'remote': 'remote'
      `,
      'src/views/remote.eco': `
        <button data-type="Left"></button>
        <button data-type="Info"></button>
      `,
      'src/app/commands.coffee': `
        App.commands.setHandler "input:send", ->
        commandNameSpace: 'Input'
        @getCommand(type)
        @getCommand('SendText')
        'JSONRPC.Ping'
      `,
      'node_modules/ignored.coffee': `
        appRoutes:
          'ignored': 'ignored'
      `,
      '.gsd/ignored.coffee': `
        'Input.ShouldNotAppear'
      `
    });

    const scan = scanChorus2Parity({ root });

    expect(scan.diagnostics).toEqual([]);
    expect(scan.items.map((item) => item.id)).toEqual([
      'action:input:input-send',
      'control:remote:info',
      'control:remote:left',
      'jsonrpc:input:info',
      'jsonrpc:input:left',
      'jsonrpc:input:send-text',
      'jsonrpc:jsonrpc:ping',
      'route:music:music',
      'route:remote:remote'
    ]);
    expect(scan.items.find((item) => item.id === 'route:music:music')).toEqual({
      evidence: ['src/router.coffee:3', 'src/router.coffee:4'],
      family: 'music',
      id: 'route:music:music',
      kind: 'route',
      surface: 'music'
    });
    expect(JSON.stringify(scan)).not.toContain(root);
  });

  it('handles empty files, malformed snippets, and missing roots with controlled [scan] diagnostics', () => {
    const root = createFixture({
      'src/empty.coffee': '',
      'src/router.coffee': `
        appRoutes:
          not a route row
      `
    });

    expect(scanChorus2Parity({ root })).toEqual({
      diagnostics: ['[scan] src/router.coffee:3 skipped malformed appRoutes row: not a route row'],
      items: []
    });

    expect(scanChorus2Parity({ root: join(root, 'missing') })).toEqual({
      diagnostics: ['[scan] missing scan root: missing'],
      items: []
    });
  });

  it('formats a summary with counts, families, and diagnostics for CLI smoke checks', () => {
    const scan = {
      diagnostics: ['[scan] src/bad.coffee:1 skipped malformed appRoutes row: bad'],
      items: [
        {
          evidence: ['src/router.coffee:1'],
          family: 'music',
          id: 'route:music:music',
          kind: 'route',
          surface: 'music'
        },
        {
          evidence: ['src/nav.coffee:1'],
          family: 'movies',
          id: 'nav:movies:movies',
          kind: 'nav',
          surface: '/movies'
        },
        {
          evidence: ['src/remote.eco:1'],
          family: 'remote',
          id: 'control:remote:left',
          kind: 'control',
          surface: 'Left'
        },
        {
          evidence: ['src/commands.coffee:1'],
          family: 'input',
          id: 'action:input:input-send',
          kind: 'action',
          surface: 'input:send'
        },
        {
          evidence: ['src/rpc.coffee:1'],
          family: 'jsonrpc',
          id: 'jsonrpc:jsonrpc:ping',
          kind: 'jsonrpc',
          surface: 'JSONRPC.Ping'
        }
      ]
    };

    expect(formatScanSummary(scan)).toBe(
      [
        '[scan] Chorus2 parity scan summary',
        'items: 5',
        'route: 1',
        'nav: 1',
        'control: 1',
        'action: 1',
        'jsonrpc: 1',
        'families: input, jsonrpc, movies, music, remote',
        'diagnostics: 1',
        '[scan] src/bad.coffee:1 skipped malformed appRoutes row: bad'
      ].join('\n')
    );
  });
});
