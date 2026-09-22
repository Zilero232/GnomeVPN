import { describe, expect, it } from 'vitest';

import { botIdOf } from '../bot-id';

describe('botIdOf', () => {
  it('reads the numeric id Telegram puts before the colon', () => {
    expect(botIdOf('123456789:AAExampleToken')).toBe('123456789');
  });

  it('answers null for a token that carries no id, rather than a half-value', () => {
    expect(botIdOf('AAExampleToken')).toBeNull();
    expect(botIdOf('')).toBeNull();
  });

  it('never returns the secret half of the token', () => {
    expect(botIdOf('123456789:AAExampleToken')).not.toContain('AAExampleToken');
  });
});
