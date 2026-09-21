import { describe, expect, it } from 'vitest';

import { botLink } from '../bot-link';
import { TELEGRAM } from '../bot-link.constants';

describe('botLink', () => {
  it('builds a deep link carrying the code', () => {
    expect(botLink({ bot: 'gnomevpn_bot', code: 'ABCD2345' })).toBe(`${TELEGRAM.base}/gnomevpn_bot?start=ABCD2345`);
  });

  it('drops a leading @ so a handle copied from Telegram still resolves', () => {
    const withAt = botLink({ bot: `${TELEGRAM.atSign}gnomevpn_bot`, code: 'ABCD2345' });

    expect(withAt).toBe(botLink({ bot: 'gnomevpn_bot', code: 'ABCD2345' }));
    expect(withAt).not.toContain(TELEGRAM.atSign);
  });

  it('escapes both halves rather than pasting them in raw', () => {
    expect(botLink({ bot: 'bot name', code: 'a b&c' })).toBe(`${TELEGRAM.base}/bot%20name?start=a%20b%26c`);
  });

  it('omits the code when there is none, so the link just opens the bot', () => {
    expect(botLink({ bot: 'gnomevpn_bot' })).toBe(`${TELEGRAM.base}/gnomevpn_bot`);
  });
});
