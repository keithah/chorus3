export type KodiLibraryWriteResult = 'OK';

export type AudioLibrarySetAlbumDetailsParams = {
  albumid: number;
  title?: string;
  artist?: string | readonly string[];
  description?: string;
  genre?: string | readonly string[];
  year?: number;
  rating?: number;
  userrating?: number;
  art?: Record<string, string>;
};

export type AudioLibrarySetArtistDetailsParams = {
  artistid: number;
  artist?: string;
  instrument?: string | readonly string[];
  style?: string | readonly string[];
  mood?: string | readonly string[];
  born?: string;
  formed?: string;
  description?: string;
  genre?: string | readonly string[];
  died?: string;
  disbanded?: string;
  yearsactive?: string | readonly string[];
  art?: Record<string, string>;
};

export type AudioLibrarySetSongDetailsParams = {
  songid: number;
  playcount?: number;
  lastplayed?: string;
  title?: string;
  artist?: string | readonly string[];
  albumartist?: string | readonly string[];
  album?: string;
  genre?: string | readonly string[];
  year?: number;
  rating?: number;
  userrating?: number;
  track?: number;
  disc?: number;
  art?: Record<string, string>;
};

export type AudioLibraryScanParams = {
  directory?: string;
};

export type AudioLibraryCleanParams = {
  showdialogs?: boolean;
};

export type VideoResumePosition = {
  position: number;
  total: number;
};

export type VideoLibrarySetMovieDetailsParams = {
  movieid: number;
  playcount?: number;
  lastplayed?: string;
  resume?: VideoResumePosition;
  title?: string;
  plotoutline?: string;
  plot?: string;
  studio?: string | readonly string[];
  year?: number;
  mpaa?: string;
  rating?: number;
  userrating?: number;
  imdbnumber?: string;
  sorttitle?: string;
  originaltitle?: string;
  director?: string | readonly string[];
  writer?: string | readonly string[];
  genre?: string | readonly string[];
  country?: string | readonly string[];
  set?: string;
  tag?: string | readonly string[];
  trailer?: string;
  art?: Record<string, string>;
};

export type VideoLibrarySetTvShowDetailsParams = {
  tvshowid: number;
  playcount?: number;
  lastplayed?: string;
  title?: string;
  plot?: string;
  studio?: string | readonly string[];
  mpaa?: string;
  premiered?: string;
  rating?: number;
  userrating?: number;
  imdbnumber?: string;
  sorttitle?: string;
  originaltitle?: string;
  genre?: string | readonly string[];
  tag?: string | readonly string[];
  art?: Record<string, string>;
};

export type VideoLibrarySetEpisodeDetailsParams = {
  episodeid: number;
  playcount?: number;
  lastplayed?: string;
  resume?: VideoResumePosition;
  title?: string;
  plot?: string;
  rating?: number;
  userrating?: number;
  firstaired?: string;
  originaltitle?: string;
  director?: string | readonly string[];
  writer?: string | readonly string[];
};

export type VideoLibrarySetMusicVideoDetailsParams = {
  musicvideoid: number;
  playcount?: number;
  lastplayed?: string;
  resume?: VideoResumePosition;
  title?: string;
  artist?: string | readonly string[];
  album?: string;
  genre?: string | readonly string[];
  director?: string | readonly string[];
  studio?: string | readonly string[];
  plot?: string;
  tag?: string | readonly string[];
  track?: number;
  year?: number;
  rating?: number;
  userrating?: number;
  art?: Record<string, string>;
};

export type VideoLibrarySetSeasonDetailsParams = {
  tvshowid: number;
  season: number;
  title?: string;
  userrating?: number;
  art?: Record<string, string>;
};
