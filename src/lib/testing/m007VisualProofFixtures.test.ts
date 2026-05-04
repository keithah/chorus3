import { describe, expect, it } from 'vitest';

import {
  M007_VISUAL_PROOF_FORBIDDEN_TEXT,
  createM007VisualProofAppProps,
  isM007VisualProofFixtureSecretSafe
} from './m007VisualProofFixtures';

const SECRET_SEARCH =
  '?m007-visual-proof=1&token=Basic&password=CHORUS3_SENTINEL_SECRET&next=smb://admin:p@ssword@nas/private&storage=localStorage';

function stringifyFixture(value: unknown): string {
  return JSON.stringify(value, (_key, nested) => (typeof nested === 'function' ? '[function]' : nested));
}

describe('M007 visual proof fixtures', () => {
  it.each([
    ['/music', ['Nina Simone', 'Pastel Blues']],
    ['/movies', ['Neon Harbor', 'Quiet Signal']],
    ['/tvshows', ['Aurora Files', 'Signal Mirror']],
    ['/browser', ['Albums', 'Sinnerman.flac']],
    ['/files', ['Albums', 'Sinnerman.flac']],
    ['/addons/video', ['Safe Video Demo', 'plugin.video.safe-demo']],
    ['/addons/plugin.video.safe-demo', ['Safe Video Demo', 'Enable add-on']],
    ['/playlists', ['Browser Jazz', 'Blue in Green', 'Late Night Jazz.xsp']],
    ['/settings/kodi/interface', ['Kodi settings section', 'Autoplay next item']],
    ['/help', ['About Chorus', 'Add-ons and developers']],
    ['/help/readme', ['Readme', 'Package usage']]
  ] as const)('creates deterministic safe props for %s', (pathname, expectedTokens) => {
    const first = createM007VisualProofAppProps({ pathname, search: SECRET_SEARCH });
    const second = createM007VisualProofAppProps({ pathname, search: SECRET_SEARCH });

    expect(stringifyFixture(first)).toEqual(stringifyFixture(second));
    expect(isM007VisualProofFixtureSecretSafe(first)).toBe(true);
    for (const token of expectedTokens) {
      expect(stringifyFixture(first), `${pathname} should include ${token}`).toContain(token);
    }
    for (const forbidden of M007_VISUAL_PROOF_FORBIDDEN_TEXT) {
      expect(stringifyFixture(first), `${pathname} should not include ${forbidden}`).not.toContain(
        forbidden
      );
    }
  });

  it('normalizes package-mounted proof routes without preserving unsafe query values', () => {
    const props = createM007VisualProofAppProps({
      pathname: '/addons/webinterface.chorus3/addons/plugin.video.safe-demo',
      search: SECRET_SEARCH
    });

    expect(props.route).toEqual({
      kind: 'primary',
      route: { kind: 'addonDetail', addonid: 'plugin.video.safe-demo' }
    });
    expect(props.addonsSnapshot?.selectedAddonId).toBe('plugin.video.safe-demo');
    expect(isM007VisualProofFixtureSecretSafe(props)).toBe(true);
    expect(stringifyFixture(props)).not.toMatch(
      /Authorization|Basic|CHORUS3_SENTINEL_SECRET|password|token|smb:\/\/|localStorage|sessionStorage/
    );
  });

  it('falls back to safe app routes for unknown proof routes without setup or not-found fixture copy', () => {
    const props = createM007VisualProofAppProps({
      pathname: '/missing-proof-route',
      search: SECRET_SEARCH
    });

    expect(props.route).toEqual({ kind: 'primary', route: { kind: 'home' } });
    expect(isM007VisualProofFixtureSecretSafe(props)).toBe(true);
    expect(stringifyFixture(props)).not.toMatch(
      /Setup console|generic not-found|Authorization|Basic|CHORUS3_SENTINEL_SECRET|localStorage/
    );
  });
});
