import type { User } from 'grammy/types';

import { describe, expect, it } from 'vitest';

import { identityOf } from '../identity';

const user = (overrides: Partial<User> = {}): User => ({
  id: 42,
  is_bot: false,
  first_name: 'Reader',
  ...overrides
});

describe('identityOf', () => {
  it('returns null when the update carries no sender', () => {
    expect(identityOf(undefined)).toBeNull();
  });

  it('carries the id as a bigint so a large one survives', () => {
    const large = 8_000_000_000_000_000_001n;

    expect(identityOf(user({ id: Number(large) }))?.telegramId).toBeTypeOf('bigint');
    expect(identityOf(user())?.telegramId).toBe(42n);
  });

  it('reads the optional fields as null rather than undefined', () => {
    expect(identityOf(user())).toEqual({ telegramId: 42n, username: null, languageCode: null });
  });

  it('keeps the username and language when the sender has them', () => {
    const identity = identityOf(user({ username: 'reader', language_code: 'ru-RU' }));

    expect(identity).toEqual({ telegramId: 42n, username: 'reader', languageCode: 'ru-RU' });
  });
});
