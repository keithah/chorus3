<script lang="ts">
  import { isTextSecretSafe, redactDiagnosticText } from '$lib/safety/redaction';
  import type {
    LocalPlaylistDispatch,
    LocalPlaylistItemSnapshot,
    LocalPlaylistMoveDirection,
    LocalPlaylistMutationResult,
    LocalPlaylistStoreSnapshot,
    LocalPlaylistValidationErrors
  } from '$lib/stores';

  interface Props {
    snapshot?: Partial<LocalPlaylistStoreSnapshot>;
    dispatch: LocalPlaylistDispatch;
  }

  let { snapshot = {}, dispatch }: Props = $props();

  let createName = $state('');
  let renameName = $state('');
  let removeConfirmPlaylistId = $state<string | null>(null);
  let localErrors = $state<LocalPlaylistValidationErrors>({});
  let actionError = $state<string | null>(null);

  const playlists = $derived(snapshot.playlists ?? []);
  const selectedPlaylist = $derived(snapshot.selectedPlaylist ?? null);
  const selectedPlaylistId = $derived(snapshot.selectedPlaylistId ?? selectedPlaylist?.id ?? null);
  const selectedItems = $derived(selectedPlaylist?.items ?? []);
  const isRunning = $derived(snapshot.mutationStatus === 'running');
  const hasSelectedPlaylist = $derived(Boolean(selectedPlaylistId && selectedPlaylist));
  const canMutateSelected = $derived(Boolean(hasSelectedPlaylist && !isRunning));
  const canClearSelected = $derived(Boolean(canMutateSelected && selectedItems.length > 0));

  $effect(() => {
    if (selectedPlaylist) {
      renameName = selectedPlaylist.label;
    } else {
      renameName = '';
    }
  });

  const statusText = $derived((): string => {
    if (isRunning) {
      return `Local playlist ${snapshot.lastMutation ?? 'mutation'} is running…`;
    }

    if (snapshot.mutationStatus === 'error' && snapshot.lastMutation) {
      return `Local playlist ${snapshot.lastMutation} failed.`;
    }

    if (playlists.length === 0) {
      return 'No local playlists yet.';
    }

    if (!selectedPlaylist) {
      return `Choose one of ${playlists.length} local playlists.`;
    }

    return `${safeLabel(selectedPlaylist.label, 'Selected playlist')} selected with ${selectedItems.length} ${pluralize('item', selectedItems.length)}.`;
  });

  const alertMessages = $derived((): string[] => {
    const messages: string[] = [];

    if (snapshot.storageWarning?.message) {
      messages.push(safeDiagnostic(snapshot.storageWarning.message));
    }

    if (snapshot.lastError?.message) {
      messages.push(safeDiagnostic(snapshot.lastError.message));
    }

    if (actionError) {
      messages.push(actionError);
    }

    for (const message of Object.values(snapshot.validationErrors ?? {})) {
      if (message) messages.push(safeDiagnostic(message));
    }

    for (const message of Object.values(localErrors)) {
      if (message) messages.push(safeDiagnostic(message));
    }

    return Array.from(new Set(messages));
  });

  function handleCreate(event: SubmitEvent): void {
    event.preventDefault();
    actionError = null;
    const label = createName;
    const labelResult = validateLabel(label);

    if (!labelResult.ok) {
      localErrors = { label: labelResult.error };
      return;
    }

    localErrors = {};
    const result = dispatch.createPlaylist(labelResult.value);
    handleMutationResult(result);
    if (result.ok) {
      createName = '';
    }
  }

  function handleRename(event: SubmitEvent): void {
    event.preventDefault();
    actionError = null;

    if (!selectedPlaylistId) {
      localErrors = { playlistId: 'Choose an existing local playlist.' };
      return;
    }

    const labelResult = validateLabel(renameName);
    if (!labelResult.ok) {
      localErrors = { label: labelResult.error };
      return;
    }

    localErrors = {};
    handleMutationResult(dispatch.renamePlaylist(selectedPlaylistId, labelResult.value));
  }

  function selectPlaylist(playlistId: string): void {
    if (isRunning || playlistId === selectedPlaylistId) return;
    actionError = null;
    localErrors = {};
    removeConfirmPlaylistId = null;
    handleMutationResult(dispatch.selectPlaylist(playlistId));
  }

  function requestRemove(playlistId: string): void {
    if (isRunning) return;
    removeConfirmPlaylistId = playlistId;
  }

  function confirmRemove(playlistId: string): void {
    if (isRunning) return;
    actionError = null;
    localErrors = {};
    removeConfirmPlaylistId = null;
    handleMutationResult(dispatch.removePlaylist(playlistId));
  }

  function clearSelected(): void {
    if (!selectedPlaylistId || !canClearSelected) return;
    actionError = null;
    localErrors = {};
    handleMutationResult(dispatch.clearPlaylist(selectedPlaylistId));
  }

  function removeItem(itemId: string): void {
    if (!selectedPlaylistId || isRunning) return;
    actionError = null;
    localErrors = {};
    handleMutationResult(dispatch.removeItem(selectedPlaylistId, itemId));
  }

  function moveItem(item: LocalPlaylistItemSnapshot, direction: LocalPlaylistMoveDirection): void {
    if (!selectedPlaylistId || isRunning) return;
    const index = selectedItems.findIndex((candidate) => candidate.id === item.id);
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || nextIndex < 0 || nextIndex >= selectedItems.length) return;

    actionError = null;
    localErrors = {};
    handleMutationResult(dispatch.moveItem(selectedPlaylistId, item.id, direction));
  }

  function handleMutationResult(result: LocalPlaylistMutationResult): void {
    if (result.ok) {
      actionError = null;
      return;
    }

    localErrors = result.errors;
    actionError = Object.values(result.errors)[0]
      ? safeDiagnostic(Object.values(result.errors)[0])
      : null;
  }

  function validateLabel(
    value: string
  ): { ok: true; value: string } | { ok: false; error: string } {
    const label = value.trim().replace(/\s+/g, ' ');

    if (!label) {
      return { ok: false, error: 'Local playlist name is required.' };
    }

    if (!isTextSecretSafe(label)) {
      return { ok: false, error: 'Use a safe display name without paths, URLs, or credentials.' };
    }

    return { ok: true, value: label };
  }

  function safeDiagnostic(value: unknown): string {
    return redactDiagnosticText(value)
      .replace(/\[redacted\]/g, 'credentials [redacted]')
      .replace(/browser credentials \[redacted\]/gi, 'browser storage')
      .replace(
        /credentials \[redacted\] storage credentials \[redacted\]/gi,
        'storage payload [redacted]'
      );
  }

  function safeLabel(label: string | undefined, fallback: string): string {
    const trimmed = label?.trim() ?? '';
    return trimmed && isTextSecretSafe(trimmed) ? trimmed : fallback;
  }

  function formatDuration(seconds: number | undefined): string | null {
    if (seconds === undefined || seconds === null) return null;
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(totalSeconds / 60);
    const remainder = totalSeconds % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
  }

  function pluralize(word: string, count: number): string {
    return count === 1 ? word : `${word}s`;
  }
</script>

<section
  class="local-playlists-panel"
  aria-labelledby="local-playlists-title"
  data-local-playlists-panel
>
  <header>
    <h2 id="local-playlists-title">Local Playlists</h2>
    <p data-local-playlist-status role="status" aria-live="polite" aria-atomic="true">
      {statusText()}
    </p>
  </header>

  {#if alertMessages().length > 0}
    <div role="alert" class="local-playlists-alert">
      {#each alertMessages() as message}
        <p>{message}</p>
      {/each}
    </div>
  {/if}

  <form class="playlist-form" onsubmit={handleCreate}>
    <label for="local-playlist-create-name">New playlist name</label>
    <input
      id="local-playlist-create-name"
      name="local-playlist-create-name"
      autocomplete="off"
      bind:value={createName}
      aria-invalid={localErrors.label ? 'true' : undefined}
    />
    <button type="submit" disabled={isRunning}>Create playlist</button>
  </form>

  {#if playlists.length === 0}
    <p>Create a local playlist to save playable items in this browser.</p>
  {:else}
    <div class="playlist-browser">
      <section aria-labelledby="local-playlists-list-title">
        <h3 id="local-playlists-list-title">Saved playlists</h3>
        <ul>
          {#each playlists as playlist (playlist.id)}
            {@const displayLabel = safeLabel(playlist.label, 'Local playlist')}
            {@const isSelected = playlist.id === selectedPlaylistId}
            <li aria-current={isSelected ? 'true' : undefined}>
              <span>{displayLabel}</span>
              <span>{playlist.items.length} {pluralize('item', playlist.items.length)}</span>
              <button
                type="button"
                aria-label={`Select playlist ${displayLabel}`}
                disabled={isRunning || isSelected}
                onclick={() => selectPlaylist(playlist.id)}>Select</button
              >
              <button
                type="button"
                aria-label={`Remove playlist ${displayLabel}`}
                disabled={isRunning}
                onclick={() => requestRemove(playlist.id)}>Remove</button
              >
              {#if removeConfirmPlaylistId === playlist.id}
                <button
                  type="button"
                  aria-label={`Confirm remove playlist ${displayLabel}`}
                  disabled={isRunning}
                  onclick={() => confirmRemove(playlist.id)}>Confirm remove</button
                >
              {/if}
            </li>
          {/each}
        </ul>
      </section>

      <section aria-labelledby="local-playlist-selected-title">
        <h3 id="local-playlist-selected-title">Selected playlist</h3>

        {#if !selectedPlaylist}
          <p>Choose a local playlist to manage its items.</p>
        {:else}
          {@const selectedLabel = safeLabel(selectedPlaylist.label, 'Selected playlist')}
          <p>{selectedLabel}</p>
          <form class="playlist-form" onsubmit={handleRename}>
            <label for="local-playlist-rename-name">Rename selected playlist</label>
            <input
              id="local-playlist-rename-name"
              name="local-playlist-rename-name"
              autocomplete="off"
              bind:value={renameName}
              aria-invalid={localErrors.label ? 'true' : undefined}
            />
            <button type="submit" disabled={!canMutateSelected}>Rename playlist</button>
          </form>

          <button
            type="button"
            disabled={!canMutateSelected}
            onclick={() => requestRemove(selectedPlaylist.id)}
          >
            Remove playlist
          </button>
          <button type="button" disabled={!canClearSelected} onclick={clearSelected}>
            Clear selected playlist
          </button>

          {#if selectedItems.length === 0}
            <p>{selectedLabel} has no items yet.</p>
          {:else}
            <ol>
              {#each selectedItems as item, index (item.id)}
                {@const itemLabel = safeLabel(item.label, `Item ${index + 1}`)}
                {@const duration = formatDuration(item.durationSeconds)}
                <li>
                  <span>{itemLabel}</span>
                  {#if duration}
                    <span>{duration}</span>
                  {/if}
                  <button
                    type="button"
                    aria-label={`Move ${itemLabel} up`}
                    disabled={isRunning || index === 0}
                    onclick={() => moveItem(item, 'up')}>↑</button
                  >
                  <button
                    type="button"
                    aria-label={`Move ${itemLabel} down`}
                    disabled={isRunning || index === selectedItems.length - 1}
                    onclick={() => moveItem(item, 'down')}>↓</button
                  >
                  <button
                    type="button"
                    aria-label={`Remove item ${itemLabel}`}
                    disabled={isRunning}
                    onclick={() => removeItem(item.id)}>Remove item</button
                  >
                </li>
              {/each}
            </ol>
          {/if}
        {/if}
      </section>
    </div>
  {/if}

  {#if !selectedPlaylist}
    <form class="playlist-form" onsubmit={handleRename}>
      <label for="local-playlist-rename-name-disabled">Rename selected playlist</label>
      <input id="local-playlist-rename-name-disabled" disabled value="" />
      <button type="submit" disabled>Rename playlist</button>
    </form>
    <button type="button" disabled>Remove playlist</button>
    <button type="button" disabled>Clear selected playlist</button>
  {/if}
</section>

<style>
  .local-playlists-panel {
    display: grid;
    gap: var(--space-md, 1rem);
  }

  .playlist-browser {
    display: grid;
    gap: var(--space-md, 1rem);
  }

  .playlist-form {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm, 0.5rem);
    align-items: end;
  }

  label {
    display: grid;
    gap: 0.25rem;
    font-weight: 600;
  }

  ul,
  ol {
    display: grid;
    gap: var(--space-xs, 0.25rem);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm, 0.5rem);
    align-items: center;
  }

  li[aria-current='true'] > span:first-child {
    font-weight: 700;
  }

  .local-playlists-alert {
    border: 1px solid currentColor;
    padding: var(--space-sm, 0.5rem);
  }
</style>
