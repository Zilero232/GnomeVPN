import { describe, expect, it } from 'vitest';

import { SUBSCRIPTION_USERINFO_HIDDEN } from '../../../config';
import { incyHeaders, incyHeaderValue, incyUserinfo } from '../incy-headers';

const input = {
  currentPeriodEnd: new Date('2026-01-01T00:00:00.000Z'),
  clientUrl: 'https://gnomevpn.ru',
  supportUrl: 'https://t.me/gnomevpn',
  announce: null
};

describe('incyHeaderValue', () => {
  it('passes ascii through untouched', () => {
    expect(incyHeaderValue('GnomeVPN')).toBe('GnomeVPN');
  });

  it('base64-encodes non-ascii, which http headers cannot carry', () => {
    const encoded = incyHeaderValue('Подписка');

    expect(Buffer.from(encoded.replace('base64:', ''), 'base64').toString('utf8')).toBe('Подписка');
  });
});

describe('incyUserinfo', () => {
  it('reports the expiry in whole seconds', () => {
    expect(incyUserinfo(input.currentPeriodEnd)).toBe(`upload=0;download=0;total=0;expire=${input.currentPeriodEnd.getTime() / 1000}`);
  });

  it('hides the traffic block when there is no period to report', () => {
    expect(incyUserinfo(null)).toBe(SUBSCRIPTION_USERINFO_HIDDEN);
  });
});

describe('incyHeaders', () => {
  it('points the client at the account page', () => {
    expect(incyHeaders(input)['profile-web-page-url']).toBe(input.clientUrl);
  });

  it('omits the support link when none is configured', () => {
    expect(incyHeaders({ ...input, supportUrl: null })).not.toHaveProperty('support-url');
  });

  it('omits the announcement when there is nothing to announce', () => {
    expect(incyHeaders(input)).not.toHaveProperty('announce');
  });

  it('encodes an announcement the same way as any other header value', () => {
    const announce = 'Профилактика';

    expect(incyHeaders({ ...input, announce }).announce).toBe(incyHeaderValue(announce));
  });
});
