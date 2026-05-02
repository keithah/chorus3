import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AddonsPanel, { type AddonsPanelDispatch } from './AddonsPanel.svelte';
import { createTranslationContext, type Locale } from '$lib/i18n';
import type {
  AddonSnapshot,
  AddonsGroupBy,
  AddonsGroupSnapshot,
  AddonsStoreSnapshot
} from '$lib/stores/addonsStore.svelte';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

const ALPHA_ADDON: AddonSnapshot = {
  addonid: 'plugin.video.alpha',
  name: 'Alpha Video',
  version: '1.0.0',
  summary: 'Stream Alpha safely',
  description: 'A video plugin',
  author: 'Team Alpha',
  enabled: true,
  installed: true,
  type: 'xbmc.python.pluginsource',
  broken: false,
  dependencyCount: 1,
  extrainfoCount: 1
};

const BETA_ADDON: AddonSnapshot = {
  addonid: 'service.beta',
  name: 'Beta Service',
  version: '2.0.0',
  summary: 'Background helper',
  description: null,
  author: 'Team Beta',
  enabled: false,
  installed: true,
  type: 'xbmc.service',
  broken: 'Missing dependency',
  dependencyCount: 0,
  extrainfoCount: 0
};

const UNSAFE_ADDON: AddonSnapshot = {
  addonid: 'http://admin:p@ssword@example.test/addon',
  name: 'Authorization: Basic CHORUS_SENTINEL_SECRET',
  version: null,
  summary: 'raw response body in localStorage at /mnt/media/movie.mkv',
  description: null,
  author: null,
  enabled: null,
  installed: true,
  type: 'smb://nas/private',
  broken: 'password failed at C:\\secret\\addon.zip',
  dependencyCount: 0,
  extrainfoCount: 0
};

function createSnapshot(overrides: Partial<AddonsStoreSnapshot> = {}): AddonsStoreSnapshot {
  const addons = overrides.addons ?? [ALPHA_ADDON, BETA_ADDON];
  const visibleAddons = overrides.visibleAddons ?? addons;
  const groupBy = overrides.groupBy ?? 'none';
  const groups = overrides.groups ?? createGroups(visibleAddons, groupBy);

  return {
    loadStatus: 'success',
    detailStatus: 'idle',
    writeStatus: 'idle',
    addons,
    selectedAddonId: null,
    detail: null,
    searchQuery: '',
    groupBy,
    visibleAddons,
    groups,
    pendingToggle: null,
    lastWrite: null,
    rollbackEnabled: null,
    refreshAfterWrite: null,
    writeCounts: { attempted: 0, succeeded: 0, failed: 0 },
    lastError: null,
    ...overrides
  };
}

function createGroups(
  addons: readonly AddonSnapshot[],
  groupBy: AddonsGroupBy
): AddonsGroupSnapshot[] {
  if (groupBy === 'none') return [];
  if (groupBy === 'enabled') {
    return [
      {
        key: 'enabled',
        label: 'Enabled',
        addons: addons.filter((addon) => addon.enabled === true)
      },
      {
        key: 'disabled',
        label: 'Disabled',
        addons: addons.filter((addon) => addon.enabled === false)
      },
      { key: 'unknown', label: 'Unknown', addons: addons.filter((addon) => addon.enabled === null) }
    ].filter((group) => group.addons.length > 0);
  }

  return [...new Map(addons.map((addon) => [addon.type, addon.type])).keys()].map((type) => ({
    key: type,
    label: type,
    addons: addons.filter((addon) => addon.type === type)
  }));
}

function createDispatch(overrides: Partial<AddonsPanelDispatch> = {}): AddonsPanelDispatch {
  return {
    load: vi.fn(),
    retry: vi.fn(),
    setSearchQuery: vi.fn(),
    setGroupBy: vi.fn(),
    ...overrides
  };
}

function renderPanel(
  props: { snapshot?: AddonsStoreSnapshot; dispatch?: AddonsPanelDispatch; locale?: Locale } = {}
): AddonsPanelDispatch {
  const dispatch = props.dispatch ?? createDispatch();
  mounted = mount(AddonsPanel, {
    target: document.body,
    props: {
      snapshot: props.snapshot ?? createSnapshot(),
      dispatch,
      i18n: createTranslationContext(props.locale ?? 'en')
    }
  });
  return dispatch;
}

function unmountPanel(): void {
  if (!mounted) return;
  unmount(mounted);
  mounted = null;
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

function searchInput(): HTMLInputElement {
  const input = document.querySelector('input[name="addon-search"]');
  if (!(input instanceof HTMLInputElement)) throw new Error('Search input not found.');
  return input;
}

function groupSelect(): HTMLSelectElement {
  const select = document.querySelector('select[name="addon-group-by"]');
  if (!(select instanceof HTMLSelectElement)) throw new Error('Group select not found.');
  return select;
}

function change(control: HTMLInputElement | HTMLSelectElement): void {
  control.dispatchEvent(new Event('change', { bubbles: true }));
}

function input(control: HTMLInputElement): void {
  control.dispatchEvent(new Event('input', { bubbles: true }));
}

function expectNoForbiddenText(value: string): void {
  expect(value).not.toMatch(
    /https?:\/\/|smb:\/\/|special:\/\/|admin:p@ssword|Authorization|Basic|raw response body|localStorage|sessionStorage|CHORUS_SENTINEL_SECRET|password|\/mnt\/media|C:\\|user:pass/i
  );
}

describe('AddonsPanel', () => {
  it('renders an accessible add-ons browser with status, search, grouping controls, cards, and safe links', () => {
    renderPanel({ snapshot: createSnapshot({ groupBy: 'type' }) });

    expect(document.querySelector('section[aria-labelledby="addons-panel-title"]')).not.toBeNull();
    expect(document.querySelector('#addons-panel-title')?.textContent).toContain('Kodi Add-ons');
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Add-ons loaded.');
    expect(document.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(searchInput().getAttribute('aria-label')).toBe('Search installed add-ons');
    expect(groupSelect().getAttribute('aria-label')).toBe('Group add-ons');
    expect(screenText()).toContain('xbmc.python.pluginsource');
    expect(screenText()).toContain('xbmc.service');
    expect(screenText()).toContain('Alpha Video');
    expect(screenText()).toContain('plugin.video.alpha');
    expect(screenText()).toContain('Version 1.0.0');
    expect(screenText()).toContain('Enabled');
    expect(screenText()).toContain('Broken');
    expect(screenText()).toContain('Missing dependency');

    const alphaLink = document.querySelector('a[href="/addons/plugin.video.alpha"]');
    expect(alphaLink?.textContent).toContain('Open Alpha Video details');
    expectNoForbiddenText(screenText());
  });

  it('renders representative add-ons browser copy in German', () => {
    renderPanel({ snapshot: createSnapshot({ groupBy: 'enabled' }), locale: 'de' });

    expect(document.querySelector('#addons-panel-title')?.textContent).toContain('Kodi-Add-ons');
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Add-ons geladen.');
    expect(searchInput().getAttribute('aria-label')).toBe('Installierte Add-ons suchen');
    expect(groupSelect().getAttribute('aria-label')).toBe('Add-ons gruppieren');
    expect(screenText()).toContain('2 von 2 Add-ons');
    expect(screenText()).toContain('Gruppiert nach Aktivierungsstatus');
    expect(screenText()).toContain('Öffne Details für Alpha Video');
    expect(screenText()).toContain('Aktiviert');
    expect(screenText()).toContain('Defekt: Missing dependency');
  });

  it('renders loading, no-host, malformed, and generic error copy with retry affordances', async () => {
    renderPanel({ snapshot: createSnapshot({ loadStatus: 'loading' }) });
    expect(screenText()).toContain('Loading add-ons from Kodi.');
    expect(button('Reload add-ons').disabled).toBe(true);

    unmountPanel();
    const dispatch = renderPanel({
      snapshot: createSnapshot({
        loadStatus: 'error',
        lastError: {
          source: 'config',
          code: 'config/no-active-host',
          message: 'Choose an active Kodi host before loading add-ons.'
        }
      })
    });
    expect(screenText()).toContain('Choose an active Kodi host before loading add-ons.');
    button('Retry add-ons load').click();
    await tick();
    expect(dispatch.retry).toHaveBeenCalledTimes(1);

    unmountPanel();
    renderPanel({
      snapshot: createSnapshot({
        loadStatus: 'error',
        lastError: {
          source: 'addons',
          code: 'addons/malformed-response',
          message: 'Kodi returned a malformed add-ons response.'
        }
      })
    });
    expect(screenText()).toContain('Kodi returned a malformed add-ons response.');

    unmountPanel();
    renderPanel({
      snapshot: createSnapshot({
        loadStatus: 'error',
        lastError: {
          source: 'http',
          code: 'timeout',
          message: 'Request failed for [redacted-url] credentials [redacted]'
        }
      })
    });
    expect(screenText()).toContain('Request failed');
    expectNoForbiddenText(screenText());
  });

  it('dispatches load, search, and group changes only after user input changes', async () => {
    const dispatch = renderPanel();

    expect(dispatch.setSearchQuery).not.toHaveBeenCalled();
    expect(dispatch.setGroupBy).not.toHaveBeenCalled();

    button('Reload add-ons').click();
    const query = searchInput();
    query.value = 'alpha';
    input(query);
    const grouping = groupSelect();
    grouping.value = 'enabled';
    change(grouping);
    await tick();

    expect(dispatch.load).toHaveBeenCalledTimes(1);
    expect(dispatch.setSearchQuery).toHaveBeenCalledTimes(1);
    expect(dispatch.setSearchQuery).toHaveBeenCalledWith('alpha');
    expect(dispatch.setGroupBy).toHaveBeenCalledTimes(1);
    expect(dispatch.setGroupBy).toHaveBeenCalledWith('enabled');
  });

  it('distinguishes no installed add-ons from search results with no matches', () => {
    renderPanel({
      snapshot: createSnapshot({ addons: [], visibleAddons: [], groups: [], searchQuery: '' })
    });
    expect(screenText()).toContain('No installed add-ons are available.');

    unmountPanel();
    renderPanel({
      snapshot: createSnapshot({
        addons: [ALPHA_ADDON],
        visibleAddons: [],
        groups: [],
        searchQuery: 'missing'
      })
    });
    expect(screenText()).toContain('No add-ons match “missing”.');
  });

  it('renders malformed or missing add-on metadata with bounded accessible fallbacks', () => {
    renderPanel({
      snapshot: createSnapshot({
        addons: [
          {
            ...ALPHA_ADDON,
            addonid: 'script.empty',
            name: '',
            version: null,
            summary: null,
            type: '',
            enabled: null,
            broken: null
          }
        ],
        visibleAddons: [
          {
            ...ALPHA_ADDON,
            addonid: 'script.empty',
            name: '',
            version: null,
            summary: null,
            type: '',
            enabled: null,
            broken: null
          }
        ]
      })
    });

    expect(screenText()).toContain('Untitled add-on');
    expect(screenText()).toContain('Type unknown');
    expect(screenText()).toContain('Version unavailable');
    expect(screenText()).toContain('Summary unavailable');
    expect(screenText()).toContain('Enablement unknown');
    expect(document.querySelector('a[href="/addons/script.empty"]')?.textContent).toContain(
      'Open Untitled add-on details'
    );
  });

  it('redacts unsafe metadata and unsafe detail links from visible content', () => {
    renderPanel({
      snapshot: createSnapshot({
        addons: [UNSAFE_ADDON],
        visibleAddons: [UNSAFE_ADDON],
        groups: []
      })
    });

    expect(screenText()).toContain('[redacted');
    expect(document.querySelector('a')?.getAttribute('href')).toBe('/addons/[redacted]');
    expectNoForbiddenText(screenText());
  });
});
