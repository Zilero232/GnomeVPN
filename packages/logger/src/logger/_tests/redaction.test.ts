import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';

import { CENSOR, REDACTED_PATHS, SECRET_FIELDS } from '../redaction.constants';

const capture = (fields: Record<string, unknown>): Record<string, unknown> => {
  const chunks: string[] = [];

  const sink = new Writable({
    write: (chunk, _encoding, done) => {
      chunks.push(String(chunk));
      done();
    }
  });

  pino({ redact: { paths: REDACTED_PATHS, censor: CENSOR } }, sink).info(fields, 'line');

  return JSON.parse(chunks.join(''));
};

describe('REDACTED_PATHS', () => {
  it('is a list pino accepts, so a typo in it fails here rather than at boot', () => {
    expect(() => capture({})).not.toThrow();
  });

  it('censors every secret field at the top level', () => {
    const line = capture(Object.fromEntries(SECRET_FIELDS.map((field) => [field, 'secret'])));

    for (const field of SECRET_FIELDS) {
      expect(line[field]).toBe(CENSOR);
    }
  });

  it('censors a secret one object down, which is how a node or a peer is usually logged', () => {
    const line = capture({ node: { apiUrl: 'http://203.0.113.10:2053/abcdef', id: 'n1' } });

    expect(line.node).toEqual({ apiUrl: CENSOR, id: 'n1' });
  });

  it('censors the headers that carry a session or the webhook secret', () => {
    const line = capture({
      req: { headers: { authorization: 'Bearer x', cookie: 'a=b', 'x-telegram-bot-api-secret-token': 's', accept: '*/*' } }
    });

    expect(line.req).toEqual({
      headers: { authorization: CENSOR, cookie: CENSOR, 'x-telegram-bot-api-secret-token': CENSOR, accept: '*/*' }
    });
  });

  it('leaves an ordinary field alone', () => {
    expect(capture({ host: '203.0.113.10' }).host).toBe('203.0.113.10');
  });
});
