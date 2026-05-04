<script lang="ts">
  import SettingsPanel, { type SettingsPanelDispatch } from '$components/SettingsPanel.svelte';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import type { TranslationContext } from '$lib/i18n';
  import type { SettingsStoreSnapshot } from '$lib/stores';

  interface Props {
    route: PrimaryRoute;
    snapshot: SettingsStoreSnapshot;
    dispatch: SettingsPanelDispatch;
    i18n: TranslationContext;
  }

  interface RouteSettingsCopy {
    title: string;
    description: string;
    affordanceLabel: string;
    cards: readonly SettingsAffordanceCard[];
  }

  interface SettingsAffordanceCard {
    title: string;
    body: string;
    controlLabel: string;
    controlValue: string;
  }

  let { route, snapshot, dispatch, i18n }: Props = $props();

  let lastRequestedSection = $state<string | null>(null);

  const sectionIds = $derived(new Set(snapshot.sections.map((section) => section.id)));
  const routeCopy = $derived(settingsRouteCopy(route));

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

  function settingsRouteCopy(value: PrimaryRoute): RouteSettingsCopy {
    if (value.kind === 'settingsKodi') {
      return {
        title: 'Kodi settings',
        description:
          'Browse Kodi sections and categories through the primary app shell. Unsupported or path-like values stay read-only and redacted by the settings panel.',
        affordanceLabel: 'Kodi settings affordances',
        cards: [
          {
            title: 'Kodi settings browser',
            body: 'Browse Kodi sections and categories from the existing settings panel.',
            controlLabel: 'Selection mode',
            controlValue: 'Panel-controlled'
          },
          {
            title: 'Safe writes only',
            body: 'Editable values still dispatch through the existing validated settings write seam.',
            controlLabel: 'Write guard',
            controlValue: 'Validated controls only'
          }
        ]
      };
    }

    if (value.kind === 'settingsKodiSection') {
      return {
        title: 'Kodi settings section',
        description:
          'Open a bounded Kodi settings section through the primary app shell without echoing raw section ids. Unknown sections keep the generic settings surface safe.',
        affordanceLabel: 'Kodi section route affordances',
        cards: [
          {
            title: 'Kodi section deep link',
            body: 'Selects a known Kodi settings section once, then leaves panel navigation in control.',
            controlLabel: 'Selection guard',
            controlValue: 'Known section only'
          },
          {
            title: 'Loop protection',
            body: 'Selection dispatch is skipped when the routed section is absent, already selected, or already requested.',
            controlLabel: 'Dispatch cadence',
            controlValue: 'At most once per section'
          }
        ]
      };
    }

    if (value.kind === 'settingsAddons') {
      return {
        title: 'Add-on settings',
        description:
          'Review settings-panel diagnostics while add-on-specific execution and deep add-on settings stay explicitly deferred.',
        affordanceLabel: 'Add-on settings affordances',
        cards: [
          {
            title: 'Add-on settings',
            body: 'Deep add-on-specific settings remain deferred.',
            controlLabel: 'Add-on setting scope',
            controlValue: 'Read-only route context'
          },
          {
            title: 'Kodi-backed diagnostics',
            body: 'Existing settings load, write, rollback, and refresh diagnostics remain visible.',
            controlLabel: 'Diagnostics',
            controlValue: 'Settings panel owned'
          }
        ]
      };
    }

    if (value.kind === 'settingsNav') {
      return {
        title: 'Navigation settings',
        description:
          'Expose the navigation-settings route as app-native copy without claiming mutable menu editors are implemented.',
        affordanceLabel: 'Navigation settings affordances',
        cards: [
          {
            title: 'Navigation settings',
            body: 'Menu editing is represented as read-only route context.',
            controlLabel: 'Menu editor',
            controlValue: 'Deferred'
          },
          {
            title: 'Package-safe links',
            body: 'Primary navigation continues to use the typed package-safe route builder.',
            controlLabel: 'Route safety',
            controlValue: 'Package-safe'
          }
        ]
      };
    }

    if (value.kind === 'settingsSearch') {
      return {
        title: 'Search settings',
        description:
          'Expose the search-settings route as app-native copy while search provider editing remains read-only.',
        affordanceLabel: 'Search settings affordances',
        cards: [
          {
            title: 'Search settings',
            body: 'Search-provider editing is represented as read-only route context.',
            controlLabel: 'Search editor',
            controlValue: 'Deferred'
          },
          {
            title: 'Safe search surfaces',
            body: 'Runtime search behavior remains owned by the existing media search panel and route boundary.',
            controlLabel: 'Search behavior',
            controlValue: 'Panel-owned'
          }
        ]
      };
    }

    return {
      title: 'Web interface settings',
      description:
        'Review package-safe web interface settings context in the app shell. Browser storage and host setup remain outside this route-specific editor.',
      affordanceLabel: 'Web interface settings affordances',
      cards: [
        {
          title: 'Package-safe web settings',
          body: 'Browser storage editing remains read-only here.',
          controlLabel: 'Storage editor',
          controlValue: 'Read-only'
        },
        {
          title: 'Appearance',
          body: 'Theme controls remain available from the shell while route-specific appearance editing is deferred.',
          controlLabel: 'Display mode',
          controlValue: 'Follow current theme'
        }
      ]
    };
  }
</script>

<section class="app-page-section settings-page" aria-labelledby="settings-page-title">
  <div class="app-page-section__header">
    <p class="section-kicker">Settings surface</p>
    <h2 id="settings-page-title">{routeCopy.title}</h2>
    <p>{routeCopy.description}</p>
  </div>

  <section class="settings-affordances" aria-label={routeCopy.affordanceLabel}>
    {#each routeCopy.cards as card (card.title)}
      <article>
        <h3>{card.title}</h3>
        <p>{card.body}</p>
        <label>
          <span>{card.controlLabel}</span>
          <input type="text" value={card.controlValue} readonly aria-readonly="true" />
        </label>
      </article>
    {/each}
  </section>

  <SettingsPanel {snapshot} {dispatch} {i18n} />
</section>

<style>
  .settings-page {
    display: grid;
    gap: var(--space-md);
  }

  .app-page-section__header,
  .settings-affordances article {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-lg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }

  .settings-affordances {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
  }

  .app-page-section__header h2,
  .app-page-section__header p,
  .settings-affordances h3,
  .settings-affordances p {
    margin: 0;
  }

  .app-page-section__header p:not(.section-kicker),
  .settings-affordances p {
    color: var(--color-text-muted);
    line-height: 1.6;
  }

  .section-kicker {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  label {
    display: grid;
    gap: var(--space-xs);
    color: var(--color-text);
  }

  input[readonly] {
    max-width: 18rem;
    color: var(--color-text-muted);
  }

  @media (max-width: 760px) {
    .settings-affordances {
      grid-template-columns: 1fr;
    }
  }
</style>
