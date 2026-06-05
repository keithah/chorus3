import type { KodiLimits } from './coreContracts';

export type AddonEnabledFilter = boolean | 'all';

export type AddonInstalledFilter = boolean | 'all';

export type AddonSetEnabledValue = boolean | 'toggle';

export type AddonPropertyName =
  | 'name'
  | 'version'
  | 'summary'
  | 'description'
  | 'path'
  | 'author'
  | 'type'
  | 'thumbnail'
  | 'disclaimer'
  | 'fanart'
  | 'dependencies'
  | 'broken'
  | 'extrainfo'
  | 'rating'
  | 'enabled'
  | 'installed';

export interface AddonSummary {
  addonid: string;
  type?: string;
  name?: string;
  version?: string;
  summary?: string;
  description?: string;
  path?: string;
  author?: string;
  thumbnail?: string;
  disclaimer?: string;
  fanart?: string;
  dependencies?: unknown;
  broken?: string | boolean;
  extrainfo?: unknown;
  rating?: number;
  enabled?: boolean;
  installed?: boolean;
  [key: string]: unknown;
}

export type AddonDetail = AddonSummary;

export type AddonsGetAddonsParams = Record<string, unknown> & {
  type?: string;
  content?: string;
  enabled?: AddonEnabledFilter;
  installed?: AddonInstalledFilter;
  properties?: readonly AddonPropertyName[];
  limits?: Pick<KodiLimits, 'start' | 'end'>;
  sort?: unknown;
};

export interface AddonsGetAddonsResult {
  addons?: AddonSummary[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export type AddonsGetAddonDetailsParams = Record<string, unknown> & {
  addonid: string;
  properties?: readonly AddonPropertyName[];
};

export interface AddonsGetAddonDetailsResult {
  addondetails?: AddonDetail;
  addon?: AddonDetail;
  [key: string]: unknown;
}

export type AddonsSetAddonEnabledParams = Record<string, unknown> & {
  addonid: string;
  enabled: AddonSetEnabledValue;
};

export type AddonsSetAddonEnabledResult = 'OK';

export type AddonsExecuteAddonParams = Record<string, unknown> & {
  addonid: string;
  params?: Record<string, string> | readonly string[];
  wait?: boolean;
};

export type AddonsExecuteAddonResult = 'OK';
