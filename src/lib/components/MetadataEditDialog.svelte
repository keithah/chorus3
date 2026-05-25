<script lang="ts">
  import {
    createMetadataEditorInitialValues,
    createMetadataEditorSavePayload,
    displayTitleForMetadataEditor,
    type MetadataEditorDefinition,
    type MetadataEditorPayload,
    type MetadataEditorValues
  } from '$lib/metadata/metadataEditor';

  interface Props {
    definition: MetadataEditorDefinition;
    source: Record<string, unknown>;
    pending?: boolean;
    error?: string | null;
    onSave: (payload: MetadataEditorPayload) => void | Promise<void>;
    onCancel: () => void;
  }

  let { definition, source, pending = false, error = null, onSave, onCancel }: Props = $props();
  let values = $state<MetadataEditorValues>({});
  let dirtyKeys = $state<Set<string>>(new Set());
  let activeSectionIndex = $state(0);
  const activeSection = $derived(definition.sections[activeSectionIndex] ?? definition.sections[0]);
  const heading = $derived(
    `Edit ${definition.title}: ${displayTitleForMetadataEditor(definition, source, definition.title)}`
  );

  function updateField(key: string, event: Event): void {
    const control = event.currentTarget;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) return;
    values = { ...values, [key]: control.value };
    dirtyKeys = new Set([...dirtyKeys, key]);
  }

  function submit(event: SubmitEvent): void {
    event.preventDefault();
    void onSave(createMetadataEditorSavePayload(definition, values, dirtyKeys));
  }

  function inputType(input: string): string {
    return input === 'url' ? 'text' : input;
  }

  $effect(() => {
    values = createMetadataEditorInitialValues(definition, source);
    dirtyKeys = new Set();
    activeSectionIndex = 0;
  });
</script>

<div class="metadata-edit-backdrop" role="presentation">
  <div
    class="metadata-edit-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="metadata-edit-title"
  >
    <header>
      <div>
        <h2 id="metadata-edit-title">{heading}</h2>
      </div>
      <button
        type="button"
        class="metadata-edit-close"
        aria-label="Close editor"
        onclick={onCancel}
      >
        ×
      </button>
    </header>

    <div class="metadata-edit-tabs" role="tablist" aria-label="Metadata editor sections">
      {#each definition.sections as section, index}
        <button
          type="button"
          role="tab"
          aria-selected={index === activeSectionIndex}
          class:active={index === activeSectionIndex}
          onclick={() => (activeSectionIndex = index)}
        >
          {section.title}
        </button>
      {/each}
    </div>

    <form onsubmit={submit}>
      {#if activeSection}
        <fieldset disabled={pending}>
          <legend>{activeSection.title}</legend>
          {#each activeSection.fields as field}
            <label class="metadata-edit-field">
              <span>{field.label}</span>
              {#if field.input === 'textarea'}
                <textarea
                  name={field.key}
                  value={values[field.key] ?? ''}
                  readonly={field.readOnly}
                  disabled={field.readOnly}
                  oninput={(event) => updateField(field.key, event)}
                ></textarea>
              {:else}
                <input
                  name={field.key}
                  type={inputType(field.input)}
                  value={values[field.key] ?? ''}
                  readonly={field.readOnly}
                  disabled={field.readOnly}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  oninput={(event) => updateField(field.key, event)}
                />
              {/if}
            </label>
          {/each}
        </fieldset>
      {/if}

      {#if error}
        <p class="metadata-edit-error" role="alert">{error}</p>
      {/if}

      <footer>
        <button type="button" onclick={onCancel} disabled={pending}>Cancel</button>
        <button type="submit" class="metadata-edit-save" disabled={pending}>
          {pending ? 'Saving...' : 'Save'}
        </button>
      </footer>
    </form>
  </div>
</div>

<style>
  .metadata-edit-backdrop {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: rgb(0 0 0 / 0.5);
  }

  .metadata-edit-dialog {
    width: min(52rem, 100%);
    max-height: min(48rem, calc(100vh - 2rem));
    overflow: auto;
    background: #fff;
    color: #333;
    border-radius: 4px;
    box-shadow: 0 18px 45px rgb(0 0 0 / 0.35);
  }

  .metadata-edit-dialog > header,
  .metadata-edit-dialog footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #ddd;
  }

  .metadata-edit-dialog footer {
    justify-content: flex-end;
    border-top: 1px solid #ddd;
    border-bottom: 0;
  }

  .metadata-edit-dialog h2 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .metadata-edit-close {
    width: 2rem;
    height: 2rem;
    border: 0;
    background: transparent;
    font-size: 1.6rem;
    line-height: 1;
  }

  .metadata-edit-tabs {
    display: flex;
    gap: 0.25rem;
    overflow-x: auto;
    padding: 0.75rem 1.25rem 0;
    border-bottom: 1px solid #ddd;
  }

  .metadata-edit-tabs button {
    border: 1px solid #ccc;
    border-bottom: 0;
    padding: 0.5rem 0.75rem;
    background: #f5f5f5;
    color: #333;
  }

  .metadata-edit-tabs button.active {
    background: #fff;
    font-weight: 600;
  }

  .metadata-edit-dialog fieldset {
    display: grid;
    gap: 0.8rem;
    margin: 0;
    padding: 1.25rem;
    border: 0;
  }

  .metadata-edit-dialog legend {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .metadata-edit-field {
    display: grid;
    gap: 0.3rem;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .metadata-edit-field input,
  .metadata-edit-field textarea {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    border: 1px solid #bbb;
    border-radius: 3px;
    padding: 0.55rem 0.65rem;
    color: #222;
    font: inherit;
    font-weight: 400;
  }

  .metadata-edit-field textarea {
    min-height: 6rem;
    resize: vertical;
  }

  .metadata-edit-field input:disabled,
  .metadata-edit-field textarea:disabled {
    background: #eee;
    color: #666;
  }

  .metadata-edit-error {
    margin: 0 1.25rem 1rem;
    color: #9f1d1d;
  }
</style>
