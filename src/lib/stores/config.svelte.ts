export const CONFIG_STORAGE_KEY = 'chorus3.kodi.hosts';

export type ConfigStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type ConfigWarningCode = 'read-failed' | 'write-failed' | 'invalid-storage';

export interface SavedKodiHost {
  id: string;
  label: string;
  host: string;
  port?: number;
  username?: string;
  password?: string;
  useTls: boolean;
  useWebSocket: boolean;
}

export type SavedKodiHostInput = SavedKodiHost;

export type ConfigValidationField = keyof SavedKodiHost | 'activeHostId';
export type ConfigValidationErrors = Partial<Record<ConfigValidationField, string>>;

export interface ConfigStorageWarning {
  code: ConfigWarningCode;
  message: string;
}

export interface ConfigStoreSnapshot {
  hosts: SavedKodiHost[];
  activeHostId: string | null;
  activeHost: SavedKodiHost | null;
  validationErrors: ConfigValidationErrors;
  storageWarning: ConfigStorageWarning | null;
}

export interface ConfigStoreOptions {
  storage?: ConfigStorage | null;
}

export type ConfigMutationResult =
  | { ok: true; host?: SavedKodiHost }
  | { ok: false; errors: ConfigValidationErrors };

interface PersistedConfigPayload {
  hosts: SavedKodiHost[];
  activeHostId: string | null;
}

interface ValidHostResult {
  ok: true;
  host: SavedKodiHost;
}

interface InvalidHostResult {
  ok: false;
  errors: ConfigValidationErrors;
}

export class ConfigStore {
  hosts = $state<SavedKodiHost[]>([]);
  activeHostId = $state<string | null>(null);
  validationErrors = $state<ConfigValidationErrors>({});
  storageWarning = $state<ConfigStorageWarning | null>(null);

  readonly #storage: ConfigStorage | null;

  constructor(options: ConfigStoreOptions = {}) {
    this.#storage = options.storage ?? null;
    this.#load();
  }

  get activeHost(): SavedKodiHost | null {
    return this.hosts.find((host) => host.id === this.activeHostId) ?? null;
  }

  get snapshot(): ConfigStoreSnapshot {
    return {
      hosts: this.hosts.map(cloneSavedHost),
      activeHostId: this.activeHostId,
      activeHost: this.activeHost ? cloneSavedHost(this.activeHost) : null,
      validationErrors: { ...this.validationErrors },
      storageWarning: this.storageWarning ? { ...this.storageWarning } : null
    };
  }

  addHost(input: SavedKodiHostInput): ConfigMutationResult {
    const validation = validateSavedKodiHostInput(input);

    if (!validation.ok) {
      return this.#reject(validation.errors);
    }

    if (this.hosts.some((host) => host.id === validation.host.id)) {
      return this.#reject({ id: 'A saved Kodi host already exists for this id.' });
    }

    this.hosts = [...this.hosts, validation.host];
    this.activeHostId ??= validation.host.id;
    this.validationErrors = {};
    this.#persist();

    return { ok: true, host: cloneSavedHost(validation.host) };
  }

  updateHost(id: string, input: SavedKodiHostInput): ConfigMutationResult {
    if (!this.hosts.some((host) => host.id === id)) {
      return this.#reject({ id: 'No saved Kodi host exists for this id.' });
    }

    const validation = validateSavedKodiHostInput({ ...input, id });

    if (!validation.ok) {
      return this.#reject(validation.errors);
    }

    this.hosts = this.hosts.map((host) => (host.id === id ? validation.host : host));
    this.validationErrors = {};
    this.#persist();

    return { ok: true, host: cloneSavedHost(validation.host) };
  }

  deleteHost(id: string): ConfigMutationResult {
    if (!this.hosts.some((host) => host.id === id)) {
      return this.#reject({ id: 'No saved Kodi host exists for this id.' });
    }

    this.hosts = this.hosts.filter((host) => host.id !== id);

    if (this.activeHostId === id) {
      this.activeHostId = this.hosts[0]?.id ?? null;
    }

    this.validationErrors = {};
    this.#persist();

    return { ok: true };
  }

  setActiveHost(id: string): ConfigMutationResult {
    const host = this.hosts.find((savedHost) => savedHost.id === id);

    if (!host) {
      return this.#reject({ activeHostId: 'Choose a saved Kodi host before making it active.' });
    }

    this.activeHostId = id;
    this.validationErrors = {};
    this.#persist();

    return { ok: true, host: cloneSavedHost(host) };
  }

  reset(): void {
    this.hosts = [];
    this.activeHostId = null;
    this.validationErrors = {};
    this.storageWarning = null;
    this.#persist();
  }

  #load(): void {
    if (!this.#storage) {
      return;
    }

    let rawValue: string | null;

    try {
      rawValue = this.#storage.getItem(CONFIG_STORAGE_KEY);
    } catch {
      this.storageWarning = createStorageWarning('read-failed');
      return;
    }

    if (!rawValue) {
      return;
    }

    try {
      const parsedValue = JSON.parse(rawValue) as unknown;
      const payload = validatePersistedConfigPayload(parsedValue);
      this.hosts = payload.hosts;
      this.activeHostId = payload.activeHostId;
      this.validationErrors = {};
      this.storageWarning = null;
    } catch {
      this.hosts = [];
      this.activeHostId = null;
      this.validationErrors = {};
      this.storageWarning = createStorageWarning('invalid-storage');
    }
  }

  #persist(): void {
    if (!this.#storage) {
      return;
    }

    const payload = JSON.stringify({
      hosts: this.hosts.map(cloneSavedHost),
      activeHostId: this.activeHostId
    });

    try {
      this.#storage.setItem(CONFIG_STORAGE_KEY, payload);
    } catch {
      this.storageWarning = createStorageWarning('write-failed');
    }
  }

  #reject(errors: ConfigValidationErrors): { ok: false; errors: ConfigValidationErrors } {
    this.validationErrors = { ...errors };

    return { ok: false, errors: { ...errors } };
  }
}

export function createConfigStore(options: ConfigStoreOptions = {}): ConfigStore {
  return new ConfigStore(options);
}

export const configStore = createConfigStore({
  storage: typeof localStorage === 'undefined' ? null : localStorage
});

export function validateSavedKodiHostInput(input: unknown): ValidHostResult | InvalidHostResult {
  const errors: ConfigValidationErrors = {};

  if (!isRecord(input)) {
    return { ok: false, errors: { host: 'Saved Kodi host must be an object.' } };
  }

  const id = validateRequiredString(input.id, 'Host id is required.');
  const label = validateRequiredString(input.label, 'Label is required.');
  const host = validateHostField(input.host);
  const port = validatePortField(input.port);
  const username = validateOptionalCredential(
    input.username,
    'Username cannot be blank when provided.'
  );
  const password = validateOptionalPassword(input.password);
  const useTls = validateBooleanField(input.useTls, 'useTls');
  const useWebSocket = validateBooleanField(input.useWebSocket, 'useWebSocket');

  assignValidationResult(errors, 'id', id);
  assignValidationResult(errors, 'label', label);
  assignValidationResult(errors, 'host', host);
  assignValidationResult(errors, 'port', port);
  assignValidationResult(errors, 'username', username);
  assignValidationResult(errors, 'password', password);
  assignValidationResult(errors, 'useTls', useTls);
  assignValidationResult(errors, 'useWebSocket', useWebSocket);

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const normalizedHost: SavedKodiHost = {
    id: id.value ?? '',
    label: label.value ?? '',
    host: host.value ?? '',
    ...(port.value === undefined ? {} : { port: port.value }),
    ...(username.value === undefined ? {} : { username: username.value }),
    ...(password.value === undefined ? {} : { password: password.value }),
    useTls: useTls.value ?? false,
    useWebSocket: useWebSocket.value ?? false
  };

  return {
    ok: true,
    host: normalizedHost
  };
}

function validatePersistedConfigPayload(value: unknown): PersistedConfigPayload {
  if (!isRecord(value) || !Array.isArray(value.hosts)) {
    throw new Error('Persisted Kodi host settings must include a hosts array.');
  }

  const hosts = value.hosts.map((host) => {
    const validation = validateSavedKodiHostInput(host);

    if (!validation.ok) {
      throw new Error('Persisted Kodi host settings include an invalid host.');
    }

    return validation.host;
  });
  const activeHostId = validatePersistedActiveHostId(value.activeHostId, hosts);

  return { hosts, activeHostId };
}

function validatePersistedActiveHostId(value: unknown, hosts: SavedKodiHost[]): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string' || !hosts.some((host) => host.id === value)) {
    throw new Error('Persisted active Kodi host id must reference a saved host.');
  }

  return value;
}

interface FieldValidationResult<T> {
  value?: T;
  error?: string;
}

function assignValidationResult<T>(
  errors: ConfigValidationErrors,
  field: ConfigValidationField,
  result: FieldValidationResult<T>
): void {
  if (result.error) {
    errors[field] = result.error;
  }
}

function validateRequiredString(value: unknown, message: string): FieldValidationResult<string> {
  if (typeof value !== 'string') {
    return { error: message };
  }

  const trimmedValue = value.trim();

  return trimmedValue ? { value: trimmedValue } : { error: message };
}

function validateHostField(value: unknown): FieldValidationResult<string> {
  const required = validateRequiredString(value, 'Host is required.');

  if (required.error || required.value === undefined) {
    return required;
  }

  const host = required.value;

  if (containsUnsafeHostShape(host)) {
    return { error: 'Host must not include a protocol, path, query string, or credentials.' };
  }

  return { value: host.replace(/^\/+|\/+$/g, '') };
}

function containsUnsafeHostShape(host: string): boolean {
  return (
    host.includes('://') ||
    host.includes('@') ||
    host.includes('/') ||
    host.includes('?') ||
    host.includes('#')
  );
}

function validatePortField(value: unknown): FieldValidationResult<number | undefined> {
  if (value === undefined || value === null || value === '') {
    return { value: undefined };
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 65535) {
    return { error: 'HTTP port must be an integer between 1 and 65535.' };
  }

  return { value };
}

function validateOptionalCredential(
  value: unknown,
  blankMessage: string
): FieldValidationResult<string | undefined> {
  if (value === undefined || value === null) {
    return { value: undefined };
  }

  if (typeof value !== 'string') {
    return { error: blankMessage };
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { error: blankMessage };
  }

  if (/authorization\s*:/i.test(trimmedValue)) {
    return { error: 'Credential must not contain Authorization header content.' };
  }

  return { value: trimmedValue };
}

function validateOptionalPassword(value: unknown): FieldValidationResult<string | undefined> {
  const result = validateOptionalCredential(value, 'Password cannot be blank when provided.');

  if (result.error === 'Credential must not contain Authorization header content.') {
    return { error: 'Password must not contain Authorization header content.' };
  }

  return result;
}

function validateBooleanField(
  value: unknown,
  field: 'useTls' | 'useWebSocket'
): FieldValidationResult<boolean> {
  return typeof value === 'boolean' ? { value } : { error: `${field} must be true or false.` };
}

function createStorageWarning(code: ConfigWarningCode): ConfigStorageWarning {
  switch (code) {
    case 'read-failed':
      return {
        code,
        message:
          'Saved Kodi host settings could not be read. In-memory settings are still available.'
      };
    case 'write-failed':
      return {
        code,
        message: 'Saved Kodi host settings could not be written. Changes are kept in memory only.'
      };
    case 'invalid-storage':
      return {
        code,
        message: 'Saved Kodi host settings were reset because stored data was invalid.'
      };
  }
}

function cloneSavedHost(host: SavedKodiHost): SavedKodiHost {
  return { ...host };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
