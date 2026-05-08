# Changelog

All notable changes to Chorus 3 are tracked here.

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
