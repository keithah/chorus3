# Remaining Chorus2 Parity Status

Status: reconciled on 2026-05-24.

This file previously tracked open parity risks after the metadata editor, add-on catalog,
local player, playlist, settings, PVR, and help work. Those checklist items have been
closed or superseded by the implemented Chorus3 surfaces and verification below.

## Reconciled Tasks

- Route metadata accuracy: implemented and covered by `appPageMetadata` route tests.
- PVR EPG parity: implemented with `/pvr/epg`, Kodi package fallback coverage, store/page tests,
  and live package proof.
- Settings subpage parity: implemented for web settings, Kodi sections, main-menu controls,
  add-on settings entry points, search settings, and safe read-only Kodi setting states.
- Detail action menu parity: implemented across library/detail surfaces with playback, queue,
  watched/write actions, metadata editing, browser playback, downloads where data is available,
  and contextual search links.
- Locale and help parity: implemented with current help topics, aliases, package fallbacks, and
  i18n verification.
- Visual and live verification: completed against the installed Kodi package.

## Evidence

- `npm run verify` passed with 92 test files and 1510 tests.
- `npm run package:kodi && npm run verify:kodi-package` passed after adding the actual Chorus3
  help topic package fallbacks.
- Installed package was refreshed with:
  `rsync -ac --delete dist/kodi/webinterface.chorus3/ "$HOME/Library/Application Support/Kodi/addons/webinterface.chorus3/"`
- `KODI_USERNAME=kodi KODI_PASSWORD=kodi node scripts/verify-m007-live-kodi-browser-proof.mjs --origin http://localhost:8080 --timeout-ms 10000`
  passed, including route, asset, visible DOM redaction, JSON-RPC, and safe remote-command checks.
- Headless browser parity sweep compared installed Chorus2 (`webinterface.default`) and Chorus3
  over 19 representative routes. Chorus3 returned HTTP 200, zero hash links, zero console errors,
  no deferred/parity placeholder copy, and expected visible markers on all 19 routes. The run wrote
  screenshots and `summary.json` under `/tmp/chorus-parity-sweep`.

## Notes

- Exact parent paths that also own child route folders, such as `/music`, `/movies`, `/settings`,
  `/help`, `/lab`, and `/pvr`, are not directly live-probed because Kodi's static file serving
  cannot serve the same path as both a file and a directory. Chorus3 generated links use leaf
  aliases such as `/music/home`, `/movies/all`, `/settings/kodi/home`, `/help/about`, and
  `/lab/home`.
- VLC and DivX local-player parity remain intentionally out of scope by product decision; HTML5 is
  the only supported local browser player for now.
