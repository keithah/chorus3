import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';

import ShortcutsPanel from './ShortcutsPanel.svelte';
import { PLAYBACK_SHORTCUTS } from '$lib/app/playbackShortcuts';

let mounted: Record<string, unknown> | undefined;

function renderPanel(): HTMLElement {
  document.body.innerHTML = '<div id="shortcuts-panel-root"></div>';
  const target = document.getElementById('shortcuts-panel-root');

  if (!target) {
    throw new Error('Missing shortcuts panel root');
  }

  mounted = mount(ShortcutsPanel, { target }) as Record<string, unknown>;
  flushSync();

  return target;
}

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = undefined;
  }

  document.body.innerHTML = '';
});

describe('ShortcutsPanel', () => {
  it('renders accessible playback shortcut documentation from the shared shortcut contract', () => {
    const target = renderPanel();
    const panel = target.querySelector<HTMLElement>(
      '.shortcuts-panel[aria-labelledby="shortcuts-panel-title"]'
    );

    expect(panel).toBeInstanceOf(HTMLElement);
    expect(panel?.textContent).toContain('Playback shortcuts');
    expect(panel?.textContent).toContain(
      'Shortcuts are ignored while focus is inside editable controls.'
    );

    for (const shortcut of PLAYBACK_SHORTCUTS) {
      expect(panel?.textContent).toContain(shortcut.key);
      expect(panel?.textContent).toContain(shortcut.label);
      expect(panel?.textContent).toContain(shortcut.description);
    }
  });

  it('does not render forbidden secret-like tokens in static shortcut docs', () => {
    renderPanel();

    expect(document.body.textContent).not.toMatch(
      /Authorization|Basic|admin:p@ssword|localStorage|sessionStorage|CHORUS3_SENTINEL_SECRET|smb:\/\//i
    );
  });
});
