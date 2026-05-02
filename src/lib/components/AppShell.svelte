<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
    chrome?: 'default' | 'media';
  }

  let { children, chrome = 'default' }: Props = $props();
</script>

<div class="shell" data-chrome={chrome}>
  <div class="ambient ambient-one" aria-hidden="true"></div>
  <div class="ambient ambient-two" aria-hidden="true"></div>
  <div class="shell-frame">
    {@render children?.()}
  </div>
</div>

<style>
  .shell {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    padding: clamp(var(--space-lg), 4vw, var(--space-2xl));
    color: var(--color-text);
    background:
      radial-gradient(
        circle at 12% 12%,
        color-mix(in srgb, var(--color-accent) 20%, transparent),
        transparent 28rem
      ),
      radial-gradient(
        circle at 82% 0%,
        color-mix(in srgb, var(--color-success) 14%, transparent),
        transparent 24rem
      ),
      linear-gradient(
        135deg,
        var(--color-background),
        color-mix(in srgb, var(--color-surface) 54%, var(--color-background))
      );
  }

  .shell[data-chrome='media'] {
    overflow: auto;
    padding: 0;
    background: #e8e8e8;
  }

  .shell::before {
    position: absolute;
    inset: 0;
    pointer-events: none;
    content: '';
    background-image:
      linear-gradient(rgb(255 255 255 / 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgb(255 255 255 / 0.025) 1px, transparent 1px);
    background-size: 4rem 4rem;
    mask-image: linear-gradient(to bottom, rgb(0 0 0 / 0.72), transparent 76%);
  }

  .shell[data-chrome='media']::before,
  .shell[data-chrome='media'] .ambient {
    display: none;
  }

  .ambient {
    position: absolute;
    pointer-events: none;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    opacity: 0.5;
  }

  .ambient-one {
    top: 14%;
    right: clamp(-6rem, -8vw, -2rem);
    width: clamp(14rem, 30vw, 30rem);
    aspect-ratio: 1;
  }

  .ambient-two {
    bottom: 8%;
    left: clamp(-8rem, -10vw, -3rem);
    width: clamp(10rem, 22vw, 22rem);
    aspect-ratio: 1;
  }

  .shell-frame {
    position: relative;
    z-index: 1;
    display: grid;
    gap: var(--space-xl);
    width: min(100%, 72rem);
    min-height: calc(100vh - clamp(var(--space-lg), 4vw, var(--space-2xl)) * 2);
    margin-inline: auto;
  }

  .shell[data-chrome='media'] .shell-frame {
    width: 100%;
    min-height: 100vh;
    margin: 0;
  }
</style>
