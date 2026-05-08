<script lang="ts">
  interface LabItem {
    title: string;
    description: string;
    href: string;
  }

  const items: readonly LabItem[] = [
    {
      title: 'API browser',
      description: 'Execute any API command.',
      href: '/'
    },
    {
      title: 'Screenshot',
      description: 'Take a screenshot of Kodi right now.',
      href: '/'
    },
    {
      title: 'Icon browser',
      description: 'View all the icons available to Chorus.',
      href: '/'
    }
  ];
</script>

<section class="classic-lab-landing" aria-labelledby="lab-landing-title">
  <h2 id="lab-landing-title">Lab</h2>
  <div class="lab-items">
    {#each items as item (item.title)}
      <a class="lab-item" href={item.href}>
        <h4>{item.title}</h4>
        <p>{item.description}</p>
      </a>
    {/each}
  </div>
</section>

<style>
  .classic-lab-landing {
    display: grid;
    gap: 1rem;
    padding: 2rem;
  }

  h2 {
    margin: 0;
    font-size: 2.25rem;
    font-weight: 300;
  }

  .lab-items {
    display: grid;
    gap: 0.75rem;
    max-width: 44rem;
  }

  .lab-item {
    display: block;
    border: 1px solid #ddd;
    padding: 1rem;
    background: #fff;
    color: #333;
    text-decoration: none;
    box-shadow: 0 1px 2px rgb(0 0 0 / 12%);
  }

  .lab-item:hover,
  .lab-item:focus-visible {
    color: #333;
    background: #f7f7f7;
  }

  h4,
  p {
    margin: 0;
  }

  h4 {
    font-size: 1.15rem;
    font-weight: 600;
  }

  p {
    margin-top: 0.35rem;
    color: #777;
    line-height: 1.45;
  }
</style>
