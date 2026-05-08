<script lang="ts" module>
  import type { TranslationContext } from '$lib/i18n';
  import type { LabApiBrowserStoreSnapshot } from '$lib/stores/labApiBrowser.svelte';

  export interface LabApiBrowserPanelDispatch {
    loadIntrospection: () => void | Promise<void>;
    retryIntrospection: () => void | Promise<void>;
    selectMethod: (methodName: string) => void | Promise<void>;
    setParamsText: (paramsText: string) => void | Promise<void>;
    runSelectedMethod: () => void | Promise<void>;
    confirmSelectedMethod: () => void | Promise<void>;
    clearConfirmation: () => void | Promise<void>;
  }
</script>

<script lang="ts">
  import { redactDiagnosticText, redactJsonForDisplay } from '$lib/safety/redaction';

  interface Props {
    snapshot: LabApiBrowserStoreSnapshot;
    dispatch: LabApiBrowserPanelDispatch;
    i18n: TranslationContext;
    initialMethod?: string;
  }
  let { snapshot, dispatch, i18n, initialMethod = '' }: Props = $props();
  let lastInitialMethod = $state('');
  const hasMethods = $derived(snapshot.methods.length > 0);
  const selectedMethod = $derived(snapshot.selectedMethod);
  const selectedMethodName = $derived(snapshot.selectedMethodName ?? '');
  const guardDecision = $derived(snapshot.guardDecision ?? selectedMethod?.guard ?? null);
  const isIntrospectionBusy = $derived(snapshot.introspectionStatus === 'loading');
  const isCallBusy = $derived(snapshot.callStatus === 'pending');
  const canRun = $derived(Boolean(selectedMethodName) && !isCallBusy && !guardDecision?.blocked);
  function callLoad(): void {
    void dispatch.loadIntrospection();
  }
  function callRetry(): void {
    void dispatch.retryIntrospection();
  }
  function selectMethod(event: Event): void {
    const select = event.currentTarget;
    if (select instanceof HTMLSelectElement) void dispatch.selectMethod(select.value);
  }
  function setParamsText(event: Event): void {
    const textarea = event.currentTarget;
    if (textarea instanceof HTMLTextAreaElement) void dispatch.setParamsText(textarea.value);
  }
  function runSelectedMethod(): void {
    if (canRun) void dispatch.runSelectedMethod();
  }
  function confirmSelectedMethod(): void {
    void dispatch.confirmSelectedMethod();
  }
  function clearConfirmation(): void {
    void dispatch.clearConfirmation();
  }
  function introspectionStatusCopy(): string {
    if (snapshot.introspectionStatus === 'loading') return i18n.t('lab.api.introspection.loading');
    if (snapshot.introspectionStatus === 'success') return i18n.t('lab.api.introspection.success');
    if (snapshot.introspectionStatus === 'error') return i18n.t('lab.api.introspection.error');
    return i18n.t('lab.api.introspection.idle');
  }
  function callStatusCopy(): string {
    if (snapshot.callStatus === 'pending') return i18n.t('lab.api.call.pending');
    if (snapshot.callStatus === 'success') return i18n.t('lab.api.call.success');
    if (snapshot.callStatus === 'error') return i18n.t('lab.api.call.error');
    if (snapshot.callStatus === 'needs-confirmation')
      return i18n.t('lab.api.call.needsConfirmation');
    if (snapshot.callStatus === 'blocked') return i18n.t('lab.api.call.blocked');
    return i18n.t('lab.api.call.idle');
  }
  function safeText(value: unknown): string {
    return redactDiagnosticText(value);
  }
  function safeJsonText(value: unknown): string {
    if (value == null || value === '') return i18n.t('lab.api.noRedactedJson');
    if (typeof value !== 'string') return redactJsonForDisplay(value);
    try {
      return redactJsonForDisplay(JSON.parse(value));
    } catch {
      return safeText(value);
    }
  }
  function metadataJson(value: unknown): string {
    if (value == null) return i18n.t('lab.api.noMetadata');
    return redactJsonForDisplay(value);
  }
  function methodOptionLabel(method: LabApiBrowserStoreSnapshot['methods'][number]): string {
    if (method.guard.blocked)
      return i18n.t('lab.api.option.blocked', { method: safeText(method.name) });
    if (method.guard.requiresConfirmation)
      return i18n.t('lab.api.option.confirmationRequired', { method: safeText(method.name) });
    return safeText(method.name);
  }
  function endpointCopy(): string | null {
    const endpoint = snapshot.lastError?.endpoint;
    if (!endpoint) return null;
    const host = safeText(endpoint.host);
    const port = Number.isFinite(endpoint.port) ? `:${endpoint.port}` : '';
    const timeout = Number.isFinite(endpoint.timeoutMs)
      ? `${endpoint.timeoutMs}ms`
      : i18n.t('lab.api.endpoint.defaultTimeout');
    const credentials = endpoint.hasCredentials
      ? i18n.t('lab.api.endpoint.credentials')
      : i18n.t('lab.api.endpoint.noCredentials');
    return i18n.t('lab.api.endpoint', { host, port, timeout, credentials });
  }

  $effect(() => {
    const requestedMethod = initialMethod.trim();

    if (!requestedMethod || requestedMethod === lastInitialMethod) {
      return;
    }

    lastInitialMethod = requestedMethod;

    if (snapshot.introspectionStatus === 'idle') {
      void dispatch.loadIntrospection();
    }
  });

  $effect(() => {
    const requestedMethod = initialMethod.trim();

    if (
      requestedMethod &&
      snapshot.introspectionStatus === 'success' &&
      snapshot.selectedMethodName !== requestedMethod
    ) {
      void dispatch.selectMethod(requestedMethod);
    }
  });
</script>

<section class="lab-api-browser-panel surface" aria-labelledby="lab-api-browser-title">
  <header class="lab-api-browser-panel__hero">
    <div>
      <p class="section-kicker">{i18n.t('lab.api.eyebrow')}</p>
      <h2 id="lab-api-browser-title">{i18n.t('lab.api.title')}</h2>
      <p>{i18n.t('lab.api.description')}</p>
    </div>
    <button
      type="button"
      class="lab-api-browser-panel__primary"
      onclick={callLoad}
      disabled={isIntrospectionBusy}>{i18n.t('lab.api.loadMethods')}</button
    >
  </header>
  <div class="lab-api-browser-panel__status-grid" aria-label={i18n.t('lab.api.statusAria')}>
    <div class="lab-api-browser-panel__status" role="status" aria-live="polite" aria-atomic="true">
      <span>{i18n.t('lab.api.introspection')}</span><strong>{introspectionStatusCopy()}</strong>
    </div>
    <div class="lab-api-browser-panel__status" role="status" aria-live="polite" aria-atomic="true">
      <span>{i18n.t('lab.api.call')}</span><strong>{callStatusCopy()}</strong>
    </div>
    <div class="lab-api-browser-panel__status">
      <span>{i18n.t('lab.api.selectedMethod')}</span><strong
        >{selectedMethodName
          ? safeText(selectedMethodName)
          : i18n.t('lab.api.noMethodSelected')}</strong
      >
    </div>
  </div>
  {#if snapshot.lastError}<div class="lab-api-browser-panel__alert" role="alert">
      <strong>{safeText(snapshot.lastError.code)}</strong><span
        >{safeText(snapshot.lastError.message)}</span
      >{#if endpointCopy()}<span>{endpointCopy()}</span>{/if}
    </div>{/if}
  {#if snapshot.introspectionStatus === 'error'}<div
      class="lab-api-browser-panel__guidance"
      role="note"
    >
      <p>{i18n.t('lab.api.errorGuidance')}</p>
      <button type="button" aria-label={i18n.t('lab.api.retryIntrospection')} onclick={callRetry}
        >{i18n.t('lab.api.retryIntrospection')}</button
      >
    </div>{/if}
  <div class="lab-api-browser-panel__layout">
    <aside class="lab-api-browser-panel__sidebar" aria-label={i18n.t('lab.api.methodBrowserAria')}>
      <label for="lab-api-method-select">{i18n.t('lab.api.methodLabel')}</label><select
        id="lab-api-method-select"
        data-lab-api-method-select
        value={selectedMethodName}
        onchange={selectMethod}
        disabled={!hasMethods || isCallBusy}
        >{#if !hasMethods}<option value="">{i18n.t('lab.api.noMethodsOption')}</option
          >{:else}{#each snapshot.namespaces as namespace (namespace.name)}<optgroup
              label={safeText(namespace.name)}
              >{#each namespace.methods as method (method.name)}<option value={method.name}
                  >{methodOptionLabel(method)}</option
                >{/each}</optgroup
            >{/each}{/if}</select
      >{#if !hasMethods}<p class="lab-api-browser-panel__empty">
          {i18n.t('lab.api.noMethods')}
        </p>{/if}
      <div class="lab-api-browser-panel__method-count" aria-label="Method count">
        {i18n.t('lab.api.methodCount', {
          methods: snapshot.methods.length,
          namespaces: snapshot.namespaces.length
        })}
      </div>
    </aside>
    <div class="lab-api-browser-panel__content">
      <section class="lab-api-browser-panel__card" aria-labelledby="lab-api-method-title">
        <div class="lab-api-browser-panel__card-heading">
          <div>
            <h3 id="lab-api-method-title">
              {selectedMethod ? safeText(selectedMethod.name) : i18n.t('lab.api.selectMethod')}
            </h3>
            <p>
              {selectedMethod?.description
                ? safeText(selectedMethod.description)
                : i18n.t('lab.api.metadataFallback')}
            </p>
          </div>
          {#if guardDecision}<span
              class:blocked={guardDecision.blocked}
              class="lab-api-browser-panel__guard-pill"
              >{i18n.t('lab.api.guardPill', { level: safeText(guardDecision.level) })}</span
            >{/if}
        </div>
        {#if guardDecision}<div
            class="lab-api-browser-panel__guard"
            aria-live="polite"
            aria-atomic="true"
          >
            <strong>{safeText(guardDecision.reason)}</strong
            >{#if guardDecision.requiresConfirmation}<span
                >{i18n.t('lab.api.guardRequiresConfirmation')}</span
              >{/if}{#if guardDecision.blocked}<span>{i18n.t('lab.api.guardBlocked')}</span>{/if}
          </div>{/if}
        <div class="lab-api-browser-panel__metadata-grid">
          <div>
            <h4>{i18n.t('lab.api.paramsMetadata')}</h4>
            <pre>{metadataJson(selectedMethod?.params)}</pre>
          </div>
          <div>
            <h4>{i18n.t('lab.api.returnMetadata')}</h4>
            <pre>{metadataJson(selectedMethod?.returns)}</pre>
          </div>
        </div>
      </section>
      <section class="lab-api-browser-panel__card" aria-labelledby="lab-api-params-title">
        <div class="lab-api-browser-panel__card-heading">
          <div>
            <h3 id="lab-api-params-title">{i18n.t('lab.api.jsonParams')}</h3>
            <p>{i18n.t('lab.api.paramsDescription')}</p>
          </div>
        </div>
        <label for="lab-api-params-editor">{i18n.t('lab.api.paramsObject')}</label><textarea
          id="lab-api-params-editor"
          data-lab-api-params-editor
          aria-label={i18n.t('lab.api.paramsObject')}
          aria-invalid={snapshot.validationError ? 'true' : 'false'}
          aria-describedby="lab-api-params-help lab-api-validation-message"
          value={snapshot.paramsText}
          oninput={setParamsText}
          disabled={isCallBusy}
        ></textarea>
        <p id="lab-api-params-help" class="lab-api-browser-panel__help">
          {i18n.t('lab.api.paramsHelp')}
        </p>
        {#if snapshot.validationError}<p
            id="lab-api-validation-message"
            class="lab-api-browser-panel__validation"
            role="alert"
          >
            {safeText(snapshot.validationError)}
          </p>{/if}
        <div class="lab-api-browser-panel__actions">
          <button
            type="button"
            aria-label={i18n.t('lab.api.runSelectedAria')}
            onclick={runSelectedMethod}
            disabled={!canRun}>{i18n.t('lab.api.runSelected')}</button
          >
        </div>
      </section>
      {#if snapshot.confirmation}<section
          class="lab-api-browser-panel__card lab-api-browser-panel__confirmation"
          aria-labelledby="lab-api-confirmation-title"
          aria-live="polite"
          aria-atomic="true"
        >
          <h3 id="lab-api-confirmation-title">
            {snapshot.confirmation.confirmed
              ? i18n.t('lab.api.confirmedMethod')
              : i18n.t('lab.api.confirmationRequired')}
          </h3>
          <p>
            {snapshot.confirmation.confirmed
              ? i18n.t('lab.api.confirmedFor', { method: safeText(snapshot.confirmation.method) })
              : i18n.t('lab.api.confirmBefore', { method: safeText(snapshot.confirmation.method) })}
          </p>
          <p>
            {i18n.t('lab.api.requestedAt', {
              requestedAt: safeText(snapshot.confirmation.requestedAt)
            })}
          </p>
          <div class="lab-api-browser-panel__actions">
            {#if !snapshot.confirmation.confirmed}<button
                type="button"
                aria-label={i18n.t('lab.api.confirmMethodAria')}
                onclick={confirmSelectedMethod}>{i18n.t('lab.api.confirmMethod')}</button
              >{/if}<button type="button" onclick={clearConfirmation}
              >{i18n.t('lab.api.clearConfirmation')}</button
            >
          </div>
        </section>{:else if guardDecision?.requiresConfirmation}<section
          class="lab-api-browser-panel__card lab-api-browser-panel__confirmation"
          aria-labelledby="lab-api-confirmation-title"
        >
          <h3 id="lab-api-confirmation-title">{i18n.t('lab.api.confirmationRequiredForMethod')}</h3>
          <p>{i18n.t('lab.api.confirmationHint')}</p>
        </section>{/if}
      {#if snapshot.lastCall}<section
          class="lab-api-browser-panel__card"
          aria-labelledby="lab-api-last-call-title"
        >
          <h3 id="lab-api-last-call-title">{i18n.t('lab.api.lastCall')}</h3>
          <dl class="lab-api-browser-panel__facts">
            <div>
              <dt>{i18n.t('lab.api.method')}</dt>
              <dd>{safeText(snapshot.lastCall.method)}</dd>
            </div>
            <div>
              <dt>{i18n.t('lab.api.guard')}</dt>
              <dd>{safeText(snapshot.lastCall.guardLevel)}</dd>
            </div>
            <div>
              <dt>{i18n.t('lab.api.requested')}</dt>
              <dd>{safeText(snapshot.lastCall.requestedAt)}</dd>
            </div>
            <div>
              <dt>{i18n.t('lab.api.completed')}</dt>
              <dd>
                {snapshot.lastCall.completedAt
                  ? safeText(snapshot.lastCall.completedAt)
                  : i18n.t('lab.api.pending')}
              </dd>
            </div>
          </dl>
        </section>{/if}
      <section class="lab-api-browser-panel__card" aria-labelledby="lab-api-redacted-json-title">
        <h3 id="lab-api-redacted-json-title">{i18n.t('lab.api.redactedDiagnostics')}</h3>
        <div class="lab-api-browser-panel__diagnostics-grid">
          <div>
            <h4>{i18n.t('lab.api.requestJson')}</h4>
            <pre>{safeJsonText(snapshot.rawRequestJson)}</pre>
          </div>
          <div>
            <h4>{i18n.t('lab.api.responseJson')}</h4>
            <pre>{safeJsonText(snapshot.rawResponseJson)}</pre>
          </div>
          <div>
            <h4>{i18n.t('lab.api.errorJson')}</h4>
            <pre>{safeJsonText(snapshot.rawErrorJson)}</pre>
          </div>
        </div>
      </section>
    </div>
  </div>
</section>

<style>
  .lab-api-browser-panel {
    display: grid;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-2xl));
  }

  .lab-api-browser-panel__hero,
  .lab-api-browser-panel__status-grid,
  .lab-api-browser-panel__layout,
  .lab-api-browser-panel__card-heading,
  .lab-api-browser-panel__metadata-grid,
  .lab-api-browser-panel__diagnostics-grid,
  .lab-api-browser-panel__facts {
    display: grid;
    gap: var(--space-md);
  }

  .lab-api-browser-panel__hero {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }

  .section-kicker,
  .lab-api-browser-panel__status span,
  .lab-api-browser-panel__method-count,
  .lab-api-browser-panel__facts dt {
    margin: 0;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h2,
  h3,
  h4,
  p,
  dl,
  dd {
    margin: 0;
  }

  h2 {
    font-size: clamp(2rem, 5vw, 4rem);
    line-height: 0.95;
  }

  p,
  dd,
  label,
  button,
  select,
  textarea {
    line-height: 1.5;
  }

  button,
  select,
  textarea {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  button {
    cursor: pointer;
  }

  button:disabled,
  select:disabled,
  textarea:disabled {
    cursor: not-allowed;
    opacity: 0.58;
  }

  .lab-api-browser-panel__primary,
  .lab-api-browser-panel__actions button,
  .lab-api-browser-panel__guidance button {
    padding: var(--space-xs) var(--space-md);
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-surface-raised) 84%, transparent);
  }

  .lab-api-browser-panel__primary,
  .lab-api-browser-panel__actions button:first-child {
    font-weight: 800;
  }

  .lab-api-browser-panel__primary:not(:disabled):hover,
  .lab-api-browser-panel__actions button:not(:disabled):hover,
  .lab-api-browser-panel__guidance button:not(:disabled):hover {
    border-color: color-mix(in srgb, var(--color-accent) 48%, var(--color-border));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 18%, transparent);
  }

  .lab-api-browser-panel__status-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .lab-api-browser-panel__status,
  .lab-api-browser-panel__alert,
  .lab-api-browser-panel__guidance,
  .lab-api-browser-panel__sidebar,
  .lab-api-browser-panel__card {
    padding: var(--space-md);
    background: color-mix(in srgb, var(--color-surface) 88%, transparent);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  .lab-api-browser-panel__status,
  .lab-api-browser-panel__alert,
  .lab-api-browser-panel__guidance,
  .lab-api-browser-panel__sidebar,
  .lab-api-browser-panel__card,
  .lab-api-browser-panel__guard,
  .lab-api-browser-panel__confirmation,
  .lab-api-browser-panel__content {
    display: grid;
    gap: var(--space-sm);
  }

  .lab-api-browser-panel__alert,
  .lab-api-browser-panel__validation,
  .lab-api-browser-panel__guard-pill.blocked {
    color: var(--color-danger, var(--color-warning));
  }

  .lab-api-browser-panel__alert,
  .lab-api-browser-panel__validation {
    border-color: color-mix(
      in srgb,
      var(--color-danger, var(--color-warning)) 42%,
      var(--color-border)
    );
  }

  .lab-api-browser-panel__layout {
    grid-template-columns: minmax(14rem, 0.7fr) minmax(0, 2fr);
    align-items: start;
  }

  .lab-api-browser-panel__content {
    min-width: 0;
  }

  .lab-api-browser-panel__card-heading {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .lab-api-browser-panel__guard-pill,
  .lab-api-browser-panel__guard,
  .lab-api-browser-panel__help,
  .lab-api-browser-panel__empty {
    color: var(--color-text-muted);
  }

  .lab-api-browser-panel__guard-pill {
    padding: 0.2rem 0.55rem;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
  }

  select,
  textarea {
    width: 100%;
    padding: var(--space-xs) var(--space-sm);
    color: var(--color-text);
    background: var(--color-surface-raised);
  }

  textarea {
    min-height: 10rem;
    font-family: var(--font-mono);
    resize: vertical;
  }

  pre {
    max-height: 18rem;
    margin: 0;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
    padding: var(--space-sm);
    background: color-mix(in srgb, var(--color-background) 50%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-border) 76%, transparent);
    border-radius: var(--radius-md);
    font-family: var(--font-mono);
    font-size: 0.82rem;
  }

  .lab-api-browser-panel__metadata-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .lab-api-browser-panel__diagnostics-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .lab-api-browser-panel__facts {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .lab-api-browser-panel__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  @media (max-width: 900px) {
    .lab-api-browser-panel__hero,
    .lab-api-browser-panel__status-grid,
    .lab-api-browser-panel__layout,
    .lab-api-browser-panel__card-heading,
    .lab-api-browser-panel__metadata-grid,
    .lab-api-browser-panel__diagnostics-grid,
    .lab-api-browser-panel__facts {
      grid-template-columns: 1fr;
    }
  }
</style>
