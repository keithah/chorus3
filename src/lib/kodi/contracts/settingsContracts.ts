export type SettingsLevel = 'basic' | 'standard' | 'advanced' | 'expert';

export type SettingsSettingValue = string | number | boolean | null;

export type SettingsGetSectionsParams = Record<string, unknown> & {
  level?: SettingsLevel;
};

export type SettingsGetCategoriesParams = Record<string, unknown> & {
  section?: string;
  level?: SettingsLevel;
};

export type SettingsGetSettingsParams = Record<string, unknown> & {
  section?: string;
  category?: string;
  level?: SettingsLevel;
};

export type SettingsSetSettingValueParams = Record<string, unknown> & {
  setting: string;
  value: SettingsSettingValue;
};

export type SettingsSetSettingValueResult = 'OK';

export interface KodiSettingsSection {
  id?: string;
  label?: string;
  [key: string]: unknown;
}

export interface KodiSettingsCategory {
  id?: string;
  label?: string;
  [key: string]: unknown;
}

export interface KodiSettingsSetting {
  id?: string;
  label?: string;
  type?: string;
  value?: unknown;
  default?: unknown;
  options?: unknown;
  [key: string]: unknown;
}

export interface SettingsGetSectionsResult {
  sections?: KodiSettingsSection[];
  [key: string]: unknown;
}

export interface SettingsGetCategoriesResult {
  categories?: KodiSettingsCategory[];
  [key: string]: unknown;
}

export interface SettingsGetSettingsResult {
  settings?: KodiSettingsSetting[];
  [key: string]: unknown;
}
