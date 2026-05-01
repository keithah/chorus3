# M003 Browser Proof

Date: 2026-05-01
Milestone: M003
Slice: S08
Task: T03

## Scope

This proof exercised the assembled Vite/Svelte app in a real browser against the local dev server. It covers the default no-live-Kodi route and the guarded fixture route used only in DEV/test mode:

- `http://127.0.0.1:5173/`
- `http://127.0.0.1:5173/?m003-browser-proof=1`

The fixture route uses deterministic, no-live-Kodi props from `src/lib/testing/m003BrowserProofFixtures.ts`. No live Kodi host, credentials, media path, or raw response payload was required.

## Server Lifecycle

Started with the managed background process tool from `/home/keith/src/chorus3`:

```text
npm run dev -- --host 127.0.0.1
```

Observed readiness:

```text
ready_port: 5173
url: http://127.0.0.1:5173/
```

Stopped with the managed background process tool after verification:

```text
bg_shell kill d6507186
```

## Default Route Proof: `/`

### Assertions

URL: `http://127.0.0.1:5173/`

Checked visible assembled panels and no-live idle states:

| Area               | Text asserted                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host shell         | `chorus3`, `No Kodi host configured yet`, `Connection`, `no host`, `Theme contract`, `active`, `Save host`, `No saved hosts yet.`, `Open audio locally`                                                       |
| Music Library      | `Music Library`, `Music library is empty.`, `No music library items found in this snapshot.`                                                                                                                  |
| Recent & Top Music | `Recent & Top Music`, `Recently Added`, `Recently Played`, `Most Played`, `No recently added songs in this snapshot.`, `No recently played songs in this snapshot.`, `No most-played songs in this snapshot.` |
| Music Browse       | `Browse Music`, `Choose an artist, album, or genre to browse.`, `No browse selection yet.`                                                                                                                    |
| Media Search       | `Media Search`, `No music results yet.`                                                                                                                                                                       |
| Media Files        | `Media Files`, `No music file sources loaded yet.`, `No directory entries in this snapshot.`                                                                                                                  |
| Media Playlists    | `Media Playlists`, `No music playlists loaded yet.`, `No playlist entries in this snapshot.`                                                                                                                  |
| Player / Queue     | `Unknown title`, `No active Kodi player is available.`, `No active Kodi playlist.`                                                                                                                            |

Diagnostics and negative assertions:

- `browser_assert`: `no_console_errors` passed.
- `browser_assert`: `no_failed_requests` passed.
- Full DOM scan found no distinctive fixture labels from the deterministic proof data: `Feeling Good`, `I Put a Spell on You`, `My Baby Just Cares for Me`, `Nina Simone`, `Sinnerman.flac`, `Late Night Jazz.xsp`, `Road Trip.m3u`, or `cover.jpg`.
- Full DOM redaction scan found no forbidden path, credential, auth-header, browser-storage, raw-body, or sentinel-secret categories.

### Caveat

Generic category words such as `Albums` can appear in default mode as Music Library headings, so default-mode fixture-gating assertions use distinctive fixture labels rather than shared category headings.

## Fixture Route Proof: `/?m003-browser-proof=1`

### Populated fixture assertions

URL: `http://127.0.0.1:5173/?m003-browser-proof=1`

Checked visible populated fixture states:

| Area               | Text asserted                                                                                                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Music Library      | `Music Library`, `Nina Simone`, `Pastel Blues`, `Sinnerman`, `Soul`, `Music library ready.`                                                                                                                                 |
| Recent & Top Music | `Recent & Top Music`, `Recently Added`, `Feeling Good`, `Added 2026-04-29 11:22:33`, `Recently Played`, `I Put a Spell on You`, `Played 2026-04-30 20:15:00`, `Most Played`, `My Baby Just Cares for Me`, `Played 12 times` |
| Music Browse       | `Browse Music`, `Browse artist Nina Simone`, `Browse album Pastel Blues`, `Browse genre Soul`, `Showing artist Nina Simone.`                                                                                                |
| Media Search       | `Media Search`, searchbox `Artist, album, song, or genre`, `Music results for nina.`, `4 results`                                                                                                                           |
| Media Files        | `Media Files`, `Albums`, `Nina Simone`, `Sinnerman.flac`, `cover.jpg`, `Unsupported file`                                                                                                                                   |
| Media Playlists    | `Media Playlists`, `Late Night Jazz.xsp`, `Road Trip.m3u`, `Standard playlist files are visible but cannot be opened, played, or queued yet`                                                                                |

Diagnostics and negative assertions:

- `browser_assert`: S08 Recent & Top Music labels and metadata were visible.
- Full DOM scan confirmed all required S07 and S08 fixture labels were present.
- `browser_assert`: `no_console_errors` passed.
- `browser_assert`: `no_failed_requests` passed.
- Full DOM redaction scan found no forbidden path, credential, auth-header, browser-storage, raw-body, or sentinel-secret categories.
- Full DOM scan confirmed unsupported fixture items remain visible: `cover.jpg` and `Road Trip.m3u`.

## Browser Diagnostics

Console buffer after default and fixture navigations contained only Vite dev-client debug connection messages. There were no browser error entries.

Network diagnostics reported no failed requests during the default or fixture route proof.

## Redaction Result

The page text was scanned after default navigation and again after fixture navigation. The scan checked category-level forbidden terms for media paths, special path schemes, credential-bearing URL shapes, auth-header wording, browser-storage internals, raw response/body wording, password-like values, and sentinel secret labels.

Result: no forbidden terms were present in visible page text.

## Verification Commands

```text
npm run test -- src/lib/testing/m003BrowserProofFixtures.test.ts src/main.test.ts src/App.test.ts
npm run typecheck
npm run build
env -u KODI_HOST -u KODI_HTTP_HOST -u KODI_BASE_URL -u KODI_WS_URL -u KODI_USERNAME -u KODI_PASSWORD npm run smoke:kodi
npm run verify
npm run dev -- --host 127.0.0.1
browser assertions and DOM scans against http://127.0.0.1:5173/
browser assertions and DOM scans against http://127.0.0.1:5173/?m003-browser-proof=1
```
