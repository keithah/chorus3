<script module lang="ts">
  type IconDictionary = Record<string, string>;

  interface IconEntry {
    className: string;
    label: string;
  }

  interface IconCatalogs {
    material: IconEntry[];
    custom: IconEntry[];
  }

  let iconCatalogPromise: Promise<IconCatalogs> | null = null;

  async function loadIconCatalogs(): Promise<IconCatalogs | null> {
    iconCatalogPromise ??= loadIconCatalogModules();

    try {
      return await iconCatalogPromise;
    } catch {
      iconCatalogPromise = null;
      return null;
    }
  }

  async function loadIconCatalogModules(): Promise<IconCatalogs> {
    const [materialIcons, customIcons] = await Promise.all([
      import('$lib/assets/classic/icons/mdi.json'),
      import('$lib/assets/classic/icons/icomoon.json')
    ]);

    return {
      material: toIconEntries(materialIcons.default as IconDictionary),
      custom: toIconEntries(customIcons.default as IconDictionary)
    };
  }

  function toIconEntries(value: IconDictionary): IconEntry[] {
    return Object.entries(value)
      .map(([className, label]) => ({ className, label }))
      .sort((a, b) => a.className.localeCompare(b.className));
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';

  let materialIconEntries = $state<IconEntry[]>([]);
  let customIconEntries = $state<IconEntry[]>([]);
  let iconStatus = $state<'loading' | 'ready' | 'error'>('loading');

  onMount(() => {
    let mounted = true;
    void loadIconCatalogs().then((catalogs) => {
      if (!mounted) {
        return;
      }

      if (!catalogs) {
        iconStatus = 'error';
        return;
      }

      materialIconEntries = catalogs.material;
      customIconEntries = catalogs.custom;
      iconStatus = 'ready';
    });

    return () => {
      mounted = false;
    };
  });
</script>

<section class="classic-icon-browser" aria-labelledby="icon-browser-title">
  <h2 id="icon-browser-title">Icon browser</h2>

  {#if iconStatus === 'loading'}
    <p>Loading icons...</p>
  {:else if iconStatus === 'error'}
    <p>Could not load icon catalogs.</p>
  {/if}

  <section aria-labelledby="icons-material-title">
    <h3 id="icons-material-title">Material Icons</h3>
    <ul id="icons-material" class="icon-grid">
      {#each materialIconEntries as icon (icon.className)}
        <li>
          <i class={icon.className} aria-hidden="true"></i>
          <span>{icon.className}</span>
        </li>
      {/each}
    </ul>
  </section>

  <section aria-labelledby="icons-custom-title">
    <h3 id="icons-custom-title">Custom Icons</h3>
    <ul id="icons-custom" class="icon-grid">
      {#each customIconEntries as icon (icon.className)}
        <li>
          <i class={icon.className} aria-hidden="true"></i>
          <span>{icon.className}</span>
        </li>
      {/each}
    </ul>
  </section>
</section>

<style>
  .classic-icon-browser {
    display: grid;
    gap: 1.5rem;
    padding: 2rem;
    color: #333;
  }

  h2,
  h3 {
    margin: 0;
    font-weight: 300;
  }

  h2 {
    font-size: 2.25rem;
  }

  h3 {
    font-size: 1.6rem;
  }

  section {
    display: grid;
    gap: 0.75rem;
  }

  .icon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
    border: 1px solid #ddd;
    padding: 0.5rem 0.65rem;
    background: #fff;
    box-shadow: 0 1px 2px rgb(0 0 0 / 10%);
  }

  i {
    flex: 0 0 auto;
    width: 1.5rem;
    color: #555;
    text-align: center;
    font-size: 1.25rem;
  }

  span {
    min-width: 0;
    overflow: hidden;
    color: #666;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
