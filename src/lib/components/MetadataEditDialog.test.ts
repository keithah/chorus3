import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MetadataEditDialog from './MetadataEditDialog.svelte';
import { METADATA_EDITOR_DEFINITIONS } from '$lib/metadata/metadataEditor';
import MetadataEditDialogHarness from '$lib/testing/MetadataEditDialogHarness.svelte';

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

  it('preserves dirty edits when the same source snapshot refreshes in the parent', async () => {
    const onSave = vi.fn();
    mounted = mount(MetadataEditDialogHarness, {
      target: document.body,
      props: {
        definition: METADATA_EDITOR_DEFINITIONS.movie,
        initialSource: {
          movieid: 7,
          title: 'Big Buck Bunny',
          plot: 'Original plot'
        },
        onSave,
        onCancel: vi.fn()
      }
    });
    await tick();

    const title = document.querySelector<HTMLInputElement>('input[name="title"]');
    expect(title).toBeInstanceOf(HTMLInputElement);
    title!.value = 'Draft title';
    title!.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();

    mounted.refreshSource({
      movieid: 7,
      title: 'Big Buck Bunny',
      plot: 'Refreshed plot'
    });
    await tick();

    expect(document.querySelector<HTMLInputElement>('input[name="title"]')?.value).toBe(
      'Draft title'
    );

    document
      .querySelector<HTMLFormElement>('form')
      ?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    await tick();

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'Draft title' }));
  });

  it('resets dirty edits when switching between songs with the same title', async () => {
    mounted = mount(MetadataEditDialogHarness, {
      target: document.body,
      props: {
        definition: METADATA_EDITOR_DEFINITIONS.song,
        initialSource: {
          songid: 7,
          title: 'Intro',
          album: 'First Album'
        },
        onSave: vi.fn(),
        onCancel: vi.fn()
      }
    });
    await tick();

    const album = document.querySelector<HTMLInputElement>('input[name="album"]');
    expect(album).toBeInstanceOf(HTMLInputElement);
    album!.value = 'Draft album';
    album!.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();

    mounted.refreshSource({
      songid: 8,
      title: 'Intro',
      album: 'Second Album'
    });
    await tick();

    expect(document.querySelector<HTMLInputElement>('input[name="album"]')?.value).toBe(
      'Second Album'
    );
  });
});
