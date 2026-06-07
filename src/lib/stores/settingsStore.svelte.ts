import {
  KodiHttpClientError,
  getSettings,
  getSettingsCategories,
  getSettingsSections,
  isKodiHttpClientError,
  setSettingValue,
  type KodiEndpointDescription,
  type KodiHttpCallOptions,
  type KodiJsonRpcHttpClient,
  type KodiSettingsSetting,
  type SettingsGetCategoriesParams,
  type SettingsGetCategoriesResult,
  type SettingsGetSectionsParams,
  type SettingsGetSectionsResult,
  type SettingsGetSettingsParams,
  type SettingsGetSettingsResult,
  type SettingsLevel,
  type SettingsSetSettingValueParams,
  type SettingsSetSettingValueResult,
  type SettingsSettingValue
} from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';

export type SettingsLoadStatus = 'idle' | 'loading' | 'success' | 'error';
export type SettingsWriteStatus = 'idle' | 'pending' | 'success' | 'error';
export type SettingsErrorSource = 'validation' | 'config' | 'http' | 'settings' | 'write';
export type SettingsEditKind = 'boolean' | 'integer' | 'number' | 'string' | 'enum' | 'unsupported';

export interface SettingsSafeErrorSnapshot {
  source: SettingsErrorSource;
  code: string;
  message: string;
  endpoint?: KodiEndpointDescription;
}

export interface SettingsSectionSnapshot {
  id: string;
  label: string;
}

export interface SettingsCategorySnapshot {
  id: string;
  label: string;
}

export interface SettingsOptionSnapshot {
  value: SettingsSettingValue;
  label: string;
}

export interface SettingsSettingSnapshot {
  id: string;
  label: string;
  type: string;
  editKind: SettingsEditKind;
  value: SettingsSettingValue;
  defaultValue: SettingsSettingValue;
  options: SettingsOptionSnapshot[];
  readOnly: boolean;
}

export interface SettingsLastWriteSnapshot {
  settingId: string;
  value: SettingsSettingValue;
  status: Exclude<SettingsWriteStatus, 'idle'>;
  at: string;
}

export interface SettingsRefreshAfterWriteSnapshot {
  settingId: string;
  categoryId: string;
  requestedAt: string;
  refreshed: boolean;
}

export interface SettingsWriteCountsSnapshot {
  attempted: number;
  succeeded: number;
  failed: number;
}

export interface SettingsStoreSnapshot {
  loadStatus: SettingsLoadStatus;
  writeStatus: SettingsWriteStatus;
  sections: SettingsSectionSnapshot[];
  categories: SettingsCategorySnapshot[];
  settings: SettingsSettingSnapshot[];
  selectedSectionId: string | null;
  selectedCategoryId: string | null;
  lastError: SettingsSafeErrorSnapshot | null;
  lastWrite: SettingsLastWriteSnapshot | null;
  rollbackValue: SettingsSettingValue;
  refreshAfterWrite: SettingsRefreshAfterWriteSnapshot | null;
  writeCounts: SettingsWriteCountsSnapshot;
}

export interface SettingsStoreMethods {
  getSettingsSections(
    client: KodiJsonRpcHttpClient,
    params?: SettingsGetSectionsParams,
    options?: KodiHttpCallOptions
  ): Promise<SettingsGetSectionsResult>;
  getSettingsCategories(
    client: KodiJsonRpcHttpClient,
    params?: SettingsGetCategoriesParams,
    options?: KodiHttpCallOptions
  ): Promise<SettingsGetCategoriesResult>;
  getSettings(
    client: KodiJsonRpcHttpClient,
    params?: SettingsGetSettingsParams,
    options?: KodiHttpCallOptions
  ): Promise<SettingsGetSettingsResult>;
  setSettingValue(
    client: KodiJsonRpcHttpClient,
    params: SettingsSetSettingValueParams
  ): Promise<SettingsSetSettingValueResult>;
}

export interface SettingsStoreOptions {
  createClient?: () => KodiJsonRpcHttpClient | null | Promise<KodiJsonRpcHttpClient | null>;
  methods?: SettingsStoreMethods;
  now?: () => string;
  level?: SettingsLevel;
}

const DEFAULT_METHODS: SettingsStoreMethods = {
  getSettingsSections,
  getSettingsCategories,
  getSettings,
  setSettingValue
};

const DEFAULT_COUNTS: SettingsWriteCountsSnapshot = { attempted: 0, succeeded: 0, failed: 0 };
const DEFAULT_SNAPSHOT: SettingsStoreSnapshot = {
  loadStatus: 'idle',
  writeStatus: 'idle',
  sections: [],
  categories: [],
  settings: [],
  selectedSectionId: null,
  selectedCategoryId: null,
  lastError: null,
  lastWrite: null,
  rollbackValue: null,
  refreshAfterWrite: null,
  writeCounts: DEFAULT_COUNTS
};

const NO_ACTIVE_HOST_ERROR: SettingsSafeErrorSnapshot = {
  source: 'config',
  code: 'config/no-active-host',
  message: 'Choose an active Kodi host before loading settings.'
};
const MALFORMED_RESPONSE_ERROR: SettingsSafeErrorSnapshot = {
  source: 'settings',
  code: 'settings/malformed-response',
  message: 'Kodi returned a malformed settings response.'
};

export class SettingsStore {
  #snapshot = $state<SettingsStoreSnapshot>(cloneSnapshot(DEFAULT_SNAPSHOT));
  readonly #createClient: () =>
    | KodiJsonRpcHttpClient
    | null
    | Promise<KodiJsonRpcHttpClient | null>;
  readonly #methods: SettingsStoreMethods;
  readonly #now: () => string;
  readonly #level: SettingsLevel;
  #requestId = 0;
  #abortController: AbortController | null = null;

  constructor(options: SettingsStoreOptions = {}) {
    this.#createClient = options.createClient ?? createActiveKodiJsonRpcHttpClient;
    this.#methods = options.methods ?? DEFAULT_METHODS;
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#level = options.level ?? 'expert';
  }

  get snapshot(): SettingsStoreSnapshot {
    return cloneSnapshot(this.#snapshot);
  }

  reset(): void {
    this.#cancelLoad();
    this.#snapshot = cloneSnapshot(DEFAULT_SNAPSHOT);
  }

  async load(): Promise<void> {
    const requestId = this.#beginLoad();
    const client = await this.#resolveClient();
    if (!client) {
      this.#failLoad(requestId, NO_ACTIVE_HOST_ERROR);
      return;
    }

    try {
      const sections = normalizeSections(
        (
          await this.#methods.getSettingsSections(
            client,
            { level: this.#level },
            this.#callOptions()
          )
        ).sections
      );
      const selectedSectionId = pickExistingId(sections, this.#snapshot.selectedSectionId);
      const categories = selectedSectionId
        ? normalizeCategories(
            (
              await this.#methods.getSettingsCategories(
                client,
                {
                  section: selectedSectionId,
                  level: this.#level
                },
                this.#callOptions()
              )
            ).categories
          )
        : [];
      const selectedCategoryId = pickExistingId(categories, this.#snapshot.selectedCategoryId);
      const settings = selectedCategoryId
        ? normalizeSettings(
            (
              await this.#methods.getSettings(
                client,
                {
                  section: selectedSectionId ?? undefined,
                  category: selectedCategoryId,
                  level: this.#level
                },
                this.#callOptions()
              )
            ).settings
          )
        : [];

      this.#commitLoad(requestId, {
        sections,
        categories,
        settings,
        selectedSectionId,
        selectedCategoryId
      });
    } catch (error) {
      this.#failLoad(requestId, createSafeError(error, 'settings'));
    }
  }

  async selectSection(sectionId: string): Promise<void> {
    const section = this.#snapshot.sections.find((candidate) => candidate.id === sectionId);
    if (!section) {
      this.#setValidationError('validation/invalid-section', 'Select a known settings section.');
      return;
    }

    const requestId = this.#beginLoad({ selectedSectionId: section.id });
    const client = await this.#resolveClient();
    if (!client) {
      this.#failLoad(requestId, NO_ACTIVE_HOST_ERROR);
      return;
    }

    try {
      const categories = normalizeCategories(
        (
          await this.#methods.getSettingsCategories(
            client,
            {
              section: section.id,
              level: this.#level
            },
            this.#callOptions()
          )
        ).categories
      );
      const selectedCategoryId = categories[0]?.id ?? null;
      const settings = selectedCategoryId
        ? normalizeSettings(
            (
              await this.#methods.getSettings(
                client,
                {
                  section: section.id,
                  category: selectedCategoryId,
                  level: this.#level
                },
                this.#callOptions()
              )
            ).settings
          )
        : [];
      this.#commitLoad(requestId, {
        sections: this.#snapshot.sections,
        categories,
        settings,
        selectedSectionId: section.id,
        selectedCategoryId
      });
    } catch (error) {
      this.#failLoad(requestId, createSafeError(error, 'settings'));
    }
  }

  async selectCategory(categoryId: string): Promise<void> {
    const category = this.#snapshot.categories.find((candidate) => candidate.id === categoryId);
    if (!category) {
      this.#setValidationError('validation/invalid-category', 'Select a known settings category.');
      return;
    }

    const requestId = this.#beginLoad({ selectedCategoryId: category.id });
    const client = await this.#resolveClient();
    if (!client) {
      this.#failLoad(requestId, NO_ACTIVE_HOST_ERROR);
      return;
    }

    try {
      const settings = normalizeSettings(
        (
          await this.#methods.getSettings(
            client,
            {
              section: this.#snapshot.selectedSectionId ?? undefined,
              category: category.id,
              level: this.#level
            },
            this.#callOptions()
          )
        ).settings
      );
      this.#commitLoad(requestId, {
        sections: this.#snapshot.sections,
        categories: this.#snapshot.categories,
        settings,
        selectedSectionId: this.#snapshot.selectedSectionId,
        selectedCategoryId: category.id
      });
    } catch (error) {
      this.#failLoad(requestId, createSafeError(error, 'settings'));
    }
  }

  async retry(): Promise<void> {
    await this.load();
  }

  async writeSettingValue(settingId: string, value: SettingsSettingValue): Promise<void> {
    const setting = this.#snapshot.settings.find((candidate) => candidate.id === settingId);
    if (!setting) {
      this.#setWriteValidationError('validation/invalid-setting', 'Write a known settings value.');
      return;
    }
    if (setting.readOnly) {
      this.#setWriteValidationError(
        'validation/read-only-setting',
        'This Kodi setting is read-only.'
      );
      return;
    }
    if (!isValidSettingValue(setting, value)) {
      this.#setWriteValidationError(
        'validation/invalid-value',
        'Use a value compatible with this setting.'
      );
      return;
    }

    const client = await this.#resolveClient();
    if (!client) {
      this.#setWriteError(NO_ACTIVE_HOST_ERROR, setting.id, value, setting.value, false);
      return;
    }

    const previousValue = setting.value;
    const requestedAt = this.#now();
    this.#snapshot = {
      ...this.#snapshot,
      writeStatus: 'pending',
      lastError: null,
      rollbackValue: cloneValue(previousValue),
      settings: replaceSettingValue(this.#snapshot.settings, setting.id, value),
      lastWrite: {
        settingId: setting.id,
        value: cloneValue(value),
        status: 'pending',
        at: requestedAt
      },
      refreshAfterWrite: this.#snapshot.selectedCategoryId
        ? {
            settingId: setting.id,
            categoryId: this.#snapshot.selectedCategoryId,
            requestedAt,
            refreshed: false
          }
        : null,
      writeCounts: {
        ...this.#snapshot.writeCounts,
        attempted: this.#snapshot.writeCounts.attempted + 1
      }
    };

    try {
      await this.#methods.setSettingValue(client, { setting: setting.id, value });
      await this.#refreshActiveCategoryAfterWrite(client, setting.id, requestedAt);
      this.#snapshot = {
        ...this.#snapshot,
        writeStatus: 'success',
        lastError: null,
        lastWrite: {
          settingId: setting.id,
          value: cloneValue(value),
          status: 'success',
          at: requestedAt
        },
        writeCounts: {
          ...this.#snapshot.writeCounts,
          succeeded: this.#snapshot.writeCounts.succeeded + 1
        }
      };
    } catch (error) {
      this.#setWriteError(createSafeError(error, 'write'), setting.id, value, previousValue, true);
    }
  }

  async #refreshActiveCategoryAfterWrite(
    client: KodiJsonRpcHttpClient,
    settingId: string,
    requestedAt: string
  ): Promise<void> {
    const categoryId = this.#snapshot.selectedCategoryId;
    if (!categoryId) return;

    const settings = normalizeSettings(
      (
        await this.#methods.getSettings(client, {
          section: this.#snapshot.selectedSectionId ?? undefined,
          category: categoryId,
          level: this.#level
        })
      ).settings
    );
    this.#snapshot = {
      ...this.#snapshot,
      settings,
      refreshAfterWrite: { settingId, categoryId, requestedAt, refreshed: true }
    };
  }

  #beginLoad(partial: Partial<SettingsStoreSnapshot> = {}): number {
    this.#abortController?.abort();
    this.#abortController = new AbortController();
    this.#requestId += 1;
    this.#snapshot = {
      ...this.#snapshot,
      ...partial,
      loadStatus: 'loading',
      lastError: null
    };
    return this.#requestId;
  }

  #commitLoad(
    requestId: number,
    data: Pick<
      SettingsStoreSnapshot,
      'sections' | 'categories' | 'settings' | 'selectedSectionId' | 'selectedCategoryId'
    >
  ): void {
    if (requestId !== this.#requestId) return;
    this.#snapshot = {
      ...this.#snapshot,
      ...cloneLoadData(data),
      loadStatus: 'success',
      lastError: null
    };
  }

  #failLoad(requestId: number, error: SettingsSafeErrorSnapshot): void {
    if (requestId !== this.#requestId) return;
    this.#snapshot = {
      ...this.#snapshot,
      loadStatus: 'error',
      lastError: cloneError(error)
    };
  }

  #setValidationError(code: string, message: string): void {
    this.#snapshot = {
      ...this.#snapshot,
      loadStatus: 'error',
      lastError: { source: 'validation', code, message }
    };
  }

  #setWriteValidationError(code: string, message: string): void {
    this.#snapshot = {
      ...this.#snapshot,
      writeStatus: 'error',
      lastError: { source: 'validation', code, message }
    };
  }

  #setWriteError(
    error: SettingsSafeErrorSnapshot,
    settingId: string,
    value: SettingsSettingValue,
    rollbackValue: SettingsSettingValue,
    incrementFailed: boolean
  ): void {
    const at = this.#now();
    this.#snapshot = {
      ...this.#snapshot,
      writeStatus: 'error',
      lastError: cloneError(error),
      lastWrite: { settingId, value: cloneValue(value), status: 'error', at },
      rollbackValue: cloneValue(rollbackValue),
      settings: replaceSettingValue(this.#snapshot.settings, settingId, rollbackValue),
      writeCounts: incrementFailed
        ? { ...this.#snapshot.writeCounts, failed: this.#snapshot.writeCounts.failed + 1 }
        : { ...this.#snapshot.writeCounts }
    };
  }

  async #resolveClient(): Promise<KodiJsonRpcHttpClient | null> {
    try {
      return await this.#createClient();
    } catch {
      return null;
    }
  }

  #cancelLoad(): void {
    this.#abortController?.abort();
    this.#abortController = null;
    this.#requestId += 1;
  }

  #callOptions(): KodiHttpCallOptions {
    return { signal: this.#abortController?.signal };
  }
}

function normalizeSections(raw: unknown): SettingsSectionSnapshot[] {
  if (!Array.isArray(raw)) throw new SettingsMalformedResponseError();
  return raw.map((section) => normalizeIdLabel(section, 'section'));
}

function normalizeCategories(raw: unknown): SettingsCategorySnapshot[] {
  if (!Array.isArray(raw)) throw new SettingsMalformedResponseError();
  return raw.map((category) => normalizeIdLabel(category, 'category'));
}

function normalizeIdLabel(raw: unknown, kind: string): SettingsSectionSnapshot {
  if (!isRecord(raw) || typeof raw.id !== 'string' || raw.id.trim().length === 0) {
    throw new SettingsMalformedResponseError();
  }
  return {
    id: raw.id,
    label: sanitizeLabel(typeof raw.label === 'string' ? raw.label : `${kind} ${raw.id}`)
  };
}

function normalizeSettings(raw: unknown): SettingsSettingSnapshot[] {
  if (!Array.isArray(raw)) throw new SettingsMalformedResponseError();
  return raw.map(normalizeSetting);
}

function normalizeSetting(raw: KodiSettingsSetting): SettingsSettingSnapshot {
  if (!isRecord(raw) || typeof raw.id !== 'string' || raw.id.trim().length === 0) {
    throw new SettingsMalformedResponseError();
  }

  const type = typeof raw.type === 'string' ? raw.type : 'unknown';
  const options = normalizeOptions(raw.options);
  const editKind = getEditKind(type, options);
  const readOnly = editKind === 'unsupported';
  return {
    id: raw.id,
    label: sanitizeLabel(typeof raw.label === 'string' ? raw.label : raw.id),
    type: sanitizeLabel(type),
    editKind,
    value: normalizeSettingValue(raw.value, readOnly),
    defaultValue: normalizeSettingValue(raw.default, readOnly),
    options,
    readOnly
  };
}

function normalizeOptions(raw: unknown): SettingsOptionSnapshot[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((option) => {
    if (!isRecord(option)) return [];
    const value = normalizeSettingValue(option.value, false);
    if (value === null && option.value !== null) return [];
    return [
      {
        value,
        label: sanitizeLabel(typeof option.label === 'string' ? option.label : String(value))
      }
    ];
  });
}

function getEditKind(type: string, options: readonly SettingsOptionSnapshot[]): SettingsEditKind {
  const normalized = type.toLowerCase();
  if (['action', 'path', 'folder', 'file', 'custom'].includes(normalized)) return 'unsupported';
  if (options.length > 0) return 'enum';
  if (normalized === 'boolean') return 'boolean';
  if (normalized === 'integer') return 'integer';
  if (normalized === 'number') return 'number';
  if (normalized === 'string') return 'string';
  return 'unsupported';
}

function isValidSettingValue(
  setting: SettingsSettingSnapshot,
  value: SettingsSettingValue
): boolean {
  if (setting.editKind === 'boolean') return typeof value === 'boolean';
  if (setting.editKind === 'integer') return Number.isSafeInteger(value);
  if (setting.editKind === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (setting.editKind === 'string') return typeof value === 'string';
  if (setting.editKind === 'enum') {
    return setting.options.some((option) => Object.is(option.value, value));
  }
  return false;
}

function normalizeSettingValue(raw: unknown, forceRedact: boolean): SettingsSettingValue {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw === 'string') return forceRedact ? sanitizeScalar(raw) : raw;
  return null;
}

function sanitizeScalar(value: string): string {
  return sanitizeErrorMessage(value);
}

function createSafeError(
  error: unknown,
  fallbackSource: SettingsErrorSource
): SettingsSafeErrorSnapshot {
  if (error instanceof SettingsMalformedResponseError) return MALFORMED_RESPONSE_ERROR;
  if (isKodiHttpClientError(error) || error instanceof KodiHttpClientError) {
    return {
      source: 'http',
      code: error.code,
      message: sanitizeErrorMessage(error.message),
      endpoint: error.endpoint
    };
  }
  if (isErrorWithCode(error)) {
    return {
      source: fallbackSource,
      code: error.code,
      message: sanitizeErrorMessage(error.message)
    };
  }
  return {
    source: fallbackSource,
    code: `${fallbackSource}/failed`,
    message: sanitizeErrorMessage(
      error instanceof Error ? error.message : 'Kodi settings operation failed.'
    )
  };
}

function isErrorWithCode(error: unknown): error is Error & { code: string } {
  return error instanceof Error && typeof (error as { code?: unknown }).code === 'string';
}

class SettingsMalformedResponseError extends Error {
  constructor() {
    super('Malformed Kodi settings response.');
  }
}

function sanitizeLabel(label: string): string {
  const sanitized = sanitizeErrorMessage(label).trim();
  return sanitized.length > 0 ? sanitized : 'Untitled setting';
}

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
    .replace(/https?:\/\/[^\s]+/gi, '[redacted-url]')
    .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
    .replace(/authorization/gi, 'credentials')
    .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
    .replace(/username or password/gi, 'credentials')
    .replace(/smb:\/\/[^\s]+/gi, 'redacted-file')
    .replace(/\b[a-z]:\\[^\s]+/gi, 'redacted-file')
    .replace(/\/[^\s]+\.(mkv|mp4|mp3|flac|m4a|avi|mov)\b/gi, 'redacted-file')
    .replace(/admin:p@ssword/gi, '[redacted-credentials]')
    .replace(/p@ssword/gi, '[redacted-password]')
    .replace(/CHORUS_SENTINEL_SECRET|SENTINEL_SECRET/gi, '[redacted-sentinel]')
    .replace(/raw\s+(body|response|payload)/gi, 'redacted payload')
    .replace(/password/gi, 'credentials');
}

function pickExistingId<T extends { id: string }>(
  items: readonly T[],
  current: string | null
): string | null {
  if (current && items.some((item) => item.id === current)) return current;
  return items[0]?.id ?? null;
}

function replaceSettingValue(
  settings: readonly SettingsSettingSnapshot[],
  settingId: string,
  value: SettingsSettingValue
): SettingsSettingSnapshot[] {
  return settings.map((setting) =>
    setting.id === settingId
      ? { ...cloneSetting(setting), value: cloneValue(value) }
      : cloneSetting(setting)
  );
}

function cloneLoadData(
  data: Pick<
    SettingsStoreSnapshot,
    'sections' | 'categories' | 'settings' | 'selectedSectionId' | 'selectedCategoryId'
  >
): Pick<
  SettingsStoreSnapshot,
  'sections' | 'categories' | 'settings' | 'selectedSectionId' | 'selectedCategoryId'
> {
  return {
    sections: data.sections.map((section) => ({ ...section })),
    categories: data.categories.map((category) => ({ ...category })),
    settings: data.settings.map(cloneSetting),
    selectedSectionId: data.selectedSectionId,
    selectedCategoryId: data.selectedCategoryId
  };
}

function cloneSnapshot(snapshot: SettingsStoreSnapshot): SettingsStoreSnapshot {
  return {
    ...snapshot,
    sections: snapshot.sections.map((section) => ({ ...section })),
    categories: snapshot.categories.map((category) => ({ ...category })),
    settings: snapshot.settings.map(cloneSetting),
    lastError: snapshot.lastError ? cloneError(snapshot.lastError) : null,
    lastWrite: snapshot.lastWrite
      ? { ...snapshot.lastWrite, value: cloneValue(snapshot.lastWrite.value) }
      : null,
    rollbackValue: cloneValue(snapshot.rollbackValue),
    refreshAfterWrite: snapshot.refreshAfterWrite ? { ...snapshot.refreshAfterWrite } : null,
    writeCounts: { ...snapshot.writeCounts }
  };
}

function cloneSetting(setting: SettingsSettingSnapshot): SettingsSettingSnapshot {
  return {
    ...setting,
    value: cloneValue(setting.value),
    defaultValue: cloneValue(setting.defaultValue),
    options: setting.options.map((option) => ({ ...option, value: cloneValue(option.value) }))
  };
}

function cloneError(error: SettingsSafeErrorSnapshot): SettingsSafeErrorSnapshot {
  return { ...error, ...(error.endpoint ? { endpoint: { ...error.endpoint } } : {}) };
}

function cloneValue(value: SettingsSettingValue): SettingsSettingValue {
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function createSettingsStore(options: SettingsStoreOptions = {}): SettingsStore {
  return new SettingsStore(options);
}

export const settingsStore = createSettingsStore();
