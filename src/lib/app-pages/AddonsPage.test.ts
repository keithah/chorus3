import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AddonsPage from './AddonsPage.svelte';
import { KODI_WEBINTERFACE_BASE_PATH, type BuildAppRouteOptions } from '$lib/app/appRouter';
import type { PrimaryRoute } from '$lib/app/primaryRoutes';
import type { AddonDetailDispatch } from '$lib/components/AddonDetailShell.svelte';
import type { AddonsPanelDispatch } from '$lib/components/AddonsPanel.svelte';
import { createTranslationContext } from '$lib/i18n';
import type { AddonSnapshot, AddonsStoreSnapshot } from '$lib/stores/addonsStore.svelte';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

const VIDEO_ADDON: AddonSnapshot = {
  addonid: 'plugin.video.safe-demo',
  name: 'Safe Video Demo',
  version: '1.0.0',
  summary: 'Safe video fixture.',
  description: 'A deterministic video add-on.',
  author: 'Fixture Team',
  enabled: false,
  installed: true,
  type: 'xbmc.addon.video',
  provides: ['video'],
  providesDefault: 'video',
  broken: null,
  dependencyCount: 0,
  extrainfoCount: 0
};

const AUDIO_ADDON: AddonSnapshot = {
  ...VIDEO_ADDON,
  addonid: 'plugin.audio.safe-radio',
  name: 'Safe Radio',
  summary: 'Safe audio fixture.',
  type: 'XBMC.ADDON.AUDIO',
  provides: ['audio'],
  providesDefault: 'audio',
  enabled: true
};

const EXECUTABLE_ADDON: AddonSnapshot = {
  ...VIDEO_ADDON,
  addonid: 'script.safe-runner',
  name: 'Safe Runner',
  summary: 'Safe executable fixture.',
  type: 'xbmc.addon.executable',
  provides: ['executable'],
  providesDefault: 'executable',
  enabled: true
};

const SYSTEM_AUDIO_ENCODER: AddonSnapshot = {
  ...VIDEO_ADDON,
  addonid: 'audioencoder.safe-aac',
  name: 'Safe AAC Encoder',
  summary: 'System encoder, not a browsable Chorus2 add-on.',
  type: 'xbmc.addon.audioencoder',
  provides: [],
  enabled: true
};

function createSnapshot(overrides: Partial<AddonsStoreSnapshot> = {}): AddonsStoreSnapshot {
  const addons = overrides.addons ?? [VIDEO_ADDON, AUDIO_ADDON, EXECUTABLE_ADDON];
  const visibleAddons = overrides.visibleAddons ?? addons;

  return {
    loadStatus: 'success',
    detailStatus: 'success',
    writeStatus: 'error',
    addons,
    selectedAddonId: 'plugin.video.safe-demo',
    detail: VIDEO_ADDON,
    searchQuery: '',
    groupBy: 'none',
    visibleAddons,
    groups: [],
    pendingToggle: {
      addonid: 'plugin.video.safe-demo',
      enabled: true,
      requestedAt: '2026-05-01T21:00:00.000Z'
    },
    lastWrite: {
      addonid: 'plugin.video.safe-demo',
      enabled: true,
      status: 'error',
      at: '2026-05-01T21:00:00.000Z'
    },
    rollbackEnabled: false,
    refreshAfterWrite: {
      addonid: 'plugin.video.safe-demo',
      requestedAt: '2026-05-01T21:00:00.000Z',
      refreshed: false,
      warning: 'Add-on write succeeded, but refreshed add-on state is unavailable.'
    },
    writeCounts: { attempted: 2, succeeded: 1, failed: 1 },
    lastError: {
      source: 'write',
      code: 'fixture.addon-write-rejected',
      message: 'Safe add-on write rejection was rolled back.'
    },
    ...overrides
  };
}

function createAddonsDispatch(overrides: Partial<AddonsPanelDispatch> = {}): AddonsPanelDispatch {
  return {
    load: vi.fn(),
    retry: vi.fn(),
    setSearchQuery: vi.fn(),
    setGroupBy: vi.fn(),
    setAddonEnabled: vi.fn(),
    executeAddon: vi.fn(),
    ...overrides
  };
}

function createAddonDetailDispatch(
  overrides: Partial<AddonDetailDispatch> = {}
): AddonDetailDispatch {
  return {
    load: vi.fn(),
    retry: vi.fn(),
    setAddonEnabled: vi.fn(),
    back: vi.fn(),
    ...overrides
  };
}

function renderPage(
  route: PrimaryRoute,
  props: {
    snapshot?: AddonsStoreSnapshot;
    dispatch?: AddonsPanelDispatch;
    addonDetailDispatch?: AddonDetailDispatch;
    packageBasePath?: string;
    buildOptions?: BuildAppRouteOptions;
  } = {}
): { dispatch: AddonsPanelDispatch; addonDetailDispatch: AddonDetailDispatch } {
  const dispatch = props.dispatch ?? createAddonsDispatch();
  const addonDetailDispatch = props.addonDetailDispatch ?? createAddonDetailDispatch();
  mounted = mount(AddonsPage, {
    target: document.body,
    props: {
      route,
      snapshot: props.snapshot ?? createSnapshot(),
      dispatch,
      addonDetailDispatch,
      i18n: createTranslationContext('en'),
      packageBasePath: props.packageBasePath ?? '',
      buildOptions: props.buildOptions ?? {}
    }
  });
  return { dispatch, addonDetailDispatch };
}

function text(): string {
  return document.body.textContent ?? '';
}

function button(label: string): HTMLButtonElement {
  const match = Array.from(document.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.trim() === label
  );
  if (!(match instanceof HTMLButtonElement)) throw new Error(`Button not found: ${label}`);
  return match;
}

describe('AddonsPage', () => {
  it.each([
    [
      { kind: 'addonsAll' } as const,
      'Add-on catalog',
      ['Safe Video Demo', 'Safe Radio', 'Safe Runner']
    ],
    [{ kind: 'addonsVideo' } as const, 'Video add-ons', ['Safe Video Demo']],
    [{ kind: 'addonsAudio' } as const, 'Audio add-ons', ['Safe Radio']],
    [{ kind: 'addonsExecutable' } as const, 'Executable add-ons', ['Safe Runner']]
  ])('renders route-specific category filtering for %s', (route, heading, expectedNames) => {
    const { dispatch } = renderPage(route);

    expect(document.querySelector('#addons-page-title')?.textContent).toBe(heading);
    for (const name of expectedNames) expect(text()).toContain(name);
    for (const name of ['Safe Video Demo', 'Safe Radio', 'Safe Runner']) {
      if (!expectedNames.includes(name)) expect(text()).not.toContain(name);
    }
    expect(dispatch.setSearchQuery).not.toHaveBeenCalled();
  });

  it('shows all installed add-ons on the full catalog while category routes stay content-filtered', () => {
    renderPage(
      { kind: 'addonsAll' },
      {
        snapshot: createSnapshot({
          addons: [AUDIO_ADDON, SYSTEM_AUDIO_ENCODER],
          visibleAddons: [AUDIO_ADDON, SYSTEM_AUDIO_ENCODER]
        })
      }
    );

    expect(text()).toContain('Safe Radio');
    expect(text()).toContain('Safe AAC Encoder');
    expect(text()).toContain('2 of 2 add-ons');

    unmount(mounted as MountedComponent);
    mounted = null;
    document.body.innerHTML = '';

    renderPage(
      { kind: 'addonsAudio' },
      {
        snapshot: createSnapshot({
          addons: [AUDIO_ADDON, SYSTEM_AUDIO_ENCODER],
          visibleAddons: [AUDIO_ADDON, SYSTEM_AUDIO_ENCODER]
        })
      }
    );

    expect(text()).toContain('Safe Radio');
    expect(text()).not.toContain('Safe AAC Encoder');
    expect(text()).toContain('1 of 1 add-ons');
  });

  it('builds package-mounted detail links as non-hash paths under the Kodi webinterface base', () => {
    renderPage(
      { kind: 'addonsVideo' },
      {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH
      }
    );

    expect(document.querySelector('.addons-card-detail')?.getAttribute('href')).toBe(
      '/addons/webinterface.chorus3/addons/plugin.video.safe-demo'
    );
  });

  it('builds standalone add-on card links in path mode', () => {
    renderPage({ kind: 'addonsVideo' });

    expect(document.querySelector('.addons-card-detail')?.getAttribute('href')).toBe(
      '/addons/plugin.video.safe-demo'
    );
  });

  it('renders add-on execute routes as real Chorus2 action status surfaces', async () => {
    const dispatch = createAddonsDispatch();
    renderPage(
      { kind: 'addonExecute', addonid: 'script.safe-runner' },
      {
        dispatch,
        snapshot: createSnapshot({
          writeStatus: 'pending',
          selectedAddonId: 'script.safe-runner',
          detail: EXECUTABLE_ADDON
        })
      }
    );
    await tick();

    expect(document.querySelector('#addons-page-title')?.textContent).toBe('Execute add-on');
    expect(text()).toContain('Safe Runner');
    expect(text()).toContain('Starting add-on.');
    expect(text()).not.toContain('Detailed parity for this route is deferred');
    expect(document.querySelector('.deferred-primary-page')).toBeNull();

    button('Open executable add-ons').click();
    await tick();

    expect(dispatch.executeAddon).not.toHaveBeenCalled();
  });

  it('uses path links in standalone mode and dispatches route-state updates when switching tabs', async () => {
    const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => undefined);
    const popstate = vi.fn();
    window.addEventListener('popstate', popstate);

    renderPage({ kind: 'addonsAll' });

    const videoLink = Array.from(document.querySelectorAll<HTMLAnchorElement>('a')).find(
      (link) => link.textContent?.trim() === 'Video add-ons'
    );

    expect(videoLink?.getAttribute('href')).toBe('/addons/video');
    videoLink?.click();
    await tick();

    expect(pushState).toHaveBeenCalledWith({}, '', '/addons/video');
    expect(popstate).toHaveBeenCalledTimes(1);

    window.removeEventListener('popstate', popstate);
    pushState.mockRestore();
  });

  it('uses hash links for package-mounted add-on tabs', () => {
    renderPage(
      { kind: 'addonsAll' },
      {
        packageBasePath: KODI_WEBINTERFACE_BASE_PATH,
        buildOptions: { packageBasePath: KODI_WEBINTERFACE_BASE_PATH, routeMode: 'hash' }
      }
    );

    const audioLink = Array.from(document.querySelectorAll<HTMLAnchorElement>('a')).find(
      (link) => link.textContent?.trim() === 'Audio add-ons'
    );

    expect(audioLink?.getAttribute('href')).toBe('/addons/webinterface.chorus3#addons/audio');
  });

  it('renders primary add-on detail through AddonDetailShell with existing write diagnostics', async () => {
    const { addonDetailDispatch } = renderPage({
      kind: 'addonDetail',
      addonid: 'plugin.video.safe-demo'
    });

    expect(document.querySelector('.addon-detail')).not.toBeNull();
    expect(document.querySelector('#addons-page-title')?.textContent).toBe('Add-on details');
    expect(text()).toContain('Safe Video Demo');
    expect(text()).toContain('Add-on write failed.');
    expect(text()).toContain('fixture.addon-write-rejected');
    expect(text()).toContain('Safe add-on write rejection was rolled back.');
    expect(text()).toContain('Enabling plugin.video.safe-demo is pending.');
    expect(text()).toContain('Rolled back to disabled.');
    expect(text()).toContain('Refresh after write warning');

    button('Enable add-on').click();
    await tick();
    button('Confirm enable').click();
    await tick();

    expect(addonDetailDispatch.setAddonEnabled).toHaveBeenCalledWith(
      'plugin.video.safe-demo',
      true
    );
  });
});
