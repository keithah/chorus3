import {
  KodiHttpClientError,
  isKodiHttpClientError,
  type PlayerRepeatValue,
  type PlayerSeekStep
} from '$lib/kodi';
import { redactStoreErrorMessage } from '$lib/safety/redaction';
import type {
  PlayerDispatchErrorSource,
  PlayerDispatchSafeErrorSnapshot,
  PlayerDispatchSnapshot
} from './playerDispatchTypes';
import type { PlayerStoreSnapshot } from './player.svelte';

export const DEFAULT_PLAYER_DISPATCH_SNAPSHOT: PlayerDispatchSnapshot = {
  mode: 'kodi',
  commandStatus: 'idle',
  lastCommand: null,
  lastError: null,
  lastCompletedAt: null
};

export const VALID_SEEK_STEPS = new Set<PlayerSeekStep>([
  'smallforward',
  'smallbackward',
  'bigforward',
  'bigbackward'
]);

export const VALID_REPEAT_VALUES = new Set<PlayerRepeatValue>(['off', 'one', 'all', 'cycle']);

export function validateFiniteNumber(
  value: number,
  code: string
): PlayerDispatchSafeErrorSnapshot | null {
  return Number.isFinite(value)
    ? null
    : createInputError(code, 'Enter a finite numeric command value.');
}

export function validateBoundedNumber(
  value: number,
  min: number,
  max: number,
  code: string
): PlayerDispatchSafeErrorSnapshot | null {
  if (!Number.isFinite(value) || value < min || value > max) {
    return createInputError(code, `Enter a value from ${min} to ${max}.`);
  }

  return null;
}

export function createInputError(code: string, message: string): PlayerDispatchSafeErrorSnapshot {
  return { source: 'input', code, message };
}

export function createConfigError(code: string, message: string): PlayerDispatchSafeErrorSnapshot {
  return { source: 'config', code, message };
}

export function createSafeError(error: unknown): PlayerDispatchSafeErrorSnapshot {
  if (isKodiHttpClientError(error) || error instanceof KodiHttpClientError) {
    return {
      source: 'http',
      code: error.code,
      message: sanitizeErrorMessage(error.message),
      endpoint: error.endpoint
    };
  }

  if (error instanceof Error && isErrorWithCode(error)) {
    const source: PlayerDispatchErrorSource = error.code.startsWith('input/')
      ? 'input'
      : error.code.startsWith('config/')
        ? 'config'
        : 'command';

    return {
      source,
      code: error.code,
      message: sanitizeErrorMessage(error.message)
    };
  }

  return {
    source: 'command',
    code: 'command/failed',
    message: sanitizeErrorMessage(error instanceof Error ? error.message : 'Kodi command failed.')
  };
}

export function clonePlayerDispatchSnapshot(
  snapshot: PlayerDispatchSnapshot
): PlayerDispatchSnapshot {
  return {
    ...snapshot,
    lastError: snapshot.lastError ? cloneError(snapshot.lastError) : null
  };
}

export function cloneError(
  error: PlayerDispatchSafeErrorSnapshot
): PlayerDispatchSafeErrorSnapshot {
  return {
    ...error,
    ...(error.endpoint ? { endpoint: { ...error.endpoint } } : {})
  };
}

export function resolveSinglePlayerIdFromSnapshot(
  snapshot: PlayerStoreSnapshot
): { ok: true; playerid: number } | { ok: false; error: PlayerDispatchSafeErrorSnapshot } {
  if (!snapshot.primaryPlayer || snapshot.activePlayers.length === 0) {
    return {
      ok: false,
      error: {
        source: 'player',
        code: 'player/no-active-player',
        message: 'No active Kodi player is available for this command.'
      }
    };
  }

  if (snapshot.activePlayers.length > 1) {
    return {
      ok: false,
      error: {
        source: 'player',
        code: 'player/multiple-active-players',
        message: 'Multiple Kodi players are active. Choose one player before sending commands.'
      }
    };
  }

  return { ok: true, playerid: snapshot.primaryPlayer.playerid };
}

export function resolveSingleVideoPlayerIdFromSnapshot(
  snapshot: PlayerStoreSnapshot
): { ok: true; playerid: number } | { ok: false; error: PlayerDispatchSafeErrorSnapshot } {
  if (!snapshot.primaryPlayer || snapshot.activePlayers.length === 0) {
    return {
      ok: false,
      error: {
        source: 'player',
        code: 'player/no-active-player',
        message: 'No active Kodi video player is available for browser streaming.'
      }
    };
  }

  if (snapshot.activePlayers.length > 1) {
    return {
      ok: false,
      error: {
        source: 'player',
        code: 'player/multiple-active-players',
        message: 'Multiple Kodi players are active. Choose one player before browser streaming.'
      }
    };
  }

  if (snapshot.primaryPlayer.type !== 'video') {
    return {
      ok: false,
      error: {
        source: 'player',
        code: 'player/no-active-video-player',
        message: 'Choose a movie with an active Kodi video player before browser streaming.'
      }
    };
  }

  return { ok: true, playerid: snapshot.primaryPlayer.playerid };
}

function isErrorWithCode(error: Error): error is Error & { code: string } {
  return (
    Object.prototype.hasOwnProperty.call(error, 'code') &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

function sanitizeErrorMessage(message: string): string {
  return redactStoreErrorMessage(message);
}
