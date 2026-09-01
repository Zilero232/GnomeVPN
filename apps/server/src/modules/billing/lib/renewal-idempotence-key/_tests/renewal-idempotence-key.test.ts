import { describe, expect, it } from 'vitest';

import { renewalIdempotenceKey } from '../renewal-idempotence-key';

describe('renewalIdempotenceKey', () => {
  it('builds the key from the user id and the iso period end', () => {
    expect(renewalIdempotenceKey({ currentPeriodEnd: new Date('2026-01-15T12:00:00.000Z'), userId: 'user-1' })).toBe(
      'renew-user-1-2026-01-15T12:00:00.000Z'
    );
  });

  it('gives two different period ends two different keys', () => {
    const first = renewalIdempotenceKey({ currentPeriodEnd: new Date('2026-01-15T12:00:00.000Z'), userId: 'user-1' });
    const second = renewalIdempotenceKey({ currentPeriodEnd: new Date('2026-02-15T12:00:00.000Z'), userId: 'user-1' });

    expect(first).not.toBe(second);
  });

  it('gives two different users two different keys', () => {
    const first = renewalIdempotenceKey({ currentPeriodEnd: new Date('2026-01-15T12:00:00.000Z'), userId: 'user-1' });
    const second = renewalIdempotenceKey({ currentPeriodEnd: new Date('2026-01-15T12:00:00.000Z'), userId: 'user-2' });

    expect(first).not.toBe(second);
  });

  it('is stable for the same user and period end', () => {
    const input = { currentPeriodEnd: new Date('2026-01-15T12:00:00.000Z'), userId: 'user-1' };

    expect(renewalIdempotenceKey(input)).toBe(renewalIdempotenceKey(input));
  });
});
