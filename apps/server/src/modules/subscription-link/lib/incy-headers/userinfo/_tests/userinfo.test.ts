import { getUnixTime } from 'date-fns';
import { describe, expect, it } from 'vitest';

import { userinfo } from '../userinfo';
import { USERINFO_HIDDEN } from '../userinfo.constants';

const periodEnd = new Date('2026-01-01T00:00:00.000Z');

describe('userinfo', () => {
  it('reports the expiry in whole seconds, which is what the app parses', () => {
    expect(userinfo(periodEnd)).toContain(`expire=${getUnixTime(periodEnd)}`);
  });

  it('reports no traffic limit, since the subscription has none', () => {
    expect(userinfo(periodEnd)).toContain('total=0');
  });

  it('hides the traffic block when there is no period to report', () => {
    expect(userinfo(null)).toBe(USERINFO_HIDDEN);
  });
});
