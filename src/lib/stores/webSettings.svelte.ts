export const WEB_SETTINGS_STORAGE_KEY = 'chorus3.web.settings';

export type WebSettingsStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type WebSettingsDefaultPlayer = 'auto' | 'kodi' | 'local';
export type WebSettingsKeyboardControl = 'kodi' | 'local' | 'both';
export type WebSettingsPollInterval = '5000' | '10000' | '30000' | '60000';
export type WebSettingsKodiSettingsLevel = 'standard' | 'advanced' | 'expert';

export interface WebSettingsSnapshot {
  lang: string;
  defaultPlayer: WebSettingsDefaultPlayer;
  keyboardControl: WebSettingsKeyboardControl;
  ignoreArticle: boolean;
  albumArtistsOnly: boolean;
  playlistFocusPlaying: boolean;
  vibrantHeaders: boolean;
  disableThumbs: boolean;
  showDeviceName: boolean;
  socketsPort: string;
  socketsHost: string;
  pollInterval: WebSettingsPollInterval;
  kodiSettingsLevel: WebSettingsKodiSettingsLevel;
  reverseProxy: boolean;
  refreshIgnoreNFO: boolean;
  apiKeyTMDB: string;
  apiKeyFanartTv: string;
  apiKeyYouTube: string;
}

export interface WebSettingsStoreOptions {
  storage?: WebSettingsStorage | null;
}

export type WebSettingsMutation = Partial<WebSettingsSnapshot>;

export const DEFAULT_WEB_SETTINGS: WebSettingsSnapshot = {
  lang: 'en',
  defaultPlayer: 'auto',
  keyboardControl: 'kodi',
  ignoreArticle: true,
  albumArtistsOnly: true,
  playlistFocusPlaying: true,
  vibrantHeaders: true,
  disableThumbs: false,
  showDeviceName: false,
  socketsPort: '9090',
  socketsHost: 'auto',
  pollInterval: '10000',
  kodiSettingsLevel: 'standard',
  reverseProxy: false,
  refreshIgnoreNFO: true,
  apiKeyTMDB: '',
  apiKeyFanartTv: '',
  apiKeyYouTube: ''
};

export class WebSettingsStore {
  #snapshot = $state<WebSettingsSnapshot>({ ...DEFAULT_WEB_SETTINGS });
  readonly #storage: WebSettingsStorage | null;

  constructor(options: WebSettingsStoreOptions = {}) {
    this.#storage = options.storage ?? null;
    this.#load();
  }

  get snapshot(): WebSettingsSnapshot {
    return { ...this.#snapshot };
  }

  update(patch: WebSettingsMutation): void {
    this.#snapshot = normalizeWebSettings({ ...this.#snapshot, ...patch });
    this.#persist();
  }

  reset(): void {
    this.#snapshot = { ...DEFAULT_WEB_SETTINGS };
    this.#persist();
  }

  #load(): void {
    if (!this.#storage) {
      return;
    }

    try {
      const raw = this.#storage.getItem(WEB_SETTINGS_STORAGE_KEY);
      if (!raw) {
        return;
      }
      this.#snapshot = normalizeWebSettings(JSON.parse(raw) as unknown);
    } catch {
      this.#snapshot = { ...DEFAULT_WEB_SETTINGS };
      try {
        this.#storage.removeItem(WEB_SETTINGS_STORAGE_KEY);
      } catch {
        // Keep in-memory defaults when browser storage cannot be repaired.
      }
    }
  }

  #persist(): void {
    if (!this.#storage) {
      return;
    }

    try {
      this.#storage.setItem(WEB_SETTINGS_STORAGE_KEY, JSON.stringify(this.#snapshot));
    } catch {
      // Chorus2 kept the current session updated even if persistence failed.
    }
  }
}

export function createWebSettingsStore(options: WebSettingsStoreOptions = {}): WebSettingsStore {
  return new WebSettingsStore(options);
}

export const webSettingsStore = createWebSettingsStore({
  storage: typeof localStorage === 'undefined' ? null : localStorage
});

function normalizeWebSettings(value: unknown): WebSettingsSnapshot {
  const input = isRecord(value) ? value : {};

  return {
    lang: normalizeString(input.lang, DEFAULT_WEB_SETTINGS.lang),
    defaultPlayer: normalizeEnum(
      input.defaultPlayer,
      ['auto', 'kodi', 'local'],
      DEFAULT_WEB_SETTINGS.defaultPlayer
    ),
    keyboardControl: normalizeEnum(
      input.keyboardControl,
      ['kodi', 'local', 'both'],
      DEFAULT_WEB_SETTINGS.keyboardControl
    ),
    ignoreArticle: normalizeBoolean(input.ignoreArticle, DEFAULT_WEB_SETTINGS.ignoreArticle),
    albumArtistsOnly: normalizeBoolean(
      input.albumArtistsOnly,
      DEFAULT_WEB_SETTINGS.albumArtistsOnly
    ),
    playlistFocusPlaying: normalizeBoolean(
      input.playlistFocusPlaying,
      DEFAULT_WEB_SETTINGS.playlistFocusPlaying
    ),
    vibrantHeaders: normalizeBoolean(input.vibrantHeaders, DEFAULT_WEB_SETTINGS.vibrantHeaders),
    disableThumbs: normalizeBoolean(input.disableThumbs, DEFAULT_WEB_SETTINGS.disableThumbs),
    showDeviceName: normalizeBoolean(input.showDeviceName, DEFAULT_WEB_SETTINGS.showDeviceName),
    socketsPort: normalizeString(input.socketsPort, DEFAULT_WEB_SETTINGS.socketsPort),
    socketsHost: normalizeString(input.socketsHost, DEFAULT_WEB_SETTINGS.socketsHost),
    pollInterval: normalizeEnum(
      input.pollInterval,
      ['5000', '10000', '30000', '60000'],
      DEFAULT_WEB_SETTINGS.pollInterval
    ),
    kodiSettingsLevel: normalizeEnum(
      input.kodiSettingsLevel,
      ['standard', 'advanced', 'expert'],
      DEFAULT_WEB_SETTINGS.kodiSettingsLevel
    ),
    reverseProxy: normalizeBoolean(input.reverseProxy, DEFAULT_WEB_SETTINGS.reverseProxy),
    refreshIgnoreNFO: normalizeBoolean(
      input.refreshIgnoreNFO,
      DEFAULT_WEB_SETTINGS.refreshIgnoreNFO
    ),
    apiKeyTMDB: normalizeString(input.apiKeyTMDB, DEFAULT_WEB_SETTINGS.apiKeyTMDB),
    apiKeyFanartTv: normalizeString(input.apiKeyFanartTv, DEFAULT_WEB_SETTINGS.apiKeyFanartTv),
    apiKeyYouTube: normalizeString(input.apiKeyYouTube, DEFAULT_WEB_SETTINGS.apiKeyYouTube)
  };
}

function normalizeEnum<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
