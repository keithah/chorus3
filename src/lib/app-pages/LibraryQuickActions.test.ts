import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTranslationContext } from '$lib/i18n';
import LibraryQuickActions, {
  type LibraryQuickActionsDispatch
} from './LibraryQuickActions.svelte';

type MountedComponent = ReturnType<typeof mount>;
type FakeDispatch = LibraryQuickActionsDispatch & {
  scanVideo: ReturnType<typeof vi.fn>;
  scanAudio: ReturnType<typeof vi.fn>;
};

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

describe('LibraryQuickActions', () => {
  it('surfaces Chorus2 library scan actions and dispatches the matching Kodi commands', () => {
    const dispatch = createDispatch();
    mounted = mount(LibraryQuickActions, {
      target: document.body,
      props: { dispatch, i18n: createTranslationContext('en') }
    });

    button('Scan video library').click();
    button('Scan audio library').click();

    expect(dispatch.scanVideo).toHaveBeenCalledTimes(1);
    expect(dispatch.scanAudio).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain('Ready to send library scan requests.');
  });

  it('renders sanitized failure diagnostics from the dispatch snapshot', () => {
    mounted = mount(LibraryQuickActions, {
      target: document.body,
      props: {
        i18n: createTranslationContext('en'),
        dispatch: createDispatch({
          commandStatus: 'failed',
          lastCommand: 'scanVideo',
          lastError: {
            source: 'http',
            code: 'transport/raw',
            message: 'Could not reach Kodi host.'
          },
          lastCompletedAt: '2026-06-16T00:00:00.000Z'
        })
      }
    });

    expect(document.body.textContent).toContain('Could not reach Kodi host.');
  });
});

function createDispatch(
  snapshot: LibraryQuickActionsDispatch['snapshot'] = {
    commandStatus: 'idle',
    lastCommand: null,
    lastError: null,
    lastCompletedAt: null
  }
): FakeDispatch {
  return {
    snapshot,
    scanVideo: vi.fn().mockResolvedValue(undefined),
    scanAudio: vi.fn().mockResolvedValue(undefined)
  };
}

function button(name: string): HTMLButtonElement {
  const match = Array.from(document.querySelectorAll('button')).find(
    (candidate) =>
      candidate.textContent?.trim().includes(name) || candidate.getAttribute('aria-label') === name
  );

  if (!(match instanceof HTMLButtonElement)) {
    throw new Error(`Button not found: ${name}`);
  }

  return match;
}
