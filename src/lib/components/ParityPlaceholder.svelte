<script lang="ts">
  import { type ParityRoutePlaceholder } from '$lib/app/appRouter';
  import type { TranslationContext } from '$lib/i18n';
  import { createEnglishTranslationContext } from '$lib/i18n/runtimeTranslationContext';

  interface Props {
    placeholder: ParityRoutePlaceholder;
    packageBasePath?: string;
    i18n?: TranslationContext;
  }

  let {
    placeholder,
    packageBasePath = '',
    i18n = createEnglishTranslationContext()
  }: Props = $props();

  const statusToneByStatus: Record<ParityRoutePlaceholder['status'], string> = {
    missing: 'warning',
    deferred: 'neutral',
    intentionallyChanged: 'neutral'
  };
  const unsafePathPattern =
    /(authorization|basic|sentinel_secret|chorus3_sentinel_secret|localstorage|sessionstorage|admin:p@ssword|secret|token|password|smb:|special:|:\/\/|@)/i;

  let recoveryHref = $derived(buildPackageRecoveryHref(placeholder.recoveryRoute, packageBasePath));
  let statusTone = $derived(statusToneByStatus[placeholder.status] ?? 'neutral');

  function buildPackageRecoveryHref(recoveryRoute: string, basePath: string): string {
    const normalizedRoute = normalizePath(recoveryRoute);
    const normalizedBase = normalizePath(basePath);

    if (!normalizedBase || normalizedBase === '/') {
      return normalizedRoute;
    }

    return normalizedRoute === '/' ? normalizedBase : `${normalizedBase}${normalizedRoute}`;
  }

  function normalizePath(path: string): string {
    const pathOnly = path.split(/[?#]/u, 1)[0]?.trim() ?? '';
    if (!pathOnly || unsafePathPattern.test(pathOnly)) return '';
    const withLeadingSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
    const compacted = withLeadingSlash.replace(/\/{2,}/gu, '/');
    return compacted.length > 1 ? compacted.replace(/\/+$/gu, '') : compacted;
  }
</script>

<article class="parity-placeholder" aria-labelledby={`parity-placeholder-${placeholder.id}-title`}>
  <div class="parity-placeholder-header">
    <p class="parity-placeholder-kicker">{i18n.t('parity.placeholder.kicker')}</p>
    <h2 id={`parity-placeholder-${placeholder.id}-title`}>{placeholder.title}</h2>
    <span class={`parity-placeholder-pill parity-placeholder-pill-${statusTone}`}>
      {placeholder.status}
    </span>
  </div>

  <p class="parity-placeholder-incomplete">{i18n.t('parity.placeholder.incomplete')}</p>
  <p class="parity-placeholder-description">{placeholder.description}</p>

  <dl class="parity-placeholder-facts" aria-label={i18n.t('parity.placeholder.factsAria')}>
    <div>
      <dt>{i18n.t('parity.placeholder.surface')}</dt>
      <dd>{placeholder.surface}</dd>
    </div>
    <div>
      <dt>{i18n.t('parity.placeholder.status')}</dt>
      <dd>{placeholder.status}</dd>
    </div>
    <div>
      <dt>{i18n.t('parity.placeholder.owner')}</dt>
      <dd>{placeholder.owner}</dd>
    </div>
    <div>
      <dt>{i18n.t('parity.placeholder.recoveryPath')}</dt>
      <dd><code>{placeholder.recoveryRoute}</code></dd>
    </div>
  </dl>

  <a class="parity-placeholder-recovery" href={recoveryHref}>
    {i18n.t('parity.placeholder.openRecovery')}
  </a>
</article>

<style>
  .parity-placeholder {
    display: grid;
    gap: var(--space-lg);
    padding: var(--space-xl);
    background:
      linear-gradient(
        145deg,
        color-mix(in srgb, var(--color-warning) 10%, transparent),
        transparent 64%
      ),
      var(--color-surface);
    border: 1px solid color-mix(in srgb, var(--color-warning) 35%, var(--color-border));
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-soft);
  }

  .parity-placeholder-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-sm) var(--space-md);
    align-items: start;
  }

  .parity-placeholder-kicker,
  .parity-placeholder-incomplete,
  .parity-placeholder-description,
  h2,
  dl {
    margin: 0;
  }

  .parity-placeholder-kicker {
    grid-column: 1 / -1;
    color: var(--color-text-muted);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h2 {
    font-size: clamp(1.4rem, 3vw, 2rem);
    line-height: 1.1;
  }

  .parity-placeholder-pill {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    padding: var(--space-2xs) var(--space-sm);
    color: var(--status-color, var(--color-text-muted));
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: color-mix(in srgb, var(--status-color, var(--color-text-muted)) 12%, transparent);
    border: 1px solid
      color-mix(in srgb, var(--status-color, var(--color-text-muted)) 30%, transparent);
    border-radius: var(--radius-pill);
  }

  .parity-placeholder-pill::before {
    width: 0.5rem;
    aspect-ratio: 1;
    content: '';
    background: currentColor;
    border-radius: 50%;
    box-shadow: 0 0 1rem currentColor;
  }

  .parity-placeholder-pill-warning {
    --status-color: var(--color-warning);
  }

  .parity-placeholder-pill-neutral {
    --status-color: var(--color-text-muted);
  }

  .parity-placeholder-incomplete {
    max-width: 48rem;
    font-weight: 700;
  }

  .parity-placeholder-description {
    max-width: 52rem;
    color: var(--color-text-muted);
    line-height: 1.65;
  }

  .parity-placeholder-facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: var(--space-sm);
  }

  .parity-placeholder-facts div {
    display: grid;
    gap: var(--space-2xs);
    padding: var(--space-sm);
    background: color-mix(in srgb, var(--color-surface-raised) 72%, transparent);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  dt {
    color: var(--color-text-muted);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  dd {
    margin: 0;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  code {
    font-family: var(--font-mono);
  }

  .parity-placeholder-recovery {
    justify-self: start;
  }
</style>
