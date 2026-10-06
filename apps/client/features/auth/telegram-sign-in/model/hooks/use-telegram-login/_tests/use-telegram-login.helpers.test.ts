import { describe, expect, it } from 'vitest';

import { payloadOf } from '../use-telegram-login.helpers';

describe('payloadOf', () => {
  it('turns every field into a string, which is what the server hashes to check the signature', () => {
    const payload = payloadOf({ id: 42, first_name: 'Ann', auth_date: 1_700_000_000, hash: 'abc' });

    expect(payload).toEqual({ id: '42', first_name: 'Ann', auth_date: '1700000000', hash: 'abc' });
  });

  it('keeps the optional fields Telegram sent and invents none it did not', () => {
    const payload = payloadOf({ id: 1, first_name: 'A', auth_date: 2, hash: 'h', username: 'ann' });

    expect(Object.keys(payload).sort()).toEqual(['auth_date', 'first_name', 'hash', 'id', 'username']);
  });
});
