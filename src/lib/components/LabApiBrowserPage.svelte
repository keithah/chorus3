<script lang="ts">
  import { labApiBrowserStore } from '$lib/stores/labApiBrowser.svelte';
  import type { TranslationContext } from '$lib/i18n';
  import LabApiBrowserPanel from './LabApiBrowserPanel.svelte';

  interface Props {
    i18n: TranslationContext;
    initialMethod?: string;
  }

  let { i18n, initialMethod = '' }: Props = $props();

  const snapshot = $derived(labApiBrowserStore.snapshot);
  const dispatch = {
    loadIntrospection: () => labApiBrowserStore.loadIntrospection(),
    retryIntrospection: () => labApiBrowserStore.loadIntrospection(),
    selectMethod: (methodName: string) => labApiBrowserStore.selectMethod(methodName),
    setParamsText: (paramsText: string) => labApiBrowserStore.setParamsText(paramsText),
    runSelectedMethod: () => labApiBrowserStore.runSelectedMethod(),
    confirmSelectedMethod: () => labApiBrowserStore.confirmSelectedMethod(),
    clearConfirmation: () => labApiBrowserStore.clearConfirmation()
  };
</script>

<LabApiBrowserPanel {snapshot} {dispatch} {i18n} {initialMethod} />
