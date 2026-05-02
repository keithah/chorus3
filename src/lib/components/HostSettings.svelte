<script lang="ts">
  import { configStore, hostConnectionStore, type ConfigValidationErrors } from '$lib/stores';
  import { createTranslationContext, type TranslationContext } from '$lib/i18n';

  interface Props {
    i18n?: TranslationContext;
  }

  type FieldName = 'label' | 'host' | 'port' | 'username' | 'password';

  let { i18n = createTranslationContext('en') }: Props = $props();

  let editingHostId = $state<string | null>(null);
  let label = $state('');
  let host = $state('');
  let port = $state('');
  let username = $state('');
  let password = $state('');
  let useTls = $state(false);
  let useWebSocket = $state(true);
  let localErrors = $state<ConfigValidationErrors>({});

  const snapshot = $derived(configStore.snapshot);
  const editingHost = $derived(
    editingHostId
      ? (snapshot.hosts.find((savedHost) => savedHost.id === editingHostId) ?? null)
      : null
  );
  const errors = $derived({ ...snapshot.validationErrors, ...localErrors });
  const submitLabel = $derived(
    editingHost ? i18n.t('hostSettings.action.updateHost') : i18n.t('hostSettings.action.saveHost')
  );

  function formatValidationError(field: keyof ConfigValidationErrors, message: string): string {
    const keyByFieldAndMessage: Partial<
      Record<keyof ConfigValidationErrors, Record<string, string>>
    > = {
      id: {
        'A saved Kodi host already exists for this id.': 'hostSettings.validation.id.duplicate',
        'No saved Kodi host exists for this id.': 'hostSettings.validation.id.missing',
        'Host id is required.': 'hostSettings.validation.id.required'
      },
      label: {
        'Label is required.': 'hostSettings.validation.label.required'
      },
      host: {
        'Saved Kodi host must be an object.': 'hostSettings.validation.host.object',
        'Host is required.': 'hostSettings.validation.host.required',
        'Host must not include a protocol, path, query string, or credentials.':
          'hostSettings.validation.host.safeShape'
      },
      port: {
        'HTTP port must be an integer between 1 and 65535.': 'hostSettings.validation.port.range'
      },
      username: {
        'Username cannot be blank when provided.': 'hostSettings.validation.username.blank',
        'Credential must not contain Authorization header content.':
          'hostSettings.validation.username.authorization'
      },
      password: {
        'Password cannot be blank when provided.': 'hostSettings.validation.password.blank',
        'Password must not contain Authorization header content.':
          'hostSettings.validation.password.authorization'
      },
      activeHostId: {
        'Choose a saved Kodi host before making it active.':
          'hostSettings.validation.activeHost.required'
      },
      useTls: {
        'useTls must be true or false.': 'hostSettings.validation.useTls.boolean'
      },
      useWebSocket: {
        'useWebSocket must be true or false.': 'hostSettings.validation.useWebSocket.boolean'
      }
    };
    const key = keyByFieldAndMessage[field]?.[message];

    return key ? i18n.t(key) : message;
  }

  function formatStorageWarning(): string | null {
    if (!snapshot.storageWarning) {
      return null;
    }

    return i18n.t(`hostSettings.storage.${snapshot.storageWarning.code}`);
  }

  function savedCountLabel(count: number): string {
    return i18n.t('hostSettings.saved.count', { count });
  }

  function errorId(field: FieldName): string {
    return `host-${field}-error`;
  }

  function descriptionId(field: FieldName): string | undefined {
    return errors[field] ? errorId(field) : undefined;
  }

  function isInvalid(field: FieldName): 'true' | undefined {
    return errors[field] ? 'true' : undefined;
  }

  function startEditing(hostId: string): void {
    const savedHost = snapshot.hosts.find((candidate) => candidate.id === hostId);

    if (!savedHost) {
      return;
    }

    editingHostId = savedHost.id;
    label = savedHost.label;
    host = savedHost.host;
    port = savedHost.port?.toString() ?? '';
    username = savedHost.username ?? '';
    password = '';
    useTls = savedHost.useTls;
    useWebSocket = savedHost.useWebSocket;
    localErrors = {};
  }

  function cancelEditing(): void {
    resetForm();
  }

  function deleteHost(hostId: string): void {
    const result = configStore.deleteHost(hostId);

    if (result.ok) {
      if (editingHostId === hostId) {
        resetForm();
      }
      hostConnectionStore.syncActiveHost();
    }
  }

  function handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    localErrors = {};

    const parsedPort = parsePort(port);
    const trimmedPassword = password.trim();
    const preservedPassword = editingHost?.password;
    const input = {
      id: editingHostId ?? createHostId(label, host),
      label,
      host,
      ...(parsedPort === undefined ? {} : { port: parsedPort }),
      ...(username.trim() ? { username } : {}),
      ...(trimmedPassword
        ? { password: password }
        : preservedPassword
          ? { password: preservedPassword }
          : {}),
      useTls,
      useWebSocket
    };

    const result = editingHostId
      ? configStore.updateHost(editingHostId, input)
      : configStore.addHost(input);

    if (result.ok) {
      resetForm();
    }
  }

  function parsePort(value: string | number | null | undefined): number | undefined {
    const trimmedValue = value === null || value === undefined ? '' : String(value).trim();

    return trimmedValue ? Number(trimmedValue) : undefined;
  }

  function resetForm(): void {
    editingHostId = null;
    label = '';
    host = '';
    port = '';
    username = '';
    password = '';
    useTls = false;
    useWebSocket = true;
    localErrors = {};
  }

  function createHostId(labelValue: string, hostValue: string): string {
    const base = `${labelValue || hostValue || 'kodi-host'}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 36);
    const safeBase = base || 'kodi-host';
    let suffix = 1;
    let candidate = safeBase;

    while (snapshot.hosts.some((savedHost) => savedHost.id === candidate)) {
      suffix += 1;
      candidate = `${safeBase}-${suffix}`;
    }

    return candidate;
  }
</script>

<section class="host-settings surface" aria-labelledby="host-settings-title">
  <div class="section-heading">
    <p class="section-kicker">{i18n.t('hostSettings.kicker')}</p>
    <h2 id="host-settings-title">{i18n.t('hostSettings.title')}</h2>
    <p>
      {i18n.t('hostSettings.description')}
    </p>
  </div>

  {#if snapshot.storageWarning}
    <p class="warning" role="status">{formatStorageWarning()}</p>
  {/if}

  <p class="warning trusted-warning" id="trusted-device-warning">
    {i18n.t('hostSettings.trustedWarning')}
  </p>

  <form
    class="host-form"
    aria-label={i18n.t('hostSettings.formAria')}
    novalidate
    onsubmit={handleSubmit}
  >
    <div class="field-grid">
      <div class="field">
        <label for="host-label">{i18n.t('hostSettings.field.label')}</label>
        <input
          id="host-label"
          type="text"
          autocomplete="off"
          bind:value={label}
          aria-invalid={isInvalid('label')}
          aria-describedby={descriptionId('label')}
        />
        {#if errors.label}
          <p id={errorId('label')} class="field-error" role="alert">
            {formatValidationError('label', errors.label)}
          </p>
        {/if}
      </div>

      <div class="field">
        <label for="host-address">{i18n.t('hostSettings.field.host')}</label>
        <input
          id="host-address"
          type="text"
          inputmode="url"
          autocomplete="off"
          bind:value={host}
          aria-invalid={isInvalid('host')}
          aria-describedby={descriptionId('host')}
        />
        {#if errors.host}
          <p id={errorId('host')} class="field-error" role="alert">
            {formatValidationError('host', errors.host)}
          </p>
        {/if}
      </div>

      <div class="field compact-field">
        <label for="host-port">{i18n.t('hostSettings.field.port')}</label>
        <input
          id="host-port"
          type="number"
          min="1"
          max="65535"
          inputmode="numeric"
          bind:value={port}
          aria-invalid={isInvalid('port')}
          aria-describedby={descriptionId('port')}
        />
        {#if errors.port}
          <p id={errorId('port')} class="field-error" role="alert">
            {formatValidationError('port', errors.port)}
          </p>
        {/if}
      </div>

      <div class="field compact-field">
        <label for="host-username">{i18n.t('hostSettings.field.username')}</label>
        <input
          id="host-username"
          type="text"
          autocomplete="username"
          bind:value={username}
          aria-invalid={isInvalid('username')}
          aria-describedby={descriptionId('username')}
        />
        {#if errors.username}
          <p id={errorId('username')} class="field-error" role="alert">
            {formatValidationError('username', errors.username)}
          </p>
        {/if}
      </div>

      <div class="field compact-field">
        <label for="host-password">{i18n.t('hostSettings.field.password')}</label>
        <input
          id="host-password"
          type="password"
          autocomplete="current-password"
          placeholder={editingHost?.password ? i18n.t('hostSettings.password.retained') : ''}
          bind:value={password}
          aria-invalid={isInvalid('password')}
          aria-describedby={errors.password ? errorId('password') : 'trusted-device-warning'}
        />
        {#if errors.password}
          <p id={errorId('password')} class="field-error" role="alert">
            {formatValidationError('password', errors.password)}
          </p>
        {/if}
      </div>
    </div>

    <div class="toggles" aria-label={i18n.t('hostSettings.connectionOptionsAria')}>
      <label class="check-row" for="host-tls">
        <input id="host-tls" type="checkbox" bind:checked={useTls} />
        <span>{i18n.t('hostSettings.field.useTls')}</span>
      </label>
      <label class="check-row" for="host-websocket">
        <input id="host-websocket" type="checkbox" bind:checked={useWebSocket} />
        <span>{i18n.t('hostSettings.field.useWebSocket')}</span>
      </label>
    </div>

    <div class="form-actions">
      <button type="submit">{submitLabel}</button>
      {#if editingHost}
        <button class="secondary-button" type="button" onclick={cancelEditing}
          >{i18n.t('hostSettings.action.cancelEdit')}</button
        >
      {/if}
    </div>
  </form>

  <div class="saved-hosts" aria-labelledby="saved-hosts-title">
    <div class="saved-hosts-heading">
      <h3 id="saved-hosts-title">{i18n.t('hostSettings.saved.title')}</h3>
      <p>{savedCountLabel(snapshot.hosts.length)}</p>
    </div>

    {#if snapshot.hosts.length === 0}
      <p class="empty-state">{i18n.t('hostSettings.saved.empty')}</p>
    {:else}
      <ul aria-describedby="trusted-device-warning">
        {#each snapshot.hosts as savedHost (savedHost.id)}
          <li class:active-host={snapshot.activeHostId === savedHost.id}>
            <div>
              <p class="host-label">{savedHost.label}</p>
              <p class="host-meta">
                {savedHost.host}{savedHost.port ? `:${savedHost.port}` : ''} · {savedHost.useTls
                  ? 'HTTPS'
                  : 'HTTP'} · {savedHost.useWebSocket
                  ? i18n.t('hostSettings.websocket.on')
                  : i18n.t('hostSettings.websocket.off')}
              </p>
              <p class="credential-note">
                {savedHost.username
                  ? i18n.t('hostSettings.credentials.saved')
                  : i18n.t('hostSettings.credentials.none')}
              </p>
            </div>
            <div class="row-actions">
              <button
                class="secondary-button"
                type="button"
                aria-label={i18n.t('hostSettings.action.editAria', { label: savedHost.label })}
                onclick={() => startEditing(savedHost.id)}
                >{i18n.t('hostSettings.action.edit')}</button
              >
              <button
                class="danger-button"
                type="button"
                aria-label={i18n.t('hostSettings.action.deleteAria', { label: savedHost.label })}
                onclick={() => deleteHost(savedHost.id)}
                >{i18n.t('hostSettings.action.delete')}</button
              >
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</section>

<style>
  .host-settings {
    display: grid;
    gap: var(--space-lg);
    padding: clamp(var(--space-lg), 4vw, var(--space-xl));
  }

  .section-heading,
  .host-form,
  .saved-hosts {
    display: grid;
    gap: var(--space-md);
  }

  .section-kicker,
  h2,
  h3,
  p {
    margin: 0;
  }

  .section-kicker {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h2,
  h3 {
    text-wrap: balance;
  }

  .section-heading p:not(.section-kicker),
  .empty-state,
  .host-meta,
  .credential-note,
  .saved-hosts-heading p {
    color: var(--color-text-muted);
    line-height: 1.6;
    text-wrap: pretty;
  }

  .warning {
    padding: var(--space-sm) var(--space-md);
    color: var(--color-warning);
    background: color-mix(in srgb, var(--color-warning) 12%, transparent);
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-warning) 26%, transparent);
  }

  .field-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
  }

  .field {
    display: grid;
    gap: var(--space-xs);
  }

  .compact-field {
    align-content: start;
  }

  label,
  .host-label {
    font-weight: 700;
  }

  input[type='text'],
  input[type='number'],
  input[type='password'] {
    min-height: 2.75rem;
    padding: var(--space-xs) var(--space-sm);
    color: var(--color-text);
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    transition:
      border-color 160ms ease,
      box-shadow 160ms ease,
      background 160ms ease;
  }

  input:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
  }

  input[aria-invalid='true'] {
    border-color: color-mix(in srgb, var(--color-danger) 72%, var(--color-border));
  }

  .field-error {
    color: var(--color-danger);
    font-size: 0.9rem;
    line-height: 1.45;
  }

  .toggles,
  .form-actions,
  .row-actions,
  .saved-hosts-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-sm);
  }

  .saved-hosts-heading {
    justify-content: space-between;
  }

  .check-row {
    display: inline-flex;
    min-height: 2.5rem;
    align-items: center;
    gap: var(--space-xs);
    padding-inline-end: var(--space-sm);
    cursor: pointer;
  }

  .check-row input {
    width: 1.1rem;
    height: 1.1rem;
    accent-color: var(--color-accent);
  }

  button {
    min-height: 2.5rem;
    padding: var(--space-xs) var(--space-md);
    color: var(--color-accent-contrast);
    font-weight: 800;
    cursor: pointer;
    background: var(--color-accent);
    border: 0;
    border-radius: var(--radius-pill);
    transition:
      transform 140ms ease,
      box-shadow 140ms ease,
      background 140ms ease;
  }

  button:hover {
    transform: translateY(-1px);
    box-shadow: 0 0.8rem 1.5rem rgb(0 0 0 / 0.14);
  }

  button:active {
    transform: scale(0.96);
  }

  button:focus-visible {
    outline: none;
    box-shadow: var(--shadow-ring);
  }

  .secondary-button {
    color: var(--color-text);
    background: var(--color-surface-raised);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .danger-button {
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-danger) 18%, var(--color-surface-raised));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-danger) 36%, transparent);
  }

  ul {
    display: grid;
    gap: var(--space-sm);
    padding: 0;
    margin: 0;
    list-style: none;
  }

  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-md);
    align-items: center;
    padding: var(--space-md);
    background: color-mix(in srgb, var(--color-surface-raised) 72%, transparent);
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .active-host {
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--color-success) 56%, transparent),
      0 0 0 0.18rem color-mix(in srgb, var(--color-success) 12%, transparent);
  }

  @media (max-width: 760px) {
    .field-grid,
    li {
      grid-template-columns: 1fr;
    }
  }
</style>
