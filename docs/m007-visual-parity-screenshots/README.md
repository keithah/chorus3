# M007 visual parity screenshots

This directory is the tracked documentation directory for M007 AppShell visual parity screenshots. T04 captured the binary images after semantic browser assertions passed.

Do not add placeholder binary images. Only update these screenshots after the browser route/state has been exercised and the evidence is recorded in `docs/m007-visual-parity-proof.md`.

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

## Captured current screenshot filenames

- `docs/m007-visual-parity-screenshots/current-music-home.png`
- `docs/m007-visual-parity-screenshots/current-music-submenu.png`
- `docs/m007-visual-parity-screenshots/current-movies.png`
- `docs/m007-visual-parity-screenshots/current-tvshows.png`
- `docs/m007-visual-parity-screenshots/current-browser-files.png`
- `docs/m007-visual-parity-screenshots/current-addons-list.png`
- `docs/m007-visual-parity-screenshots/current-addon-detail.png`
- `docs/m007-visual-parity-screenshots/current-playlists-local.png`
- `docs/m007-visual-parity-screenshots/current-settings-kodi.png`
- `docs/m007-visual-parity-screenshots/current-help-overview.png`
- `docs/m007-visual-parity-screenshots/current-drawer-expanded-menu.png`
- `docs/m007-visual-parity-screenshots/current-drawer-collapsed.png`
