# M007 visual parity screenshots

This directory is the tracked documentation directory for M007 AppShell visual parity screenshots. T03 defines the contract; T04 captures the binary images.

Do not add placeholder binary images in this task. Only add real screenshots after the browser route/state has been exercised and the evidence can be recorded in `docs/m007-visual-parity-proof.md`.

## Naming rules

- Use lower-case kebab-case filenames.
- Use `.png` for current AppShell screenshots.
- Keep every final current screenshot under `docs/m007-visual-parity-screenshots/`.
- Do not use generated browser session directories, local temporary folders, or ignored artifact directories as final proof paths.
- Capture with deterministic `m007-visual-proof=1` fixture state unless a route/state row explicitly says otherwise.

## Capture expectations

For each screenshot:

1. Navigate to the route listed in `docs/m007-visual-parity-proof.md`.
2. Wait for the AppShell stage and route-specific heading to settle.
3. Confirm expected drawer state when the filename includes `drawer`.
4. Check browser console and network diagnostics.
5. Run a visible DOM redaction scan by category.
6. Save the screenshot to the planned filename below.
7. Update the proof document evidence log and delta notes.

## Redaction rules

Screenshots and notes must not expose raw credentials, credential-bearing endpoints, auth header names or values, raw transport bodies, browser storage dumps or keys, raw media paths, sentinel token values, ignored local artifact paths, or generated browser session paths. Record only sanitized diagnostic categories and pass/fail outcomes.

## Planned current screenshot filenames

- `docs/m007-visual-parity-screenshots/music-artists.png`
- `docs/m007-visual-parity-screenshots/movie-library.png`
- `docs/m007-visual-parity-screenshots/tv-library.png`
- `docs/m007-visual-parity-screenshots/addons-all.png`
- `docs/m007-visual-parity-screenshots/settings-kodi-addons.png`
- `docs/m007-visual-parity-screenshots/now-playing.png`
- `docs/m007-visual-parity-screenshots/files-browser.png`
- `docs/m007-visual-parity-screenshots/local-playlists.png`
- `docs/m007-visual-parity-screenshots/help-about.png`
- `docs/m007-visual-parity-screenshots/drawer-kodi-audio.png`
- `docs/m007-visual-parity-screenshots/drawer-local-video.png`
