# M003 Browser Proof

Date: 2026-05-01
Milestone: M003
Slice: S07
Task: T03

## Scope

This proof exercised the assembled Vite/Svelte app in a real browser against the local dev server. It covers the default no-live-Kodi route and the guarded fixture route used only in DEV/test mode:

- `http://127.0.0.1:5173/`
- `http://127.0.0.1:5173/?m003-browser-proof=1`

The fixture route uses deterministic, no-live-Kodi props from `src/lib/testing/m003BrowserProofFixtures.ts`. No live Kodi host, credentials, or media path was required.

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
bg_shell kill <m003-browser-proof-vite process>
```

## Default Route Proof: `/`

### Assertions

URL: `http://127.0.0.1:5173/`

Checked visible assembled panels and no-live idle states:

| Area            | Selectors / text asserted                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host shell      | `chorus3`, `No Kodi host configured yet`, `Connection`, `no host`, `Theme contract`, `active`, `Save host`, `No saved hosts yet.`, `Open audio locally` |
| Music Library   | `Music Library`, `Music library is empty.`, `No music library items found in this snapshot.`                                                            |
| Music Browse    | `Browse Music`, `Choose an artist, album, or genre to browse.`, `No browse selection yet.`                                                              |
| Media Search    | `Media Search`, `No music results yet.`                                                                                                                 |
| Media Files     | `Media Files`, `No music file sources loaded yet.`, `No directory entries in this snapshot.`                                                            |
| Media Playlists | `Media Playlists`, `No music playlists loaded yet.`, `No playlist entries in this snapshot.`                                                            |
| Player / Queue  | `Player idle`, `Queue idle`                                                                                                                             |

Diagnostics and negative assertions:

- `browser_assert`: `no_console_errors` passed.
- `browser_assert`: `no_failed_requests` passed.
- DOM scan found no distinctive fixture labels: `Nina Simone`, `Pastel Blues`, `Sinnerman`, `Sinnerman.flac`, `Late Night Jazz.xsp`, `Road Trip.m3u`, or `cover.jpg`.
- DOM redaction scan found no forbidden protocol, path, credential, auth-header, browser-storage, response-body, or sentinel-secret terms.

### Caveat

The word `Albums` appears in default mode as a generic Music Library column heading, so the default-mode fixture-gating assertion used distinctive fixture labels rather than generic category headings.

## Fixture Route Proof: `/?m003-browser-proof=1`

### Populated fixture assertions

URL: `http://127.0.0.1:5173/?m003-browser-proof=1`

Checked visible populated fixture states:

| Area            | Selectors / text asserted                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Music Library   | `Music Library`, `Nina Simone`, `Pastel Blues`, `Sinnerman`, `Soul`, `Music library ready.`                                                  |
| Music Browse    | `Browse Music`, `Browse artist Nina Simone`, `Browse album Pastel Blues`, `Browse genre Soul`, `Showing artist Nina Simone.`                 |
| Media Search    | `Media Search`, searchbox `Artist, album, song, or genre`, `Music results for nina.`, `4 results`                                            |
| Media Files     | `Media Files`, `Albums`, `Nina Simone`, `Sinnerman.flac`, `cover.jpg`, `Unsupported file · .jpg`                                             |
| Media Playlists | `Media Playlists`, `Late Night Jazz.xsp`, `Road Trip.m3u`, `Standard playlist files are visible but cannot be opened, played, or queued yet` |

Diagnostics and negative assertions:

- `browser_assert`: fixture labels above were visible.
- `browser_assert`: `no_console_errors` passed.
- `browser_assert`: `no_failed_requests` passed.
- DOM redaction scan found no forbidden protocol, path, credential, auth-header, browser-storage, response-body, or sentinel-secret terms.
- DOM scan confirmed unsupported fixture items remain visible: `cover.jpg` and `Road Trip.m3u`.
- DOM scan confirmed unsupported controls remain disabled:
  - `Unsupported file cover.jpg`: disabled.
  - `Unsupported playlist Road Trip.m3u`: disabled.

### Interactions exercised

The browser snapshot for `main` exposed deterministic refs and accessible names. The following fake, no-live-Kodi interactions were clicked and settled without console errors or failed requests:

| Ref       | Accessible name                           | Purpose                                      |
| --------- | ----------------------------------------- | -------------------------------------------- |
| `@v1:e21` | searchbox `Artist, album, song, or genre` | Filled with `nina` before submitting search. |
| `@v1:e22` | `Search media`                            | Submitted media search.                      |
| `@v1:e23` | `Clear media search`                      | Cleared media search.                        |
| `@v1:e9`  | `Browse artist Nina Simone`               | Exercised artist browse callback.            |
| `@v1:e12` | `Browse album Pastel Blues`               | Exercised album browse callback.             |
| `@v1:e15` | `Browse genre Soul`                       | Exercised genre browse callback.             |
| `@v1:e31` | `Open source Albums`                      | Exercised media-file source callback.        |
| `@v1:e34` | `Open folder Nina Simone`                 | Exercised media-file folder callback.        |
| `@v1:e32` | `Open breadcrumb Albums`                  | Exercised media-file breadcrumb callback.    |
| `@v1:e39` | `Open playlist Late Night Jazz.xsp`       | Exercised smart-playlist open callback.      |
| `@v1:e43` | `Open breadcrumb Late Night Jazz.xsp`     | Exercised playlist breadcrumb callback.      |
| `@v1:e10` | `Play artist Nina Simone`                 | Exercised music play callback.               |
| `@v1:e11` | `Queue artist Nina Simone`                | Exercised music queue callback.              |
| `@v1:e35` | `Play file Sinnerman.flac`                | Exercised file play callback.                |
| `@v1:e36` | `Queue file Sinnerman.flac`               | Exercised file queue callback.               |
| `@v1:e40` | `Play playlist Late Night Jazz.xsp`       | Exercised playlist play callback.            |
| `@v1:e41` | `Queue playlist Late Night Jazz.xsp`      | Exercised playlist queue callback.           |

Post-interaction assertions passed for:

- `no_console_errors`
- `no_failed_requests`
- `Late Night Jazz.xsp` still visible
- `Road Trip.m3u` still visible and non-actionable
- `cover.jpg` still visible and non-actionable
- unsupported-file and unsupported-playlist explanatory copy still visible

## Browser Diagnostics

Console buffer after default and fixture navigations contained only Vite dev-client debug connection messages. There were no browser error entries.

Network buffer after default and fixture navigations contained 140 local dev-server requests, all returning HTTP 200. There were no failed requests.

## Redaction Result

The page text was scanned after default navigation and again after fixture navigation plus interactions. The scan checked for forbidden categories without printing sensitive raw examples: network path schemes, local/special path schemes, credential-bearing URL shapes, auth header names, browser-storage internals, raw response/body wording, password-like values, and sentinel secret labels.

Result: no forbidden terms were present in visible page text.

## Verification Commands

```text
npm run dev -- --host 127.0.0.1
browser assertions against http://127.0.0.1:5173/
browser assertions against http://127.0.0.1:5173/?m003-browser-proof=1
test -s docs/m003-browser-proof.md
```
