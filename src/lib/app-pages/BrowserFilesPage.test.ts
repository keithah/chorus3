import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import BrowserFilesPage from './BrowserFilesPage.svelte';
import type {
  MediaDirectoryEntrySnapshot,
  MediaFileSourceSnapshot,
  MediaFilesStoreSnapshot
} from '$lib/stores';
import type {
  MediaFilesActionDispatch,
  MediaFilesPanelDispatch
} from '$components/MediaFilesPanel.svelte';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

function snapshot(overrides: Partial<MediaFilesStoreSnapshot> = {}): MediaFilesStoreSnapshot {
  const sources: MediaFileSourceSnapshot[] = [{ id: 'source:1', label: 'Albums' }];
  const entries: MediaDirectoryEntrySnapshot[] = [
    {
      id: 'entry:1',
      kind: 'directory',
      label: 'Bayani',
      capabilities: { canBrowse: true, canPlay: false, canQueue: false }
    }
  ];

  return {
    refreshStatus: 'ready',
    lastRefreshReason: 'init',
    lastUpdatedAt: '2026-05-07T10:00:00.000Z',
    media: 'music',
    sources,
    entries,
    breadcrumbs: [],
    isEmpty: false,
    lastError: null,
    ...overrides
  };
}

function dispatch(): MediaFilesPanelDispatch {
  return {
    refresh: vi.fn(),
    openSource: vi.fn(),
    openEntry: vi.fn(),
    openBreadcrumb: vi.fn()
  };
}

function actionDispatch(): MediaFilesActionDispatch {
  return {
    playFileItem: vi.fn(),
    queueFileItem: vi.fn(),
    downloadFileItem: vi.fn()
  };
}

function renderPage(
  options: {
    snapshot?: MediaFilesStoreSnapshot;
    dispatch?: MediaFilesPanelDispatch;
    buildOptions?: { routeMode?: 'path' | 'hash'; packageBasePath?: string };
  } = {}
): { dispatch: MediaFilesPanelDispatch } {
  const filesDispatch = options.dispatch ?? dispatch();
  mounted = mount(BrowserFilesPage, {
    target: document.body,
    props: {
      route: { kind: 'browser' },
      snapshot: options.snapshot ?? snapshot(),
      dispatch: filesDispatch,
      actionDispatch: actionDispatch(),
      buildOptions: options.buildOptions ?? { routeMode: 'path' }
    }
  });
  flushSync();
  return { dispatch: filesDispatch };
}

describe('BrowserFilesPage', () => {
  it('dispatches popstate after standalone path-mode browser navigation', async () => {
    const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => undefined);
    const popstate = vi.fn();
    window.addEventListener('popstate', popstate);
    const filesDispatch = dispatch();

    renderPage({ dispatch: filesDispatch, buildOptions: { routeMode: 'path' } });
    const sourceLink = document.querySelector<HTMLAnchorElement>(
      'nav[aria-label="Music browser sources"] a'
    );
    expect(sourceLink?.getAttribute('href')).toBe('/browser/music/source%3A1');

    sourceLink?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(filesDispatch.openSource).toHaveBeenCalledWith('source:1');
    expect(pushState).toHaveBeenCalledWith({}, '', '/browser/music/source%3A1');
    expect(popstate).toHaveBeenCalledTimes(1);

    window.removeEventListener('popstate', popstate);
  });

  it('keeps browser navigation hash-only in package mode', async () => {
    const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => undefined);
    renderPage({
      buildOptions: { routeMode: 'hash', packageBasePath: '/addons/webinterface.chorus3' }
    });
    const sourceLink = document.querySelector<HTMLAnchorElement>(
      'nav[aria-label="Music browser sources"] a'
    );
    expect(sourceLink?.getAttribute('href')).toBe(
      '/addons/webinterface.chorus3#browser/music/source%3A1'
    );

    sourceLink?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(pushState).toHaveBeenCalledWith(
      {},
      '',
      '/addons/webinterface.chorus3#browser/music/source%3A1'
    );
  });
});
