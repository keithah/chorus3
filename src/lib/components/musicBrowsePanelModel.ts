import type {
  MusicBrowseSelection,
  MusicBrowseStoreSnapshot
} from '$lib/stores/musicBrowse.svelte';
import type {
  MusicLibraryAlbumSnapshot,
  MusicLibraryArtistSnapshot,
  MusicLibraryGenreSnapshot,
  MusicLibraryLimitsSnapshot,
  MusicLibrarySongSnapshot
} from '$lib/stores/musicLibrary.svelte';

export type MusicBrowseActionItem =
  | { kind: 'song'; songid: number }
  | { kind: 'album'; albumid: number }
  | { kind: 'artist'; artistid: number };

export type MusicBrowseTopLevelKind = 'artists' | 'albums' | 'genres';
export type MusicBrowseDetailKind = 'albums' | 'songs';
export type MusicBrowseActionVerb = 'play' | 'queue';

export function formatMusicBrowseStatus(snapshot: MusicBrowseStoreSnapshot): string {
  const selection = formatMusicBrowseSelectionTarget(snapshot.selection);

  if (!snapshot.selection) {
    return 'Choose an artist, album, or genre to browse.';
  }

  if (snapshot.refreshStatus === 'loading') {
    return `Loading ${selection}.`;
  }

  if (snapshot.refreshStatus === 'error' && snapshot.lastError) {
    return sanitizeMusicBrowseUiText(snapshot.lastError.message);
  }

  if (snapshot.isEmpty) {
    return `No albums or songs found for ${safeMusicBrowseSelectionLabel(snapshot.selection)}.`;
  }

  const updated = musicBrowseTextOrNull(snapshot.lastUpdatedAt);
  return updated ? `Showing ${selection}. Last updated ${updated}.` : `Showing ${selection}.`;
}

export function formatMusicBrowseSelectionTitle(selection: MusicBrowseSelection): string {
  if (!selection) {
    return 'No browse selection';
  }

  return `${capitalizeMusicBrowseText(selection.kind)}: ${safeMusicBrowseSelectionLabel(selection)}`;
}

export function formatMusicBrowseSelectionTarget(selection: MusicBrowseSelection): string {
  if (!selection) {
    return 'music browse details';
  }

  return `${selection.kind} ${safeMusicBrowseSelectionLabel(selection)}`;
}

export function formatMusicBrowseCountSummary(
  count: number,
  limits: MusicLibraryLimitsSnapshot | undefined
): string {
  return `${count} of ${formatMusicBrowseTotal(limits, count)}`;
}

export function formatMusicBrowseDetailCountSummary(
  kind: MusicBrowseDetailKind,
  count: number,
  limits: MusicLibraryLimitsSnapshot | undefined
): string {
  return `${capitalizeMusicBrowseText(kind)} ${count} of ${formatMusicBrowseTotal(limits, count)}`;
}

export function topLevelMusicBrowseEmptyCopy(kind: MusicBrowseTopLevelKind): string {
  switch (kind) {
    case 'artists':
      return 'No artists in this snapshot.';
    case 'albums':
      return 'No albums in this snapshot.';
    case 'genres':
      return 'No genres in this snapshot.';
  }
}

export function albumMusicBrowseDetailEmptyCopy(
  selection: MusicBrowseSelection,
  detailTarget: string
): string {
  if (selection?.kind === 'album') {
    return 'Album selections show songs only.';
  }

  return `No albums found for ${detailTarget}.`;
}

export function songMusicBrowseDetailEmptyCopy(detailTarget: string): string {
  return `No songs found for ${detailTarget}.`;
}

export function safeMusicBrowseArtistLabel(artist: MusicLibraryArtistSnapshot): string {
  return musicBrowseDisplayText(artist.label, 'Unknown artist');
}

export function safeMusicBrowseAlbumLabel(album: MusicLibraryAlbumSnapshot): string {
  return musicBrowseDisplayText(album.title ?? album.label, 'Unknown album');
}

export function safeMusicBrowseSongLabel(song: MusicLibrarySongSnapshot): string {
  return musicBrowseDisplayText(song.title ?? song.label, 'Unknown song');
}

export function safeMusicBrowseGenreLabel(genre: MusicLibraryGenreSnapshot): string {
  return musicBrowseDisplayText(genre.title ?? genre.label, 'Unknown genre');
}

export function safeMusicBrowseSelectionLabel(
  selection: NonNullable<MusicBrowseSelection>
): string {
  switch (selection.kind) {
    case 'artist':
      return musicBrowseDisplayText(selection.label, 'Unknown artist');
    case 'album':
      return musicBrowseDisplayText(selection.label, 'Unknown album');
    case 'genre':
      return musicBrowseDisplayText(selection.label, 'Unknown genre');
  }
}

export function formatMusicBrowseSongMeta(song: MusicLibrarySongSnapshot): string {
  return [
    joinMusicBrowseText(song.artist),
    musicBrowseTextOrNull(song.album),
    formatMusicBrowseDuration(song.duration),
    formatMusicBrowseTrack(song.track),
    formatMusicBrowsePlaycount(song.playcount)
  ]
    .filter(Boolean)
    .join(' · ');
}

export function formatMusicBrowseAlbumMeta(album: MusicLibraryAlbumSnapshot): string {
  return [joinMusicBrowseText(album.artist), formatMusicBrowseYear(album.year)]
    .filter(Boolean)
    .join(' · ');
}

export function formatMusicBrowseArtistMeta(artist: MusicLibraryArtistSnapshot): string {
  return joinMusicBrowseText(artist.genre) ?? '';
}

export function musicBrowseActionId(
  verb: MusicBrowseActionVerb,
  item: MusicBrowseActionItem
): string {
  if (item.kind === 'song') {
    return `${verb}:song:${item.songid}`;
  }

  if (item.kind === 'album') {
    return `${verb}:album:${item.albumid}`;
  }

  return `${verb}:artist:${item.artistid}`;
}

export function musicBrowseActionTargetKey(item: MusicBrowseActionItem): string {
  if (item.kind === 'song') {
    return `song:${item.songid}`;
  }

  if (item.kind === 'album') {
    return `album:${item.albumid}`;
  }

  return `artist:${item.artistid}`;
}

export function musicBrowseActionForArtist(
  artist: MusicLibraryArtistSnapshot
): MusicBrowseActionItem | null {
  return isPositiveMusicBrowseInteger(artist.artistid)
    ? { kind: 'artist', artistid: artist.artistid }
    : null;
}

export function musicBrowseActionForAlbum(
  album: MusicLibraryAlbumSnapshot
): MusicBrowseActionItem | null {
  return isPositiveMusicBrowseInteger(album.albumid)
    ? { kind: 'album', albumid: album.albumid }
    : null;
}

export function musicBrowseActionForSong(
  song: MusicLibrarySongSnapshot
): MusicBrowseActionItem | null {
  return isPositiveMusicBrowseInteger(song.songid) ? { kind: 'song', songid: song.songid } : null;
}

export function musicBrowseEachKey(prefix: string, id: unknown, index: number): string {
  return isPositiveMusicBrowseInteger(id) ? `${prefix}:${id}` : `${prefix}:invalid:${index}`;
}

export function sanitizeMusicBrowseUiText(value: string): string {
  return value
    .replace(/raw response body/gi, 'response body [redacted]')
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
    .replace(/https?:\/\/[^\s]+/gi, '[url]')
    .replace(/smb:\/\/[^\s]+/gi, '[path]')
    .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
    .replace(/authorization/gi, 'credentials')
    .replace(/basic\s+[a-z0-9+/=]+/gi, 'credentials [redacted]')
    .replace(/admin:p@ssword/gi, '[redacted-credentials]')
    .replace(/p@ssword/gi, '[redacted-password]')
    .replace(/username or password/gi, 'credentials')
    .replace(/localStorage/gi, 'browser storage');
}

export function capitalizeMusicBrowseText(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function musicBrowseDisplayText(value: unknown, fallback: string): string {
  return musicBrowseTextOrNull(value) ?? fallback;
}

function musicBrowseTextOrNull(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || looksLikePathOrUrl(trimmed)) {
    return null;
  }

  return sanitizeMusicBrowseUiText(trimmed);
}

function joinMusicBrowseText(values: unknown): string | null {
  if (Array.isArray(values)) {
    const joined = values
      .map((entry) => musicBrowseTextOrNull(entry))
      .filter((entry): entry is string => Boolean(entry))
      .join(', ');
    return joined || null;
  }

  return musicBrowseTextOrNull(values);
}

function formatMusicBrowseTotal(
  limits: MusicLibraryLimitsSnapshot | undefined,
  fallback: number
): number {
  return typeof limits?.total === 'number' && Number.isFinite(limits.total)
    ? limits.total
    : fallback;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isPositiveMusicBrowseInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function formatMusicBrowseDuration(seconds: unknown): string | null {
  const value = numberOrNull(seconds);
  if (value === null) {
    return null;
  }

  const safeSeconds = Math.max(0, Math.floor(value));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${pad2(minutes)}:${pad2(remainingSeconds)}`;
  }

  return `${minutes}:${pad2(remainingSeconds)}`;
}

function formatMusicBrowseYear(value: unknown): string | null {
  const year = numberOrNull(value);
  return year === null ? null : String(Math.trunc(year));
}

function formatMusicBrowseTrack(value: unknown): string | null {
  const track = numberOrNull(value);
  return track === null ? null : `Track ${Math.trunc(track)}`;
}

function formatMusicBrowsePlaycount(value: unknown): string | null {
  const playcount = numberOrNull(value);
  if (playcount === null) {
    return null;
  }

  const rounded = Math.max(0, Math.trunc(playcount));
  return rounded === 1 ? 'Played 1 time' : `Played ${rounded} times`;
}

function looksLikePathOrUrl(value: string): boolean {
  return (
    /^(?:https?:\/\/|smb:\/\/)/i.test(value) ||
    /^[a-z]:\\/i.test(value) ||
    /^\/(?:mnt|media|home|users|volumes|var|tmp)\//i.test(value) ||
    /\\/.test(value)
  );
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}
