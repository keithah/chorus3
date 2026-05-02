import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import QueuePanel, { type QueuePanelDispatch } from './QueuePanel.svelte';
import { createTranslationContext, type TranslationContext } from '$lib/i18n';
import type { QueueDispatchSnapshot, QueueStoreSnapshot } from '$lib/stores';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

function createQueueSnapshot(overrides: Partial<QueueStoreSnapshot> = {}): QueueStoreSnapshot {
  return {
    refreshStatus: 'ready',
    playlistid: null,
    activePosition: null,
    items: [],
    limits: { start: 0, end: 0, total: 0 },
    lastRefreshReason: 'manual',
    lastUpdatedAt: null,
    lastError: null,
    ...overrides
  };
}

function createDispatchSnapshot(
  overrides: Partial<QueueDispatchSnapshot> = {}
): QueueDispatchSnapshot {
  return {
    commandStatus: 'idle',
    lastCommand: null,
    lastError: null,
    lastCompletedAt: null,
    ...overrides
  };
}

type FakeDispatch = QueuePanelDispatch & {
  removeAt: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  swap: ReturnType<typeof vi.fn>;
};

function createFakeDispatch(snapshotOverrides: Partial<QueueDispatchSnapshot> = {}): FakeDispatch {
  return {
    snapshot: createDispatchSnapshot(snapshotOverrides),
    removeAt: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    swap: vi.fn().mockResolvedValue(undefined)
  };
}

function activeQueueSnapshot(itemCount = 3, activePosition = 1): QueueStoreSnapshot {
  const items = Array.from({ length: itemCount }, (_, i) => ({
    position: i,
    label: `Song ${String.fromCharCode(65 + i)}`
  }));
  return createQueueSnapshot({
    refreshStatus: 'ready',
    playlistid: 7,
    activePosition,
    items,
    limits: { start: 0, end: itemCount, total: itemCount },
    lastUpdatedAt: '2026-01-01T00:00:00.000Z'
  });
}

function renderPanel(props: {
  snapshot: QueueStoreSnapshot;
  dispatch?: QueuePanelDispatch;
  i18n?: TranslationContext;
}): void {
  mounted = mount(QueuePanel, {
    target: document.body,
    props: {
      snapshot: props.snapshot,
      dispatch: props.dispatch ?? createFakeDispatch(),
      i18n: props.i18n
    }
  });
}

function screenText(): string {
  return document.body.textContent ?? '';
}

function button(labelOrText: string): HTMLButtonElement {
  const match = Array.from(document.querySelectorAll('button')).find(
    (b) => b.getAttribute('aria-label') === labelOrText || b.textContent?.trim() === labelOrText
  );
  if (!(match instanceof HTMLButtonElement)) {
    const found = Array.from(document.querySelectorAll('button'))
      .map((b) => b.getAttribute('aria-label') ?? b.textContent?.trim())
      .join(', ');
    throw new Error(`Button not found: "${labelOrText}". Found: ${found}`);
  }
  return match;
}

function allButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll('button'));
}

function expectSecretSafe(value: string): void {
  expect(value).not.toContain('p@ssword');
  expect(value).not.toContain('Authorization');
  expect(value).not.toContain('Basic ');
  expect(value).not.toContain('smb://secret');
  expect(value).not.toContain('localStorage');
}

describe('QueuePanel', () => {
  it('renders no-active state with explanatory copy when playlistid is null', () => {
    renderPanel({ snapshot: createQueueSnapshot({ refreshStatus: 'ready', playlistid: null }) });

    expect(screenText()).toContain('No active Kodi playlist');
    for (const btn of allButtons()) {
      expect(btn.disabled).toBe(true);
    }
  });

  it('shows loading copy while queue is refreshing and disables all visible controls', () => {
    renderPanel({ snapshot: createQueueSnapshot({ refreshStatus: 'loading', playlistid: 7 }) });

    expect(screenText()).toContain('Loading');
    for (const btn of allButtons()) {
      expect(btn.disabled).toBe(true);
    }
  });

  it('renders ordered items with active position marker, label, type, and formatted duration', () => {
    renderPanel({
      snapshot: createQueueSnapshot({
        refreshStatus: 'ready',
        playlistid: 7,
        activePosition: 1,
        items: [
          { position: 0, label: 'First Song', type: 'song', duration: 180 },
          { position: 1, label: 'Now Playing Song', type: 'song', duration: 240 },
          { position: 2, label: 'Third Song' }
        ],
        limits: { start: 0, end: 3, total: 3 }
      })
    });

    const text = screenText();
    expect(text).toContain('First Song');
    expect(text).toContain('Now Playing Song');
    expect(text).toContain('Third Song');
    expect(text).toContain('3:00');
    expect(document.querySelector('[aria-current="true"]')?.textContent).toContain(
      'Now Playing Song'
    );
    expectSecretSafe(text);
  });

  it('renders empty queue state with clear button disabled', () => {
    renderPanel({
      snapshot: createQueueSnapshot({
        refreshStatus: 'ready',
        playlistid: 7,
        items: [],
        limits: { start: 0, end: 0, total: 0 }
      })
    });

    expect(screenText()).toContain('empty');
    expect(button('Clear queue').disabled).toBe(true);
  });

  it('shows sanitized queue refresh errors in the live region without exposing secrets', () => {
    renderPanel({
      snapshot: createQueueSnapshot({
        refreshStatus: 'error',
        playlistid: 7,
        lastError: {
          source: 'http',
          code: 'auth',
          message: 'Kodi rejected the configured credentials while calling Playlist.GetItems.'
        }
      })
    });

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion?.textContent).toContain('credentials');
    expectSecretSafe(liveRegion?.textContent ?? '');
  });

  it('shows sanitized command errors in the live region without exposing secrets', () => {
    renderPanel({
      snapshot: createQueueSnapshot({
        refreshStatus: 'ready',
        playlistid: 7,
        items: [{ position: 0, label: 'Song A' }],
        limits: { start: 0, end: 1, total: 1 }
      }),
      dispatch: createFakeDispatch({
        commandStatus: 'error',
        lastCommand: 'removeAt',
        lastError: {
          source: 'http',
          code: 'auth',
          message: 'Kodi rejected the configured credentials while calling Playlist.Remove.'
        }
      })
    });

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion?.textContent).toContain('Kodi rejected the configured credentials');
    expectSecretSafe(liveRegion?.textContent ?? '');
  });

  it('calls removeAt with the item position on remove button click', () => {
    const dispatch = createFakeDispatch();
    renderPanel({ snapshot: activeQueueSnapshot(), dispatch });

    button('Remove Song B').click();

    expect(dispatch.removeAt).toHaveBeenCalledWith(1);
  });

  it('calls clear on clear queue button click', () => {
    const dispatch = createFakeDispatch();
    renderPanel({ snapshot: activeQueueSnapshot(), dispatch });

    button('Clear queue').click();

    expect(dispatch.clear).toHaveBeenCalledTimes(1);
  });

  it('calls swap with adjacent positions for move-up and move-down buttons', () => {
    const dispatch = createFakeDispatch();
    renderPanel({ snapshot: activeQueueSnapshot(3, 0), dispatch });

    button('Move Song B up').click();
    button('Move Song B down').click();

    expect(dispatch.swap).toHaveBeenNthCalledWith(1, 0, 1);
    expect(dispatch.swap).toHaveBeenNthCalledWith(2, 1, 2);
  });

  it('disables all controls while a queue command is running', () => {
    renderPanel({
      snapshot: activeQueueSnapshot(),
      dispatch: createFakeDispatch({ commandStatus: 'running', lastCommand: 'clear' })
    });

    for (const btn of allButtons()) {
      expect(btn.disabled).toBe(true);
    }
  });

  it('disables move-up for the first item and move-down for the last item only', () => {
    renderPanel({ snapshot: activeQueueSnapshot(3, 0) });

    expect(button('Move Song A up').disabled).toBe(true);
    expect(button('Move Song A down').disabled).toBe(false);
    expect(button('Move Song B up').disabled).toBe(false);
    expect(button('Move Song B down').disabled).toBe(false);
    expect(button('Move Song C up').disabled).toBe(false);
    expect(button('Move Song C down').disabled).toBe(true);
  });

  it('renders German empty, loading, command, and editable queue labels', () => {
    const dispatch = createFakeDispatch({ commandStatus: 'running', lastCommand: 'clear' });
    renderPanel({
      snapshot: activeQueueSnapshot(2, 0),
      dispatch,
      i18n: createTranslationContext('de')
    });

    expect(document.querySelector('.queue-panel')?.getAttribute('aria-label')).toBe(
      'Kodi-Warteschlange'
    );
    expect(screenText()).toContain('clear wird ausgeführt…');
    expect(button('Warteschlange leeren').disabled).toBe(true);
    expect(button('Song B nach oben verschieben').disabled).toBe(true);
    expect(button('Song A entfernen').disabled).toBe(true);

    if (mounted) {
      unmount(mounted);
    }
    mounted = null;
    document.body.innerHTML = '';

    renderPanel({
      snapshot: createQueueSnapshot({ refreshStatus: 'ready', playlistid: 7 }),
      i18n: createTranslationContext('de')
    });
    expect(screenText()).toContain('Die Warteschlange ist leer.');
    expect(button('Warteschlange leeren').disabled).toBe(true);

    if (mounted) {
      unmount(mounted);
    }
    mounted = null;
    document.body.innerHTML = '';

    renderPanel({
      snapshot: createQueueSnapshot({ refreshStatus: 'loading', playlistid: 7 }),
      i18n: createTranslationContext('de')
    });
    expect(screenText()).toContain('Warteschlange wird geladen…');
  });
});
