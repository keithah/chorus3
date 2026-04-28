import { describe, expect, it } from 'vitest';

import {
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
