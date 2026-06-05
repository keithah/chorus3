<script lang="ts">
  import {
    buildKodiPackageSafePrimaryAppRoute,
    type BuildAppRouteOptions
  } from '$lib/app/appRouter';
  import type { AddonsPanelDispatch } from '$components/AddonsPanel.svelte';
  import SettingsPanel, { type SettingsPanelDispatch } from '$components/SettingsPanel.svelte';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import type { TranslationContext } from '$lib/i18n';
  import type { SettingsStoreSnapshot } from '$lib/stores';
  import type { AddonSnapshot, AddonsStoreSnapshot } from '$lib/stores/addonsStore.svelte';
  import {
    webSettingsStore as defaultWebSettingsStore,
    type WebSettingsSnapshot,
    type WebSettingsStore
  } from '$lib/stores/webSettings.svelte';
  import {
    blankSearchAddon,
    searchAddonsStore as defaultSearchAddonsStore,
    type SearchAddonSetting,
    type SearchAddonsStore
  } from '$lib/stores/searchAddons.svelte';
  import {
    blankMainNavRow,
    DEFAULT_MAIN_NAV_ROWS,
    MAIN_NAV_ICON_OPTIONS,
    mainNavStore as defaultMainNavStore,
    type MainNavRow,
    type MainNavStore
  } from '$lib/stores/mainNav.svelte';

  interface Props {
    route: PrimaryRoute;
    snapshot: SettingsStoreSnapshot;
    dispatch: SettingsPanelDispatch;
    i18n: TranslationContext;
    buildOptions?: BuildAppRouteOptions;
    webSettings?: WebSettingsStore;
    searchAddons?: SearchAddonsStore;
    mainNav?: MainNavStore;
    addonsSnapshot?: AddonsStoreSnapshot;
    addonsDispatch?: AddonsPanelDispatch;
  }

  interface SidebarLink {
    label: string;
    route: PrimaryRoute;
    match: (route: PrimaryRoute) => boolean;
  }

  type WebSettingKey = keyof WebSettingsSnapshot;

  interface SelectRow {
    key: WebSettingKey;
    label: string;
    hint: string;
    options: readonly { value: string; label: string }[];
  }

  interface TextRow {
    key: WebSettingKey;
    label: string;
    hint: string;
  }

  interface ToggleRow {
    key: WebSettingKey;
    label: string;
    hint: string;
  }

  const CHORUS2_LANGUAGE_OPTIONS = [
    { value: 'af', label: 'Afrikaans (South Africa)' },
    { value: 'am', label: 'Amharic (Ethiopia)' },
    { value: 'ar', label: 'Arabic (Saudi Arabia)' },
    { value: 'ast', label: 'Asturian (Spain)' },
    { value: 'az', label: 'Azerbaijani' },
    { value: 'be', label: 'Belarusian' },
    { value: 'bg', label: 'Bulgarian' },
    { value: 'bs', label: 'Bosnian' },
    { value: 'ca', label: 'Catalan (Spain)' },
    { value: 'cs', label: 'Czech' },
    { value: 'cy', label: 'Welsh (United Kingdom)' },
    { value: 'da', label: 'Danish' },
    { value: 'de', label: 'German' },
    { value: 'el', label: 'Greek' },
    { value: 'en', label: 'English (United Kingdom)' },
    { value: 'en_au', label: 'English (Australia)' },
    { value: 'en_nz', label: 'English (New Zealand)' },
    { value: 'en_us', label: 'English (United States)' },
    { value: 'eo', label: 'Esperanto' },
    { value: 'es', label: 'Spanish (Spain)' },
    { value: 'es_ar', label: 'Spanish (Argentina)' },
    { value: 'es_mx', label: 'Spanish (Mexico)' },
    { value: 'et', label: 'Estonian' },
    { value: 'eu', label: 'Basque (Spain)' },
    { value: 'fa', label: 'Persian (Afghanistan)' },
    { value: 'fa_ir', label: 'Persian (Iran)' },
    { value: 'fi', label: 'Finnish' },
    { value: 'fo', label: 'Faroese' },
    { value: 'fr', label: 'French (France)' },
    { value: 'fr_ca', label: 'French (Canada)' },
    { value: 'gl', label: 'Galician (Spain)' },
    { value: 'he', label: 'Hebrew (Israel)' },
    { value: 'hi', label: 'Hindi (India)' },
    { value: 'hr', label: 'Croatian' },
    { value: 'hu', label: 'Hungarian' },
    { value: 'hy', label: 'Armenian' },
    { value: 'id', label: 'Indonesian' },
    { value: 'is', label: 'Icelandic' },
    { value: 'it', label: 'Italian' },
    { value: 'ja', label: 'Japanese' },
    { value: 'kn', label: 'Kannada (India)' },
    { value: 'ko', label: 'Korean' },
    { value: 'lt', label: 'Lithuanian' },
    { value: 'lv', label: 'Latvian' },
    { value: 'mi', label: 'Maori' },
    { value: 'mk', label: 'Macedonian' },
    { value: 'ml', label: 'Malayalam (India)' },
    { value: 'mn', label: 'Mongolian' },
    { value: 'ms', label: 'Malay' },
    { value: 'mt', label: 'Maltese' },
    { value: 'my', label: 'Burmese' },
    { value: 'nb', label: 'Norwegian' },
    { value: 'nl', label: 'Dutch' },
    { value: 'pl', label: 'Polish' },
    { value: 'pt', label: 'Portuguese (Portugal)' },
    { value: 'pt_br', label: 'Portuguese (Brazil)' },
    { value: 'ro', label: 'Romanian' },
    { value: 'ru', label: 'Russian' },
    { value: 'si', label: 'Sinhala (Sri Lanka)' },
    { value: 'sk', label: 'Slovak' },
    { value: 'sl', label: 'Slovenian' },
    { value: 'sq', label: 'Albanian' },
    { value: 'sr', label: 'Serbian' },
    { value: 'sr_rs@latin', label: 'Serbian (latin)' },
    { value: 'sv', label: 'Swedish' },
    { value: 'szl', label: 'Silesian' },
    { value: 'ta', label: 'Tamil (India)' },
    { value: 'te', label: 'Telugu (India)' },
    { value: 'tg', label: 'Tajik' },
    { value: 'th', label: 'Thai' },
    { value: 'tr', label: 'Turkish' },
    { value: 'uk', label: 'Ukrainian' },
    { value: 'uz', label: 'Uzbek' },
    { value: 'vi', label: 'Vietnamese' },
    { value: 'zh_cn', label: 'Chinese (Simplified)' },
    { value: 'zh_tw', label: 'Chinese (Traditional)' }
  ] as const;

  let {
    route,
    snapshot,
    dispatch,
    i18n,
    buildOptions = {},
    webSettings = defaultWebSettingsStore,
    searchAddons = defaultSearchAddonsStore,
    mainNav = defaultMainNavStore,
    addonsSnapshot,
    addonsDispatch
  }: Props = $props();

  let lastRequestedSection = $state<string | null>(null);
  let searchRows = $state<SearchAddonSetting[]>([]);
  let loadedSearchRowsKey = $state('__unloaded__');
  let mainNavRows = $state<MainNavRow[]>([]);
  let loadedMainNavRowsKey = $state('__unloaded__');
  const webSettingsSnapshot = $derived(webSettings.snapshot);
  const searchAddonsSnapshot = $derived(searchAddons.snapshot);
  const mainNavSnapshot = $derived(mainNav.snapshot);

  const sectionIds = $derived(new Set(snapshot.sections.map((section) => section.id)));

  const generalLinks: SidebarLink[] = [
    {
      label: 'Web interface',
      route: { kind: 'settingsWeb' },
      match: (value) => value.kind === 'settingsWeb'
    },
    {
      label: 'Main Menu',
      route: { kind: 'settingsNav' },
      match: (value) => value.kind === 'settingsNav'
    },
    {
      label: 'Add-ons',
      route: { kind: 'settingsAddons' },
      match: (value) => value.kind === 'settingsAddons'
    },
    {
      label: 'Search',
      route: { kind: 'settingsSearch' },
      match: (value) => value.kind === 'settingsSearch'
    }
  ];

  const kodiLinks: SidebarLink[] = [
    settingsSectionLink('Games', 'games'),
    settingsSectionLink('Interface', 'interface'),
    settingsSectionLink('Media', 'media'),
    settingsSectionLink('Player', 'player'),
    settingsSectionLink('PVR & Live TV', 'pvr'),
    settingsSectionLink('Services', 'services'),
    settingsSectionLink('System', 'system')
  ];

  const generalOptions: SelectRow[] = [
    {
      key: 'lang',
      label: 'Language',
      hint: 'Preferred language, need to refresh browser to take effect',
      options: CHORUS2_LANGUAGE_OPTIONS
    },
    {
      key: 'defaultPlayer',
      label: 'Default player',
      hint: 'Which player to start with',
      options: [
        { value: 'auto', label: 'Auto' },
        { value: 'kodi', label: 'Kodi' },
        { value: 'local', label: 'Local' }
      ]
    },
    {
      key: 'keyboardControl',
      label: 'Keyboard controls',
      hint: 'In Chorus, will your keyboard control Kodi, the browser or both.',
      options: [
        { value: 'kodi', label: 'Kodi' },
        { value: 'local', label: 'Browser' },
        { value: 'both', label: 'Both' }
      ]
    }
  ];

  const listOptions: ToggleRow[] = [
    {
      key: 'ignoreArticle',
      label: 'Ignore article',
      hint: "Ignore articles (terms such as 'The' and 'A') when sorting lists"
    },
    {
      key: 'albumArtistsOnly',
      label: 'Album artists only',
      hint: 'When listing artists should we only see artists with albums or all artists found. Warning: turning this off can impact performance with large libraries'
    },
    {
      key: 'playlistFocusPlaying',
      label: 'Focus playlist on playing',
      hint: 'Automatically scroll the playlist to the current playing item. This happens whenever the playing item is changed'
    }
  ];

  const appearanceOptions: ToggleRow[] = [
    {
      key: 'vibrantHeaders',
      label: 'Vibrant headers',
      hint: 'Use colourful headers for media pages'
    },
    {
      key: 'disableThumbs',
      label: 'Disable Thumbs Up',
      hint: 'Remove the thumbs up button from media. Note: you may also want to remove the menu item from the Main Nav'
    },
    {
      key: 'showDeviceName',
      label: 'Show device name',
      hint: 'Show the Kodi device name in the header of Chorus'
    }
  ];

  const advancedTextOptions: TextRow[] = [
    { key: 'socketsPort', label: 'Websockets port', hint: '9090 is the default' },
    {
      key: 'socketsHost',
      label: 'Websockets host',
      hint: "The hostname used for websockets connection. Set to 'auto' to use the current hostname."
    }
  ];

  const advancedSelectOptions: SelectRow[] = [
    {
      key: 'pollInterval',
      label: 'Poll interval',
      hint: 'How often do I poll for updates from Kodi (Only applies when websockets inactive)',
      options: [
        { value: '5000', label: '5 sec' },
        { value: '10000', label: '10 sec' },
        { value: '30000', label: '30 sec' },
        { value: '60000', label: '60 sec' }
      ]
    },
    {
      key: 'kodiSettingsLevel',
      label: 'Kodi settings level',
      hint: 'Advanced setting level is recommended for those who know what they are doing.',
      options: [
        { value: 'standard', label: 'Standard' },
        { value: 'advanced', label: 'Advanced' },
        { value: 'expert', label: 'Expert' }
      ]
    }
  ];

  const advancedToggleOptions: ToggleRow[] = [
    {
      key: 'reverseProxy',
      label: 'Reverse proxy support',
      hint: 'Enable support for reverse proxying.'
    },
    {
      key: 'refreshIgnoreNFO',
      label: 'Refresh Ignore NFO',
      hint: 'Ignore local NFO files when manually refreshing media.'
    }
  ];

  const apiKeyOptions: TextRow[] = [
    { key: 'apiKeyTMDB', label: 'The Movie DB', hint: 'Set your personal API key' },
    { key: 'apiKeyFanartTv', label: 'FanartTV', hint: 'Set your personal API key' },
    { key: 'apiKeyYouTube', label: 'YouTube', hint: 'Set your personal API key' }
  ];
  const pageMode = $derived(settingsPageMode(route));
  const routedKodiSectionLabel = $derived(
    route.kind === 'settingsKodiSection' && sectionIds.has(route.section) ? route.section : null
  );
  const settingsAddonGroups = $derived(groupSettingsAddons(addonsSnapshot?.addons ?? []));
  const settingsAddonsLoading = $derived(addonsSnapshot?.loadStatus === 'loading');

  $effect(() => {
    if (route.kind !== 'settingsKodiSection') {
      lastRequestedSection = null;
      return;
    }

    const sectionId = route.section;
    if (!sectionIds.has(sectionId)) return;
    if (snapshot.selectedSectionId === sectionId) return;
    if (lastRequestedSection === sectionId) return;

    lastRequestedSection = sectionId;
    void dispatch.selectSection(sectionId);
  });

  $effect(() => {
    if (pageMode !== 'addons') return;
    if (!addonsSnapshot || !addonsDispatch) return;
    if (addonsSnapshot.loadStatus !== 'idle') return;
    void addonsDispatch.load();
  });

  $effect(() => {
    if (pageMode !== 'search') return;
    const rowsKey = searchAddonRowsKey(searchAddonsSnapshot.rows);
    if (loadedSearchRowsKey === rowsKey) return;
    loadedSearchRowsKey = rowsKey;
    searchRows =
      searchAddonsSnapshot.rows.length > 0
        ? searchAddonsSnapshot.rows.map((row, index) => ({ ...row, weight: index }))
        : [blankSearchAddon(0)];
  });

  $effect(() => {
    if (pageMode !== 'main-menu') return;
    const rows = mainNavSnapshot.customized ? mainNavSnapshot.rows : [...DEFAULT_MAIN_NAV_ROWS];
    const rowsKey = mainNavRowsKey(rows);
    if (loadedMainNavRowsKey === rowsKey) return;
    loadedMainNavRowsKey = rowsKey;
    mainNavRows = rows.map((row, index) => ({ ...row, weight: index }));
  });

  function settingsSectionLink(label: string, section: string): SidebarLink {
    return {
      label,
      route: { kind: 'settingsKodiSection', section },
      match: (value) => value.kind === 'settingsKodiSection' && value.section === section
    };
  }

  function hrefFor(value: PrimaryRoute): string {
    return buildKodiPackageSafePrimaryAppRoute(value, buildOptions);
  }

  function webValue(key: WebSettingKey): string {
    return String(webSettingsSnapshot[key]);
  }

  function webChecked(key: WebSettingKey): boolean {
    return webSettingsSnapshot[key] === true;
  }

  function updateWebSetting(key: WebSettingKey, value: string | boolean): void {
    webSettings.update({ [key]: value });
  }

  function toggleAddon(addon: AddonSnapshot, enabled: boolean): void {
    if (!addonsDispatch || settingsAddonsLoading) return;
    void addonsDispatch.setAddonEnabled(addon.addonid, enabled);
  }

  function updateSearchRow(index: number, patch: Partial<SearchAddonSetting>): void {
    searchRows = searchRows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...patch, weight: rowIndex } : { ...row, weight: rowIndex }
    );
  }

  function updateSearchMedia(index: number, value: string): void {
    updateSearchRow(index, { media: value === 'video' ? 'video' : 'music' });
  }

  function addSearchRow(): void {
    searchRows = [...searchRows, blankSearchAddon(searchRows.length)];
  }

  function removeSearchRow(index: number): void {
    const rows = searchRows
      .filter((_, rowIndex) => rowIndex !== index)
      .map((row, rowIndex) => ({
        ...row,
        id: row.id || `custom.addon.${rowIndex}`,
        weight: rowIndex
      }));
    searchRows = rows.length > 0 ? rows : [blankSearchAddon(0)];
  }

  function saveSearchAddons(): void {
    searchAddons.replace(
      searchRows.map((row, index) => ({
        ...row,
        id: row.id || `custom.addon.${index}`,
        weight: index
      }))
    );
    loadedSearchRowsKey = searchAddonRowsKey(searchAddons.snapshot.rows);
  }

  function updateMainNavRow(index: number, patch: Partial<MainNavRow>): void {
    mainNavRows = mainNavRows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...patch, weight: rowIndex } : { ...row, weight: rowIndex }
    );
  }

  function addMainNavRow(): void {
    mainNavRows = [...mainNavRows, blankMainNavRow(mainNavRows.length)];
  }

  function removeMainNavRow(index: number): void {
    const rows = mainNavRows
      .filter((_, rowIndex) => rowIndex !== index)
      .map((row, rowIndex) => ({
        ...row,
        id: row.id || String(1000 + rowIndex),
        weight: rowIndex
      }));
    mainNavRows = rows.length > 0 ? rows : [blankMainNavRow(0)];
  }

  function saveMainNav(): void {
    mainNav.replace(
      mainNavRows.map((row, index) => ({
        ...row,
        id: row.id || String(1000 + index),
        weight: index
      }))
    );
    loadedMainNavRowsKey = mainNavRowsKey(mainNav.snapshot.rows);
  }

  function resetMainNav(): void {
    mainNav.reset();
    mainNavRows = DEFAULT_MAIN_NAV_ROWS.map((row, index) => ({ ...row, weight: index }));
    loadedMainNavRowsKey = mainNavRowsKey(mainNavRows);
  }

  function searchAddonRowsKey(rows: readonly SearchAddonSetting[]): string {
    return rows
      .map((row) => [row.id, row.title, row.url, row.media, row.weight].join('\u001f'))
      .join('\u001e');
  }

  function mainNavRowsKey(rows: readonly MainNavRow[]): string {
    return rows
      .map((row) =>
        [row.id, row.title, row.path, row.icon, row.classes, row.parent, row.weight].join('\u001f')
      )
      .join('\u001e');
  }

  function groupSettingsAddons(addons: readonly AddonSnapshot[]): {
    key: string;
    label: string;
    addons: AddonSnapshot[];
  }[] {
    const groups = new Map<string, AddonSnapshot[]>();
    for (const addon of addons) {
      const label = safeText(addon.type || 'unknown');
      const group = groups.get(label) ?? [];
      group.push(addon);
      groups.set(label, group);
    }
    return [...groups.entries()].map(([label, items]) => ({
      key: label,
      label,
      addons: items
    }));
  }

  function addonName(addon: AddonSnapshot): string {
    return safeText(addon.name || addon.addonid || 'Untitled add-on');
  }

  function safeText(value: string): string {
    return value
      .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, '[redacted-url]')
      .replace(/https?:\/\/[^\s]+/gi, '[redacted-url]')
      .replace(/[a-z][a-z0-9+.-]*:\/\/[^\s]+/gi, '[redacted-url]')
      .replace(/authorization\s*:\s*basic\s+[^\s]+/gi, 'credentials [redacted]')
      .replace(/authorization/gi, 'credentials')
      .replace(/basic\s+[a-z0-9+/=._-]+/gi, 'credentials [redacted]')
      .replace(/username or password/gi, 'credentials')
      .replace(/admin:p@ssword/gi, '[redacted-secret]')
      .replace(/p@ssword/gi, '[redacted-secret]')
      .replace(/\b[a-z]:\\[^\s]+/gi, 'redacted-file')
      .replace(/\/[\w./-]+/gi, '[redacted-path]')
      .replace(/localStorage|sessionStorage/gi, 'browser storage')
      .replace(/CHORUS_SENTINEL_SECRET|SENTINEL_SECRET/gi, '[redacted-sentinel]')
      .replace(/raw\s+(body|response|payload)/gi, 'redacted payload')
      .replace(/password/gi, 'credentials');
  }

  function settingsPageMode(
    value: PrimaryRoute
  ): 'web' | 'main-menu' | 'addons' | 'search' | 'kodi' {
    if (value.kind === 'settingsNav') return 'main-menu';
    if (value.kind === 'settingsAddons') return 'addons';
    if (value.kind === 'settingsSearch') return 'search';
    if (value.kind === 'settingsKodi' || value.kind === 'settingsKodiSection') return 'kodi';
    return 'web';
  }
</script>

<section class="classic-settings" aria-labelledby="settings-title">
  <aside class="settings-sidebar" aria-label="Settings sections">
    <nav>
      <p>General</p>
      {#each generalLinks as link (link.label)}
        <a class:active={link.match(route)} href={hrefFor(link.route)}>{link.label}</a>
      {/each}
    </nav>

    <nav>
      <p>Kodi Settings</p>
      {#each kodiLinks as link (link.label)}
        <a class:active={link.match(route)} href={hrefFor(link.route)}>{link.label}</a>
      {/each}
    </nav>
  </aside>

  <main class="settings-content" class:kodi-settings-content={pageMode === 'kodi'}>
    {#if pageMode === 'web'}
      <h1 id="settings-title">General options</h1>

      <div class="settings-form">
        {#each generalOptions as option (option.key)}
          <label class="select-row">
            <span>{option.label}</span>
            <span class="select-control">
              <select
                aria-label={option.label}
                value={webValue(option.key)}
                onchange={(event) => updateWebSetting(option.key, event.currentTarget.value)}
              >
                {#each option.options as item (item.value)}
                  <option value={item.value}>{item.label}</option>
                {/each}
              </select>
              <small>{option.hint}</small>
              {#if option.key === 'keyboardControl'}
                <a href={hrefFor({ kind: 'helpPage', pageid: 'keybind-readme' })}>Learn more</a>
              {/if}
            </span>
          </label>
        {/each}
      </div>

      <h2>List options</h2>
      <div class="settings-form">
        {#each listOptions as option (option.label)}
          <label class="toggle-row">
            <span>{option.label}</span>
            <span class="toggle-control">
              <input
                type="checkbox"
                checked={webChecked(option.key)}
                aria-label={option.label}
                onchange={(event) => updateWebSetting(option.key, event.currentTarget.checked)}
              />
              <small>{option.hint}</small>
            </span>
          </label>
        {/each}
      </div>

      <h2>Appearance</h2>
      <div class="settings-form">
        {#each appearanceOptions as option (option.label)}
          <label class="toggle-row">
            <span>{option.label}</span>
            <span class="toggle-control">
              <input
                type="checkbox"
                checked={webChecked(option.key)}
                aria-label={option.label}
                onchange={(event) => updateWebSetting(option.key, event.currentTarget.checked)}
              />
              <small>{option.hint}</small>
            </span>
          </label>
        {/each}
      </div>

      <h2>Advanced options</h2>
      <div class="settings-form">
        {#each advancedTextOptions as option (option.key)}
          <label class="select-row">
            <span>{option.label}</span>
            <span class="select-control">
              <input
                class="text-control"
                aria-label={option.label}
                value={webValue(option.key)}
                oninput={(event) => updateWebSetting(option.key, event.currentTarget.value)}
              />
              <small>{option.hint}</small>
            </span>
          </label>
        {/each}

        {#each advancedSelectOptions as option (option.key)}
          <label class="select-row">
            <span>{option.label}</span>
            <span class="select-control">
              <select
                aria-label={option.label}
                value={webValue(option.key)}
                onchange={(event) => updateWebSetting(option.key, event.currentTarget.value)}
              >
                {#each option.options as item (item.value)}
                  <option value={item.value}>{item.label}</option>
                {/each}
              </select>
              <small>{option.hint}</small>
            </span>
          </label>
        {/each}

        {#each advancedToggleOptions as option (option.key)}
          <label class="toggle-row">
            <span>{option.label}</span>
            <span class="toggle-control">
              <input
                type="checkbox"
                checked={webChecked(option.key)}
                aria-label={option.label}
                onchange={(event) => updateWebSetting(option.key, event.currentTarget.checked)}
              />
              <small>{option.hint}</small>
            </span>
          </label>
        {/each}
      </div>

      <h2>API Keys</h2>
      <div class="settings-form">
        {#each apiKeyOptions as option (option.key)}
          <label class="select-row">
            <span>{option.label}</span>
            <span class="select-control">
              <input
                class="text-control"
                aria-label={option.label}
                value={webValue(option.key)}
                oninput={(event) => updateWebSetting(option.key, event.currentTarget.value)}
              />
              <small>{option.hint}</small>
            </span>
          </label>
        {/each}
      </div>
    {:else if pageMode === 'kodi'}
      <h1 id="settings-title">Kodi Settings</h1>
      <p class="settings-intro">
        {routedKodiSectionLabel
          ? `Editing ${routedKodiSectionLabel} settings from Kodi.`
          : 'Choose a Kodi settings section.'}
      </p>
      <SettingsPanel {snapshot} {dispatch} {i18n} />
    {:else if pageMode === 'main-menu'}
      <h1 id="settings-title">Main Menu Structure</h1>
      <p class="settings-intro">
        Here you can change the title, url and <a
          href={hrefFor({ kind: 'helpPage', pageid: 'developers' })}>icons</a
        >
        for menu items. You can also remove, re-order and add new items.
        <button class="restore-defaults-link" type="button" onclick={resetMainNav}
          >Click here restore defaults</button
        >
      </p>

      <form
        class="settings-form nav-main-form"
        onsubmit={(event) => {
          event.preventDefault();
          saveMainNav();
        }}
      >
        {#each mainNavRows as row, index (`${row.id}-${index}`)}
          <fieldset class="nav-main-row">
            <button
              class="remove-item"
              type="button"
              aria-label={`Remove main menu item ${index + 1}`}
              onclick={() => removeMainNavRow(index)}
            >
              &times;
            </button>

            <label class="select-row">
              <span>Title</span>
              <span class="select-control">
                <input
                  class="text-control"
                  name="title[]"
                  aria-label={`Menu title ${index + 1}`}
                  value={row.title}
                  oninput={(event) => updateMainNavRow(index, { title: event.currentTarget.value })}
                />
              </span>
            </label>

            <label class="select-row">
              <span>Url</span>
              <span class="select-control">
                <input
                  class="text-control"
                  name="path[]"
                  aria-label={`Menu url ${index + 1}`}
                  value={row.path}
                  oninput={(event) => updateMainNavRow(index, { path: event.currentTarget.value })}
                />
              </span>
            </label>

            <label class="select-row">
              <span class="icon-title">Icon <i class={row.icon}></i></span>
              <span class="select-control">
                <select
                  name="icon[]"
                  aria-label={`Menu icon ${index + 1}`}
                  value={row.icon}
                  onchange={(event) => updateMainNavRow(index, { icon: event.currentTarget.value })}
                >
                  {#each MAIN_NAV_ICON_OPTIONS as icon (icon)}
                    <option value={icon}>{icon}</option>
                  {/each}
                </select>
              </span>
            </label>
          </fieldset>
        {/each}

        <div class="settings-form-actions">
          <button class="add-main-nav-row" type="button" onclick={addMainNavRow}>Add another</button
          >
          <button class="save-main-nav-rows" type="submit">Save</button>
        </div>
      </form>
    {:else if pageMode === 'addons'}
      <h1 id="settings-title">Add-ons</h1>
      <p class="settings-intro">Toggle installed Kodi add-ons.</p>

      {#if !addonsSnapshot || !addonsDispatch}
        <a class="settings-link-button" href={hrefFor({ kind: 'addonsAll' })}>Open add-ons</a>
      {:else}
        <div class="settings-status" role="status">
          <span>Load</span>
          <strong>{addonsSnapshot.loadStatus}</strong>
          <button
            type="button"
            onclick={() => addonsDispatch?.load()}
            disabled={settingsAddonsLoading}>Reload add-ons</button
          >
        </div>

        {#if addonsSnapshot.lastError}
          <p class="settings-alert" role="alert">
            {safeText(addonsSnapshot.lastError.code)}: {safeText(addonsSnapshot.lastError.message)}
          </p>
        {/if}

        {#if settingsAddonGroups.length > 0}
          <div class="settings-addon-groups">
            {#each settingsAddonGroups as group (group.key)}
              <section class="settings-addon-group" aria-labelledby={`settings-addon-${group.key}`}>
                <h2 id={`settings-addon-${group.key}`}>{group.label}</h2>
                <div class="settings-list">
                  {#each group.addons as addon (addon.addonid)}
                    <label>
                      <input
                        type="checkbox"
                        checked={addon.enabled === true}
                        disabled={settingsAddonsLoading || typeof addon.enabled !== 'boolean'}
                        aria-label={`Enable ${addonName(addon)}`}
                        onchange={(event) => toggleAddon(addon, event.currentTarget.checked)}
                      />
                      <span>{addonName(addon)}</span>
                      <a
                        class="addon-settings-link"
                        href={hrefFor({ kind: 'addonDetail', addonid: addon.addonid })}>Settings</a
                      >
                    </label>
                  {/each}
                </div>
              </section>
            {/each}
          </div>
        {:else if addonsSnapshot.loadStatus === 'loading'}
          <p class="settings-intro">Loading add-ons.</p>
        {:else}
          <p class="settings-intro">No installed add-ons are available.</p>
        {/if}
      {/if}
    {:else if pageMode === 'search'}
      <h1 id="settings-title">Custom Add-on search</h1>
      <p class="settings-intro">
        Add custom add-on searches.
        <a href={hrefFor({ kind: 'helpPage', pageid: 'addons' })}>Add-ons help page</a>
      </p>

      <form
        class="settings-form search-addons-form"
        onsubmit={(event) => {
          event.preventDefault();
          saveSearchAddons();
        }}
      >
        {#each searchRows as row, index (`${row.id}-${index}`)}
          <fieldset class="search-addon-row">
            <button
              class="remove-item"
              type="button"
              aria-label={`Remove custom add-on search ${index + 1}`}
              onclick={() => removeSearchRow(index)}
            >
              &times;
            </button>

            <label class="select-row">
              <span>Title</span>
              <span class="select-control">
                <input
                  class="text-control"
                  name="title[]"
                  aria-label={`Title ${index + 1}`}
                  value={row.title}
                  oninput={(event) => updateSearchRow(index, { title: event.currentTarget.value })}
                />
              </span>
            </label>

            <label class="select-row">
              <span>Url</span>
              <span class="select-control">
                <input
                  class="text-control"
                  name="url[]"
                  aria-label={`Url ${index + 1}`}
                  value={row.url}
                  oninput={(event) => updateSearchRow(index, { url: event.currentTarget.value })}
                />
              </span>
            </label>

            <label class="select-row">
              <span>Media</span>
              <span class="select-control">
                <select
                  name="media[]"
                  aria-label={`Media ${index + 1}`}
                  value={row.media}
                  onchange={(event) => updateSearchMedia(index, event.currentTarget.value)}
                >
                  <option value="music">Music</option>
                  <option value="video">Video</option>
                </select>
              </span>
            </label>
          </fieldset>
        {/each}

        <div class="search-actions">
          <button class="add-search-row" type="button" onclick={addSearchRow}>Add another</button>
          <button class="save-search-rows" type="submit">Save</button>
        </div>
      </form>
    {/if}
  </main>
</section>

<style>
  @import './settingsPageClassic.css';
</style>
