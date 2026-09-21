import { describe, expect, it } from 'vitest';

import { AT_SIGN, TELEGRAM_BASE } from '../TelegramCode.constants';
import { botLink } from '../TelegramCode.helpers';

describe('botLink', () => {
  it('builds a deep link carrying the code', () => {
    expect(botLink({ bot: 'gnomevpn_bot', code: 'ABCD2345' })).toBe(`${TELEGRAM_BASE}/gnomevpn_bot?start=ABCD2345`);
  });

  it('drops a leading @ so a handle copied from Telegram still resolves', () => {
    const withAt = botLink({ bot: `${AT_SIGN}gnomevpn_bot`, code: 'ABCD2345' });

    expect(withAt).toBe(botLink({ bot: 'gnomevpn_bot', code: 'ABCD2345' }));
    expect(withAt).not.toContain(AT_SIGN);
  });

  it('escapes both halves rather than pasting them in raw', () => {
    expect(botLink({ bot: 'bot name', code: 'a b&c' })).toBe(`${TELEGRAM_BASE}/bot%20name?start=a%20b%26c`);
  });
});
