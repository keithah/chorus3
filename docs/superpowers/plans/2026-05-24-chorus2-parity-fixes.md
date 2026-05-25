# Chorus2 Parity Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining concrete Chorus2 parity gaps around local browser playback, playlist actions, metadata save coverage, PVR/settings depth, and add-on category behavior.

**Architecture:** Keep changes inside the existing Svelte stores/components and Kodi JSON-RPC adapters. Add regression tests before each behavior change, then verify through the Kodi package and live browser checks.

**Tech Stack:** Svelte 5, TypeScript, Vitest, Kodi JSON-RPC, Vite package build.

---

### Task 1: Local Player Direct Routes And Stable Stage

**Files:**

- Modify: `src/main.test.ts`
- Modify: `src/main.ts`
- Modify: `src/lib/components/LocalBrowserPlayerRoute.test.ts`
- Modify: `src/lib/components/LocalBrowserPlayerRoute.svelte`

- [x] Write failing tests that direct package paths such as `/addons/webinterface.chorus3/local-player/movie/1` resolve to `#local-player/movie/1`, and that the popup video stage is not visually collapsed when no media source is ready.
- [x] Run `npm test -- src/main.test.ts src/lib/components/LocalBrowserPlayerRoute.test.ts` and confirm the new tests fail for route/stage behavior.
- [x] Update boot route normalization and popup CSS so package direct routes mount the local player and the player area keeps Chorus2's black responsive stage during loading/error states.
- [x] Re-run the focused tests and confirm they pass.

### Task 2: Playlist Drawer Actions

**Files:**

- Modify: `src/lib/app-shell/PlaylistDrawer.test.ts`
- Modify: `src/lib/app-shell/PlaylistDrawer.svelte`
- Modify: existing playlist store/dispatch files if callbacks are missing

- [x] Add tests that Clear, Refresh, Party mode, and Save Kodi playlist controls call real callbacks instead of showing deferred copy.
- [x] Run `npm test -- src/lib/app-shell/PlaylistDrawer.test.ts` and confirm the new assertions fail.
- [x] Wire the controls to existing playlist/player dispatch methods or add minimal JSON-RPC-backed callbacks where no method exists.
- [x] Re-run the focused tests and confirm they pass.

### Task 3: Metadata Save Coverage

**Files:**

- Modify: `src/lib/metadata/metadataEditor.test.ts`
- Modify: `src/lib/components/MetadataEditDialog.test.ts`
- Modify: `src/lib/metadata/metadataEditor.ts`
- Modify: `src/lib/components/MetadataEditDialog.svelte`

- [x] Add payload tests for movie, episode, TV show, artist, album, song, and music video save data, including empty read-only fields being omitted.
- [x] Run metadata-focused tests and confirm any missing entity behavior fails.
- [x] Fix normalization and dialog extraction until every supported entity sends the correct Kodi SetDetails payload.
- [x] Re-run metadata-focused tests and confirm they pass.

### Task 4: PVR, Settings, And Add-on Category Parity

**Files:**

- Modify: relevant PVR/settings/add-on tests and components after source comparison identifies concrete mismatches.

- [x] Compare Chorus2 and Chorus3 live screens for PVR, settings, and add-on category pages on the same Kodi install.
- [x] Add failing tests for concrete mismatches only.
- [x] Implement scoped fixes using existing stores and JSON-RPC adapters.
- [x] Re-run focused tests and live checks for the fixed screens.

### Task 5: Full Verification And Kodi Install

**Files:**

- No source files unless verification finds a regression.

- [x] Run `npm run verify`.
- [x] Install with `rsync -ac --delete dist/kodi/webinterface.chorus3/ "$HOME/Library/Application Support/Kodi/addons/webinterface.chorus3/"`.
- [x] Verify Kodi serves the new hashed JS/CSS.
- [x] Live-check local player direct route, local player popup, playlist actions, metadata editor, add-ons, PVR/settings routes.
