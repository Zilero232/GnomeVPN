import { describe, expect, it } from 'vitest';

import { isPlaceholderEmail, PLACEHOLDER_EMAIL, telegramPlaceholderEmail } from '../placeholder-email';

describe('telegramPlaceholderEmail', () => {
  it('derives one stable address per Telegram id', () => {
    expect(telegramPlaceholderEmail(123n)).toBe(telegramPlaceholderEmail('123'));
    expect(telegramPlaceholderEmail(123n)).not.toBe(telegramPlaceholderEmail(124n));
  });

  it('stays inside the reserved domain, so nothing it addresses can be delivered', () => {
    expect(telegramPlaceholderEmail(123n).endsWith(`.${PLACEHOLDER_EMAIL.domain}`)).toBe(true);
  });

  it('is recognised as a placeholder by the reader of the column', () => {
    expect(isPlaceholderEmail(telegramPlaceholderEmail(123n))).toBe(true);
  });
});

describe('isPlaceholderEmail', () => {
  it('leaves a real address alone', () => {
    expect(isPlaceholderEmail('someone@example.com')).toBe(false);
  });

  it('ignores case, because a mail column is not case sensitive', () => {
    expect(isPlaceholderEmail(telegramPlaceholderEmail(123n).toUpperCase())).toBe(true);
  });

  it('does not mistake the domain appearing anywhere else for a placeholder', () => {
    expect(isPlaceholderEmail(`${PLACEHOLDER_EMAIL.domain}@example.com`)).toBe(false);
  });
});
