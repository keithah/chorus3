import type { PrimaryRoute } from '$lib/app/primaryRoutes';

export type HelpTopicId = 'overview' | 'keyboard' | 'readme' | 'changelog' | 'translations' | 'license';

export interface HelpTopicCard {
  readonly title: string;
  readonly copy: string;
}

export interface HelpTopic {
  readonly id: HelpTopicId;
  readonly title: string;
  readonly summary: string;
  readonly cards: readonly HelpTopicCard[];
}

export interface ResolvedHelpTopic {
  readonly title: string;
  readonly summary: string;
  readonly cards: readonly HelpTopicCard[];
  readonly known: boolean;
}

export const HELP_TOPICS = {
  overview: {
    id: 'overview',
    title: 'About Chorus',
    summary: 'Safe static help for the app-native Chorus shell.',
    cards: [
      { title: 'About Chorus', copy: 'A Kodi web interface shaped around safe app-native media control.' },
      { title: 'Status report', copy: 'Use visible route headings and status labels to identify the active surface.' },
      { title: 'What is Chorus?', copy: 'Chorus is a browser-based controller for Kodi libraries, playback, settings, and add-ons.' }
    ]
  },
  keyboard: {
    id: 'keyboard',
    title: 'Keyboard controls',
    summary: 'Keyboard shortcuts for safe shell navigation and media control.',
    cards: [
      { title: 'Keyboard controls', copy: 'Remote shortcuts, playback shortcuts, and focus-safe shell controls.' },
      { title: 'Remote shortcuts', copy: 'Arrow keys, Enter, Back, and Home map to Kodi remote input when focus is not editing text.' },
      { title: 'Playback shortcuts', copy: 'Media keys and guarded shell controls operate the active Kodi player.' }
    ]
  },
  readme: {
    id: 'readme',
    title: 'Readme',
    summary: 'Static package guidance for running Chorus inside Kodi or a browser.',
    cards: [
      { title: 'Readme', copy: 'Project usage guidance is represented as safe static app help.' },
      { title: 'Package usage', copy: 'Kodi package routes mount under the add-on base path without credential-bearing examples.' },
      { title: 'Primary shell routes', copy: 'Primary routes render in the app shell with stable headings and status labels.' }
    ]
  },
  changelog: {
    id: 'changelog',
    title: 'Changelog',
    summary: 'Static release-history guidance without loading external files at runtime.',
    cards: [
      { title: 'Changelog', copy: 'Release notes summarize app changes without exposing local environment details.' },
      { title: 'Release notes', copy: 'Use route-specific verification output to identify which packaged surface changed.' },
      { title: 'Verification history', copy: 'Build, package, and browser checks provide repeatable release confidence.' }
    ]
  },
  translations: {
    id: 'translations',
    title: 'Translations',
    summary: 'Locale help for the app shell and package-safe language controls.',
    cards: [
      { title: 'Translations', copy: 'Language support is available through the shell locale selector.' },
      { title: 'Language support', copy: 'Translated labels stay inside app UI and avoid reflecting route payloads.' },
      { title: 'Locale selector', copy: 'Choose a supported locale from the app shell when translation data is available.' }
    ]
  },
  license: {
    id: 'license',
    title: 'License',
    summary: 'Static open-source notice for Chorus package users.',
    cards: [
      { title: 'License', copy: 'License details are represented as static project information.' },
      { title: 'Project license', copy: 'Review the tracked project license before redistributing modified builds.' },
      { title: 'Open source notice', copy: 'Third-party and project notices should remain free of local host or credential details.' }
    ]
  }
} as const satisfies Record<HelpTopicId, HelpTopic>;

const HELP_LANDING_TOPIC: ResolvedHelpTopic = {
  title: 'About Chorus',
  summary: 'Find safe static help for the primary shell without reflecting raw route or storage details.',
  known: true,
  cards: [
    ...HELP_TOPICS.overview.cards,
    { title: 'Keyboard controls', copy: 'Use keyboard and media keys for remote input and playback where supported.' },
    { title: 'Readme', copy: 'Package usage and primary shell guidance live as safe static app help.' },
    { title: 'Changelog', copy: 'Release notes summarize changes without embedding local environment details.' },
    { title: 'Translations', copy: 'Locale support is available from the shell controls.' },
    { title: 'License', copy: 'License details remain available as static project information.' }
  ]
};

const GENERIC_HELP_TOPIC: ResolvedHelpTopic = {
  title: 'Help page',
  summary: 'This safe help route is available as an app-native frame while detailed content remains deferred.',
  known: false,
  cards: [
    { title: 'Help content placeholder', copy: 'This help route is supported by a safe app-native frame.' },
    { title: 'Deferred help topic', copy: 'Detailed content can land later without changing route or package boundaries.' },
    { title: 'Safe fallback', copy: 'Unknown help identifiers are not reflected into visible copy.' }
  ]
};

export function isKnownHelpTopicId(value: string): value is HelpTopicId {
  return Object.hasOwn(HELP_TOPICS, value);
}

export function resolveHelpTopic(route: PrimaryRoute): ResolvedHelpTopic {
  if (route.kind === 'help') {
    return HELP_LANDING_TOPIC;
  }

  if (route.kind === 'helpOverview') {
    return { ...HELP_TOPICS.overview, known: true };
  }

  if (route.kind === 'helpPage' && isKnownHelpTopicId(route.pageid)) {
    return { ...HELP_TOPICS[route.pageid], known: true };
  }

  return GENERIC_HELP_TOPIC;
}
