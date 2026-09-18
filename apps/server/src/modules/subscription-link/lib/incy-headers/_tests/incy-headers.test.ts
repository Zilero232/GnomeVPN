import { describe, expect, it } from 'vitest';

import { headerValue } from '../header-value';
import { incyHeaders } from '../incy-headers';
import { userinfo } from '../userinfo';

const input = {
  currentPeriodEnd: new Date('2026-01-01T00:00:00.000Z'),
  traffic: { up: 1_024, down: 8_192 },
  clientUrl: 'https://gnomevpn.ru',
  supportUrl: 'https://t.me/gnomevpn',
  announce: null
};

describe('incyHeaders', () => {
  it('points the client at the account page', () => {
    expect(incyHeaders(input)['profile-web-page-url']).toBe(input.clientUrl);
  });

  it('carries the expiry the app renders as a countdown', () => {
    expect(incyHeaders(input)['subscription-userinfo']).toBe(userinfo({ currentPeriodEnd: input.currentPeriodEnd, traffic: input.traffic }));
  });

  it('omits the support link when none is configured', () => {
    expect(incyHeaders({ ...input, supportUrl: null })).not.toHaveProperty('support-url');
  });

  it('omits the announcement when there is nothing to announce', () => {
    expect(incyHeaders(input)).not.toHaveProperty('announce');
  });

  it('encodes an announcement the same way as any other header value', () => {
    const announce = 'Профилактика';

    expect(incyHeaders({ ...input, announce }).announce).toBe(headerValue(announce));
  });
});
