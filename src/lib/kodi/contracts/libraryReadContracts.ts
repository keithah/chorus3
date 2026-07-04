import type { KodiLimits, KodiListParams } from './coreContracts';

export type AudioLibraryArtistPropertyName =
  | 'born'
  | 'compilationartist'
  | 'description'
  | 'died'
  | 'disambiguation'
  | 'fanart'
  | 'formed'
  | 'genre'
  | 'instrument'
  | 'isalbumartist'
  | 'mood'
  | 'musicbrainzartistid'
  | 'roles'
  | 'songgenres'
  | 'style'
  | 'thumbnail'
  | 'yearsactive';

export type AudioLibraryAlbumPropertyName =
  | 'albumduration'
  | 'albumlabel'
  | 'albumstatus'
  | 'artist'
  | 'artistid'
  | 'compilation'
  | 'dateadded'
  | 'description'
  | 'displayartist'
  | 'fanart'
  | 'genre'
  | 'isboxset'
  | 'lastplayed'
  | 'mood'
  | 'musicbrainzalbumartistid'
  | 'musicbrainzalbumid'
  | 'playcount'
  | 'rating'
  | 'releasetype'
  | 'songgenres'
  | 'style'
  | 'theme'
  | 'thumbnail'
  | 'title'
  | 'type'
  | 'userrating'
  | 'votes'
  | 'year';

export type AudioLibrarySongPropertyName =
  | 'album'
  | 'albumartist'
  | 'albumartistid'
  | 'albumid'
  | 'artist'
  | 'artistid'
  | 'bitrate'
  | 'comment'
  | 'contributors'
  | 'dateadded'
  | 'disc'
  | 'displayartist'
  | 'duration'
  | 'fanart'
  | 'file'
  | 'genre'
  | 'lastplayed'
  | 'lyrics'
  | 'mood'
  | 'musicbrainzartistid'
  | 'musicbrainztrackid'
  | 'playcount'
  | 'rating'
  | 'samplerate'
  | 'thumbnail'
  | 'title'
  | 'track'
  | 'userrating'
  | 'votes'
  | 'year';

export type AudioLibraryGenrePropertyName = 'thumbnail' | 'title';

export type VideoLibraryMoviePropertyName =
  | 'art'
  | 'cast'
  | 'country'
  | 'dateadded'
  | 'director'
  | 'fanart'
  | 'file'
  | 'genre'
  | 'imdbnumber'
  | 'lastplayed'
  | 'mpaa'
  | 'originaltitle'
  | 'playcount'
  | 'plot'
  | 'plotoutline'
  | 'premiered'
  | 'rating'
  | 'resume'
  | 'runtime'
  | 'set'
  | 'sorttitle'
  | 'streamdetails'
  | 'studio'
  | 'tag'
  | 'tagline'
  | 'thumbnail'
  | 'title'
  | 'trailer'
  | 'uniqueid'
  | 'userrating'
  | 'votes'
  | 'writer'
  | 'year';

export type VideoLibraryTvShowPropertyName =
  | 'art'
  | 'cast'
  | 'dateadded'
  | 'episode'
  | 'fanart'
  | 'file'
  | 'genre'
  | 'imdbnumber'
  | 'lastplayed'
  | 'mpaa'
  | 'originaltitle'
  | 'playcount'
  | 'plot'
  | 'premiered'
  | 'rating'
  | 'season'
  | 'sorttitle'
  | 'studio'
  | 'tag'
  | 'thumbnail'
  | 'title'
  | 'uniqueid'
  | 'userrating'
  | 'votes'
  | 'watchedepisodes'
  | 'year';

export type VideoLibrarySeasonPropertyName =
  | 'art'
  | 'episode'
  | 'fanart'
  | 'playcount'
  | 'season'
  | 'showtitle'
  | 'thumbnail'
  | 'title'
  | 'tvshowid'
  | 'userrating'
  | 'watchedepisodes';

export type VideoLibraryEpisodePropertyName =
  | 'art'
  | 'cast'
  | 'dateadded'
  | 'director'
  | 'episode'
  | 'fanart'
  | 'file'
  | 'firstaired'
  | 'lastplayed'
  | 'plot'
  | 'playcount'
  | 'rating'
  | 'resume'
  | 'runtime'
  | 'season'
  | 'showtitle'
  | 'streamdetails'
  | 'thumbnail'
  | 'title'
  | 'tvshowid'
  | 'uniqueid'
  | 'userrating'
  | 'votes'
  | 'writer';

export type VideoLibraryMusicVideoPropertyName =
  | 'album'
  | 'art'
  | 'artist'
  | 'dateadded'
  | 'director'
  | 'fanart'
  | 'file'
  | 'genre'
  | 'lastplayed'
  | 'playcount'
  | 'plot'
  | 'rating'
  | 'resume'
  | 'runtime'
  | 'streamdetails'
  | 'studio'
  | 'tag'
  | 'thumbnail'
  | 'title'
  | 'track'
  | 'userrating'
  | 'votes'
  | 'year';

export interface LibraryItem {
  label: string;
  [key: string]: unknown;
}

export interface AudioLibraryArtist extends LibraryItem {
  artistid: number;
}

export interface AudioLibraryAlbum extends LibraryItem {
  albumid: number;
}

export interface AudioLibrarySong extends LibraryItem {
  songid: number;
}

export interface AudioLibraryGenre extends LibraryItem {
  genreid: number;
}

export interface VideoLibraryMovie extends LibraryItem {
  movieid: number;
}

export interface VideoLibraryTvShow extends LibraryItem {
  tvshowid: number;
}

export interface VideoLibrarySeason extends LibraryItem {
  season: number;
  tvshowid?: number;
}

export interface VideoLibraryEpisode extends LibraryItem {
  episodeid: number;
}

export interface VideoLibraryMusicVideo extends LibraryItem {
  musicvideoid: number;
}

export interface AudioLibraryArtistsResult {
  artists?: AudioLibraryArtist[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export interface AudioLibraryAlbumsResult {
  albums?: AudioLibraryAlbum[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export interface AudioLibrarySongsResult {
  songs?: AudioLibrarySong[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export interface AudioLibrarySongDetailsResult {
  songdetails?: AudioLibrarySong;
  [key: string]: unknown;
}

export interface AudioLibraryGenresResult {
  genres?: AudioLibraryGenre[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export interface VideoLibraryMoviesResult {
  movies?: VideoLibraryMovie[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export interface VideoLibraryTvShowsResult {
  tvshows?: VideoLibraryTvShow[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export interface VideoLibraryTvShowDetailsResult {
  tvshowdetails?: VideoLibraryTvShow;
  [key: string]: unknown;
}

export interface VideoLibrarySeasonsResult {
  seasons?: VideoLibrarySeason[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export interface VideoLibrarySeasonDetailsResult {
  seasondetails?: VideoLibrarySeason;
  [key: string]: unknown;
}

export interface VideoLibraryEpisodesResult {
  episodes?: VideoLibraryEpisode[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export interface VideoLibraryEpisodeDetailsResult {
  episodedetails?: VideoLibraryEpisode;
  [key: string]: unknown;
}

export interface VideoLibraryMusicVideosResult {
  musicvideos?: VideoLibraryMusicVideo[];
  limits?: KodiLimits;
  [key: string]: unknown;
}

export interface VideoLibraryMusicVideoDetailsResult {
  musicvideodetails?: VideoLibraryMusicVideo;
  [key: string]: unknown;
}

export type VideoLibraryAvailableArtMedia = 'movie' | 'tvshow' | 'season' | 'episode';

export type VideoLibraryAvailableArtParams = {
  media: VideoLibraryAvailableArtMedia;
  movieid?: number;
  tvshowid?: number;
  season?: number;
  episodeid?: number;
};

export interface VideoLibraryAvailableArtResult {
  availableart?: unknown;
  [key: string]: unknown;
}

export type VideoLibraryAvailableArtTypesParams = {
  media: VideoLibraryAvailableArtMedia;
};

export interface VideoLibraryAvailableArtTypesResult {
  availablearttypes?: unknown;
  [key: string]: unknown;
}

export type VideoLibraryRefreshTvShowParams = {
  tvshowid: number;
  ignorenfo?: boolean;
};

export type VideoLibraryRefreshMovieParams = {
  movieid: number;
  ignorenfo?: boolean;
};

export type VideoLibraryRefreshEpisodeParams = {
  episodeid: number;
  ignorenfo?: boolean;
};

export type VideoLibraryScanParams = {
  directory?: string;
};

export type VideoLibraryCleanParams = {
  showdialogs?: boolean;
  content?: 'movies' | 'tvshows' | 'musicvideos';
};

export type AudioLibraryArtistsParams = KodiListParams<AudioLibraryArtistPropertyName>;

export type AudioLibraryAlbumsParams = KodiListParams<AudioLibraryAlbumPropertyName>;

export type AudioLibrarySongsParams = KodiListParams<AudioLibrarySongPropertyName>;

export type AudioLibrarySongDetailsParams = {
  songid: number;
  properties?: readonly AudioLibrarySongPropertyName[];
};

export type AudioLibraryGenresParams = KodiListParams<AudioLibraryGenrePropertyName>;

export type VideoLibraryMoviesParams = KodiListParams<VideoLibraryMoviePropertyName>;

export type VideoLibraryMovieDetailsParams = {
  movieid: number;
  properties?: readonly VideoLibraryMoviePropertyName[];
};

export type VideoLibraryTvShowsParams = KodiListParams<VideoLibraryTvShowPropertyName>;

export type VideoLibraryTvShowDetailsParams = {
  tvshowid: number;
  properties?: readonly VideoLibraryTvShowPropertyName[];
};

export type VideoLibrarySeasonsParams = KodiListParams<VideoLibrarySeasonPropertyName> & {
  tvshowid: number;
};

export type VideoLibrarySeasonDetailsParams = {
  tvshowid: number;
  season: number;
  properties?: readonly VideoLibrarySeasonPropertyName[];
};

export type VideoLibraryEpisodesParams = KodiListParams<VideoLibraryEpisodePropertyName> & {
  tvshowid?: number;
  season?: number;
};

export type VideoLibraryEpisodeDetailsParams = {
  episodeid: number;
  properties?: readonly VideoLibraryEpisodePropertyName[];
};

export type VideoLibraryMusicVideosParams = KodiListParams<VideoLibraryMusicVideoPropertyName>;

export type VideoLibraryMusicVideoDetailsParams = {
  musicvideoid: number;
  properties?: readonly VideoLibraryMusicVideoPropertyName[];
};

export interface VideoLibraryMovieDetailsResult {
  moviedetails?: VideoLibraryMovie;
  [key: string]: unknown;
}
