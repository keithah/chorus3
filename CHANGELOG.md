# Changelog

All notable changes to Chorus 3 are tracked here.

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
