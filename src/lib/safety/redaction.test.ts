import { describe, expect, it } from 'vitest';

import { M005_BROWSER_PROOF_FORBIDDEN_TEXT } from '$lib/testing/m005BrowserProofFixtures';
import {
  isTextSecretSafe,
  redactDiagnosticText,
  redactJsonForDisplay,
  redactStoreErrorMessage,
  redactUiText
} from './redaction';

function expectSecretSafe(text: string): void {
  for (const forbidden of M005_BROWSER_PROOF_FORBIDDEN_TEXT) {
    expect(text, `expected output not to include ${forbidden}`).not.toContain(forbidden);
  }
  expect(isTextSecretSafe(text)).toBe(true);
}

describe('diagnostic redaction', () => {
  it('redacts the M005 forbidden token list from diagnostic text', () => {
    const text = `
      http://admin:p@ssword@kodi.local:8080/jsonrpc
      https://kodi.local/jsonrpc
      Authorization: Basic YWRtaW46cEBzc3dvcmQ=
      localStorage sessionStorage admin:p@ssword super-secret-password
      SENTINEL_SECRET CHORUS3_SENTINEL_SECRET
      smb://nas/media/movie.mkv special://profile/playlists/music/recent.xsp file:///Users/me/movie.mkv
    `;

    const redacted = redactDiagnosticText(text);

    expectSecretSafe(redacted);
    expect(redacted).toContain('[redacted');
  });

  it('redacts thrown-error text without throwing', () => {
    const error = new Error(
      'Request failed for http://admin:p@ssword@kodi.local/jsonrpc with Authorization: Basic SECRET and payload SENTINEL_SECRET'
    );

    const redacted = redactDiagnosticText(error);

    expectSecretSafe(redacted);
    expect(redacted).not.toMatch(/payload|Authorization|Basic|password|token|secret/i);
  });

  it('redacts nested JSON-RPC payload text from store and UI messages', () => {
    const payload =
      'failed with {"jsonrpc":"2.0","method":"Input.SendText","params":{"text":"CHORUS3_SENTINEL_SECRET admin:p@ssword"},"id":1} from localStorage';

    const storeText = redactStoreErrorMessage(payload);
    const uiText = redactUiText(payload);

    expect(storeText).toContain('redacted payload');
    expect(uiText).toContain('redacted payload');
    expect(storeText).not.toMatch(/CHORUS3_SENTINEL_SECRET|admin:p@ssword|Input\.SendText/u);
    expect(uiText).not.toMatch(/CHORUS3_SENTINEL_SECRET|admin:p@ssword|Input\.SendText/u);
  });

  it('redacts nested raw request-like objects for display', () => {
    const diagnostic = {
      request: {
        url: 'http://admin:p@ssword@kodi.local:8080/jsonrpc',
        headers: {
          Authorization: 'Basic YWRtaW46cEBzc3dvcmQ=',
          'X-Api-Token': 'SENTINEL_SECRET'
        },
        body: {
          payload: 'raw body contains smb://nas/media/movie.mkv and super-secret-password',
          nested: ['special://profile/keymaps/keyboard.xml', 'C:\\Users\\keith\\Videos\\movie.mkv']
        }
      },
      response: {
        rawPayload: 'file:///Users/keith/Movies/secret.mkv',
        result: { path: '/Users/keith/Movies/secret.mkv' }
      }
    };

    const redacted = redactJsonForDisplay(diagnostic);

    expectSecretSafe(redacted);
    expect(redacted).not.toMatch(
      /Authorization|Basic|password|token|secret|body|payload|response|raw/i
    );
    expect(redacted).toContain('[redacted');
  });

  it('handles arrays, nested objects, circular references, and hostile toJSON values safely', () => {
    const circular: Record<string, unknown> = {
      safe: 'visible status',
      values: ['smb://nas/media/song.flac']
    };
    circular.self = circular;
    circular.hostile = {
      toJSON() {
        throw new Error('toJSON leaked SENTINEL_SECRET');
      }
    };

    const redacted = redactJsonForDisplay(circular);

    expect(redacted).toContain('visible status');
    expect(redacted).toContain('[Circular]');
    expectSecretSafe(redacted);
  });

  it('classifies unsafe text using the same redaction boundary', () => {
    expect(isTextSecretSafe('safe call status at 2026-05-01T20:00:00.000Z')).toBe(true);
    expect(isTextSecretSafe('Authorization: Basic SENTINEL_SECRET')).toBe(false);
    expect(isTextSecretSafe('payload at C:\\Users\\keith\\Videos\\movie.mkv')).toBe(false);
  });
});
