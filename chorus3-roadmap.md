# chorus3 — Modernization Roadmap

Rewrite of [chorus2](https://github.com/xbmc/chorus2) (CoffeeScript + Backbone/Marionette + Grunt) as a modern Kodi web interface using **Svelte 5 + Vite + TypeScript + Tailwind CSS**.

## Scope for this roadmap

**Primary goal: modernize the language and stack.** The visual design should be clean and functional but is not the focus — a future visual identity pass is noted as M7 but out of scope here. What matters now is parity with chorus2 plus fixing its known issues and adding first-class in-browser streaming (audio and video).

## Known chorus2 issues baked into this design

The following recurring issues from the [chorus2 tracker](https://github.com/xbmc/chorus2/issues) are addressed by specific tasks throughout this roadmap rather than treated as afterthoughts:

- **#580** — Browser playback doesn't update Kodi's `lastplayed` / `playcount` / watched status → addressed in M2 (scrobbling after local playback)
- **#589** — Watched status updates fail silently for large batches → addressed in M4 (batched watched-state writes with error surfacing)
- **#590** — Shuffled playlist panel doesn't reflect the order Kodi is actually playing in → addressed in M2 (WS-authoritative playlist state)
- **#591** — Smart playlist queue actions ignore Local/Kodi mode → addressed in M3 (smart playlist + mode-aware dispatch)
- **#592** — Video streaming to mobile doesn't handle audio channel mismatch → addressed in M4 (stereo downmix note + fallback messaging)
- **#593** — Landscape mode on mobile is unusable → addressed in M5 (responsive layout audit)
- **#594** — Unwatched counts not shown on library views → addressed in M3/M4 (unwatched badges as data layer requirement)
- **#587** — Kodi 21 video versions not supported → addressed in M4
- **#588** — No way to refresh/edit TV season artwork → addressed in M4
- **#598** — Embeddable Now Playing widget (Home Assistant etc.) → addressed in M6 (standalone `/now-playing` embed route)
- **Long-standing** — No HTTPS/WSS support for reverse-proxy setups → addressed in M1
- **Long-standing** — No subtitle or audio track switching during playback → addressed in M2
- **Long-standing** — Smart playlists can be played but not browsed or managed → addressed in M3
- **Long-standing** — No file browser for non-library media → addressed in M3
- **Long-standing** — Only one Kodi host configurable → addressed in M1

---

## Milestone 1: Foundation

**Goal:** A running Svelte 5 + Vite + TypeScript project that connects to a local Kodi instance over HTTP and WebSocket (including HTTPS/WSS for reverse-proxy setups), with a typed JSON-RPC client and persisted multi-host config.

**Success criteria:**
- `npm run dev` starts the app with no errors
- App pings Kodi, shows connection status and Kodi version
- HTTP and WSS both work; Basic Auth and no-auth both work
- Multiple saved Kodi hosts; switching hosts reconnects cleanly
- CI passes (lint, typecheck, build)

---

### Slice 1.1: Project Scaffold

**Capability:** A clean repo every contributor can clone and run in under five minutes.

**Tasks:**
- [ ] Initialise Vite + Svelte 5 project with TypeScript; configure `tsconfig.json` with strict mode, path aliases (`$lib`, `$components`, `$stores`), and `vite.config.ts` — must-have: `npm run build` exits 0
- [ ] Install and configure Tailwind CSS v4 with PostCSS; add base CSS reset and verify a utility class renders in dev — must-have: `<div class="bg-red-500">` renders red
- [ ] Set up ESLint (`eslint-plugin-svelte` + `@typescript-eslint`), Prettier, `.editorconfig`; add `lint` and `format` scripts — must-have: `npm run lint` reports zero errors on the scaffold
- [ ] Configure GitHub Actions CI: on push/PR, run lint → typecheck → build; cache node_modules — must-have: workflow passes on a clean push
- [ ] Write `CONTRIBUTING.md`: prereqs, dev setup, env vars (`VITE_KODI_HOST`, `VITE_KODI_PORT`), branch/PR convention — must-have: a developer can follow it from zero to running dev server

---

### Slice 1.2: Kodi JSON-RPC HTTP Client

**Capability:** A typed, reusable HTTP client covering the core Kodi namespaces.

**Tasks:**
- [ ] Define TypeScript types for the JSON-RPC 2.0 envelope (`JsonRpcRequest`, `JsonRpcResponse<T>`, `JsonRpcError`); implement `call<T>()` with Basic Auth, Content-Type, error unwrapping, and timeout — must-have: `JSONRPC.Ping` returns `"pong"` with correct type; no `any`
- [ ] Write typed method wrappers for **Player** namespace: `GetActivePlayers`, `GetItem`, `GetProperties`, `PlayPause`, `Stop`, `Seek`, `SetSpeed`, `GoTo`, `SetSubtitle`, `SetAudioStream` — must-have: each method has explicit parameter and return types
- [ ] Write typed method wrappers for **Application** (`GetProperties`, `SetVolume`, `SetMute`) and **System** (`Ping`, `GetInfoLabels`) namespaces — must-have: same type strictness as Player
- [ ] Write typed wrappers for top-level **AudioLibrary** scan methods (`GetArtists`, `GetAlbums`, `GetSongs`, `GetGenres`) and **VideoLibrary** equivalents (`GetMovies`, `GetTVShows`, `GetEpisodes`, `GetSeasons`) — must-have: all callable and type-checked

---

### Slice 1.3: Kodi WebSocket Notification Client

**Capability:** Persistent WebSocket (wss:// and ws://) connection delivering typed Kodi events to the app.

**Tasks:**
- [ ] Implement `KodiWebSocket` class supporting both `ws://` and `wss://` (driven by a `useTls` config flag); auto-reconnect with exponential backoff capped at 30s; heartbeat ping every 30s — must-have: survives Kodi restart without manual page reload; wss:// connects through a reverse proxy with a valid cert
- [ ] Define a TypeScript union type for all inbound notification events: `Player.OnPlay/OnPause/OnStop/OnResume/OnPropertyChanged/OnSeek`, `Application.OnVolumeChanged`, `System.OnSleep/OnWake`, `VideoLibrary.OnUpdate`, `AudioLibrary.OnUpdate` — must-have: no untyped event payloads
- [ ] Implement a typed pub/sub event bus (`on` / `off` / `emit`) fed by the WebSocket; expose as a singleton — must-have: multiple subscribers all fire; unsubscribed handlers do not
- [ ] Create `connectionStore` ($state: `status`, `lastError`, `kodiVersion`) wired to the WebSocket lifecycle — must-have: store updates reactively in any component

---

### Slice 1.4: Multi-Host Config Store

**Capability:** Users can configure multiple named Kodi hosts (HTTP/HTTPS, ws/wss, Basic Auth), switch between them, and have everything persist.

**Tasks:**
- [ ] Implement `configStore` ($state + $effect → localStorage); define `KodiHost` type (`id`, `label`, `host`, `port`, `username`, `password`, `useTls`, `useWebSocket`); support an ordered array of hosts with an `activeHostId` — must-have: config survives page reload; switching `activeHostId` reconnects both HTTP client and WebSocket without page reload
- [ ] Build the Host Settings UI: list of saved hosts, add/edit/delete, "Test connection" button per host (calls `JSONRPC.Ping` → shows version or error) — must-have: valid host shows Kodi version; invalid shows readable error message
- [ ] Build the Host Switcher component (header dropdown): lists saved hosts by label, active host highlighted, one-click switch — must-have: switching reconnects in < 1s; all stores (player, library) reset on host change
- [ ] Write a smoke-test script (`src/lib/test-connection.ts`, runnable via `tsx`) that connects, pings, and fetches `Application.GetProperties` — must-have: exits 0 against a real Kodi instance

---

## Milestone 2: Player Core + In-Browser Streaming

**Goal:** Full playback control from the browser — transport controls, volume, queue, subtitle and audio track selection — plus first-class in-browser audio and video streaming with correct Kodi scrobbling after local playback.

**Success criteria:**
- Play, pause, stop, seek, volume, shuffle, repeat, subtitle and audio track switching all work against Kodi
- Queue panel reflects Kodi's actual shuffle order in real time
- In-browser audio streaming works; played tracks update Kodi's `lastplayed` and `playcount`
- In-browser video streaming works for MP4/H.264; played videos update watched status and resume position
- Local/Kodi mode toggle is present and reliable

---

### Slice 2.1: Player State Store

**Capability:** A single authoritative store representing the full player state, merged from polling and WebSocket events, with shuffle order that matches what Kodi is actually playing.

**Tasks:**
- [ ] Define `PlayerState` type: `activePlayer` (id, type), `item` (id, title, artist, album, albumArt, duration), `position` (time, percentage), `speed`, `shuffled`, `repeat`, `volume`, `muted`, `playlistId` — must-have: all fields typed; no `any`
- [ ] Implement polling fallback (every 2s via `Player.GetActivePlayers` + `GetProperties` + `GetItem`) merged into `playerStore`; cancel in-flight poll when a WS event arrives — must-have: store stays accurate with WebSocket disabled
- [ ] Wire `Player.OnPlay/OnPause/OnStop/OnSeek/OnPropertyChanged` and `Application.OnVolumeChanged` to update the store within 100ms of the event — must-have: no uncaught exceptions in idle, no-player, or dual-player states
- [ ] For shuffle: fetch the active playlist order after each `Player.OnPlay` and after shuffle toggled; use `Playlist.GetItems` to get the *current* Kodi order (post-shuffle) and update `playlistStore` — must-have: queue panel reflects Kodi's actual playback order, fixing #590

---

### Slice 2.2: Now Playing UI

**Capability:** Persistent Now Playing panel with album art, metadata, and a seekable progress bar.

**Tasks:**
- [ ] Build `NowPlaying` component: album art (via `Files.PrepareDownload`), title, artist, album; reactive to `playerStore` — must-have: updates when track changes; shows placeholder art when unavailable
- [ ] Build `ProgressBar`: current / total time display; drag-to-seek calls `Player.Seek`; updates on `Player.OnSeek` — must-have: seek reflects within 200ms; works on touch
- [ ] Display extended metadata: codec, bitrate, resolution from `Player.GetItem` (audio/video info fields) — must-have: shown for local files; hidden gracefully when unavailable
- [ ] Animate art transitions: cross-fade on track change in ≤ 300ms — must-have: no layout shift

---

### Slice 2.3: Playback Controls + Subtitle/Audio Track Selection

**Capability:** Transport controls, shuffle/repeat toggles, volume, and in-playback subtitle and audio track switching.

**Tasks:**
- [ ] Build `TransportControls`: Play/Pause, Stop, Previous, Next; optimistic `playerStore` update + WS confirmation; buttons disabled when no active player — must-have: no double-fire on rapid clicks
- [ ] Build `ShuffleRepeat`: shuffle toggle (off/on), repeat (off/one/all) cycling; state from `playerStore` — must-have: icon reflects Kodi state after WS event
- [ ] Build `VolumeControl`: slider (0–100) + mute button; slider calls `Application.SetVolume` on `pointerup` — must-have: volume and mute update via WS event
- [ ] Build `SubtitleAudioSelector`: fetch available subtitle streams and audio tracks from `Player.GetItem` (`subtitles`, `audiostreams` fields); dropdown to select; calls `Player.SetSubtitle` / `Player.SetAudioStream` — must-have: selector visible only during active playback; selection applied immediately; current stream highlighted

---

### Slice 2.4: Queue / Playlist Management

**Capability:** View the current Kodi playlist, reorder, remove, and support smart playlists.

**Tasks:**
- [ ] Fetch active playlist via `Playlist.GetItems`; store in `playlistStore`; refresh on `Player.OnPlay` and `Player.OnStop` — must-have: loads within 500ms of track change
- [ ] Build `QueueList`: scrollable list with thumbnail, title, artist, duration; currently playing item highlighted and scrolled into view — must-have: list reflects Kodi's actual playback order (post-shuffle)
- [ ] Implement remove-from-queue (`Playlist.Remove`) and clear-queue (`Playlist.Clear`) with confirmation — must-have: list updates immediately; no stale items
- [ ] Implement drag-to-reorder using the HTML5 drag API; calls `Playlist.Swap` or remove+insert; also support smart playlists: when a smart playlist is the source, queue actions (play, add to queue) must respect the current Local/Kodi mode — must-have: dragged item lands in correct position; smart playlist actions route correctly, fixing #591

---

### Slice 2.5: Local Browser Audio Player + Scrobbling

**Capability:** Stream audio through the browser; update Kodi stats after local playback so "last played" and play counts stay accurate.

**Tasks:**
- [ ] Implement `localPlayerStore`: wraps `HTMLAudioElement`; `play(streamUrl)`, `pause`, `stop`, `seek(s)`, `setVolume(v)`, `mute`; tracks `playing`, `position`, `duration`, `volume`, `muted` — must-have: plays a Kodi-hosted MP3 stream in Chrome and Firefox
- [ ] Build `PlayerModeToggle` (Kodi vs Local); store choice in `configStore`; Local mode shifts accent colour to warm tint — must-have: switching modes does not interrupt audio; all transport controls route through a `playerDispatch` abstraction that delegates based on mode
- [ ] Construct stream URLs via `Files.PrepareDownload`; handle Basic Auth — must-have: stream URL works with credentials from `configStore`
- [ ] **Scrobbling after local playback** (fixes #580): when a track plays past 50% in Local mode, call `AudioLibrary.SetSongDetails` with updated `lastplayed` (current ISO timestamp) and incremented `playcount`; when a video plays past 90%, call `VideoLibrary.SetMovieDetails` / `SetEpisodeDetails` with `playcount`, `lastplayed`, and `resume` cleared — must-have: `playcount` increments in Kodi after local audio playback; "last played albums" list reflects browser plays

---

### Slice 2.6: In-Browser Video Streaming

**Capability:** Stream video in the browser via HTML5 with a custom overlay and Kodi resume sync.

**Tasks:**
- [ ] Build `VideoPlayer` component: `<video>` element with stream URL from `Files.PrepareDownload`; custom overlay (play/pause, seek bar, volume, fullscreen, time display); controls hide after 3s inactivity — must-have: plays MP4/H.264 in Chrome and Firefox; seek works on touch
- [ ] Build `StreamingRoute` (`/video/stream?itemid=&type=`): resolves stream URL, renders `VideoPlayer`, handles auth — must-have: navigating to the route with valid params starts playback without additional interaction
- [ ] **Resume sync**: on `VideoPlayer` mount, if the item has a `resume.position` > 0, offer "Resume from X:XX" or "Start from beginning"; on unmount (or every 30s of playback), call `VideoLibrary.SetMovieDetails` / `SetEpisodeDetails` with current position as `resume.position` — must-have: closing the player and reopening resumes from the saved position
- [ ] **Audio codec fallback** (addresses #592): if `<video>` fires `MEDIA_ERR_SRC_NOT_SUPPORTED`, display a friendly message explaining the limitation; note that 5.1 surround audio is a common cause on mobile; offer "Send to Kodi" as alternative — must-have: error appears within 1s; "Send to Kodi" triggers `Player.Open`

---

## Milestone 3: Music Library

**Goal:** Browse and play the full music library — artists, albums, tracks, genres, smart playlists, and a file browser. Global search.

**Success criteria:**
- Navigate artists → albums → tracks and add any item to queue or play immediately
- Smart playlists are browsable and playable
- File browser lets users reach non-library media sources
- Unwatched/unplayed counts visible on library cards

---

### Slice 3.1: Music Library Data Layer

**Capability:** Paginated, filterable, sortable data access for all music entities with artwork resolution and unwatched/unplayed counts.

**Tasks:**
- [ ] Implement a generic `LibraryPage<T>` store factory: method + params, manages `items`, `loading`, `error`, `hasMore`, `loadMore()` — must-have: load-more appends without duplicating; concurrent calls deduplicated
- [ ] Implement typed `getArtists`, `getAlbums`, `getSongs` using the factory with correct Kodi field lists; include `playcount` and `lastplayed` fields — must-have: paginated, typed; playcount present for unplayed/played filtering
- [ ] Implement `resolveArtUrl(kodiPath): string` using `Files.PrepareDownload` with session-level Map cache — must-have: second call for same path returns cached URL without a network request; failures return stable placeholder
- [ ] Build `libraryFilterStore` ($state: sort field + direction, genre, year, `recentlyAdded` flag); any change resets pagination and triggers fresh fetch — must-have: changing sort does not leave stale items from the previous sort order

---

### Slice 3.2: Artists Browser

**Capability:** Grid/list of artists with detail page, discography, and actions.

**Tasks:**
- [ ] Build `ArtistGrid`: virtual-scroll grid using `IntersectionObserver` sentinel to trigger `loadMore()` — must-have: renders 500 artists without frame drops on a mid-range machine
- [ ] Build `ArtistDetail` (route `/music/artists/:id`): artist info, biography, discography, fanart hero background — must-have: all data in one navigation without visible layout shift
- [ ] Add per-artist action menu: "Play artist" (shuffle all songs), "Add artist to queue" — both use `AudioLibrary.GetSongs` filtered by `artistid` — must-have: actions trigger correct Kodi or local player operation per current mode

---

### Slice 3.3: Albums Browser

**Capability:** Album grid with cover art; album detail with full tracklist.

**Tasks:**
- [ ] Build `AlbumGrid`: virtual-scroll grid of cover art + title + artist + year; lazy-load images; placeholder while loading — must-have: art loads progressively; no layout shift
- [ ] Build `AlbumDetail` (route `/music/albums/:id`): cover art, tracklist with track number/title/duration ordered by track number — must-have: tracklist complete and correctly ordered
- [ ] Add album-level actions: "Play album", "Shuffle album", "Add album to queue"; per-track: "Play from here", "Add track to queue" — must-have: all four trigger correct playlist operations

---

### Slice 3.4: Songs Browser + Global Search

**Capability:** Paginated all-songs view and global search across artists, albums, and songs.

**Tasks:**
- [ ] Build `SongList`: virtual-scroll list with title, artist, album, duration, action menu; sortable by title / artist / album / duration — must-have: correct at 5000+ songs with virtual scroll
- [ ] Implement global search: debounced 300ms query against `AudioLibrary.GetArtists`, `GetAlbums`, `GetSongs` (all `contains` filter) in parallel — must-have: results within 600ms of last keystroke on LAN
- [ ] Build `SearchResults` (route `/search?q=`): tabbed Artists / Albums / Songs with counts; each result links to detail and has add-to-queue action; empty state per tab — must-have: total zero shows helpful empty state
- [ ] Build `RecentlyAdded` (route `/music/recent`): `GetAlbums` sorted by `dateadded` desc, limit 50; each card has play/queue actions — must-have: loads in one fetch

---

### Slice 3.5: Genres, Smart Playlists + File Browser

**Capability:** Genre browsing, Kodi smart playlist support, and a file-source browser for non-library media.

**Tasks:**
- [ ] Build `GenreList` (route `/music/genres`) + `GenreDetail`: server-side `GetAlbums` filter by `genreid`; "Play genre" shuffles all songs in genre — must-have: genre filter applied server-side; not client-side
- [ ] Build `SmartPlaylistBrowser` (route `/music/playlists`): list Kodi smart playlists via `Files.GetDirectory` on `special://musicplaylists`; each playlist shows item count and has "Play", "Queue", "View tracks" actions — must-have: Local/Kodi mode is respected for all actions, fixing #591
- [ ] Build `FileBrowser` (route `/files`): `Files.GetSources` lists Kodi file sources (music, video, pictures, files); `Files.GetDirectory` navigates into each; media files have "Play" / "Add to queue" actions — must-have: navigates at least 3 directory levels deep; back navigation works via browser history
- [ ] Build `RecentlyPlayed` and `MostPlayed` views (`GetSongs` with `lastplayed` / `playcount` sort); "Random Mix" button — must-have: each view loads correct data; "Random Mix" produces a different set each click

---

## Milestone 4: Video Library

**Goal:** Browse and play movies and TV shows. Resume support. Watched status sync (including for large batches). Kodi 21 video versions. TV season artwork refresh.

**Success criteria:**
- Movies and TV shows browsable with poster art, unwatched count badges, filters, sort
- Play / Resume / Stream in browser all work; watched status syncs correctly to Kodi
- Watched status updates for 100+ items do not silently fail
- Kodi 21 video versions visible and selectable
- TV season artwork can be refreshed from the UI

---

### Slice 4.1: Movies Browser

**Capability:** Paginated, filterable, sortable movie grid with unwatched indicators.

**Tasks:**
- [ ] Implement `getMovies` using the library data layer; fields: `title`, `year`, `thumbnail`, `fanart`, `genre`, `rating`, `playcount`, `resume`, `versions` (Kodi 21+) — must-have: paginated load works; `resume` and `versions` fields present when available
- [ ] Build `MovieGrid`: virtual-scroll poster grid; watched movies show a subtle ✓ overlay — must-have: correct at 500+ movies
- [ ] Build `MovieFilter` panel: genre multi-select, year range, MPAA rating, watched/unwatched/all, sort (title/year/rating/dateadded/lastplayed) — must-have: all filters are server-side `VideoLibrary.GetMovies` params; no client-side filtering

---

### Slice 4.2: Movie Detail View

**Capability:** Full movie info, cast, Kodi 21 video version selection, playback actions, and correct watched sync.

**Tasks:**
- [ ] Build `MovieDetail` (route `/video/movies/:id`): fanart hero, poster, title, year, tagline, plot, runtime, genres, MPAA, rating; cast top 10 with lazy thumbnails — must-have: absent fields hidden gracefully; no layout shift
- [ ] Display **video versions** (Kodi 21+, fixes #587): if `movie.versions` has entries, show a "Version" dropdown (`VideoLibrary.GetAvailableArt` for version art if needed); selected version passed to `Player.Open` via `options.playoffset` or version id — must-have: dropdown hidden when only one version; correct version sent to Kodi on Play
- [ ] Add actions: "Play", "Resume" (only when `resume.position > 0`), "Stream in browser", "Add to queue", "Mark watched/unwatched" — must-have: optimistic watched toggle updates UI immediately
- [ ] **Batched watched sync** (fixes #589): when marking watched/unwatched on multiple items (e.g. "mark season watched"), issue `SetMovieDetails` / `SetEpisodeDetails` calls in serial batches of 10 with a 100ms gap; collect errors and surface a summary (e.g. "3 of 12 updates failed, retry?") rather than silently failing — must-have: 100-item batch completes; errors are reported to the user

---

### Slice 4.3: TV Shows Browser + Season Navigation

**Capability:** TV show grid with unwatched badges; season and episode browsing.

**Tasks:**
- [ ] Build `TVShowGrid` (route `/video/tvshows`): poster grid with unwatched badge (`episode - watchedepisodes`); filter by genre, year, watched state — must-have: badge hidden when 0 unwatched
- [ ] Build `TVShowDetail` (route `/video/tvshows/:id`): fanart hero, plot, cast summary, season list via `GetSeasons`; each season card shows episode count + watched count + **"Refresh artwork"** button (`VideoLibrary.RefreshEpisodes` or `VideoLibrary.RefreshTVShow` for the season) — must-have: Refresh artwork calls correct API and shows a loading state, fixing #588
- [ ] Build `SeasonDetail` (route `/video/tvshows/:id/seasons/:s`): episode list via `GetEpisodes`; each row: thumbnail, `SxxExx`, title, air date, watched indicator; bulk "Mark season watched" action — must-have: ordered by episode number; bulk action uses the batched write from Slice 4.2

---

### Slice 4.4: Episode Detail + Playback

**Capability:** Episode info, guest cast, play/resume/stream actions, and next-episode navigation.

**Tasks:**
- [ ] Build `EpisodeDetail` (route `/video/tvshows/:showId/seasons/:s/episodes/:e`): thumbnail, `SxxExx`, air date, plot, runtime, guest cast — must-have: absent fields hidden gracefully
- [ ] Add actions: "Play", "Resume" (when `resume.position > 0`), "Stream in browser", "Add to queue", "Mark watched/unwatched", "Next episode" (navigate to next `episodeid` in season) — must-have: "Next episode" only appears when a next episode exists
- [ ] Add "Play from here" on episode rows in `SeasonDetail`: clears queue and adds this episode through end of season — must-have: episodes added in correct order; first plays immediately

---

### Slice 4.5: Video Smart Playlists + Recently Added/Played

**Capability:** Browse video smart playlists, recently added and recently played video.

**Tasks:**
- [ ] Build `VideoSmartPlaylists` (route `/video/playlists`): list from `Files.GetDirectory` on `special://videoplaylists`; "Play", "Queue", "View items" actions — must-have: mode-aware dispatch (Local or Kodi)
- [ ] Build `RecentlyAddedMovies` and `RecentlyAddedEpisodes` views; `VideoLibrary.GetRecentlyAddedMovies` / `GetRecentlyAddedEpisodes` — must-have: each loads in one fetch; cards have play/queue actions
- [ ] Build `RecentlyPlayedMovies` and `RecentlyPlayedEpisodes` using `GetMovies` / `GetEpisodes` sorted by `lastplayed` desc — must-have: loads correctly; items with no `lastplayed` excluded

---

## Milestone 5: Settings, Add-ons & Utilities

**Goal:** Kodi settings management, add-on browser, keyboard shortcuts, i18n foundation, and a standalone embeddable Now Playing widget.

**Success criteria:**
- Kodi settings readable and editable from the browser
- Add-ons browsable and enable/disable-able
- All UI strings externalised; locale switcher works
- `/now-playing` route works as a standalone embeddable widget (Home Assistant, dashboards)

---

### Slice 5.1: Kodi Settings Page

**Capability:** Browse and edit Kodi settings dynamically rendered by type.

**Tasks:**
- [ ] Fetch settings tree via `Settings.GetSettings(level: "standard")`; type sections, categories, settings as TypeScript interfaces; store in `settingsStore` — must-have: full tree loads without error against Kodi 21
- [ ] Build `SettingsPage` (route `/settings`): sidebar sections → category → controls; render by type: `boolean` → Toggle, `integer` → Slider or NumberInput, `string` → TextInput, `enum` → Select — must-have: all four types render and submit correctly
- [ ] `Settings.SetSettingValue` on change with optimistic UI and error rollback; settings search (client-side substring on loaded tree) — must-have: on Kodi error the value reverts and an error toast appears; search updates on each keystroke

---

### Slice 5.2: Add-ons Browser

**Capability:** Browse installed add-ons, view details, toggle enabled/disabled.

**Tasks:**
- [ ] Fetch via `Addons.GetAddons` with `name`, `version`, `enabled`, `thumbnail`, `description`, `type`; group by type — must-have: all installed add-ons present; grouped correctly
- [ ] Build `AddonGrid` (route `/addons`): icon grid with name, type badge, enabled indicator; filter by type; search by name — must-have: disabled add-ons visually distinct
- [ ] Build `AddonDetail` (route `/addons/:id`): full description, version, Enable/Disable toggle → `Addons.SetAddonEnabled`; state update via WS `Other.OnAddonEnabled` or re-fetch fallback — must-have: toggle updates Kodi and reflects new state

---

### Slice 5.3: Keyboard Shortcuts + API Browser

**Capability:** Global keyboard shortcuts and the Lab API browser (ported from Chorus2).

**Tasks:**
- [ ] Implement global keyboard shortcut handler: `Space` play/pause, `←`/`→` seek ±10s, `↑`/`↓` volume, `M` mute, `N` next, `P` previous, `F` fullscreen (video) — must-have: shortcuts fire only when focus is not in a text input; each shortcut has a corresponding `aria-keyshortcuts` annotation
- [ ] Fetch Kodi introspection via `JSONRPC.Introspect`; cache per session; build `LabAPIBrowser` (route `/lab/api-browser`): namespace/method tree + param form + "Call" button + raw JSON response — must-have: any method callable; response displayed
- [ ] Build keyboard shortcut reference page (route `/lab/shortcuts`); add `/lab` nav entry (beaker icon) — must-have: route navigable; not surfaced in primary nav

---

### Slice 5.4: i18n Foundation

**Capability:** All UI strings externalised; locale switcher; English at 100%; one additional language.

**Tasks:**
- [ ] Integrate `svelte-i18n`; configure with fallback locale `en`; define key naming convention (`section.component.key`) — must-have: `$_('player.controls.play')` renders "Play"; missing key falls back to key string
- [ ] Extract all hardcoded strings from every `.svelte` file to `src/lang/en.json` — must-have: `grep`-based CI check finds zero hardcoded common English strings in Svelte files
- [ ] Build `LocaleSwitcher` in app settings; `locale.set()` + persist to `configStore` — must-have: switching updates all visible strings without page reload
- [ ] Add `src/lang/de.json` (German, complete); add CI check that warns on keys missing from non-English locale files — must-have: German renders correctly; CI catches a deliberately introduced missing key

---

### Slice 5.5: Embeddable Now Playing Widget

**Capability:** A standalone `/now-playing` route usable as an iframe embed in Home Assistant or any dashboard (fixes #598).

**Tasks:**
- [ ] Build `NowPlayingEmbed` page (route `/now-playing`): full-page layout showing current track art, title, artist, progress bar, transport controls; accepts query params `?host=&port=&username=&password=` to bypass the normal config store — must-have: page works in an `<iframe>` without requiring any prior app navigation; query params override config
- [ ] Add a `?theme=dark|light` query param to `NowPlayingEmbed` so the embed matches the host dashboard — must-have: `?theme=light` renders with a light background and dark text; `?theme=dark` renders dark
- [ ] Document the embed route in `README.md` with example iframe HTML for Home Assistant — must-have: example code is copy-pasteable and works

---

### Slice 5.6: Build, Packaging & Release

**Capability:** `build.sh` produces a valid installable Kodi add-on zip; GitHub Actions release workflow.

**Tasks:**
- [ ] Configure Vite production build: minify, chunk splitting (vendor / app / async-routes), content-hash filenames, `base: "./"` — must-have: `npm run build` produces `dist/index.html` with no absolute `/` paths
- [ ] Write `addon.xml` for Kodi 21 (Omega): `id="webinterface.default"`, correct `provides`, version from `package.json`, i18n summary — must-have: XML validates against Kodi add-on XSD
- [ ] Write `build.sh`: `npm run build`, copy `dist/` + `addon.xml` into staging, zip to `webinterface.default.X.X.X.zip` — must-have: zip installs via Kodi "Install from zip" on Kodi 21 without errors
- [ ] GitHub Actions release workflow: on `v*` tag push, run CI → `build.sh` → attach zip as release asset — must-have: test tag push produces a GitHub Release with zip attached
- [ ] Write `UAT.md`: checklist covering install, connection (HTTP and HTTPS), audio streaming + scrobble verify, video streaming + resume verify, watched status bulk update, both playback modes, settings edit, keyboard shortcuts — must-have: completable by a tester in < 30 minutes against a live Kodi instance

---

## Milestone 6: Responsive Layout + Mobile

**Goal:** The full app works on mobile browsers (375px+) with touch-friendly interaction and landscape support.

**Success criteria:**
- No horizontal overflow at 375px viewport width, portrait or landscape
- Touch targets meet 44px minimum
- Audio streaming and seek work on mobile Safari and Chrome for Android
- Landscape mode is usable on smartphone (fixes #593)

---

### Slice 6.1: Responsive Layout

**Capability:** Correct layout at all breakpoints including mobile landscape.

**Tasks:**
- [ ] Define responsive breakpoints in Tailwind: `mobile` (< 640px), `tablet` (640–1024px), `desktop` (> 1024px); audit all existing layout components — must-have: no horizontal overflow at 375px portrait or landscape
- [ ] Adapt `AppShell` for mobile: sidebar → bottom tab bar (5 icons) on mobile; NowPlayingBar swipe-up → full-screen sheet — must-have: bottom nav 44px tall; full-screen sheet closes on swipe-down
- [ ] Fix landscape mode on mobile (fixes #593): in landscape the sidebar collapses to icon-only and the main content takes the full width; now-playing bar reduces to compact strip — must-have: all primary features are reachable in landscape at 375px height without scrolling the chrome

---

### Slice 6.2: Touch + Mobile Audit

**Capability:** All interactive elements are touch-friendly and the app is usable on mobile devices.

**Tasks:**
- [ ] Audit all interactive elements for 44×44px touch targets; fix any that fall short — must-have: zero touch-target violations in a manual audit of Music, Video, and Now Playing views at 375px
- [ ] Verify audio streaming, drag-to-seek progress bar, and queue reorder on mobile Safari (iOS 16+) and Chrome for Android — must-have: audio streaming plays in both; seek works on touch; queue DnD has a touch fallback (long-press handle)
- [ ] Test the embeddable Now Playing widget (`/now-playing`) at 375px — must-have: art, title, and controls all visible without scrolling in a 375×200px iframe

---

## Milestone 7: Visual Identity (Future / Out of Scope for v1)

**Note:** This milestone is intentionally deferred. The goal of Milestones 1–6 is a clean, functional modernization that looks reasonable. This milestone is where the UI gets a deliberate design pass.

**Planned work (not detailed yet):**
- Design token system (CSS custom properties as Tailwind aliases)
- Revised default dark theme ("Kodi Night") — not bound by Chorus2's visual decisions
- Alternative light/warm color scheme ("Chorus Day")
- Full component library with variant documentation
- WCAG AA compliance audit across both themes
- Living style guide at `/lab/design`
