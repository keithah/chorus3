import type { KodiHttpCallOptions, KodiJsonRpcHttpClient } from './jsonRpc';

import type {
  ActivePlayer,
  PlayerPropertyName,
  PlayerPropertiesParams,
  PlayerPropertiesResult,
  PlayerItemPropertyName,
  PlayerItemParams,
  PlayerItemResult,
  PlaylistGetItemsParams,
  PlaylistItemsResult,
  PlaylistRemoveParams,
  PlaylistClearParams,
  PlaylistSwapParams,
  PlayerCommandResult,
  KodiMusicLibraryItem,
  KodiMovieLibraryItem,
  KodiEpisodeLibraryItem,
  KodiMusicVideoLibraryItem,
  PlayerOpenItem,
  PlayerOpenParams,
  PlayerOpenMovieParams,
  PlayerOpenEpisodeParams,
  PlaylistAddParams,
  PlaylistInsertParams,
  PlaylistAddMovieParams,
  PlaylistAddEpisodeParams,
  PlaylistAddMusicVideoParams,
  KodiFileItem,
  KodiPlaylistFileItem,
  PlayerOpenFileParams,
  PlayerOpenPlaylistFileParams,
  FilePlaylistAddParams,
  PlaylistFileAddParams,
  PlayerPlayPauseParams,
  PlayerPlayPauseResult,
  PlayerStopParams,
  PlayerGoToTarget,
  PlayerGoToParams,
  PlayerSeekValue,
  PlayerSeekParams,
  PlayerSeekResult,
  ApplicationVolumeValue,
  ApplicationSetVolumeParams,
  ApplicationMuteValue,
  ApplicationSetMuteParams,
  PlayerShuffleValue,
  PlayerSetShuffleParams,
  PlayerPartyModeValue,
  PlayerSetPartyModeParams,
  PlayerRepeatValue,
  PlayerSetRepeatParams,
  PlayerAudioStreamValue,
  PlayerSetAudioStreamParams,
  PlayerSubtitleValue,
  PlayerSetSubtitleParams
} from './methodContracts';

import { callKodi } from './methodCall';

export function getActivePlayers(
  client: KodiJsonRpcHttpClient,
  options?: KodiHttpCallOptions
): Promise<ActivePlayer[]> {
  return callKodi<ActivePlayer[]>(client, 'Player.GetActivePlayers', undefined, options);
}

export function getPlayerProperties(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  properties: readonly PlayerPropertyName[],
  options?: KodiHttpCallOptions
): Promise<PlayerPropertiesResult> {
  return callKodi<PlayerPropertiesResult, PlayerPropertiesParams>(
    client,
    'Player.GetProperties',
    { playerid, properties },
    options
  );
}

export function getPlayerItem(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  properties: readonly PlayerItemPropertyName[],
  options?: KodiHttpCallOptions
): Promise<PlayerItemResult> {
  return callKodi<PlayerItemResult, PlayerItemParams>(
    client,
    'Player.GetItem',
    { playerid, properties },
    options
  );
}

export function getPlaylistItems(
  client: KodiJsonRpcHttpClient,
  params: PlaylistGetItemsParams,
  options?: KodiHttpCallOptions
): Promise<PlaylistItemsResult> {
  return callKodi<PlaylistItemsResult, PlaylistGetItemsParams>(
    client,
    'Playlist.GetItems',
    params,
    options
  );
}

export function openPlayer(
  client: KodiJsonRpcHttpClient,
  params: PlayerOpenParams,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerOpenParams>(client, 'Player.Open', params, options);
}

export function openPlayerItem(
  client: KodiJsonRpcHttpClient,
  item: PlayerOpenItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return openPlayer(client, { item }, options);
}

export function openPlayerMovieItem(
  client: KodiJsonRpcHttpClient,
  item: KodiMovieLibraryItem,
  openOptions?: PlayerOpenMovieParams['options'],
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  const params: PlayerOpenMovieParams = openOptions ? { item, options: openOptions } : { item };
  return callKodi<PlayerCommandResult, PlayerOpenMovieParams>(
    client,
    'Player.Open',
    params,
    options
  );
}

export function openPlayerEpisodeItem(
  client: KodiJsonRpcHttpClient,
  item: KodiEpisodeLibraryItem,
  openOptions?: PlayerOpenEpisodeParams['options'],
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  const params: PlayerOpenEpisodeParams = openOptions ? { item, options: openOptions } : { item };
  return callKodi<PlayerCommandResult, PlayerOpenEpisodeParams>(
    client,
    'Player.Open',
    params,
    options
  );
}

export function openPlayerFile(
  client: KodiJsonRpcHttpClient,
  item: KodiFileItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerOpenFileParams>(
    client,
    'Player.Open',
    { item },
    options
  );
}

export function openPlayerPlaylistFile(
  client: KodiJsonRpcHttpClient,
  item: KodiPlaylistFileItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerOpenPlaylistFileParams>(
    client,
    'Player.Open',
    { item },
    options
  );
}

export function addPlaylistItem(
  client: KodiJsonRpcHttpClient,
  params: PlaylistAddParams,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistAddParams>(client, 'Playlist.Add', params, options);
}

export function insertPlaylistItem(
  client: KodiJsonRpcHttpClient,
  params: PlaylistInsertParams,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistInsertParams>(
    client,
    'Playlist.Insert',
    params,
    options
  );
}

export function addMusicPlaylistItem(
  client: KodiJsonRpcHttpClient,
  item: KodiMusicLibraryItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return addPlaylistItem(client, { playlistid: 0, item }, options);
}

export function addMoviePlaylistItem(
  client: KodiJsonRpcHttpClient,
  item: KodiMovieLibraryItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistAddMovieParams>(
    client,
    'Playlist.Add',
    { playlistid: 1, item },
    options
  );
}

export function addEpisodePlaylistItem(
  client: KodiJsonRpcHttpClient,
  item: KodiEpisodeLibraryItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistAddEpisodeParams>(
    client,
    'Playlist.Add',
    { playlistid: 1, item },
    options
  );
}

export function addMusicVideoPlaylistItem(
  client: KodiJsonRpcHttpClient,
  item: KodiMusicVideoLibraryItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistAddMusicVideoParams>(
    client,
    'Playlist.Add',
    { playlistid: 1, item },
    options
  );
}

export function addFilePlaylistItem(
  client: KodiJsonRpcHttpClient,
  playlistid: number,
  item: KodiFileItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, FilePlaylistAddParams>(
    client,
    'Playlist.Add',
    { playlistid, item },
    options
  );
}

export function addPlaylistFileItem(
  client: KodiJsonRpcHttpClient,
  playlistid: number,
  item: KodiPlaylistFileItem,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistFileAddParams>(
    client,
    'Playlist.Add',
    { playlistid, item },
    options
  );
}

export function removePlaylistItem(
  client: KodiJsonRpcHttpClient,
  playlistid: number,
  position: number,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistRemoveParams>(
    client,
    'Playlist.Remove',
    { playlistid, position },
    options
  );
}

export function clearPlaylist(
  client: KodiJsonRpcHttpClient,
  playlistid: number,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistClearParams>(
    client,
    'Playlist.Clear',
    { playlistid },
    options
  );
}

export function swapPlaylistItems(
  client: KodiJsonRpcHttpClient,
  playlistid: number,
  position1: number,
  position2: number,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlaylistSwapParams>(
    client,
    'Playlist.Swap',
    { playlistid, position1, position2 },
    options
  );
}

export function playPausePlayer(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  options?: KodiHttpCallOptions
): Promise<PlayerPlayPauseResult> {
  return callKodi<PlayerPlayPauseResult, PlayerPlayPauseParams>(
    client,
    'Player.PlayPause',
    { playerid },
    options
  );
}

export function stopPlayer(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerStopParams>(
    client,
    'Player.Stop',
    { playerid },
    options
  );
}

export function goToPlayerItem(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  to: PlayerGoToTarget,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerGoToParams>(
    client,
    'Player.GoTo',
    { playerid, to },
    options
  );
}

export function seekPlayer(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  value: PlayerSeekValue,
  options?: KodiHttpCallOptions
): Promise<PlayerSeekResult> {
  return callKodi<PlayerSeekResult, PlayerSeekParams>(
    client,
    'Player.Seek',
    { playerid, value },
    options
  );
}

export function setApplicationVolume(
  client: KodiJsonRpcHttpClient,
  volume: ApplicationVolumeValue,
  options?: KodiHttpCallOptions
): Promise<number> {
  return callKodi<number, ApplicationSetVolumeParams>(
    client,
    'Application.SetVolume',
    { volume },
    options
  );
}

export function setApplicationMute(
  client: KodiJsonRpcHttpClient,
  mute: ApplicationMuteValue,
  options?: KodiHttpCallOptions
): Promise<boolean> {
  return callKodi<boolean, ApplicationSetMuteParams>(
    client,
    'Application.SetMute',
    { mute },
    options
  );
}

export function setPlayerShuffle(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  shuffle: PlayerShuffleValue,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerSetShuffleParams>(
    client,
    'Player.SetShuffle',
    { playerid, shuffle },
    options
  );
}

export function setPlayerPartyMode(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  partymode: PlayerPartyModeValue,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerSetPartyModeParams>(
    client,
    'Player.SetPartymode',
    { playerid, partymode },
    options
  );
}

export function setPlayerRepeat(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  repeat: PlayerRepeatValue,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerSetRepeatParams>(
    client,
    'Player.SetRepeat',
    { playerid, repeat },
    options
  );
}

export function setPlayerAudioStream(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  stream: PlayerAudioStreamValue,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerSetAudioStreamParams>(
    client,
    'Player.SetAudioStream',
    { playerid, stream },
    options
  );
}

export function setPlayerSubtitle(
  client: KodiJsonRpcHttpClient,
  playerid: number,
  subtitle: PlayerSubtitleValue,
  options?: KodiHttpCallOptions
): Promise<PlayerCommandResult> {
  return callKodi<PlayerCommandResult, PlayerSetSubtitleParams>(
    client,
    'Player.SetSubtitle',
    { playerid, subtitle },
    options
  );
}
