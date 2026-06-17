import { describe, expect, it } from 'vitest';

import {
  isPlayerStateRefreshNotification,
  isQueueRefreshNotification,
  parseKodiWebSocketMessage,
  parseKodiNotificationMessage,
  type KodiNotification,
  type MalformedKodiNotification
} from './notifications';

function expectMalformed(raw: string): MalformedKodiNotification {
  const result = parseKodiNotificationMessage(raw);

  expect(result.ok).toBe(false);
  if (result.ok) {
    throw new Error('Expected malformed notification.');
  }

  return result.error;
}

function notification(method: string): KodiNotification {
  return { jsonrpc: '2.0', method };
}

describe('Kodi notification classifiers', () => {
  it.each([
    'Player.OnPlay',
    'Player.OnPause',
    'Player.OnResume',
    'Player.OnStop',
    'Player.OnSeek',
    'Player.OnSpeedChanged',
    'Player.OnAVChange',
    'Player.OnPropertyChanged',
    'Application.OnVolumeChanged'
  ])('classifies %s as requiring player state refresh', (method) => {
    expect(isPlayerStateRefreshNotification(notification(method))).toBe(true);
    expect(isPlayerStateRefreshNotification(method)).toBe(true);
  });

  it.each(['Playlist.OnAdd', 'Playlist.OnClear', 'Playlist.OnRemove'])(
    'classifies %s as requiring queue refresh',
    (method) => {
      expect(isQueueRefreshNotification(notification(method))).toBe(true);
      expect(isQueueRefreshNotification(method)).toBe(true);
    }
  );

  it('does not classify unrelated library notifications as player or queue refreshes', () => {
    const method = 'VideoLibrary.OnUpdate';

    expect(isPlayerStateRefreshNotification(notification(method))).toBe(false);
    expect(isQueueRefreshNotification(notification(method))).toBe(false);
    expect(isPlayerStateRefreshNotification(method)).toBe(false);
    expect(isQueueRefreshNotification(method)).toBe(false);
  });

  it('returns false for unknown notification methods', () => {
    const method = 'GUI.OnScreensaverActivated';

    expect(isPlayerStateRefreshNotification(notification(method))).toBe(false);
    expect(isQueueRefreshNotification(notification(method))).toBe(false);
  });
});

describe('parseKodiNotificationMessage', () => {
  it('parses known JSON-RPC notifications without an id', () => {
    const result = parseKodiNotificationMessage(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'Player.OnPlay',
        params: { data: { player: { playerid: 1 } }, sender: 'xbmc' }
      })
    );

    expect(result).toEqual({
      ok: true,
      notification: {
        jsonrpc: '2.0',
        method: 'Player.OnPlay',
        params: { data: { player: { playerid: 1 } }, sender: 'xbmc' }
      }
    });
    if (result.ok) {
      const notification: KodiNotification = result.notification;
      expect(notification.method).toBe('Player.OnPlay');
    }
  });

  it('preserves unknown notification methods behind a typed envelope', () => {
    const result = parseKodiNotificationMessage(
      JSON.stringify({ jsonrpc: '2.0', method: 'GUI.OnScreensaverActivated' })
    );

    expect(result).toEqual({
      ok: true,
      notification: {
        jsonrpc: '2.0',
        method: 'GUI.OnScreensaverActivated'
      }
    });
  });

  it.each([
    ['', 'empty'],
    ['not-json', 'invalid-json'],
    ['[]', 'not-object'],
    [JSON.stringify({ method: 'Player.OnPlay' }), 'invalid-jsonrpc'],
    [JSON.stringify({ jsonrpc: '2.0' }), 'missing-method'],
    [JSON.stringify({ jsonrpc: '2.0', method: 42 }), 'invalid-method'],
    [JSON.stringify({ jsonrpc: '2.0', id: 1, result: 'pong' }), 'not-notification'],
    [JSON.stringify({ jsonrpc: '2.0', method: 'Player.OnPlay', id: 1 }), 'not-notification']
  ])('returns a typed malformed failure for %s', (raw, code) => {
    expect(expectMalformed(raw).code).toBe(code);
  });

  it('keeps malformed notification details secret-safe', () => {
    const secret = 'super-secret-token';
    const error = expectMalformed(`{"jsonrpc":"2.0","method":42,"password":"${secret}"}`);

    expect(error.message).toBe('Kodi WebSocket notification method must be a string.');
    expect(error.details).toEqual({ jsonrpc: '2.0', hasId: false, methodType: 'number' });
    expect(JSON.stringify(error)).not.toContain(secret);
    expect(JSON.stringify(error)).not.toContain('password');
  });
});

describe('parseKodiWebSocketMessage', () => {
  it('classifies notifications and JSON-RPC response frames separately', () => {
    expect(
      parseKodiWebSocketMessage(JSON.stringify({ jsonrpc: '2.0', method: 'Player.OnPlay' }))
    ).toEqual({
      ok: true,
      message: {
        kind: 'notification',
        notification: { jsonrpc: '2.0', method: 'Player.OnPlay' }
      }
    });

    expect(
      parseKodiWebSocketMessage(JSON.stringify({ jsonrpc: '2.0', id: 1, result: 'pong' }))
    ).toEqual({
      ok: true,
      message: { kind: 'response' }
    });
  });

  it('keeps genuinely malformed frames as parse errors', () => {
    expect(parseKodiWebSocketMessage('{not-json')).toMatchObject({
      ok: false,
      error: { code: 'invalid-json' }
    });
    expect(
      parseKodiWebSocketMessage(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 42 }))
    ).toMatchObject({
      ok: false,
      error: { code: 'invalid-method' }
    });
  });
});
