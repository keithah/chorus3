import {
  cleanAudioLibrary,
  cleanVideoLibrary,
  executeAddon,
  executeInputAction,
  getActivePlayers,
  getAddonDetails,
  getApplicationProperties,
  getAudioLibraryAlbums,
  getAudioLibraryArtists,
  getAudioLibraryGenres,
  getAudioLibrarySongs,
  getJsonRpcIntrospection,
  getJsonRpcVersion,
  getPlayerItem,
  getPlayerProperties,
  getSettings,
  getSettingsCategories,
  getSettingsSections,
  getSystemProperties,
  getVideoLibraryEpisodeDetails,
  getVideoLibraryEpisodes,
  getVideoLibraryMovieDetails,
  getVideoLibraryMovies,
  getVideoLibraryMusicVideoDetails,
  getVideoLibraryMusicVideos,
  getVideoLibrarySeasonDetails,
  getVideoLibrarySeasons,
  getVideoLibraryTvShowDetails,
  getVideoLibraryTvShows,
  openPlayerFile,
  openPlayerItem,
  pingKodi,
  refreshVideoLibraryEpisode,
  refreshVideoLibraryMovie,
  refreshVideoLibraryTvShow,
  scanAudioLibrary,
  scanVideoLibrary,
  sendInputCommand,
  sendInputText,
  setApplicationVolume,
  setAlbumDetails,
  setArtistDetails,
  setEpisodeDetails,
  setMovieDetails,
  setMusicVideoDetails,
  setSeasonDetails,
  setSettingValue,
  setSongDetails,
  setTvShowDetails,
  type AddonsExecuteAddonParams,
  type AddonsGetAddonDetailsParams,
  type AudioLibrarySetAlbumDetailsParams,
  type AudioLibrarySetArtistDetailsParams,
  type AudioLibrarySetSongDetailsParams,
  type JsonRpcParams,
  type KodiFileItem,
  type KodiJsonRpcHttpClient,
  type PlayerItemParams,
  type PlayerPropertiesParams,
  type PlayerOpenItem,
  type RemoteInputAction,
  type RemoteInputCommand,
  type SystemPropertyName,
  type VideoLibrarySetEpisodeDetailsParams,
  type VideoLibrarySetMovieDetailsParams,
  type VideoLibrarySetMusicVideoDetailsParams,
  type VideoLibrarySetSeasonDetailsParams,
  type VideoLibrarySetTvShowDetailsParams
} from '$lib/kodi';
import type { KodiKnownNotificationMethod } from '$lib/kodi/notifications';
import {
  DEFAULT_MAIN_NAV_ROWS,
  type MainNavRow,
  type MainNavStore
} from '$lib/stores/mainNav.svelte';
import type { PlayerStore, PlayerStoreSnapshot } from '$lib/stores/player.svelte';
import type { LocalPlayerStore } from '$lib/stores/localPlayer.svelte';
import type { MediaPlaylistsStore } from '$lib/stores/mediaPlaylists.svelte';
import type { PlayerDispatch } from '$lib/stores/playerDispatch.svelte';
import type {
  LocalPlaylistDispatch,
  LocalPlaylistItemInput,
  LocalPlaylistMutationResult,
  LocalPlaylistSnapshot,
  LocalPlaylistStoreSnapshot
} from '$lib/stores/localPlaylist.svelte';

export type AppConfigStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface SelectedItem {
  id: number | string;
  uid?: string;
  type: string;
  label?: string;
  file?: string;
}

export interface ModalSnapshot {
  open: boolean;
  kind: 'modal' | 'confirm' | 'form' | 'textinput' | 'options' | 'youtube' | null;
  titleHtml: string;
  bodyHtml: string;
  footerHtml: string;
  style: string;
  options: string[];
  defaultValue: string;
}

export interface FormItem {
  id: string;
  title?: string;
  type?: string;
  element?: string;
  options?: unknown[];
  defaultValue?: unknown;
  description?: string;
  children?: FormItem[];
  attributes?: Record<string, unknown>;
  class?: string;
  suffix?: string;
  prefix?: string;
  formState?: Record<string, unknown>;
  valueProperty?: string;
  format?: 'array.string' | 'array.integer' | 'integer' | 'float' | 'prevent.submit' | string;
  defaultsApplied?: boolean;
}

export interface InputSnapshot {
  remoteOpen: boolean;
  textboxOpen: boolean;
  textboxValue: string;
}

export type ExternalLookupProvider = 'google' | 'imdb' | 'soundcloud' | 'tmdb' | 'tvdb';
export type PortNotificationHandler = (message: string, params?: Record<string, unknown>) => void;

export interface PortRuntimeSnapshot {
  bodyState: string;
  shellConnected: boolean;
  shellReady: boolean;
  socketsActive: boolean;
  loading: { kind: 'page' | 'view'; message: string } | null;
  notifications: string[];
}

export class AppConfigPort {
  readonly #storage: AppConfigStorage | null;
  readonly #staticValues = new Map<string, unknown>();

  constructor(storage: AppConfigStorage | null = browserStorage()) {
    this.#storage = storage;
  }

  getApp<T>(configId: string, defaultData: T): T {
    const raw = this.#storage?.getItem(`config:app:${configId}`) ?? null;
    if (!raw) return defaultData;
    try {
      const parsed = JSON.parse(raw) as { data?: T };
      return parsed && Object.hasOwn(parsed, 'data') ? (parsed.data as T) : defaultData;
    } catch {
      return defaultData;
    }
  }

  setApp<T>(configId: string, configData: T): T {
    this.#storage?.setItem(
      `config:app:${configId}`,
      JSON.stringify({ id: configId, data: configData })
    );
    return configData;
  }

  getStatic<T>(configId: string, defaultData: T): T {
    return this.#staticValues.has(configId) ? (this.#staticValues.get(configId) as T) : defaultData;
  }

  setStatic<T>(configId: string, data: T): T {
    this.#staticValues.set(configId, data);
    return data;
  }
}

export class SelectionPort {
  #items: SelectedItem[] = [];
  #media = '';
  #type = '';

  getItems(): SelectedItem[] {
    return this.#items.map((item) => ({ ...item }));
  }

  getMedia(): string {
    return this.#media;
  }

  setMedia(media: string): this {
    this.#media = media;
    return this;
  }

  getType(): string {
    return this.#type;
  }

  updateItems(op: 'add' | 'remove', model: SelectedItem): this {
    const uid = model.uid ?? `${model.type}:${model.id}`;
    this.#items = this.#items.filter((item) => (item.uid ?? `${item.type}:${item.id}`) !== uid);
    if (op === 'add') {
      this.#items.push({ ...model, uid });
      this.#type = model.type;
      this.#media = ['song', 'album', 'artist'].includes(model.type) ? 'audio' : 'video';
    }
    return this;
  }

  clearItems(): this {
    this.#items = [];
    return this;
  }

  actionLocalAdd(
    dispatch: LocalPlaylistDispatch,
    playlistId: string
  ): ReturnType<LocalPlaylistDispatch['addItems']> {
    const items: LocalPlaylistItemInput[] = this.#items.flatMap((item) =>
      typeof item.file === 'string' && item.file.trim()
        ? [
            {
              kind: this.#media === 'video' ? 'video' : 'audio',
              label: item.label ?? String(item.id),
              file: item.file
            }
          ]
        : []
    );
    const result = dispatch.addItems(playlistId, items);
    if (result.ok) this.clearItems();
    return result;
  }

  async actionPlay(commands: KodiCommandPort): Promise<unknown[]> {
    const type = this.#typeToKodiId();
    const results: unknown[] = [];
    for (const item of this.#items) {
      results.push(await commands.audioPlay(type, item.id));
    }
    this.clearItems();
    return results;
  }

  async actionAdd(commands: KodiCommandPort): Promise<unknown[]> {
    const type = this.#typeToKodiId();
    const results: unknown[] = [];
    for (const item of this.#items) {
      results.push(await commands.audioAdd(type, item.id));
    }
    this.clearItems();
    return results;
  }

  #typeToKodiId(): string {
    if (this.#type === 'album') return 'albumid';
    if (this.#type === 'artist') return 'artistid';
    if (this.#type === 'movie') return 'movieid';
    if (this.#type === 'episode') return 'episodeid';
    if (this.#type === 'musicvideo') return 'musicvideoid';
    return 'songid';
  }
}

export class UiPort {
  #modal: ModalSnapshot = emptyModal();
  #playerMenuOpen = false;

  get modal(): ModalSnapshot {
    return cloneModal(this.#modal);
  }

  get playerMenuOpen(): boolean {
    return this.#playerMenuOpen;
  }

  showModal(
    titleHtml: string,
    bodyHtml = '',
    footerHtml = '',
    closeButton = false,
    style = ''
  ): ModalSnapshot {
    this.#modal = {
      open: true,
      kind: 'modal',
      titleHtml,
      bodyHtml,
      footerHtml: closeButton ? `${footerHtml}` : footerHtml,
      style,
      options: [],
      defaultValue: ''
    };
    return this.modal;
  }

  confirm(titleHtml: string, msgHtml = '', callback?: (confirmed: true) => void): ModalSnapshot {
    callback?.(true);
    this.#modal = {
      ...emptyModal(),
      open: true,
      kind: 'confirm',
      titleHtml,
      bodyHtml: msgHtml,
      style: 'confirm'
    };
    return this.modal;
  }

  form(titleHtml: string, msgHtml = '', style = 'form'): ModalSnapshot {
    this.#modal = {
      ...emptyModal(),
      open: true,
      kind: 'form',
      titleHtml,
      bodyHtml: msgHtml,
      style
    };
    return this.modal;
  }

  textInput(title: string, options: { msg?: string; defaultVal?: string } = {}): ModalSnapshot {
    this.#modal = {
      ...emptyModal(),
      open: true,
      kind: 'textinput',
      titleHtml: title,
      bodyHtml: options.msg ?? '',
      defaultValue: options.defaultVal ?? ''
    };
    return this.modal;
  }

  options(titleHtml: string, items: string[]): ModalSnapshot {
    this.#modal = {
      ...emptyModal(),
      open: true,
      kind: 'options',
      titleHtml,
      options: [...items],
      style: 'options'
    };
    return this.modal;
  }

  youtube(titleHtml: string, videoid: string): ModalSnapshot {
    const safeId = videoid.replace(/[^A-Za-z0-9_-]/g, '');
    this.#modal = {
      ...emptyModal(),
      open: true,
      kind: 'youtube',
      titleHtml,
      bodyHtml: `<iframe width="560" height="315" src="https://www.youtube.com/embed/${safeId}?rel=0&amp;showinfo=0&amp;autoplay=1" frameborder="0" allowfullscreen></iframe>`,
      style: 'video'
    };
    return this.modal;
  }

  close(): ModalSnapshot {
    this.#modal = emptyModal();
    return this.modal;
  }

  playerMenu(op: 'open' | 'close' | 'toggle' = 'toggle'): boolean {
    if (op === 'open') this.#playerMenuOpen = true;
    else if (op === 'close') this.#playerMenuOpen = false;
    else this.#playerMenuOpen = !this.#playerMenuOpen;
    return this.#playerMenuOpen;
  }
}

export class FormPort {
  itemEntities(form: FormItem[] = [], formState: Record<string, unknown> = {}): FormItem[] {
    return this.#processItems(form, formState);
  }

  valueEntities(
    form: FormItem[] = [],
    formState: Record<string, unknown> = {}
  ): Record<string, unknown> {
    let values = { ...formState };
    for (const item of form) {
      values = this.#formatSubmittedValues(item, values);
      if (item.children?.length) values = this.valueEntities(item.children, values);
    }
    return values;
  }

  #processItems(items: FormItem[], formState: Record<string, unknown>): FormItem[] {
    return items.map((item) => {
      const next = this.#applyState(item, formState);
      if (next.children?.length) next.children = this.#processItems(next.children, formState);
      return next;
    });
  }

  #applyState(item: FormItem, formState: Record<string, unknown>): FormItem {
    const next: FormItem = {
      ...item,
      formState: { ...formState },
      defaultValue: item.defaultValue ?? ''
    };
    const property = item.valueProperty ?? item.id;
    if (Object.hasOwn(formState, property)) {
      next.defaultValue = formatDefaultValue(item.format, formState[property]);
      next.defaultsApplied = true;
    }
    return next;
  }

  #formatSubmittedValues(item: FormItem, values: Record<string, unknown>): Record<string, unknown> {
    if (!item.format || !Object.hasOwn(values, item.id)) return values;
    const next = { ...values };
    const value = next[item.id];
    if (item.format === 'array.string')
      next[item.id] = splitValue(value).map((entry) => entry.trim());
    else if (item.format === 'array.integer')
      next[item.id] = splitValue(value).map((entry) => Number.parseInt(entry.trim(), 10));
    else if (item.format === 'integer') next[item.id] = Number.parseInt(String(value), 10);
    else if (item.format === 'float') next[item.id] = Number.parseFloat(String(value));
    else if (item.format === 'prevent.submit') delete next[item.id];
    return next;
  }
}

export class MainNavigationPort {
  constructor(readonly store?: MainNavStore) {}

  entities(parent: 'all' | string = 'all'): MainNavRow[] {
    const rows =
      this.store?.snapshot.rows ??
      DEFAULT_MAIN_NAV_ROWS.map((row, index) => ({ ...row, weight: index }));
    if (parent === 'all') return rows.map((row) => ({ ...row }));
    const parentRow = rows.find((row) => row.path === parent || row.id === parent);
    return rows
      .filter((row) => row.parent === Number(parentRow?.id ?? parent))
      .map((row) => ({ ...row }));
  }

  arrayEntities(items: Array<Partial<MainNavRow> & { path: string }>): MainNavRow[] {
    return items.map((item, index) => ({
      id: item.id ?? item.path,
      title: item.title ?? item.path,
      path: item.path,
      icon: item.icon ?? '',
      classes: item.classes ?? '',
      parent: item.parent ?? 0,
      weight: item.weight ?? index
    }));
  }

  updateEntities(items: readonly Partial<MainNavRow>[]): void {
    this.store?.replace(items);
  }

  updateDefaults(): void {
    this.store?.reset();
  }
}

export class PlaybackStatePort {
  readonly #playerStore: PlayerStore;
  readonly #localPlayerStore?: LocalPlayerStore;

  constructor(playerStore: PlayerStore, localPlayerStore?: LocalPlayerStore) {
    this.#playerStore = playerStore;
    this.#localPlayerStore = localPlayerStore;
  }

  current(): PlayerStoreSnapshot {
    return this.kodi();
  }

  kodi(): PlayerStoreSnapshot {
    return this.#playerStore.snapshot;
  }

  kodiGet(): PlayerStoreSnapshot {
    return this.kodi();
  }

  async kodiUpdate(
    callback?: (snapshot: PlayerStoreSnapshot) => void
  ): Promise<PlayerStoreSnapshot> {
    await this.#playerStore.refresh('manual');
    const snapshot = this.#playerStore.snapshot;
    callback?.(snapshot);
    return snapshot;
  }

  local(): unknown {
    return this.#localPlayerStore?.snapshot ?? null;
  }

  localGet(): unknown {
    return this.local();
  }

  localUpdate(callback?: (snapshot: unknown) => void): unknown {
    const snapshot = this.local();
    callback?.(snapshot);
    return snapshot;
  }
}

export class KodiCommandPort {
  constructor(readonly client: KodiJsonRpcHttpClient) {}

  async kodiPlayer(method: string, params?: unknown): Promise<unknown> {
    return this.client.call(
      method.includes('.') ? method : `Player.${method}`,
      params as JsonRpcParams | undefined
    );
  }

  kodiController(mediaOrController = 'auto', controller?: string): KodiControllerPort {
    return new KodiControllerPort(this.client, controller ?? mediaOrController);
  }

  localController(dispatch: PlayerDispatch): LocalControllerPort {
    return new LocalControllerPort(dispatch);
  }

  localPlayer(dispatch: PlayerDispatch, command: LocalPlayerCommand): Promise<unknown> {
    return new LocalControllerPort(dispatch).send(command);
  }

  async audioPlay(type: string, value: unknown): Promise<unknown> {
    return openPlayerItem(this.client, { [type]: value } as PlayerOpenItem);
  }

  async audioAdd(type: string, value: unknown): Promise<unknown> {
    return this.client.call('Playlist.Add', { playlistid: 0, item: { [type]: value } });
  }

  async videoPlay(type: string, value: unknown, resume = false): Promise<unknown> {
    if (type === 'file' && typeof value === 'string')
      return openPlayerFile(this.client, { file: value } as KodiFileItem);
    const item = { [type]: value } as PlayerOpenItem;
    return resume
      ? this.client.call('Player.Open', { item, options: { resume } })
      : openPlayerItem(this.client, item);
  }

  cleanAudio(): Promise<unknown> {
    return cleanAudioLibrary(this.client);
  }

  cleanVideo(): Promise<unknown> {
    return cleanVideoLibrary(this.client);
  }
}

export type LocalPlayerCommand = 'playPause' | 'stop' | 'previous' | 'next';

export class LocalControllerPort {
  constructor(readonly dispatch: Pick<PlayerDispatch, LocalPlayerCommand>) {}

  send(command: LocalPlayerCommand): Promise<unknown> {
    return this.dispatch[command]();
  }
}

export class KodiControllerPort {
  constructor(
    readonly client: KodiJsonRpcHttpClient,
    readonly controller: string
  ) {}

  sendCommand(method: string, params?: unknown): Promise<unknown> {
    return this.client.call(
      method.includes('.') ? method : `${this.controller}.${method}`,
      params as JsonRpcParams | undefined
    );
  }

  sendText(text: string): Promise<unknown> {
    return sendInputText(this.client, text);
  }

  sendInput(command: RemoteInputCommand | string): Promise<unknown> {
    return sendInputCommand(this.client, normalizeRemoteCommand(command));
  }

  executeAction(action: RemoteInputAction): Promise<unknown> {
    return executeInputAction(this.client, action);
  }

  getProperties(params?: unknown): Promise<unknown> {
    return this.sendCommand('GetProperties', params);
  }

  play(type: string, value: unknown): Promise<unknown> {
    return openPlayerItem(this.client, { [type]: value } as PlayerOpenItem);
  }

  add(type: string, value: unknown): Promise<unknown> {
    return this.client.call('Playlist.Add', {
      playlistid: this.controller.toLowerCase() === 'playlist' ? 0 : undefined,
      item: { [type]: value }
    });
  }
}

export class IntrospectionPort {
  constructor(readonly client: KodiJsonRpcHttpClient) {}

  entity(params?: Record<string, unknown>): Promise<unknown> {
    return getJsonRpcIntrospection(this.client, params);
  }

  entities(params?: Record<string, unknown>): Promise<unknown> {
    return this.entity(params);
  }

  dictionary(params?: Record<string, unknown>): Promise<unknown> {
    return this.entity(params);
  }
}

export class SettingsPort {
  constructor(readonly client: KodiJsonRpcHttpClient) {}

  getSections(params?: Parameters<typeof getSettingsSections>[1]): Promise<unknown> {
    return getSettingsSections(this.client, params);
  }

  getCategories(params?: Parameters<typeof getSettingsCategories>[1]): Promise<unknown> {
    return getSettingsCategories(this.client, params);
  }

  getSettings(params?: Parameters<typeof getSettings>[1]): Promise<unknown> {
    return getSettings(this.client, params);
  }

  setSettingValue(params: Parameters<typeof setSettingValue>[1]): Promise<unknown> {
    return setSettingValue(this.client, params);
  }
}

export class InputPort {
  #snapshot: InputSnapshot = { remoteOpen: false, textboxOpen: false, textboxValue: '' };

  get snapshot(): InputSnapshot {
    return { ...this.#snapshot };
  }

  textbox(value = ''): InputSnapshot {
    this.#snapshot = { ...this.#snapshot, textboxOpen: true, textboxValue: value };
    return this.snapshot;
  }

  textboxClose(): InputSnapshot {
    this.#snapshot = { ...this.#snapshot, textboxOpen: false, textboxValue: '' };
    return this.snapshot;
  }

  remoteToggle(force?: boolean): InputSnapshot {
    this.#snapshot = { ...this.#snapshot, remoteOpen: force ?? !this.#snapshot.remoteOpen };
    return this.snapshot;
  }

  send(controller: KodiControllerPort, command: RemoteInputCommand | string): Promise<unknown> {
    return controller.sendInput(command);
  }

  action(controller: KodiControllerPort, action: RemoteInputAction): Promise<unknown> {
    return controller.executeAction(action);
  }

  raw(controller: KodiControllerPort, command: string, params?: unknown): Promise<unknown> {
    return controller.sendCommand(command, params);
  }

  externalLookup(provider: ExternalLookupProvider, query: string): string {
    const value = encodeURIComponent(query.trim());
    const templates: Record<ExternalLookupProvider, string> = {
      google: `https://www.google.com/search?q=${value}`,
      imdb: `https://www.imdb.com/find/?q=${value}`,
      soundcloud: `https://soundcloud.com/search?q=${value}`,
      tmdb: `https://www.themoviedb.org/search?query=${value}`,
      tvdb: `https://thetvdb.com/search?query=${value}`
    };
    return templates[provider];
  }

  handleKodiInputRequested(message = ''): InputSnapshot {
    return this.textbox(message);
  }

  handleKodiInputFinished(): InputSnapshot {
    return this.textboxClose();
  }

  async resume(dispatch: Pick<PlayerDispatch, 'playPause'>): Promise<unknown> {
    return dispatch.playPause();
  }
}

export class MediaEntityPort {
  constructor(readonly client: KodiJsonRpcHttpClient) {}

  static readonly audioFields = {
    artist: ['artist', 'thumbnail', 'fanart', 'genre', 'description'],
    album: ['title', 'artist', 'thumbnail', 'fanart', 'genre', 'year', 'rating'],
    song: ['title', 'artist', 'album', 'duration', 'track', 'thumbnail', 'file']
  } as const;

  static readonly videoFields = {
    movie: ['title', 'year', 'rating', 'thumbnail', 'fanart', 'file', 'playcount'],
    tvshow: ['title', 'year', 'rating', 'thumbnail', 'fanart', 'playcount'],
    episode: ['title', 'season', 'episode', 'thumbnail', 'file', 'playcount'],
    musicvideo: ['title', 'artist', 'album', 'genre', 'thumbnail', 'file', 'playcount']
  } as const;

  artists(params?: Parameters<typeof getAudioLibraryArtists>[1]): Promise<unknown> {
    return getAudioLibraryArtists(this.client, params);
  }
  albums(params?: Parameters<typeof getAudioLibraryAlbums>[1]): Promise<unknown> {
    return getAudioLibraryAlbums(this.client, params);
  }
  songs(params?: Parameters<typeof getAudioLibrarySongs>[1]): Promise<unknown> {
    return getAudioLibrarySongs(this.client, params);
  }
  genres(params?: Parameters<typeof getAudioLibraryGenres>[1]): Promise<unknown> {
    return getAudioLibraryGenres(this.client, params);
  }
  movies(params?: Parameters<typeof getVideoLibraryMovies>[1]): Promise<unknown> {
    return getVideoLibraryMovies(this.client, params);
  }
  movieDetails(params: Parameters<typeof getVideoLibraryMovieDetails>[1]): Promise<unknown> {
    return getVideoLibraryMovieDetails(this.client, params);
  }
  tvShows(params?: Parameters<typeof getVideoLibraryTvShows>[1]): Promise<unknown> {
    return getVideoLibraryTvShows(this.client, params);
  }
  tvShowDetails(params: Parameters<typeof getVideoLibraryTvShowDetails>[1]): Promise<unknown> {
    return getVideoLibraryTvShowDetails(this.client, params);
  }
  seasons(params: Parameters<typeof getVideoLibrarySeasons>[1]): Promise<unknown> {
    return getVideoLibrarySeasons(this.client, params);
  }
  episodes(params?: Parameters<typeof getVideoLibraryEpisodes>[1]): Promise<unknown> {
    return getVideoLibraryEpisodes(this.client, params);
  }
  episodeDetails(params: Parameters<typeof getVideoLibraryEpisodeDetails>[1]): Promise<unknown> {
    return getVideoLibraryEpisodeDetails(this.client, params);
  }
  musicVideos(params?: Parameters<typeof getVideoLibraryMusicVideos>[1]): Promise<unknown> {
    return getVideoLibraryMusicVideos(this.client, params);
  }
  musicVideoDetails(
    params: Parameters<typeof getVideoLibraryMusicVideoDetails>[1]
  ): Promise<unknown> {
    return getVideoLibraryMusicVideoDetails(this.client, params);
  }
  albumDetails(params: { albumid: number; properties?: readonly string[] }): Promise<unknown> {
    return this.client.call('AudioLibrary.GetAlbumDetails', params);
  }
  artistDetails(params: { artistid: number; properties?: readonly string[] }): Promise<unknown> {
    return this.client.call('AudioLibrary.GetArtistDetails', params);
  }
  songDetails(params: { songid: number; properties?: readonly string[] }): Promise<unknown> {
    return this.client.call('AudioLibrary.GetSongDetails', params);
  }
  seasonDetails(params: Parameters<typeof getVideoLibrarySeasonDetails>[1]): Promise<unknown> {
    return getVideoLibrarySeasonDetails(this.client, params);
  }

  setAlbum(params: AudioLibrarySetAlbumDetailsParams): Promise<unknown> {
    return setAlbumDetails(this.client, params);
  }
  setArtist(params: AudioLibrarySetArtistDetailsParams): Promise<unknown> {
    return setArtistDetails(this.client, params);
  }
  setSong(params: AudioLibrarySetSongDetailsParams): Promise<unknown> {
    return setSongDetails(this.client, params);
  }
  setMovie(params: VideoLibrarySetMovieDetailsParams): Promise<unknown> {
    return setMovieDetails(this.client, params);
  }
  setTvShow(params: VideoLibrarySetTvShowDetailsParams): Promise<unknown> {
    return setTvShowDetails(this.client, params);
  }
  setEpisode(params: VideoLibrarySetEpisodeDetailsParams): Promise<unknown> {
    return setEpisodeDetails(this.client, params);
  }
  setMusicVideo(params: VideoLibrarySetMusicVideoDetailsParams): Promise<unknown> {
    return setMusicVideoDetails(this.client, params);
  }
  setSeason(params: VideoLibrarySetSeasonDetailsParams): Promise<unknown> {
    return setSeasonDetails(this.client, params);
  }

  setWatched(
    kind: 'song' | 'movie' | 'episode' | 'tvshow' | 'musicvideo',
    id: number,
    watched: boolean
  ): Promise<unknown> {
    const playcount = watched ? 1 : 0;
    if (kind === 'song') return this.setSong({ songid: id, playcount });
    if (kind === 'movie') return this.setMovie({ movieid: id, playcount });
    if (kind === 'episode') return this.setEpisode({ episodeid: id, playcount });
    if (kind === 'tvshow') return this.setTvShow({ tvshowid: id, playcount });
    return this.setMusicVideo({ musicvideoid: id, playcount });
  }

  refreshMovie(params: Parameters<typeof refreshVideoLibraryMovie>[1]): Promise<unknown> {
    return refreshVideoLibraryMovie(this.client, params);
  }

  refreshTvShow(params: Parameters<typeof refreshVideoLibraryTvShow>[1]): Promise<unknown> {
    return refreshVideoLibraryTvShow(this.client, params);
  }

  refreshEpisode(params: Parameters<typeof refreshVideoLibraryEpisode>[1]): Promise<unknown> {
    return refreshVideoLibraryEpisode(this.client, params);
  }

  scanAudio(params: Parameters<typeof scanAudioLibrary>[1] = {}): Promise<unknown> {
    return scanAudioLibrary(this.client, params);
  }

  scanVideo(params: Parameters<typeof scanVideoLibrary>[1] = {}): Promise<unknown> {
    return scanVideoLibrary(this.client, params);
  }
}

export class LocalPlaylistPort {
  constructor(readonly dispatch: LocalPlaylistDispatch) {}

  entities(snapshot: LocalPlaylistStoreSnapshot): LocalPlaylistSnapshot[] {
    return snapshot.playlists.map((playlist) => ({
      ...playlist,
      items: playlist.items.map((item) => ({ ...item }))
    }));
  }

  entity(snapshot: LocalPlaylistStoreSnapshot, playlistId: string): LocalPlaylistSnapshot | null {
    const playlist = snapshot.playlists.find((candidate) => candidate.id === playlistId) ?? null;
    return playlist ? { ...playlist, items: playlist.items.map((item) => ({ ...item })) } : null;
  }

  newList(label: string): LocalPlaylistMutationResult<{ playlist: LocalPlaylistSnapshot }> {
    return this.dispatch.createPlaylist(label);
  }

  rename(
    playlistId: string,
    label: string
  ): LocalPlaylistMutationResult<{ playlist: LocalPlaylistSnapshot }> {
    return this.dispatch.renamePlaylist(playlistId, label);
  }

  removeEntity(playlistId: string): LocalPlaylistMutationResult {
    return this.dispatch.removePlaylist(playlistId);
  }

  clearEntities(playlistId: string): LocalPlaylistMutationResult {
    return this.dispatch.clearPlaylist(playlistId);
  }

  addEntity(
    playlistId: string,
    item: LocalPlaylistItemInput
  ): ReturnType<LocalPlaylistDispatch['addItems']> {
    return this.dispatch.addItems(playlistId, [item]);
  }

  addEntities(
    playlistId: string,
    items: LocalPlaylistItemInput[]
  ): ReturnType<LocalPlaylistDispatch['addItems']> {
    return this.dispatch.addItems(playlistId, items);
  }

  itemEntities(
    playlistId: string
  ): ReturnType<NonNullable<LocalPlaylistDispatch['getPlayableItems']>> {
    return this.dispatch.getPlayableItems?.(playlistId) ?? [];
  }

  updateOrder(playlistId: string, itemIds: string[]): LocalPlaylistMutationResult {
    return this.dispatch.reorderItems(playlistId, itemIds);
  }

  reload(snapshot: LocalPlaylistStoreSnapshot): LocalPlaylistStoreSnapshot {
    return cloneLocalPlaylistSnapshot(snapshot);
  }
}

export class MediaPlaylistPort {
  constructor(
    readonly store: Pick<
      MediaPlaylistsStore,
      'refreshPlaylists' | 'openPlaylist' | 'getPlayablePlaylist' | 'clear' | 'snapshot'
    >
  ) {}

  async refresh(): Promise<void> {
    await this.store.refreshPlaylists();
  }

  async list(): Promise<void> {
    await this.refresh();
  }

  entities(): unknown[] {
    return this.store.snapshot.playlists.map((playlist) => ({
      ...playlist,
      capabilities: { ...playlist.capabilities }
    }));
  }

  async entityApi(id: string): Promise<unknown> {
    await this.store.openPlaylist(id);
    return {
      entries: this.store.snapshot.entries.map((entry) => ({
        ...entry,
        capabilities: { ...entry.capabilities }
      })),
      breadcrumbs: this.store.snapshot.breadcrumbs.map((breadcrumb) => ({ ...breadcrumb }))
    };
  }

  playable(id: string): ReturnType<MediaPlaylistsStore['getPlayablePlaylist']> {
    return this.store.getPlayablePlaylist(id);
  }
}

export class RuntimePort {
  #snapshot: PortRuntimeSnapshot = {
    bodyState: '',
    shellConnected: true,
    shellReady: false,
    socketsActive: false,
    loading: null,
    notifications: []
  };

  get snapshot(): PortRuntimeSnapshot {
    return {
      ...this.#snapshot,
      loading: this.#snapshot.loading ? { ...this.#snapshot.loading } : null,
      notifications: [...this.#snapshot.notifications]
    };
  }

  setBodyState(state: string): PortRuntimeSnapshot {
    this.#snapshot = { ...this.#snapshot, bodyState: state };
    return this.snapshot;
  }

  showLoading(kind: 'page' | 'view', message = 'Loading...'): PortRuntimeSnapshot {
    this.#snapshot = { ...this.#snapshot, loading: { kind, message } };
    return this.snapshot;
  }

  showNotification(message: string): PortRuntimeSnapshot {
    this.#snapshot = {
      ...this.#snapshot,
      notifications: [...this.#snapshot.notifications, message]
    };
    return this.snapshot;
  }

  disconnect(): PortRuntimeSnapshot {
    this.#snapshot = { ...this.#snapshot, shellConnected: false, shellReady: false };
    return this.snapshot;
  }

  reconnect(): PortRuntimeSnapshot {
    this.#snapshot = { ...this.#snapshot, shellConnected: true };
    return this.snapshot;
  }

  viewReady(): PortRuntimeSnapshot {
    this.#snapshot = { ...this.#snapshot, shellReady: true };
    return this.snapshot;
  }

  setSocketsActive(active: boolean): PortRuntimeSnapshot {
    this.#snapshot = { ...this.#snapshot, socketsActive: active };
    return this.snapshot;
  }
}

export class SearchPort {
  go(query: string, baseRoute = 'search'): string {
    const trimmed = query.trim();
    return trimmed ? `#${baseRoute}?q=${encodeURIComponent(trimmed)}` : `#${baseRoute}`;
  }
}

export class SearchAddonsPort {
  #items: unknown[] = [];

  entities(): unknown[] {
    return structuredClone(this.#items);
  }

  updateEntities(items: unknown[]): unknown[] {
    this.#items = structuredClone(items);
    return this.entities();
  }

  updateDefaults(): unknown[] {
    this.#items = [];
    return [];
  }
}

export class CastPort {
  entities(items: unknown[] = []): unknown[] {
    return structuredClone(items);
  }

  listView(items: unknown[] = []): { items: unknown[]; view: 'list' } {
    return { items: this.entities(items), view: 'list' };
  }
}

export class AddonControllerPort {
  constructor(readonly client: KodiJsonRpcHttpClient) {}

  execute(params: AddonsExecuteAddonParams): Promise<unknown> {
    return executeAddon(this.client, params);
  }

  details(params: AddonsGetAddonDetailsParams): Promise<unknown> {
    return getAddonDetails(this.client, params);
  }
}

export class GuiPort {
  constructor(readonly client: KodiJsonRpcHttpClient) {}

  window(params?: JsonRpcParams): Promise<unknown> {
    return this.client.call('GUI.Window', params);
  }
}

export class JsonRpcAliasPort {
  constructor(readonly client: KodiJsonRpcHttpClient) {}

  ping(): Promise<unknown> {
    return pingKodi(this.client);
  }

  introspect(params?: Parameters<typeof getJsonRpcIntrospection>[1]): Promise<unknown> {
    return getJsonRpcIntrospection(this.client, params);
  }

  version(): Promise<unknown> {
    return getJsonRpcVersion(this.client);
  }

  activePlayers(): Promise<unknown> {
    return getActivePlayers(this.client);
  }

  properties(params: PlayerPropertiesParams): Promise<unknown> {
    return getPlayerProperties(this.client, params.playerid, params.properties);
  }

  item(params: PlayerItemParams): Promise<unknown> {
    return getPlayerItem(this.client, params.playerid, params.properties);
  }
}

export class ApplicationPort {
  constructor(readonly client: KodiJsonRpcHttpClient) {}

  properties(properties: Parameters<typeof getApplicationProperties>[1]): Promise<unknown> {
    return getApplicationProperties(this.client, properties);
  }

  setVolume(volume: number): Promise<unknown> {
    return setApplicationVolume(this.client, volume);
  }

  quit(): Promise<unknown> {
    return this.client.call('Application.Quit');
  }

  handleVolumeChanged(
    params: Record<string, unknown>,
    notify?: PortNotificationHandler
  ): Record<string, unknown> {
    notify?.('Volume changed', params);
    return { ...params };
  }
}

export class SystemPort {
  constructor(readonly client: KodiJsonRpcHttpClient) {}

  properties(properties: readonly SystemPropertyName[]): Promise<unknown> {
    return getSystemProperties(this.client, properties);
  }

  shutdown(): Promise<unknown> {
    return this.client.call('System.Shutdown');
  }

  reboot(): Promise<unknown> {
    return this.client.call('System.Reboot');
  }

  suspend(): Promise<unknown> {
    return this.client.call('System.Suspend');
  }

  hibernate(): Promise<unknown> {
    return this.client.call('System.Hibernate');
  }

  handleNotification(
    method: Extract<
      KodiKnownNotificationMethod,
      'System.OnQuit' | 'System.OnRestart' | 'System.OnWake'
    >,
    notify?: PortNotificationHandler
  ): string {
    const message =
      method === 'System.OnQuit'
        ? 'Kodi has quit'
        : method === 'System.OnRestart'
          ? 'Kodi has restarted'
          : 'Kodi has woken';
    notify?.(message, { method });
    return message;
  }
}

export class PlayerEventPort {
  #lastNotification: KodiKnownNotificationMethod | null = null;
  #timerActive = false;

  get lastNotification(): KodiKnownNotificationMethod | null {
    return this.#lastNotification;
  }

  get timerActive(): boolean {
    return this.#timerActive;
  }

  async updateKodiProgress(store: Pick<PlayerStore, 'refresh'>): Promise<void> {
    await store.refresh('manual');
  }

  updateLocalProgress(store: Pick<LocalPlayerStore, 'snapshot'>): unknown {
    return store.snapshot;
  }

  startKodiTimer(): void {
    this.#timerActive = true;
  }

  stopKodiTimer(): void {
    this.#timerActive = false;
  }

  handleNotification(
    method: Extract<
      KodiKnownNotificationMethod,
      | 'Player.OnPause'
      | 'Player.OnPlay'
      | 'Player.OnPropertyChanged'
      | 'Player.OnResume'
      | 'Player.OnSeek'
      | 'Player.OnStop'
    >
  ): KodiKnownNotificationMethod {
    this.#lastNotification = method;
    return method;
  }
}

export class LocalPlayerPort {
  clearEntities(store: Pick<LocalPlaylistDispatch, 'reset'>): void {
    store.reset();
  }

  addItemEntities(
    dispatch: LocalPlaylistDispatch,
    playlistId: string,
    items: LocalPlaylistItemInput[]
  ): ReturnType<LocalPlaylistDispatch['addItems']> {
    return dispatch.addItems(playlistId, items);
  }
}

export class MetadataLookupPort {
  fanartArtistImages(artist: string): string {
    return `https://webservice.fanart.tv/v3/music/${encodeURIComponent(artist.trim())}`;
  }

  musicbrainzArtist(artist: string): string {
    return `https://musicbrainz.org/search?query=${encodeURIComponent(artist.trim())}&type=artist`;
  }

  themoviedbMovieImages(query: string): string {
    return `https://www.themoviedb.org/search/movie?query=${encodeURIComponent(query.trim())}`;
  }

  themoviedbTvImages(query: string): string {
    return `https://www.themoviedb.org/search/tv?query=${encodeURIComponent(query.trim())}`;
  }

  youtubeSearch(query: string): string {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`;
  }

  youtubeTrailer(query: string): string {
    return this.youtubeSearch(`${query.trim()} trailer`);
  }
}

export class NavigationAliasPort {
  route(path: string): string {
    const normalized = path.trim().replace(/^#?/u, '').replace(/^\/+/u, '');
    return `#${normalized}`;
  }

  row(surface: string): MainNavRow {
    const path = surface.trim().replace(/^\/+/u, '');
    return {
      id: path || 'home',
      title: surface || 'Home',
      path,
      icon: '',
      classes: '',
      parent: 0,
      weight: 0
    };
  }
}

export async function jsonRpcCore(client: KodiJsonRpcHttpClient): Promise<{
  ping: unknown;
  activePlayers: unknown;
}> {
  const [ping, activePlayers] = await Promise.all([pingKodi(client), getActivePlayers(client)]);
  return { ping, activePlayers };
}

export async function playerSnapshot(
  client: KodiJsonRpcHttpClient,
  playerid: number
): Promise<{
  properties: unknown;
  item: unknown;
}> {
  const [properties, item] = await Promise.all([
    getPlayerProperties(client, playerid, [
      'speed',
      'percentage',
      'time',
      'totaltime',
      'playlistid',
      'position'
    ]),
    getPlayerItem(client, playerid, ['title', 'artist', 'album', 'thumbnail', 'fanart', 'file'])
  ]);
  return { properties, item };
}

export function imagePath(value?: unknown): string {
  if (typeof value === 'string' && value.trim()) {
    return `/image/${encodeURIComponent(value.trim())}`;
  }
  return '/addons/webinterface.chorus3/assets/classic/thumbnail_default.png';
}

export function imageEntity<T extends Record<string, unknown>>(
  entity: T
): T & { thumbnail?: string; fanart?: string } {
  return {
    ...entity,
    ...(entity.thumbnail ? { thumbnail: imagePath(entity.thumbnail) } : {}),
    ...(entity.fanart ? { fanart: imagePath(entity.fanart) } : {})
  };
}

export function loadingView(message = 'Loading...'): { message: string; status: 'loading' } {
  return { message, status: 'loading' };
}

export async function whenEntityFetched<T>(
  entity: T | Promise<T>,
  callback?: (value: T) => void
): Promise<T> {
  const value = await entity;
  callback?.(value);
  return value;
}

export function cloneLocalPlaylistSnapshot(
  snapshot: LocalPlaylistStoreSnapshot
): LocalPlaylistStoreSnapshot {
  return structuredClone(snapshot);
}

function emptyModal(): ModalSnapshot {
  return {
    open: false,
    kind: null,
    titleHtml: '',
    bodyHtml: '',
    footerHtml: '',
    style: '',
    options: [],
    defaultValue: ''
  };
}

function cloneModal(value: ModalSnapshot): ModalSnapshot {
  return { ...value, options: [...value.options] };
}

function formatDefaultValue(format: FormItem['format'], value: unknown): unknown {
  if ((format === 'array.string' || format === 'array.integer') && Array.isArray(value)) {
    return value.join('; ');
  }
  if (format === 'integer' && value !== '') {
    return Number.parseInt(String(value), 10);
  }
  return value;
}

function splitValue(value: unknown): string[] {
  const text = typeof value === 'string' ? value : '';
  return text === '' ? [] : text.split(';');
}

function browserStorage(): AppConfigStorage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

function normalizeRemoteCommand(command: string): RemoteInputCommand {
  const normalized = command.toLowerCase();
  if (normalized === 'left') return 'left';
  if (normalized === 'right') return 'right';
  if (normalized === 'up') return 'up';
  if (normalized === 'down') return 'down';
  if (normalized === 'back') return 'back';
  if (normalized === 'select') return 'select';
  if (normalized === 'contextmenu') return 'contextMenu';
  if (normalized === 'info') return 'info';
  if (normalized === 'home') return 'home';
  return 'select';
}
