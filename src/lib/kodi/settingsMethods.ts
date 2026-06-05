import type { JsonRpcParams, KodiHttpCallOptions, KodiJsonRpcHttpClient } from './jsonRpc';

import type {
  SettingsGetSectionsParams,
  SettingsGetCategoriesParams,
  SettingsGetSettingsParams,
  SettingsSetSettingValueParams,
  SettingsSetSettingValueResult,
  SettingsGetSectionsResult,
  SettingsGetCategoriesResult,
  SettingsGetSettingsResult
} from './methodContracts';

import { callKodi } from './methodCall';

export function getSettingsSections(
  client: KodiJsonRpcHttpClient,
  params: SettingsGetSectionsParams = {},
  options?: KodiHttpCallOptions
): Promise<SettingsGetSectionsResult> {
  return callKodi<SettingsGetSectionsResult, SettingsGetSectionsParams>(
    client,
    'Settings.GetSections',
    params,
    options
  );
}

export function getSettingsCategories(
  client: KodiJsonRpcHttpClient,
  params: SettingsGetCategoriesParams = {},
  options?: KodiHttpCallOptions
): Promise<SettingsGetCategoriesResult> {
  return callKodi<SettingsGetCategoriesResult, SettingsGetCategoriesParams>(
    client,
    'Settings.GetCategories',
    params,
    options
  );
}

export function getSettings(
  client: KodiJsonRpcHttpClient,
  params: SettingsGetSettingsParams = {},
  options?: KodiHttpCallOptions
): Promise<SettingsGetSettingsResult> {
  const { level, section, category, ...rest } = params;
  const filter =
    section || category
      ? {
          ...(section ? { section } : {}),
          ...(category ? { category } : {})
        }
      : undefined;
  const normalizedParams = {
    ...rest,
    ...(level ? { level } : {}),
    ...(filter ? { filter } : {})
  };

  return callKodi<SettingsGetSettingsResult, JsonRpcParams>(
    client,
    'Settings.GetSettings',
    normalizedParams,
    options
  );
}

export function setSettingValue(
  client: KodiJsonRpcHttpClient,
  params: SettingsSetSettingValueParams,
  options?: KodiHttpCallOptions
): Promise<SettingsSetSettingValueResult> {
  return callKodi<SettingsSetSettingValueResult, SettingsSetSettingValueParams>(
    client,
    'Settings.SetSettingValue',
    params,
    options
  );
}
