import { describe, expect, it } from 'vitest';

import { renewalIdempotenceKey } from '../renewal-idempotence-key';

const BASE = {
  currentPeriodEnd: new Date('2026-01-15T12:00:00.000Z'),
  userId: 'user-1',
  paymentMethodId: '2d9b1c2e-000f-5000-9000-1b2c3d4e5f60',
  amountRub: 199
};

describe('renewalIdempotenceKey', () => {
  it('fits the 64 characters YooKassa accepts', () => {
    const key = renewalIdempotenceKey({ ...BASE, userId: 'u'.repeat(200) });

    expect(key.length).toBeLessThanOrEqual(64);
  });

  it('is stable for the same charge', () => {
    expect(renewalIdempotenceKey(BASE)).toBe(renewalIdempotenceKey({ ...BASE }));
  });

  it('gives two different period ends two different keys', () => {
    expect(renewalIdempotenceKey(BASE)).not.toBe(renewalIdempotenceKey({ ...BASE, currentPeriodEnd: new Date('2026-02-15T12:00:00.000Z') }));
  });

  it('gives two different users two different keys', () => {
    expect(renewalIdempotenceKey(BASE)).not.toBe(renewalIdempotenceKey({ ...BASE, userId: 'user-2' }));
  });

  it('gives a re-bound card a fresh key, so YooKassa does not reject it as a reused one', () => {
    expect(renewalIdempotenceKey(BASE)).not.toBe(renewalIdempotenceKey({ ...BASE, paymentMethodId: 'another-card' }));
  });

  it('gives a changed price a fresh key', () => {
    expect(renewalIdempotenceKey(BASE)).not.toBe(renewalIdempotenceKey({ ...BASE, amountRub: 249 }));
  });
});
