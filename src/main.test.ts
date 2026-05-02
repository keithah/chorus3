import { readFileSync } from 'node:fs';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { M005_BROWSER_PROOF_FORBIDDEN_TEXT } from './lib/testing/m005BrowserProofFixtures';
import { THEME_STORAGE_KEY } from './lib/theme/theme';

async function importMain(): Promise<typeof import('./main')> {
  return import('./main');
}

function setSearch(search: string): void {
  window.history.replaceState({}, '', `/${search}`);
}

function setPathAndSearch(pathname: string, search = ''): void {
  window.history.replaceState({}, '', `${pathname}${search}`);
}

describe('main entrypoint', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    document.querySelector('meta[name="chorus3:kodi-webinterface"]')?.remove();
    document.documentElement.removeAttribute('data-theme');
    window.localStorage.clear();
    setSearch('');
  });

  it('keeps Vite production assets relative for Kodi package installs', () => {
    const viteConfigSource = readFileSync('vite.config.ts', 'utf8');

    expect(viteConfigSource).toMatch(/base:\s*['"]\.\/['"]/);
  });

  it('resolves Kodi package-mounted entrypoint routes to in-app routes', async () => {
    const { resolveEntrypointRoute } = await importMain();

    expect(
      resolveEntrypointRoute({ pathname: '/addons/webinterface.chorus3', search: '' })
    ).toEqual({
      kind: 'dashboard'
    });
    expect(
      resolveEntrypointRoute({
        pathname: '/addons/webinterface.chorus3/now-playing',
        search: '?theme=light&locale=de'
      })
    ).toEqual({ kind: 'nowPlaying' });
    expect(
      resolveEntrypointRoute({
        pathname: '/addons/webinterface.chorus3/%2FAuthorization/Basic',
        search: '?token=Basic'
      })
    ).toEqual({ kind: 'settingsUnknown', pathLabel: '/[redacted]/[redacted]' });
  });

  it('derives a local-only Kodi host from package-mounted entrypoint origins', async () => {
    const { resolveEntrypointAppProps } = await importMain();

    expect(
      resolveEntrypointAppProps({
        pathname: '/addons/webinterface.chorus3',
        search: '',
        protocol: 'http:',
        hostname: 'kodi.local',
        port: '8080'
      })
    ).toEqual({
      route: { kind: 'dashboard' },
      packageMountedHost: {
        id: 'kodi-package-origin',
        label: 'This Kodi',
        host: 'kodi.local',
        port: 8080,
        useTls: false,
        useWebSocket: false
      }
    });

    expect(
      resolveEntrypointAppProps({
        pathname: '/',
        search: '',
        protocol: 'http:',
        hostname: 'kodi.local',
        port: '8080'
      })
    ).toEqual({ route: { kind: 'dashboard' } });

    document.head.insertAdjacentHTML(
      'beforeend',
      '<meta name="chorus3:kodi-webinterface" content="webinterface.chorus3">'
    );

    expect(
      resolveEntrypointAppProps({
        pathname: '/',
        search: '',
        protocol: 'http:',
        hostname: 'kodi.local',
        port: '8080'
      })
    ).toEqual({
      route: { kind: 'dashboard' },
      packageMountedHost: {
        id: 'kodi-package-origin',
        label: 'This Kodi',
        host: 'kodi.local',
        port: 8080,
        useTls: false,
        useWebSocket: false
      }
    });
  });

  it('mounts the Svelte app into the root element', async () => {
    await importMain();

    expect(document.body.textContent).toContain('chorus3');
  });

  it('applies the stored root theme before rendering', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');

    await importMain();

    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('mounts direct now-playing M005 browser-proof fixtures with query theme and German locale without persisting theme or exposing forbidden text', async () => {
    setPathAndSearch('/now-playing', '?m005-browser-proof=1&theme=light&locale=de');

    await importMain();

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(document.body.textContent).toContain('Aktuelle Wiedergabe einbetten');
    expect(document.body.textContent).toContain('Safe Room Kodi');
    expect(document.body.textContent).toContain('Aurora Signal');
    expect(document.body.textContent).not.toContain('Now playing embed');
    expect(document.body.textContent).not.toContain('Music Library');
    for (const forbidden of M005_BROWSER_PROOF_FORBIDDEN_TEXT) {
      expect(document.body.textContent).not.toContain(forbidden);
    }
  });

  it('mounts direct now-playing setup fixtures and keeps M005 now-playing fixtures off unrelated routes', async () => {
    setPathAndSearch('/now-playing', '?m005-browser-proof=1&embed-state=setup&locale=de');

    await importMain();

    expect(document.body.textContent).toContain('Einrichtung erforderlich');
    expect(document.body.textContent).toContain(
      'Einrichtung erforderlich, bevor die Aktuelle-Wiedergabe-Einbettung verbinden kann.'
    );
    expect(document.body.textContent).not.toContain('Aurora Signal');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/settings', '?m005-browser-proof=1&embed-state=setup');

    await importMain();

    expect(document.body.textContent).toContain('Kodi Settings');
    expect(document.body.textContent).not.toContain('Aurora Signal');
    expect(document.body.textContent).not.toContain('Now playing embed');
  });

  it('rejects credential-bearing now-playing query values through the real entrypoint without reflecting secrets', async () => {
    setPathAndSearch(
      '/now-playing',
      '?m005-browser-proof=1&username=admin&password=CHORUS3_SENTINEL_SECRET&token=Basic'
    );

    await importMain();

    expect(document.body.textContent).toContain('unsafe URL parameters were blocked');
    expect(document.body.textContent).toContain('Aurora Signal');
    expect(document.body.textContent).not.toMatch(
      /Authorization|Basic|CHORUS3_SENTINEL_SECRET|password=|token=|username|password|token|localStorage|sessionStorage|https?:\/\//i
    );
  });

  it('keeps default and disabled fixture query modes on the live/default app props', async () => {
    await importMain();

    expect(document.body.textContent).toContain('Music Library');
    expect(document.body.textContent).not.toContain('Nina Simone');
    expect(document.body.textContent).not.toContain('Pastel Blues');
    expect(document.body.textContent).not.toContain('Feeling Good');
    expect(document.body.textContent).not.toContain('I Put a Spell on You');
    expect(document.body.textContent).not.toContain('My Baby Just Cares for Me');
    expect(document.body.textContent).not.toContain('Neon Harbor');
    expect(document.body.textContent).not.toContain('Quiet Signal');
    expect(document.body.textContent).not.toContain('Signal Mirror');
    expect(document.body.textContent).not.toContain('Rain City Thrillers.xsp');
    expect(document.body.textContent).not.toContain('Safe Video Demo');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setSearch('?m003-browser-proof=0');

    await importMain();

    expect(document.body.textContent).toContain('Music Library');
    expect(document.body.textContent).not.toContain('Nina Simone');
    expect(document.body.textContent).not.toContain('Sinnerman.flac');
    expect(document.body.textContent).not.toContain('Feeling Good');
    expect(document.body.textContent).not.toContain('I Put a Spell on You');
    expect(document.body.textContent).not.toContain('My Baby Just Cares for Me');
    expect(document.body.textContent).not.toContain('Neon Harbor');
    expect(document.body.textContent).not.toContain('Quiet Signal');
    expect(document.body.textContent).not.toContain('Signal Mirror');
    expect(document.body.textContent).not.toContain('Rain City Thrillers.xsp');
    expect(document.body.textContent).not.toContain('Safe Video Demo');
  });

  it('mounts populated M003 browser-proof fixtures in test mode when explicitly requested', async () => {
    setSearch('?m003-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Nina Simone');
    expect(document.body.textContent).toContain('Pastel Blues');
    expect(document.body.textContent).toContain('Sinnerman');
    expect(document.body.textContent).toContain('Recent & Top Music');
    expect(document.body.textContent).toContain('Recently Added');
    expect(document.body.textContent).toContain('Recently Played');
    expect(document.body.textContent).toContain('Most Played');
    expect(document.body.textContent).toContain('Feeling Good');
    expect(document.body.textContent).toContain('I Put a Spell on You');
    expect(document.body.textContent).toContain('My Baby Just Cares for Me');
    expect(document.body.textContent).toContain('Added 2026-04-29 11:22:33');
    expect(document.body.textContent).toContain('Played 2026-04-30 20:15:00');
    expect(document.body.textContent).toContain('Played 12 times');
    expect(document.body.textContent).toContain('Albums');
    expect(document.body.textContent).toContain('Sinnerman.flac');
    expect(document.body.textContent).toContain('cover.jpg');
    expect(document.body.textContent).toContain('Late Night Jazz.xsp');
    expect(document.body.textContent).toContain('Road Trip.m3u');
  });

  it('mounts populated M005 browser-proof fixtures for the direct settings route', async () => {
    setPathAndSearch('/settings', '?m005-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Kodi Settings');
    expect(document.body.textContent).toContain('Autoplay next item');
    expect(document.body.textContent).toContain('Seek step size');
    expect(document.body.textContent).toContain('HDR tone mapping');
    expect(document.body.textContent).toContain('Pending write proof');
    expect(document.body.textContent).toContain('Saved write proof');
    expect(document.body.textContent).toContain('Rejected write proof');
    expect(document.body.textContent).toContain('Setting change failed.');
    expect(document.body.textContent).toContain('Rollback value: previous safe value');
    expect(document.body.textContent).toContain('Refresh after write: pending for');
    expect(document.body.textContent).toContain('fixture.pendingwrite');
    expect(document.body.textContent).toContain('4 attempted, 2 succeeded, 1 failed');
    expect(document.body.textContent).toContain(
      'Read-only: Kodi path settings are not safe to edit here.'
    );
    expect(document.body.textContent).not.toContain('Settings support is loading for this route.');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('Basic');
    expect(document.body.textContent).not.toContain('admin:p@ssword');
    expect(document.body.textContent).not.toContain('SENTINEL_SECRET');
    expect(document.body.textContent).not.toContain('localStorage');
    expect(document.body.textContent).not.toContain('sessionStorage');
  });

  it('switches M005 Settings browser-proof fixtures from English to German through the real entrypoint without route reload or forbidden tokens', async () => {
    setPathAndSearch('/settings', '?m005-browser-proof=1');

    await importMain();

    const beforePath = window.location.pathname;
    const beforeSearch = window.location.search;
    expect(document.body.textContent).toContain('Kodi Settings');
    expect(document.body.textContent).toContain('Settings loaded.');
    expect(document.body.textContent).toContain(
      'Read-only: Kodi path settings are not safe to edit here.'
    );
    expect(document.body.textContent).not.toContain('Kodi-Einstellungen');

    const select = document.body.querySelector<HTMLSelectElement>('.locale-toggle select');
    expect(select).toBeInstanceOf(HTMLSelectElement);
    select!.value = 'de';
    select!.dispatchEvent(new Event('change', { bubbles: true }));

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Kodi-Einstellungen');
    });

    expect(window.location.pathname).toBe(beforePath);
    expect(window.location.search).toBe(beforeSearch);
    expect(document.body.textContent).toContain('Einstellungen geladen.');
    expect(document.body.textContent).toContain('Vorheriger Wert: previous safe value');
    expect(document.body.textContent).toContain('4 versucht, 2 erfolgreich, 1 fehlgeschlagen');
    expect(document.body.textContent).toContain(
      'Schreibgeschützt: Kodi-path-Einstellungen können hier nicht sicher bearbeitet werden.'
    );
    expect(document.body.textContent).not.toContain('Kodi Settings');
    expect(document.body.textContent).not.toContain('Settings loaded.');
    expect(document.body.textContent).not.toContain(
      'Read-only: Kodi path settings are not safe to edit here.'
    );
    for (const forbidden of M005_BROWSER_PROOF_FORBIDDEN_TEXT) {
      expect(document.body.textContent).not.toContain(forbidden);
    }
  });

  it('mounts M005 German settings fixture only when the locale query is valid', async () => {
    setPathAndSearch('/settings', '?m005-browser-proof=1&locale=de');

    await importMain();

    expect(document.body.textContent).toContain('Kodi-Einstellungen');
    expect(document.body.textContent).toContain('Einstellungen geladen.');
    expect(document.body.textContent).toContain('Vorheriger Wert: previous safe value');
    expect(document.body.textContent).toContain('4 versucht, 2 erfolgreich, 1 fehlgeschlagen');
    expect(document.body.textContent).not.toContain('Kodi Settings');
    for (const forbidden of M005_BROWSER_PROOF_FORBIDDEN_TEXT) {
      expect(document.body.textContent).not.toContain(forbidden);
    }

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/settings', '?m005-browser-proof=1&locale=fr');

    await importMain();

    expect(document.body.textContent).toContain('Kodi Settings');
    expect(document.body.textContent).not.toContain('Kodi-Einstellungen');
    expect(window.localStorage.getItem('chorus3.locale')).toBeNull();
  });

  it('mounts populated M005 browser-proof fixtures for direct add-ons routes only', async () => {
    setPathAndSearch('/addons', '?m005-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Kodi Add-ons');
    expect(document.body.textContent).toContain('Safe Video Demo');
    expect(document.body.textContent).toContain('Safe Helper Module');
    expect(document.body.textContent).toContain('Safe Radio');
    expect(document.body.textContent).toContain('Broken: Safe fixture dependency missing');
    expect(document.body.textContent).not.toContain('Kodi Settings');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('Basic');
    expect(document.body.textContent).not.toContain('SENTINEL_SECRET');
    expect(document.body.textContent).not.toContain('localStorage');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/addons/plugin.video.safe-demo', '?m005-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Safe Video Demo');
    expect(document.body.textContent).toContain('Add-on detail loaded.');
    expect(document.body.textContent).toContain('Enable add-on');
    expect(document.body.textContent).toContain('Refresh after write warning');
    expect(document.body.textContent).toContain('fixture.addon-write-rejected');
  });

  it('mounts populated M005 browser-proof fixtures for direct Lab routes only', async () => {
    setPathAndSearch('/lab/shortcuts', '?m005-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Playback shortcuts');
    expect(document.body.textContent).toContain('Play / pause');
    expect(document.body.textContent).not.toContain('Lab API browser');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/lab/api-browser', '?m005-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Lab API browser');
    expect(document.body.textContent).toContain('Introspection loaded.');
    expect(document.body.textContent).toContain('Player.Open');
    expect(document.body.textContent).toContain('Confirmation required.');
    expect(document.body.textContent).toContain('System.Shutdown — blocked');
    expect(document.body.textContent).toContain('redactedField1');
    expect(document.body.textContent).not.toMatch(
      /Authorization|Basic|admin:p@ssword|SENTINEL_SECRET|localStorage|sessionStorage|smb:\/\//i
    );
  });

  it('does not expose M005 Lab API fixtures when the flag is absent, disabled, production-like, or route is unsafe', async () => {
    setPathAndSearch('/lab/api-browser', '');

    await importMain();

    expect(document.body.textContent).toContain('Lab API browser');
    expect(document.body.textContent).not.toContain('Player.Open');
    expect(document.body.textContent).not.toContain('fixture-ok');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/lab/api-browser', '?m005-browser-proof=0');

    await importMain();

    expect(document.body.textContent).toContain('Lab API browser');
    expect(document.body.textContent).not.toContain('Player.Open');

    const { resolveEntrypointAppProps } = await importMain();
    expect(
      resolveEntrypointAppProps(
        { pathname: '/lab/api-browser', search: '?m005-browser-proof=1' },
        { DEV: false, MODE: 'production' }
      )
    ).toEqual({ route: { kind: 'labApiBrowser' } });

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch(
      '/lab/api-browser/Authorization/Basic/SENTINEL_SECRET/localStorage',
      '?m005-browser-proof=1&token=Basic'
    );

    await importMain();

    expect(document.body.textContent).toContain('Lab route not found');
    expect(document.body.textContent).toContain('/lab/[redacted]');
    expect(document.body.textContent).not.toContain('Player.Open');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('Basic');
    expect(document.body.textContent).not.toContain('SENTINEL_SECRET');
    expect(document.body.textContent).not.toContain('localStorage');
  });

  it('does not expose M005 add-ons fixtures when the flag is absent, disabled, or route is unsafe', async () => {
    setPathAndSearch('/addons', '');

    await importMain();

    expect(document.body.textContent).toContain('Kodi Add-ons');
    expect(document.body.textContent).not.toContain('Safe Video Demo');
    expect(document.body.textContent).not.toContain('Safe Helper Module');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/addons', '?m005-browser-proof=0');

    await importMain();

    expect(document.body.textContent).toContain('Kodi Add-ons');
    expect(document.body.textContent).not.toContain('Safe Video Demo');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch(
      '/addons/admin:p@ssword/Authorization/Basic/SENTINEL_SECRET/localStorage',
      '?m005-browser-proof=1&token=Basic'
    );

    await importMain();

    expect(document.body.textContent).toContain('Add-ons route not found');
    expect(document.body.textContent).not.toContain('Safe Video Demo');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('Basic');
    expect(document.body.textContent).not.toContain('SENTINEL_SECRET');
    expect(document.body.textContent).not.toContain('localStorage');
  });

  it('does not expose M005 settings fixtures on unrelated routes or disabled fixture mode', async () => {
    setPathAndSearch('/video/movies', '?m005-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Video Movies');
    expect(document.body.textContent).not.toContain('Autoplay next item');
    expect(document.body.textContent).not.toContain('Rejected write proof');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/settings', '?m005-browser-proof=0');

    await importMain();

    expect(document.body.textContent).toContain('Kodi Settings');
    expect(document.body.textContent).not.toContain('Autoplay next item');
    expect(document.body.textContent).not.toContain('Rejected write proof');
  });

  it('mounts a safe settings unknown route without raw unsafe input', async () => {
    setPathAndSearch(
      '/settings/admin:p@ssword/Authorization/Basic/SENTINEL_SECRET/localStorage/sessionStorage',
      '?m005-browser-proof=1&token=Basic'
    );

    await importMain();

    expect(document.body.textContent).toContain('Settings route not found');
    expect(document.body.textContent).toContain('/settings/[redacted]/[redacted]');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('Basic');
    expect(document.body.textContent).not.toContain('admin:p@ssword');
    expect(document.body.textContent).not.toContain('SENTINEL_SECRET');
    expect(document.body.textContent).not.toContain('localStorage');
    expect(document.body.textContent).not.toContain('sessionStorage');
  });

  it('mounts populated M004 browser-proof fixtures for direct video grid recent sections and playlists', async () => {
    setPathAndSearch('/video/movies', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Video Movies');
    expect(document.body.textContent).toContain('2 of 503 movies');
    expect(document.body.textContent).toContain('Recent Video');
    expect(document.body.textContent).toContain('Recently added movies');
    expect(document.body.textContent).toContain('Recently played episodes');
    expect(document.body.textContent).toContain('Signal Mirror');
    expect(document.body.textContent).toContain('Cold Open');
    expect(document.body.textContent).toContain('Video playlists');
    expect(document.body.textContent).toContain('Rain City Thrillers.xsp');
    expect(document.body.textContent).toContain('Video item is browse-only in this view');
    expect(document.body.textContent).not.toContain('smb://');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('localStorage');
  });

  it('mounts populated M004 browser-proof fixtures for direct video grid and detail routes in test mode', async () => {
    setPathAndSearch('/video/movies/4401', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Neon Harbor');
    expect(document.body.textContent).toContain(
      'A courier crosses a rain-lit city to protect a copied memory.'
    );
    expect(document.body.textContent).toContain('Science Fiction, Thriller');
    expect(document.body.textContent).toContain('2 versions available');
    expect(document.body.textContent).toContain('Play');
    expect(document.body.textContent).toContain('Resume');
    expect(document.body.textContent).toContain('Queue');
    expect(document.body.textContent).toContain('Mark unwatched');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/video/movies/4402', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Quiet Signal');
    expect(document.body.textContent).toContain('Movie ID 4402');
    expect(document.body.textContent).toContain('Movie versions unsupported');
    expect(document.body.textContent).toContain('Back to movies');
  });

  it('mounts populated M004 browser-proof fixtures for direct TV routes in test mode', async () => {
    setPathAndSearch('/video/tv', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('TV Shows');
    expect(document.body.textContent).toContain('Aurora Files');
    expect(document.body.textContent).toContain('3 unwatched episodes');
    expect(document.body.textContent).toContain('Recent Video');
    expect(document.body.textContent).toContain('Video playlists');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/video/tv/5501', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Aurora Files');
    expect(document.body.textContent).toContain('Season 1');
    expect(document.body.textContent).toContain('Poster artwork available');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/video/tv/5501/seasons/1', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Season 1');
    expect(document.body.textContent).toContain('Signal Mirror');
    expect(document.body.textContent).toContain('Season artwork unsupported');
    expect(document.body.textContent).toContain('Refresh artwork');
    expect(document.body.textContent).toContain('Mark season watched');
    expect(document.body.textContent).toContain('Mark season unwatched');
    expect(document.body.textContent).toContain('Season write actions are ready.');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/video/tv/5501/seasons/1/episodes/6601', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Signal Mirror');
    expect(document.body.textContent).toContain('Episode ID 6601');
    expect(document.body.textContent).toContain('Resume available');
    expect(document.body.textContent).toContain('Stream');
    expect(document.body.textContent).toContain('Mark watched');
    expect(document.body.textContent).not.toContain('smb://');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('localStorage');
  });

  it('does not expose M004 TV fixture labels in default or disabled rendering', async () => {
    setPathAndSearch('/video/tv', '');

    await importMain();

    expect(document.body.textContent).not.toContain('Aurora Files');
    expect(document.body.textContent).not.toContain('Signal Mirror');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/video/tv', '?m004-browser-proof=0');

    await importMain();

    expect(document.body.textContent).not.toContain('Aurora Files');
    expect(document.body.textContent).not.toContain('Signal Mirror');
  });

  it('mounts safe M004 browser stream fixtures only when explicitly requested', async () => {
    setPathAndSearch('/video/movies/4401/stream', '?m004-browser-proof=1');

    await importMain();

    expect(document.body.textContent).toContain('Browser stream');
    expect(document.body.textContent).toContain('Neon Harbor');
    expect(document.body.textContent).toContain('Local browser playback is paused.');
    expect(document.body.textContent).toContain('Resume point available at 30:30.');
    expect(document.body.querySelector('video.local-media-runtime.fullscreen')).toBeInstanceOf(
      HTMLVideoElement
    );
    expect(document.body.textContent).toContain('Play in browser');
    expect(document.body.textContent).toContain('Resume in browser');
    expect(document.body.textContent).toContain('Retry');
    expect(document.body.textContent).toContain('Send to Kodi');
    expect(document.body.textContent).not.toContain('smb://');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('localStorage');

    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    setPathAndSearch('/video/movies/4401/stream', '?m004-browser-proof=0');

    await importMain();

    expect(document.body.textContent).not.toContain('Neon Harbor');
    expect(document.body.textContent).not.toContain('Local browser playback is paused.');
  });

  it('routes unknown video paths to safe in-app not-found UI without raw unsafe input', async () => {
    setPathAndSearch(
      '/video/smb://admin:p@ssword@example.local/Authorization/SENTINEL_SECRET',
      '?m004-browser-proof=1&token=Basic'
    );

    await importMain();

    expect(document.body.textContent).toContain('Video route not found');
    expect(document.body.textContent).toContain('Movies');
    expect(document.body.textContent).not.toContain('smb://');
    expect(document.body.textContent).not.toContain('admin:p@ssword');
    expect(document.body.textContent).not.toContain('Authorization');
    expect(document.body.textContent).not.toContain('Basic');
    expect(document.body.textContent).not.toContain('SENTINEL_SECRET');
  });

  it('exposes M005 pure gate helpers that reject malformed, absent, disabled, and production requests', async () => {
    const { resolveEntrypointRoute, shouldUseM005BrowserProofFixtures } = await importMain();

    expect(resolveEntrypointRoute({ pathname: '/settings', search: '?ignored=1' })).toEqual({
      kind: 'settings'
    });
    expect(resolveEntrypointRoute({ pathname: '/settings/', search: '?ignored=1' })).toEqual({
      kind: 'settings'
    });
    expect(
      resolveEntrypointRoute({
        pathname: '/settings/Authorization/Basic/admin:p@ssword/SENTINEL_SECRET',
        search: '?token=Basic'
      })
    ).toEqual({
      kind: 'settingsUnknown',
      pathLabel: '/settings/[redacted]/[redacted]/[redacted]/[redacted]'
    });
    expect(resolveEntrypointRoute({ pathname: '?m005-browser-proof=1', search: '' })).toEqual({
      kind: 'dashboard'
    });
    expect(resolveEntrypointRoute({ pathname: '//settings//', search: '' })).toEqual({
      kind: 'settings'
    });
    expect(
      resolveEntrypointRoute({
        get pathname(): string {
          throw new Error('untrusted location');
        },
        search: '?m005-browser-proof=1'
      }).kind
    ).toBe('dashboard');
    expect(
      shouldUseM005BrowserProofFixtures(
        { search: '?m005-browser-proof=1' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(true);
    expect(
      shouldUseM005BrowserProofFixtures(
        { search: '?m005-browser-proof=1' },
        { DEV: false, MODE: 'test' }
      )
    ).toBe(true);
    expect(
      shouldUseM005BrowserProofFixtures(
        { search: '?m005-browser-proof=0' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(shouldUseM005BrowserProofFixtures(undefined, { DEV: true, MODE: 'development' })).toBe(
      false
    );
    expect(
      shouldUseM005BrowserProofFixtures(
        {
          get search(): string {
            throw new Error('untrusted location');
          }
        },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(
      shouldUseM005BrowserProofFixtures(
        { search: '?m005-browser-proof=1' },
        { DEV: false, MODE: 'production' }
      )
    ).toBe(false);
  });

  it('exposes M004 pure gate helpers that reject malformed, absent, disabled, and production requests', async () => {
    const { resolveEntrypointRoute, shouldUseM004BrowserProofFixtures } = await importMain();

    expect(
      resolveEntrypointRoute({ pathname: '/video/movies/4401/stream', search: '?ignored=1' })
    ).toEqual({
      kind: 'video',
      route: {
        kind: 'videoMovieStream',
        movieid: 4401
      }
    });
    expect(
      resolveEntrypointRoute({ pathname: '/video/movies/4401', search: '?ignored=1' })
    ).toEqual({
      kind: 'video',
      route: {
        kind: 'videoMovieDetail',
        movieid: 4401
      }
    });
    expect(
      resolveEntrypointRoute({
        pathname: '/video/tv/5501/seasons/1/episodes/6601',
        search: '?ignored=1'
      })
    ).toEqual({
      kind: 'video',
      route: {
        kind: 'videoEpisodeDetail',
        tvshowid: 5501,
        season: 1,
        episodeid: 6601
      }
    });
    expect(resolveEntrypointRoute(undefined)).toEqual({ kind: 'dashboard' });
    expect(
      resolveEntrypointRoute({
        get pathname(): string {
          throw new Error('untrusted location');
        },
        search: '?m004-browser-proof=1'
      }).kind
    ).toBe('dashboard');
    expect(
      shouldUseM004BrowserProofFixtures(
        { search: '?m004-browser-proof=1' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(true);
    expect(
      shouldUseM004BrowserProofFixtures(
        { search: '?m004-browser-proof=1' },
        { DEV: false, MODE: 'test' }
      )
    ).toBe(true);
    expect(
      shouldUseM004BrowserProofFixtures(
        { search: '?m004-browser-proof=0' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(shouldUseM004BrowserProofFixtures(undefined, { DEV: true, MODE: 'development' })).toBe(
      false
    );
    expect(
      shouldUseM004BrowserProofFixtures(
        {
          get search(): string {
            throw new Error('untrusted location');
          }
        },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(
      shouldUseM004BrowserProofFixtures(
        { search: '?m004-browser-proof=1' },
        { DEV: false, MODE: 'production' }
      )
    ).toBe(false);
  });

  it('exposes pure gate helpers that reject malformed, absent, disabled, and production requests', async () => {
    const { shouldUseM003BrowserProofFixtures } = await importMain();

    expect(
      shouldUseM003BrowserProofFixtures(
        { search: '?m003-browser-proof=1' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(true);
    expect(
      shouldUseM003BrowserProofFixtures(
        { search: '?m003-browser-proof=1' },
        { DEV: false, MODE: 'test' }
      )
    ).toBe(true);
    expect(
      shouldUseM003BrowserProofFixtures(
        { search: '?m003-browser-proof=0' },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(shouldUseM003BrowserProofFixtures(undefined, { DEV: true, MODE: 'development' })).toBe(
      false
    );
    expect(
      shouldUseM003BrowserProofFixtures(
        {
          get search(): string {
            throw new Error('untrusted location');
          }
        },
        { DEV: true, MODE: 'development' }
      )
    ).toBe(false);
    expect(
      shouldUseM003BrowserProofFixtures(
        { search: '?m003-browser-proof=1' },
        { DEV: false, MODE: 'production' }
      )
    ).toBe(false);
  });

  it('keeps the existing explicit mount error when #app is missing', async () => {
    document.body.innerHTML = '';

    await expect(importMain()).rejects.toThrow(
      'Unable to mount chorus3: #app element was not found.'
    );
  });
});
