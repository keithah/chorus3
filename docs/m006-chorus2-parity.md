# M006 Chorus2 Parity Ledger

> Generated from `CHORUS2_PARITY_LEDGER`; do not edit by hand. Run `node scripts/verify-chorus2-parity.mjs --write` to refresh.

S01 proof is static source comparison only; no live Kodi calls are performed.
Later slices own route aliases, Remote/Input, media alias bridges, packaged shell proof, and closeout.

<!-- prettier-ignore-start -->

## Totals by Kind and Status

| kind | implemented | missing | deferred | out-of-scope | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| route | 78 | 0 | 0 | 0 | 78 |
| nav | 83 | 0 | 0 | 0 | 83 |
| control | 23 | 0 | 0 | 0 | 23 |
| action | 232 | 0 | 0 | 0 | 232 |
| jsonrpc | 142 | 0 | 0 | 0 | 142 |

## Totals by Status

| status | count |
| --- | ---: |
| implemented | 558 |
| missing | 0 |
| deferred | 0 |
| out-of-scope | 0 |

## Family: add-on

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:add-on:add-on` | nav | `AddOn` | implemented | M006/S02 | `src/js/apps/addon/addon_app.js.coffee:23` | Route/menu alias backlog from Chorus2 source scan. |

## Family: add-ons

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:add-ons:add-ons` | nav | `Add-ons` | implemented | M006/S02 | `src/js/apps/addon/list/list_controller.js.coffee:31` | Route/menu alias backlog from Chorus2 source scan. |

## Family: add-ons-search-settings

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:add-ons-search-settings:add-ons-search-settings` | nav | `addOnsSearchSettings` | implemented | R057/M006/S04 | `src/js/apps/addon/addon_app.js.coffee:38`<br>`src/js/apps/addon/addon_app.js.coffee:89`<br>`src/lib/stores/addonsStore.svelte.ts` | Add-ons store rebuilds the enabled provider search-settings cache used by Chorus2. |

## Family: addon

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:addon:addon-enabled-addons` | action | `addon:enabled:addons` | implemented | R057/M006/S04 | `src/js/apps/addon/addon_app.js.coffee:76`<br>`src/lib/stores/addonsStore.svelte.ts` | AddonsStore exposes clone-safe enabled add-on snapshots for Chorus2 request-handler parity. |
| `action:addon:addon-entities` | action | `addon:entities` | implemented | R057/M006/S04 | `src/js/entities/kodi/addon.js.coffee:71`<br>`src/lib/stores/addonsStore.svelte.ts` | AddonsStore exposes all/type-filtered add-on entities and normalizes provider capabilities. |
| `action:addon:addon-excluded-paths` | action | `addon:excludedPaths` | implemented | R057/M006/S04 | `src/js/apps/addon/addon_app.js.coffee:80`<br>`src/js/apps/addon/youtube/addon_youtube_app.js.coffee:27`<br>`src/lib/stores/addonsStore.svelte.ts`<br>`src/lib/stores/mediaFiles.svelte.ts` | YouTube plugin excluded breadcrumb paths are shared with the media file browser. |
| `action:addon:addon-is-enabled` | action | `addon:isEnabled` | implemented | R057/M006/S04 | `src/js/apps/addon/addon_app.js.coffee:72`<br>`src/lib/stores/addonsStore.svelte.ts` | AddonsStore mirrors the enabled add-on filter lookup used by Chorus2 request handlers. |
| `action:addon:addon-pvr-enabled` | action | `addon:pvr:enabled` | implemented | R056/M006/S04 | `src/js/apps/addon/pvr/addons_pvr_ap.js.coffee:9` | PVR parity backlog from Chorus2 source scan. |
| `action:addon:addon-search-enabled` | action | `addon:search:enabled` | implemented | R057/M006/S04 | `src/js/apps/addon/addon_app.js.coffee:88`<br>`src/lib/stores/addonsStore.svelte.ts` | Enabled add-ons now produce Chorus2-compatible provider search settings. |
| `action:addon:addon-search-settings` | action | `addon:search:settings:` | implemented | R057/M006/S04 | `src/js/apps/addon/googlemusic/addon_googlemusic_app.js.coffee:15`<br>`src/js/apps/addon/mixcloud/addon_mixcloud_app.js.coffee:14`<br>`src/js/apps/addon/radio/addon_radio_app.js.coffee:15`<br>`src/js/apps/addon/soundcloud/addon_soundcloud_app.js.coffee:14`<br>`src/js/apps/addon/youtube/addon_youtube_app.js.coffee:13`<br>`src/lib/stores/addonsStore.svelte.ts` | Known Chorus2 provider search URL templates are exposed from the Add-ons store. |
| `nav:addon:addons-all` | nav | `addons/all` | implemented | M006/S04 | `src/lib/app-pages/AppPageSurface.svelte`<br>`src/lib/app-shell/appNavigation.ts`<br>`src/lib/app/primaryRoutes.ts` |  |
| `nav:addon:addons-audio` | nav | `addons/audio` | implemented | M006/S04 | `src/lib/app-pages/AppPageSurface.svelte`<br>`src/lib/app-shell/appNavigation.ts`<br>`src/lib/app/primaryRoutes.ts` |  |
| `nav:addon:addons-executable` | nav | `addons/executable` | implemented | M006/S04 | `src/lib/app-pages/AppPageSurface.svelte`<br>`src/lib/app-shell/appNavigation.ts`<br>`src/lib/app/primaryRoutes.ts` |  |
| `nav:addon:addons-video` | nav | `addons/video` | implemented | M006/S04 | `src/lib/app-pages/AppPageSurface.svelte`<br>`src/lib/app-shell/appNavigation.ts`<br>`src/lib/app/primaryRoutes.ts` |  |
| `route:addon:addon-execute-id` | route | `addon/execute/:id` | implemented | M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:addon:addons` | route | `addons` | implemented | M006/S01 | `src/lib/app/appRouter.ts` |  |
| `route:addon:addons-addonid` | route | `addons/:addonid` | implemented | M006/S01 | `src/lib/app/appRouter.ts` |  |
| `route:addon:addons-type` | route | `addons/:type` | implemented | M006/S04 | `src/lib/app/appRouter.ts` | Chorus2 type-filter aliases route to the implemented AddonsPage filters. |

## Family: addons

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:addons:controller` | jsonrpc | `Addons.Controller` | implemented | M006/S04 | `src/js/apps/settings/show/addons/addons_controller.js.coffee:3` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:addons:execute-addon` | jsonrpc | `Addons.ExecuteAddon` | implemented | M006/S04 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:addons:get-addons` | jsonrpc | `Addons.GetAddons` | implemented | M006/S04 | `src/js/apps/command/kodi/helpers/addon.js.coffee:27`<br>`src/js/apps/command/kodi/helpers/addon.js.coffee:6`<br>`src/js/entities/kodi/file.js.coffee:62`<br>`src/lib/kodi/methods.ts`<br>`src/lib/stores/addonsStore.svelte.ts` | Typed Kodi wrapper is wired through the Add-ons store and AddonsPage filters. |
| `jsonrpc:addons:set-addon-enabled` | jsonrpc | `Addons.SetAddonEnabled` | implemented | M006/S04 | `src/js/apps/settings/show/addons/addons_controller.js.coffee:82`<br>`src/lib/kodi/methods.ts`<br>`src/lib/stores/addonsStore.svelte.ts` | Typed Kodi wrapper is guarded by the Add-ons store confirmation flow. |
| `nav:addons:addons-all` | nav | `addons/all` | implemented | M006/S02 | `src/js/apps/addon/list/list_controller.js.coffee:31`<br>`src/js/entities/nav/navMain.js.coffee:46`<br>`src/js/entities/nav/navMain.js.coffee:47` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:addons:addons-audio` | nav | `addons/audio` | implemented | M006/S04 | `src/js/entities/nav/navMain.js.coffee:49` | Media parity backlog from Chorus2 source scan. |
| `nav:addons:addons-executable` | nav | `addons/executable` | implemented | M006/S04 | `src/js/entities/nav/navMain.js.coffee:51` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:addons:addons-video` | nav | `addons/video` | implemented | M006/S04 | `src/js/entities/nav/navMain.js.coffee:48` | Route/menu alias backlog from Chorus2 source scan. |
| `route:addons:settings-addons` | route | `settings/addons` | implemented | M006/S01 | `src/js/apps/settings/settings_app.js.coffee:8` | Route/menu alias backlog from Chorus2 source scan. |

## Family: album

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:album:album-action` | action | `album:action` | implemented | R054/M006/S04 | `src/js/apps/album/album_app.js.coffee:38` | Media parity backlog from Chorus2 source scan. |
| `action:album:album-action-items` | action | `album:action:items` | implemented | R054/M006/S04 | `src/js/apps/album/album_app.js.coffee:41` | Media parity backlog from Chorus2 source scan. |
| `action:album:album-edit` | action | `album:edit` | implemented | R054/M006/S04 | `src/js/apps/album/album_app.js.coffee:47` | Media parity backlog from Chorus2 source scan. |
| `action:album:album-entities` | action | `album:entities` | implemented | R054/M006/S04 | `src/js/entities/kodi/album.js.coffee:63` | Media parity backlog from Chorus2 source scan. |
| `action:album:album-entity` | action | `album:entity` | implemented | R054/M006/S04 | `src/js/entities/kodi/album.js.coffee:59` | Media parity backlog from Chorus2 source scan. |
| `action:album:album-fields` | action | `album:fields` | implemented | R054/M006/S04 | `src/js/entities/kodi/album.js.coffee:67` | Media parity backlog from Chorus2 source scan. |
| `action:album:album-list-view` | action | `album:list:view` | implemented | R054/M006/S04 | `src/js/apps/album/list/list_controller.js.coffee:75` | Media parity backlog from Chorus2 source scan. |
| `route:album:albums` | route | `albums` | implemented | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: albums

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:albums:albums-withsongs-view` | action | `albums:withsongs:view` | implemented | R054/M006/S04 | `src/js/apps/album/show/show_controller.js.coffee:98` | Media parity backlog from Chorus2 source scan. |

## Family: api-browser

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:api-browser:lab-api-browser` | route | `lab/api-browser` | implemented | M006/S04 | `src/js/apps/lab/lab_app.js.coffee:19` | Route/menu alias backlog from Chorus2 source scan. |
| `route:api-browser:lab-api-browser-method` | route | `lab/api-browser/:method` | implemented | M006/S04 | `src/js/apps/lab/lab_app.js.coffee:20` | Route/menu alias backlog from Chorus2 source scan. |

## Family: application

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:application:get-properties` | jsonrpc | `Application.GetProperties` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:application:on-volume-changed` | jsonrpc | `Application.OnVolumeChanged` | implemented | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:151` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:application:quit` | jsonrpc | `Application.Quit` | implemented | D043/M006/S05 | `src/lib/kodi/methods.ts` | Guarded destructive method; do not expose without confirmation. |
| `jsonrpc:application:set-mute` | jsonrpc | `Application.SetMute` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:application:set-volume` | jsonrpc | `Application.SetVolume` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |

## Family: artist

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:artist:artist-action` | action | `artist:action` | implemented | R054/M006/S04 | `src/js/apps/artist/artist_app.js.coffee:38` | Media parity backlog from Chorus2 source scan. |
| `action:artist:artist-action-items` | action | `artist:action:items` | implemented | R054/M006/S04 | `src/js/apps/artist/artist_app.js.coffee:41` | Media parity backlog from Chorus2 source scan. |
| `action:artist:artist-edit` | action | `artist:edit` | implemented | R054/M006/S04 | `src/js/apps/artist/artist_app.js.coffee:47` | Media parity backlog from Chorus2 source scan. |
| `action:artist:artist-entities` | action | `artist:entities` | implemented | R054/M006/S04 | `src/js/entities/kodi/artist.js.coffee:63` | Media parity backlog from Chorus2 source scan. |
| `action:artist:artist-entity` | action | `artist:entity` | implemented | R054/M006/S04 | `src/js/entities/kodi/artist.js.coffee:59` | Media parity backlog from Chorus2 source scan. |
| `action:artist:artist-fields` | action | `artist:fields` | implemented | R054/M006/S04 | `src/js/entities/kodi/artist.js.coffee:70` | Media parity backlog from Chorus2 source scan. |
| `action:artist:artist-list-view` | action | `artist:list:view` | implemented | R054/M006/S04 | `src/js/apps/artist/list/list_controller.js.coffee:75` | Media parity backlog from Chorus2 source scan. |
| `route:artist:artists` | route | `artists` | implemented | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: audio-library

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:audio-library:clean` | jsonrpc | `AudioLibrary.Clean` | implemented | R054/M006/S04 | `src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:36`<br>`src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:get-album-details` | jsonrpc | `AudioLibrary.GetAlbumDetails` | implemented | R054/M006/S04 | `src/js/entities/kodi/album.js.coffee:33` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:get-albums` | jsonrpc | `AudioLibrary.GetAlbums` | implemented | R054/M006/S04 | `src/js/entities/kodi/album.js.coffee:46` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:get-artist-details` | jsonrpc | `AudioLibrary.GetArtistDetails` | implemented | R054/M006/S04 | `src/js/entities/kodi/artist.js.coffee:33` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:get-artists` | jsonrpc | `AudioLibrary.GetArtists` | implemented | R054/M006/S04 | `src/js/entities/kodi/artist.js.coffee:45` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:get-genres` | jsonrpc | `AudioLibrary.GetGenres` | implemented | R054/M006/S04 | `src/js/entities/kodi/genres.js.coffee:40` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:get-song-details` | jsonrpc | `AudioLibrary.GetSongDetails` | implemented | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:111`<br>`src/js/entities/kodi/song.js.coffee:85` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:get-songs` | jsonrpc | `AudioLibrary.GetSongs` | implemented | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:122`<br>`src/js/entities/kodi/song.js.coffee:137` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:on-clean-finished` | jsonrpc | `AudioLibrary.OnCleanFinished` | implemented | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:181` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:on-clean-started` | jsonrpc | `AudioLibrary.OnCleanStarted` | implemented | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:177` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:on-scan-finished` | jsonrpc | `AudioLibrary.OnScanFinished` | implemented | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:170` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:on-scan-started` | jsonrpc | `AudioLibrary.OnScanStarted` | implemented | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:166` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:on-update` | jsonrpc | `AudioLibrary.OnUpdate` | implemented | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:193` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:scan` | jsonrpc | `AudioLibrary.Scan` | implemented | R054/M006/S04 | `src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:31`<br>`src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:set-album-details` | jsonrpc | `AudioLibrary.SetAlbumDetails` | implemented | R054/M006/S04 | `src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:12`<br>`src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:set-artist-details` | jsonrpc | `AudioLibrary.SetArtistDetails` | implemented | R054/M006/S04 | `src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:19`<br>`src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:set-song-details` | jsonrpc | `AudioLibrary.SetSongDetails` | implemented | R054/M006/S04 | `src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:26`<br>`src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |

## Family: audiolibrary

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:audiolibrary:clean` | jsonrpc | `AudioLibrary.Clean` | implemented | R054/M006/S04 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:audiolibrary:scan` | jsonrpc | `AudioLibrary.Scan` | implemented | R054/M006/S04 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:audiolibrary:set-album-details` | jsonrpc | `AudioLibrary.SetAlbumDetails` | implemented | R054/M006/S04 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:audiolibrary:set-artist-details` | jsonrpc | `AudioLibrary.SetArtistDetails` | implemented | R054/M006/S04 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:audiolibrary:set-song-details` | jsonrpc | `AudioLibrary.SetSongDetails` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |

## Family: auto

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:auto:auto` | nav | `auto` | implemented | M006/S02 | `src/js/apps/addon/addon_app.js.coffee:23`<br>`src/js/apps/pvr/channelList/channel_list_controller.js.coffee:30`<br>`src/js/apps/pvr/channelList/channel_list_controller.js.coffee:34` | Route/menu alias backlog from Chorus2 source scan. |

## Family: body

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:body:body-state` | action | `body:state` | implemented | M006/S04 | `src/js/apps/shell/shell_app.js.coffee:142` | Command/action parity backlog from Chorus2 source scan. |

## Family: broadcast

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:broadcast:broadcast-action` | action | `broadcast:action` | implemented | R056/M006/S04 | `src/js/apps/epg/epg_app.js.coffee:36` | Broadcast timer actions are wired through the PVR page and typed JSON-RPC wrappers. |
| `action:broadcast:broadcast-entities` | action | `broadcast:entities` | implemented | R056/M006/S04 | `src/js/entities/kodi/epg.js.coffee:65` | PVR store loads broadcast collections for selected TV/radio channels. |
| `action:broadcast:broadcast-entity` | action | `broadcast:entity` | implemented | R056/M006/S04 | `src/js/entities/kodi/epg.js.coffee:61` | Selected channel broadcast rows are normalized for the PVR surface. |

## Family: broadcast-play

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:broadcast-play:broadcast-play` | nav | `broadcast:play` | implemented | R056/M006/S04 | `src/js/apps/epg/list/list_controller.js.coffee:14` | Selected broadcast play dispatches channel playback like Chorus2. |

## Family: broadcast-record

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:broadcast-record:broadcast-record` | nav | `broadcast:record` | implemented | R056/M006/S04 | `src/js/apps/epg/list/list_controller.js.coffee:16` | Selected broadcast record dispatches the channel recording toggle. |

## Family: broadcast-timer

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:broadcast-timer:broadcast-timer` | nav | `broadcast:timer` | implemented | R056/M006/S04 | `src/js/apps/epg/list/list_controller.js.coffee:18` | Selected broadcast timer dispatches PVR.ToggleTimer. |

## Family: browser

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:browser:browser-directory-view` | action | `browser:directory:view` | implemented | M006/S04 | `src/js/apps/browser/list/list_controller.js.coffee:172` | Command/action parity backlog from Chorus2 source scan. |
| `action:browser:browser-file-view` | action | `browser:file:view` | implemented | M006/S04 | `src/js/apps/browser/list/list_controller.js.coffee:168` | Command/action parity backlog from Chorus2 source scan. |
| `nav:browser:browser` | nav | `browser` | implemented | M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts`<br>`src/main.test.ts` |  |
| `route:browser:browser` | route | `browser` | implemented | M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:browser:files` | route | `files` | implemented | M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: cast

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:cast:cast-entities` | action | `cast:entities` | implemented | M006/S04 | `src/js/entities/kodi/cast.js.coffee:45` | Command/action parity backlog from Chorus2 source scan. |
| `action:cast:cast-list-view` | action | `cast:list:view` | implemented | M006/S04 | `src/js/apps/cast/cast_app.js.coffee:19` | Command/action parity backlog from Chorus2 source scan. |

## Family: category

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:category:category` | route | `category` | implemented | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: channel

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:channel:channel-entities` | action | `channel:entities` | implemented | R056/M006/S04 | `src/js/entities/kodi/pvr.js.coffee:108` | PVR store normalizes channel collections and the PVR page renders Chorus2 child actions. |
| `action:channel:channel-entity` | action | `channel:entity` | implemented | R056/M006/S04 | `src/js/entities/kodi/pvr.js.coffee:104` | PVR store can load and replace single channel details with PVR.GetChannelDetails. |

## Family: childview-broadcast-play

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-broadcast-play:childview-broadcast-play` | nav | `childview:broadcast:play` | implemented | R056/M006/S04 | `src/js/apps/epg/list/list_controller.js.coffee:6` | Broadcast rows expose Chorus2 play actions. |

## Family: childview-broadcast-record

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-broadcast-record:childview-broadcast-record` | nav | `childview:broadcast:record` | implemented | R056/M006/S04 | `src/js/apps/epg/list/list_controller.js.coffee:8` | Broadcast rows expose Chorus2 record actions. |

## Family: childview-broadcast-timer

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-broadcast-timer:childview-broadcast-timer` | nav | `childview:broadcast:timer` | implemented | R056/M006/S04 | `src/js/apps/epg/list/list_controller.js.coffee:10` | Broadcast rows expose Chorus2 timer actions. |

## Family: childview-channel-play

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-channel-play:childview-channel-play` | nav | `childview:channel:play` | implemented | R056/M006/S04 | `src/js/apps/pvr/channelList/channel_list_controller.js.coffee:29` | Channel rows expose Chorus2 play actions. |

## Family: childview-channel-record

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-channel-record:childview-channel-record` | nav | `childview:channel:record` | implemented | R056/M006/S04 | `src/js/apps/pvr/channelList/channel_list_controller.js.coffee:33` | Channel rows expose Chorus2 record actions. |

## Family: childview-filter-add

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-filter-add:childview-filter-add` | nav | `childview:filter:add` | implemented | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:79` | LibraryPage active filter empty state opens the filter selection pane. |

## Family: childview-filter-filterable-select

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-filter-filterable-select:childview-filter-filterable-select` | nav | `childview:filter:filterable:select` | implemented | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:53` | LibraryPage selects boolean filters immediately and opens option panes for other filters. |

## Family: childview-filter-option-remove

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-filter-option-remove:childview-filter-option-remove` | nav | `childview:filter:option:remove` | implemented | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:74` | LibraryPage active filter chips clear a stored filter key. |

## Family: childview-filter-option-select

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-filter-option-select:childview-filter-option-select` | nav | `childview:filter:option:select` | implemented | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:91` | LibraryPage option rows toggle stored option values without closing the pane. |

## Family: childview-filter-sortable-select

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-filter-sortable-select:childview-filter-sortable-select` | nav | `childview:filter:sortable:select` | implemented | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:42` | LibraryPage sort rows persist the next Chorus2 sort order. |

## Family: childview-recording-play

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-recording-play:childview-recording-play` | nav | `childview:recording:play` | implemented | R056/M006/S04 | `src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:29` | Recording rows expose Chorus2 play actions. |

## Family: command

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:command:command-audio-add` | action | `command:audio:add` | implemented | R054/M006/S04 | `src/js/apps/command/command_app.js.coffee:51` | Media parity backlog from Chorus2 source scan. |
| `action:command:command-audio-play` | action | `command:audio:play` | implemented | R054/M006/S04 | `src/js/apps/command/command_app.js.coffee:47` | Media parity backlog from Chorus2 source scan. |
| `action:command:command-kodi-audio-clean` | action | `command:kodi:audio:clean` | implemented | R054/M006/S04 | `src/js/apps/command/command_app.js.coffee:72` | Media parity backlog from Chorus2 source scan. |
| `action:command:command-kodi-controller` | action | `command:kodi:controller` | implemented | M006/S04 | `src/js/apps/command/command_app.js.coffee:26` | Command/action parity backlog from Chorus2 source scan. |
| `action:command:command-kodi-player` | action | `command:kodi:player` | implemented | M006/S04 | `src/js/apps/command/command_app.js.coffee:21` | Command/action parity backlog from Chorus2 source scan. |
| `action:command:command-kodi-video-clean` | action | `command:kodi:video:clean` | implemented | M006/S04 | `src/js/apps/command/command_app.js.coffee:76` | Command/action parity backlog from Chorus2 source scan. |
| `action:command:command-local-controller` | action | `command:local:controller` | implemented | M006/S04 | `src/js/apps/command/command_app.js.coffee:39` | Command/action parity backlog from Chorus2 source scan. |
| `action:command:command-local-player` | action | `command:local:player` | implemented | M006/S04 | `src/js/apps/command/command_app.js.coffee:34` | Command/action parity backlog from Chorus2 source scan. |
| `action:command:command-video-play` | action | `command:video:play` | implemented | M006/S04 | `src/js/apps/command/command_app.js.coffee:55` | Command/action parity backlog from Chorus2 source scan. |

## Family: config

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:config:config-app-get` | action | `config:app:get` | implemented | M006/S04 | `src/js/entities/config/configApp.js.coffee:34` | Command/action parity backlog from Chorus2 source scan. |
| `action:config:config-app-set` | action | `config:app:set` | implemented | M006/S04 | `src/js/entities/config/configApp.js.coffee:43` | Command/action parity backlog from Chorus2 source scan. |
| `action:config:config-static-get` | action | `config:static:get` | implemented | M006/S04 | `src/js/entities/config/configApp.js.coffee:54` | Command/action parity backlog from Chorus2 source scan. |
| `action:config:config-static-set` | action | `config:static:set` | implemented | M006/S04 | `src/js/entities/config/configApp.js.coffee:60` | Command/action parity backlog from Chorus2 source scan. |

## Family: desc

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:desc:desc` | nav | `desc` | implemented | M006/S02 | `src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:11` | Route/menu alias backlog from Chorus2 source scan. |

## Family: en

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:en:en` | nav | `en` | implemented | M006/S02 | `src/js/apps/help/help_app.js.coffee:23`<br>`src/js/apps/help/help_app.js.coffee:53` | Route/menu alias backlog from Chorus2 source scan. |

## Family: epg

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:epg:epg` | route | `epg` | implemented | R056/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: episode

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:episode:episode-action` | action | `episode:action` | implemented | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:105` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-action-items` | action | `episode:action:items` | implemented | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:111` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-action-watched` | action | `episode:action:watched` | implemented | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:142` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-build-collection` | action | `episode:build:collection` | implemented | R054/M006/S04 | `src/js/entities/kodi/episode.js.coffee:86` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-edit` | action | `episode:edit` | implemented | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:152` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-entities` | action | `episode:entities` | implemented | R054/M006/S04 | `src/js/entities/kodi/episode.js.coffee:74` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-entity` | action | `episode:entity` | implemented | R054/M006/S04 | `src/js/entities/kodi/episode.js.coffee:70` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-fields` | action | `episode:fields` | implemented | R054/M006/S04 | `src/js/entities/kodi/episode.js.coffee:90` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-list-view` | action | `episode:list:view` | implemented | R054/M006/S04 | `src/js/apps/tvshow/episode/episode_controller.js.coffee:101` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-tvshow-entities` | action | `episode:tvshow:entities` | implemented | R054/M006/S04 | `src/js/entities/kodi/episode.js.coffee:78` | Media parity backlog from Chorus2 source scan. |
| `route:episode:tvshow-tvshowid-season-episodeid` | route | `tvshow/:tvshowid/:season/:episodeid` | implemented | M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts` | Chorus2 episode route is promoted to the existing video episode route. |

## Family: execute

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:execute:addon-execute-id` | route | `addon/execute/:id` | implemented | M006/S04 | `src/js/apps/addon/addon_app.js.coffee:6` | Route/menu alias backlog from Chorus2 source scan. |

## Family: fanarttv

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:fanarttv:fanarttv-artist-image-entities` | action | `fanarttv:artist:image:entities` | implemented | R054/M006/S04 | `src/js/entities/external/fanarttv.js.coffee:75` | Media parity backlog from Chorus2 source scan. |

## Family: file

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:file:file-entities` | action | `file:entities` | implemented | M006/S04 | `src/js/entities/kodi/file.js.coffee:249` | Browser file and folder entries resolve to validated playable/downloadable file entities. |
| `action:file:file-entity` | action | `file:entity` | implemented | M006/S04 | `src/js/entities/kodi/file.js.coffee:240` | Browser store resolves current safe file entities by id. |
| `action:file:file-parsed-entities` | action | `file:parsed:entities` | implemented | M006/S04 | `src/js/entities/kodi/file.js.coffee:257` | Browser store parses Files.GetDirectory records into safe file snapshots. |
| `action:file:file-path-entities` | action | `file:path:entities` | implemented | M006/S04 | `src/js/entities/kodi/file.js.coffee:253` | Direct encoded path routes open Kodi file directories. |
| `action:file:file-source-entities` | action | `file:source:entities` | implemented | M006/S04 | `src/js/entities/kodi/file.js.coffee:261` | Browser store normalizes Files.GetSources plus enabled audio/video add-ons and playlist roots into media source snapshots. |
| `action:file:file-source-media-entities` | action | `file:source:media:entities` | implemented | M006/S04 | `src/js/entities/kodi/file.js.coffee:265` | Music and video file source stores load source-scoped directories, add-on roots, and playlist roots. |
| `action:file:file-source-mediatypes` | action | `file:source:mediatypes` | implemented | M006/S04 | `src/js/entities/kodi/file.js.coffee:269` | Music/video browser routes dispatch to distinct file source stores. |
| `action:file:file-url-entity` | action | `file:url:entity` | implemented | M006/S04 | `src/js/entities/kodi/file.js.coffee:244` | Browser file urls resolve through Files.PrepareDownload and sanitized local stream urls. |
| `nav:file:file` | nav | `file` | implemented | M006/S02 | `src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:31` | Route/menu alias backlog from Chorus2 source scan. |

## Family: files

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:files:get-directory` | jsonrpc | `Files.GetDirectory` | implemented | M006/S04 | `src/js/entities/kodi/file.js.coffee:194`<br>`src/lib/kodi/methods.ts`<br>`src/lib/stores/mediaFiles.svelte.ts` | Typed Kodi wrapper is wired through the Browser files page and playlist browsing. |
| `jsonrpc:files:get-file-details` | jsonrpc | `Files.GetFileDetails` | implemented | M006/S04 | `src/js/entities/kodi/file.js.coffee:184`<br>`src/lib/kodi/methods.ts` | Typed Kodi wrapper is available for browser file detail parity. |
| `jsonrpc:files:get-sources` | jsonrpc | `Files.GetSources` | implemented | M006/S04 | `src/js/entities/kodi/file.js.coffee:60`<br>`src/lib/kodi/methods.ts`<br>`src/lib/stores/mediaFiles.svelte.ts` | Typed Kodi wrapper is wired through the Browser files source list. |
| `jsonrpc:files:prepare-download` | jsonrpc | `Files.PrepareDownload` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |

## Family: filter

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:filter:filter-active` | action | `filter:active` | implemented | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:410` | LibraryFilterStore exposes active filter entities for the current route path. |
| `action:filter:filter-active-entities` | action | `filter:active:entities` | implemented | M006/S04 | `src/js/entities/filter/filter.js.coffee:69` | LibraryFilterStore models FilterActive entity rows with key, values, and title. |
| `action:filter:filter-apply-entities` | action | `filter:apply:entities` | implemented | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:414` | LibraryFilterStore applies stored sort and active filters to library collections. |
| `action:filter:filter-filterable-entities` | action | `filter:filterable:entities` | implemented | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:425` | LibraryFilterStore returns active-aware filterable fields constrained by route availability. |
| `action:filter:filter-filters-entities` | action | `filter:filters:entities` | implemented | M006/S04 | `src/js/entities/filter/filter.js.coffee:60` | LibraryFilterStore models Chorus2 filter field entity collections. |
| `action:filter:filter-filters-options-entities` | action | `filter:filters:options:entities` | implemented | M006/S04 | `src/js/entities/filter/filter.js.coffee:63` | LibraryFilterStore builds active option entities from collection values. |
| `action:filter:filter-init` | action | `filter:init` | implemented | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:429` | LibraryFilterStore initializes route sort and filter state from URL-style params. |
| `action:filter:filter-options` | action | `filter:options` | implemented | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:399` | LibraryFilterStore extracts and sorts filter option collections for the selected key. |
| `action:filter:filter-show` | action | `filter:show` | implemented | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:391` | LibraryPage renders the Chorus2 filter sidebar panes using the filter store. |
| `action:filter:filter-sort-entities` | action | `filter:sort:entities` | implemented | M006/S04 | `src/js/entities/filter/filter.js.coffee:66` | LibraryFilterStore models sortable entity rows with active state and toggled order. |
| `action:filter:filter-sort-store-get` | action | `filter:sort:store:get` | implemented | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:494` | LibraryFilterStore returns stored route sort with Chorus2 default fallback. |
| `action:filter:filter-sort-store-set` | action | `filter:sort:store:set` | implemented | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:490` | LibraryFilterStore persists route sort method/order in the Chorus2 namespace. |
| `action:filter:filter-sortable-entities` | action | `filter:sortable:entities` | implemented | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:421` | LibraryFilterStore returns route-available sortable fields. |
| `action:filter:filter-store-get` | action | `filter:store:get` | implemented | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:460` | LibraryFilterStore returns non-empty route filter state from the Chorus2 namespace. |
| `action:filter:filter-store-key-get` | action | `filter:store:key:get` | implemented | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:464` | LibraryFilterStore returns stored values for a single route filter key. |
| `action:filter:filter-store-key-toggle` | action | `filter:store:key:toggle` | implemented | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:473` | LibraryFilterStore toggles individual filter option values like Chorus2. |
| `action:filter:filter-store-key-update` | action | `filter:store:key:update` | implemented | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:468` | LibraryFilterStore replaces stored values for a single route filter key. |
| `action:filter:filter-store-set` | action | `filter:store:set` | implemented | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:455` | LibraryFilterStore stores route filters under the Chorus2 filter namespace. |

## Family: filter-layout-close-filters

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:filter-layout-close-filters:filter-layout-close-filters` | nav | `filter:layout:close:filters` | implemented | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:17` | LibraryPage filter pane title returns to the current filter/sort pane. |

## Family: filter-layout-close-options

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:filter-layout-close-options:filter-layout-close-options` | nav | `filter:layout:close:options` | implemented | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:19` | LibraryPage options pane title returns to filter selection. |

## Family: filter-layout-open-filters

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:filter-layout-open-filters:filter-layout-open-filters` | nav | `filter:layout:open:filters` | implemented | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:21` | LibraryPage Filters/Add filter controls slide open the filter selection pane. |

## Family: filter-layout-open-options

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:filter-layout-open-options:filter-layout-open-options` | nav | `filter:layout:open:options` | implemented | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:23` | LibraryPage non-boolean filter selection opens the options pane. |

## Family: filter-option-deselectall

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:filter-option-deselectall:filter-option-deselectall` | nav | `filter:option:deselectall` | implemented | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:97` | LibraryPage options pane clears the selected filter key via Deselect all. |

## Family: filter-remove-all

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:filter-remove-all:filter-remove-all` | nav | `filter:remove:all` | implemented | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:121` | LibraryPage active filter bar removes all stored filters for the route. |

## Family: filtered-page

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:filtered-page:music-genre-filter` | route | `music/genre/:filter` | implemented | R054/M006/S04 | `src/js/apps/landing/landing_app.js.coffee:9` | Media parity backlog from Chorus2 source scan. |

## Family: form

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:form:form-item-entities` | action | `form:item:entities` | implemented | M006/S04 | `src/js/entities/form/form.js.coffee:82` | Command/action parity backlog from Chorus2 source scan. |
| `action:form:form-popup-wrapper` | action | `form:popup:wrapper` | implemented | M006/S04 | `src/js/components/form/form_controller.js.coffee:50` | Command/action parity backlog from Chorus2 source scan. |
| `action:form:form-render-items` | action | `form:render:items` | implemented | M006/S04 | `src/js/components/form/form_controller.js.coffee:41` | Command/action parity backlog from Chorus2 source scan. |
| `action:form:form-value-entities` | action | `form:value:entities` | implemented | M006/S04 | `src/js/entities/form/form.js.coffee:86` | Command/action parity backlog from Chorus2 source scan. |
| `action:form:form-wrapper` | action | `form:wrapper` | implemented | M006/S04 | `src/js/components/form/form_controller.js.coffee:46` | Command/action parity backlog from Chorus2 source scan. |

## Family: general

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:general:general` | nav | `General` | implemented | M006/S02 | `src/js/apps/settings/settings_app.js.coffee:46` | Route/menu alias backlog from Chorus2 source scan. |

## Family: genre

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:genre:genre-entities` | action | `genre:entities` | implemented | R054/M006/S04 | `src/js/entities/kodi/genres.js.coffee:58` | Media parity backlog from Chorus2 source scan. |
| `action:genre:genre-entity` | action | `genre:entity` | implemented | R054/M006/S04 | `src/js/entities/kodi/genres.js.coffee:54` | Media parity backlog from Chorus2 source scan. |

## Family: gui

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:gui:window` | jsonrpc | `GUI.Window` | implemented | M006/S04 | `src/js/apps/command/kodi/helpers/gui.coffee:12` | Command/action parity backlog from Chorus2 source scan. |

## Family: help

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:help:help-page` | action | `help:page` | implemented | M006/S04 | `src/js/apps/help/help_app.js.coffee:52` | Command/action parity backlog from Chorus2 source scan. |
| `action:help:help-subnav` | action | `help:subnav` | implemented | M006/S04 | `src/js/apps/help/help_app.js.coffee:48` | Command/action parity backlog from Chorus2 source scan. |
| `nav:help:help` | nav | `help` | implemented | R057/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:help:help-addons` | nav | `help/addons` | implemented | M006/S02 | `src/js/apps/help/help_app.js.coffee:41` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:help:help-app-changelog` | nav | `help/app-changelog` | implemented | M006/S02 | `src/js/apps/help/help_app.js.coffee:39` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:help:help-app-readme` | nav | `help/app-readme` | implemented | M006/S02 | `src/js/apps/help/help_app.js.coffee:38` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:help:help-developers` | nav | `help/developers` | implemented | M006/S02 | `src/js/apps/help/help_app.js.coffee:42` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:help:help-keybind-readme` | nav | `help/keybind-readme` | implemented | M006/S02 | `src/js/apps/help/help_app.js.coffee:40` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:help:help-lang-readme` | nav | `help/lang-readme` | implemented | M006/S02 | `src/js/apps/help/help_app.js.coffee:43` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:help:help-license` | nav | `help/license` | implemented | M006/S02 | `src/js/apps/help/help_app.js.coffee:44` | Route/menu alias backlog from Chorus2 source scan. |
| `route:help:help` | route | `help` | implemented | R057/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: help-overview

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:help-overview:help` | route | `help` | implemented | M006/S02 | `src/js/apps/help/help_app.js.coffee:5` | Route/menu alias backlog from Chorus2 source scan. |
| `route:help-overview:help-overview` | route | `help/overview` | implemented | M006/S02 | `src/js/apps/help/help_app.js.coffee:6` | Route/menu alias backlog from Chorus2 source scan. |

## Family: help-page

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:help-page:help-id` | route | `help/:id` | implemented | M006/S02 | `src/js/apps/help/help_app.js.coffee:7` | Route/menu alias backlog from Chorus2 source scan. |

## Family: home-page

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:home-page:home` | route | `home` | implemented | M006/S02 | `src/js/apps/shell/shell_app.js.coffee:6` | Route/menu alias backlog from Chorus2 source scan. |
| `route:home-page:root` | route | `/` | implemented | M006/S02 | `src/js/apps/shell/shell_app.js.coffee:5` | Route/menu alias backlog from Chorus2 source scan. |

## Family: icon-browser

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:icon-browser:lab-icon-browser` | route | `lab/icon-browser` | implemented | M006/S04 | `src/js/apps/lab/lab_app.js.coffee:22` | Route/menu alias backlog from Chorus2 source scan. |

## Family: images

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:images:images-fanart-set` | action | `images:fanart:set` | implemented | R054/M006/S04 | `src/js/apps/images/images_app.js.coffee:59` | Media parity backlog from Chorus2 source scan. |
| `action:images:images-path-entity` | action | `images:path:entity` | implemented | M006/S04 | `src/js/apps/images/images_app.js.coffee:68` | Command/action parity backlog from Chorus2 source scan. |
| `action:images:images-path-get` | action | `images:path:get` | implemented | M006/S04 | `src/js/apps/images/images_app.js.coffee:63` | Command/action parity backlog from Chorus2 source scan. |

## Family: input

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:input:input-action` | action | `input:action` | implemented | M006/S03 | `src/js/apps/input/input_app.js.coffee:144` | Remote/Input parity backlog from Chorus2 source scan. |
| `action:input:input-remote-toggle` | action | `input:remote:toggle` | implemented | M006/S03 | `src/js/apps/input/input_app.js.coffee:141` | Remote/Input parity backlog from Chorus2 source scan. |
| `action:input:input-resume` | action | `input:resume` | implemented | M006/S03 | `src/js/apps/input/input_app.js.coffee:147` | Remote/Input parity backlog from Chorus2 source scan. |
| `action:input:input-send` | action | `input:send` | implemented | M006/S03 | `src/js/apps/input/input_app.js.coffee:138` | Remote/Input parity backlog from Chorus2 source scan. |
| `action:input:input-textbox` | action | `input:textbox` | implemented | M006/S03 | `src/js/apps/input/input_app.js.coffee:130` | Remote/Input parity backlog from Chorus2 source scan. |
| `action:input:input-textbox-close` | action | `input:textbox:close` | implemented | M006/S03 | `src/js/apps/input/input_app.js.coffee:135` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:action` | jsonrpc | `Input.Action` | implemented | M006/S03 | `src/js/apps/input/input_app.js.coffee:24` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:all` | jsonrpc | `Input.all` | implemented | M006/S03 | `src/js/apps/command/kodi/helpers/input.js.coffee:7` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:back` | jsonrpc | `Input.Back` | implemented | M006/S03 | `src/lib/kodi/methods.test.ts`<br>`src/lib/kodi/methods.ts`<br>`src/lib/stores/remoteInputDispatch.svelte.ts`<br>`src/lib/stores/remoteInputDispatch.test.ts` |  |
| `jsonrpc:input:context-menu` | jsonrpc | `Input.ContextMenu` | implemented | M006/S03 | `src/lib/kodi/methods.test.ts`<br>`src/lib/kodi/methods.ts`<br>`src/lib/stores/remoteInputDispatch.svelte.ts`<br>`src/lib/stores/remoteInputDispatch.test.ts` |  |
| `jsonrpc:input:down` | jsonrpc | `Input.Down` | implemented | M006/S03 | `src/lib/kodi/methods.test.ts`<br>`src/lib/kodi/methods.ts`<br>`src/lib/stores/remoteInputDispatch.svelte.ts`<br>`src/lib/stores/remoteInputDispatch.test.ts` |  |
| `jsonrpc:input:execute-action` | jsonrpc | `Input.ExecuteAction` | implemented | M006/S03 | `src/lib/kodi/methods.test.ts`<br>`src/lib/kodi/methods.ts`<br>`src/lib/stores/remoteInputDispatch.svelte.ts`<br>`src/lib/stores/remoteInputDispatch.test.ts` |  |
| `jsonrpc:input:google` | jsonrpc | `Input.google` | implemented | M006/S03 | `src/js/apps/command/kodi/helpers/input.js.coffee:7` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:home` | jsonrpc | `Input.Home` | implemented | M006/S03 | `src/lib/kodi/methods.test.ts`<br>`src/lib/kodi/methods.ts`<br>`src/lib/stores/remoteInputDispatch.svelte.ts`<br>`src/lib/stores/remoteInputDispatch.test.ts` |  |
| `jsonrpc:input:imdb` | jsonrpc | `Input.imdb` | implemented | M006/S03 | `src/js/apps/command/kodi/helpers/input.js.coffee:7` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:info` | jsonrpc | `Input.Info` | implemented | M006/S03 | `src/lib/kodi/methods.test.ts`<br>`src/lib/kodi/methods.ts`<br>`src/lib/stores/remoteInputDispatch.svelte.ts`<br>`src/lib/stores/remoteInputDispatch.test.ts` |  |
| `jsonrpc:input:left` | jsonrpc | `Input.Left` | implemented | M006/S03 | `src/lib/kodi/methods.test.ts`<br>`src/lib/kodi/methods.ts`<br>`src/lib/stores/remoteInputDispatch.svelte.ts`<br>`src/lib/stores/remoteInputDispatch.test.ts` |  |
| `jsonrpc:input:on-input-finished` | jsonrpc | `Input.OnInputFinished` | implemented | M006/S03 | `src/js/apps/state/kodi/notifications.js.coffee:215` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:on-input-requested` | jsonrpc | `Input.OnInputRequested` | implemented | M006/S03 | `src/js/apps/state/kodi/notifications.js.coffee:197` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:right` | jsonrpc | `Input.Right` | implemented | M006/S03 | `src/lib/kodi/methods.test.ts`<br>`src/lib/kodi/methods.ts`<br>`src/lib/stores/remoteInputDispatch.svelte.ts`<br>`src/lib/stores/remoteInputDispatch.test.ts` |  |
| `jsonrpc:input:select` | jsonrpc | `Input.Select` | implemented | M006/S03 | `src/lib/kodi/methods.test.ts`<br>`src/lib/kodi/methods.ts`<br>`src/lib/stores/remoteInputDispatch.svelte.ts`<br>`src/lib/stores/remoteInputDispatch.test.ts` |  |
| `jsonrpc:input:send-text` | jsonrpc | `Input.SendText` | implemented | M006/S03 | `src/lib/kodi/methods.test.ts`<br>`src/lib/kodi/methods.ts`<br>`src/lib/stores/remoteInputDispatch.svelte.ts`<br>`src/lib/stores/remoteInputDispatch.test.ts` |  |
| `jsonrpc:input:soundcloud` | jsonrpc | `Input.soundcloud` | implemented | M006/S03 | `src/js/apps/command/kodi/helpers/input.js.coffee:7` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:stop` | jsonrpc | `Input.Stop` | implemented | M006/S03 | `src/js/apps/command/kodi/helpers/input.js.coffee:7` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:tmdb` | jsonrpc | `Input.tmdb` | implemented | M006/S03 | `src/js/apps/command/kodi/helpers/input.js.coffee:7` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:tvdb` | jsonrpc | `Input.tvdb` | implemented | M006/S03 | `src/js/apps/command/kodi/helpers/input.js.coffee:7` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:up` | jsonrpc | `Input.Up` | implemented | M006/S03 | `src/lib/kodi/methods.test.ts`<br>`src/lib/kodi/methods.ts`<br>`src/lib/stores/remoteInputDispatch.svelte.ts`<br>`src/lib/stores/remoteInputDispatch.test.ts` |  |
| `route:input:remote` | route | `remote` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts`<br>`src/lib/components/RemoteInputPanel.svelte` | Remote/Input route renders the bounded remote panel and is package-base aware. |

## Family: introspect

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:introspect:introspect-dictionary` | action | `introspect:dictionary` | implemented | M006/S04 | `src/js/entities/lab/apiBrowser.js.coffee:89` | Command/action parity backlog from Chorus2 source scan. |
| `action:introspect:introspect-entities` | action | `introspect:entities` | implemented | M006/S04 | `src/js/entities/lab/apiBrowser.js.coffee:85` | Command/action parity backlog from Chorus2 source scan. |
| `action:introspect:introspect-entity` | action | `introspect:entity` | implemented | M006/S04 | `src/js/entities/lab/apiBrowser.js.coffee:81` | Command/action parity backlog from Chorus2 source scan. |

## Family: jsonrpc

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:jsonrpc:get-active-players` | jsonrpc | `JSONRPC.GetActivePlayers` | implemented | M006/S04 | `src/js/apps/command/kodi/_base/api.js.coffee:103`<br>`src/js/apps/command/kodi/_base/api.js.coffee:37`<br>`src/js/apps/command/kodi/_base/api.js.coffee:71` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:jsonrpc:get-item` | jsonrpc | `JSONRPC.GetItem` | implemented | M006/S04 | `src/js/apps/command/kodi/_base/api.js.coffee:110`<br>`src/js/apps/command/kodi/_base/api.js.coffee:37` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:jsonrpc:get-properties` | jsonrpc | `JSONRPC.GetProperties` | implemented | M006/S04 | `src/js/apps/command/kodi/_base/api.js.coffee:109`<br>`src/js/apps/command/kodi/_base/api.js.coffee:37` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:jsonrpc:introspect` | jsonrpc | `JSONRPC.Introspect` | implemented | M006/S04 | `src/js/entities/lab/apiBrowser.js.coffee:66` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:jsonrpc:ping` | jsonrpc | `JSONRPC.Ping` | implemented | M006/S04 | `src/js/helpers/connection.js.coffee:28` | Command/action parity backlog from Chorus2 source scan. |

## Family: kodi

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:kodi:settings-kodi` | route | `settings/kodi` | implemented | M006/S01 | `src/js/apps/settings/settings_app.js.coffee:6` | Route/menu alias backlog from Chorus2 source scan. |
| `route:kodi:settings-kodi-section` | route | `settings/kodi/:section` | implemented | M006/S01 | `src/js/apps/settings/settings_app.js.coffee:7` | Route/menu alias backlog from Chorus2 source scan. |

## Family: lab

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:lab:lab-api-browser` | route | `lab/api-browser` | implemented | M006/S01 | `src/lib/app/appRouter.ts` |  |
| `route:lab:lab-edge` | route | `lab/*` | implemented | R057/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:lab:lab-shortcuts` | route | `lab/shortcuts` | implemented | M006/S01 | `src/lib/app/appRouter.ts` |  |

## Family: lab-landing

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:lab-landing:lab` | route | `lab` | implemented | M006/S04 | `src/js/apps/lab/lab_app.js.coffee:18` | Route/menu alias backlog from Chorus2 source scan. |

## Family: landing

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:landing:landing` | route | `landing` | implemented | M006/S01 | `src/lib/app/appRouter.ts` |  |

## Family: landing-page

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:landing-page:movies-recent` | route | `movies/recent` | implemented | M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts` | Chorus2 recent movies landing alias is promoted to the existing video movies route. |
| `route:landing-page:music` | route | `music` | implemented | R054/M006/S04 | `src/js/apps/landing/landing_app.js.coffee:5` | Media parity backlog from Chorus2 source scan. |
| `route:landing-page:music-top` | route | `music/top` | implemented | R054/M006/S04 | `src/js/apps/landing/landing_app.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `route:landing-page:tvshows-recent` | route | `tvshows/recent` | implemented | M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts` | Chorus2 recent TV landing alias is promoted to the existing video TV route. |

## Family: landing-set-more

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:landing-set-more:landing-set-more` | nav | `landing:set:more` | implemented | M006/S02 | `src/js/apps/landing/show/landing_controller.js.coffee:60` | Route/menu alias backlog from Chorus2 source scan. |

## Family: library

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:library:library-write-commands` | action | `library write commands` | implemented | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: list

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:list:addons-type` | route | `addons/:type` | implemented | M006/S02 | `src/js/apps/addon/addon_app.js.coffee:5` | Route/menu alias backlog from Chorus2 source scan. |
| `route:list:browser` | route | `browser` | implemented | M006/S02 | `src/js/apps/browser/browser_app.js.coffee:5` | Route/menu alias backlog from Chorus2 source scan. |
| `route:list:movies` | route | `movies` | implemented | M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts` | Chorus2 movie list route is promoted to the existing video movies route. |
| `route:list:music-albums` | route | `music/albums` | implemented | R054/M006/S04 | `src/js/apps/album/album_app.js.coffee:5` | Media parity backlog from Chorus2 source scan. |
| `route:list:music-artists` | route | `music/artists` | implemented | R054/M006/S04 | `src/js/apps/artist/artist_app.js.coffee:5` | Media parity backlog from Chorus2 source scan. |
| `route:list:music-videos` | route | `music/videos` | implemented | R054/M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts`<br>`src/main.test.ts` | Media parity backlog from Chorus2 source scan. |
| `route:list:playlist` | route | `playlist` | implemented | R055/M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts`<br>`src/main.test.ts` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `route:list:playlist-id` | route | `playlist/:id` | implemented | R055/M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts`<br>`src/main.test.ts` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `route:list:playlists` | route | `playlists` | implemented | R055/M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts`<br>`src/main.test.ts` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `route:list:search-media-query` | route | `search/:media/:query` | implemented | R057/M006/S04 | `src/js/apps/search/search_app.js.coffee:6` | Route/menu alias backlog from Chorus2 source scan. |
| `route:list:thumbsup` | route | `thumbsup` | implemented | R055/M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts`<br>`src/main.test.ts` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `route:list:tvshows` | route | `tvshows` | implemented | M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts` | Chorus2 TV list route is promoted to the existing video TV route. |

## Family: loading

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:loading:loading-get-view` | action | `loading:get:view` | implemented | M006/S04 | `src/js/apps/loading/loading_app.js.coffee:20` | Command/action parity backlog from Chorus2 source scan. |
| `action:loading:loading-show-page` | action | `loading:show:page` | implemented | M006/S04 | `src/js/apps/loading/loading_app.js.coffee:16` | Command/action parity backlog from Chorus2 source scan. |
| `action:loading:loading-show-view` | action | `loading:show:view` | implemented | M006/S04 | `src/js/apps/loading/loading_app.js.coffee:11` | Command/action parity backlog from Chorus2 source scan. |

## Family: local

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:local:settings-web` | route | `settings/web` | implemented | M006/S01 | `src/js/apps/settings/settings_app.js.coffee:5` | Route/menu alias backlog from Chorus2 source scan. |

## Family: local-playlist

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:local-playlist:localplaylist` | route | `localPlaylist` | implemented | R055/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: localplayer

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:localplayer:localplayer-clear-entities` | action | `localplayer:clear:entities` | implemented | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:206` | Recording collections are loaded and rendered on the PVR recordings route. |
| `action:localplayer:localplayer-get-entities` | action | `localplayer:get:entities` | implemented | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:202` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplayer:localplayer-item-add-entities` | action | `localplayer:item:add:entities` | implemented | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:210` | Playlist/local-player parity backlog from Chorus2 source scan. |

## Family: localplaylist

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:localplaylist:localplaylist-add-entity` | action | `localplaylist:add:entity` | implemented | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:124` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-addentity` | action | `localplaylist:addentity` | implemented | R055/M006/S04 | `src/js/apps/localPlaylist/localPlaylist_app.js.coffee:101` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-clear-entities` | action | `localplaylist:clear:entities` | implemented | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:138` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-entities` | action | `localplaylist:entities` | implemented | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:134` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-entity` | action | `localplaylist:entity` | implemented | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:142` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-item-add-entities` | action | `localplaylist:item:add:entities` | implemented | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:151` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-item-entities` | action | `localplaylist:item:entities` | implemented | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:147` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-item-updateorder` | action | `localplaylist:item:updateorder` | implemented | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:156` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-newlist` | action | `localplaylist:newlist` | implemented | R055/M006/S04 | `src/js/apps/localPlaylist/localPlaylist_app.js.coffee:104` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-reload` | action | `localplaylist:reload` | implemented | R055/M006/S04 | `src/js/apps/localPlaylist/localPlaylist_app.js.coffee:107` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-remove-entity` | action | `localplaylist:remove:entity` | implemented | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:128` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-rename` | action | `localplaylist:rename` | implemented | R055/M006/S04 | `src/js/apps/localPlaylist/localPlaylist_app.js.coffee:110` | Playlist/local-player parity backlog from Chorus2 source scan. |

## Family: movie

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:movie:movie-action` | action | `movie:action` | implemented | R054/M006/S04 | `src/js/apps/movie/movie_app.js.coffee:47` | Media parity backlog from Chorus2 source scan. |
| `action:movie:movie-action-items` | action | `movie:action:items` | implemented | R054/M006/S04 | `src/js/apps/movie/movie_app.js.coffee:41` | Media parity backlog from Chorus2 source scan. |
| `action:movie:movie-action-watched` | action | `movie:action:watched` | implemented | R054/M006/S04 | `src/js/apps/movie/movie_app.js.coffee:50` | Media parity backlog from Chorus2 source scan. |
| `action:movie:movie-build-collection` | action | `movie:build:collection` | implemented | R054/M006/S04 | `src/js/entities/kodi/movie.js.coffee:72` | Media parity backlog from Chorus2 source scan. |
| `action:movie:movie-edit` | action | `movie:edit` | implemented | R054/M006/S04 | `src/js/apps/movie/movie_app.js.coffee:58` | Media parity backlog from Chorus2 source scan. |
| `action:movie:movie-entities` | action | `movie:entities` | implemented | R054/M006/S04 | `src/js/entities/kodi/movie.js.coffee:68` | Media parity backlog from Chorus2 source scan. |
| `action:movie:movie-entity` | action | `movie:entity` | implemented | R054/M006/S04 | `src/js/entities/kodi/movie.js.coffee:64` | Media parity backlog from Chorus2 source scan. |
| `action:movie:movie-fields` | action | `movie:fields` | implemented | R054/M006/S04 | `src/js/entities/kodi/movie.js.coffee:76` | Media parity backlog from Chorus2 source scan. |
| `action:movie:movie-list-view` | action | `movie:list:view` | implemented | R054/M006/S04 | `src/js/apps/movie/list/list_controller.js.coffee:77` | Media parity backlog from Chorus2 source scan. |
| `nav:movie:movies` | nav | `movies` | implemented | M006/S04 | `src/lib/app-pages/AppPageSurface.svelte`<br>`src/lib/app-shell/appNavigation.ts`<br>`src/lib/app/primaryRoutes.ts` |  |
| `nav:movie:movies-recent` | nav | `movies/recent` | implemented | M006/S04 | `src/lib/app-pages/AppPageSurface.svelte`<br>`src/lib/app-shell/appNavigation.ts`<br>`src/lib/app/primaryRoutes.ts` |  |
| `route:movie:movies` | route | `movies` | implemented | M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts` | Chorus2 movies alias is promoted to the existing video movies route. |
| `route:movie:video-movies` | route | `video/movies` | implemented | M006/S01 | `src/lib/video/videoRouter.ts` |  |

## Family: movies

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:movies:movies` | nav | `movies` | implemented | M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts` | Chorus2 movies nav alias is promoted to the existing video movies route. |
| `nav:movies:movies-recent` | nav | `movies/recent` | implemented | M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts` | Chorus2 recent movies nav alias is promoted to the existing video movies route. |

## Family: music

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:music:music` | nav | `music` | implemented | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:music:music-albums` | nav | `music/albums` | implemented | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:music:music-artists` | nav | `music/artists` | implemented | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:music:music-genres` | nav | `music/genres` | implemented | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:music:music-top` | nav | `music/top` | implemented | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:music:music-videos` | nav | `music/videos` | implemented | R054/M006/S04 | `src/js/entities/nav/navMain.js.coffee:24` | Media parity backlog from Chorus2 source scan. |

## Family: music-genres

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:music-genres:music-genres` | route | `music/genres` | implemented | R054/M006/S04 | `src/js/apps/category/category_app.js.coffee:7` | Media parity backlog from Chorus2 source scan. |

## Family: musicbrainz

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:musicbrainz:musicbrainz-artist-entity` | action | `musicbrainz:artist:entity` | implemented | R054/M006/S04 | `src/js/entities/external/musicbrainz.js.coffee:38` | Media parity backlog from Chorus2 source scan. |

## Family: musicvideo

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:musicvideo:musicvideo-action` | action | `musicvideo:action` | implemented | R054/M006/S04 | `src/js/apps/musicvideo/musicvideo_app.js.coffee:42` | Media parity backlog from Chorus2 source scan. |
| `action:musicvideo:musicvideo-action-items` | action | `musicvideo:action:items` | implemented | R054/M006/S04 | `src/js/apps/musicvideo/musicvideo_app.js.coffee:45` | Media parity backlog from Chorus2 source scan. |
| `action:musicvideo:musicvideo-build-collection` | action | `musicvideo:build:collection` | implemented | R054/M006/S04 | `src/js/entities/kodi/musicvideo.js.coffee:74` | Media parity backlog from Chorus2 source scan. |
| `action:musicvideo:musicvideo-edit` | action | `musicvideo:edit` | implemented | R054/M006/S04 | `src/js/apps/musicvideo/musicvideo_app.js.coffee:58` | Media parity backlog from Chorus2 source scan. |
| `action:musicvideo:musicvideo-entities` | action | `musicvideo:entities` | implemented | R054/M006/S04 | `src/js/entities/kodi/musicvideo.js.coffee:66` | Media parity backlog from Chorus2 source scan. |
| `action:musicvideo:musicvideo-entity` | action | `musicvideo:entity` | implemented | R054/M006/S04 | `src/js/entities/kodi/musicvideo.js.coffee:62` | Media parity backlog from Chorus2 source scan. |
| `action:musicvideo:musicvideo-fields` | action | `musicvideo:fields` | implemented | R054/M006/S04 | `src/js/entities/kodi/musicvideo.js.coffee:70` | Media parity backlog from Chorus2 source scan. |
| `action:musicvideo:musicvideo-list-view` | action | `musicvideo:list:view` | implemented | R054/M006/S04 | `src/js/apps/musicvideo/list/list_controller.js.coffee:76` | Media parity backlog from Chorus2 source scan. |
| `nav:musicvideo:music-videos` | nav | `music/videos` | implemented | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:musicvideo:music-videos` | route | `music/videos` | implemented | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: nav-main

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:nav-main:nav-main-array-entities` | action | `navMain:array:entities` | implemented | M006/S04 | `src/js/entities/nav/navMain.js.coffee:179` | Command/action parity backlog from Chorus2 source scan. |
| `action:nav-main:nav-main-children-show` | action | `navMain:children:show` | implemented | M006/S04 | `src/js/apps/navMain/navMain_app.js.coffee:29` | Command/action parity backlog from Chorus2 source scan. |
| `action:nav-main:nav-main-collection-show` | action | `navMain:collection:show` | implemented | M006/S04 | `src/js/apps/navMain/navMain_app.js.coffee:32` | Command/action parity backlog from Chorus2 source scan. |
| `action:nav-main:nav-main-entities` | action | `navMain:entities` | implemented | M006/S04 | `src/js/entities/nav/navMain.js.coffee:171` | Command/action parity backlog from Chorus2 source scan. |
| `action:nav-main:nav-main-update-defaults` | action | `navMain:update:defaults` | implemented | M006/S04 | `src/js/entities/nav/navMain.js.coffee:190` | Command/action parity backlog from Chorus2 source scan. |
| `action:nav-main:nav-main-update-entities` | action | `navMain:update:entities` | implemented | M006/S04 | `src/js/entities/nav/navMain.js.coffee:186` | Command/action parity backlog from Chorus2 source scan. |
| `route:nav-main:settings-nav` | route | `settings/nav` | implemented | M006/S01 | `src/js/apps/settings/settings_app.js.coffee:9` | Route/menu alias backlog from Chorus2 source scan. |

## Family: notification

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:notification:notification-show` | action | `notification:show` | implemented | M006/S04 | `src/js/apps/notifications/notifications_app.js.coffee:7` | Command/action parity backlog from Chorus2 source scan. |

## Family: play

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:play:play` | nav | `play` | implemented | M006/S02 | `src/js/apps/epg/list/list_controller.js.coffee:15`<br>`src/js/apps/epg/list/list_controller.js.coffee:7` | Route/menu alias backlog from Chorus2 source scan. |

## Family: play-list

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:play-list:play-list` | nav | `PlayList` | implemented | R055/M006/S04 | `src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:33` | Playlist/local-player parity backlog from Chorus2 source scan. |

## Family: player

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:player:playback-commands` | action | `playback commands` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `action:player:player-kodi-progress-update` | action | `player:kodi:progress:update` | implemented | M006/S04 | `src/js/apps/player/player_app.js.coffee:176` | Command/action parity backlog from Chorus2 source scan. |
| `action:player:player-kodi-timer` | action | `player:kodi:timer` | implemented | R056/M006/S04 | `src/js/apps/player/player_app.js.coffee:163`<br>`src/js/apps/state/kodi/kodi.js.coffee:30`<br>`src/js/apps/state/kodi/kodi.js.coffee:59` | Recording rows resolve file playback through the shared file player dispatch. |
| `action:player:player-local-progress-update` | action | `player:local:progress:update` | implemented | M006/S04 | `src/js/apps/player/player_app.js.coffee:172` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:player:get-active-players` | jsonrpc | `Player.GetActivePlayers` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:player:get-item` | jsonrpc | `Player.GetItem` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:player:get-properties` | jsonrpc | `Player.GetProperties` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:player:go-to` | jsonrpc | `Player.GoTo` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:player:on-pause` | jsonrpc | `Player.OnPause` | implemented | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:129` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:player:on-play` | jsonrpc | `Player.OnPlay` | implemented | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:105` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:player:on-property-changed` | jsonrpc | `Player.OnPropertyChanged` | implemented | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:125` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:player:on-resume` | jsonrpc | `Player.OnResume` | implemented | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:112` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:player:on-seek` | jsonrpc | `Player.OnSeek` | implemented | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:136` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:player:on-stop` | jsonrpc | `Player.OnStop` | implemented | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:119` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:player:play-pause` | jsonrpc | `Player.PlayPause` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:player:seek` | jsonrpc | `Player.Seek` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:player:set-repeat` | jsonrpc | `Player.SetRepeat` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:player:set-shuffle` | jsonrpc | `Player.SetShuffle` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:player:stop` | jsonrpc | `Player.Stop` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `nav:player:player` | nav | `Player` | implemented | M006/S02 | `src/js/apps/pvr/channelList/channel_list_controller.js.coffee:30` | Route/menu alias backlog from Chorus2 source scan. |

## Family: playlist

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:playlist:playlist-commands` | action | `playlist commands` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `action:playlist:playlist-export` | action | `playlist:export` | implemented | M006/S04 | `src/App.svelte:995`<br>`src/js/apps/playlist/playlist_app.js.coffee:35`<br>`src/lib/app-pages/PlaylistsPage.svelte:142` | Local playlists export as m3u downloads. |
| `action:playlist:playlist-kodi-entities` | action | `playlist:kodi:entities` | implemented | R055/M006/S04 | `src/js/entities/kodi/playlist.js.coffee:92` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:playlist:playlist-kodi-entity-api` | action | `playlist:kodi:entity:api` | implemented | R055/M006/S04 | `src/js/entities/kodi/playlist.js.coffee:102` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:playlist:playlist-list` | action | `playlist:list` | implemented | R055/M006/S04 | `src/js/apps/playlist/playlist_app.js.coffee:31` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:playlist:playlist-local-partymode` | action | `playlist:local:partymode` | implemented | R055/M006/S04 | `src/js/apps/playlist/localParty/local_party.js.coffee:60` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:playlist:playlist-refresh` | action | `playlist:refresh` | implemented | R055/M006/S04 | `src/js/apps/playlist/playlist_app.js.coffee:49` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `jsonrpc:playlist:clear` | jsonrpc | `Playlist.Clear` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:playlist:get-items` | jsonrpc | `Playlist.GetItems` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:playlist:insert` | jsonrpc | `Playlist.Insert` | implemented | M006/S04 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:playlist:on-add` | jsonrpc | `Playlist.OnAdd` | implemented | R055/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:142` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `jsonrpc:playlist:on-clear` | jsonrpc | `Playlist.OnClear` | implemented | R055/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:142` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `jsonrpc:playlist:on-remove` | jsonrpc | `Playlist.OnRemove` | implemented | R055/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:142` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `jsonrpc:playlist:remove` | jsonrpc | `Playlist.Remove` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `nav:playlist:playlists` | nav | `playlists` | implemented | R055/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:playlist:playlists` | route | `playlists` | implemented | R055/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: playlists

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:playlists:playlists` | nav | `playlists` | implemented | R055/M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts`<br>`src/main.test.ts` | Playlist/local-player parity backlog from Chorus2 source scan. |

## Family: pvr

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:pvr:pvr-commands` | action | `PVR commands` | implemented | R056/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:pvr:add-timer` | jsonrpc | `PVR.AddTimer` | implemented | R056/M006/S04 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:pvr:channel-list` | jsonrpc | `PVR.ChannelList` | implemented | R056/M006/S04 | `src/js/apps/pvr/channelList/channel_list_controller.js.coffee:1`<br>`src/js/apps/pvr/channelList/channel_list_view.js.coffee:1` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:channel-list-controller` | jsonrpc | `PVR.ChannelList.Controller` | implemented | R056/M006/S04 | `src/js/apps/pvr/pvr_app.js.coffee:12`<br>`src/js/apps/pvr/pvr_app.js.coffee:16` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:delete-timer` | jsonrpc | `PVR.DeleteTimer` | implemented | R056/M006/S04 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:pvr:get-broadcasts` | jsonrpc | `PVR.GetBroadcasts` | implemented | R056/M006/S04 | `src/js/entities/kodi/epg.js.coffee:38`<br>`src/js/entities/kodi/epg.js.coffee:48` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:get-channel-details` | jsonrpc | `PVR.GetChannelDetails` | implemented | R056/M006/S04 | `src/js/entities/kodi/pvr.js.coffee:59` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:get-channels` | jsonrpc | `PVR.GetChannels` | implemented | R056/M006/S04 | `src/js/entities/kodi/pvr.js.coffee:69` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:get-recording-details` | jsonrpc | `PVR.GetRecordingDetails` | implemented | R056/M006/S04 | `src/js/entities/kodi/pvr.js.coffee:82` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:get-recordings` | jsonrpc | `PVR.GetRecordings` | implemented | R056/M006/S04 | `src/js/entities/kodi/pvr.js.coffee:91` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:record` | jsonrpc | `PVR.Record` | implemented | R056/M006/S04 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:pvr:recording-list` | jsonrpc | `PVR.RecordingList` | implemented | R056/M006/S04 | `src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:1`<br>`src/js/apps/pvr/recordingList/recording_list_view.js.coffee:1` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:recording-list-controller` | jsonrpc | `PVR.RecordingList.Controller` | implemented | R056/M006/S04 | `src/js/apps/pvr/pvr_app.js.coffee:20` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:router` | jsonrpc | `PVR.Router` | implemented | R056/M006/S04 | `src/js/apps/pvr/pvr_app.js.coffee:24`<br>`src/js/apps/pvr/pvr_app.js.coffee:3` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:toggle-timer` | jsonrpc | `PVR.ToggleTimer` | implemented | R056/M006/S04 | `src/lib/kodi/methods.ts` |  |
| `nav:pvr:pvr` | nav | `PVR` | implemented | R056/M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts`<br>`src/main.test.ts` | PVR main navigation routes to the Chorus2-style TV channel surface. |
| `nav:pvr:pvr-radio` | nav | `pvr/radio` | implemented | R056/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:pvr:pvr-recordings` | nav | `pvr/recordings` | implemented | R056/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:pvr:pvr-tv` | nav | `pvr/tv` | implemented | R056/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:pvr:pvr` | route | `pvr` | implemented | R056/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: radio

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:radio:pvr-radio` | route | `pvr/radio` | implemented | R056/M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts`<br>`src/main.test.ts` | PVR parity backlog from Chorus2 source scan. |
| `route:radio:pvr-radio-channelid` | route | `pvr/radio/:channelid` | implemented | R056/M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts`<br>`src/main.test.ts` | PVR parity backlog from Chorus2 source scan. |

## Family: record

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:record:record` | nav | `record` | implemented | R056/M006/S04 | `src/js/apps/epg/list/list_controller.js.coffee:17`<br>`src/js/apps/epg/list/list_controller.js.coffee:9` | PVR channel and broadcast record actions are exposed. |

## Family: recording

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:recording:recording-entities` | action | `recording:entities` | implemented | R056/M006/S04 | `src/js/entities/kodi/pvr.js.coffee:117`<br>`src/lib/stores/pvr.svelte.ts` | PVR store loads and sorts recording collections for the recordings route. |
| `action:recording:recording-entity` | action | `recording:entity` | implemented | R056/M006/S04 | `src/js/entities/kodi/pvr.js.coffee:113`<br>`src/lib/stores/pvr.svelte.ts` | PVR store exposes cached recording entities and can refresh a single recording detail. |

## Family: recordings

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:recordings:pvr-recordings` | route | `pvr/recordings` | implemented | R056/M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts`<br>`src/main.test.ts` | PVR parity backlog from Chorus2 source scan. |

## Family: remote

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:remote:input-remote-controls` | action | `input remote controls` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/stores/remoteInputDispatch.svelte.ts` | Remote/Input controls dispatch through the bounded command snapshot store. |
| `control:remote:all` | control | `all` | implemented | M006/S03 | `src/js/helpers/entities.js.coffee:74` | Remote/Input parity backlog from Chorus2 source scan. |
| `control:remote:back` | control | `back` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/components/RemoteInputPanel.test.ts` | Bounded Remote/Input command rendered and tested on the real remote panel. |
| `control:remote:context-menu` | control | `ContextMenu` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/components/RemoteInputPanel.test.ts` | Bounded Remote/Input context menu command rendered and tested on the real remote panel. |
| `control:remote:contextmenu` | control | `contextmenu` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/components/RemoteInputPanel.test.ts` | Bounded Remote/Input command rendered and tested on the real remote panel. |
| `control:remote:down` | control | `down` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/components/RemoteInputPanel.test.ts` | Bounded Remote/Input command rendered and tested on the real remote panel. |
| `control:remote:executeaction` | control | `executeaction` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/components/RemoteInputPanel.test.ts` | Bounded Remote/Input command rendered and tested on the real remote panel. |
| `control:remote:google` | control | `google` | implemented | M006/S03 | `src/js/apps/album/show/tpl/details_meta.jst.eco:47`<br>`src/js/apps/artist/show/tpl/details_meta.jst.eco:51`<br>`src/js/apps/movie/show/tpl/details_meta.jst.eco:77`<br>`src/js/apps/musicvideo/show/tpl/details_meta.jst.eco:50`<br>`src/js/apps/tvshow/episode/tpl/details_meta.jst.eco:83`<br>`src/js/apps/tvshow/show/tpl/details_meta.jst.eco:45` | Remote/Input parity backlog from Chorus2 source scan. |
| `control:remote:home` | control | `home` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/components/RemoteInputPanel.test.ts` | Bounded Remote/Input command rendered and tested on the real remote panel. |
| `control:remote:imdb` | control | `imdb` | implemented | M006/S03 | `src/js/apps/movie/show/tpl/details_meta.jst.eco:78`<br>`src/js/apps/tvshow/episode/tpl/details_meta.jst.eco:84`<br>`src/js/apps/tvshow/show/tpl/details_meta.jst.eco:46` | Remote/Input parity backlog from Chorus2 source scan. |
| `control:remote:info` | control | `info` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/components/RemoteInputPanel.test.ts` | Bounded Remote/Input command rendered and tested on the real remote panel. |
| `control:remote:left` | control | `left` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/components/RemoteInputPanel.test.ts` | Bounded Remote/Input command rendered and tested on the real remote panel. |
| `control:remote:osd` | control | `osd` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/components/RemoteInputPanel.test.ts` | Bounded Remote/Input command rendered and tested on the real remote panel. |
| `control:remote:playpause` | control | `playpause` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/components/RemoteInputPanel.test.ts` | Bounded Remote/Input command rendered and tested on the real remote panel. |
| `control:remote:right` | control | `right` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/components/RemoteInputPanel.test.ts` | Bounded Remote/Input command rendered and tested on the real remote panel. |
| `control:remote:select` | control | `select` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/components/RemoteInputPanel.test.ts` | Bounded Remote/Input command rendered and tested on the real remote panel. |
| `control:remote:sendtext` | control | `sendtext` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/components/RemoteInputPanel.test.ts` | Bounded Remote/Input command rendered and tested on the real remote panel. |
| `control:remote:soundcloud` | control | `soundcloud` | implemented | M006/S03 | `src/js/apps/album/show/tpl/details_meta.jst.eco:48`<br>`src/js/apps/artist/show/tpl/details_meta.jst.eco:52` | Remote/Input parity backlog from Chorus2 source scan. |
| `control:remote:stop` | control | `stop` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/components/RemoteInputPanel.test.ts` | Bounded Remote/Input command rendered and tested on the real remote panel. |
| `control:remote:tmdb` | control | `tmdb` | implemented | M006/S03 | `src/js/apps/movie/show/tpl/details_meta.jst.eco:79`<br>`src/js/apps/tvshow/episode/tpl/details_meta.jst.eco:86`<br>`src/js/apps/tvshow/show/tpl/details_meta.jst.eco:48` | Remote/Input parity backlog from Chorus2 source scan. |
| `control:remote:tvdb` | control | `tvdb` | implemented | M006/S03 | `src/js/apps/tvshow/episode/tpl/details_meta.jst.eco:85`<br>`src/js/apps/tvshow/show/tpl/details_meta.jst.eco:47` | Remote/Input parity backlog from Chorus2 source scan. |
| `control:remote:up` | control | `up` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/components/RemoteInputPanel.test.ts` | Bounded Remote/Input command rendered and tested on the real remote panel. |
| `control:remote:volumedown` | control | `volumedown` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/components/RemoteInputPanel.test.ts` | Bounded Remote/Input command rendered and tested on the real remote panel. |
| `control:remote:volumeup` | control | `volumeup` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/components/RemoteInputPanel.svelte`<br>`src/lib/components/RemoteInputPanel.test.ts` | Bounded Remote/Input command rendered and tested on the real remote panel. |

## Family: remote-page

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:remote-page:remote` | route | `remote` | implemented | M006/S03 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts`<br>`src/lib/components/RemoteInputPanel.svelte` | Chorus2 remote page alias is now the bounded Remote/Input route. |

## Family: screen-shot

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:screen-shot:lab-screenshot` | route | `lab/screenshot` | implemented | M006/S04 | `src/js/apps/lab/lab_app.js.coffee:21` | Route/menu alias backlog from Chorus2 source scan. |

## Family: search

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:search:search-go` | action | `search:go` | implemented | M006/S04 | `src/js/apps/search/search_app.js.coffee:51` | Command/action parity backlog from Chorus2 source scan. |
| `route:search:search` | route | `search` | implemented | R057/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:search:settings-search` | route | `settings/search` | implemented | M006/S01 | `src/js/apps/settings/settings_app.js.coffee:10` | Route/menu alias backlog from Chorus2 source scan. |

## Family: search-addons

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:search-addons:search-addons-entities` | action | `searchAddons:entities` | implemented | M006/S04 | `src/js/entities/search/searchAddons.js.coffee:41` | Command/action parity backlog from Chorus2 source scan. |
| `action:search-addons:search-addons-update-defaults` | action | `searchAddons:update:defaults` | implemented | M006/S04 | `src/js/entities/search/searchAddons.js.coffee:49` | Command/action parity backlog from Chorus2 source scan. |
| `action:search-addons:search-addons-update-entities` | action | `searchAddons:update:entities` | implemented | M006/S04 | `src/js/entities/search/searchAddons.js.coffee:45` | Command/action parity backlog from Chorus2 source scan. |

## Family: season

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:season:season-entities` | action | `season:entities` | implemented | R054/M006/S04 | `src/js/entities/kodi/season.js.coffee:63` | Media parity backlog from Chorus2 source scan. |
| `action:season:season-entity` | action | `season:entity` | implemented | R054/M006/S04 | `src/js/entities/kodi/season.js.coffee:59` | Media parity backlog from Chorus2 source scan. |
| `action:season:season-fields` | action | `season:fields` | implemented | R054/M006/S04 | `src/js/entities/kodi/season.js.coffee:68` | Media parity backlog from Chorus2 source scan. |
| `action:season:season-list-view` | action | `season:list:view` | implemented | R054/M006/S04 | `src/js/apps/tvshow/season/season_controller.js.coffee:82` | Media parity backlog from Chorus2 source scan. |
| `route:season:tvshow-tvshowid-season` | route | `tvshow/:tvshowid/:season` | implemented | M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts` | Chorus2 TV season route is promoted to the existing video season route. |

## Family: sections

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:sections:sections` | nav | `Sections` | implemented | M006/S02 | `src/js/apps/category/list/list_controller.js.coffee:28`<br>`src/js/apps/filter/show/show_controller.js.coffee:145`<br>`src/js/apps/landing/show/landing_controller.js.coffee:29` | Route/menu alias backlog from Chorus2 source scan. |

## Family: selected

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:selected:selected-action-add` | action | `selected:action:add` | implemented | M006/S04 | `src/js/apps/selected/selected_app.js.coffee:103` | Command/action parity backlog from Chorus2 source scan. |
| `action:selected:selected-action-localadd` | action | `selected:action:localadd` | implemented | M006/S04 | `src/js/apps/selected/selected_app.js.coffee:110` | Command/action parity backlog from Chorus2 source scan. |
| `action:selected:selected-action-play` | action | `selected:action:play` | implemented | M006/S04 | `src/js/apps/selected/selected_app.js.coffee:96` | Command/action parity backlog from Chorus2 source scan. |
| `action:selected:selected-clear-items` | action | `selected:clear:items` | implemented | M006/S04 | `src/js/apps/selected/selected_app.js.coffee:88` | Command/action parity backlog from Chorus2 source scan. |
| `action:selected:selected-get-items` | action | `selected:get:items` | implemented | M006/S04 | `src/js/apps/selected/selected_app.js.coffee:76` | Command/action parity backlog from Chorus2 source scan. |
| `action:selected:selected-get-media` | action | `selected:get:media` | implemented | M006/S04 | `src/js/apps/selected/selected_app.js.coffee:80` | Command/action parity backlog from Chorus2 source scan. |
| `action:selected:selected-set-media` | action | `selected:set:media` | implemented | M006/S04 | `src/js/apps/selected/selected_app.js.coffee:92` | Command/action parity backlog from Chorus2 source scan. |
| `action:selected:selected-update-items` | action | `selected:update:items` | implemented | M006/S04 | `src/js/apps/selected/selected_app.js.coffee:84` | Command/action parity backlog from Chorus2 source scan. |

## Family: settings

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:settings:settings-kodi-entities` | action | `settings:kodi:entities` | implemented | M006/S01 | `src/js/entities/kodi/settings.js.coffee:132` | Command/action parity backlog from Chorus2 source scan. |
| `action:settings:settings-kodi-filtered-entities` | action | `settings:kodi:filtered:entities` | implemented | M006/S01 | `src/js/entities/kodi/settings.js.coffee:136` | Command/action parity backlog from Chorus2 source scan. |
| `action:settings:settings-kodi-save-entities` | action | `settings:kodi:save:entities` | implemented | M006/S01 | `src/js/entities/kodi/settings.js.coffee:141` | Command/action parity backlog from Chorus2 source scan. |
| `action:settings:settings-subnav` | action | `settings:subnav` | implemented | M006/S01 | `src/js/apps/settings/settings_app.js.coffee:56` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:settings:get-categories` | jsonrpc | `Settings.GetCategories` | implemented | M006/S04 | `src/js/entities/kodi/settings.js.coffee:109` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:settings:get-sections` | jsonrpc | `Settings.GetSections` | implemented | M006/S04 | `src/js/entities/kodi/settings.js.coffee:101` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:settings:get-settings` | jsonrpc | `Settings.GetSettings` | implemented | M006/S04 | `src/js/entities/kodi/settings.js.coffee:120`<br>`src/js/entities/kodi/settings.js.coffee:47` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:settings:set-setting-value` | jsonrpc | `Settings.SetSettingValue` | implemented | M006/S04 | `src/js/entities/kodi/settings.js.coffee:76` | Command/action parity backlog from Chorus2 source scan. |
| `nav:settings:settings-addons` | nav | `settings/addons` | implemented | M006/S01 | `src/js/entities/nav/navMain.js.coffee:52`<br>`src/js/entities/nav/navMain.js.coffee:64` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:settings:settings-nav` | nav | `settings/nav` | implemented | M006/S01 | `src/js/entities/nav/navMain.js.coffee:63` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:settings:settings-search` | nav | `settings/search` | implemented | M006/S01 | `src/js/entities/nav/navMain.js.coffee:65` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:settings:settings-web` | nav | `settings/web` | implemented | M006/S01 | `src/js/entities/nav/navMain.js.coffee:61`<br>`src/js/entities/nav/navMain.js.coffee:62` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:settings:settings-wildcard` | nav | `settings/*` | implemented | M006/S01 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:settings:settings` | route | `settings` | implemented | M006/S01 | `src/lib/app/appRouter.ts` |  |

## Family: shell

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:shell:shell-disconnect` | action | `shell:disconnect` | implemented | M006/S04 | `src/js/apps/shell/shell_app.js.coffee:158` | Command/action parity backlog from Chorus2 source scan. |
| `action:shell:shell-reconnect` | action | `shell:reconnect` | implemented | M006/S04 | `src/js/apps/shell/shell_app.js.coffee:147` | Command/action parity backlog from Chorus2 source scan. |
| `action:shell:shell-view-ready` | action | `shell:view:ready` | implemented | M006/S04 | `src/js/apps/shell/shell_app.js.coffee:129` | Command/action parity backlog from Chorus2 source scan. |
| `route:shell:root` | route | `/` | implemented | M006/S01 | `src/lib/app/appRouter.ts` | Current dashboard route covers the Chorus2 home shell entry point. |

## Family: show

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:show:show` | nav | `show` | implemented | M006/S02 | `src/js/apps/addon/list/list_controller.js.coffee:13`<br>`src/js/apps/category/list/list_controller.js.coffee:12`<br>`src/js/apps/epg/list/list_controller.js.coffee:34`<br>`src/js/apps/filter/show/show_controller.js.coffee:10`<br>`src/js/apps/landing/show/landing_controller.js.coffee:12`<br>`src/js/apps/landing/show/landing_controller.js.coffee:14`<br>`src/js/apps/landing/show/landing_controller.js.coffee:58`<br>`src/js/apps/pvr/channelList/channel_list_controller.js.coffee:15`<br>`src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:15`<br>`src/js/apps/settings/settings_app.js.coffee:38` | Route/menu alias backlog from Chorus2 source scan. |

## Family: sockets

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:sockets:sockets-active` | action | `sockets:active` | implemented | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:55` | Command/action parity backlog from Chorus2 source scan. |

## Family: song

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:song:song-albumparse-entities` | action | `song:albumparse:entities` | implemented | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:161` | Media parity backlog from Chorus2 source scan. |
| `action:song:song-build-collection` | action | `song:build:collection` | implemented | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:153` | Media parity backlog from Chorus2 source scan. |
| `action:song:song-byid-entities` | action | `song:byid:entities` | implemented | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:157` | Media parity backlog from Chorus2 source scan. |
| `action:song:song-custom-entities` | action | `song:custom:entities` | implemented | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:149` | Media parity backlog from Chorus2 source scan. |
| `action:song:song-edit` | action | `song:edit` | implemented | R054/M006/S04 | `src/js/apps/song/song_app.js.coffee:4` | Media parity backlog from Chorus2 source scan. |
| `action:song:song-entities` | action | `song:entities` | implemented | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:145` | Media parity backlog from Chorus2 source scan. |
| `action:song:song-entity` | action | `song:entity` | implemented | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:141` | Media parity backlog from Chorus2 source scan. |
| `action:song:song-fields` | action | `song:fields` | implemented | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:165` | Media parity backlog from Chorus2 source scan. |
| `action:song:song-list-view` | action | `song:list:view` | implemented | R054/M006/S04 | `src/js/apps/song/list/list_controller.js.coffee:58` | Media parity backlog from Chorus2 source scan. |

## Family: state

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:state:state-current` | action | `state:current` | implemented | M006/S04 | `src/js/apps/state/state_app.js.coffee:151` | Command/action parity backlog from Chorus2 source scan. |
| `action:state:state-kodi` | action | `state:kodi` | implemented | M006/S04 | `src/js/apps/state/state_app.js.coffee:145` | Command/action parity backlog from Chorus2 source scan. |
| `action:state:state-kodi-get` | action | `state:kodi:get` | implemented | M006/S04 | `src/js/apps/state/kodi/kodi.js.coffee:21` | Command/action parity backlog from Chorus2 source scan. |
| `action:state:state-kodi-update` | action | `state:kodi:update` | implemented | M006/S04 | `src/js/apps/state/kodi/kodi.js.coffee:18` | Command/action parity backlog from Chorus2 source scan. |
| `action:state:state-local` | action | `state:local` | implemented | M006/S04 | `src/js/apps/state/state_app.js.coffee:147` | Command/action parity backlog from Chorus2 source scan. |
| `action:state:state-local-get` | action | `state:local:get` | implemented | M006/S04 | `src/js/apps/state/local/local.js.coffee:17` | Command/action parity backlog from Chorus2 source scan. |
| `action:state:state-local-update` | action | `state:local:update` | implemented | M006/S04 | `src/js/apps/state/local/local.js.coffee:14` | Command/action parity backlog from Chorus2 source scan. |
| `action:state:state-ws-init` | action | `state:ws:init` | implemented | M006/S04 | `src/js/apps/state/state_app.js.coffee:156` | Command/action parity backlog from Chorus2 source scan. |

## Family: system

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:system:power-commands` | action | `power commands` | implemented | D043/M006/S05 | `scripts/scan-chorus2-parity.mjs` | Destructive power actions require an explicit guard before exposure. |
| `jsonrpc:system:get-properties` | jsonrpc | `System.GetProperties` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:system:hibernate` | jsonrpc | `System.Hibernate` | implemented | D043/M006/S05 | `src/lib/kodi/methods.ts` | Guarded destructive method; do not expose without confirmation. |
| `jsonrpc:system:on-quit` | jsonrpc | `System.OnQuit` | implemented | D043/M006/S05 | `src/js/apps/state/kodi/notifications.js.coffee:220` | Guarded destructive method; do not expose without confirmation. |
| `jsonrpc:system:on-restart` | jsonrpc | `System.OnRestart` | implemented | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:225` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:system:on-wake` | jsonrpc | `System.OnWake` | implemented | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:225` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:system:reboot` | jsonrpc | `System.Reboot` | implemented | D043/M006/S05 | `src/lib/kodi/methods.ts` | Guarded destructive method; do not expose without confirmation. |
| `jsonrpc:system:shutdown` | jsonrpc | `System.Shutdown` | implemented | D043/M006/S05 | `src/lib/kodi/methods.ts` | Guarded destructive method; do not expose without confirmation. |
| `jsonrpc:system:suspend` | jsonrpc | `System.Suspend` | implemented | D043/M006/S05 | `src/lib/kodi/methods.ts` | Guarded destructive method; do not expose without confirmation. |

## Family: themoviedb

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:themoviedb:themoviedb-movie-image-entities` | action | `themoviedb:movie:image:entities` | implemented | R054/M006/S04 | `src/js/entities/external/themoviedb.js.coffee:95` | Media parity backlog from Chorus2 source scan. |
| `action:themoviedb:themoviedb-tv-image-entities` | action | `themoviedb:tv:image:entities` | implemented | R054/M006/S04 | `src/js/entities/external/themoviedb.js.coffee:100` | Media parity backlog from Chorus2 source scan. |

## Family: thumbs

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:thumbs:thumbsup` | nav | `thumbsup` | implemented | R055/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:thumbs:thumbsup` | route | `thumbsup` | implemented | R055/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: thumbsup

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:thumbsup:thumbsup-check` | action | `thumbsup:check` | implemented | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:188` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:thumbsup:thumbsup-get-entities` | action | `thumbsup:get:entities` | implemented | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:184` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:thumbsup:thumbsup-toggle-entity` | action | `thumbsup:toggle:entity` | implemented | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:173` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `nav:thumbsup:thumbsup` | nav | `thumbsup` | implemented | R055/M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts`<br>`src/main.test.ts` | Playlist/local-player parity backlog from Chorus2 source scan. |

## Family: timer

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:timer:timer` | nav | `timer` | implemented | R056/M006/S04 | `src/js/apps/epg/list/list_controller.js.coffee:11`<br>`src/js/apps/epg/list/list_controller.js.coffee:19` | Broadcast timer actions are exposed through the selected channel EPG list. |

## Family: tv

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:tv:pvr-tv` | route | `pvr/tv` | implemented | R056/M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts`<br>`src/main.test.ts` | PVR parity backlog from Chorus2 source scan. |
| `route:tv:pvr-tv-channelid` | route | `pvr/tv/:channelid` | implemented | R056/M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts`<br>`src/main.test.ts` | PVR parity backlog from Chorus2 source scan. |

## Family: tvshow

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:tvshow:tvshow-action` | action | `tvshow:action` | implemented | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:108` | Media parity backlog from Chorus2 source scan. |
| `action:tvshow:tvshow-action-items` | action | `tvshow:action:items` | implemented | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:126` | Media parity backlog from Chorus2 source scan. |
| `action:tvshow:tvshow-action-watched` | action | `tvshow:action:watched` | implemented | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:132` | Media parity backlog from Chorus2 source scan. |
| `action:tvshow:tvshow-edit` | action | `tvshow:edit` | implemented | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:146` | Media parity backlog from Chorus2 source scan. |
| `action:tvshow:tvshow-entities` | action | `tvshow:entities` | implemented | R054/M006/S04 | `src/js/entities/kodi/tvshow.js.coffee:65` | Media parity backlog from Chorus2 source scan. |
| `action:tvshow:tvshow-entity` | action | `tvshow:entity` | implemented | R054/M006/S04 | `src/js/entities/kodi/tvshow.js.coffee:61` | Media parity backlog from Chorus2 source scan. |
| `action:tvshow:tvshow-fields` | action | `tvshow:fields` | implemented | R054/M006/S04 | `src/js/entities/kodi/tvshow.js.coffee:69` | Media parity backlog from Chorus2 source scan. |
| `action:tvshow:tvshow-list-view` | action | `tvshow:list:view` | implemented | R054/M006/S04 | `src/js/apps/tvshow/list/list_controller.js.coffee:78` | Media parity backlog from Chorus2 source scan. |
| `nav:tvshow:tvshows` | nav | `tvshows` | implemented | M006/S04 | `src/lib/app-pages/AppPageSurface.svelte`<br>`src/lib/app-shell/appNavigation.ts`<br>`src/lib/app/primaryRoutes.ts` |  |
| `nav:tvshow:tvshows-recent` | nav | `tvshows/recent` | implemented | M006/S04 | `src/lib/app-pages/AppPageSurface.svelte`<br>`src/lib/app-shell/appNavigation.ts`<br>`src/lib/app/primaryRoutes.ts` |  |
| `route:tvshow:tvshows` | route | `tvshows` | implemented | M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts` | Chorus2 TV shows alias is promoted to the existing video TV route. |
| `route:tvshow:video-tv` | route | `video/tv` | implemented | M006/S01 | `src/lib/video/videoRouter.ts` |  |

## Family: tvshows

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:tvshows:tvshows` | nav | `tvshows` | implemented | M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts` | Chorus2 TV shows nav alias is promoted to the existing video TV route. |
| `nav:tvshows:tvshows-recent` | nav | `tvshows/recent` | implemented | M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts` | Chorus2 recent TV nav alias is promoted to the existing video TV route. |

## Family: ui

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:ui:ui-dropdown-bind-close` | action | `ui:dropdown:bind:close` | implemented | M006/S04 | `src/js/apps/ui/ui_app.js.coffee:146` | Command/action parity backlog from Chorus2 source scan. |
| `action:ui:ui-modal-close` | action | `ui:modal:close` | implemented | M006/S04 | `src/js/apps/ui/ui_app.js.coffee:107`<br>`src/js/apps/ui/ui_app.js.coffee:127` | Command/action parity backlog from Chorus2 source scan. |
| `action:ui:ui-modal-confirm` | action | `ui:modal:confirm` | implemented | M006/S04 | `src/js/apps/ui/ui_app.js.coffee:111` | Command/action parity backlog from Chorus2 source scan. |
| `action:ui:ui-modal-form-show` | action | `ui:modal:form:show` | implemented | M006/S04 | `src/js/apps/ui/ui_app.js.coffee:123` | Command/action parity backlog from Chorus2 source scan. |
| `action:ui:ui-modal-options` | action | `ui:modal:options` | implemented | M006/S04 | `src/js/apps/ui/ui_app.js.coffee:137` | Command/action parity backlog from Chorus2 source scan. |
| `action:ui:ui-modal-show` | action | `ui:modal:show` | implemented | M006/S04 | `src/js/apps/ui/ui_app.js.coffee:116` | Command/action parity backlog from Chorus2 source scan. |
| `action:ui:ui-modal-youtube` | action | `ui:modal:youtube` | implemented | R054/M006/S04 | `src/js/apps/ui/ui_app.js.coffee:131` | Media parity backlog from Chorus2 source scan. |
| `action:ui:ui-playermenu` | action | `ui:playermenu` | implemented | M006/S04 | `src/js/apps/ui/ui_app.js.coffee:142` | Command/action parity backlog from Chorus2 source scan. |
| `action:ui:ui-textinput-show` | action | `ui:textinput:show` | implemented | M006/S04 | `src/js/apps/ui/ui_app.js.coffee:89` | Command/action parity backlog from Chorus2 source scan. |

## Family: unknown

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:unknown:root` | nav | `/` | implemented | M006/S02 | `src/js/apps/landing/show/landing_controller.js.coffee:82` | Route/menu alias backlog from Chorus2 source scan. |

## Family: url

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:url:url` | nav | `url(` | implemented | M006/S02 | `src/js/apps/landing/show/landing_controller.js.coffee:81` | Route/menu alias backlog from Chorus2 source scan. |

## Family: video-library

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:video-library:clean` | jsonrpc | `VideoLibrary.Clean` | implemented | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:43`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-episode-details` | jsonrpc | `VideoLibrary.GetEpisodeDetails` | implemented | R054/M006/S04 | `src/js/entities/kodi/episode.js.coffee:39` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-episodes` | jsonrpc | `VideoLibrary.GetEpisodes` | implemented | R054/M006/S04 | `src/js/entities/kodi/episode.js.coffee:50` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-movie-details` | jsonrpc | `VideoLibrary.GetMovieDetails` | implemented | R054/M006/S04 | `src/js/entities/kodi/movie.js.coffee:36` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-movies` | jsonrpc | `VideoLibrary.GetMovies` | implemented | R054/M006/S04 | `src/js/entities/kodi/movie.js.coffee:47`<br>`src/js/helpers/customMixins/kodi_entities.js.coffee:11` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-music-video-details` | jsonrpc | `VideoLibrary.GetMusicVideoDetails` | implemented | R054/M006/S04 | `src/js/entities/kodi/musicvideo.js.coffee:33` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-music-videos` | jsonrpc | `VideoLibrary.GetMusicVideos` | implemented | R054/M006/S04 | `src/js/entities/kodi/musicvideo.js.coffee:44` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-seasons` | jsonrpc | `VideoLibrary.GetSeasons` | implemented | R054/M006/S04 | `src/js/entities/kodi/season.js.coffee:45` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-tvshow-details` | jsonrpc | `VideoLibrary.GetTVShowDetails` | implemented | R054/M006/S04 | `src/js/entities/kodi/tvshow.js.coffee:36` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-tvshows` | jsonrpc | `VideoLibrary.GetTVShows` | implemented | R054/M006/S04 | `src/js/entities/kodi/tvshow.js.coffee:47` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:on-clean-finished` | jsonrpc | `VideoLibrary.OnCleanFinished` | implemented | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:189` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:on-clean-started` | jsonrpc | `VideoLibrary.OnCleanStarted` | implemented | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:185` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:on-scan-finished` | jsonrpc | `VideoLibrary.OnScanFinished` | implemented | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:159` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:on-scan-started` | jsonrpc | `VideoLibrary.OnScanStarted` | implemented | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:155` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:on-update` | jsonrpc | `VideoLibrary.OnUpdate` | implemented | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:193` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:refresh-episode` | jsonrpc | `VideoLibrary.RefreshEpisode` | implemented | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:85` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:refresh-movie` | jsonrpc | `VideoLibrary.RefreshMovie` | implemented | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:73` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:refresh-tvshow` | jsonrpc | `VideoLibrary.RefreshTVShow` | implemented | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:79` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:scan` | jsonrpc | `VideoLibrary.Scan` | implemented | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:38`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:set-episode-details` | jsonrpc | `VideoLibrary.SetEpisodeDetails` | implemented | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:12`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:set-movie-details` | jsonrpc | `VideoLibrary.SetMovieDetails` | implemented | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:19`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:set-music-video-details` | jsonrpc | `VideoLibrary.SetMusicVideoDetails` | implemented | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:33`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:set-tvshow-details` | jsonrpc | `VideoLibrary.SetTVShowDetails` | implemented | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:26`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |

## Family: videolibrary

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:videolibrary:clean` | jsonrpc | `VideoLibrary.Clean` | implemented | R054/M006/S04 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:videolibrary:refresh-episode` | jsonrpc | `VideoLibrary.RefreshEpisode` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:videolibrary:refresh-movie` | jsonrpc | `VideoLibrary.RefreshMovie` | implemented | M006/S04 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:videolibrary:refresh-tvshow` | jsonrpc | `VideoLibrary.RefreshTVShow` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:videolibrary:scan` | jsonrpc | `VideoLibrary.Scan` | implemented | R054/M006/S04 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:videolibrary:set-episode-details` | jsonrpc | `VideoLibrary.SetEpisodeDetails` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:videolibrary:set-movie-details` | jsonrpc | `VideoLibrary.SetMovieDetails` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:videolibrary:set-music-video-details` | jsonrpc | `VideoLibrary.SetMusicVideoDetails` | implemented | R054/M006/S04 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:videolibrary:set-tvshow-details` | jsonrpc | `VideoLibrary.SetTVShowDetails` | implemented | M006/S04 | `src/lib/kodi/methods.ts` |  |

## Family: view

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:view:browser-media-id` | route | `browser/:media/:id` | implemented | M006/S02 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts`<br>`src/main.test.ts` | Route/menu alias backlog from Chorus2 source scan. |
| `route:view:movie-id` | route | `movie/:id` | implemented | M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts` | Chorus2 movie detail route is promoted to the existing video movie detail route. |
| `route:view:music-album-id` | route | `music/album/:id` | implemented | R054/M006/S04 | `src/js/apps/album/album_app.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `route:view:music-artist-id` | route | `music/artist/:id` | implemented | R054/M006/S04 | `src/js/apps/artist/artist_app.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `route:view:music-video-id` | route | `music/video/:id` | implemented | R054/M006/S04 | `src/js/apps/musicvideo/musicvideo_app.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `route:view:search` | route | `search` | implemented | R057/M006/S04 | `src/js/apps/search/search_app.js.coffee:5` | Route/menu alias backlog from Chorus2 source scan. |
| `route:view:tvshow-tvshowid` | route | `tvshow/:tvshowid` | implemented | M006/S04 | `src/App.test.ts`<br>`src/lib/app/appRouter.test.ts`<br>`src/lib/app/appRouter.ts` | Chorus2 TV show detail route is promoted to the existing video TV show detail route. |

## Family: when

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:when:when-entity-fetched` | action | `when:entity:fetched` | implemented | M006/S04 | `src/js/entities/kodi/_base/_fetch.js.coffee:18` | Command/action parity backlog from Chorus2 source scan. |

## Family: youtube

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:youtube:youtube-list-view` | action | `youtube:list:view` | implemented | R054/M006/S04 | `src/js/apps/external/youtube/youtube_controller.js.coffee:37` | Media parity backlog from Chorus2 source scan. |
| `action:youtube:youtube-search-entities` | action | `youtube:search:entities` | implemented | R054/M006/S04 | `src/js/entities/external/youtube.js.coffee:45` | Media parity backlog from Chorus2 source scan. |
| `action:youtube:youtube-search-popup` | action | `youtube:search:popup` | implemented | R054/M006/S04 | `src/js/apps/external/youtube/youtube_controller.js.coffee:31` | Media parity backlog from Chorus2 source scan. |
| `action:youtube:youtube-search-view` | action | `youtube:search:view` | implemented | R054/M006/S04 | `src/js/apps/external/youtube/youtube_controller.js.coffee:28` | Media parity backlog from Chorus2 source scan. |
| `action:youtube:youtube-trailer-entities` | action | `youtube:trailer:entities` | implemented | R054/M006/S04 | `src/js/entities/external/youtube.js.coffee:56` | Media parity backlog from Chorus2 source scan. |

<!-- prettier-ignore-end -->
