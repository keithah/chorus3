import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MediaFilesPanel, {
  type MediaFilesActionDispatch,
  type MediaFilesPanelDispatch
} from './MediaFilesPanel.svelte';
import type { MediaFilesStoreSnapshot } from '$lib/stores/mediaFiles.svelte';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

function createSnapshot(overrides: Partial<MediaFilesStoreSnapshot> = {}): MediaFilesStoreSnapshot {
  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'directory:entry:1',
    lastUpdatedAt: '2026-04-30T12:00:00.000Z',
    media: 'music',
    sources: [
      { id: 'source:1', label: 'NAS Music' },
      { id: 'source:2', label: 'Portable Drive' }
    ],
    breadcrumbs: [
      { id: 'source:1', label: 'NAS Music' },
      { id: 'entry:1', label: 'Albums' }
    ],
    entries: [
      {
        id: 'entry:2',
        kind: 'directory',
        label: 'Nina Simone',
        capabilities: { canBrowse: true, canPlay: false, canQueue: false }
      },
      {
        id: 'entry:3',
        kind: 'file',
        label: 'Sinnerman.flac',
        mediaKind: 'audio',
        extension: 'flac',
        capabilities: { canBrowse: false, canPlay: true, canQueue: true, canDownload: true }
      },
      {
        id: 'entry:4',
        kind: 'file',
        label: 'cover.jpg',
        mediaKind: 'unsupported',
        extension: 'jpg',
        capabilities: { canBrowse: false, canPlay: false, canQueue: false, canDownload: true }
      }
    ],
    isEmpty: false,
    lastError: null,
    ...overrides
  };
}

function createEmptySnapshot(
  overrides: Partial<MediaFilesStoreSnapshot> = {}
): MediaFilesStoreSnapshot {
  return createSnapshot({
    refreshStatus: 'idle',
    lastRefreshReason: 'init',
    lastUpdatedAt: null,
    sources: [],
    breadcrumbs: [],
    entries: [],
    isEmpty: true,
    lastError: null,
    ...overrides
  });
}

function createDispatch(overrides: Partial<MediaFilesPanelDispatch> = {}): MediaFilesPanelDispatch {
  return {
    refresh: vi.fn(),
    openSource: vi.fn(),
    openEntry: vi.fn(),
    openBreadcrumb: vi.fn(),
    ...overrides
  };
}

function createActionDispatch(
  overrides: Partial<MediaFilesActionDispatch> = {}
): MediaFilesActionDispatch {
  return {
    playFileItem: vi.fn(),
    queueFileItem: vi.fn(),
    downloadFileItem: vi.fn(),
    ...overrides
  };
}

function renderPanel(
  props: {
    snapshot?: MediaFilesStoreSnapshot;
    dispatch?: MediaFilesPanelDispatch;
    actionDispatch?: MediaFilesActionDispatch;
  } = {}
): { dispatch: MediaFilesPanelDispatch; actionDispatch: MediaFilesActionDispatch } {
  const dispatch = props.dispatch ?? createDispatch();
  const actionDispatch = props.actionDispatch ?? createActionDispatch();
  mounted = mount(MediaFilesPanel, {
    target: document.body,
    props: {
      snapshot: props.snapshot ?? createSnapshot(),
      dispatch,
      actionDispatch
    }
  });
  return { dispatch, actionDispatch };
}

function resetMounted(): void {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
}

function screenText(): string {
  return document.body.textContent ?? '';
}

function statusText(): string {
  return document.querySelector('[role="status"]')?.textContent ?? '';
}

function button(labelOrText: string): HTMLButtonElement {
  const match = Array.from(document.querySelectorAll('button')).find(
    (b) => b.getAttribute('aria-label') === labelOrText || b.textContent?.trim() === labelOrText
  );
  if (!(match instanceof HTMLButtonElement)) {
    const found = Array.from(document.querySelectorAll('button'))
      .map((b) => b.getAttribute('aria-label') ?? b.textContent?.trim())
      .join(', ');
    throw new Error(`Button not found: "${labelOrText}". Found: ${found}`);
  }
  return match;
}

function expectSecretSafe(value: string): void {
  expect(value).not.toContain('smb://');
  expect(value).not.toContain('http://');
  expect(value).not.toContain('https://');
  expect(value).not.toContain('admin:p@ssword');
  expect(value).not.toContain('Authorization');
  expect(value).not.toContain('Basic');
  expect(value).not.toContain('localStorage');
  expect(value).not.toContain('sessionStorage');
  expect(value).not.toContain('raw response body');
  expect(value).not.toContain('/mnt/media');
  expect(value).not.toContain('C:\\');
}

function actionPayload(id: string, label: string): { id: string; label: string; media: 'music' } {
  return { id, label, media: 'music' };
}

describe('MediaFilesPanel', () => {
  it('renders an accessible media files browser with sources, breadcrumbs, folders, and files', () => {
    renderPanel();

    const region = document.querySelector('section[aria-labelledby="media-files-title"]');
    expect(region).not.toBeNull();
    expect(document.querySelector('#media-files-title')?.textContent).toContain('Media Files');
    expect(document.querySelector('[aria-live="polite"]')?.getAttribute('role')).toBe('status');

    const text = screenText();
    expect(statusText()).toContain('Showing music files. 2 sources, 3 entries.');
    expect(text).toContain('Music sources');
    expect(text).toContain('NAS Music');
    expect(text).toContain('Portable Drive');
    expect(text).toContain('Breadcrumbs');
    expect(text).toContain('Albums');
    expect(text).toContain('Nina Simone');
    expect(text).toContain('Sinnerman.flac');
    expect(text).toContain('Audio file');
    expect(text).toContain('cover.jpg');
    expect(text).toContain('Unsupported file');
    expect(text).toContain('Last updated 2026-04-30T12:00:00.000Z.');
  });

  it('labels video browser file entries as playable video files', () => {
    renderPanel({
      snapshot: createSnapshot({
        media: 'video',
        entries: [
          {
            id: 'entry:1',
            kind: 'file',
            label: 'Big Buck Bunny.mkv',
            mediaKind: 'video',
            extension: 'mkv',
            capabilities: { canBrowse: false, canPlay: true, canQueue: true, canDownload: true }
          }
        ]
      })
    });

    const text = screenText();
    expect(text).toContain('Big Buck Bunny.mkv');
    expect(text).toContain('Video file');
    expect(button('Play file Big Buck Bunny.mkv')).toBeInstanceOf(HTMLButtonElement);
    expect(button('Queue file Big Buck Bunny.mkv')).toBeInstanceOf(HTMLButtonElement);
  });

  it('routes refresh, source, folder, breadcrumb, play, queue, and download clicks through injected dispatch only', async () => {
    const { dispatch, actionDispatch } = renderPanel();

    button('Refresh media file sources').click();
    await tick();
    button('Open source NAS Music').click();
    await tick();
    button('Open folder Nina Simone').click();
    await tick();
    button('Open breadcrumb Albums').click();
    await tick();
    button('Play file Sinnerman.flac').click();
    await tick();
    await tick();
    button('Queue file Sinnerman.flac').click();
    await tick();
    await tick();
    button('Download file Sinnerman.flac').click();
    await tick();
    await tick();
    button('Download file cover.jpg').click();
    await tick();

    expect(dispatch.refresh).toHaveBeenCalledTimes(1);
    expect(dispatch.openSource).toHaveBeenCalledWith('source:1');
    expect(dispatch.openEntry).toHaveBeenCalledWith('entry:2');
    expect(dispatch.openBreadcrumb).toHaveBeenCalledWith('entry:1');
    expect(actionDispatch.playFileItem).toHaveBeenCalledWith(
      actionPayload('entry:3', 'Sinnerman.flac')
    );
    expect(actionDispatch.queueFileItem).toHaveBeenCalledWith(
      actionPayload('entry:3', 'Sinnerman.flac')
    );
    expect(actionDispatch.downloadFileItem).toHaveBeenCalledWith(
      actionPayload('entry:3', 'Sinnerman.flac')
    );
    expect(actionDispatch.downloadFileItem).toHaveBeenCalledWith(
      actionPayload('entry:4', 'cover.jpg')
    );
  });

  it('renders loading, empty, and sanitized error lifecycle states', () => {
    renderPanel({ snapshot: createEmptySnapshot() });
    expect(statusText()).toContain('Load Kodi music file sources.');
    expect(screenText()).toContain('No music file sources loaded yet.');

    resetMounted();

    renderPanel({ snapshot: createEmptySnapshot({ refreshStatus: 'loading' }) });
    expect(statusText()).toContain('Loading music files…');
    expect(button('Refresh media file sources').disabled).toBe(true);

    resetMounted();

    renderPanel({
      snapshot: createEmptySnapshot({
        refreshStatus: 'ready',
        sources: [{ id: 'source:1', label: 'NAS Music' }],
        isEmpty: true
      })
    });
    expect(statusText()).toContain('No music files found.');
    expect(screenText()).toContain('This directory is empty.');

    resetMounted();

    renderPanel({
      snapshot: createSnapshot({
        refreshStatus: 'error',
        lastError: {
          source: 'http',
          code: 'http/auth',
          message:
            'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with localStorage raw response body smb://nas/private/song.flac'
        }
      })
    });
    expect(statusText()).toContain('credentials');
    expect(statusText()).toContain('browser storage');
    expect(screenText()).toContain('Sinnerman.flac');
    expectSecretSafe(screenText());
  });

  it('sanitizes hostile labels and uses safe fallbacks without rendering raw paths or credentials', () => {
    renderPanel({
      snapshot: createSnapshot({
        sources: [
          { id: 'source:1', label: 'smb://admin:p@ssword@nas/private' },
          { id: 'source:2', label: '' }
        ],
        breadcrumbs: [
          { id: 'source:1', label: 'http://admin:p@ssword@example.test/music' },
          { id: 'entry:1', label: '' }
        ],
        entries: [
          {
            id: 'entry:2',
            kind: 'directory',
            label: 'C:\\music\\secret',
            capabilities: { canBrowse: true, canPlay: false, canQueue: false }
          },
          {
            id: 'entry:3',
            kind: 'file',
            label: '/mnt/media/song.flac',
            mediaKind: 'audio',
            extension: 'flac',
            capabilities: { canBrowse: false, canPlay: true, canQueue: true, canDownload: true }
          },
          {
            id: 'entry:4',
            kind: 'file',
            label: 'Authorization: Basic abc123',
            mediaKind: 'unsupported',
            capabilities: { canBrowse: false, canPlay: false, canQueue: false, canDownload: true }
          }
        ]
      })
    });

    const text = screenText();
    expect(text).toContain('Source 1');
    expect(text).toContain('Source 2');
    expect(text).toContain('Location 1');
    expect(text).toContain('Location 2');
    expect(text).toContain('Folder 1');
    expect(text).toContain('Audio file 2');
    expect(text).toContain('credentials [redacted]');
    expectSecretSafe(text);
  });

  it('does not render enabled play or queue controls for unsupported or missing action IDs', () => {
    renderPanel({
      snapshot: createSnapshot({
        entries: [
          {
            id: 'entry:3',
            kind: 'file',
            label: 'Playable.flac',
            mediaKind: 'audio',
            capabilities: { canBrowse: false, canPlay: true, canQueue: true, canDownload: true }
          },
          {
            id: 'entry:4',
            kind: 'file',
            label: 'cover.jpg',
            mediaKind: 'unsupported',
            capabilities: { canBrowse: false, canPlay: false, canQueue: false, canDownload: true }
          },
          {
            id: '',
            kind: 'file',
            label: 'missing-id.flac',
            mediaKind: 'audio',
            capabilities: { canBrowse: false, canPlay: true, canQueue: true, canDownload: true }
          }
        ]
      })
    });

    expect(button('Play file Playable.flac').disabled).toBe(false);
    expect(button('Queue file Playable.flac').disabled).toBe(false);
    expect(button('Download file Playable.flac').disabled).toBe(false);
    expect(button('Download file cover.jpg').disabled).toBe(false);

    const labels = Array.from(document.querySelectorAll('button')).map(
      (node) => node.getAttribute('aria-label') ?? node.textContent ?? ''
    );
    expect(labels.some((label) => label === 'Play file cover.jpg')).toBe(false);
    expect(labels.some((label) => label === 'Queue file cover.jpg')).toBe(false);
    expect(labels.some((label) => label === 'Unsupported file cover.jpg')).toBe(false);
    expect(labels.some((label) => label === 'Play file missing-id.flac')).toBe(false);
    expect(labels.some((label) => label === 'Queue file missing-id.flac')).toBe(false);
  });

  it('disables same-target duplicate actions while pending and reports sanitized action rejection copy', async () => {
    let resolveAction: (() => void) | undefined;
    const actionDispatch = createActionDispatch({
      playFileItem: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveAction = resolve;
          })
      ),
      queueFileItem: vi.fn(async () => {
        throw new Error(
          'Authorization: Basic abc123 failed for http://admin:p@ssword@example.test/jsonrpc with sessionStorage raw response body and smb://nas/private/song.flac'
        );
      }),
      downloadFileItem: vi.fn(async () => {
        throw new Error(
          'Download failed for Authorization: Basic abc123 and smb://nas/private/cover.jpg'
        );
      })
    });

    renderPanel({ actionDispatch });

    const playFile = button('Play file Sinnerman.flac');
    const queueFile = button('Queue file Sinnerman.flac');
    playFile.click();
    await tick();

    expect(playFile.disabled).toBe(true);
    expect(queueFile.disabled).toBe(true);
    expect(statusText()).toContain('Playing file Sinnerman.flac…');
    playFile.click();
    expect(actionDispatch.playFileItem).toHaveBeenCalledTimes(1);

    resolveAction?.();
    await tick();
    await tick();

    expect(playFile.disabled).toBe(false);
    expect(statusText()).toContain('Played file Sinnerman.flac.');

    queueFile.click();
    await tick();
    await tick();

    const text = screenText();
    expect(statusText()).toContain('Could not queue file Sinnerman.flac.');
    expect(text).toContain('credentials [redacted]');
    expect(text).toContain('browser storage');
    expect(text).toContain('response body [redacted]');
    expect(queueFile.disabled).toBe(false);
    expectSecretSafe(text);

    button('Download file Sinnerman.flac').click();
    await tick();
    await tick();

    expect(statusText()).toContain('Could not download file Sinnerman.flac.');
    expect(statusText()).toContain('credentials [redacted]');
    expectSecretSafe(screenText());
  });

  it('recovers browse controls after rejected refresh and open callbacks with sanitized errors', async () => {
    const dispatch = createDispatch({
      refresh: vi.fn(async () => {
        throw new Error(
          'Refresh failed at http://admin:p@ssword@example.test/jsonrpc with localStorage raw response body'
        );
      }),
      openEntry: vi.fn(async () => {
        throw new Error('Open failed for smb://nas/private with Authorization: Basic abc123');
      })
    });

    renderPanel({ dispatch });

    button('Refresh media file sources').click();
    await tick();
    await tick();

    expect(statusText()).toContain('Could not refresh media files.');
    expect(statusText()).toContain('browser storage');
    expect(button('Refresh media file sources').disabled).toBe(false);
    expectSecretSafe(screenText());

    button('Open folder Nina Simone').click();
    await tick();
    await tick();

    expect(statusText()).toContain('Could not open folder Nina Simone.');
    expect(statusText()).toContain('credentials [redacted]');
    expect(button('Open folder Nina Simone').disabled).toBe(false);
    expectSecretSafe(screenText());
  });
});
