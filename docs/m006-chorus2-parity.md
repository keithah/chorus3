# M006 Chorus2 Parity Ledger

> Generated from `CHORUS2_PARITY_LEDGER`; do not edit by hand. Run `node scripts/verify-chorus2-parity.mjs --write` to refresh.

S01 proof is static source comparison only; no live Kodi calls are performed.
Later slices own route aliases, Remote/Input, media alias bridges, packaged shell proof, and closeout.

<!-- prettier-ignore-start -->

## Totals by Kind and Status

| kind | implemented | missing | deferred | out-of-scope | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| route | 9 | 30 | 39 | 0 | 78 |
| nav | 1 | 49 | 33 | 0 | 83 |
| control | 0 | 23 | 0 | 0 | 23 |
| action | 2 | 115 | 115 | 0 | 232 |
| jsonrpc | 22 | 50 | 70 | 0 | 142 |

## Totals by Status

| status | count |
| --- | ---: |
| implemented | 34 |
| missing | 267 |
| deferred | 257 |
| out-of-scope | 0 |

## Family: add-on

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:add-on:add-on` | nav | `AddOn` | missing | M006/S02 | `src/js/apps/addon/addon_app.js.coffee:23` | Route/menu alias backlog from Chorus2 source scan. |

## Family: add-ons

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:add-ons:add-ons` | nav | `Add-ons` | missing | M006/S02 | `src/js/apps/addon/list/list_controller.js.coffee:31` | Route/menu alias backlog from Chorus2 source scan. |

## Family: add-ons-search-settings

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:add-ons-search-settings:add-ons-search-settings` | nav | `addOnsSearchSettings` | missing | M006/S02 | `src/js/apps/addon/addon_app.js.coffee:38`<br>`src/js/apps/addon/addon_app.js.coffee:89` | Route/menu alias backlog from Chorus2 source scan. |

## Family: addon

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:addon:addon-enabled-addons` | action | `addon:enabled:addons` | missing | M006/S04 | `src/js/apps/addon/addon_app.js.coffee:76` | Command/action parity backlog from Chorus2 source scan. |
| `action:addon:addon-entities` | action | `addon:entities` | missing | M006/S04 | `src/js/entities/kodi/addon.js.coffee:71` | Command/action parity backlog from Chorus2 source scan. |
| `action:addon:addon-excluded-paths` | action | `addon:excludedPaths` | missing | M006/S04 | `src/js/apps/addon/addon_app.js.coffee:80`<br>`src/js/apps/addon/youtube/addon_youtube_app.js.coffee:27` | Command/action parity backlog from Chorus2 source scan. |
| `action:addon:addon-is-enabled` | action | `addon:isEnabled` | missing | M006/S04 | `src/js/apps/addon/addon_app.js.coffee:72` | Command/action parity backlog from Chorus2 source scan. |
| `action:addon:addon-pvr-enabled` | action | `addon:pvr:enabled` | deferred | R056/M006/S04 | `src/js/apps/addon/pvr/addons_pvr_ap.js.coffee:9` | PVR parity backlog from Chorus2 source scan. |
| `action:addon:addon-search-enabled` | action | `addon:search:enabled` | missing | M006/S04 | `src/js/apps/addon/addon_app.js.coffee:88` | Command/action parity backlog from Chorus2 source scan. |
| `action:addon:addon-search-settings` | action | `addon:search:settings:` | missing | M006/S04 | `src/js/apps/addon/googlemusic/addon_googlemusic_app.js.coffee:15`<br>`src/js/apps/addon/mixcloud/addon_mixcloud_app.js.coffee:14`<br>`src/js/apps/addon/radio/addon_radio_app.js.coffee:15`<br>`src/js/apps/addon/soundcloud/addon_soundcloud_app.js.coffee:14`<br>`src/js/apps/addon/youtube/addon_youtube_app.js.coffee:13` | Command/action parity backlog from Chorus2 source scan. |
| `nav:addon:addons-all` | nav | `addons/all` | missing | M006/S02 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:addon:addons-audio` | nav | `addons/audio` | missing | M006/S02 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:addon:addons-executable` | nav | `addons/executable` | missing | M006/S02 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:addon:addons-video` | nav | `addons/video` | missing | M006/S02 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:addon:addon-execute-id` | route | `addon/execute/:id` | missing | M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:addon:addons` | route | `addons` | implemented | M006/S01 | `src/lib/app/appRouter.ts` |  |
| `route:addon:addons-addonid` | route | `addons/:addonid` | implemented | M006/S01 | `src/lib/app/appRouter.ts` |  |
| `route:addon:addons-type` | route | `addons/:type` | missing | M006/S02 | `scripts/scan-chorus2-parity.mjs` | Chorus2 type-filter aliases are not accepted by the current addon route parser. |

## Family: addons

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:addons:controller` | jsonrpc | `Addons.Controller` | missing | M006/S04 | `src/js/apps/settings/show/addons/addons_controller.js.coffee:3` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:addons:execute-addon` | jsonrpc | `Addons.ExecuteAddon` | missing | M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:addons:get-addons` | jsonrpc | `Addons.GetAddons` | missing | M006/S04 | `src/js/apps/command/kodi/helpers/addon.js.coffee:27`<br>`src/js/apps/command/kodi/helpers/addon.js.coffee:6`<br>`src/js/entities/kodi/file.js.coffee:62` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:addons:set-addon-enabled` | jsonrpc | `Addons.SetAddonEnabled` | missing | M006/S04 | `src/js/apps/settings/show/addons/addons_controller.js.coffee:82` | Command/action parity backlog from Chorus2 source scan. |
| `nav:addons:addons-all` | nav | `addons/all` | missing | M006/S02 | `src/js/apps/addon/list/list_controller.js.coffee:31`<br>`src/js/entities/nav/navMain.js.coffee:46`<br>`src/js/entities/nav/navMain.js.coffee:47` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:addons:addons-audio` | nav | `addons/audio` | deferred | R054/M006/S04 | `src/js/entities/nav/navMain.js.coffee:49` | Media parity backlog from Chorus2 source scan. |
| `nav:addons:addons-executable` | nav | `addons/executable` | missing | M006/S02 | `src/js/entities/nav/navMain.js.coffee:51` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:addons:addons-video` | nav | `addons/video` | missing | M006/S02 | `src/js/entities/nav/navMain.js.coffee:48` | Route/menu alias backlog from Chorus2 source scan. |
| `route:addons:settings-addons` | route | `settings/addons` | missing | M006/S02 | `src/js/apps/settings/settings_app.js.coffee:8` | Route/menu alias backlog from Chorus2 source scan. |

## Family: album

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:album:album-action` | action | `album:action` | deferred | R054/M006/S04 | `src/js/apps/album/album_app.js.coffee:38` | Media parity backlog from Chorus2 source scan. |
| `action:album:album-action-items` | action | `album:action:items` | deferred | R054/M006/S04 | `src/js/apps/album/album_app.js.coffee:41` | Media parity backlog from Chorus2 source scan. |
| `action:album:album-edit` | action | `album:edit` | deferred | R054/M006/S04 | `src/js/apps/album/album_app.js.coffee:47` | Media parity backlog from Chorus2 source scan. |
| `action:album:album-entities` | action | `album:entities` | deferred | R054/M006/S04 | `src/js/entities/kodi/album.js.coffee:63` | Media parity backlog from Chorus2 source scan. |
| `action:album:album-entity` | action | `album:entity` | deferred | R054/M006/S04 | `src/js/entities/kodi/album.js.coffee:59` | Media parity backlog from Chorus2 source scan. |
| `action:album:album-fields` | action | `album:fields` | deferred | R054/M006/S04 | `src/js/entities/kodi/album.js.coffee:67` | Media parity backlog from Chorus2 source scan. |
| `action:album:album-list-view` | action | `album:list:view` | deferred | R054/M006/S04 | `src/js/apps/album/list/list_controller.js.coffee:75` | Media parity backlog from Chorus2 source scan. |
| `route:album:albums` | route | `albums` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: albums

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:albums:albums-withsongs-view` | action | `albums:withsongs:view` | deferred | R054/M006/S04 | `src/js/apps/album/show/show_controller.js.coffee:98` | Media parity backlog from Chorus2 source scan. |

## Family: api-browser

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:api-browser:lab-api-browser` | route | `lab/api-browser` | missing | M006/S02 | `src/js/apps/lab/lab_app.js.coffee:19` | Route/menu alias backlog from Chorus2 source scan. |
| `route:api-browser:lab-api-browser-method` | route | `lab/api-browser/:method` | missing | M006/S02 | `src/js/apps/lab/lab_app.js.coffee:20` | Route/menu alias backlog from Chorus2 source scan. |

## Family: application

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:application:get-properties` | jsonrpc | `Application.GetProperties` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:application:on-volume-changed` | jsonrpc | `Application.OnVolumeChanged` | missing | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:151` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:application:quit` | jsonrpc | `Application.Quit` | deferred | D043/M006/S05 | `scripts/scan-chorus2-parity.mjs` | Guarded destructive method; do not expose without confirmation. |
| `jsonrpc:application:set-mute` | jsonrpc | `Application.SetMute` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:application:set-volume` | jsonrpc | `Application.SetVolume` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |

## Family: artist

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:artist:artist-action` | action | `artist:action` | deferred | R054/M006/S04 | `src/js/apps/artist/artist_app.js.coffee:38` | Media parity backlog from Chorus2 source scan. |
| `action:artist:artist-action-items` | action | `artist:action:items` | deferred | R054/M006/S04 | `src/js/apps/artist/artist_app.js.coffee:41` | Media parity backlog from Chorus2 source scan. |
| `action:artist:artist-edit` | action | `artist:edit` | deferred | R054/M006/S04 | `src/js/apps/artist/artist_app.js.coffee:47` | Media parity backlog from Chorus2 source scan. |
| `action:artist:artist-entities` | action | `artist:entities` | deferred | R054/M006/S04 | `src/js/entities/kodi/artist.js.coffee:63` | Media parity backlog from Chorus2 source scan. |
| `action:artist:artist-entity` | action | `artist:entity` | deferred | R054/M006/S04 | `src/js/entities/kodi/artist.js.coffee:59` | Media parity backlog from Chorus2 source scan. |
| `action:artist:artist-fields` | action | `artist:fields` | deferred | R054/M006/S04 | `src/js/entities/kodi/artist.js.coffee:70` | Media parity backlog from Chorus2 source scan. |
| `action:artist:artist-list-view` | action | `artist:list:view` | deferred | R054/M006/S04 | `src/js/apps/artist/list/list_controller.js.coffee:75` | Media parity backlog from Chorus2 source scan. |
| `route:artist:artists` | route | `artists` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: audio-library

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:audio-library:clean` | jsonrpc | `AudioLibrary.Clean` | deferred | R054/M006/S04 | `src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:36`<br>`src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:get-album-details` | jsonrpc | `AudioLibrary.GetAlbumDetails` | deferred | R054/M006/S04 | `src/js/entities/kodi/album.js.coffee:33` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:get-albums` | jsonrpc | `AudioLibrary.GetAlbums` | deferred | R054/M006/S04 | `src/js/entities/kodi/album.js.coffee:46` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:get-artist-details` | jsonrpc | `AudioLibrary.GetArtistDetails` | deferred | R054/M006/S04 | `src/js/entities/kodi/artist.js.coffee:33` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:get-artists` | jsonrpc | `AudioLibrary.GetArtists` | deferred | R054/M006/S04 | `src/js/entities/kodi/artist.js.coffee:45` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:get-genres` | jsonrpc | `AudioLibrary.GetGenres` | deferred | R054/M006/S04 | `src/js/entities/kodi/genres.js.coffee:40` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:get-song-details` | jsonrpc | `AudioLibrary.GetSongDetails` | deferred | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:111`<br>`src/js/entities/kodi/song.js.coffee:85` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:get-songs` | jsonrpc | `AudioLibrary.GetSongs` | deferred | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:122`<br>`src/js/entities/kodi/song.js.coffee:137` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:on-clean-finished` | jsonrpc | `AudioLibrary.OnCleanFinished` | deferred | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:181` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:on-clean-started` | jsonrpc | `AudioLibrary.OnCleanStarted` | deferred | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:177` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:on-scan-finished` | jsonrpc | `AudioLibrary.OnScanFinished` | deferred | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:170` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:on-scan-started` | jsonrpc | `AudioLibrary.OnScanStarted` | deferred | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:166` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:on-update` | jsonrpc | `AudioLibrary.OnUpdate` | deferred | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:193` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:scan` | jsonrpc | `AudioLibrary.Scan` | deferred | R054/M006/S04 | `src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:31`<br>`src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:set-album-details` | jsonrpc | `AudioLibrary.SetAlbumDetails` | deferred | R054/M006/S04 | `src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:12`<br>`src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:set-artist-details` | jsonrpc | `AudioLibrary.SetArtistDetails` | deferred | R054/M006/S04 | `src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:19`<br>`src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:audio-library:set-song-details` | jsonrpc | `AudioLibrary.SetSongDetails` | deferred | R054/M006/S04 | `src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:26`<br>`src/js/apps/command/kodi/helpers/audiolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |

## Family: audiolibrary

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:audiolibrary:clean` | jsonrpc | `AudioLibrary.Clean` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:audiolibrary:scan` | jsonrpc | `AudioLibrary.Scan` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:audiolibrary:set-album-details` | jsonrpc | `AudioLibrary.SetAlbumDetails` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:audiolibrary:set-artist-details` | jsonrpc | `AudioLibrary.SetArtistDetails` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:audiolibrary:set-song-details` | jsonrpc | `AudioLibrary.SetSongDetails` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |

## Family: auto

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:auto:auto` | nav | `auto` | missing | M006/S02 | `src/js/apps/addon/addon_app.js.coffee:23`<br>`src/js/apps/pvr/channelList/channel_list_controller.js.coffee:30`<br>`src/js/apps/pvr/channelList/channel_list_controller.js.coffee:34` | Route/menu alias backlog from Chorus2 source scan. |

## Family: body

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:body:body-state` | action | `body:state` | missing | M006/S04 | `src/js/apps/shell/shell_app.js.coffee:142` | Command/action parity backlog from Chorus2 source scan. |

## Family: broadcast

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:broadcast:broadcast-action` | action | `broadcast:action` | deferred | R056/M006/S04 | `src/js/apps/epg/epg_app.js.coffee:36` | PVR parity backlog from Chorus2 source scan. |
| `action:broadcast:broadcast-entities` | action | `broadcast:entities` | deferred | R056/M006/S04 | `src/js/entities/kodi/epg.js.coffee:65` | PVR parity backlog from Chorus2 source scan. |
| `action:broadcast:broadcast-entity` | action | `broadcast:entity` | deferred | R056/M006/S04 | `src/js/entities/kodi/epg.js.coffee:61` | PVR parity backlog from Chorus2 source scan. |

## Family: broadcast-play

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:broadcast-play:broadcast-play` | nav | `broadcast:play` | deferred | R056/M006/S04 | `src/js/apps/epg/list/list_controller.js.coffee:14` | PVR parity backlog from Chorus2 source scan. |

## Family: broadcast-record

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:broadcast-record:broadcast-record` | nav | `broadcast:record` | deferred | R056/M006/S04 | `src/js/apps/epg/list/list_controller.js.coffee:16` | PVR parity backlog from Chorus2 source scan. |

## Family: broadcast-timer

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:broadcast-timer:broadcast-timer` | nav | `broadcast:timer` | deferred | R056/M006/S04 | `src/js/apps/epg/list/list_controller.js.coffee:18` | PVR parity backlog from Chorus2 source scan. |

## Family: browser

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:browser:browser-directory-view` | action | `browser:directory:view` | missing | M006/S04 | `src/js/apps/browser/list/list_controller.js.coffee:172` | Command/action parity backlog from Chorus2 source scan. |
| `action:browser:browser-file-view` | action | `browser:file:view` | missing | M006/S04 | `src/js/apps/browser/list/list_controller.js.coffee:168` | Command/action parity backlog from Chorus2 source scan. |
| `nav:browser:browser` | nav | `browser` | missing | M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:browser:browser` | route | `browser` | missing | M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:browser:files` | route | `files` | missing | M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: cast

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:cast:cast-entities` | action | `cast:entities` | missing | M006/S04 | `src/js/entities/kodi/cast.js.coffee:45` | Command/action parity backlog from Chorus2 source scan. |
| `action:cast:cast-list-view` | action | `cast:list:view` | missing | M006/S04 | `src/js/apps/cast/cast_app.js.coffee:19` | Command/action parity backlog from Chorus2 source scan. |

## Family: category

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:category:category` | route | `category` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: channel

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:channel:channel-entities` | action | `channel:entities` | deferred | R056/M006/S04 | `src/js/entities/kodi/pvr.js.coffee:108` | PVR parity backlog from Chorus2 source scan. |
| `action:channel:channel-entity` | action | `channel:entity` | deferred | R056/M006/S04 | `src/js/entities/kodi/pvr.js.coffee:104` | PVR parity backlog from Chorus2 source scan. |

## Family: childview-broadcast-play

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-broadcast-play:childview-broadcast-play` | nav | `childview:broadcast:play` | deferred | R056/M006/S04 | `src/js/apps/epg/list/list_controller.js.coffee:6` | PVR parity backlog from Chorus2 source scan. |

## Family: childview-broadcast-record

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-broadcast-record:childview-broadcast-record` | nav | `childview:broadcast:record` | deferred | R056/M006/S04 | `src/js/apps/epg/list/list_controller.js.coffee:8` | PVR parity backlog from Chorus2 source scan. |

## Family: childview-broadcast-timer

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-broadcast-timer:childview-broadcast-timer` | nav | `childview:broadcast:timer` | deferred | R056/M006/S04 | `src/js/apps/epg/list/list_controller.js.coffee:10` | PVR parity backlog from Chorus2 source scan. |

## Family: childview-channel-play

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-channel-play:childview-channel-play` | nav | `childview:channel:play` | deferred | R056/M006/S04 | `src/js/apps/pvr/channelList/channel_list_controller.js.coffee:29` | PVR parity backlog from Chorus2 source scan. |

## Family: childview-channel-record

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-channel-record:childview-channel-record` | nav | `childview:channel:record` | deferred | R056/M006/S04 | `src/js/apps/pvr/channelList/channel_list_controller.js.coffee:33` | PVR parity backlog from Chorus2 source scan. |

## Family: childview-filter-add

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-filter-add:childview-filter-add` | nav | `childview:filter:add` | missing | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:79` | Route/menu alias backlog from Chorus2 source scan. |

## Family: childview-filter-filterable-select

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-filter-filterable-select:childview-filter-filterable-select` | nav | `childview:filter:filterable:select` | missing | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:53` | Route/menu alias backlog from Chorus2 source scan. |

## Family: childview-filter-option-remove

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-filter-option-remove:childview-filter-option-remove` | nav | `childview:filter:option:remove` | missing | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:74` | Route/menu alias backlog from Chorus2 source scan. |

## Family: childview-filter-option-select

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-filter-option-select:childview-filter-option-select` | nav | `childview:filter:option:select` | missing | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:91` | Route/menu alias backlog from Chorus2 source scan. |

## Family: childview-filter-sortable-select

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-filter-sortable-select:childview-filter-sortable-select` | nav | `childview:filter:sortable:select` | missing | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:42` | Route/menu alias backlog from Chorus2 source scan. |

## Family: childview-recording-play

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:childview-recording-play:childview-recording-play` | nav | `childview:recording:play` | deferred | R056/M006/S04 | `src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:29` | PVR parity backlog from Chorus2 source scan. |

## Family: command

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:command:command-audio-add` | action | `command:audio:add` | deferred | R054/M006/S04 | `src/js/apps/command/command_app.js.coffee:51` | Media parity backlog from Chorus2 source scan. |
| `action:command:command-audio-play` | action | `command:audio:play` | deferred | R054/M006/S04 | `src/js/apps/command/command_app.js.coffee:47` | Media parity backlog from Chorus2 source scan. |
| `action:command:command-kodi-audio-clean` | action | `command:kodi:audio:clean` | deferred | R054/M006/S04 | `src/js/apps/command/command_app.js.coffee:72` | Media parity backlog from Chorus2 source scan. |
| `action:command:command-kodi-controller` | action | `command:kodi:controller` | missing | M006/S04 | `src/js/apps/command/command_app.js.coffee:26` | Command/action parity backlog from Chorus2 source scan. |
| `action:command:command-kodi-player` | action | `command:kodi:player` | missing | M006/S04 | `src/js/apps/command/command_app.js.coffee:21` | Command/action parity backlog from Chorus2 source scan. |
| `action:command:command-kodi-video-clean` | action | `command:kodi:video:clean` | missing | M006/S04 | `src/js/apps/command/command_app.js.coffee:76` | Command/action parity backlog from Chorus2 source scan. |
| `action:command:command-local-controller` | action | `command:local:controller` | missing | M006/S04 | `src/js/apps/command/command_app.js.coffee:39` | Command/action parity backlog from Chorus2 source scan. |
| `action:command:command-local-player` | action | `command:local:player` | missing | M006/S04 | `src/js/apps/command/command_app.js.coffee:34` | Command/action parity backlog from Chorus2 source scan. |
| `action:command:command-video-play` | action | `command:video:play` | missing | M006/S04 | `src/js/apps/command/command_app.js.coffee:55` | Command/action parity backlog from Chorus2 source scan. |

## Family: config

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:config:config-app-get` | action | `config:app:get` | missing | M006/S04 | `src/js/entities/config/configApp.js.coffee:34` | Command/action parity backlog from Chorus2 source scan. |
| `action:config:config-app-set` | action | `config:app:set` | missing | M006/S04 | `src/js/entities/config/configApp.js.coffee:43` | Command/action parity backlog from Chorus2 source scan. |
| `action:config:config-static-get` | action | `config:static:get` | missing | M006/S04 | `src/js/entities/config/configApp.js.coffee:54` | Command/action parity backlog from Chorus2 source scan. |
| `action:config:config-static-set` | action | `config:static:set` | missing | M006/S04 | `src/js/entities/config/configApp.js.coffee:60` | Command/action parity backlog from Chorus2 source scan. |

## Family: desc

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:desc:desc` | nav | `desc` | missing | M006/S02 | `src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:11` | Route/menu alias backlog from Chorus2 source scan. |

## Family: en

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:en:en` | nav | `en` | missing | M006/S02 | `src/js/apps/help/help_app.js.coffee:23`<br>`src/js/apps/help/help_app.js.coffee:53` | Route/menu alias backlog from Chorus2 source scan. |

## Family: epg

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:epg:epg` | route | `epg` | deferred | R056/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: episode

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:episode:episode-action` | action | `episode:action` | deferred | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:105` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-action-items` | action | `episode:action:items` | deferred | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:111` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-action-watched` | action | `episode:action:watched` | deferred | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:142` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-build-collection` | action | `episode:build:collection` | deferred | R054/M006/S04 | `src/js/entities/kodi/episode.js.coffee:86` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-edit` | action | `episode:edit` | deferred | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:152` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-entities` | action | `episode:entities` | deferred | R054/M006/S04 | `src/js/entities/kodi/episode.js.coffee:74` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-entity` | action | `episode:entity` | deferred | R054/M006/S04 | `src/js/entities/kodi/episode.js.coffee:70` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-fields` | action | `episode:fields` | deferred | R054/M006/S04 | `src/js/entities/kodi/episode.js.coffee:90` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-list-view` | action | `episode:list:view` | deferred | R054/M006/S04 | `src/js/apps/tvshow/episode/episode_controller.js.coffee:101` | Media parity backlog from Chorus2 source scan. |
| `action:episode:episode-tvshow-entities` | action | `episode:tvshow:entities` | deferred | R054/M006/S04 | `src/js/entities/kodi/episode.js.coffee:78` | Media parity backlog from Chorus2 source scan. |
| `route:episode:tvshow-tvshowid-season-episodeid` | route | `tvshow/:tvshowid/:season/:episodeid` | deferred | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:8` | Media parity backlog from Chorus2 source scan. |

## Family: execute

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:execute:addon-execute-id` | route | `addon/execute/:id` | missing | M006/S02 | `src/js/apps/addon/addon_app.js.coffee:6` | Route/menu alias backlog from Chorus2 source scan. |

## Family: fanarttv

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:fanarttv:fanarttv-artist-image-entities` | action | `fanarttv:artist:image:entities` | deferred | R054/M006/S04 | `src/js/entities/external/fanarttv.js.coffee:75` | Media parity backlog from Chorus2 source scan. |

## Family: file

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:file:file-entities` | action | `file:entities` | missing | M006/S04 | `src/js/entities/kodi/file.js.coffee:249` | Command/action parity backlog from Chorus2 source scan. |
| `action:file:file-entity` | action | `file:entity` | missing | M006/S04 | `src/js/entities/kodi/file.js.coffee:240` | Command/action parity backlog from Chorus2 source scan. |
| `action:file:file-parsed-entities` | action | `file:parsed:entities` | missing | M006/S04 | `src/js/entities/kodi/file.js.coffee:257` | Command/action parity backlog from Chorus2 source scan. |
| `action:file:file-path-entities` | action | `file:path:entities` | missing | M006/S04 | `src/js/entities/kodi/file.js.coffee:253` | Command/action parity backlog from Chorus2 source scan. |
| `action:file:file-source-entities` | action | `file:source:entities` | missing | M006/S04 | `src/js/entities/kodi/file.js.coffee:261` | Command/action parity backlog from Chorus2 source scan. |
| `action:file:file-source-media-entities` | action | `file:source:media:entities` | missing | M006/S04 | `src/js/entities/kodi/file.js.coffee:265` | Command/action parity backlog from Chorus2 source scan. |
| `action:file:file-source-mediatypes` | action | `file:source:mediatypes` | missing | M006/S04 | `src/js/entities/kodi/file.js.coffee:269` | Command/action parity backlog from Chorus2 source scan. |
| `action:file:file-url-entity` | action | `file:url:entity` | missing | M006/S04 | `src/js/entities/kodi/file.js.coffee:244` | Command/action parity backlog from Chorus2 source scan. |
| `nav:file:file` | nav | `file` | missing | M006/S02 | `src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:31` | Route/menu alias backlog from Chorus2 source scan. |

## Family: files

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:files:get-directory` | jsonrpc | `Files.GetDirectory` | missing | M006/S04 | `src/js/entities/kodi/file.js.coffee:194` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:files:get-file-details` | jsonrpc | `Files.GetFileDetails` | missing | M006/S04 | `src/js/entities/kodi/file.js.coffee:184` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:files:get-sources` | jsonrpc | `Files.GetSources` | missing | M006/S04 | `src/js/entities/kodi/file.js.coffee:60` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:files:prepare-download` | jsonrpc | `Files.PrepareDownload` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |

## Family: filter

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:filter:filter-active` | action | `filter:active` | missing | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:410` | Command/action parity backlog from Chorus2 source scan. |
| `action:filter:filter-active-entities` | action | `filter:active:entities` | missing | M006/S04 | `src/js/entities/filter/filter.js.coffee:69` | Command/action parity backlog from Chorus2 source scan. |
| `action:filter:filter-apply-entities` | action | `filter:apply:entities` | missing | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:414` | Command/action parity backlog from Chorus2 source scan. |
| `action:filter:filter-filterable-entities` | action | `filter:filterable:entities` | missing | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:425` | Command/action parity backlog from Chorus2 source scan. |
| `action:filter:filter-filters-entities` | action | `filter:filters:entities` | missing | M006/S04 | `src/js/entities/filter/filter.js.coffee:60` | Command/action parity backlog from Chorus2 source scan. |
| `action:filter:filter-filters-options-entities` | action | `filter:filters:options:entities` | missing | M006/S04 | `src/js/entities/filter/filter.js.coffee:63` | Command/action parity backlog from Chorus2 source scan. |
| `action:filter:filter-init` | action | `filter:init` | missing | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:429` | Command/action parity backlog from Chorus2 source scan. |
| `action:filter:filter-options` | action | `filter:options` | missing | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:399` | Command/action parity backlog from Chorus2 source scan. |
| `action:filter:filter-show` | action | `filter:show` | missing | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:391` | Command/action parity backlog from Chorus2 source scan. |
| `action:filter:filter-sort-entities` | action | `filter:sort:entities` | missing | M006/S04 | `src/js/entities/filter/filter.js.coffee:66` | Command/action parity backlog from Chorus2 source scan. |
| `action:filter:filter-sort-store-get` | action | `filter:sort:store:get` | missing | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:494` | Command/action parity backlog from Chorus2 source scan. |
| `action:filter:filter-sort-store-set` | action | `filter:sort:store:set` | missing | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:490` | Command/action parity backlog from Chorus2 source scan. |
| `action:filter:filter-sortable-entities` | action | `filter:sortable:entities` | missing | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:421` | Command/action parity backlog from Chorus2 source scan. |
| `action:filter:filter-store-get` | action | `filter:store:get` | missing | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:460` | Command/action parity backlog from Chorus2 source scan. |
| `action:filter:filter-store-key-get` | action | `filter:store:key:get` | missing | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:464` | Command/action parity backlog from Chorus2 source scan. |
| `action:filter:filter-store-key-toggle` | action | `filter:store:key:toggle` | missing | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:473` | Command/action parity backlog from Chorus2 source scan. |
| `action:filter:filter-store-key-update` | action | `filter:store:key:update` | missing | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:468` | Command/action parity backlog from Chorus2 source scan. |
| `action:filter:filter-store-set` | action | `filter:store:set` | missing | M006/S04 | `src/js/apps/filter/filter_app.js.coffee:455` | Command/action parity backlog from Chorus2 source scan. |

## Family: filter-layout-close-filters

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:filter-layout-close-filters:filter-layout-close-filters` | nav | `filter:layout:close:filters` | missing | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:17` | Route/menu alias backlog from Chorus2 source scan. |

## Family: filter-layout-close-options

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:filter-layout-close-options:filter-layout-close-options` | nav | `filter:layout:close:options` | missing | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:19` | Route/menu alias backlog from Chorus2 source scan. |

## Family: filter-layout-open-filters

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:filter-layout-open-filters:filter-layout-open-filters` | nav | `filter:layout:open:filters` | missing | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:21` | Route/menu alias backlog from Chorus2 source scan. |

## Family: filter-layout-open-options

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:filter-layout-open-options:filter-layout-open-options` | nav | `filter:layout:open:options` | missing | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:23` | Route/menu alias backlog from Chorus2 source scan. |

## Family: filter-option-deselectall

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:filter-option-deselectall:filter-option-deselectall` | nav | `filter:option:deselectall` | missing | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:97` | Route/menu alias backlog from Chorus2 source scan. |

## Family: filter-remove-all

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:filter-remove-all:filter-remove-all` | nav | `filter:remove:all` | missing | M006/S02 | `src/js/apps/filter/show/show_controller.js.coffee:121` | Route/menu alias backlog from Chorus2 source scan. |

## Family: filtered-page

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:filtered-page:music-genre-filter` | route | `music/genre/:filter` | deferred | R054/M006/S04 | `src/js/apps/landing/landing_app.js.coffee:9` | Media parity backlog from Chorus2 source scan. |

## Family: form

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:form:form-item-entities` | action | `form:item:entities` | missing | M006/S04 | `src/js/entities/form/form.js.coffee:82` | Command/action parity backlog from Chorus2 source scan. |
| `action:form:form-popup-wrapper` | action | `form:popup:wrapper` | missing | M006/S04 | `src/js/components/form/form_controller.js.coffee:50` | Command/action parity backlog from Chorus2 source scan. |
| `action:form:form-render-items` | action | `form:render:items` | missing | M006/S04 | `src/js/components/form/form_controller.js.coffee:41` | Command/action parity backlog from Chorus2 source scan. |
| `action:form:form-value-entities` | action | `form:value:entities` | missing | M006/S04 | `src/js/entities/form/form.js.coffee:86` | Command/action parity backlog from Chorus2 source scan. |
| `action:form:form-wrapper` | action | `form:wrapper` | missing | M006/S04 | `src/js/components/form/form_controller.js.coffee:46` | Command/action parity backlog from Chorus2 source scan. |

## Family: general

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:general:general` | nav | `General` | missing | M006/S02 | `src/js/apps/settings/settings_app.js.coffee:46` | Route/menu alias backlog from Chorus2 source scan. |

## Family: genre

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:genre:genre-entities` | action | `genre:entities` | deferred | R054/M006/S04 | `src/js/entities/kodi/genres.js.coffee:58` | Media parity backlog from Chorus2 source scan. |
| `action:genre:genre-entity` | action | `genre:entity` | deferred | R054/M006/S04 | `src/js/entities/kodi/genres.js.coffee:54` | Media parity backlog from Chorus2 source scan. |

## Family: gui

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:gui:window` | jsonrpc | `GUI.Window` | missing | M006/S04 | `src/js/apps/command/kodi/helpers/gui.coffee:12` | Command/action parity backlog from Chorus2 source scan. |

## Family: help

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:help:help-page` | action | `help:page` | missing | M006/S04 | `src/js/apps/help/help_app.js.coffee:52` | Command/action parity backlog from Chorus2 source scan. |
| `action:help:help-subnav` | action | `help:subnav` | missing | M006/S04 | `src/js/apps/help/help_app.js.coffee:48` | Command/action parity backlog from Chorus2 source scan. |
| `nav:help:help` | nav | `help` | deferred | R057/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:help:help-addons` | nav | `help/addons` | missing | M006/S02 | `src/js/apps/help/help_app.js.coffee:41` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:help:help-app-changelog` | nav | `help/app-changelog` | missing | M006/S02 | `src/js/apps/help/help_app.js.coffee:39` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:help:help-app-readme` | nav | `help/app-readme` | missing | M006/S02 | `src/js/apps/help/help_app.js.coffee:38` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:help:help-developers` | nav | `help/developers` | missing | M006/S02 | `src/js/apps/help/help_app.js.coffee:42` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:help:help-keybind-readme` | nav | `help/keybind-readme` | missing | M006/S02 | `src/js/apps/help/help_app.js.coffee:40` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:help:help-lang-readme` | nav | `help/lang-readme` | missing | M006/S02 | `src/js/apps/help/help_app.js.coffee:43` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:help:help-license` | nav | `help/license` | missing | M006/S02 | `src/js/apps/help/help_app.js.coffee:44` | Route/menu alias backlog from Chorus2 source scan. |
| `route:help:help` | route | `help` | deferred | R057/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: help-overview

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:help-overview:help` | route | `help` | missing | M006/S02 | `src/js/apps/help/help_app.js.coffee:5` | Route/menu alias backlog from Chorus2 source scan. |
| `route:help-overview:help-overview` | route | `help/overview` | missing | M006/S02 | `src/js/apps/help/help_app.js.coffee:6` | Route/menu alias backlog from Chorus2 source scan. |

## Family: help-page

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:help-page:help-id` | route | `help/:id` | missing | M006/S02 | `src/js/apps/help/help_app.js.coffee:7` | Route/menu alias backlog from Chorus2 source scan. |

## Family: home-page

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:home-page:home` | route | `home` | missing | M006/S02 | `src/js/apps/shell/shell_app.js.coffee:6` | Route/menu alias backlog from Chorus2 source scan. |
| `route:home-page:root` | route | `/` | missing | M006/S02 | `src/js/apps/shell/shell_app.js.coffee:5` | Route/menu alias backlog from Chorus2 source scan. |

## Family: icon-browser

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:icon-browser:lab-icon-browser` | route | `lab/icon-browser` | missing | M006/S02 | `src/js/apps/lab/lab_app.js.coffee:22` | Route/menu alias backlog from Chorus2 source scan. |

## Family: images

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:images:images-fanart-set` | action | `images:fanart:set` | deferred | R054/M006/S04 | `src/js/apps/images/images_app.js.coffee:59` | Media parity backlog from Chorus2 source scan. |
| `action:images:images-path-entity` | action | `images:path:entity` | missing | M006/S04 | `src/js/apps/images/images_app.js.coffee:68` | Command/action parity backlog from Chorus2 source scan. |
| `action:images:images-path-get` | action | `images:path:get` | missing | M006/S04 | `src/js/apps/images/images_app.js.coffee:63` | Command/action parity backlog from Chorus2 source scan. |

## Family: input

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:input:input-action` | action | `input:action` | missing | M006/S03 | `src/js/apps/input/input_app.js.coffee:144` | Remote/Input parity backlog from Chorus2 source scan. |
| `action:input:input-remote-toggle` | action | `input:remote:toggle` | missing | M006/S03 | `src/js/apps/input/input_app.js.coffee:141` | Remote/Input parity backlog from Chorus2 source scan. |
| `action:input:input-resume` | action | `input:resume` | missing | M006/S03 | `src/js/apps/input/input_app.js.coffee:147` | Remote/Input parity backlog from Chorus2 source scan. |
| `action:input:input-send` | action | `input:send` | missing | M006/S03 | `src/js/apps/input/input_app.js.coffee:138` | Remote/Input parity backlog from Chorus2 source scan. |
| `action:input:input-textbox` | action | `input:textbox` | missing | M006/S03 | `src/js/apps/input/input_app.js.coffee:130` | Remote/Input parity backlog from Chorus2 source scan. |
| `action:input:input-textbox-close` | action | `input:textbox:close` | missing | M006/S03 | `src/js/apps/input/input_app.js.coffee:135` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:action` | jsonrpc | `Input.Action` | missing | M006/S03 | `src/js/apps/input/input_app.js.coffee:24` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:all` | jsonrpc | `Input.all` | missing | M006/S03 | `src/js/apps/command/kodi/helpers/input.js.coffee:7` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:back` | jsonrpc | `Input.Back` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:input:context-menu` | jsonrpc | `Input.ContextMenu` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:input:down` | jsonrpc | `Input.Down` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:input:execute-action` | jsonrpc | `Input.ExecuteAction` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:input:google` | jsonrpc | `Input.google` | missing | M006/S03 | `src/js/apps/command/kodi/helpers/input.js.coffee:7` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:home` | jsonrpc | `Input.Home` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:input:imdb` | jsonrpc | `Input.imdb` | missing | M006/S03 | `src/js/apps/command/kodi/helpers/input.js.coffee:7` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:info` | jsonrpc | `Input.Info` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:input:left` | jsonrpc | `Input.Left` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:input:on-input-finished` | jsonrpc | `Input.OnInputFinished` | missing | M006/S03 | `src/js/apps/state/kodi/notifications.js.coffee:215` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:on-input-requested` | jsonrpc | `Input.OnInputRequested` | missing | M006/S03 | `src/js/apps/state/kodi/notifications.js.coffee:197` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:right` | jsonrpc | `Input.Right` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:input:select` | jsonrpc | `Input.Select` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:input:send-text` | jsonrpc | `Input.SendText` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:input:soundcloud` | jsonrpc | `Input.soundcloud` | missing | M006/S03 | `src/js/apps/command/kodi/helpers/input.js.coffee:7` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:stop` | jsonrpc | `Input.Stop` | missing | M006/S03 | `src/js/apps/command/kodi/helpers/input.js.coffee:7` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:tmdb` | jsonrpc | `Input.tmdb` | missing | M006/S03 | `src/js/apps/command/kodi/helpers/input.js.coffee:7` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:tvdb` | jsonrpc | `Input.tvdb` | missing | M006/S03 | `src/js/apps/command/kodi/helpers/input.js.coffee:7` | Remote/Input parity backlog from Chorus2 source scan. |
| `jsonrpc:input:up` | jsonrpc | `Input.Up` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:input:remote` | route | `remote` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: introspect

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:introspect:introspect-dictionary` | action | `introspect:dictionary` | missing | M006/S04 | `src/js/entities/lab/apiBrowser.js.coffee:89` | Command/action parity backlog from Chorus2 source scan. |
| `action:introspect:introspect-entities` | action | `introspect:entities` | missing | M006/S04 | `src/js/entities/lab/apiBrowser.js.coffee:85` | Command/action parity backlog from Chorus2 source scan. |
| `action:introspect:introspect-entity` | action | `introspect:entity` | missing | M006/S04 | `src/js/entities/lab/apiBrowser.js.coffee:81` | Command/action parity backlog from Chorus2 source scan. |

## Family: jsonrpc

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:jsonrpc:get-active-players` | jsonrpc | `JSONRPC.GetActivePlayers` | missing | M006/S04 | `src/js/apps/command/kodi/_base/api.js.coffee:103`<br>`src/js/apps/command/kodi/_base/api.js.coffee:37`<br>`src/js/apps/command/kodi/_base/api.js.coffee:71` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:jsonrpc:get-item` | jsonrpc | `JSONRPC.GetItem` | missing | M006/S04 | `src/js/apps/command/kodi/_base/api.js.coffee:110`<br>`src/js/apps/command/kodi/_base/api.js.coffee:37` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:jsonrpc:get-properties` | jsonrpc | `JSONRPC.GetProperties` | missing | M006/S04 | `src/js/apps/command/kodi/_base/api.js.coffee:109`<br>`src/js/apps/command/kodi/_base/api.js.coffee:37` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:jsonrpc:introspect` | jsonrpc | `JSONRPC.Introspect` | missing | M006/S04 | `src/js/entities/lab/apiBrowser.js.coffee:66` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:jsonrpc:ping` | jsonrpc | `JSONRPC.Ping` | missing | M006/S04 | `src/js/helpers/connection.js.coffee:28` | Command/action parity backlog from Chorus2 source scan. |

## Family: kodi

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:kodi:settings-kodi` | route | `settings/kodi` | missing | M006/S02 | `src/js/apps/settings/settings_app.js.coffee:6` | Route/menu alias backlog from Chorus2 source scan. |
| `route:kodi:settings-kodi-section` | route | `settings/kodi/:section` | missing | M006/S02 | `src/js/apps/settings/settings_app.js.coffee:7` | Route/menu alias backlog from Chorus2 source scan. |

## Family: lab

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:lab:lab-api-browser` | route | `lab/api-browser` | implemented | M006/S01 | `src/lib/app/appRouter.ts` |  |
| `route:lab:lab-edge` | route | `lab/*` | deferred | R057/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:lab:lab-shortcuts` | route | `lab/shortcuts` | implemented | M006/S01 | `src/lib/app/appRouter.ts` |  |

## Family: lab-landing

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:lab-landing:lab` | route | `lab` | missing | M006/S02 | `src/js/apps/lab/lab_app.js.coffee:18` | Route/menu alias backlog from Chorus2 source scan. |

## Family: landing

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:landing:landing` | route | `landing` | implemented | M006/S01 | `src/lib/app/appRouter.ts` |  |

## Family: landing-page

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:landing-page:movies-recent` | route | `movies/recent` | deferred | R054/M006/S04 | `src/js/apps/landing/landing_app.js.coffee:7` | Media parity backlog from Chorus2 source scan. |
| `route:landing-page:music` | route | `music` | deferred | R054/M006/S04 | `src/js/apps/landing/landing_app.js.coffee:5` | Media parity backlog from Chorus2 source scan. |
| `route:landing-page:music-top` | route | `music/top` | deferred | R054/M006/S04 | `src/js/apps/landing/landing_app.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `route:landing-page:tvshows-recent` | route | `tvshows/recent` | deferred | R054/M006/S04 | `src/js/apps/landing/landing_app.js.coffee:8` | Media parity backlog from Chorus2 source scan. |

## Family: landing-set-more

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:landing-set-more:landing-set-more` | nav | `landing:set:more` | missing | M006/S02 | `src/js/apps/landing/show/landing_controller.js.coffee:60` | Route/menu alias backlog from Chorus2 source scan. |

## Family: library

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:library:library-write-commands` | action | `library write commands` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: list

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:list:addons-type` | route | `addons/:type` | missing | M006/S02 | `src/js/apps/addon/addon_app.js.coffee:5` | Route/menu alias backlog from Chorus2 source scan. |
| `route:list:browser` | route | `browser` | missing | M006/S02 | `src/js/apps/browser/browser_app.js.coffee:5` | Route/menu alias backlog from Chorus2 source scan. |
| `route:list:movies` | route | `movies` | deferred | R054/M006/S04 | `src/js/apps/movie/movie_app.js.coffee:5` | Media parity backlog from Chorus2 source scan. |
| `route:list:music-albums` | route | `music/albums` | deferred | R054/M006/S04 | `src/js/apps/album/album_app.js.coffee:5` | Media parity backlog from Chorus2 source scan. |
| `route:list:music-artists` | route | `music/artists` | deferred | R054/M006/S04 | `src/js/apps/artist/artist_app.js.coffee:5` | Media parity backlog from Chorus2 source scan. |
| `route:list:music-videos` | route | `music/videos` | deferred | R054/M006/S04 | `src/js/apps/musicvideo/musicvideo_app.js.coffee:5` | Media parity backlog from Chorus2 source scan. |
| `route:list:playlist` | route | `playlist` | deferred | R055/M006/S04 | `src/js/apps/playlist/playlist_app.js.coffee:5` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `route:list:playlist-id` | route | `playlist/:id` | deferred | R055/M006/S04 | `src/js/apps/localPlaylist/localPlaylist_app.js.coffee:6` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `route:list:playlists` | route | `playlists` | deferred | R055/M006/S04 | `src/js/apps/localPlaylist/localPlaylist_app.js.coffee:5` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `route:list:search-media-query` | route | `search/:media/:query` | missing | M006/S02 | `src/js/apps/search/search_app.js.coffee:6` | Route/menu alias backlog from Chorus2 source scan. |
| `route:list:thumbsup` | route | `thumbsup` | deferred | R055/M006/S04 | `src/js/apps/thumbs/thumbs_app.js.coffee:5` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `route:list:tvshows` | route | `tvshows` | deferred | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:5` | Media parity backlog from Chorus2 source scan. |

## Family: loading

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:loading:loading-get-view` | action | `loading:get:view` | missing | M006/S04 | `src/js/apps/loading/loading_app.js.coffee:20` | Command/action parity backlog from Chorus2 source scan. |
| `action:loading:loading-show-page` | action | `loading:show:page` | missing | M006/S04 | `src/js/apps/loading/loading_app.js.coffee:16` | Command/action parity backlog from Chorus2 source scan. |
| `action:loading:loading-show-view` | action | `loading:show:view` | missing | M006/S04 | `src/js/apps/loading/loading_app.js.coffee:11` | Command/action parity backlog from Chorus2 source scan. |

## Family: local

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:local:settings-web` | route | `settings/web` | missing | M006/S02 | `src/js/apps/settings/settings_app.js.coffee:5` | Route/menu alias backlog from Chorus2 source scan. |

## Family: local-playlist

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:local-playlist:localplaylist` | route | `localPlaylist` | deferred | R055/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: localplayer

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:localplayer:localplayer-clear-entities` | action | `localplayer:clear:entities` | deferred | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:206` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplayer:localplayer-get-entities` | action | `localplayer:get:entities` | deferred | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:202` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplayer:localplayer-item-add-entities` | action | `localplayer:item:add:entities` | deferred | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:210` | Playlist/local-player parity backlog from Chorus2 source scan. |

## Family: localplaylist

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:localplaylist:localplaylist-add-entity` | action | `localplaylist:add:entity` | deferred | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:124` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-addentity` | action | `localplaylist:addentity` | deferred | R055/M006/S04 | `src/js/apps/localPlaylist/localPlaylist_app.js.coffee:101` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-clear-entities` | action | `localplaylist:clear:entities` | deferred | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:138` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-entities` | action | `localplaylist:entities` | deferred | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:134` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-entity` | action | `localplaylist:entity` | deferred | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:142` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-item-add-entities` | action | `localplaylist:item:add:entities` | deferred | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:151` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-item-entities` | action | `localplaylist:item:entities` | deferred | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:147` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-item-updateorder` | action | `localplaylist:item:updateorder` | deferred | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:156` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-newlist` | action | `localplaylist:newlist` | deferred | R055/M006/S04 | `src/js/apps/localPlaylist/localPlaylist_app.js.coffee:104` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-reload` | action | `localplaylist:reload` | deferred | R055/M006/S04 | `src/js/apps/localPlaylist/localPlaylist_app.js.coffee:107` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-remove-entity` | action | `localplaylist:remove:entity` | deferred | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:128` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:localplaylist:localplaylist-rename` | action | `localplaylist:rename` | deferred | R055/M006/S04 | `src/js/apps/localPlaylist/localPlaylist_app.js.coffee:110` | Playlist/local-player parity backlog from Chorus2 source scan. |

## Family: movie

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:movie:movie-action` | action | `movie:action` | deferred | R054/M006/S04 | `src/js/apps/movie/movie_app.js.coffee:47` | Media parity backlog from Chorus2 source scan. |
| `action:movie:movie-action-items` | action | `movie:action:items` | deferred | R054/M006/S04 | `src/js/apps/movie/movie_app.js.coffee:41` | Media parity backlog from Chorus2 source scan. |
| `action:movie:movie-action-watched` | action | `movie:action:watched` | deferred | R054/M006/S04 | `src/js/apps/movie/movie_app.js.coffee:50` | Media parity backlog from Chorus2 source scan. |
| `action:movie:movie-build-collection` | action | `movie:build:collection` | deferred | R054/M006/S04 | `src/js/entities/kodi/movie.js.coffee:72` | Media parity backlog from Chorus2 source scan. |
| `action:movie:movie-edit` | action | `movie:edit` | deferred | R054/M006/S04 | `src/js/apps/movie/movie_app.js.coffee:58` | Media parity backlog from Chorus2 source scan. |
| `action:movie:movie-entities` | action | `movie:entities` | deferred | R054/M006/S04 | `src/js/entities/kodi/movie.js.coffee:68` | Media parity backlog from Chorus2 source scan. |
| `action:movie:movie-entity` | action | `movie:entity` | deferred | R054/M006/S04 | `src/js/entities/kodi/movie.js.coffee:64` | Media parity backlog from Chorus2 source scan. |
| `action:movie:movie-fields` | action | `movie:fields` | deferred | R054/M006/S04 | `src/js/entities/kodi/movie.js.coffee:76` | Media parity backlog from Chorus2 source scan. |
| `action:movie:movie-list-view` | action | `movie:list:view` | deferred | R054/M006/S04 | `src/js/apps/movie/list/list_controller.js.coffee:77` | Media parity backlog from Chorus2 source scan. |
| `nav:movie:movies` | nav | `movies` | missing | M006/S02 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:movie:movies-recent` | nav | `movies/recent` | missing | M006/S02 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:movie:movies` | route | `movies` | missing | M006/S02 | `src/lib/video/videoRouter.ts` | Current parser supports video/movies, not the Chorus2 movies alias. |
| `route:movie:video-movies` | route | `video/movies` | implemented | M006/S01 | `src/lib/video/videoRouter.ts` |  |

## Family: movies

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:movies:movies` | nav | `movies` | deferred | R054/M006/S04 | `src/js/entities/nav/navMain.js.coffee:29` | Media parity backlog from Chorus2 source scan. |
| `nav:movies:movies-recent` | nav | `movies/recent` | deferred | R054/M006/S04 | `src/js/entities/nav/navMain.js.coffee:27`<br>`src/js/entities/nav/navMain.js.coffee:28` | Media parity backlog from Chorus2 source scan. |

## Family: music

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:music:music` | nav | `music` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:music:music-albums` | nav | `music/albums` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:music:music-artists` | nav | `music/artists` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:music:music-genres` | nav | `music/genres` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:music:music-top` | nav | `music/top` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:music:music-videos` | nav | `music/videos` | deferred | R054/M006/S04 | `src/js/entities/nav/navMain.js.coffee:24` | Media parity backlog from Chorus2 source scan. |

## Family: music-genres

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:music-genres:music-genres` | route | `music/genres` | deferred | R054/M006/S04 | `src/js/apps/category/category_app.js.coffee:7` | Media parity backlog from Chorus2 source scan. |

## Family: musicbrainz

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:musicbrainz:musicbrainz-artist-entity` | action | `musicbrainz:artist:entity` | deferred | R054/M006/S04 | `src/js/entities/external/musicbrainz.js.coffee:38` | Media parity backlog from Chorus2 source scan. |

## Family: musicvideo

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:musicvideo:musicvideo-action` | action | `musicvideo:action` | deferred | R054/M006/S04 | `src/js/apps/musicvideo/musicvideo_app.js.coffee:42` | Media parity backlog from Chorus2 source scan. |
| `action:musicvideo:musicvideo-action-items` | action | `musicvideo:action:items` | deferred | R054/M006/S04 | `src/js/apps/musicvideo/musicvideo_app.js.coffee:45` | Media parity backlog from Chorus2 source scan. |
| `action:musicvideo:musicvideo-build-collection` | action | `musicvideo:build:collection` | deferred | R054/M006/S04 | `src/js/entities/kodi/musicvideo.js.coffee:74` | Media parity backlog from Chorus2 source scan. |
| `action:musicvideo:musicvideo-edit` | action | `musicvideo:edit` | deferred | R054/M006/S04 | `src/js/apps/musicvideo/musicvideo_app.js.coffee:58` | Media parity backlog from Chorus2 source scan. |
| `action:musicvideo:musicvideo-entities` | action | `musicvideo:entities` | deferred | R054/M006/S04 | `src/js/entities/kodi/musicvideo.js.coffee:66` | Media parity backlog from Chorus2 source scan. |
| `action:musicvideo:musicvideo-entity` | action | `musicvideo:entity` | deferred | R054/M006/S04 | `src/js/entities/kodi/musicvideo.js.coffee:62` | Media parity backlog from Chorus2 source scan. |
| `action:musicvideo:musicvideo-fields` | action | `musicvideo:fields` | deferred | R054/M006/S04 | `src/js/entities/kodi/musicvideo.js.coffee:70` | Media parity backlog from Chorus2 source scan. |
| `action:musicvideo:musicvideo-list-view` | action | `musicvideo:list:view` | deferred | R054/M006/S04 | `src/js/apps/musicvideo/list/list_controller.js.coffee:76` | Media parity backlog from Chorus2 source scan. |
| `nav:musicvideo:music-videos` | nav | `music/videos` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:musicvideo:music-videos` | route | `music/videos` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: nav-main

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:nav-main:nav-main-array-entities` | action | `navMain:array:entities` | missing | M006/S04 | `src/js/entities/nav/navMain.js.coffee:179` | Command/action parity backlog from Chorus2 source scan. |
| `action:nav-main:nav-main-children-show` | action | `navMain:children:show` | missing | M006/S04 | `src/js/apps/navMain/navMain_app.js.coffee:29` | Command/action parity backlog from Chorus2 source scan. |
| `action:nav-main:nav-main-collection-show` | action | `navMain:collection:show` | missing | M006/S04 | `src/js/apps/navMain/navMain_app.js.coffee:32` | Command/action parity backlog from Chorus2 source scan. |
| `action:nav-main:nav-main-entities` | action | `navMain:entities` | missing | M006/S04 | `src/js/entities/nav/navMain.js.coffee:171` | Command/action parity backlog from Chorus2 source scan. |
| `action:nav-main:nav-main-update-defaults` | action | `navMain:update:defaults` | missing | M006/S04 | `src/js/entities/nav/navMain.js.coffee:190` | Command/action parity backlog from Chorus2 source scan. |
| `action:nav-main:nav-main-update-entities` | action | `navMain:update:entities` | missing | M006/S04 | `src/js/entities/nav/navMain.js.coffee:186` | Command/action parity backlog from Chorus2 source scan. |
| `route:nav-main:settings-nav` | route | `settings/nav` | missing | M006/S02 | `src/js/apps/settings/settings_app.js.coffee:9` | Route/menu alias backlog from Chorus2 source scan. |

## Family: notification

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:notification:notification-show` | action | `notification:show` | missing | M006/S04 | `src/js/apps/notifications/notifications_app.js.coffee:7` | Command/action parity backlog from Chorus2 source scan. |

## Family: play

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:play:play` | nav | `play` | missing | M006/S02 | `src/js/apps/epg/list/list_controller.js.coffee:15`<br>`src/js/apps/epg/list/list_controller.js.coffee:7` | Route/menu alias backlog from Chorus2 source scan. |

## Family: play-list

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:play-list:play-list` | nav | `PlayList` | deferred | R055/M006/S04 | `src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:33` | Playlist/local-player parity backlog from Chorus2 source scan. |

## Family: player

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:player:playback-commands` | action | `playback commands` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `action:player:player-kodi-progress-update` | action | `player:kodi:progress:update` | missing | M006/S04 | `src/js/apps/player/player_app.js.coffee:176` | Command/action parity backlog from Chorus2 source scan. |
| `action:player:player-kodi-timer` | action | `player:kodi:timer` | deferred | R056/M006/S04 | `src/js/apps/player/player_app.js.coffee:163`<br>`src/js/apps/state/kodi/kodi.js.coffee:30`<br>`src/js/apps/state/kodi/kodi.js.coffee:59` | PVR parity backlog from Chorus2 source scan. |
| `action:player:player-local-progress-update` | action | `player:local:progress:update` | missing | M006/S04 | `src/js/apps/player/player_app.js.coffee:172` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:player:get-active-players` | jsonrpc | `Player.GetActivePlayers` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:player:get-item` | jsonrpc | `Player.GetItem` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:player:get-properties` | jsonrpc | `Player.GetProperties` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:player:go-to` | jsonrpc | `Player.GoTo` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:player:on-pause` | jsonrpc | `Player.OnPause` | missing | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:129` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:player:on-play` | jsonrpc | `Player.OnPlay` | missing | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:105` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:player:on-property-changed` | jsonrpc | `Player.OnPropertyChanged` | missing | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:125` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:player:on-resume` | jsonrpc | `Player.OnResume` | missing | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:112` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:player:on-seek` | jsonrpc | `Player.OnSeek` | missing | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:136` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:player:on-stop` | jsonrpc | `Player.OnStop` | missing | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:119` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:player:play-pause` | jsonrpc | `Player.PlayPause` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:player:seek` | jsonrpc | `Player.Seek` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:player:set-repeat` | jsonrpc | `Player.SetRepeat` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:player:set-shuffle` | jsonrpc | `Player.SetShuffle` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:player:stop` | jsonrpc | `Player.Stop` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `nav:player:player` | nav | `Player` | missing | M006/S02 | `src/js/apps/pvr/channelList/channel_list_controller.js.coffee:30` | Route/menu alias backlog from Chorus2 source scan. |

## Family: playlist

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:playlist:playlist-commands` | action | `playlist commands` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `action:playlist:playlist-export` | action | `playlist:export` | deferred | R055/M006/S04 | `src/js/apps/playlist/playlist_app.js.coffee:35` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:playlist:playlist-kodi-entities` | action | `playlist:kodi:entities` | deferred | R055/M006/S04 | `src/js/entities/kodi/playlist.js.coffee:92` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:playlist:playlist-kodi-entity-api` | action | `playlist:kodi:entity:api` | deferred | R055/M006/S04 | `src/js/entities/kodi/playlist.js.coffee:102` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:playlist:playlist-list` | action | `playlist:list` | deferred | R055/M006/S04 | `src/js/apps/playlist/playlist_app.js.coffee:31` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:playlist:playlist-local-partymode` | action | `playlist:local:partymode` | deferred | R055/M006/S04 | `src/js/apps/playlist/localParty/local_party.js.coffee:60` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:playlist:playlist-refresh` | action | `playlist:refresh` | deferred | R055/M006/S04 | `src/js/apps/playlist/playlist_app.js.coffee:49` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `jsonrpc:playlist:clear` | jsonrpc | `Playlist.Clear` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:playlist:get-items` | jsonrpc | `Playlist.GetItems` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:playlist:insert` | jsonrpc | `Playlist.Insert` | missing | M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:playlist:on-add` | jsonrpc | `Playlist.OnAdd` | deferred | R055/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:142` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `jsonrpc:playlist:on-clear` | jsonrpc | `Playlist.OnClear` | deferred | R055/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:142` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `jsonrpc:playlist:on-remove` | jsonrpc | `Playlist.OnRemove` | deferred | R055/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:142` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `jsonrpc:playlist:remove` | jsonrpc | `Playlist.Remove` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `nav:playlist:playlists` | nav | `playlists` | deferred | R055/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:playlist:playlists` | route | `playlists` | deferred | R055/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: playlists

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:playlists:playlists` | nav | `playlists` | deferred | R055/M006/S04 | `src/js/entities/nav/navMain.js.coffee:58` | Playlist/local-player parity backlog from Chorus2 source scan. |

## Family: pvr

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:pvr:pvr-commands` | action | `PVR commands` | deferred | R056/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:pvr:add-timer` | jsonrpc | `PVR.AddTimer` | deferred | R056/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:pvr:channel-list` | jsonrpc | `PVR.ChannelList` | deferred | R056/M006/S04 | `src/js/apps/pvr/channelList/channel_list_controller.js.coffee:1`<br>`src/js/apps/pvr/channelList/channel_list_view.js.coffee:1` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:channel-list-controller` | jsonrpc | `PVR.ChannelList.Controller` | deferred | R056/M006/S04 | `src/js/apps/pvr/pvr_app.js.coffee:12`<br>`src/js/apps/pvr/pvr_app.js.coffee:16` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:delete-timer` | jsonrpc | `PVR.DeleteTimer` | deferred | R056/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:pvr:get-broadcasts` | jsonrpc | `PVR.GetBroadcasts` | deferred | R056/M006/S04 | `src/js/entities/kodi/epg.js.coffee:38`<br>`src/js/entities/kodi/epg.js.coffee:48` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:get-channel-details` | jsonrpc | `PVR.GetChannelDetails` | deferred | R056/M006/S04 | `src/js/entities/kodi/pvr.js.coffee:59` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:get-channels` | jsonrpc | `PVR.GetChannels` | deferred | R056/M006/S04 | `src/js/entities/kodi/pvr.js.coffee:69` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:get-recording-details` | jsonrpc | `PVR.GetRecordingDetails` | deferred | R056/M006/S04 | `src/js/entities/kodi/pvr.js.coffee:82` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:get-recordings` | jsonrpc | `PVR.GetRecordings` | deferred | R056/M006/S04 | `src/js/entities/kodi/pvr.js.coffee:91` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:record` | jsonrpc | `PVR.Record` | deferred | R056/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:pvr:recording-list` | jsonrpc | `PVR.RecordingList` | deferred | R056/M006/S04 | `src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:1`<br>`src/js/apps/pvr/recordingList/recording_list_view.js.coffee:1` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:recording-list-controller` | jsonrpc | `PVR.RecordingList.Controller` | deferred | R056/M006/S04 | `src/js/apps/pvr/pvr_app.js.coffee:20` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:router` | jsonrpc | `PVR.Router` | deferred | R056/M006/S04 | `src/js/apps/pvr/pvr_app.js.coffee:24`<br>`src/js/apps/pvr/pvr_app.js.coffee:3` | PVR parity backlog from Chorus2 source scan. |
| `jsonrpc:pvr:toggle-timer` | jsonrpc | `PVR.ToggleTimer` | deferred | R056/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:pvr:pvr` | nav | `PVR` | deferred | R056/M006/S04 | `src/js/apps/epg/list/list_controller.js.coffee:53`<br>`src/js/apps/pvr/channelList/channel_list_controller.js.coffee:34`<br>`src/js/apps/pvr/channelList/channel_list_controller.js.coffee:40`<br>`src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:38` | PVR parity backlog from Chorus2 source scan. |
| `nav:pvr:pvr-radio` | nav | `pvr/radio` | deferred | R056/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:pvr:pvr-recordings` | nav | `pvr/recordings` | deferred | R056/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:pvr:pvr-tv` | nav | `pvr/tv` | deferred | R056/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:pvr:pvr` | route | `pvr` | deferred | R056/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: radio

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:radio:pvr-radio` | route | `pvr/radio` | deferred | R056/M006/S04 | `src/js/apps/pvr/pvr_app.js.coffee:6` | PVR parity backlog from Chorus2 source scan. |
| `route:radio:pvr-radio-channelid` | route | `pvr/radio/:channelid` | deferred | R056/M006/S04 | `src/js/apps/epg/epg_app.js.coffee:6` | PVR parity backlog from Chorus2 source scan. |

## Family: record

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:record:record` | nav | `record` | deferred | R056/M006/S04 | `src/js/apps/epg/list/list_controller.js.coffee:17`<br>`src/js/apps/epg/list/list_controller.js.coffee:9` | PVR parity backlog from Chorus2 source scan. |

## Family: recording

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:recording:recording-entities` | action | `recording:entities` | deferred | R056/M006/S04 | `src/js/entities/kodi/pvr.js.coffee:117` | PVR parity backlog from Chorus2 source scan. |
| `action:recording:recording-entity` | action | `recording:entity` | deferred | R056/M006/S04 | `src/js/entities/kodi/pvr.js.coffee:113` | PVR parity backlog from Chorus2 source scan. |

## Family: recordings

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:recordings:pvr-recordings` | route | `pvr/recordings` | deferred | R056/M006/S04 | `src/js/apps/pvr/pvr_app.js.coffee:7` | PVR parity backlog from Chorus2 source scan. |

## Family: remote

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:remote:input-remote-controls` | action | `input remote controls` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `control:remote:all` | control | `all` | missing | M006/S03 | `src/js/helpers/entities.js.coffee:74` | Remote/Input parity backlog from Chorus2 source scan. |
| `control:remote:back` | control | `back` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `control:remote:context-menu` | control | `ContextMenu` | missing | M006/S03 | `src/js/apps/input/remote/tpl/remote_control.jst.eco:19` | Remote/Input parity backlog from Chorus2 source scan. |
| `control:remote:contextmenu` | control | `contextmenu` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `control:remote:down` | control | `down` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `control:remote:executeaction` | control | `executeaction` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `control:remote:google` | control | `google` | missing | M006/S03 | `src/js/apps/album/show/tpl/details_meta.jst.eco:47`<br>`src/js/apps/artist/show/tpl/details_meta.jst.eco:51`<br>`src/js/apps/movie/show/tpl/details_meta.jst.eco:77`<br>`src/js/apps/musicvideo/show/tpl/details_meta.jst.eco:50`<br>`src/js/apps/tvshow/episode/tpl/details_meta.jst.eco:83`<br>`src/js/apps/tvshow/show/tpl/details_meta.jst.eco:45` | Remote/Input parity backlog from Chorus2 source scan. |
| `control:remote:home` | control | `home` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `control:remote:imdb` | control | `imdb` | missing | M006/S03 | `src/js/apps/movie/show/tpl/details_meta.jst.eco:78`<br>`src/js/apps/tvshow/episode/tpl/details_meta.jst.eco:84`<br>`src/js/apps/tvshow/show/tpl/details_meta.jst.eco:46` | Remote/Input parity backlog from Chorus2 source scan. |
| `control:remote:info` | control | `info` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `control:remote:left` | control | `left` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `control:remote:osd` | control | `osd` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `control:remote:playpause` | control | `playpause` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `control:remote:right` | control | `right` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `control:remote:select` | control | `select` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `control:remote:sendtext` | control | `sendtext` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `control:remote:soundcloud` | control | `soundcloud` | missing | M006/S03 | `src/js/apps/album/show/tpl/details_meta.jst.eco:48`<br>`src/js/apps/artist/show/tpl/details_meta.jst.eco:52` | Remote/Input parity backlog from Chorus2 source scan. |
| `control:remote:stop` | control | `stop` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `control:remote:tmdb` | control | `tmdb` | missing | M006/S03 | `src/js/apps/movie/show/tpl/details_meta.jst.eco:79`<br>`src/js/apps/tvshow/episode/tpl/details_meta.jst.eco:86`<br>`src/js/apps/tvshow/show/tpl/details_meta.jst.eco:48` | Remote/Input parity backlog from Chorus2 source scan. |
| `control:remote:tvdb` | control | `tvdb` | missing | M006/S03 | `src/js/apps/tvshow/episode/tpl/details_meta.jst.eco:85`<br>`src/js/apps/tvshow/show/tpl/details_meta.jst.eco:47` | Remote/Input parity backlog from Chorus2 source scan. |
| `control:remote:up` | control | `up` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `control:remote:volumedown` | control | `volumedown` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |
| `control:remote:volumeup` | control | `volumeup` | missing | M006/S03 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: remote-page

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:remote-page:remote` | route | `remote` | missing | M006/S02 | `src/js/apps/input/input_app.js.coffee:6` | Route/menu alias backlog from Chorus2 source scan. |

## Family: screen-shot

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:screen-shot:lab-screenshot` | route | `lab/screenshot` | missing | M006/S02 | `src/js/apps/lab/lab_app.js.coffee:21` | Route/menu alias backlog from Chorus2 source scan. |

## Family: search

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:search:search-go` | action | `search:go` | missing | M006/S04 | `src/js/apps/search/search_app.js.coffee:51` | Command/action parity backlog from Chorus2 source scan. |
| `route:search:search` | route | `search` | deferred | R057/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:search:settings-search` | route | `settings/search` | missing | M006/S02 | `src/js/apps/settings/settings_app.js.coffee:10` | Route/menu alias backlog from Chorus2 source scan. |

## Family: search-addons

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:search-addons:search-addons-entities` | action | `searchAddons:entities` | missing | M006/S04 | `src/js/entities/search/searchAddons.js.coffee:41` | Command/action parity backlog from Chorus2 source scan. |
| `action:search-addons:search-addons-update-defaults` | action | `searchAddons:update:defaults` | missing | M006/S04 | `src/js/entities/search/searchAddons.js.coffee:49` | Command/action parity backlog from Chorus2 source scan. |
| `action:search-addons:search-addons-update-entities` | action | `searchAddons:update:entities` | missing | M006/S04 | `src/js/entities/search/searchAddons.js.coffee:45` | Command/action parity backlog from Chorus2 source scan. |

## Family: season

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:season:season-entities` | action | `season:entities` | deferred | R054/M006/S04 | `src/js/entities/kodi/season.js.coffee:63` | Media parity backlog from Chorus2 source scan. |
| `action:season:season-entity` | action | `season:entity` | deferred | R054/M006/S04 | `src/js/entities/kodi/season.js.coffee:59` | Media parity backlog from Chorus2 source scan. |
| `action:season:season-fields` | action | `season:fields` | deferred | R054/M006/S04 | `src/js/entities/kodi/season.js.coffee:68` | Media parity backlog from Chorus2 source scan. |
| `action:season:season-list-view` | action | `season:list:view` | deferred | R054/M006/S04 | `src/js/apps/tvshow/season/season_controller.js.coffee:82` | Media parity backlog from Chorus2 source scan. |
| `route:season:tvshow-tvshowid-season` | route | `tvshow/:tvshowid/:season` | deferred | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:7` | Media parity backlog from Chorus2 source scan. |

## Family: sections

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:sections:sections` | nav | `Sections` | missing | M006/S02 | `src/js/apps/category/list/list_controller.js.coffee:28`<br>`src/js/apps/filter/show/show_controller.js.coffee:145`<br>`src/js/apps/landing/show/landing_controller.js.coffee:29` | Route/menu alias backlog from Chorus2 source scan. |

## Family: selected

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:selected:selected-action-add` | action | `selected:action:add` | missing | M006/S04 | `src/js/apps/selected/selected_app.js.coffee:103` | Command/action parity backlog from Chorus2 source scan. |
| `action:selected:selected-action-localadd` | action | `selected:action:localadd` | missing | M006/S04 | `src/js/apps/selected/selected_app.js.coffee:110` | Command/action parity backlog from Chorus2 source scan. |
| `action:selected:selected-action-play` | action | `selected:action:play` | missing | M006/S04 | `src/js/apps/selected/selected_app.js.coffee:96` | Command/action parity backlog from Chorus2 source scan. |
| `action:selected:selected-clear-items` | action | `selected:clear:items` | missing | M006/S04 | `src/js/apps/selected/selected_app.js.coffee:88` | Command/action parity backlog from Chorus2 source scan. |
| `action:selected:selected-get-items` | action | `selected:get:items` | missing | M006/S04 | `src/js/apps/selected/selected_app.js.coffee:76` | Command/action parity backlog from Chorus2 source scan. |
| `action:selected:selected-get-media` | action | `selected:get:media` | missing | M006/S04 | `src/js/apps/selected/selected_app.js.coffee:80` | Command/action parity backlog from Chorus2 source scan. |
| `action:selected:selected-set-media` | action | `selected:set:media` | missing | M006/S04 | `src/js/apps/selected/selected_app.js.coffee:92` | Command/action parity backlog from Chorus2 source scan. |
| `action:selected:selected-update-items` | action | `selected:update:items` | missing | M006/S04 | `src/js/apps/selected/selected_app.js.coffee:84` | Command/action parity backlog from Chorus2 source scan. |

## Family: settings

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:settings:settings-kodi-entities` | action | `settings:kodi:entities` | missing | M006/S04 | `src/js/entities/kodi/settings.js.coffee:132` | Command/action parity backlog from Chorus2 source scan. |
| `action:settings:settings-kodi-filtered-entities` | action | `settings:kodi:filtered:entities` | missing | M006/S04 | `src/js/entities/kodi/settings.js.coffee:136` | Command/action parity backlog from Chorus2 source scan. |
| `action:settings:settings-kodi-save-entities` | action | `settings:kodi:save:entities` | missing | M006/S04 | `src/js/entities/kodi/settings.js.coffee:141` | Command/action parity backlog from Chorus2 source scan. |
| `action:settings:settings-subnav` | action | `settings:subnav` | missing | M006/S04 | `src/js/apps/settings/settings_app.js.coffee:56` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:settings:get-categories` | jsonrpc | `Settings.GetCategories` | missing | M006/S04 | `src/js/entities/kodi/settings.js.coffee:109` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:settings:get-sections` | jsonrpc | `Settings.GetSections` | missing | M006/S04 | `src/js/entities/kodi/settings.js.coffee:101` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:settings:get-settings` | jsonrpc | `Settings.GetSettings` | missing | M006/S04 | `src/js/entities/kodi/settings.js.coffee:120`<br>`src/js/entities/kodi/settings.js.coffee:47` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:settings:set-setting-value` | jsonrpc | `Settings.SetSettingValue` | missing | M006/S04 | `src/js/entities/kodi/settings.js.coffee:76` | Command/action parity backlog from Chorus2 source scan. |
| `nav:settings:settings-addons` | nav | `settings/addons` | missing | M006/S02 | `src/js/entities/nav/navMain.js.coffee:52`<br>`src/js/entities/nav/navMain.js.coffee:64` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:settings:settings-nav` | nav | `settings/nav` | missing | M006/S02 | `src/js/entities/nav/navMain.js.coffee:63` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:settings:settings-search` | nav | `settings/search` | missing | M006/S02 | `src/js/entities/nav/navMain.js.coffee:65` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:settings:settings-web` | nav | `settings/web` | missing | M006/S02 | `src/js/entities/nav/navMain.js.coffee:61`<br>`src/js/entities/nav/navMain.js.coffee:62` | Route/menu alias backlog from Chorus2 source scan. |
| `nav:settings:settings-wildcard` | nav | `settings/*` | implemented | M006/S01 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:settings:settings` | route | `settings` | implemented | M006/S01 | `src/lib/app/appRouter.ts` |  |

## Family: shell

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:shell:shell-disconnect` | action | `shell:disconnect` | missing | M006/S04 | `src/js/apps/shell/shell_app.js.coffee:158` | Command/action parity backlog from Chorus2 source scan. |
| `action:shell:shell-reconnect` | action | `shell:reconnect` | missing | M006/S04 | `src/js/apps/shell/shell_app.js.coffee:147` | Command/action parity backlog from Chorus2 source scan. |
| `action:shell:shell-view-ready` | action | `shell:view:ready` | missing | M006/S04 | `src/js/apps/shell/shell_app.js.coffee:129` | Command/action parity backlog from Chorus2 source scan. |
| `route:shell:root` | route | `/` | implemented | M006/S01 | `src/lib/app/appRouter.ts` | Current dashboard route covers the Chorus2 home shell entry point. |

## Family: show

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:show:show` | nav | `show` | missing | M006/S02 | `src/js/apps/addon/list/list_controller.js.coffee:13`<br>`src/js/apps/category/list/list_controller.js.coffee:12`<br>`src/js/apps/epg/list/list_controller.js.coffee:34`<br>`src/js/apps/filter/show/show_controller.js.coffee:10`<br>`src/js/apps/landing/show/landing_controller.js.coffee:12`<br>`src/js/apps/landing/show/landing_controller.js.coffee:14`<br>`src/js/apps/landing/show/landing_controller.js.coffee:58`<br>`src/js/apps/pvr/channelList/channel_list_controller.js.coffee:15`<br>`src/js/apps/pvr/recordingList/recording_list_controller.js.coffee:15`<br>`src/js/apps/settings/settings_app.js.coffee:38` | Route/menu alias backlog from Chorus2 source scan. |

## Family: sockets

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:sockets:sockets-active` | action | `sockets:active` | missing | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:55` | Command/action parity backlog from Chorus2 source scan. |

## Family: song

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:song:song-albumparse-entities` | action | `song:albumparse:entities` | deferred | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:161` | Media parity backlog from Chorus2 source scan. |
| `action:song:song-build-collection` | action | `song:build:collection` | deferred | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:153` | Media parity backlog from Chorus2 source scan. |
| `action:song:song-byid-entities` | action | `song:byid:entities` | deferred | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:157` | Media parity backlog from Chorus2 source scan. |
| `action:song:song-custom-entities` | action | `song:custom:entities` | deferred | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:149` | Media parity backlog from Chorus2 source scan. |
| `action:song:song-edit` | action | `song:edit` | deferred | R054/M006/S04 | `src/js/apps/song/song_app.js.coffee:4` | Media parity backlog from Chorus2 source scan. |
| `action:song:song-entities` | action | `song:entities` | deferred | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:145` | Media parity backlog from Chorus2 source scan. |
| `action:song:song-entity` | action | `song:entity` | deferred | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:141` | Media parity backlog from Chorus2 source scan. |
| `action:song:song-fields` | action | `song:fields` | deferred | R054/M006/S04 | `src/js/entities/kodi/song.js.coffee:165` | Media parity backlog from Chorus2 source scan. |
| `action:song:song-list-view` | action | `song:list:view` | deferred | R054/M006/S04 | `src/js/apps/song/list/list_controller.js.coffee:58` | Media parity backlog from Chorus2 source scan. |

## Family: state

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:state:state-current` | action | `state:current` | missing | M006/S04 | `src/js/apps/state/state_app.js.coffee:151` | Command/action parity backlog from Chorus2 source scan. |
| `action:state:state-kodi` | action | `state:kodi` | missing | M006/S04 | `src/js/apps/state/state_app.js.coffee:145` | Command/action parity backlog from Chorus2 source scan. |
| `action:state:state-kodi-get` | action | `state:kodi:get` | missing | M006/S04 | `src/js/apps/state/kodi/kodi.js.coffee:21` | Command/action parity backlog from Chorus2 source scan. |
| `action:state:state-kodi-update` | action | `state:kodi:update` | missing | M006/S04 | `src/js/apps/state/kodi/kodi.js.coffee:18` | Command/action parity backlog from Chorus2 source scan. |
| `action:state:state-local` | action | `state:local` | missing | M006/S04 | `src/js/apps/state/state_app.js.coffee:147` | Command/action parity backlog from Chorus2 source scan. |
| `action:state:state-local-get` | action | `state:local:get` | missing | M006/S04 | `src/js/apps/state/local/local.js.coffee:17` | Command/action parity backlog from Chorus2 source scan. |
| `action:state:state-local-update` | action | `state:local:update` | missing | M006/S04 | `src/js/apps/state/local/local.js.coffee:14` | Command/action parity backlog from Chorus2 source scan. |
| `action:state:state-ws-init` | action | `state:ws:init` | missing | M006/S04 | `src/js/apps/state/state_app.js.coffee:156` | Command/action parity backlog from Chorus2 source scan. |

## Family: system

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:system:power-commands` | action | `power commands` | deferred | D043/M006/S05 | `scripts/scan-chorus2-parity.mjs` | Destructive power actions require an explicit guard before exposure. |
| `jsonrpc:system:get-properties` | jsonrpc | `System.GetProperties` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:system:hibernate` | jsonrpc | `System.Hibernate` | deferred | D043/M006/S05 | `scripts/scan-chorus2-parity.mjs` | Guarded destructive method; do not expose without confirmation. |
| `jsonrpc:system:on-quit` | jsonrpc | `System.OnQuit` | deferred | D043/M006/S05 | `src/js/apps/state/kodi/notifications.js.coffee:220` | Guarded destructive method; do not expose without confirmation. |
| `jsonrpc:system:on-restart` | jsonrpc | `System.OnRestart` | missing | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:225` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:system:on-wake` | jsonrpc | `System.OnWake` | missing | M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:225` | Command/action parity backlog from Chorus2 source scan. |
| `jsonrpc:system:reboot` | jsonrpc | `System.Reboot` | deferred | D043/M006/S05 | `scripts/scan-chorus2-parity.mjs` | Guarded destructive method; do not expose without confirmation. |
| `jsonrpc:system:shutdown` | jsonrpc | `System.Shutdown` | deferred | D043/M006/S05 | `scripts/scan-chorus2-parity.mjs` | Guarded destructive method; do not expose without confirmation. |
| `jsonrpc:system:suspend` | jsonrpc | `System.Suspend` | deferred | D043/M006/S05 | `scripts/scan-chorus2-parity.mjs` | Guarded destructive method; do not expose without confirmation. |

## Family: themoviedb

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:themoviedb:themoviedb-movie-image-entities` | action | `themoviedb:movie:image:entities` | deferred | R054/M006/S04 | `src/js/entities/external/themoviedb.js.coffee:95` | Media parity backlog from Chorus2 source scan. |
| `action:themoviedb:themoviedb-tv-image-entities` | action | `themoviedb:tv:image:entities` | deferred | R054/M006/S04 | `src/js/entities/external/themoviedb.js.coffee:100` | Media parity backlog from Chorus2 source scan. |

## Family: thumbs

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:thumbs:thumbsup` | nav | `thumbsup` | deferred | R055/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:thumbs:thumbsup` | route | `thumbsup` | deferred | R055/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: thumbsup

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:thumbsup:thumbsup-check` | action | `thumbsup:check` | deferred | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:188` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:thumbsup:thumbsup-get-entities` | action | `thumbsup:get:entities` | deferred | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:184` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `action:thumbsup:thumbsup-toggle-entity` | action | `thumbsup:toggle:entity` | deferred | R055/M006/S04 | `src/js/entities/localPlaylist/localPlaylist.js.coffee:173` | Playlist/local-player parity backlog from Chorus2 source scan. |
| `nav:thumbsup:thumbsup` | nav | `thumbsup` | deferred | R055/M006/S04 | `src/js/entities/nav/navMain.js.coffee:55` | Playlist/local-player parity backlog from Chorus2 source scan. |

## Family: timer

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:timer:timer` | nav | `timer` | deferred | R056/M006/S04 | `src/js/apps/epg/list/list_controller.js.coffee:11`<br>`src/js/apps/epg/list/list_controller.js.coffee:19` | PVR parity backlog from Chorus2 source scan. |

## Family: tv

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:tv:pvr-tv` | route | `pvr/tv` | deferred | R056/M006/S04 | `src/js/apps/pvr/pvr_app.js.coffee:5` | PVR parity backlog from Chorus2 source scan. |
| `route:tv:pvr-tv-channelid` | route | `pvr/tv/:channelid` | deferred | R056/M006/S04 | `src/js/apps/epg/epg_app.js.coffee:5` | PVR parity backlog from Chorus2 source scan. |

## Family: tvshow

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:tvshow:tvshow-action` | action | `tvshow:action` | deferred | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:108` | Media parity backlog from Chorus2 source scan. |
| `action:tvshow:tvshow-action-items` | action | `tvshow:action:items` | deferred | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:126` | Media parity backlog from Chorus2 source scan. |
| `action:tvshow:tvshow-action-watched` | action | `tvshow:action:watched` | deferred | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:132` | Media parity backlog from Chorus2 source scan. |
| `action:tvshow:tvshow-edit` | action | `tvshow:edit` | deferred | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:146` | Media parity backlog from Chorus2 source scan. |
| `action:tvshow:tvshow-entities` | action | `tvshow:entities` | deferred | R054/M006/S04 | `src/js/entities/kodi/tvshow.js.coffee:65` | Media parity backlog from Chorus2 source scan. |
| `action:tvshow:tvshow-entity` | action | `tvshow:entity` | deferred | R054/M006/S04 | `src/js/entities/kodi/tvshow.js.coffee:61` | Media parity backlog from Chorus2 source scan. |
| `action:tvshow:tvshow-fields` | action | `tvshow:fields` | deferred | R054/M006/S04 | `src/js/entities/kodi/tvshow.js.coffee:69` | Media parity backlog from Chorus2 source scan. |
| `action:tvshow:tvshow-list-view` | action | `tvshow:list:view` | deferred | R054/M006/S04 | `src/js/apps/tvshow/list/list_controller.js.coffee:78` | Media parity backlog from Chorus2 source scan. |
| `nav:tvshow:tvshows` | nav | `tvshows` | missing | M006/S02 | `scripts/scan-chorus2-parity.mjs` |  |
| `nav:tvshow:tvshows-recent` | nav | `tvshows/recent` | missing | M006/S02 | `scripts/scan-chorus2-parity.mjs` |  |
| `route:tvshow:tvshows` | route | `tvshows` | missing | M006/S02 | `src/lib/video/videoRouter.ts` | Current parser supports video/tv, not the Chorus2 tvshows alias. |
| `route:tvshow:video-tv` | route | `video/tv` | implemented | M006/S01 | `src/lib/video/videoRouter.ts` |  |

## Family: tvshows

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:tvshows:tvshows` | nav | `tvshows` | deferred | R054/M006/S04 | `src/js/entities/nav/navMain.js.coffee:34` | Media parity backlog from Chorus2 source scan. |
| `nav:tvshows:tvshows-recent` | nav | `tvshows/recent` | deferred | R054/M006/S04 | `src/js/entities/nav/navMain.js.coffee:32`<br>`src/js/entities/nav/navMain.js.coffee:33` | Media parity backlog from Chorus2 source scan. |

## Family: ui

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:ui:ui-dropdown-bind-close` | action | `ui:dropdown:bind:close` | missing | M006/S04 | `src/js/apps/ui/ui_app.js.coffee:146` | Command/action parity backlog from Chorus2 source scan. |
| `action:ui:ui-modal-close` | action | `ui:modal:close` | missing | M006/S04 | `src/js/apps/ui/ui_app.js.coffee:107`<br>`src/js/apps/ui/ui_app.js.coffee:127` | Command/action parity backlog from Chorus2 source scan. |
| `action:ui:ui-modal-confirm` | action | `ui:modal:confirm` | missing | M006/S04 | `src/js/apps/ui/ui_app.js.coffee:111` | Command/action parity backlog from Chorus2 source scan. |
| `action:ui:ui-modal-form-show` | action | `ui:modal:form:show` | missing | M006/S04 | `src/js/apps/ui/ui_app.js.coffee:123` | Command/action parity backlog from Chorus2 source scan. |
| `action:ui:ui-modal-options` | action | `ui:modal:options` | missing | M006/S04 | `src/js/apps/ui/ui_app.js.coffee:137` | Command/action parity backlog from Chorus2 source scan. |
| `action:ui:ui-modal-show` | action | `ui:modal:show` | missing | M006/S04 | `src/js/apps/ui/ui_app.js.coffee:116` | Command/action parity backlog from Chorus2 source scan. |
| `action:ui:ui-modal-youtube` | action | `ui:modal:youtube` | deferred | R054/M006/S04 | `src/js/apps/ui/ui_app.js.coffee:131` | Media parity backlog from Chorus2 source scan. |
| `action:ui:ui-playermenu` | action | `ui:playermenu` | missing | M006/S04 | `src/js/apps/ui/ui_app.js.coffee:142` | Command/action parity backlog from Chorus2 source scan. |
| `action:ui:ui-textinput-show` | action | `ui:textinput:show` | missing | M006/S04 | `src/js/apps/ui/ui_app.js.coffee:89` | Command/action parity backlog from Chorus2 source scan. |

## Family: unknown

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:unknown:root` | nav | `/` | missing | M006/S02 | `src/js/apps/landing/show/landing_controller.js.coffee:82` | Route/menu alias backlog from Chorus2 source scan. |

## Family: url

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `nav:url:url` | nav | `url(` | missing | M006/S02 | `src/js/apps/landing/show/landing_controller.js.coffee:81` | Route/menu alias backlog from Chorus2 source scan. |

## Family: video-library

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:video-library:clean` | jsonrpc | `VideoLibrary.Clean` | deferred | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:43`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-episode-details` | jsonrpc | `VideoLibrary.GetEpisodeDetails` | deferred | R054/M006/S04 | `src/js/entities/kodi/episode.js.coffee:39` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-episodes` | jsonrpc | `VideoLibrary.GetEpisodes` | deferred | R054/M006/S04 | `src/js/entities/kodi/episode.js.coffee:50` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-movie-details` | jsonrpc | `VideoLibrary.GetMovieDetails` | deferred | R054/M006/S04 | `src/js/entities/kodi/movie.js.coffee:36` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-movies` | jsonrpc | `VideoLibrary.GetMovies` | deferred | R054/M006/S04 | `src/js/entities/kodi/movie.js.coffee:47`<br>`src/js/helpers/customMixins/kodi_entities.js.coffee:11` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-music-video-details` | jsonrpc | `VideoLibrary.GetMusicVideoDetails` | deferred | R054/M006/S04 | `src/js/entities/kodi/musicvideo.js.coffee:33` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-music-videos` | jsonrpc | `VideoLibrary.GetMusicVideos` | deferred | R054/M006/S04 | `src/js/entities/kodi/musicvideo.js.coffee:44` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-seasons` | jsonrpc | `VideoLibrary.GetSeasons` | deferred | R054/M006/S04 | `src/js/entities/kodi/season.js.coffee:45` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-tvshow-details` | jsonrpc | `VideoLibrary.GetTVShowDetails` | deferred | R054/M006/S04 | `src/js/entities/kodi/tvshow.js.coffee:36` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:get-tvshows` | jsonrpc | `VideoLibrary.GetTVShows` | deferred | R054/M006/S04 | `src/js/entities/kodi/tvshow.js.coffee:47` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:on-clean-finished` | jsonrpc | `VideoLibrary.OnCleanFinished` | deferred | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:189` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:on-clean-started` | jsonrpc | `VideoLibrary.OnCleanStarted` | deferred | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:185` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:on-scan-finished` | jsonrpc | `VideoLibrary.OnScanFinished` | deferred | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:159` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:on-scan-started` | jsonrpc | `VideoLibrary.OnScanStarted` | deferred | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:155` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:on-update` | jsonrpc | `VideoLibrary.OnUpdate` | deferred | R054/M006/S04 | `src/js/apps/state/kodi/notifications.js.coffee:193` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:refresh-episode` | jsonrpc | `VideoLibrary.RefreshEpisode` | deferred | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:85` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:refresh-movie` | jsonrpc | `VideoLibrary.RefreshMovie` | deferred | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:73` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:refresh-tvshow` | jsonrpc | `VideoLibrary.RefreshTVShow` | deferred | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:79` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:scan` | jsonrpc | `VideoLibrary.Scan` | deferred | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:38`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:set-episode-details` | jsonrpc | `VideoLibrary.SetEpisodeDetails` | deferred | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:12`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:set-movie-details` | jsonrpc | `VideoLibrary.SetMovieDetails` | deferred | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:19`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:set-music-video-details` | jsonrpc | `VideoLibrary.SetMusicVideoDetails` | deferred | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:33`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `jsonrpc:video-library:set-tvshow-details` | jsonrpc | `VideoLibrary.SetTVShowDetails` | deferred | R054/M006/S04 | `src/js/apps/command/kodi/helpers/videolibrary.js.coffee:26`<br>`src/js/apps/command/kodi/helpers/videolibrary.js.coffee:6` | Media parity backlog from Chorus2 source scan. |

## Family: videolibrary

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `jsonrpc:videolibrary:clean` | jsonrpc | `VideoLibrary.Clean` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:videolibrary:refresh-episode` | jsonrpc | `VideoLibrary.RefreshEpisode` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:videolibrary:refresh-movie` | jsonrpc | `VideoLibrary.RefreshMovie` | missing | M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:videolibrary:refresh-tvshow` | jsonrpc | `VideoLibrary.RefreshTVShow` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:videolibrary:scan` | jsonrpc | `VideoLibrary.Scan` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:videolibrary:set-episode-details` | jsonrpc | `VideoLibrary.SetEpisodeDetails` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:videolibrary:set-movie-details` | jsonrpc | `VideoLibrary.SetMovieDetails` | implemented | M006/S01 | `src/lib/kodi/methods.ts` |  |
| `jsonrpc:videolibrary:set-music-video-details` | jsonrpc | `VideoLibrary.SetMusicVideoDetails` | deferred | R054/M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |
| `jsonrpc:videolibrary:set-tvshow-details` | jsonrpc | `VideoLibrary.SetTVShowDetails` | missing | M006/S04 | `scripts/scan-chorus2-parity.mjs` |  |

## Family: view

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `route:view:browser-media-id` | route | `browser/:media/:id` | missing | M006/S02 | `src/js/apps/browser/browser_app.js.coffee:6` | Route/menu alias backlog from Chorus2 source scan. |
| `route:view:movie-id` | route | `movie/:id` | deferred | R054/M006/S04 | `src/js/apps/movie/movie_app.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `route:view:music-album-id` | route | `music/album/:id` | deferred | R054/M006/S04 | `src/js/apps/album/album_app.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `route:view:music-artist-id` | route | `music/artist/:id` | deferred | R054/M006/S04 | `src/js/apps/artist/artist_app.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `route:view:music-video-id` | route | `music/video/:id` | deferred | R054/M006/S04 | `src/js/apps/musicvideo/musicvideo_app.js.coffee:6` | Media parity backlog from Chorus2 source scan. |
| `route:view:search` | route | `search` | missing | M006/S02 | `src/js/apps/search/search_app.js.coffee:5` | Route/menu alias backlog from Chorus2 source scan. |
| `route:view:tvshow-tvshowid` | route | `tvshow/:tvshowid` | deferred | R054/M006/S04 | `src/js/apps/tvshow/tvshow_app.js.coffee:6` | Media parity backlog from Chorus2 source scan. |

## Family: when

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:when:when-entity-fetched` | action | `when:entity:fetched` | missing | M006/S04 | `src/js/entities/kodi/_base/_fetch.js.coffee:18` | Command/action parity backlog from Chorus2 source scan. |

## Family: youtube

| ID | kind | surface | status | owner | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `action:youtube:youtube-list-view` | action | `youtube:list:view` | deferred | R054/M006/S04 | `src/js/apps/external/youtube/youtube_controller.js.coffee:37` | Media parity backlog from Chorus2 source scan. |
| `action:youtube:youtube-search-entities` | action | `youtube:search:entities` | deferred | R054/M006/S04 | `src/js/entities/external/youtube.js.coffee:45` | Media parity backlog from Chorus2 source scan. |
| `action:youtube:youtube-search-popup` | action | `youtube:search:popup` | deferred | R054/M006/S04 | `src/js/apps/external/youtube/youtube_controller.js.coffee:31` | Media parity backlog from Chorus2 source scan. |
| `action:youtube:youtube-search-view` | action | `youtube:search:view` | deferred | R054/M006/S04 | `src/js/apps/external/youtube/youtube_controller.js.coffee:28` | Media parity backlog from Chorus2 source scan. |
| `action:youtube:youtube-trailer-entities` | action | `youtube:trailer:entities` | deferred | R054/M006/S04 | `src/js/entities/external/youtube.js.coffee:56` | Media parity backlog from Chorus2 source scan. |

<!-- prettier-ignore-end -->
