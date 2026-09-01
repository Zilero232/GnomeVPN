import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveNodeStatus } from '../node-status';

const NOW = new Date('2026-01-15T12:00:00.000Z');

const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

describe('resolveNodeStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports offline for an unavailable node even with a fresh health check', () => {
    expect(resolveNodeStatus({ isAvailable: false, lastHealthyAt: NOW })).toBe('offline');
  });

  it('reports offline when the node was never healthy', () => {
    expect(resolveNodeStatus({ isAvailable: true, lastHealthyAt: null })).toBe('offline');
  });

  it('reports online for a health check inside the online window', () => {
    expect(resolveNodeStatus({ isAvailable: true, lastHealthyAt: minutesAgo(1) })).toBe('online');
  });

  it('reports online for a health check made right now', () => {
    expect(resolveNodeStatus({ isAvailable: true, lastHealthyAt: NOW })).toBe('online');
  });

  it('reports degraded between the online and the degraded window', () => {
    expect(resolveNodeStatus({ isAvailable: true, lastHealthyAt: minutesAgo(5) })).toBe('degraded');
  });

  it('reports degraded exactly at the online window edge', () => {
    expect(resolveNodeStatus({ isAvailable: true, lastHealthyAt: minutesAgo(3) })).toBe('degraded');
  });

  it('reports offline exactly at the degraded window edge', () => {
    expect(resolveNodeStatus({ isAvailable: true, lastHealthyAt: minutesAgo(10) })).toBe('offline');
  });

  it('reports offline for a stale health check', () => {
    expect(resolveNodeStatus({ isAvailable: true, lastHealthyAt: minutesAgo(60) })).toBe('offline');
  });
});
