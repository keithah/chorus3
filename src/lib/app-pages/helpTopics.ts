import type { PrimaryRoute } from '$lib/app/primaryRoutes';

import addonsHtml from './help-en/addons.html?raw';
import appChangelogHtml from './help-en/app-changelog.html?raw';
import appReadmeHtml from './help-en/app-readme.html?raw';
import developersHtml from './help-en/developers.html?raw';
import helpOverviewHtml from './help-en/help-overview.html?raw';
import keybindReadmeHtml from './help-en/keybind-readme.html?raw';
import langReadmeHtml from './help-en/lang-readme.html?raw';
import licenseHtml from './help-en/license.html?raw';

export type HelpTopicId =
  | 'overview'
  | 'app-readme'
  | 'app-changelog'
  | 'keybind-readme'
  | 'addons'
  | 'developers'
  | 'lang-readme'
  | 'license';

export type HelpTopicAlias = 'readme' | 'changelog' | 'keyboard' | 'translations';

export interface HelpTopic {
  readonly id: HelpTopicId;
  readonly title: string;
  readonly html: string;
}

export interface ResolvedHelpTopic {
  readonly id: HelpTopicId | 'generic';
  readonly title: string;
  readonly html: string;
  readonly known: boolean;
}

export const HELP_TOPIC_NAV = [
  { id: 'overview', label: 'About' },
  { id: 'app-readme', label: 'Readme' },
  { id: 'app-changelog', label: 'Changelog' },
  { id: 'keybind-readme', label: 'Keyboard' },
  { id: 'addons', label: 'Add-ons' },
  { id: 'developers', label: 'Developers' },
  { id: 'lang-readme', label: 'Translations' },
  { id: 'license', label: 'License' }
] as const satisfies readonly { id: HelpTopicId; label: string }[];

export const HELP_TOPICS = {
  overview: {
    id: 'overview',
    title: 'About Chorus 3',
    html: helpOverviewHtml
  },
  'app-readme': {
    id: 'app-readme',
    title: 'Readme',
    html: appReadmeHtml
  },
  'app-changelog': {
    id: 'app-changelog',
    title: 'Changelog',
    html: appChangelogHtml
  },
  'keybind-readme': {
    id: 'keybind-readme',
    title: 'Keyboard',
    html: keybindReadmeHtml
  },
  addons: {
    id: 'addons',
    title: 'Add-ons',
    html: addonsHtml
  },
  developers: {
    id: 'developers',
    title: 'Developers',
    html: developersHtml
  },
  'lang-readme': {
    id: 'lang-readme',
    title: 'Translations',
    html: langReadmeHtml
  },
  license: {
    id: 'license',
    title: 'License',
    html: licenseHtml
  }
} as const satisfies Record<HelpTopicId, HelpTopic>;

const HELP_TOPIC_ALIASES = {
  readme: 'app-readme',
  changelog: 'app-changelog',
  keyboard: 'keybind-readme',
  translations: 'lang-readme'
} as const satisfies Record<HelpTopicAlias, HelpTopicId>;

const GENERIC_HELP_TOPIC: ResolvedHelpTopic = {
  id: 'generic',
  title: 'Help page',
  html: '<h1>Help page</h1><p>This help route is supported by a safe app-native frame.</p><p>Unknown help identifiers are not reflected into visible copy.</p>',
  known: false
};

export function normalizeHelpTopicId(value: string): HelpTopicId | null {
  if (isKnownHelpTopicId(value)) {
    return value;
  }

  if (isHelpTopicAlias(value)) {
    return HELP_TOPIC_ALIASES[value];
  }

  return null;
}

export function isKnownHelpTopicId(value: string): value is HelpTopicId {
  return Object.hasOwn(HELP_TOPICS, value);
}

function isHelpTopicAlias(value: string): value is HelpTopicAlias {
  return Object.hasOwn(HELP_TOPIC_ALIASES, value);
}

export function resolveHelpTopic(route: PrimaryRoute): ResolvedHelpTopic {
  if (route.kind === 'help' || route.kind === 'helpOverview') {
    return { ...HELP_TOPICS.overview, known: true };
  }

  if (route.kind === 'helpPage') {
    const id = normalizeHelpTopicId(route.pageid);

    if (id) {
      return { ...HELP_TOPICS[id], known: true };
    }
  }

  return GENERIC_HELP_TOPIC;
}
