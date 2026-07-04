import { type KodiHttpCallOptions, type KodiJsonRpcHttpClient } from '$lib/kodi';
import { createActiveKodiJsonRpcHttpClient } from './kodiClient';

import type {
  AddonEntityFilter,
  AddonSearchSetting,
  AddonSnapshot,
  AddonsGroupBy,
  AddonsSafeErrorSnapshot,
  AddonsStoreMethods,
  AddonsStoreOptions,
  AddonsStoreSnapshot
} from './addonsStoreTypes';

export type {
  AddonEntityFilter,
  AddonSearchSetting,
  AddonSnapshot,
  AddonsDetailStatus,
  AddonsErrorSource,
  AddonsGroupBy,
  AddonsGroupSnapshot,
  AddonsLastWriteSnapshot,
  AddonsLoadStatus,
  AddonsPendingToggleSnapshot,
  AddonsRefreshAfterWriteSnapshot,
  AddonsSafeErrorSnapshot,
  AddonsStoreMethods,
  AddonsStoreOptions,
  AddonsStoreSnapshot,
  AddonsWriteCountsSnapshot,
  AddonsWriteStatus
} from './addonsStoreTypes';

import {
  ADDON_PROPERTIES,
  DEFAULT_METHODS,
  DEFAULT_SNAPSHOT,
  INVALID_ADDON_ID_ERROR,
  NO_ACTIVE_HOST_ERROR,
  addonMatchesEntityType,
  cloneAddon,
  cloneError,
  cloneSnapshot,
  createGetAddonsParams,
  createSafeError,
  getAddonDetailPayload,
  getAddonExcludedPaths,
  getAddonSearchSettings,
  isSafeAddonId,
  normalizeAddons,
  normalizeAddonDetail,
  recomputeDerived,
  replaceAddon,
  rollbackAddons,
  rollbackDetail,
  sanitizeScalar
} from './addonsStoreModel';
import {
  cachedFrozenJsonSnapshot,
  materializeSmallJsonSnapshot,
  type JsonSnapshotCache
} from './snapshotCache';

export { getAddonExcludedPaths, getAddonSearchSettings } from './addonsStoreModel';

export class AddonsStore {
  #snapshot = $state<AddonsStoreSnapshot>(cloneSnapshot(DEFAULT_SNAPSHOT));
  #publicSnapshot: JsonSnapshotCache<AddonsStoreSnapshot> = {
    source: null,
    snapshot: null
  };
  readonly #createClient: () =>
    | KodiJsonRpcHttpClient
    | null
    | Promise<KodiJsonRpcHttpClient | null>;
  readonly #methods: AddonsStoreMethods;
  readonly #now: () => string;
  #listRequestId = 0;
  #detailRequestId = 0;
  #listAbortController: AbortController | null = null;
  #detailAbortController: AbortController | null = null;

  constructor(options: AddonsStoreOptions = {}) {
    this.#createClient =
      options.createClient ?? options.clientProvider ?? createActiveKodiJsonRpcHttpClient;
    this.#methods = options.methods ?? DEFAULT_METHODS;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get snapshot(): AddonsStoreSnapshot {
    return cachedFrozenJsonSnapshot(
      this.#publicSnapshot,
      this.#snapshot,
      materializeSmallJsonSnapshot
    );
  }

  reset(): void {
    this.#cancelListLoad();
    this.#cancelDetailLoad();
    this.#snapshot = cloneSnapshot(DEFAULT_SNAPSHOT);
  }

  getAddonEntities(type: AddonEntityFilter = 'all'): AddonSnapshot[] {
    return this.#snapshot.addons
      .filter((addon) => addonMatchesEntityType(addon, type))
      .map(cloneAddon);
  }

  getEnabledAddons(): AddonSnapshot[] {
    return this.#snapshot.addons.filter((addon) => addon.enabled === true).map(cloneAddon);
  }

  isAddonEnabled(
    filter: Partial<Pick<AddonSnapshot, 'addonid' | 'name' | 'type'>> = {}
  ): AddonSnapshot | null {
    const filterEntries = Object.entries(filter);
    const match = this.#snapshot.addons.find((addon) => {
      if (addon.enabled !== true) return false;
      return filterEntries.every(([key, value]) => {
        if (value === undefined || value === null || value === '') return true;
        return addon[key as keyof Pick<AddonSnapshot, 'addonid' | 'name' | 'type'>] === value;
      });
    });
    return match ? cloneAddon(match) : null;
  }

  getSearchSettings(
    addons: readonly AddonSnapshot[] = this.getEnabledAddons()
  ): AddonSearchSetting[] {
    return addons.flatMap((addon) => getAddonSearchSettings(addon.addonid));
  }

  getExcludedPaths(addonid: string): string[] {
    return getAddonExcludedPaths(addonid);
  }

  async loadAddons(): Promise<void> {
    const requestId = this.#beginListLoad();
    const client = await this.#resolveClient();
    if (!client) {
      this.#failListLoad(requestId, NO_ACTIVE_HOST_ERROR);
      return;
    }

    try {
      const addons = normalizeAddons(
        (await this.#methods.getAddons(client, createGetAddonsParams(), this.#listCallOptions()))
          .addons
      );
      this.#commitListLoad(requestId, addons);
    } catch (error) {
      this.#failListLoad(requestId, createSafeError(error, 'addons'));
    }
  }

  setSearchQuery(query: string): void {
    this.#snapshot = recomputeDerived({
      ...this.#snapshot,
      searchQuery: sanitizeScalar(query).trim()
    });
  }

  setGroupBy(groupBy: AddonsGroupBy): void {
    this.#snapshot = recomputeDerived({ ...this.#snapshot, groupBy });
  }

  async loadAddonDetail(addonid: string): Promise<void> {
    if (!isSafeAddonId(addonid)) {
      this.#cancelDetailLoad();
      this.#snapshot = {
        ...this.#snapshot,
        detailStatus: 'error',
        lastError: cloneError(INVALID_ADDON_ID_ERROR)
      };
      return;
    }

    const requestId = this.#beginDetailLoad(addonid);
    const client = await this.#resolveClient();
    if (!client) {
      this.#failDetailLoad(requestId, NO_ACTIVE_HOST_ERROR);
      return;
    }

    try {
      const detail = normalizeAddonDetail(
        getAddonDetailPayload(
          await this.#methods.getAddonDetails(
            client,
            {
              addonid,
              properties: ADDON_PROPERTIES
            },
            this.#detailCallOptions()
          )
        )
      );
      this.#commitDetailLoad(requestId, addonid, detail);
    } catch (error) {
      this.#failDetailLoad(requestId, createSafeError(error, 'addons'));
    }
  }

  async setAddonEnabled(addonid: string, enabled: boolean): Promise<void> {
    if (!isSafeAddonId(addonid) || typeof enabled !== 'boolean') {
      this.#snapshot = {
        ...this.#snapshot,
        writeStatus: 'error',
        lastError: cloneError(INVALID_ADDON_ID_ERROR)
      };
      return;
    }

    const previousEnabled = this.#findKnownEnabled(addonid);
    const requestedAt = this.#now();
    const client = await this.#resolveClient();
    if (!client) {
      this.#setWriteError(NO_ACTIVE_HOST_ERROR, addonid, enabled, previousEnabled, false);
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      writeStatus: 'pending',
      lastError: null,
      pendingToggle: { addonid, enabled, requestedAt },
      rollbackEnabled: previousEnabled,
      lastWrite: { addonid, enabled, status: 'pending', at: requestedAt },
      refreshAfterWrite: { addonid, requestedAt, refreshed: false, warning: null },
      writeCounts: {
        ...this.#snapshot.writeCounts,
        attempted: this.#snapshot.writeCounts.attempted + 1
      }
    };

    try {
      await this.#methods.setAddonEnabled(client, { addonid, enabled });
    } catch (error) {
      this.#setWriteError(createSafeError(error, 'write'), addonid, enabled, previousEnabled, true);
      return;
    }

    const refreshError = await this.#refreshAfterSuccessfulWrite(client, addonid);
    this.#snapshot = {
      ...this.#snapshot,
      writeStatus: 'success',
      pendingToggle: null,
      lastWrite: { addonid, enabled, status: 'success', at: requestedAt },
      lastError: refreshError,
      refreshAfterWrite: {
        addonid,
        requestedAt,
        refreshed: refreshError === null,
        warning: refreshError ? refreshError.message : null
      },
      writeCounts: {
        ...this.#snapshot.writeCounts,
        succeeded: this.#snapshot.writeCounts.succeeded + 1
      }
    };
  }

  async executeAddon(addonid: string): Promise<void> {
    if (!isSafeAddonId(addonid)) {
      this.#snapshot = {
        ...this.#snapshot,
        writeStatus: 'error',
        lastError: cloneError(INVALID_ADDON_ID_ERROR)
      };
      return;
    }

    const client = await this.#resolveClient();
    if (!client) {
      this.#snapshot = {
        ...this.#snapshot,
        writeStatus: 'error',
        lastError: cloneError(NO_ACTIVE_HOST_ERROR),
        writeCounts: { ...this.#snapshot.writeCounts }
      };
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      writeStatus: 'pending',
      lastError: null,
      writeCounts: {
        ...this.#snapshot.writeCounts,
        attempted: this.#snapshot.writeCounts.attempted + 1
      }
    };

    try {
      await this.#methods.executeAddon(client, { addonid });
    } catch (error) {
      this.#snapshot = {
        ...this.#snapshot,
        writeStatus: 'error',
        lastError: createSafeError(error, 'write'),
        writeCounts: {
          ...this.#snapshot.writeCounts,
          failed: this.#snapshot.writeCounts.failed + 1
        }
      };
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      writeStatus: 'success',
      lastError: null,
      writeCounts: {
        ...this.#snapshot.writeCounts,
        succeeded: this.#snapshot.writeCounts.succeeded + 1
      }
    };
  }

  async #refreshAfterSuccessfulWrite(
    client: KodiJsonRpcHttpClient,
    addonid: string
  ): Promise<AddonsSafeErrorSnapshot | null> {
    try {
      const detail = normalizeAddonDetail(
        getAddonDetailPayload(
          await this.#methods.getAddonDetails(client, { addonid, properties: ADDON_PROPERTIES })
        )
      );
      let addons = this.#snapshot.addons;
      try {
        addons = normalizeAddons(
          (await this.#methods.getAddons(client, createGetAddonsParams())).addons
        );
      } catch {
        addons = this.#snapshot.addons;
      }
      addons = replaceAddon(addons, detail);
      const detailIsSelected = this.#snapshot.selectedAddonId === detail.addonid;
      this.#snapshot = recomputeDerived({
        ...this.#snapshot,
        addons,
        ...(detailIsSelected
          ? {
              detailStatus: 'success' as const,
              selectedAddonId: detail.addonid,
              detail
            }
          : {})
      });
      return null;
    } catch (error) {
      return {
        ...createSafeError(error, 'refresh'),
        source: 'refresh',
        code: 'refresh/failed',
        message: 'Add-on write succeeded, but refreshed add-on state is unavailable.'
      };
    }
  }

  #findKnownEnabled(addonid: string): boolean | null {
    if (
      this.#snapshot.detail?.addonid === addonid &&
      typeof this.#snapshot.detail.enabled === 'boolean'
    ) {
      return this.#snapshot.detail.enabled;
    }
    const addon = this.#snapshot.addons.find((candidate) => candidate.addonid === addonid);
    return typeof addon?.enabled === 'boolean' ? addon.enabled : null;
  }

  #beginListLoad(): number {
    this.#listAbortController?.abort();
    this.#listAbortController = new AbortController();
    this.#listRequestId += 1;
    this.#snapshot = { ...this.#snapshot, loadStatus: 'loading', lastError: null };
    return this.#listRequestId;
  }

  #commitListLoad(requestId: number, addons: AddonSnapshot[]): void {
    if (requestId !== this.#listRequestId) return;
    this.#snapshot = recomputeDerived({
      ...this.#snapshot,
      loadStatus: 'success',
      addons,
      lastError: null
    });
  }

  #failListLoad(requestId: number, error: AddonsSafeErrorSnapshot): void {
    if (requestId !== this.#listRequestId) return;
    this.#snapshot = {
      ...this.#snapshot,
      loadStatus: 'error',
      lastError: cloneError(error)
    };
  }

  #beginDetailLoad(addonid: string): number {
    this.#detailAbortController?.abort();
    this.#detailAbortController = new AbortController();
    this.#detailRequestId += 1;
    this.#snapshot = {
      ...this.#snapshot,
      detailStatus: 'loading',
      selectedAddonId: addonid,
      lastError: null
    };
    return this.#detailRequestId;
  }

  #commitDetailLoad(requestId: number, requestedAddonId: string, detail: AddonSnapshot): void {
    if (requestId !== this.#detailRequestId) return;
    if (
      this.#snapshot.selectedAddonId !== requestedAddonId ||
      detail.addonid !== requestedAddonId
    ) {
      return;
    }
    this.#snapshot = recomputeDerived({
      ...this.#snapshot,
      detailStatus: 'success',
      selectedAddonId: detail.addonid,
      detail,
      addons: replaceAddon(this.#snapshot.addons, detail),
      lastError: null
    });
  }

  #failDetailLoad(requestId: number, error: AddonsSafeErrorSnapshot): void {
    if (requestId !== this.#detailRequestId) return;
    this.#snapshot = {
      ...this.#snapshot,
      detailStatus: 'error',
      lastError: cloneError(error)
    };
  }

  #setWriteError(
    error: AddonsSafeErrorSnapshot,
    addonid: string,
    enabled: boolean,
    rollbackEnabled: boolean | null,
    incrementFailed: boolean
  ): void {
    const at = this.#now();
    this.#snapshot = recomputeDerived({
      ...this.#snapshot,
      writeStatus: 'error',
      pendingToggle: null,
      lastError: cloneError(error),
      lastWrite: { addonid, enabled, status: 'error', at },
      rollbackEnabled,
      detail: rollbackDetail(this.#snapshot.detail, addonid, rollbackEnabled),
      addons: rollbackAddons(this.#snapshot.addons, addonid, rollbackEnabled),
      writeCounts: incrementFailed
        ? { ...this.#snapshot.writeCounts, failed: this.#snapshot.writeCounts.failed + 1 }
        : { ...this.#snapshot.writeCounts }
    });
  }

  async #resolveClient(): Promise<KodiJsonRpcHttpClient | null> {
    try {
      return await this.#createClient();
    } catch {
      return null;
    }
  }

  #cancelListLoad(): void {
    this.#listAbortController?.abort();
    this.#listAbortController = null;
    this.#listRequestId += 1;
  }

  #cancelDetailLoad(): void {
    this.#detailAbortController?.abort();
    this.#detailAbortController = null;
    this.#detailRequestId += 1;
  }

  #listCallOptions(): KodiHttpCallOptions {
    return { signal: this.#listAbortController?.signal };
  }

  #detailCallOptions(): KodiHttpCallOptions {
    return { signal: this.#detailAbortController?.signal };
  }
}

export function createAddonsStore(options: AddonsStoreOptions = {}): AddonsStore {
  return new AddonsStore(options);
}

export const addonsStore = createAddonsStore();
