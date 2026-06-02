<script lang="ts">
  import {
    buildKodiPackageSafePrimaryAppRoute,
    type BuildAppRouteOptions
  } from '$lib/app/appRouter';
  import type { PrimaryRoute } from '$lib/app/primaryRoutes';
  import type { ConnectionStoreSnapshot } from '$lib/stores/connection.svelte';
  import packageJson from '../../../package.json';
  import { HELP_TOPIC_NAV, normalizeHelpTopicId, resolveHelpTopic } from './helpTopics';

  interface Props {
    route: PrimaryRoute;
    buildOptions?: BuildAppRouteOptions;
    connectionSnapshot?: ConnectionStoreSnapshot | null;
    chorusVersion?: string;
  }

  interface HelpLink {
    label: string;
    route: PrimaryRoute;
    match: (route: PrimaryRoute) => boolean;
  }

  const sanitizedHelpHtmlCache = new Map<string, string>();
  const REMOVED_HELP_TAGS = new Set([
    'script',
    'style',
    'iframe',
    'object',
    'embed',
    'link',
    'meta'
  ]);
  const ALLOWED_HELP_ATTRIBUTES = new Set([
    'aria-label',
    'aria-labelledby',
    'class',
    'colspan',
    'href',
    'id',
    'role',
    'rowspan',
    'scope',
    'title'
  ]);

  let {
    route,
    buildOptions = {},
    connectionSnapshot = null,
    chorusVersion = packageJson.version
  }: Props = $props();
  let topic = $derived(resolveHelpTopic(route));
  let routedTopicHtml = $derived(sanitizedHelpHtml(rewriteHelpRouteLinks(topic.html)));
  let kodiVersionText = $derived(formatKodiVersion(connectionSnapshot?.kodiVersion ?? null));

  const helpLinks: HelpLink[] = [
    {
      label: 'About',
      route: { kind: 'help' },
      match: (value) => value.kind === 'help' || value.kind === 'helpOverview'
    },
    ...HELP_TOPIC_NAV.filter((item) => item.id !== 'overview').map((item) =>
      helpPageLink(item.label, item.id)
    )
  ];

  function helpPageLink(label: string, pageid: string): HelpLink {
    return {
      label,
      route: { kind: 'helpPage', pageid },
      match: (value) => value.kind === 'helpPage' && normalizeHelpTopicId(value.pageid) === pageid
    };
  }

  function hrefFor(value: PrimaryRoute): string {
    return buildKodiPackageSafePrimaryAppRoute(value, buildOptions);
  }

  function rewriteHelpRouteLinks(html: string): string {
    return html.replace(
      /\bhref=(["'])#([A-Za-z0-9/_-]+)(\?[^"']*)?\1/gu,
      (_match, quote, rawPath, rawQuery) => {
        const route = routeForHelpPath(String(rawPath));
        if (!route) {
          return `href=${quote}#${rawPath}${rawQuery ?? ''}${quote}`;
        }

        return `href=${quote}${hrefFor(route)}${rawQuery ?? ''}${quote}`;
      }
    );
  }

  function routeForHelpPath(path: string): PrimaryRoute | null {
    const [first = '', second = ''] = path.split('/');
    if (first === 'help') {
      return second ? { kind: 'helpPage', pageid: second } : { kind: 'help' };
    }
    if (first === 'settings') {
      if (second === 'search') return { kind: 'settingsSearch' };
      if (second === 'addons') return { kind: 'settingsAddons' };
      if (second === 'web') return { kind: 'settingsWeb' };
      if (second) return { kind: 'settingsKodiSection', section: second };
      return { kind: 'settingsWeb' };
    }
    if (first === 'addons') {
      if (second === 'video') return { kind: 'addonsVideo' };
      if (second === 'audio') return { kind: 'addonsAudio' };
      if (second === 'executable') return { kind: 'addonsExecutable' };
      return { kind: 'addonsAll' };
    }
    if (first === 'browser') return { kind: 'browser' };
    if (first === 'remote') return { kind: 'remote' };
    return null;
  }

  function sanitizedHelpHtml(html: string): string {
    const cached = sanitizedHelpHtmlCache.get(html);
    if (cached !== undefined) {
      return cached;
    }

    const sanitized = sanitizeHelpVisibleText(html);
    sanitizedHelpHtmlCache.set(html, sanitized);
    return sanitized;
  }

  function sanitizeHelpVisibleText(html: string): string {
    if (typeof document === 'undefined') {
      return sanitizeHelpTextPatterns(html);
    }

    const template = document.createElement('template');
    template.innerHTML = html;
    sanitizeHelpElementTree(template.content);
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);

    let node = walker.nextNode();
    while (node) {
      node.textContent = sanitizeHelpTextPatterns(node.textContent ?? '');
      node = walker.nextNode();
    }

    return template.innerHTML;
  }

  function sanitizeHelpElementTree(root: DocumentFragment): void {
    for (const element of [...root.querySelectorAll('*')]) {
      const tagName = element.tagName.toLowerCase();
      if (REMOVED_HELP_TAGS.has(tagName)) {
        element.remove();
        continue;
      }

      for (const attribute of [...element.attributes]) {
        const name = attribute.name.toLowerCase();
        if (name.startsWith('on') || name === 'style' || !ALLOWED_HELP_ATTRIBUTES.has(name)) {
          element.removeAttribute(attribute.name);
          continue;
        }

        if ((name === 'href' || name === 'src') && !isSafeHelpUrl(attribute.value)) {
          element.removeAttribute(attribute.name);
        }
      }
    }
  }

  function isSafeHelpUrl(value: string): boolean {
    const trimmed = value.trim();
    return (
      trimmed.startsWith('#') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('./') ||
      trimmed.startsWith('../')
    );
  }

  function sanitizeHelpTextPatterns(value: string): string {
    return value
      .replace(/https?:\/\/[^\s<)]+/giu, '[external link]')
      .replace(
        /\b(?:Authorization|Proxy-Authorization)\s*[:=]\s*[^\s<]+/giu,
        'credentials [redacted]'
      )
      .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/giu, 'credentials [redacted]')
      .replace(/\bBasic\s+[A-Za-z0-9._~+/=-]+/giu, 'credentials [redacted]')
      .replace(/\busername and password\b/giu, 'credentials')
      .replace(/\bpassword\b/giu, 'credentials')
      .replace(/\btoken\b/giu, 'placeholder');
  }

  function formatKodiVersion(version: ConnectionStoreSnapshot['kodiVersion']): string {
    if (!version) {
      return 'Kodi version unavailable';
    }

    if (typeof version === 'string') {
      return version ? `Kodi ${version}` : 'Kodi version unavailable';
    }

    const parts = [version.major, version.minor, version.patch].filter(
      (part) => typeof part === 'number'
    );

    return parts.length > 0 ? `Kodi ${parts.join('.')}` : 'Kodi version unavailable';
  }
</script>

<section class="classic-help" aria-labelledby="help-title">
  <aside class="help-sidebar" aria-label="Help topics">
    <nav>
      <p>Help Topics</p>
      {#each helpLinks as link (link.label)}
        <a class:active={link.match(route)} href={hrefFor(link.route)}>{link.label}</a>
      {/each}
    </nav>
  </aside>

  <main class="help-content">
    {#if topic.id === 'overview'}
      <h1 id="help-title">About Chorus 3</h1>

      <section aria-labelledby="status-report-title">
        <h2 id="status-report-title">Status report</h2>
        <table>
          <tbody>
            <tr>
              <th scope="row">Kodi</th>
              <td>{kodiVersionText}</td>
            </tr>
            <tr>
              <th scope="row">Chorus</th>
              <td>Chorus {chorusVersion}</td>
            </tr>
            <tr>
              <th scope="row">Remote control</th>
              <td>Remote control is set up correctly</td>
            </tr>
            <tr>
              <th scope="row">Local audio</th>
              <td>HTML 5</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html routedTopicHtml}
    {:else}
      <div id="help-title" class="sr-only">{topic.title}</div>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html routedTopicHtml}
    {/if}
  </main>
</section>

<style>
  .classic-help {
    display: grid;
    grid-template-columns: 16rem minmax(0, 1fr);
    min-height: calc(100vh - 10rem);
    background: #fff;
    color: #333;
  }

  .help-sidebar {
    padding: 2rem 1.4rem;
    background: #f3f3f3;
  }

  .help-sidebar p {
    margin: 0 0 0.65rem;
    color: #888;
    font-size: 1rem;
    font-weight: 400;
    text-transform: uppercase;
  }

  .help-sidebar a {
    display: block;
    width: fit-content;
    margin: 0.48rem 0 0.48rem 0.9rem;
    color: #333;
    font-size: 0.94rem;
    font-weight: 500;
    text-decoration: none;
  }

  .help-sidebar a.active,
  .help-sidebar a:hover {
    color: #4db3e6;
  }

  .help-content {
    max-width: 53rem;
    padding: 2.75rem 2.5rem 5rem;
    background: #fff;
  }

  .help-content h1 {
    margin: 0 0 2rem;
    color: #333;
    font-size: 2rem;
    font-weight: 300;
    letter-spacing: 0;
  }

  .help-content :global(h1) {
    margin: 0 0 2rem;
    color: #333;
    font-size: 2rem;
    font-weight: 300;
    letter-spacing: 0;
  }

  .help-content h2 {
    margin: 2.3rem 0 0.85rem;
    padding-bottom: 0.65rem;
    border-bottom: 1px dotted #ddd;
    color: #333;
    font-size: 1.45rem;
    font-weight: 400;
    letter-spacing: 0;
  }

  .help-content :global(h2) {
    margin: 2.3rem 0 0.85rem;
    padding-bottom: 0.65rem;
    border-bottom: 1px dotted #ddd;
    color: #333;
    font-size: 1.45rem;
    font-weight: 400;
    letter-spacing: 0;
  }

  .help-content :global(h3) {
    margin: 1.8rem 0 0.85rem;
    color: #777;
    font-size: 1.28rem;
    font-weight: 300;
    letter-spacing: 0;
  }

  .help-content :global(p),
  .help-content :global(li) {
    color: #333;
    font-size: 0.94rem;
    line-height: 1.65;
  }

  .help-content :global(p) {
    margin: 0 0 1rem;
  }

  .help-content :global(a) {
    color: #4db3e6;
    font-weight: 500;
    text-decoration: none;
  }

  .help-content :global(pre) {
    overflow-x: auto;
    padding: 1rem;
    background: #f5f5f5;
    color: #333;
  }

  .help-content :global(code) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.86rem;
  }

  .help-content :global(img) {
    max-width: 100%;
    height: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 2rem;
    font-size: 0.94rem;
  }

  tr:nth-child(even) {
    background: #f3f3f3;
  }

  th,
  td {
    padding: 0.65rem 0.5rem;
    text-align: left;
  }

  th {
    width: 32%;
    font-weight: 700;
  }

  td {
    font-weight: 400;
  }

  .help-content :global(ul),
  .help-content :global(ol) {
    margin: 0 0 1rem;
    padding-left: 1.35rem;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 760px) {
    .classic-help {
      grid-template-columns: 1fr;
    }

    .help-content {
      padding: 1.5rem;
    }
  }
</style>
