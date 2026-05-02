import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AddonDetailShell, { type AddonDetailDispatch } from './AddonDetailShell.svelte';
import { createTranslationContext, type Locale } from '$lib/i18n';
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

const ALPHA_DETAIL: AddonSnapshot = {
  addonid: 'plugin.video.alpha',
  name: 'Alpha Video',
  version: '1.0.0',
  summary: 'Stream Alpha safely',
  description: 'Detailed Alpha description',
  author: 'Team Alpha',
  enabled: true,
  installed: true,
  type: 'xbmc.python.pluginsource',
  broken: false,
  dependencyCount: 2,
  extrainfoCount: 1
};

const UNSAFE_DETAIL: AddonSnapshot = {
  addonid: 'plugin.video.unsafe',
  name: 'Authorization: Basic CHORUS_SENTINEL_SECRET',
  version: 'http://example.test/1.0',
  summary: 'raw response body in localStorage at /mnt/media/movie.mkv',
  description: 'smb://nas/private and C:\\secret\\addon.zip with admin:p@ssword',
  author: 'https://user:pass@example.test/me',
  enabled: null,
  installed: true,
  type: 'special://home/addons/plugin.video.unsafe',
  broken: 'password failed at http://admin:p@ssword@example.test/raw body',
  dependencyCount: 0,
  extrainfoCount: 0
};

function createSnapshot(overrides: Partial<AddonsStoreSnapshot> = {}): AddonsStoreSnapshot {
  const detail = overrides.detail === undefined ? ALPHA_DETAIL : overrides.detail;
  const addons = overrides.addons ?? (detail ? [detail] : []);

  return {
    loadStatus: 'success',
    detailStatus: detail ? 'success' : 'idle',
    writeStatus: 'idle',
    addons,
    selectedAddonId: detail?.addonid ?? 'plugin.video.alpha',
    detail,
    searchQuery: '',
    groupBy: 'none',
    visibleAddons: addons,
    groups: [],
    pendingToggle: null,
    lastWrite: null,
    rollbackEnabled: null,
    refreshAfterWrite: null,
    writeCounts: { attempted: 0, succeeded: 0, failed: 0 },
    lastError: null,
    ...overrides
  };
}

function createDispatch(overrides: Partial<AddonDetailDispatch> = {}): AddonDetailDispatch {
  return {
    load: vi.fn(),
    retry: vi.fn(),
    setAddonEnabled: vi.fn(),
    back: vi.fn(),
    ...overrides
  };
}

function renderDetail(
  props: { snapshot?: AddonsStoreSnapshot; dispatch?: AddonDetailDispatch; locale?: Locale } = {}
): AddonDetailDispatch {
  const dispatch = props.dispatch ?? createDispatch();
  mounted = mount(AddonDetailShell, {
    target: document.body,
    props: {
      snapshot: props.snapshot ?? createSnapshot(),
      dispatch,
      i18n: createTranslationContext(props.locale ?? 'en')
    }
  });
  return dispatch;
}

function screenText(): string {
  return document.body.textContent ?? '';
}

function button(labelOrText: string): HTMLButtonElement {
  const match = Array.from(document.querySelectorAll('button')).find(
    (candidate) =>
      candidate.getAttribute('aria-label') === labelOrText ||
      candidate.textContent?.trim() === labelOrText
  );
  if (!(match instanceof HTMLButtonElement)) throw new Error(`Button not found: ${labelOrText}`);
  return match;
}

function expectNoForbiddenText(value: string): void {
  expect(value).not.toMatch(
    /https?:\/\/|smb:\/\/|special:\/\/|admin:p@ssword|user:pass|Authorization|Basic|raw response body|localStorage|sessionStorage|CHORUS_SENTINEL_SECRET|password|\/mnt\/media|C:\\|credentials in/i
  );
}

describe('AddonDetailShell', () => {
  it('renders loading, idle/not-found, success, and error detail states with safe retry affordances', async () => {
    renderDetail({
      snapshot: createSnapshot({
        detailStatus: 'loading',
        detail: null,
        selectedAddonId: 'plugin.video.alpha'
      })
    });
    expect(screenText()).toContain('Loading add-on detail from Kodi.');
    expect(button('Reload detail').disabled).toBe(true);

    if (mounted) unmount(mounted);
    mounted = null;
    renderDetail({
      snapshot: createSnapshot({
        detailStatus: 'idle',
        detail: null,
        selectedAddonId: 'plugin.video.alpha'
      })
    });
    expect(screenText()).toContain('No add-on detail has been loaded.');

    if (mounted) unmount(mounted);
    mounted = null;
    const dispatch = renderDetail({
      snapshot: createSnapshot({
        detailStatus: 'error',
        detail: null,
        lastError: {
          source: 'addons',
          code: 'addons/malformed-response',
          message: 'Kodi returned a malformed add-ons response.'
        }
      })
    });
    expect(screenText()).toContain('Add-on detail could not be loaded.');
    expect(screenText()).toContain('Kodi returned a malformed add-ons response.');
    button('Retry add-on detail load').click();
    await tick();
    expect(dispatch.retry).toHaveBeenCalledTimes(1);

    if (mounted) unmount(mounted);
    mounted = null;
    renderDetail();
    expect(screenText()).toContain('Alpha Video');
    expect(screenText()).toContain('plugin.video.alpha');
    expect(screenText()).toContain('Version 1.0.0');
    expect(screenText()).toContain('2 dependencies');
  });

  it('renders representative add-on detail and confirmation copy in German', async () => {
    renderDetail({ locale: 'de' });

    expect(screenText()).toContain('Add-on-Detail geladen.');
    expect(screenText()).toContain('2 Abhängigkeiten');
    expect(screenText()).toContain('Aktiviert');
    button('Add-on deaktivieren').click();
    await tick();

    expect(screenText()).toMatch(/Deaktivieren von\s+Alpha Video bestätigen\?/);
    button('Deaktivieren abbrechen').click();
    await tick();
    expect(screenText()).not.toMatch(/Deaktivieren von\s+Alpha Video bestätigen\?/);
  });

  it('requires two-step confirmation before dispatching enable or disable writes', async () => {
    const dispatch = renderDetail();

    button('Disable add-on').click();
    await tick();

    expect(dispatch.setAddonEnabled).not.toHaveBeenCalled();
    expect(screenText()).toMatch(/Confirm disable\s+Alpha Video\?/);

    button('Cancel disable').click();
    await tick();
    expect(dispatch.setAddonEnabled).not.toHaveBeenCalled();
    expect(screenText()).not.toMatch(/Confirm disable\s+Alpha Video\?/);

    button('Disable add-on').click();
    await tick();
    button('Confirm disable').click();
    await tick();

    expect(dispatch.setAddonEnabled).toHaveBeenCalledTimes(1);
    expect(dispatch.setAddonEnabled).toHaveBeenCalledWith('plugin.video.alpha', false);
  });

  it('labels enable writes for disabled add-ons and disables controls during pending detail or write work', async () => {
    const disabledDetail = { ...ALPHA_DETAIL, enabled: false };
    const dispatch = renderDetail({ snapshot: createSnapshot({ detail: disabledDetail }) });

    expect(screenText()).toContain('Disabled');
    button('Enable add-on').click();
    await tick();
    button('Confirm enable').click();
    await tick();
    expect(dispatch.setAddonEnabled).toHaveBeenCalledWith('plugin.video.alpha', true);

    if (mounted) unmount(mounted);
    mounted = null;
    renderDetail({
      snapshot: createSnapshot({
        writeStatus: 'pending',
        pendingToggle: {
          addonid: 'plugin.video.alpha',
          enabled: false,
          requestedAt: '2026-05-01T21:00:00.000Z'
        },
        lastWrite: {
          addonid: 'plugin.video.alpha',
          enabled: false,
          status: 'pending',
          at: '2026-05-01T21:00:00.000Z'
        },
        writeCounts: { attempted: 1, succeeded: 0, failed: 0 }
      })
    });

    expect(button('Disable add-on').disabled).toBe(true);
    expect(screenText()).toContain('Disabling plugin.video.alpha is pending.');
    expect(screenText()).toContain('1 attempted, 0 succeeded, 0 failed');
  });

  it('renders write success, rejected rollback, and refresh-after-write warning diagnostics distinctly', () => {
    renderDetail({
      snapshot: createSnapshot({
        writeStatus: 'success',
        lastWrite: {
          addonid: 'plugin.video.alpha',
          enabled: false,
          status: 'success',
          at: '2026-05-01T21:00:00.000Z'
        },
        refreshAfterWrite: {
          addonid: 'plugin.video.alpha',
          requestedAt: '2026-05-01T21:00:00.000Z',
          refreshed: true,
          warning: null
        },
        writeCounts: { attempted: 1, succeeded: 1, failed: 0 }
      })
    });
    expect(screenText()).toContain('Add-on write succeeded.');
    expect(screenText()).toContain('Refresh after write: refreshed.');

    if (mounted) unmount(mounted);
    mounted = null;
    renderDetail({
      snapshot: createSnapshot({
        writeStatus: 'error',
        lastError: {
          source: 'write',
          code: 'write/failed',
          message: 'Kodi rejected the add-on write.'
        },
        lastWrite: {
          addonid: 'plugin.video.alpha',
          enabled: false,
          status: 'error',
          at: '2026-05-01T21:00:00.000Z'
        },
        rollbackEnabled: true,
        writeCounts: { attempted: 1, succeeded: 0, failed: 1 }
      })
    });
    expect(screenText()).toContain('Add-on write failed.');
    expect(screenText()).toContain('Rolled back to enabled.');
    expect(screenText()).toContain('Kodi rejected the add-on write.');

    if (mounted) unmount(mounted);
    mounted = null;
    renderDetail({
      snapshot: createSnapshot({
        writeStatus: 'success',
        lastError: {
          source: 'refresh',
          code: 'refresh/failed',
          message: 'Add-on write succeeded, but refreshed add-on state is unavailable.'
        },
        lastWrite: {
          addonid: 'plugin.video.alpha',
          enabled: false,
          status: 'success',
          at: '2026-05-01T21:00:00.000Z'
        },
        refreshAfterWrite: {
          addonid: 'plugin.video.alpha',
          requestedAt: '2026-05-01T21:00:00.000Z',
          refreshed: false,
          warning: 'Add-on write succeeded, but refreshed add-on state is unavailable.'
        },
        writeCounts: { attempted: 1, succeeded: 1, failed: 0 }
      })
    });
    expect(screenText()).toContain('Add-on write succeeded.');
    expect(screenText()).toContain('Refresh after write warning');
    expect(screenText()).toContain('refreshed add-on state is unavailable');
  });

  it('renders missing optional fields, broken state, and unsafe metadata with bounded safe copy', () => {
    renderDetail({
      snapshot: createSnapshot({
        detail: {
          ...ALPHA_DETAIL,
          name: '',
          version: null,
          summary: null,
          description: null,
          author: null,
          type: '',
          enabled: null,
          broken: 'Missing dependency at /home/kodi/private.zip',
          dependencyCount: 0,
          extrainfoCount: 0
        }
      })
    });
    expect(screenText()).toContain('Untitled add-on');
    expect(screenText()).toContain('Version unavailable');
    expect(screenText()).toContain('Summary unavailable');
    expect(screenText()).toContain('Enablement unknown');
    expect(screenText()).toContain('Broken: Missing dependency at [redacted-path]');
    expect(button('Toggle unavailable').disabled).toBe(true);

    if (mounted) unmount(mounted);
    mounted = null;
    renderDetail({ snapshot: createSnapshot({ detail: UNSAFE_DETAIL }) });
    expect(screenText()).toContain('[redacted');
    expectNoForbiddenText(screenText());
  });

  it('exposes status and write diagnostics through accessible live regions', () => {
    renderDetail({
      snapshot: createSnapshot({
        writeStatus: 'pending',
        pendingToggle: {
          addonid: 'plugin.video.alpha',
          enabled: false,
          requestedAt: '2026-05-01T21:00:00.000Z'
        }
      })
    });

    const liveRegions = Array.from(document.querySelectorAll('[aria-live="polite"]'));
    expect(liveRegions.length).toBeGreaterThanOrEqual(2);
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      'Add-on detail loaded.'
    );
    expect(screenText()).toContain('Saving add-on change.');
  });
});
