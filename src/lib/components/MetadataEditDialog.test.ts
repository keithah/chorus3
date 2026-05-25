import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MetadataEditDialog from './MetadataEditDialog.svelte';
import { METADATA_EDITOR_DEFINITIONS } from '$lib/metadata/metadataEditor';

type MountedComponent = ReturnType<typeof mount>;

let mounted: MountedComponent | null = null;

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  document.body.innerHTML = '';
});

describe('MetadataEditDialog', () => {
  it('renders Kodi scheme fields as text inputs so native URL validation does not block saving', async () => {
    mounted = mount(MetadataEditDialog, {
      target: document.body,
      props: {
        definition: METADATA_EDITOR_DEFINITIONS.movie,
        source: {
          title: 'Big Buck Bunny',
          trailer: 'plugin://plugin.video.youtube/?action=play_video&videoid=abc123',
          art: {
            poster: 'image://poster.jpg/',
            fanart: 'image://fanart.jpg/'
          }
        },
        onSave: vi.fn(),
        onCancel: vi.fn()
      }
    });
    await tick();

    const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    tabs.find((tab) => tab.textContent === 'Trailer')?.click();
    await tick();
    expect(document.querySelector<HTMLInputElement>('input[name="trailer"]')?.type).toBe('text');

    tabs.find((tab) => tab.textContent === 'Poster')?.click();
    await tick();
    expect(document.querySelector<HTMLInputElement>('input[name="thumbnail"]')?.type).toBe('text');

    tabs.find((tab) => tab.textContent === 'Background')?.click();
    await tick();
    expect(document.querySelector<HTMLInputElement>('input[name="fanart"]')?.type).toBe('text');
  });
});
