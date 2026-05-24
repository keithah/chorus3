import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import LabScreenshotPage from './LabScreenshotPage.svelte';
import type { RemoteInputPanelRemoteDispatch } from './RemoteInputPanel.svelte';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
  window.location.hash = '';
});

describe('LabScreenshotPage', () => {
  it('takes the Kodi screenshot and returns to the Chorus2 Lab route', async () => {
    const dispatch: RemoteInputPanelRemoteDispatch = {
      snapshot: {
        commandStatus: 'idle',
        lastCommand: null,
        lastError: null,
        lastCompletedAt: null
      },
      sendInput: vi.fn(),
      executeAction: vi.fn()
    };

    mounted = mount(LabScreenshotPage, {
      target: document.body,
      props: {
        dispatch,
        buildOptions: { routeMode: 'hash' }
      }
    });

    await tick();
    await new Promise<void>((resolve) => window.queueMicrotask(resolve));

    expect(dispatch.executeAction).toHaveBeenCalledWith('screenshot');
    expect(window.location.hash).toBe('#lab');
    expect(document.body.textContent).toContain('Screenshot saved to your screenshots folder.');
  });
});
