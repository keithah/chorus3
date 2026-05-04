# M007 Chorus2 Exact UI Parity Plan

## Goal

Make packaged `chorus3` look and behave like `chorus2` exactly enough that a user can switch Kodi's web interface from Chorus2 to Chorus3 and keep the same navigation model, route URLs, shell behavior, side panels, playlist controls, and page layouts.

The current packaged shell has the visual frame, but it is not usable enough:

- Left rail labels appear, but section submenus are not reliably clickable.
- Right playlist/menu state is stuck open, and the Kodi/Local/ellipsis/collapse controls are not clickable.
- Several rail destinations either do nothing or land on `not found`.
- Some routes use Chorus3-internal URLs where Chorus2 has stable URLs, for example files currently points at `/lab/api-browser` instead of `/files` or `/browser`.
- Some pages render Chorus3-native panels instead of Chorus2-like sections.
- The user wants Chorus3 to match Chorus2 exactly, using the screenshots in this discussion as visual and behavioral references.

## Primary Reference

Use local Chorus2 source and assets as the source of truth:

- Source repo: `~/src/chorus2`
- Current screenshots from the user:
  - Music root and submenu
  - Movies submenu
  - TV shows submenu
  - Browser/files page
  - Add-ons page
  - Add-on settings page
  - Playlists page
  - Settings page
  - Help/About page
  - Right-side Kodi/Local playlist drawer states

Do not invent a modernized design for this milestone. This milestone is strict Chorus2 parity.

## Completion Class

Integration and visual parity.

This cannot be called done from unit tests alone. It needs:

- Route parser tests.
- Component/store tests for clickable shell controls.
- Packaged-route verification.
- Browser screenshot checks against the packaged shell.
- Live Kodi smoke testing where JSON-RPC behavior matters.

## Current Defects To Fix

### Left Rail And Submenus

The left navigation rail must behave like Chorus2:

- Hovering or activating Music shows a submenu matching Chorus2:
  - Header: `SECTIONS`
  - Items: `Music`, `Genres`, `Top music`, `Artists`, `Albums`, `Videos`
  - The submenu items must be clickable.
  - Clicking Music must navigate to the Music page and not no-op.
- Movies shows:
  - Header: `SECTIONS`
  - Items: `Movies`, `All movies`
  - `/video/movies` must not show `not found`.
- TV shows shows:
  - Header: `SECTIONS`
  - Items: `TV shows`, `All TV shows`
  - `/video/tv` must not show `not found`.
- Browser/files shows the Chorus2 browser/files page:
  - Expected route: `/files` and/or `/browser`.
  - The current `/lab/api-browser` target is wrong for the rail.
  - Page content should say `Browse files and add-ons` and explain browsing all Kodi content by source or add-on.
- Add-ons shows the Chorus2 add-ons page:
  - Left submenu header: `ADD-ONS`
  - Items: `All`, `Video`, `Audio`, `Executable`
  - The content area may show `No results found` when empty, but must not be the Chorus3 `Available web interfaces` screen.
- Settings shows the Chorus2 settings page:
  - `/settings` must not be `not found`.
  - Left submenu headers: `GENERAL` and `KODI SETTINGS`
  - General items: `Web interface`, `Main Menu`, `Add-ons`, `Search`
  - Kodi settings items: `Games`, `Interface`, `Media`, `Player`, `PVR & Live TV`, `Services`, `System`
  - Content should match the Chorus2 settings page structure, including large blue section headings and option rows.
- Help shows the Chorus2 About/Help page:
  - Left submenu header: `HELP TOPICS`
  - Items: `About`, `Readme`, `Changelog`, `Keyboard`, `Add-ons`, `Developers`, `Translations`, `License`
  - Content should start with `About Chorus`, `Status report`, `What is Chorus?`
  - It must not no-op.
- Playlists shows the Chorus2 playlists page:
  - Active rail label: `Playlists`
  - Left content includes `New Playlist` button.
  - Main area shows empty playlist state when no playlists exist.

### Route Failures

The following routes must resolve inside the app in package-mounted mode and normal dev mode:

- `/`
- `/music`
- `/music/genres`
- `/music/top`
- `/music/artists`
- `/music/albums`
- `/music/videos`
- `/video/movies`
- `/video/tv`
- `/files`
- `/browser`
- `/addons`
- `/addons/all`
- `/addons/video`
- `/addons/audio`
- `/addons/executable`
- `/remote`
- `/playlists`
- `/settings`
- `/settings/web-interface`
- `/settings/main-menu`
- `/settings/addons`
- `/settings/search`
- `/settings/games`
- `/settings/interface`
- `/settings/media`
- `/settings/player`
- `/settings/pvr`
- `/settings/services`
- `/settings/system`
- `/help`
- `/help/readme`
- `/help/changelog`
- `/help/keyboard`
- `/help/addons`
- `/help/developers`
- `/help/translations`
- `/help/license`

Package-mounted equivalents under `/addons/webinterface.chorus3/` must also resolve.

### Right Playlist Drawer

The right side must match Chorus2 behavior:

- The Kodi and Local tabs must be clickable.
- Kodi tab should represent the Kodi/remote player mode. Confirm the exact behavior against Chorus2 source before implementation.
- Local tab should represent browser/local playback mode. Confirm the exact behavior against Chorus2 source before implementation.
- The vertical ellipsis must toggle the playlist menu. The menu must not be permanently stuck open.
- The collapse arrow must collapse and expand the playlist drawer.
- The Audio/Video tabs must be clickable and switch playlist type.
- Menu items must be interactive or intentionally disabled based on Chorus2 behavior:
  - `Current playlist`
  - `Clear playlist`
  - `Refresh playlist`
  - `Party mode`
  - `Kodi`
  - `Save Kodi playlist`
- The collapsed state should match Chorus2 screenshot: search area remains, playlist drawer narrows/hides, collapse icon changes direction.

### Content Styling

Chorus3 must stop rendering card/dashboard UI inside package mode for these Chorus2 surfaces.

The exact visual rules:

- Dark top bar.
- White left icon rail.
- Light gray secondary submenu panel.
- White main content panels where Chorus2 uses white.
- Light gray main background where Chorus2 uses gray.
- Large light-weight Open Sans headings.
- Blue active links and active rail labels.
- Chorus2 Material Design icon font and Chorus2 logo assets.
- No rounded Chorus3 cards for these package-mode Chorus2 pages.
- No `Multi-host console`, host setup cards, or modern dashboard controls in package mode.

## Architecture Direction

### Build A Chorus2 Shell Module

Create a dedicated shell layer for package mode rather than continuing to mix Chorus2 shell markup into the general app dashboard.

Recommended module boundary:

- `Chorus2Shell`
  - Owns top bar, left rail, submenu region, main content region, right playlist drawer, and bottom transport.
  - Accepts current route, current player mode, playlist mode, and dispatch callbacks.
  - Exposes slot or render prop for page content.
- `chorus2Navigation`
  - Defines rail items, submenu groups, route aliases, active matching, and labels.
  - This should be data-driven so route tests can verify every screenshot surface.
- `chorus2Routes`
  - Maps Chorus2 URLs to existing Chorus3 route kinds or new placeholder route kinds.
  - Must preserve `/files` and `/browser` instead of linking the rail to `/lab/api-browser`.
- `Chorus2PlaylistDrawer`
  - Owns Kodi/Local tabs, Audio/Video tabs, ellipsis menu, collapse state, and menu actions.
  - Should be independently testable.

### Route Alias Rules

Chorus2 route names should be accepted directly. If the current app has an equivalent route under a different URL, add an alias instead of changing the user-facing Chorus2 URL.

Examples:

- `/files` and `/browser` should render the files/browser surface.
- `/settings` should render the Chorus2-style settings surface, not a not-found state.
- `/addons` should render the Chorus2 add-ons category page, not the current web-interface-management screen.
- `/remote` should render Kodi remote controls, not no-op.

### Placeholder Rules

Placeholders are acceptable only where the backing feature is not implemented yet, but they must be Chorus2-shaped:

- Correct shell.
- Correct active rail item.
- Correct submenu.
- Correct heading and empty state.
- No route `not found`.
- Clear hidden test marker or accessible label indicating missing backend behavior for automated proof.

## Milestones And Slices

### Milestone M007: Exact Chorus2 Shell And Navigation Parity

#### S01: Route Alias Contract

Risk: high  
Depends: none  
Demo: Every Chorus2 rail URL loads a page in both dev root and `/addons/webinterface.chorus3/` package mode without `not found`.

Tasks:

- Add app-router route kinds for all Chorus2 routes listed above.
- Add package-base route parsing tests for each route.
- Add normal dev-root route parsing tests for each route.
- Replace `/lab/api-browser` rail target with `/files` or `/browser`.
- Confirm route names against `~/src/chorus2` before finalizing.
- Update package verifier so it fails if any primary Chorus2 rail route resolves to unknown/not-found.

Acceptance:

- `http://localhost:8080/video/movies` does not show `not found`.
- `http://localhost:8080/video/tv` does not show `not found`.
- `http://localhost:8080/files` and `http://localhost:8080/browser` do not show `not found`.
- `http://localhost:8080/settings` does not show `not found`.
- Package-mounted equivalents also pass.

#### S02: Data-Driven Left Rail And Submenus

Risk: high  
Depends: S01  
Demo: Hovering/clicking every left rail item shows the exact Chorus2 submenu and every submenu item navigates.

Tasks:

- Extract rail configuration from component markup.
- Define active item matching for Music, Movies, TV shows, Browser, Add-ons, Remote, Playlists, Settings, Help.
- Implement Chorus2-style flyout/secondary submenu behavior.
- Make submenu items actual anchors/buttons, not decorative labels.
- Add keyboard focus behavior so submenu items can be reached without hover.
- Add browser tests that click each rail item and at least one submenu item per section.

Acceptance:

- Music submenu matches screenshot and `Music`, `Genres`, `Top music`, `Artists`, `Albums`, `Videos` are clickable.
- Movies submenu matches screenshot and routes to Movies/All movies.
- TV submenu matches screenshot and routes to TV shows/All TV shows.
- Settings/help/playlists/add-ons/browser submenus render exactly as shown.

#### S03: Chorus2 Page Frames And Placeholders

Risk: medium  
Depends: S01, S02  
Demo: Each primary route renders the Chorus2 page shape with correct submenu, heading, empty state, and active rail label.

Tasks:

- Build Chorus2-shaped page components for:
  - Music
  - Movies
  - TV shows
  - Browser/files
  - Add-ons
  - Playlists
  - Settings
  - Help/About
- For routes without complete backend behavior, render Chorus2-shaped placeholder content instead of `not found`.
- Replace Chorus3-native package-mode cards with Chorus2-style panels.
- Ensure headings, spacing, colors, and typography match the screenshots.
- Add screenshot tests or browser proof snapshots for each primary page.

Acceptance:

- Browser/files page shows `Browse files and add-ons` and the explanatory copy from Chorus2.
- Add-ons page shows `ADD-ONS` submenu and `No results found` empty state if no data.
- Playlists page shows `New Playlist` and empty playlist content.
- Settings page shows `General options`, select rows, toggles, and `Appearance`.
- Help page starts with `About Chorus`, `Status report`, and `What is Chorus?`.

#### S04: Right Playlist Drawer Interactions

Risk: high  
Depends: S01  
Demo: Kodi/Local, Audio/Video, ellipsis menu, and collapse arrow are all clickable and stateful like Chorus2.

Tasks:

- Read Chorus2 source to confirm the exact meaning of Kodi vs Local tabs.
- Implement drawer state:
  - selected player destination: Kodi or Local
  - selected playlist media: Audio or Video
  - menu open/closed
  - drawer expanded/collapsed
- Wire Kodi/Local to the existing player mode dispatch/store.
- Wire Audio/Video to playlist type state.
- Make ellipsis toggle the menu instead of rendering it permanently.
- Make collapse arrow hide/show the drawer and flip icon direction.
- Implement or guard menu actions based on Chorus2 behavior.
- Add component tests for state transitions.
- Add browser proof for screenshots matching open, closed, audio/video, and Kodi/Local states.

Acceptance:

- Menu is closed by default unless explicitly opened.
- Clicking ellipsis opens the menu.
- Clicking outside or selecting a menu item closes the menu if Chorus2 does so.
- Clicking Local switches to local mode styling and behavior.
- Clicking Kodi switches back to Kodi mode styling and behavior.
- Clicking Audio/Video changes active tab.
- Clicking collapse hides the drawer and reveals the collapsed search/arrow layout.

#### S05: Real Remote Surface

Risk: medium  
Depends: S01, S02  
Demo: `/remote` opens a Chorus2-shaped Kodi remote page and the Kodi tab/right destination behavior is coherent with remote controls.

Tasks:

- Confirm Chorus2 remote-control navigation and commands from `~/src/chorus2`.
- Route `/remote` from the left rail.
- Render a Chorus2-shaped remote surface.
- Reuse existing Chorus3 remote input dispatch where possible.
- Ensure destructive power/system controls are guarded.
- Add tests for visible remote controls and command dispatch.

Acceptance:

- Remote rail item does not no-op.
- `/remote` shows usable directional/select/back/home/menu controls.
- Remote actions call Kodi JSON-RPC through existing dispatch paths.

#### S06: Add-ons And Settings Split

Risk: medium  
Depends: S01, S03  
Demo: `/addons` is Chorus2 add-on browsing, while `/settings/addons` is Chorus2 add-on settings.

Tasks:

- Separate add-on browsing from web-interface management.
- Map `/addons`, `/addons/all`, `/addons/video`, `/addons/audio`, `/addons/executable` to Chorus2 add-ons category UI.
- Map `/settings/addons` to add-on settings UI.
- Keep any current web-interface management route available only under an explicit admin/lab route if still needed.
- Add route and render tests proving `/addons` no longer says `Available web interfaces`.

Acceptance:

- `/addons` screenshot matches Chorus2 add-ons page.
- `/settings/addons` appears under settings submenu and is highlighted there.
- No primary Chorus2 nav route lands on the old Chorus3 add-on management view.

#### S07: Visual Parity Pass

Risk: medium  
Depends: S02, S03, S04  
Demo: Browser screenshots for every referenced Chorus2 screenshot match layout, colors, spacing, and active states closely enough for side-by-side review.

Tasks:

- Normalize dimensions:
  - top bar height
  - rail width
  - submenu width
  - playlist drawer width
  - bottom player height
- Use Open Sans from Chorus2 assets.
- Use Chorus2 icon font mappings.
- Use Chorus2 logo asset in the same size and crop as Chorus2.
- Remove leftover Chorus3 dashboard colors, cards, rounded controls, and hero typography from package-mode Chorus2 surfaces.
- Add visual proof screenshots for the 14 states listed in this plan.

Acceptance:

- Screenshots are comparable against the user-provided Chorus2 references:
  - Music
  - Movies
  - TV shows
  - Browser/files
  - Add-ons
  - Add-on settings
  - Playlists
  - Settings
  - Help
  - Right drawer Kodi/Local
  - Right drawer Audio/Video
  - Right drawer menu open
  - Right drawer collapsed

#### S08: Live Kodi Install Proof

Risk: medium  
Depends: S01 through S07  
Demo: The rebuilt package installed in Kodi at `~/Library/Application Support/Kodi/addons/webinterface.chorus3` works at `http://localhost:8080/`.

Tasks:

- Run full unit tests.
- Run typecheck.
- Run production build.
- Run Kodi package verifier.
- Install package directly into local Kodi add-ons directory.
- Open `http://localhost:8080/` and walk all primary nav routes.
- Confirm no browser console errors.
- Confirm no 404s for app routes or assets.
- Confirm package route fallback works for direct loads.

Acceptance:

- Every primary route works in the actual Kodi-hosted environment.
- Browser back/forward works between Chorus2 routes.
- Direct URL entry works for `/video/movies`, `/video/tv`, `/files`, `/settings`, `/help`.
- No primary nav click no-ops.

## Detailed Route Map

| Chorus2 UI Surface | Route(s)                                                                         | Required Status                       |
| ------------------ | -------------------------------------------------------------------------------- | ------------------------------------- |
| Music              | `/`, `/music`                                                                    | Working page, clickable submenu       |
| Music genres       | `/music/genres`                                                                  | Working or Chorus2-shaped placeholder |
| Top music          | `/music/top`                                                                     | Working or Chorus2-shaped placeholder |
| Artists            | `/music/artists`                                                                 | Working or Chorus2-shaped placeholder |
| Albums             | `/music/albums`                                                                  | Working or Chorus2-shaped placeholder |
| Music videos       | `/music/videos`                                                                  | Working or Chorus2-shaped placeholder |
| Movies             | `/video/movies`                                                                  | Working page, no not-found            |
| TV shows           | `/video/tv`                                                                      | Working page, no not-found            |
| Files/browser      | `/files`, `/browser`                                                             | Working page, no lab URL              |
| Add-ons            | `/addons`, `/addons/all`, `/addons/video`, `/addons/audio`, `/addons/executable` | Chorus2 add-ons UI                    |
| Remote             | `/remote`                                                                        | Working remote-control UI             |
| Playlists          | `/playlists`                                                                     | Chorus2 playlist UI                   |
| Settings           | `/settings` plus settings subroutes                                              | Chorus2 settings UI                   |
| Help               | `/help` plus help subroutes                                                      | Chorus2 help/about UI                 |

## Testing Requirements

### Unit And Component Tests

- Route parser accepts all route aliases in normal mode.
- Route parser accepts all route aliases under package base path.
- Left rail active item derives correctly from route.
- Submenu items derive correctly from route.
- Right drawer state transitions work.
- Playlist menu is not open by default.
- Kodi/Local tab changes dispatch through the existing player mode path.
- Audio/Video tab changes playlist mode.
- Collapse/expand state is stable across route changes.

### Browser Tests

Use browser automation against a packaged local server and, where possible, the real Kodi-hosted install.

Required browser checks:

- Click every left rail item.
- Click at least one submenu item for every left rail item.
- Assert route changes.
- Assert no `not found` text on primary routes.
- Assert no old multi-host setup UI appears in package mode.
- Open and close right playlist menu.
- Toggle Kodi/Local.
- Toggle Audio/Video.
- Collapse and expand playlist drawer.
- Screenshot primary surfaces.

### Package Verification

Extend `npm run verify:kodi-package` so it fails when:

- Any primary Chorus2 route resolves to unknown/not-found.
- Any visible rail link points outside `/addons/webinterface.chorus3/` in package mode.
- The browser/files rail link points to `/lab/api-browser`.
- The package root renders host setup cards.
- Required Chorus2 assets are missing.

## Out Of Scope

- New visual design.
- Tailwind/modern redesign of Chorus2 pages.
- Full feature parity for every deep media action in Chorus2 unless required to make the visible shell credible.
- PVR/live TV backend parity beyond route placeholders, unless it blocks the settings or navigation shell.
- Changing Kodi server settings outside normal webinterface package installation.

## Open Questions

- Confirm from Chorus2 source whether the `Kodi` tab in the right panel is only player destination, a remote-control context, or both.
- Confirm exact Chorus2 behavior for clicking outside the playlist menu.
- Confirm whether `/files` or `/browser` should be canonical; both should probably alias for compatibility.
- Confirm whether package root should default to Music or the current playlist/fanart page. The provided Chorus2 root screenshot shows the media shell with Music active.

## Definition Of Done

M007 is done when:

- Chorus3 package mode visually matches Chorus2 for all provided screenshots.
- Every left rail and submenu item is clickable.
- Every primary Chorus2 route resolves without `not found`.
- The right playlist drawer controls are clickable and stateful.
- The browser/files route is no longer wired to `/lab/api-browser`.
- Add-ons and settings render the Chorus2 surfaces, not Chorus3 management/dashboard pages.
- Tests, package verification, browser proof, and live Kodi install proof pass.
