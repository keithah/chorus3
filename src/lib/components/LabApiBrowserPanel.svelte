<script lang="ts" module>
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
  }

  let { snapshot, dispatch }: Props = $props();

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
    if (!(select instanceof HTMLSelectElement)) return;
    void dispatch.selectMethod(select.value);
  }

  function setParamsText(event: Event): void {
    const textarea = event.currentTarget;
    if (!(textarea instanceof HTMLTextAreaElement)) return;
    void dispatch.setParamsText(textarea.value);
  }

  function runSelectedMethod(): void {
    if (!canRun) return;
    void dispatch.runSelectedMethod();
  }

  function confirmSelectedMethod(): void {
    void dispatch.confirmSelectedMethod();
  }

  function clearConfirmation(): void {
    void dispatch.clearConfirmation();
  }

  function introspectionStatusCopy(): string {
    if (snapshot.introspectionStatus === 'loading') return 'Loading JSON-RPC introspection.';
    if (snapshot.introspectionStatus === 'success') return 'Introspection loaded.';
    if (snapshot.introspectionStatus === 'error') return 'Introspection could not be loaded.';
    return 'Introspection has not been loaded yet.';
  }

  function callStatusCopy(): string {
    if (snapshot.callStatus === 'pending') return 'JSON-RPC call is running.';
    if (snapshot.callStatus === 'success') return 'JSON-RPC call succeeded.';
    if (snapshot.callStatus === 'error') return 'JSON-RPC call failed.';
    if (snapshot.callStatus === 'needs-confirmation') return 'Confirmation required.';
    if (snapshot.callStatus === 'blocked') return 'JSON-RPC call blocked.';
    return 'No JSON-RPC call is running.';
  }

  function safeText(value: unknown): string {
    return redactDiagnosticText(value);
  }

  function safeJsonText(value: unknown): string {
    if (value == null || value === '') return 'No redacted JSON is available.';
    if (typeof value !== 'string') return redactJsonForDisplay(value);

    try {
      return redactJsonForDisplay(JSON.parse(value));
    } catch {
      return safeText(value);
    }
  }

  function metadataJson(value: unknown): string {
    if (value == null) return 'No metadata available.';
    return redactJsonForDisplay(value);
  }

  function methodOptionLabel(method: LabApiBrowserStoreSnapshot['methods'][number]): string {
    if (method.guard.blocked) return `${safeText(method.name)} — blocked`;
    if (method.guard.requiresConfirmation)
      return `${safeText(method.name)} — confirmation required`;
    return safeText(method.name);
  }

  function endpointCopy(): string | null {
    const endpoint = snapshot.lastError?.endpoint;
    if (!endpoint) return null;
    const host = safeText(endpoint.host);
    const port = Number.isFinite(endpoint.port) ? `:${endpoint.port}` : '';
    const timeout = Number.isFinite(endpoint.timeoutMs)
      ? `${endpoint.timeoutMs}ms`
      : 'default timeout';
    return `Endpoint: ${host}${port} (${timeout}, ${endpoint.hasCredentials ? 'configured credentials' : 'no configured credentials'}).`;
  }
</script>

<section class="lab-api-browser-panel surface" aria-labelledby="lab-api-browser-title">
  <header class="lab-api-browser-panel__hero">
    <div>
      <p class="section-kicker">Lab utility</p>
      <h2 id="lab-api-browser-title">Lab API browser</h2>
      <p>
        Inspect Kodi JSON-RPC methods, prepare object params, and run guarded calls through an
        injected Lab store dispatch.
      </p>
    </div>
    <button
      type="button"
      class="lab-api-browser-panel__primary"
      onclick={callLoad}
      disabled={isIntrospectionBusy}
    >
      Load JSON-RPC methods
    </button>
  </header>

  <div class="lab-api-browser-panel__status-grid" aria-label="Lab API browser status">
    <div class="lab-api-browser-panel__status" role="status" aria-live="polite" aria-atomic="true">
      <span>Introspection</span>
      <strong>{introspectionStatusCopy()}</strong>
    </div>
    <div class="lab-api-browser-panel__status" role="status" aria-live="polite" aria-atomic="true">
      <span>Call</span>
      <strong>{callStatusCopy()}</strong>
    </div>
    <div class="lab-api-browser-panel__status">
      <span>Selected method</span>
      <strong>{selectedMethodName ? safeText(selectedMethodName) : 'No method selected.'}</strong>
    </div>
  </div>

  {#if snapshot.lastError}
    <div class="lab-api-browser-panel__alert" role="alert">
      <strong>{safeText(snapshot.lastError.code)}</strong>
      <span>{safeText(snapshot.lastError.message)}</span>
      {#if endpointCopy()}
        <span>{endpointCopy()}</span>
      {/if}
    </div>
  {/if}

  {#if snapshot.introspectionStatus === 'error'}
    <div class="lab-api-browser-panel__guidance" role="note">
      <p>
        If no active host is configured, choose one before using the Lab API browser. Introspection
        can be retried after the host is available.
      </p>
      <button type="button" aria-label="Retry JSON-RPC introspection" onclick={callRetry}>
        Retry introspection
      </button>
    </div>
  {/if}

  <div class="lab-api-browser-panel__layout">
    <aside class="lab-api-browser-panel__sidebar" aria-label="JSON-RPC method browser">
      <label for="lab-api-method-select">JSON-RPC method</label>
      <select
        id="lab-api-method-select"
        data-lab-api-method-select
        value={selectedMethodName}
        onchange={selectMethod}
        disabled={!hasMethods || isCallBusy}
      >
        {#if !hasMethods}
          <option value="">No methods available</option>
        {:else}
          {#each snapshot.namespaces as namespace (namespace.name)}
            <optgroup label={safeText(namespace.name)}>
              {#each namespace.methods as method (method.name)}
                <option value={method.name}>{methodOptionLabel(method)}</option>
              {/each}
            </optgroup>
          {/each}
        {/if}
      </select>

      {#if !hasMethods}
        <p class="lab-api-browser-panel__empty">No JSON-RPC methods are available.</p>
      {/if}

      <div class="lab-api-browser-panel__method-count" aria-label="Method count">
        {snapshot.methods.length} methods across {snapshot.namespaces.length} namespaces.
      </div>
    </aside>

    <div class="lab-api-browser-panel__content">
      <section class="lab-api-browser-panel__card" aria-labelledby="lab-api-method-title">
        <div class="lab-api-browser-panel__card-heading">
          <div>
            <h3 id="lab-api-method-title">
              {selectedMethod ? safeText(selectedMethod.name) : 'Select a method'}
            </h3>
            <p>
              {selectedMethod?.description
                ? safeText(selectedMethod.description)
                : 'Method metadata appears after introspection.'}
            </p>
          </div>
          {#if guardDecision}
            <span class:blocked={guardDecision.blocked} class="lab-api-browser-panel__guard-pill">
              Guard: {safeText(guardDecision.level)}
            </span>
          {/if}
        </div>

        {#if guardDecision}
          <div class="lab-api-browser-panel__guard" aria-live="polite" aria-atomic="true">
            <strong>{safeText(guardDecision.reason)}</strong>
            {#if guardDecision.requiresConfirmation}
              <span>This method requires explicit confirmation before execution.</span>
            {/if}
            {#if guardDecision.blocked}
              <span>Execution is disabled for this method.</span>
            {/if}
          </div>
        {/if}

        <div class="lab-api-browser-panel__metadata-grid">
          <div>
            <h4>Params metadata</h4>
            <pre>{metadataJson(selectedMethod?.params)}</pre>
          </div>
          <div>
            <h4>Return metadata</h4>
            <pre>{metadataJson(selectedMethod?.returns)}</pre>
          </div>
        </div>
      </section>

      <section class="lab-api-browser-panel__card" aria-labelledby="lab-api-params-title">
        <div class="lab-api-browser-panel__card-heading">
          <div>
            <h3 id="lab-api-params-title">JSON params</h3>
            <p>Params must be JSON object text. Empty text is treated as an empty object.</p>
          </div>
        </div>

        <label for="lab-api-params-editor">JSON-RPC params object</label>
        <textarea
          id="lab-api-params-editor"
          data-lab-api-params-editor
          aria-label="JSON-RPC params object"
          aria-invalid={snapshot.validationError ? 'true' : 'false'}
          aria-describedby="lab-api-params-help lab-api-validation-message"
          value={snapshot.paramsText}
          oninput={setParamsText}
          disabled={isCallBusy}
        ></textarea>
        <p id="lab-api-params-help" class="lab-api-browser-panel__help">
          Use only object-shaped params. Validation and guard decisions are performed by the store.
        </p>
        {#if snapshot.validationError}
          <p id="lab-api-validation-message" class="lab-api-browser-panel__validation" role="alert">
            {safeText(snapshot.validationError)}
          </p>
        {/if}

        <div class="lab-api-browser-panel__actions">
          <button
            type="button"
            aria-label="Run selected JSON-RPC method"
            onclick={runSelectedMethod}
            disabled={!canRun}
          >
            Run selected method
          </button>
        </div>
      </section>

      {#if snapshot.confirmation}
        <section
          class="lab-api-browser-panel__card lab-api-browser-panel__confirmation"
          aria-labelledby="lab-api-confirmation-title"
          aria-live="polite"
          aria-atomic="true"
        >
          <h3 id="lab-api-confirmation-title">
            {snapshot.confirmation.confirmed ? 'Confirmed method' : 'Confirmation required'}
          </h3>
          <p>
            {snapshot.confirmation.confirmed
              ? `Confirmed for ${safeText(snapshot.confirmation.method)}.`
              : `Confirm before running ${safeText(snapshot.confirmation.method)}.`}
          </p>
          <p>Requested at {safeText(snapshot.confirmation.requestedAt)}.</p>
          <div class="lab-api-browser-panel__actions">
            {#if !snapshot.confirmation.confirmed}
              <button
                type="button"
                aria-label="Confirm selected JSON-RPC method"
                onclick={confirmSelectedMethod}
              >
                Confirm method
              </button>
            {/if}
            <button type="button" onclick={clearConfirmation}>Clear confirmation</button>
          </div>
        </section>
      {:else if guardDecision?.requiresConfirmation}
        <section
          class="lab-api-browser-panel__card lab-api-browser-panel__confirmation"
          aria-labelledby="lab-api-confirmation-title"
        >
          <h3 id="lab-api-confirmation-title">Confirmation required for this method</h3>
          <p>Run once to request confirmation, then confirm explicitly before running again.</p>
        </section>
      {/if}

      {#if snapshot.lastCall}
        <section class="lab-api-browser-panel__card" aria-labelledby="lab-api-last-call-title">
          <h3 id="lab-api-last-call-title">Last call</h3>
          <dl class="lab-api-browser-panel__facts">
            <div>
              <dt>Method</dt>
              <dd>{safeText(snapshot.lastCall.method)}</dd>
            </div>
            <div>
              <dt>Guard</dt>
              <dd>{safeText(snapshot.lastCall.guardLevel)}</dd>
            </div>
            <div>
              <dt>Requested</dt>
              <dd>{safeText(snapshot.lastCall.requestedAt)}</dd>
            </div>
            <div>
              <dt>Completed</dt>
              <dd>
                {snapshot.lastCall.completedAt
                  ? safeText(snapshot.lastCall.completedAt)
                  : 'Pending'}
              </dd>
            </div>
          </dl>
        </section>
      {/if}

      <section class="lab-api-browser-panel__card" aria-labelledby="lab-api-redacted-json-title">
        <h3 id="lab-api-redacted-json-title">Redacted JSON diagnostics</h3>
        <div class="lab-api-browser-panel__diagnostics-grid">
          <div>
            <h4>Request JSON</h4>
            <pre>{safeJsonText(snapshot.rawRequestJson)}</pre>
          </div>
          <div>
            <h4>Response JSON</h4>
            <pre>{safeJsonText(snapshot.rawResponseJson)}</pre>
          </div>
          <div>
            <h4>Error JSON</h4>
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
