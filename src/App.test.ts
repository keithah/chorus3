import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import App from './App.svelte';
import type { PlayerControlsDispatch } from './lib/components/PlayerControls.svelte';
import type { QueuePanelDispatch } from './lib/components/QueuePanel.svelte';
import {
  configStore,
  connectionStore,
  createConfigStore,
  hostConnectionStore,
  localPlayerStore,
  type PlayerDispatchSnapshot,
  type PlayerStoreSnapshot,
  type QueueDispatchSnapshot,
  type QueueStoreSnapshot
} from './lib/stores';
import { DEFAULT_THEME } from './lib/theme/theme';

let mountedComponent: Record<string, unknown> | undefined;

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;
type AppProps = {
  playerSnapshot?: PlayerStoreSnapshot;
  playerDispatch?: PlayerControlsDispatch;
  localPlayerSnapshot?: import('./lib/stores/localPlayer.svelte').LocalPlayerStoreSnapshot;
  queueSnapshot?: QueueStoreSnapshot;
  queueDispatch?: QueuePanelDispatch;
};

function createPlayerSnapshot(overrides: Partial<PlayerStoreSnapshot> = {}): PlayerStoreSnapshot {
  return {
    refreshStatus: 'idle',
    playbackStatus: 'none',
    lastRefreshReason: 'init',
    lastQueueRefreshReason: null,
    lastUpdatedAt: null,
    activePlayers: [],
    primaryPlayer: null,
    item: null,
    properties: null,
    application: { volume: null, muted: null },
    queue: { playlistid: null, position: null },
    time: { currentSeconds: null, totalSeconds: null },
    lastError: null,
    ...overrides
  };
}

function createDispatchSnapshot(
  overrides: Partial<PlayerDispatchSnapshot> = {}
): PlayerDispatchSnapshot {
  return {
    mode: 'kodi',
    commandStatus: 'idle',
    lastCommand: null,
    lastError: null,
    lastCompletedAt: null,
    ...overrides
  };
}

function createPlayerDispatch(
  snapshot: PlayerDispatchSnapshot = createDispatchSnapshot()
): PlayerControlsDispatch {
  return {
    snapshot,
    playPause: vi.fn(),
    stop: vi.fn(),
    previous: vi.fn(),
    next: vi.fn(),
    seekPercentage: vi.fn(),
    seekRelativeSeconds: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
    setShuffle: vi.fn(),
    setRepeat: vi.fn(),
    setSubtitle: vi.fn(),
    setAudioStream: vi.fn(),
    startLocalPlayback: vi.fn(),
    resumeOnKodi: vi.fn()
  };
}

function getButton(target: HTMLElement, name: string): HTMLButtonElement {
  const button = Array.from(target.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.trim() === name
  );
  expect(button).toBeInstanceOf(HTMLButtonElement);
  return button as HTMLButtonElement;
}

function getInput(target: HTMLElement, selector: string): HTMLInputElement {
  const input = target.querySelector<HTMLInputElement>(selector);
  expect(input).toBeInstanceOf(HTMLInputElement);
  return input as HTMLInputElement;
}

function getSelect(target: HTMLElement, selector: string): HTMLSelectElement {
  const select = target.querySelector<HTMLSelectElement>(selector);
  expect(select).toBeInstanceOf(HTMLSelectElement);
  return select as HTMLSelectElement;
}

function getNowPlayingPanelText(target: HTMLElement): string {
  const panel = target.querySelector<HTMLElement>('.now-playing-panel');
  expect(panel).toBeInstanceOf(HTMLElement);
  return panel?.textContent ?? '';
}

function changeInputValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function changeSelectValue(select: HTMLSelectElement, value: string): void {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

function activeVideoSnapshot(overrides: Partial<PlayerStoreSnapshot> = {}): PlayerStoreSnapshot {
  return createPlayerSnapshot({
    refreshStatus: 'ready',
    playbackStatus: 'active',
    lastRefreshReason: 'command:playPause',
    lastUpdatedAt: '2026-04-28T12:00:00.000Z',
    activePlayers: [{ playerid: 1, type: 'video' }],
    primaryPlayer: { playerid: 1, type: 'video' },
    item: {
      label: 'Sintel',
      title: 'Sintel',
      showtitle: 'Open Movie Project',
      season: 1,
      episode: 2,
      file: 'smb://admin:p@ssword@nas.local/private/Sintel.mkv'
    },
    properties: {
      type: 'video',
      percentage: 42.4,
      shuffled: false,
      repeat: 'off',
      subtitleenabled: true,
      currentsubtitle: { index: 2, name: 'English SDH', language: 'eng' },
      subtitles: [
        { index: 2, name: 'English SDH', language: 'eng' },
        { index: 3, name: 'Deutsch', language: 'deu' }
      ],
      currentaudiostream: { index: 1, name: 'Director commentary', language: 'eng', channels: 2 },
      audiostreams: [
        { index: 0, name: 'Main mix', language: 'eng', channels: 6, codec: 'aac' },
        { index: 1, name: 'Director commentary', language: 'eng', channels: 2, codec: 'aac' }
      ]
    },
    application: { volume: 55, muted: false },
    queue: { playlistid: 1, position: 7 },
    time: { currentSeconds: 75, totalSeconds: 300 },
    ...overrides
  });
}

function renderApp(props: AppProps = {}) {
  document.body.innerHTML = '<div id="app-test-root"></div>';
  document.documentElement.dataset.theme = DEFAULT_THEME;
  const target = document.getElementById('app-test-root');

  if (!target) {
    throw new Error('Missing test root');
  }

  mountedComponent = mount(App, { target, props }) as Record<string, unknown>;
  flushSync();

  return target;
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
}

function createKodiFetchMock(): FetchMock {
  return vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
    async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? '{}')) as { id?: number; method?: string };

      switch (body.method) {
        case 'JSONRPC.Ping':
          return jsonResponse({ jsonrpc: '2.0', id: body.id, result: 'pong' });
        case 'JSONRPC.Version':
          return jsonResponse({ jsonrpc: '2.0', id: body.id, result: { version: '2.0' } });
        case 'Application.GetProperties':
          return jsonResponse({
            jsonrpc: '2.0',
            id: body.id,
            result: { name: 'Kodi', version: { major: 21, minor: 1 }, volume: 55, muted: false }
          });
        default:
          return jsonResponse({
            jsonrpc: '2.0',
            id: body.id,
            error: { code: -32601, message: 'Method not found' }
          });
      }
    }
  );
}

async function waitForText(target: HTMLElement, text: string): Promise<void> {
  await vi.waitFor(() => {
    expect(target.textContent).toContain(text);
  });
}

function setInputValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function setCheckbox(input: HTMLInputElement, checked: boolean): void {
  input.checked = checked;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

async function submitHostForm(target: HTMLElement): Promise<void> {
  const form = target.querySelector<HTMLFormElement>('form[aria-label="Kodi host settings"]');
  expect(form).toBeInstanceOf(HTMLFormElement);
  form?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
  await tick();
}

async function addHost(
  target: HTMLElement,
  {
    label = 'Living Room Kodi',
    host = 'kodi.local',
    port = '8080',
    username = 'kodi',
    password = 'super-secret-password',
    useWebSocket = false
  }: {
    label?: string;
    host?: string;
    port?: string;
    username?: string;
    password?: string;
    useWebSocket?: boolean;
  } = {}
): Promise<void> {
  setInputValue(target.querySelector<HTMLInputElement>('#host-label')!, label);
  setInputValue(target.querySelector<HTMLInputElement>('#host-address')!, host);
  setInputValue(target.querySelector<HTMLInputElement>('#host-port')!, port);
  setInputValue(target.querySelector<HTMLInputElement>('#host-username')!, username);
  setInputValue(target.querySelector<HTMLInputElement>('#host-password')!, password);
  setCheckbox(target.querySelector<HTMLInputElement>('#host-websocket')!, useWebSocket);
  await submitHostForm(target);
}

beforeEach(() => {
  vi.restoreAllMocks();
  configStore.reset();
  hostConnectionStore.destroy();
  connectionStore.destroy();
});

afterEach(() => {
  if (mountedComponent) {
    unmount(mountedComponent);
    mountedComponent = undefined;
  }

  hostConnectionStore.destroy();
  localPlayerStore.stop();
  configStore.reset();
  connectionStore.destroy();
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-theme');
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe('App shell', () => {
  it('renders default no-player Now Playing controls as disabled without dispatching', () => {
    const dispatch = createPlayerDispatch();
    const target = renderApp({ playerSnapshot: createPlayerSnapshot(), playerDispatch: dispatch });

    expect(target.textContent).toContain('Now playing');
    expect(target.textContent).toContain('Unknown title');
    expect(target.textContent).toContain('No active Kodi player is available.');
    expect(target.textContent).toContain(
      'No active Kodi player is available. Controls are disabled until playback starts.'
    );
    expect(getButton(target, 'Play or pause').disabled).toBe(true);
    expect(getButton(target, 'Next').disabled).toBe(true);
    expect(getInput(target, '#now-playing-seek').disabled).toBe(true);
    expect(getSelect(target, '#now-playing-audio').disabled).toBe(true);
    expect(dispatch.playPause).not.toHaveBeenCalled();
  });

  it('renders multiple-player Now Playing controls as disabled with explanatory copy', () => {
    const target = renderApp({
      playerSnapshot: createPlayerSnapshot({
        refreshStatus: 'ready',
        playbackStatus: 'multiple',
        activePlayers: [
          { playerid: 1, type: 'video' },
          { playerid: 2, type: 'audio' }
        ],
        primaryPlayer: { playerid: 1, type: 'video' },
        item: { label: 'Concert Film' }
      }),
      playerDispatch: createPlayerDispatch()
    });

    expect(target.textContent).toContain('Concert Film');
    expect(target.textContent).toContain(
      'Multiple Kodi players are active. Choose one player before sending controls.'
    );
    expect(target.textContent).toContain(
      'Multiple Kodi players are active. Controls are disabled until there is one active player.'
    );
    expect(getButton(target, 'Play or pause').disabled).toBe(true);
    expect(getButton(target, 'Next').disabled).toBe(true);
  });

  it('renders active video metadata, progress, volume, queue context, streams, and no raw file paths', () => {
    const target = renderApp({
      playerSnapshot: activeVideoSnapshot(),
      playerDispatch: createPlayerDispatch()
    });

    expect(target.textContent).toContain('Now playing');
    expect(target.textContent).toContain('Sintel');
    expect(target.textContent).toContain('Open Movie Project');
    expect(target.textContent).toContain('Season 1, episode 2');
    expect(target.textContent).toContain('01:15');
    expect(target.textContent).toContain('05:00');
    expect(target.textContent).toContain('42%');
    expect(target.textContent).toContain('Volume 55');
    expect(target.textContent).toContain('Muted: no');
    expect(target.textContent).toContain('Playlist 1 · position 7');
    expect(target.textContent).toContain(
      'Player state ready. Last updated 2026-04-28T12:00:00.000Z.'
    );
    expect(target.textContent).toContain('English SDH · eng');
    expect(target.textContent).toContain('Director commentary · eng · 2ch');
    expect(getInput(target, '#now-playing-seek').value).toBe('42');
    expect(getInput(target, '#now-playing-volume').value).toBe('55');
    expect(target.textContent).not.toContain('smb://');
    expect(target.textContent).not.toContain('admin:p@ssword');
    expect(target.textContent).not.toContain('private/Sintel.mkv');
  });

  it('routes playback, seek, volume, shuffle, repeat, subtitle, and audio controls through injected dispatch', async () => {
    const dispatch = createPlayerDispatch();
    const target = renderApp({ playerSnapshot: activeVideoSnapshot(), playerDispatch: dispatch });

    getButton(target, 'Play or pause').click();
    getButton(target, 'Next').click();
    changeInputValue(getInput(target, '#now-playing-seek'), '64');
    changeInputValue(getInput(target, '#now-playing-volume'), '71');
    getButton(target, 'Toggle mute').click();
    changeSelectValue(getSelect(target, '#now-playing-shuffle'), 'true');
    changeSelectValue(getSelect(target, '#now-playing-repeat'), 'all');
    changeSelectValue(getSelect(target, '#now-playing-subtitle'), '3');
    changeSelectValue(getSelect(target, '#now-playing-audio'), '0');
    await tick();

    expect(dispatch.playPause).toHaveBeenCalledTimes(1);
    expect(dispatch.next).toHaveBeenCalledTimes(1);
    expect(dispatch.seekPercentage).toHaveBeenCalledWith(64);
    expect(dispatch.setVolume).toHaveBeenCalledWith(71);
    expect(dispatch.toggleMute).toHaveBeenCalledTimes(1);
    expect(dispatch.setShuffle).toHaveBeenCalledWith(true);
    expect(dispatch.setRepeat).toHaveBeenCalledWith('all');
    expect(dispatch.setSubtitle).toHaveBeenCalledWith(3);
    expect(dispatch.setAudioStream).toHaveBeenCalledWith(0);
  });

  it('renders running controls disabled to constrain rapid command bursts', () => {
    const target = renderApp({
      playerSnapshot: activeVideoSnapshot(),
      playerDispatch: createPlayerDispatch(
        createDispatchSnapshot({ commandStatus: 'running', lastCommand: 'seekPercentage' })
      )
    });

    expect(target.textContent).toContain('Running seek percentage.');
    expect(target.textContent).toContain(
      'A Kodi command is running. Controls are disabled until it finishes.'
    );
    expect(getButton(target, 'Play or pause').disabled).toBe(true);
    expect(getInput(target, '#now-playing-volume').disabled).toBe(true);
  });

  it('renders dispatch and refresh errors without secret-like details or raw endpoints', () => {
    const target = renderApp({
      playerSnapshot: activeVideoSnapshot({
        refreshStatus: 'error',
        lastError: {
          source: 'http',
          code: 'auth',
          message: 'Kodi rejected configured credentials while calling Player.GetItem.',
          endpoint: {
            protocol: 'http:',
            host: 'kodi.local',
            port: 8080,
            path: '/jsonrpc',
            timeoutMs: 5000,
            hasCredentials: true
          }
        }
      }),
      playerDispatch: createPlayerDispatch(
        createDispatchSnapshot({
          commandStatus: 'error',
          lastCommand: 'playPause',
          lastError: {
            source: 'http',
            code: 'auth',
            message:
              'Authorization: Basic admin:p@ssword failed for http://admin:p@ssword@kodi.local:8080/jsonrpc via localStorage.',
            endpoint: {
              protocol: 'http:',
              host: 'kodi.local',
              port: 8080,
              path: '/jsonrpc',
              timeoutMs: 5000,
              hasCredentials: true
            }
          }
        })
      )
    });

    const panelText = getNowPlayingPanelText(target);

    expect(panelText).toContain('credentials [redacted]');
    expect(panelText).toContain('[redacted-url]');
    expect(panelText).toContain('browser storage');
    expect(panelText).toContain('Sintel');
    expect(panelText).not.toContain('p@ssword');
    expect(panelText).not.toContain('admin:p@ssword');
    expect(panelText).not.toContain('http://kodi.local:8080/jsonrpc');
    expect(panelText).not.toContain('localStorage');
  });

  it('renders active audio snapshots with control affordances and missing stream indexes safely', () => {
    const target = renderApp({
      playerSnapshot: activeVideoSnapshot({
        activePlayers: [{ playerid: 0, type: 'audio' }],
        primaryPlayer: { playerid: 0, type: 'audio' },
        item: {
          label: 'Arrival',
          artist: ['Max Richter'],
          album: 'Sleep',
          file: '/music/private/arrival.flac'
        },
        properties: {
          type: 'audio',
          percentage: 5,
          shuffled: true,
          repeat: 'all',
          subtitleenabled: false,
          audiostreams: [{ name: 'Stereo', language: 'eng', channels: 2 }]
        }
      }),
      playerDispatch: createPlayerDispatch()
    });

    expect(target.textContent).toContain('Arrival');
    expect(target.textContent).toContain('Max Richter');
    expect(target.textContent).toContain('Sleep');
    expect(target.textContent).toContain('Subtitles off');
    expect(target.textContent).toContain('Stereo · eng · 2ch');
    expect(getButton(target, 'Play or pause').disabled).toBe(false);
    expect(getSelect(target, '#now-playing-audio').disabled).toBe(false);
    expect(target.textContent).not.toContain('/music/private/arrival.flac');
  });

  it('renders the shell with store-backed idle Kodi connection diagnostics and host controls', () => {
    const target = renderApp();

    expect(target.textContent).toContain('chorus3');
    expect(target.textContent).toContain('Multi-host console');
    expect(target.textContent).toContain('No Kodi host configured yet');
    expect(target.textContent).toContain('Connection');
    expect(target.textContent).toContain('no host');
    expect(target.textContent).toContain('Add a trusted Kodi host to begin HTTP diagnostics');
    expect(target.textContent).toContain('HTTP and WebSocket checks are idle');
    expect(target.textContent).not.toContain('S03 will replace this placeholder');
    expect(target.textContent).not.toContain('upcoming host settings slice');
    expect(target.textContent).toContain('Library sync');
    expect(target.textContent).toContain('Kodi host settings');
    expect(target.textContent).toContain('Only save credentials on a trusted device');
  });

  it('validates host fields accessibly and rejects credential-bearing host text', async () => {
    const target = renderApp();

    await submitHostForm(target);

    const labelInput = target.querySelector<HTMLInputElement>('#host-label');
    const hostInput = target.querySelector<HTMLInputElement>('#host-address');
    expect(labelInput?.getAttribute('aria-invalid')).toBe('true');
    expect(labelInput?.getAttribute('aria-describedby')).toContain('host-label-error');
    expect(hostInput?.getAttribute('aria-invalid')).toBe('true');
    expect(target.textContent).toContain('Label is required.');
    expect(target.textContent).toContain('Host is required.');

    setInputValue(labelInput!, 'Office Kodi');
    setInputValue(hostInput!, 'http://admin:secret@kodi.local/jsonrpc');
    setInputValue(target.querySelector<HTMLInputElement>('#host-port')!, '70000');
    await submitHostForm(target);

    expect(target.textContent).toContain(
      'Host must not include a protocol, path, query string, or credentials.'
    );
    expect(target.textContent).toContain('HTTP port must be an integer between 1 and 65535.');
    expect(target.textContent).not.toContain('admin:secret');
    expect(target.textContent).not.toContain('Basic ');
  });

  it('adds, tests, activates, edits, and deletes saved hosts without exposing secrets', async () => {
    const fetchMock = createKodiFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const target = renderApp();

    await addHost(target);

    expect(target.textContent).toContain('Living Room Kodi');
    expect(target.textContent).toContain('kodi.local:8080');
    expect(target.textContent).toContain('Credentials saved');
    expect(target.textContent).not.toContain('super-secret-password');
    expect(target.textContent).not.toContain('Basic ');

    target.querySelector<HTMLButtonElement>('button[aria-label="Test Living Room Kodi"]')?.click();
    await waitForText(target, 'Test passed');

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(target.textContent).toContain('Test passed');
    expect(target.textContent).toContain('Kodi 21.1');
    expect(target.textContent).toContain('Application Kodi');

    const activateButton = target.querySelector<HTMLButtonElement>(
      'button[aria-label="Activate Living Room Kodi"]'
    );
    activateButton?.click();
    await waitForText(target, 'connected');

    expect(target.textContent).toContain('Active host');
    expect(target.textContent).toContain('connected');
    expect(target.textContent).toContain('Kodi HTTP diagnostics are connected. Kodi 21.1');

    target.querySelector<HTMLButtonElement>('button[aria-label="Edit Living Room Kodi"]')?.click();
    await tick();
    setInputValue(target.querySelector<HTMLInputElement>('#host-label')!, 'Media Room Kodi');
    await submitHostForm(target);

    expect(target.textContent).toContain('Media Room Kodi');
    expect(target.textContent).not.toContain('super-secret-password');

    target.querySelector<HTMLButtonElement>('button[aria-label="Delete Media Room Kodi"]')?.click();
    await tick();

    expect(target.textContent).toContain('No saved hosts yet');
    expect(target.textContent).toContain('No active host selected');
    expect(target.textContent).not.toContain('super-secret-password');
    expect(target.textContent).not.toContain('Basic ');
  });

  it('shows safe host test and connection failures while preserving saved-host controls', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
        .mockResolvedValue(jsonResponse({ ok: false }, { status: 401, statusText: 'Unauthorized' }))
    );
    const target = renderApp();

    await addHost(target, { label: 'Failed Kodi', host: 'failed.local', password: 'bad-password' });

    target.querySelector<HTMLButtonElement>('button[aria-label="Test Failed Kodi"]')?.click();
    await waitForText(target, 'Test failed');

    expect(target.textContent).toContain('Test failed');
    expect(target.textContent).toContain(
      'Kodi rejected the configured username or password while calling JSONRPC.Ping.'
    );
    expect(
      target.querySelector<HTMLButtonElement>('button[aria-label="Test Failed Kodi"]')
    ).not.toBe(null);

    target.querySelector<HTMLButtonElement>('button[aria-label="Activate Failed Kodi"]')?.click();
    await waitForText(target, 'Kodi connection failed (http/auth)');

    expect(target.textContent).toContain('failed');
    expect(target.textContent).toContain('Kodi connection failed (http/auth)');
    expect(target.textContent).not.toContain('bad-password');
    expect(target.textContent).not.toContain('Basic ');
  });

  it('renders storage recovery warnings without raw localStorage content', () => {
    const rawSecret = '{"hosts":[{"password":"raw-local-storage-secret"}]}';
    window.localStorage.setItem('chorus3.kodi.hosts', rawSecret);
    const recoveredStore = createConfigStore({ storage: window.localStorage });
    configStore.storageWarning = recoveredStore.snapshot.storageWarning;

    const target = renderApp();

    expect(target.textContent).toContain(
      'Saved Kodi host settings were reset because stored data was invalid.'
    );
    expect(target.textContent).not.toContain('raw-local-storage-secret');
    expect(target.textContent).not.toContain(rawSecret);
  });

  it('renders degraded WebSocket diagnostics from the shared connection store', async () => {
    connectionStore.status = 'degraded';
    connectionStore.webSocketDegraded = true;
    connectionStore.reconnectAttempt = 3;
    connectionStore.lastConnectedAt = '2026-04-28T07:00:00.000Z';
    connectionStore.kodiVersion = { major: 21, minor: 1 };
    connectionStore.lastError = {
      source: 'websocket',
      code: 'closed',
      message: 'Kodi WebSocket closed unexpectedly (code 1006).',
      endpoint: {
        protocol: 'ws:',
        host: 'kodi.local',
        port: 9090,
        path: '/jsonrpc',
        hasCredentials: false
      }
    };

    const target = renderApp();
    await tick();

    expect(target.textContent).toContain('degraded');
    expect(target.textContent).toContain('WebSocket degraded after HTTP diagnostics succeeded');
    expect(target.textContent).toContain('retry attempt 3');
    expect(target.textContent).toContain('Last connected 2026-04-28T07:00:00.000Z');
    expect(target.textContent).toContain('Kodi 21.1');
    expect(target.textContent).not.toContain('admin:secret');
  });

  it('renders QueuePanel with no-active copy when no queue snapshot is provided', () => {
    const target = renderApp();
    const panel = target.querySelector('.queue-panel');

    expect(panel).toBeInstanceOf(HTMLElement);
    expect(panel?.textContent).toContain('No active Kodi playlist');
  });

  it('passes injected queue snapshot and dispatch to QueuePanel', () => {
    const queueSnapshot: QueueStoreSnapshot = {
      refreshStatus: 'ready',
      playlistid: 5,
      activePosition: 0,
      items: [{ position: 0, label: 'Test Track' }],
      limits: { start: 0, end: 1, total: 1 },
      lastRefreshReason: 'manual',
      lastUpdatedAt: '2026-04-28T00:00:00.000Z',
      lastError: null
    };
    const queueDispatchSnapshot: QueueDispatchSnapshot = {
      commandStatus: 'idle',
      lastCommand: null,
      lastError: null,
      lastCompletedAt: null
    };
    const queueDispatch: QueuePanelDispatch = {
      snapshot: queueDispatchSnapshot,
      removeAt: vi.fn(),
      clear: vi.fn(),
      swap: vi.fn()
    };

    const target = renderApp({ queueSnapshot, queueDispatch });
    const panel = target.querySelector('.queue-panel');

    expect(panel?.textContent).toContain('Test Track');
  });

  it('attaches the local player store to a real HTMLMediaElement and reports safe runtime diagnostics', async () => {
    const load = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);

    renderApp();

    const mediaElement = document.querySelector<HTMLMediaElement>(
      'audio[data-local-media-adapter], video[data-local-media-adapter]'
    );
    expect(mediaElement).toBeInstanceOf(HTMLMediaElement);
    if (!mediaElement) {
      throw new Error('Expected App to render a local media runtime element.');
    }
    expect(mediaElement.dataset.localMediaAdapter).toBe('attached');

    const rawStreamUrl = 'http://admin:p@ssword@kodi.local:8080/vfs/private/song.mp3';
    await localPlayerStore.loadAndPlay({
      source: rawStreamUrl,
      item: { id: 42, label: 'Private Song', type: 'song', songid: 42 },
      mediaKind: 'audio',
      kodiWasPaused: true
    });
    await tick();

    expect(load).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledTimes(1);
    expect(mediaElement?.src).not.toContain('admin:p@ssword');

    Object.defineProperty(mediaElement, 'duration', { configurable: true, value: 600 });
    mediaElement.currentTime = 301;
    mediaElement.dispatchEvent(new Event('canplay'));
    mediaElement.dispatchEvent(new Event('timeupdate'));
    await tick();

    expect(localPlayerStore.snapshot).toMatchObject({
      status: 'playing',
      mediaKind: 'audio',
      currentSeconds: 301,
      durationSeconds: 600,
      resumeAvailable: true
    });

    localPlayerStore.seekToSeconds(333);
    expect(mediaElement?.currentTime).toBe(333);

    localPlayerStore.setVolume(67);
    mediaElement?.dispatchEvent(new Event('volumechange'));
    expect(localPlayerStore.snapshot.volume).toBe(67);

    localPlayerStore.pause();
    expect(pause).toHaveBeenCalledTimes(1);
    expect(localPlayerStore.snapshot.status).toBe('paused');

    play.mockRejectedValueOnce(
      new Error(
        'NotAllowedError for http://admin:p@ssword@kodi.local:8080/vfs/private/song.mp3 with Authorization: Basic abc123 from localStorage'
      )
    );
    await localPlayerStore.loadAndPlay({
      source: rawStreamUrl,
      item: { id: 42, label: 'Private Song', type: 'song', songid: 42 },
      mediaKind: 'audio',
      kodiWasPaused: false
    });
    await tick();

    const serializedSnapshot = JSON.stringify(localPlayerStore.snapshot);
    expect(localPlayerStore.snapshot.lastError?.code).toBe('media/play-rejected');
    expect(serializedSnapshot).not.toContain(rawStreamUrl);
    expect(serializedSnapshot).not.toContain('admin:p@ssword');
    expect(serializedSnapshot).not.toContain('Authorization');
    expect(serializedSnapshot).not.toContain('Basic abc123');
    expect(serializedSnapshot).not.toContain('localStorage');
  });

  it('renders integrated Kodi mode, queue actions, and Local mode affordances safely', async () => {
    const playerDispatch = createPlayerDispatch(
      createDispatchSnapshot({ mode: 'local', lastCommand: 'startLocalPlayback' })
    );
    const queueDispatchSnapshot: QueueDispatchSnapshot = {
      commandStatus: 'idle',
      lastCommand: null,
      lastError: null,
      lastCompletedAt: null
    };
    const queueDispatch: QueuePanelDispatch = {
      snapshot: queueDispatchSnapshot,
      removeAt: vi.fn(),
      clear: vi.fn(),
      swap: vi.fn()
    };
    const target = renderApp({
      playerSnapshot: activeVideoSnapshot(),
      playerDispatch,
      localPlayerSnapshot: {
        status: 'playing',
        mediaKind: 'video',
        item: { label: 'Sintel local', type: 'movie' },
        currentSeconds: 45,
        durationSeconds: 300,
        volume: 80,
        muted: false,
        lastError: null,
        kodiPausedForLocal: true,
        resumeAvailable: true,
        lastUpdatedAt: '2026-04-28T12:01:00.000Z'
      },
      queueSnapshot: {
        refreshStatus: 'ready',
        playlistid: 1,
        activePosition: 7,
        items: [
          { position: 7, label: 'Sintel' },
          { position: 8, label: 'Big Buck Bunny' }
        ],
        limits: { start: 0, end: 2, total: 2 },
        lastRefreshReason: 'manual',
        lastUpdatedAt: '2026-04-28T12:00:00.000Z',
        lastError: null
      },
      queueDispatch
    });

    expect(getNowPlayingPanelText(target)).toContain('Playing locally in the browser.');
    expect(getButton(target, 'Resume on Kodi').disabled).toBe(false);
    expect(getButton(target, 'Play or pause').disabled).toBe(false);
    expect(getButton(target, 'Previous').disabled).toBe(true);
    expect(getSelect(target, '#now-playing-audio').disabled).toBe(true);

    getButton(target, 'Resume on Kodi').click();
    target.querySelector<HTMLButtonElement>('button[aria-label="Remove Big Buck Bunny"]')?.click();
    target.querySelector<HTMLButtonElement>('button[aria-label="Move Big Buck Bunny up"]')?.click();
    getButton(target, 'Clear queue').click();
    await tick();

    expect(playerDispatch.resumeOnKodi).toHaveBeenCalledTimes(1);
    expect(queueDispatch.removeAt).toHaveBeenCalledWith(8);
    expect(queueDispatch.swap).toHaveBeenCalledWith(7, 8);
    expect(queueDispatch.clear).toHaveBeenCalledTimes(1);
    expect(target.textContent).not.toContain('admin:p@ssword');
    expect(target.textContent).not.toContain('smb://');
    expect(target.textContent).not.toContain('private/Sintel.mkv');
  });

  it('disables all QueuePanel controls when command is running', () => {
    const queueSnapshot: QueueStoreSnapshot = {
      refreshStatus: 'ready',
      playlistid: 5,
      activePosition: null,
      items: [{ position: 0, label: 'Track X' }],
      limits: { start: 0, end: 1, total: 1 },
      lastRefreshReason: 'manual',
      lastUpdatedAt: '2026-04-28T00:00:00.000Z',
      lastError: null
    };
    const queueDispatch: QueuePanelDispatch = {
      snapshot: {
        commandStatus: 'running',
        lastCommand: 'clear',
        lastError: null,
        lastCompletedAt: null
      },
      removeAt: vi.fn(),
      clear: vi.fn(),
      swap: vi.fn()
    };

    const target = renderApp({ queueSnapshot, queueDispatch });
    const panel = target.querySelector('.queue-panel');
    const buttons = Array.from(panel?.querySelectorAll('button') ?? []);

    expect(buttons.length).toBeGreaterThan(0);
    for (const btn of buttons) {
      expect(btn.disabled).toBe(true);
    }
  });

  it('toggles the typed root theme and updates accessible button text', async () => {
    const target = renderApp();
    const button = target.querySelector('button[aria-label^="Switch to"]');

    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button?.textContent).toContain('Switch to light theme');

    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(button?.textContent).toContain('Switch to dark theme');

    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(button?.textContent).toContain('Switch to light theme');
  });
});
