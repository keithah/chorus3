# Changelog

All notable changes to Chorus 3 are tracked here.

## 3.0.13 - 2026-05-27

Patch release for Kodi v22 compatibility and the remaining live Chorus2 parity fixes found during
installed-package verification.

### Fixed

- Loaded add-on details correctly on Kodi v21 and v22 by accepting both JSON-RPC detail response
  shapes.
- Preserved safe package cache-busting query strings when navigating hash-only package routes, so
  TV show season and episode drill-in remains usable after reinstalling Chorus 3.
- Kept package add-on detail links under the Kodi webinterface mount path and auto-loaded the
  routed add-on detail snapshot.
- Expanded media search routing and UI copy so Movies and TV Shows searches no longer fall back to
  Music search behavior.
- Added clearer PVR Play and Record action feedback, including a friendly backend rejection message
  when Kodi refuses a recording command.
- Added direct package route coverage for movie search and TV show detail fallbacks.

## 3.0.9 - 2026-05-23

Patch release for deeper Chorus2 UI parity across filters, Lab, search, add-ons, TV details, and
Kodi package routes.

### Fixed

- Restored Chorus2-style hash query filters, duplicate filter values, and per-screen filter order
  for music, movies, TV shows, and music videos.
- Added the Chorus2 Lab routes, current playlist route, and Kodi package route fallbacks for the
  newly ported Lab and playlist screens.
- Expanded media search from music-only to all Chorus2 result groups: artists, albums, songs,
  genres, movies, TV shows, and music videos.
- Tightened add-on category filtering so system add-ons are excluded while real audio, video, and
  executable providers still match their Chorus2 category screens.
- Routed Chorus2 TV show, season, and episode detail URLs through the rich TV detail shells.
- Enabled movie detail menu Refresh and Edit actions instead of leaving inert menu items.

## 3.0.8 - 2026-05-22

Patch release for sidebar filter and remote overlay recovery.

### Fixed

- Fixed Movies and TV Shows filter pane navigation so opening filters no longer slides the section
  menu off-screen or strands the user in a blank pane.
- Added explicit back affordances in the filter and filter-option panes.
- Changed the Kodi remote overlay into a non-blocking floating controller so the main UI remains
  clickable behind it.
- Closed the Kodi remote overlay when Stop is triggered from either the footer controls or the
  remote controller, and when playback becomes idle.

## 3.0.7 - 2026-05-21

Patch release for Chorus2-faithful media card sizing.

### Fixed

- Matched Chorus2's fixed tall poster card dimensions instead of using a flexible 2:3 CSS ratio.
- Restored Chorus2-style fixed-width card grid columns so desktop media grids fill with more cards
  instead of stretching a small number of cards across the available area.
- Restored square card artwork to the Chorus2 `159px` artwork window.

## 3.0.6 - 2026-05-21

Patch release for media grid and browser streaming regressions found with a larger video library.

### Fixed

- Loaded full movie, TV show, and music video library snapshots instead of capping the "All" views
  at 25 items.
- Kept Recently Added and Recently Played video sections bounded to the Chorus-style 25-item
  summaries.
- Preserved 2:3 poster framing on movie and TV cards so Kodi poster artwork is not cropped like a
  video thumbnail.
- Changed Movie, Episode, and Music Video "Play in browser" actions to resolve the file from Kodi
  library details and stream locally without first starting playback on the TV.
- Added a visible close control to the bottom-left Kodi remote overlay and kept empty filter panes
  recoverable instead of sliding the section menu to a blank panel.

## 3.0.5 - 2026-05-21

Patch release for Kodi queue and movie detail action polish.

### Fixed

- Stopped requesting playlist `label` and `type` properties that Kodi rejects for
  `Playlist.GetItems`, fixing the JSON-RPC error after Queue on movie details.
- Let the Chorus2-style movie detail More menu render outside the fanart header instead of being
  clipped by the hero container.

## 3.0.4 - 2026-05-20

Patch release for Chorus2-style movie detail parity.

### Fixed

- Replaced the generic movie detail card shell with the classic Chorus2 fanart header, poster,
  metadata, action row, More menu, and synopsis layout.
- Requested and normalized Kodi movie writers, cast, IMDb IDs, and stream details so direct movie
  pages show the same rich metadata Chorus2 displays.
- Wired the movie detail Stream action through the browser playback path while preserving Play,
  Queue, and Download actions.

## 3.0.3 - 2026-05-20

Patch release for classic movie detail metadata.

### Fixed

- Routed `#movie/:id` detail pages through the Kodi movie detail snapshot so movies outside the
  initial library page show their metadata instead of "Movie not found."
- Restored classic movie detail fields for plot, genre, director, studio, MPAA, runtime, ratings,
  watched state, resume point, and dates.
- Kept the movie detail poster preference on Kodi `art.poster` while preserving the classic
  Chorus-style surface.

## 3.0.2 - 2026-05-20

Patch release for movie artwork and detail parity.

### Fixed

- Preferred Kodi `art.poster` over `thumbnail` for movie and TV show cards so poster artwork is
  shown instead of generated video screenshots when Kodi provides it.
- Removed the fixed-width cap from the classic media card grid so desktop movie libraries can use
  the available content area.
- Preserved movie detail poster, fanart, and artwork URLs in the detail store and rendered them on
  the movie detail surface.
- Made the movie detail "Back to movies" link package-aware for Kodi-mounted hash routes.

## 3.0.1 - 2026-05-08

Patch release for the initial Chorus 3 port.

### Fixed

- Restored the missing PVR rail icon glyph in the classic left navigation.
- Routed movie, TV show, season, and episode detail URLs to their dedicated detail surfaces instead
  of the generic library grid.
- Loaded direct video detail routes from Kodi JSON-RPC so deep links like `#tvshow/1` and
  `#tvshow/1/5` populate with show, season, and episode data.
- Guarded video detail refreshes against stale route races and active Kodi host changes.

## 3.0.0 - 2026-05-08

Initial public release.

### Added

- Packaged Kodi webinterface add-on as `webinterface.chorus3`.
- Chorus2-style primary shell, rail navigation, submenu behavior, player bar, playlist drawer, and
  Kodi/Local destination controls.
- Music library, music browse, albums, artists, genres, top music, music videos, and media
  playlist flows.
- Movie, TV show, episode, season, stream, and video playlist surfaces.
- File browser with source, breadcrumb, directory, file play, queue, and download actions.
- Kodi settings, add-ons, help, lab/API browser, PVR, thumbs-up, playlists, search, remote input,
  and now-playing routes.
- Kodi package route fallbacks for direct package URLs and Chorus2-style hash routes.
- Local browser playback handoff, queue controls, album art/fanart handling, and Kodi now-playing
  synchronization.
- Kodi repository generator for `repository.keithah.kodi` and future add-ons.
- Verification coverage for routing, package safety, Kodi JSON-RPC stores, UI components, and
  browser smoke checks.

### Notes

- This is a faithful rewrite of Chorus2 using Svelte 5, TypeScript, Vite, Vitest, and modern Kodi
  JSON-RPC/WebSocket integrations.
- The compatibility target is Chorus2 behavior and layout, not the earlier ambient Chorus 3 shell.
