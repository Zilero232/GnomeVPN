import { describe, expect, it } from 'vitest';

import { activeSince } from '../../active-access';
import { lapsedBefore } from '../lapsed-access';

const MOMENT = new Date('2026-01-15T12:00:00.000Z');

const isLapsed = (currentPeriodEnd: Date | null, moment: Date): boolean => {
  const clauses = lapsedBefore(moment).OR ?? [];

  return clauses.some((clause) => {
    const subscription = 'subscription' in clause ? clause.subscription : undefined;

    if (subscription === null) {
      return false;
    }

    const end = subscription && 'currentPeriodEnd' in subscription ? subscription.currentPeriodEnd : undefined;

    if (end === null) {
      return currentPeriodEnd === null;
    }

    return end !== null && typeof end === 'object' && 'lt' in end && currentPeriodEnd !== null && currentPeriodEnd < (end.lt as Date);
  });
};

const isActive = (currentPeriodEnd: Date | null, moment: Date): boolean => {
  const subscription = activeSince(moment).subscription;
  const end = subscription && 'currentPeriodEnd' in subscription ? subscription.currentPeriodEnd : undefined;
  const floor = end && typeof end === 'object' && 'gte' in end ? (end.gte as Date) : null;

  return currentPeriodEnd !== null && floor !== null && currentPeriodEnd >= floor;
};

describe('lapsedBefore', () => {
  it('carries the given moment into the comparison', () => {
    const other = new Date('2027-06-01T00:00:00.000Z');

    expect(lapsedBefore(other).OR).toContainEqual({ subscription: { currentPeriodEnd: { lt: other } } });
  });

  it('treats a missing subscription as lapsed', () => {
    expect(lapsedBefore(MOMENT).OR).toContainEqual({ subscription: null });
  });

  it('treats a subscription with no period end as lapsed', () => {
    expect(lapsedBefore(MOMENT).OR).toContainEqual({ subscription: { currentPeriodEnd: null } });
  });
});

describe('lapsedBefore and activeSince', () => {
  it('never both match a period that ended before the moment', () => {
    const ended = new Date('2026-01-01T00:00:00.000Z');

    expect(isLapsed(ended, MOMENT)).toBe(true);
    expect(isActive(ended, MOMENT)).toBe(false);
  });

  it('never both match a period that runs past the moment', () => {
    const running = new Date('2026-02-01T00:00:00.000Z');

    expect(isLapsed(running, MOMENT)).toBe(false);
    expect(isActive(running, MOMENT)).toBe(true);
  });

  it('puts a period ending exactly at the moment on the active side', () => {
    expect(isLapsed(MOMENT, MOMENT)).toBe(false);
    expect(isActive(MOMENT, MOMENT)).toBe(true);
  });
});
