import { getUnixTime } from 'date-fns';
import { describe, expect, it } from 'vitest';

import { userinfo } from '../userinfo';
import { NO_TRAFFIC_LIMIT, USERINFO_HIDDEN } from '../userinfo.constants';

const periodEnd = new Date('2026-01-01T00:00:00.000Z');

const traffic = { up: 1_024, down: 8_192 };

describe('userinfo', () => {
  it('reports the expiry in whole seconds, which is what the app parses', () => {
    expect(userinfo({ currentPeriodEnd: periodEnd, traffic })).toContain(`expire=${getUnixTime(periodEnd)}`);
  });

  it('reports no traffic limit, since the subscription has none', () => {
    expect(userinfo({ currentPeriodEnd: periodEnd, traffic })).toContain(`total=${NO_TRAFFIC_LIMIT}`);
  });

  it('carries the bytes the node counted, so the app can render them', () => {
    const rendered = userinfo({ currentPeriodEnd: periodEnd, traffic });

    expect(rendered).toContain(`upload=${traffic.up}`);
    expect(rendered).toContain(`download=${traffic.down}`);
  });

  it('hides the traffic block when there is no period to report', () => {
    expect(userinfo({ currentPeriodEnd: null, traffic })).toBe(USERINFO_HIDDEN);
  });
});
