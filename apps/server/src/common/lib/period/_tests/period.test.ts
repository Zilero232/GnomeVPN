import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isPeriodActive, nextPeriodEnd, resolveStatus } from '../period';

const NOW = new Date('2026-01-15T12:00:00.000Z');

describe('isPeriodActive', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports active for a period ending in the future', () => {
    expect(isPeriodActive(new Date('2026-02-15T12:00:00.000Z'))).toBe(true);
  });

  it('reports inactive for a period that already ended', () => {
    expect(isPeriodActive(new Date('2026-01-14T12:00:00.000Z'))).toBe(false);
  });

  it('reports inactive for a period ending exactly now', () => {
    expect(isPeriodActive(NOW)).toBe(false);
  });

  it('reports inactive for null', () => {
    expect(isPeriodActive(null)).toBe(false);
  });

  it('reports inactive for undefined', () => {
    expect(isPeriodActive(undefined)).toBe(false);
  });
});

describe('nextPeriodEnd', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('extends an active subscription from its existing period end', () => {
    const result = nextPeriodEnd({ currentPeriodEnd: new Date('2026-02-15T12:00:00.000Z'), months: 1 });

    expect(result.toISOString()).toBe('2026-03-15T12:00:00.000Z');
  });

  it('restarts from now when the period already expired', () => {
    const result = nextPeriodEnd({ currentPeriodEnd: new Date('2025-12-01T12:00:00.000Z'), months: 1 });

    expect(result.toISOString()).toBe('2026-02-15T12:00:00.000Z');
  });

  it('restarts from now when there is no period at all', () => {
    expect(nextPeriodEnd({ currentPeriodEnd: null, months: 1 }).toISOString()).toBe('2026-02-15T12:00:00.000Z');
  });

  it('restarts from now for an undefined period', () => {
    expect(nextPeriodEnd({ currentPeriodEnd: undefined, months: 3 }).toISOString()).toBe('2026-04-15T12:00:00.000Z');
  });

  it('adds several months at once', () => {
    expect(nextPeriodEnd({ currentPeriodEnd: null, months: 12 }).toISOString()).toBe('2027-01-15T12:00:00.000Z');
  });

  it('clamps to the last day of a shorter target month', () => {
    const result = nextPeriodEnd({ currentPeriodEnd: new Date('2026-01-31T12:00:00.000Z'), months: 1 });

    expect(result.toISOString()).toBe('2026-02-28T12:00:00.000Z');
  });
});

describe('resolveStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves to active while the period runs', () => {
    expect(resolveStatus(new Date('2026-02-15T12:00:00.000Z'))).toBe('active');
  });

  it('resolves to expired once the period passed', () => {
    expect(resolveStatus(new Date('2026-01-01T12:00:00.000Z'))).toBe('expired');
  });

  it('resolves to expired without a period', () => {
    expect(resolveStatus(null)).toBe('expired');
  });
});
