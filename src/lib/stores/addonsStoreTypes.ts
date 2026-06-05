import type {
  AddonsExecuteAddonParams,
  AddonsExecuteAddonResult,
  AddonsGetAddonDetailsParams,
  AddonsGetAddonDetailsResult,
  AddonsGetAddonsParams,
  AddonsGetAddonsResult,
  AddonsSetAddonEnabledParams,
  AddonsSetAddonEnabledResult,
  KodiEndpointDescription,
  KodiJsonRpcHttpClient
} from '$lib/kodi';

export type AddonsLoadStatus = 'idle' | 'loading' | 'success' | 'error';
export type AddonsDetailStatus = 'idle' | 'loading' | 'success' | 'error';
export type AddonsWriteStatus = 'idle' | 'pending' | 'success' | 'error';
export type AddonsGroupBy = 'none' | 'type' | 'enabled';
export type AddonsErrorSource = 'validation' | 'config' | 'http' | 'addons' | 'write' | 'refresh';

export interface AddonsSafeErrorSnapshot {
  source: AddonsErrorSource;
  code: string;
  message: string;
  endpoint?: KodiEndpointDescription;
}

export interface AddonSnapshot {
  addonid: string;
  name: string;
  version: string | null;
  summary: string | null;
  description: string | null;
  author: string | null;
  enabled: boolean | null;
  installed: boolean | null;
  type: string;
  provides?: string[];
  providesDefault?: string | null;
  browseMedia?: 'music' | 'video' | null;
  browsePath?: string | null;
  canExecute?: boolean;
  broken: boolean | string | null;
  dependencyCount: number;
  extrainfoCount: number;
}

export interface AddonsGroupSnapshot {
  key: string;
  label: string;
  addons: AddonSnapshot[];
}

export interface AddonsPendingToggleSnapshot {
  addonid: string;
  enabled: boolean;
  requestedAt: string;
}

export interface AddonsLastWriteSnapshot {
  addonid: string;
  enabled: boolean;
  status: Exclude<AddonsWriteStatus, 'idle'>;
  at: string;
}

export interface AddonsRefreshAfterWriteSnapshot {
  addonid: string;
  requestedAt: string;
  refreshed: boolean;
  warning: string | null;
}

export interface AddonsWriteCountsSnapshot {
  attempted: number;
  succeeded: number;
  failed: number;
}

export interface AddonsStoreSnapshot {
  loadStatus: AddonsLoadStatus;
  detailStatus: AddonsDetailStatus;
  writeStatus: AddonsWriteStatus;
  addons: AddonSnapshot[];
  selectedAddonId: string | null;
  detail: AddonSnapshot | null;
  searchQuery: string;
  groupBy: AddonsGroupBy;
  visibleAddons: AddonSnapshot[];
  groups: AddonsGroupSnapshot[];
  pendingToggle: AddonsPendingToggleSnapshot | null;
  lastWrite: AddonsLastWriteSnapshot | null;
  rollbackEnabled: boolean | null;
  refreshAfterWrite: AddonsRefreshAfterWriteSnapshot | null;
  writeCounts: AddonsWriteCountsSnapshot;
  lastError: AddonsSafeErrorSnapshot | null;
}

export type AddonEntityFilter = 'all' | 'video' | 'audio' | 'executable' | string;

export interface AddonSearchSetting {
  id: string;
  url: string;
  title: string;
  media: 'music' | 'video';
}

export interface AddonsStoreMethods {
  getAddons(
    client: KodiJsonRpcHttpClient,
    params?: AddonsGetAddonsParams
  ): Promise<AddonsGetAddonsResult>;
  getAddonDetails(
    client: KodiJsonRpcHttpClient,
    params: AddonsGetAddonDetailsParams
  ): Promise<AddonsGetAddonDetailsResult>;
  setAddonEnabled(
    client: KodiJsonRpcHttpClient,
    params: AddonsSetAddonEnabledParams
  ): Promise<AddonsSetAddonEnabledResult>;
  executeAddon(
    client: KodiJsonRpcHttpClient,
    params: AddonsExecuteAddonParams
  ): Promise<AddonsExecuteAddonResult>;
}

export interface AddonsStoreOptions {
  createClient?: () => KodiJsonRpcHttpClient | null | Promise<KodiJsonRpcHttpClient | null>;
  clientProvider?: () => KodiJsonRpcHttpClient | null | Promise<KodiJsonRpcHttpClient | null>;
  methods?: AddonsStoreMethods;
  now?: () => string;
}
