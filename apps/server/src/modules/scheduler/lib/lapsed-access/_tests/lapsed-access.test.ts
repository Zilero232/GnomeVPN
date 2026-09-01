import { describe, expect, it } from 'vitest';

import { lapsedBefore } from '../lapsed-access';

const MOMENT = new Date('2026-01-15T12:00:00.000Z');

describe('lapsedBefore', () => {
  it('matches a user through any of three lapsed conditions', () => {
    expect(lapsedBefore(MOMENT)).toEqual({
      OR: [{ subscription: null }, { subscription: { currentPeriodEnd: null } }, { subscription: { currentPeriodEnd: { lt: MOMENT } } }]
    });
  });

  it('matches a user with no subscription at all', () => {
    expect(lapsedBefore(MOMENT).OR).toContainEqual({ subscription: null });
  });

  it('matches a subscription with no period end', () => {
    expect(lapsedBefore(MOMENT).OR).toContainEqual({ subscription: { currentPeriodEnd: null } });
  });

  it('matches a subscription whose period end is before the moment', () => {
    expect(lapsedBefore(MOMENT).OR).toContainEqual({ subscription: { currentPeriodEnd: { lt: MOMENT } } });
  });

  it('carries the given moment into the comparison', () => {
    const other = new Date('2027-06-01T00:00:00.000Z');

    expect(lapsedBefore(other).OR).toContainEqual({ subscription: { currentPeriodEnd: { lt: other } } });
  });
});
