import type { PlayerItemPropertyName } from './playerContracts';

import type { KodiLimits } from './coreContracts';

export type FileMediaType = 'files' | 'music' | 'pictures' | 'programs' | 'video';

export interface FileSource {
  file: string;
  label: string;
  [key: string]: unknown;
}

export interface FileSourcesResult {
  sources?: FileSource[];
  [key: string]: unknown;
}

export type FileDirectoryPropertyName = PlayerItemPropertyName;

export type FileDirectoryParams = {
  directory: string;
  media?: FileMediaType;
  properties?: readonly FileDirectoryPropertyName[];
  limits?: Pick<KodiLimits, 'start' | 'end'>;
  sort?: unknown;
};

export interface FileDirectoryEntry {
  file: string;
  filetype?: 'directory' | 'file' | string;
  label?: string;
  type?: string;
  [key: string]: unknown;
}

export interface FileDirectoryResult {
  files?: FileDirectoryEntry[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export type FileDetailsParams = {
  file: string;
  media?: FileMediaType;
  properties?: readonly FileDirectoryPropertyName[];
};

export interface FileDetailsResult {
  filedetails?: FileDirectoryEntry;
  [key: string]: unknown;
}

export interface PrepareFileDownloadResult {
  details?: unknown;
  mode?: string;
  protocol?: string;
  [key: string]: unknown;
}
