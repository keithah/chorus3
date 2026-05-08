import { describe, expect, test, vi } from 'vitest';

import {
  M005_BROWSER_PROOF_FORBIDDEN_TEXT,
  createM005BrowserProofAppProps,
  isM005BrowserProofFixtureSecretSafe
} from './m005BrowserProofFixtures';

function collectText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'function') return value.toString();
  if (Array.isArray(value)) return value.map(collectText).join('\n');
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, nested]) => `${key}: ${collectText(nested)}`)
      .join('\n');
  }
  return '';
}

describe('createM005BrowserProofAppProps', () => {
  test('creates deterministic safe settings fixture props for the direct settings route', () => {
    const props = createM005BrowserProofAppProps({
      pathname: '/settings',
      search: '?m005-browser-proof=1'
    });

    const snapshot = props.settingsSnapshot;
    expect(snapshot).toBeDefined();
    if (!snapshot) throw new Error('Expected settings fixture snapshot.');

    expect(props.route).toEqual({ kind: 'primary', route: { kind: 'settingsWeb' } });
    expect(props.localeSnapshot).toBeUndefined();
    expect(snapshot).toMatchObject({
      loadStatus: 'success',
      writeStatus: 'error',
      selectedSectionId: 'player',
      selectedCategoryId: 'videos',
      writeCounts: { attempted: 4, succeeded: 2, failed: 1 }
    });
    expect(snapshot.sections.map((section) => section.label)).toEqual(['Player', 'Services']);
    expect(snapshot.categories.map((category) => category.label)).toEqual(['Videos', 'Interface']);
    expect(snapshot.settings.map((setting) => setting.label)).toEqual(
      expect.arrayContaining([
        'Autoplay next item',
        'Seek step size',
        'HDR tone mapping',
        'Friendly device name',
        'Scaling method',
        'Pending write proof',
        'Saved write proof',
        'Rejected write proof',
        'Media source path'
      ])
    );
    expect(snapshot.lastError).toMatchObject({
      source: 'write',
      code: 'fixture/rejected-write',
      message: expect.stringContaining('safe fixture write rejection')
    });
    expect(snapshot.lastWrite).toMatchObject({
      settingId: 'fixture.rejectedwrite',
      value: 'blocked fixture value',
      status: 'error'
    });
    expect(snapshot.rollbackValue).toBe('previous safe value');
    expect(snapshot.refreshAfterWrite).toMatchObject({
      settingId: 'fixture.pendingwrite',
      categoryId: 'videos',
      refreshed: false
    });
    expect(snapshot.settings.find((setting) => setting.id === 'filebrowser.source')).toMatchObject({
      editKind: 'unsupported',
      readOnly: true,
      value: 'redacted-file'
    });
    expect(isM005BrowserProofFixtureSecretSafe(props)).toBe(true);
  });

  test('creates deterministic safe settings fixture props for Kodi settings primary routes', () => {
    const kodi = createM005BrowserProofAppProps({
      pathname: '/settings/kodi',
      search: '?m005-browser-proof=1'
    });
    const section = createM005BrowserProofAppProps({
      pathname: '/settings/kodi/interface',
      search: '?m005-browser-proof=1'
    });

    expect(kodi.route).toEqual({ kind: 'primary', route: { kind: 'settingsKodi' } });
    expect(section.route).toEqual({
      kind: 'primary',
      route: { kind: 'settingsKodiSection', section: 'interface' }
    });
    expect(kodi.settingsSnapshot).toMatchObject({ loadStatus: 'success' });
    expect(section.settingsSnapshot).toMatchObject({ loadStatus: 'success' });
    expect(isM005BrowserProofFixtureSecretSafe(kodi)).toBe(true);
    expect(isM005BrowserProofFixtureSecretSafe(section)).toBe(true);
  });

  test('injects a clone-safe German locale snapshot for direct settings browser proof after validation', () => {
    const props = createM005BrowserProofAppProps({
      pathname: '/settings',
      search: '?m005-browser-proof=1&locale=de'
    });

    expect(props.route).toEqual({ kind: 'primary', route: { kind: 'settingsWeb' } });
    expect(props.localeSnapshot).toEqual({ locale: 'de' });
    expect(isM005BrowserProofFixtureSecretSafe(props)).toBe(true);
  });

  test('rejects malformed locale query values without persisting or exposing unsafe locale data', () => {
    const props = createM005BrowserProofAppProps({
      pathname: '/settings',
      search: '?m005-browser-proof=1&locale=de<script>&locale=en'
    });

    expect(props.route).toEqual({ kind: 'primary', route: { kind: 'settingsWeb' } });
    expect(props.localeSnapshot).toBeUndefined();
    expect(JSON.stringify(props)).not.toContain('de<script>');
    expect(isM005BrowserProofFixtureSecretSafe(props)).toBe(true);
  });

  test('creates deterministic safe add-ons list and detail fixture props for direct add-ons routes', () => {
    const listProps = createM005BrowserProofAppProps({
      pathname: '/addons',
      search: '?m005-browser-proof=1'
    });
    const videoProps = createM005BrowserProofAppProps({
      pathname: '/addons/video',
      search: '?m005-browser-proof=1'
    });
    const detailProps = createM005BrowserProofAppProps({
      pathname: '/addons/plugin.video.safe-demo',
      search: '?m005-browser-proof=1'
    });

    expect(listProps.route).toEqual({ kind: 'primary', route: { kind: 'addonsAll' } });
    expect(videoProps.route).toEqual({ kind: 'primary', route: { kind: 'addonsVideo' } });
    expect(videoProps.addonsSnapshot).toMatchObject({
      loadStatus: 'success',
      detailStatus: 'idle',
      writeStatus: 'idle'
    });
    expect(listProps.addonsSnapshot).toMatchObject({
      loadStatus: 'success',
      detailStatus: 'idle',
      writeStatus: 'idle',
      selectedAddonId: null,
      searchQuery: 'safe',
      groupBy: 'type',
      writeCounts: { attempted: 3, succeeded: 1, failed: 1 }
    });
    expect(listProps.addonsSnapshot?.addons.map((addon) => addon.name)).toEqual([
      'Safe Video Demo',
      'Safe Helper Module',
      'Safe Radio'
    ]);
    expect(listProps.addonsSnapshot?.groups.map((group) => group.label)).toEqual([
      'xbmc.python.pluginsource',
      'xbmc.python.module',
      'xbmc.addon.audio'
    ]);

    expect(detailProps.route).toEqual({
      kind: 'primary',
      route: { kind: 'addonDetail', addonid: 'plugin.video.safe-demo' }
    });
    expect(detailProps.addonsSnapshot).toMatchObject({
      loadStatus: 'success',
      detailStatus: 'success',
      writeStatus: 'error',
      selectedAddonId: 'plugin.video.safe-demo',
      pendingToggle: { addonid: 'plugin.video.safe-demo', enabled: true },
      lastWrite: { addonid: 'plugin.audio.safe-radio', enabled: false, status: 'error' },
      rollbackEnabled: true,
      refreshAfterWrite: { addonid: 'plugin.audio.safe-radio', refreshed: false },
      lastError: { code: 'fixture.addon-write-rejected' }
    });
    expect(detailProps.addonsSnapshot?.detail?.name).toBe('Safe Video Demo');
    expect(isM005BrowserProofFixtureSecretSafe(listProps)).toBe(true);
    expect(isM005BrowserProofFixtureSecretSafe(videoProps)).toBe(true);
    expect(isM005BrowserProofFixtureSecretSafe(detailProps)).toBe(true);
  });

  test('keeps Lab paths non-routable in browser proof fixtures', () => {
    const shortcuts = createM005BrowserProofAppProps({
      pathname: '/lab/shortcuts',
      search: '?m005-browser-proof=1'
    });
    const apiBrowser = createM005BrowserProofAppProps({
      pathname: '/lab/api-browser',
      search: '?m005-browser-proof=1'
    });
    const unsafe = createM005BrowserProofAppProps({
      pathname: '/lab/api-browser/Authorization/Basic/SENTINEL_SECRET',
      search: '?m005-browser-proof=1&token=Basic'
    });

    expect(shortcuts.route).toEqual({ kind: 'labUnknown', pathLabel: '/lab/shortcuts' });
    expect(apiBrowser.route).toEqual({ kind: 'labUnknown', pathLabel: '/lab/api-browser' });
    expect(unsafe.route).toEqual({ kind: 'labUnknown', pathLabel: '/lab/[redacted]' });
    expect(JSON.stringify(unsafe.route)).not.toMatch(
      /admin:p@ssword|Authorization|Basic|SENTINEL_SECRET|token=/i
    );
    expect(isM005BrowserProofFixtureSecretSafe(apiBrowser)).toBe(true);
  });

  test('keeps add-ons fixtures direct-route-only and excludes unsafe subpaths', () => {
    const unsafe = createM005BrowserProofAppProps({
      pathname: '/addons/admin:p@ssword/Authorization/Basic/SENTINEL_SECRET',
      search: '?m005-browser-proof=1&token=Basic'
    });
    const nested = createM005BrowserProofAppProps({
      pathname: '/addons/plugin.video.safe-demo/extra',
      search: '?m005-browser-proof=1'
    });
    const settings = createM005BrowserProofAppProps({
      pathname: '/settings',
      search: '?m005-browser-proof=1'
    });

    expect(unsafe.route.kind).toBe('addonsUnknown');
    expect(unsafe.addonsSnapshot).toBeUndefined();
    expect(nested.route.kind).toBe('addonsUnknown');
    expect(nested.addonsSnapshot).toBeUndefined();
    expect(settings.settingsSnapshot).toBeDefined();
    expect(settings.addonsSnapshot).toBeUndefined();
    expect(JSON.stringify(unsafe.route)).not.toMatch(
      /admin:p@ssword|Authorization|Basic|SENTINEL_SECRET|token=/i
    );
  });

  test('returns fresh clone-safe add-ons snapshots and inert dispatches without side effects', async () => {
    const first = createM005BrowserProofAppProps({ pathname: '/addons' });
    const second = createM005BrowserProofAppProps({ pathname: '/addons' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const localStorageSpy = vi.spyOn(window.localStorage.__proto__, 'getItem');
    const sessionStorageSpy = vi.spyOn(window.sessionStorage.__proto__, 'getItem');

    expect(first.addonsSnapshot).toBeDefined();
    expect(second.addonsSnapshot).toBeDefined();
    expect(first.addonsSnapshot).not.toBe(second.addonsSnapshot);
    expect(first.addonsSnapshot?.addons[0]).not.toBe(second.addonsSnapshot?.addons[0]);
    first.addonsSnapshot!.addons[0].name = 'Mutated fixture name';
    expect(second.addonsSnapshot?.addons[0].name).toBe('Safe Video Demo');

    await expect(first.addonsDispatch?.load()).resolves.toBeUndefined();
    await expect(first.addonsDispatch?.retry()).resolves.toBeUndefined();
    await expect(first.addonsDispatch?.setSearchQuery('video')).resolves.toBeUndefined();
    await expect(first.addonsDispatch?.setGroupBy('enabled')).resolves.toBeUndefined();

    const detail = createM005BrowserProofAppProps({ pathname: '/addons/plugin.video.safe-demo' });
    await expect(detail.addonDetailDispatch?.load()).resolves.toBeUndefined();
    await expect(detail.addonDetailDispatch?.retry()).resolves.toBeUndefined();
    await expect(
      detail.addonDetailDispatch?.setAddonEnabled('plugin.video.safe-demo', true)
    ).resolves.toBeUndefined();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorageSpy).not.toHaveBeenCalled();
    expect(sessionStorageSpy).not.toHaveBeenCalled();
    expect(isM005BrowserProofFixtureSecretSafe(first.addonsDispatch)).toBe(true);
    expect(isM005BrowserProofFixtureSecretSafe(detail.addonDetailDispatch)).toBe(true);
  });

  test('returns only safe routed props for unsafe settings subpaths and unrelated routes', () => {
    const unsafe = createM005BrowserProofAppProps({
      pathname: '/settings/admin:p@ssword/Authorization/Basic/SENTINEL_SECRET',
      search: '?m005-browser-proof=1&token=Basic'
    });
    const unrelated = createM005BrowserProofAppProps({
      pathname: '/video/movies',
      search: '?m005-browser-proof=1'
    });

    expect(unsafe.route.kind).toBe('settingsUnknown');
    expect(unsafe.settingsSnapshot).toBeUndefined();
    expect(JSON.stringify(unsafe.route)).not.toMatch(
      /admin:p@ssword|Authorization|Basic|SENTINEL_SECRET|token=/i
    );
    expect(unrelated.route).toEqual({ kind: 'primary', route: { kind: 'movies' } });
    expect(unrelated.settingsSnapshot).toBeUndefined();
  });

  test('uses inert settings dispatches without network or browser storage side effects', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const localStorageSpy = vi.spyOn(window.localStorage.__proto__, 'getItem');
    const sessionStorageSpy = vi.spyOn(window.sessionStorage.__proto__, 'getItem');
    const props = createM005BrowserProofAppProps({ pathname: '/settings' });

    await expect(props.settingsDispatch?.load()).resolves.toBeUndefined();
    await expect(props.settingsDispatch?.retry()).resolves.toBeUndefined();
    await expect(props.settingsDispatch?.selectSection('services')).resolves.toBeUndefined();
    await expect(props.settingsDispatch?.selectCategory('interface')).resolves.toBeUndefined();
    await expect(
      props.settingsDispatch?.setValue('videoplayer.autoplaynextitem', false)
    ).resolves.toBeUndefined();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorageSpy).not.toHaveBeenCalled();
    expect(sessionStorageSpy).not.toHaveBeenCalled();
    expect(isM005BrowserProofFixtureSecretSafe(props.settingsDispatch)).toBe(true);
  });

  test('creates deterministic active and setup now-playing fixture props only for the direct route', async () => {
    const active = createM005BrowserProofAppProps({
      pathname: '/now-playing',
      search: '?m005-browser-proof=1&theme=light&locale=de'
    });
    const setup = createM005BrowserProofAppProps({
      pathname: '/now-playing',
      search: '?m005-browser-proof=1&embed-state=setup&locale=de'
    });
    const unsafeSubpath = createM005BrowserProofAppProps({
      pathname: '/now-playing/Authorization/Basic/CHORUS3_SENTINEL_SECRET',
      search: '?m005-browser-proof=1&password=CHORUS3_SENTINEL_SECRET&token=Basic'
    });

    expect(active.route).toEqual({ kind: 'nowPlaying' });
    expect(active.nowPlayingHostSummary).toMatchObject({
      label: 'Safe Room Kodi',
      hasCredentials: false
    });
    expect(active.nowPlayingEmbedQuery).toMatchObject({ theme: 'light', locale: 'de' });
    expect(active.localeSnapshot).toEqual({ locale: 'de' });
    expect(active.playerSnapshot).toMatchObject({
      playbackStatus: 'active',
      item: { label: 'Aurora Signal' }
    });
    expect(active.localPlayerSnapshot).toBeDefined();
    expect(active.playerDispatch?.snapshot.commandStatus).toBe('idle');

    expect(setup.route).toEqual({ kind: 'nowPlaying' });
    expect(setup.nowPlayingHostSummary).toBeNull();
    expect(setup.playerSnapshot?.playbackStatus).toBe('none');
    expect(setup.localeSnapshot).toEqual({ locale: 'de' });

    expect(unsafeSubpath.route.kind).toBe('settingsUnknown');
    expect(unsafeSubpath.playerSnapshot).toBeUndefined();
    expect(unsafeSubpath.nowPlayingHostSummary).toBeUndefined();
    expect(unsafeSubpath.nowPlayingEmbedQuery).toBeUndefined();
    expect(JSON.stringify(unsafeSubpath.route)).not.toMatch(
      /Authorization|Basic|CHORUS3_SENTINEL_SECRET|password=|token=/i
    );

    await expect(active.nowPlayingRefreshDispatch?.()).resolves.toBeUndefined();
    await expect(active.playerDispatch?.playPause()).resolves.toBeUndefined();
    expect(isM005BrowserProofFixtureSecretSafe(active)).toBe(true);
    expect(isM005BrowserProofFixtureSecretSafe(setup)).toBe(true);
  });

  test('uses inert now-playing fixtures without network or browser storage side effects', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const localStorageSpy = vi.spyOn(window.localStorage.__proto__, 'getItem');
    const sessionStorageSpy = vi.spyOn(window.sessionStorage.__proto__, 'getItem');
    const props = createM005BrowserProofAppProps({
      pathname: '/now-playing',
      search: '?m005-browser-proof=1&username=admin&password=CHORUS3_SENTINEL_SECRET&token=Basic'
    });

    await expect(props.nowPlayingRefreshDispatch?.()).resolves.toBeUndefined();
    await expect(props.playerDispatch?.next()).resolves.toBeUndefined();
    await expect(props.playerDispatch?.setVolume(42)).resolves.toBeUndefined();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorageSpy).not.toHaveBeenCalled();
    expect(sessionStorageSpy).not.toHaveBeenCalled();
    expect(props.nowPlayingEmbedQuery?.rejectedCredentialParams.length).toBeGreaterThan(0);
    expect(isM005BrowserProofFixtureSecretSafe(props)).toBe(true);
  });

  test('keeps every fixture value clear of forbidden text and sentinel secrets', () => {
    const props = createM005BrowserProofAppProps({ pathname: '/settings' });
    const text = collectText(props);

    expect(isM005BrowserProofFixtureSecretSafe(props)).toBe(true);
    for (const forbidden of M005_BROWSER_PROOF_FORBIDDEN_TEXT) {
      expect(text).not.toContain(forbidden);
    }
  });
});
