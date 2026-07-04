<script lang="ts" module>
  import type {
    MetadataEditorDefinition,
    MetadataEditorPayload
  } from '$lib/metadata/metadataEditor';

  export interface MetadataEditDialogHarnessProps {
    definition: MetadataEditorDefinition;
    initialSource: Record<string, unknown>;
    onSave: (payload: MetadataEditorPayload) => void | Promise<void>;
    onCancel: () => void;
  }
</script>

<script lang="ts">
  import MetadataEditDialog from '$lib/components/MetadataEditDialog.svelte';

  let { definition, initialSource, onSave, onCancel }: MetadataEditDialogHarnessProps = $props();
  let source = $state<Record<string, unknown>>({});
  let initialized = false;

  $effect(() => {
    if (initialized) {
      return;
    }

    source = initialSource;
    initialized = true;
  });

  export function refreshSource(nextSource: Record<string, unknown>): void {
    source = nextSource;
  }
</script>

<MetadataEditDialog {definition} {source} {onSave} {onCancel} />
