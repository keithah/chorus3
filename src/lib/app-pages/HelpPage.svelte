<script lang="ts">
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';

  interface HelpCard {
    title: string;
    copy: string;
  }

  interface Props {
    route: PrimaryRoute;
  }

  let { route }: Props = $props();

  const cards = $derived(helpCards(route));

  function helpCards(value: PrimaryRoute): HelpCard[] {
    if (value.kind === 'helpPage' && value.pageid === 'keyboard') {
      return [
        { title: 'Keyboard controls', copy: 'Remote shortcuts, playback shortcuts, and focus-safe shell controls.' },
        { title: 'Remote shortcuts', copy: 'Arrow keys, Enter, Back, and Home map to Kodi remote input when focus is not editing text.' },
        { title: 'Playback shortcuts', copy: 'Media keys and guarded shell controls operate the active Kodi player.' }
      ];
    }

    if (value.kind === 'helpOverview') {
      return [
        { title: 'About Chorus', copy: 'A Kodi web interface shaped around safe app-native media control.' },
        { title: 'Status report', copy: 'Use visible route headings and status labels to identify the active surface.' },
        { title: 'What is Chorus?', copy: 'Chorus is a browser-based controller for Kodi libraries, playback, and settings.' }
      ];
    }

    return [
      { title: 'About Chorus', copy: 'A Kodi web interface shaped around safe app-native media control.' },
      { title: 'Status report', copy: 'Route and panel status messages report safe, redacted runtime state.' },
      { title: 'What is Chorus?', copy: 'Chorus lets a browser control Kodi media without exposing raw transport details.' },
      { title: 'Keyboard controls', copy: 'Use keyboard and media keys for remote input and playback where supported.' },
      { title: 'Readme', copy: 'Project usage and package guidance live with the app documentation.' },
      { title: 'Changelog', copy: 'Release notes summarize changes without embedding local environment details.' },
      { title: 'Translations', copy: 'Locale support is available from the shell controls.' },
      { title: 'License', copy: 'License details remain available as static project information.' }
    ];
  }
</script>

<section class="help-page" aria-labelledby="help-page-title">
  <div class="app-page-section__header">
    <p class="section-kicker">Help</p>
    <h2 id="help-page-title">About Chorus</h2>
    <p>Find safe static help for the primary shell without reflecting raw route or storage details.</p>
  </div>

  <div class="help-card-grid" aria-label="Help topics">
    {#each cards as card (card.title)}
      <article class="help-card">
        <h3>{card.title}</h3>
        <p>{card.copy}</p>
      </article>
    {/each}
  </div>
</section>

<style>
  .help-page {
    display: grid;
    gap: var(--space-md);
  }

  .app-page-section__header,
  .help-card {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-lg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }

  .help-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: var(--space-md);
  }

  .app-page-section__header h2,
  .app-page-section__header p,
  .help-card h3,
  .help-card p {
    margin: 0;
  }

  .app-page-section__header p:not(.section-kicker),
  .help-card p {
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
</style>
