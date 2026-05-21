# Kodi Web Interface - Chorus 3

A faithful modern rewrite of Chorus2, the classic Kodi web interface.

Browse your music, movies, TV shows, add-ons, playlists, files, PVR channels, and Kodi settings
from a web browser. Play media through Kodi or stream supported media locally in the browser. Use
the classic Chorus remote overlay, now-playing views, library pages, API lab, and package-mounted
routes without the legacy CoffeeScript/Backbone stack.

Chorus 3 is intentionally shaped like Chorus2. The goal is not a new product with a new workflow; it
is Chorus2 rebuilt for current tooling and current Kodi installations.

## What changed from Chorus2

Chorus2 was a complete rebuild of the original Chorus using CoffeeScript, Backbone, Marionette, and
the browser tooling of its time. Chorus 3 keeps the Chorus2 user experience and rebuilds it with:

- Svelte 5 for the application shell and reactive UI.
- TypeScript for typed routes, stores, Kodi JSON-RPC payloads, and component contracts.
- Vite for fast development builds and deterministic production assets.
- Vitest, jsdom, Playwright smoke checks, and package verification scripts for regression coverage.
- Direct Kodi JSON-RPC and WebSocket integration for library browsing, playback, queue state,
  settings, add-ons, PVR, remote input, and local streaming handoff.

## Current state

Chorus 3 is at `3.0.7`. The main Chorus2 surfaces have been ported and packaged as
`webinterface.chorus3`, with the latest patch release focused on Chorus2-style movie detail parity,
rich movie metadata, and browser streaming actions.

The project is still young. Expect rough edges, but the intended bar is full Chorus2 parity rather
than a smaller replacement shell.

## Getting it working

### Enabling Kodi HTTP control

In Kodi:

- Open Settings > Services > Control.
- Enable "Allow remote control via HTTP".
- Set a username and password.
- Enable remote control from applications on this system and other systems if you need them.
- Select the Chorus 3 web interface after installing it.

For security reasons, do not expose Kodi's HTTP server to the public internet.

### Install from zip

Build or download `webinterface.chorus3-3.0.7.zip`, then install it through Kodi:

- Add-ons > Install from zip file.
- Select the Chorus 3 zip.
- Open Settings > Services > Control.
- Select "Chorus 3" as the web interface.

### Install from the Keithah Kodi repository

The repository add-on is generated in the Kodi repository layout that Kodi expects:

- `addons.xml`
- `addons.xml.md5`
- `repository.keithah.kodi/repository.keithah.kodi-0.1.0.zip`
- `webinterface.chorus3/webinterface.chorus3-3.0.7.zip`

The intended public repository is:

- GitHub: https://github.com/keithah/kodi
- Raw metadata: https://raw.githubusercontent.com/keithah/kodi/main/addons.xml

Install the repository zip, then use Install from repository > Keithah Kodi Add-ons > Web
interfaces > Chorus 3.

### Using it

Point your browser at Kodi's HTTP interface:

```text
http://localhost:8080
```

Replace `localhost` with your Kodi host or IP address, and replace `8080` if you changed Kodi's
HTTP port.

Chorus 3 supports package-mounted Kodi URLs and standalone development URLs. Package routes use the
classic hash style, such as:

```text
http://localhost:8080/#music
http://localhost:8080/#music/genres
http://localhost:8080/#movies/recent
http://localhost:8080/#browser
```

## Streaming

Streaming depends on the browser and the codecs in your media files.

### Audio streaming

The top right destination switch controls whether actions target Kodi or the local browser. In Kodi
mode, playback and queue commands are sent to Kodi. In Local mode, supported media streams through
the browser while Kodi is paused during handoff.

### Video streaming

Browser video playback works when the browser supports the file's container, video codec, audio
codec, and stream transport. For best results, use browser-friendly formats such as MP4/H.264/AAC.
Kodi playback remains the most reliable path for files that need Kodi's codec support.

## Kodi settings via the web interface

Chorus 3 ports the Chorus2 settings flow and exposes Kodi settings through the web interface where
Kodi's JSON-RPC API allows it. Some Kodi settings still require the Kodi GUI or depend on the
capabilities of the running Kodi version.

## Kodi API browser

Chorus 3 includes the Chorus lab API browser for exploring and running Kodi JSON-RPC methods. It is
useful for checking whether a feature is possible before wiring it into the UI.

Open it from the lab route or directly:

```text
http://localhost:8080/#lab/api-browser
```

## Building

Use Node.js 22 or newer.

```bash
npm install
npm run dev
npm run package:kodi
```

The Kodi webinterface zip is written under `dist/kodi`.

To generate the public Kodi repository payload:

```bash
npm run package:kodi:repo
```

The repository payload is written under `dist/kodi-repository`.

## Verification

The main verification command runs linting, type checks, unit tests, build, package checks, and
repository generation:

```bash
npm run verify
```

Useful targeted checks:

```bash
npm run typecheck
npm test -- --run
npm run verify:kodi-package
```

## Feature requests / bugs

Open issues at https://github.com/keithah/chorus3/issues. For bugs, include:

- Kodi version.
- Browser and browser version.
- Chorus 3 version.
- Whether you are using Kodi mode or Local mode.
- Any browser console errors.

## License

Chorus 3 is free software under the GNU General Public License, version 2 or later.

This project is a faithful rewrite of Chorus2 and includes assets and UI behavior derived from the
Chorus family. See `LICENSE` for the full terms.
