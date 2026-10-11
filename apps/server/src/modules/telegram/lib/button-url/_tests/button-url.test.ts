import { describe, expect, it } from 'vitest';

import { isButtonUrl } from '../button-url';

describe('isButtonUrl', () => {
  it('accepts a public https address, the only kind Telegram puts behind a button', () => {
    expect(isButtonUrl('https://yoomoney.ru/checkout/payments/v2/contract?orderId=1')).toBe(true);
  });

  it('refuses plain http and app schemes, which Telegram rejects as BUTTON_URL_INVALID', () => {
    expect(isButtonUrl('http://example.com')).toBe(false);
    expect(isButtonUrl('incy://import/abc')).toBe(false);
  });

  it('refuses a local address, so the dev setup still sends the link as text', () => {
    expect(isButtonUrl('https://localhost:3000/telegram?code=x')).toBe(false);
    expect(isButtonUrl('https://127.0.0.1/x')).toBe(false);
  });

  it('refuses something that is not a URL at all', () => {
    expect(isButtonUrl('not a url')).toBe(false);
  });
});
