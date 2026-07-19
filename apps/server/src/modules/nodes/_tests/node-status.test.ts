import { describe, expect, it } from 'vitest';

import { resolveNodeStatus } from '../lib/node-status';

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

describe('resolveNodeStatus', () => {
  it('считает узел offline, когда он выключен вручную', () => {
    expect(resolveNodeStatus({ enabled: false, lastHealthyAt: new Date() })).toBe('offline');
  });

  it('считает узел offline, когда он ни разу не отвечал', () => {
    expect(resolveNodeStatus({ enabled: true, lastHealthyAt: null })).toBe('offline');
  });

  it('считает узел online при свежей проверке', () => {
    expect(resolveNodeStatus({ enabled: true, lastHealthyAt: minutesAgo(1) })).toBe('online');
  });

  it('считает узел degraded, когда проверка устарела', () => {
    expect(resolveNodeStatus({ enabled: true, lastHealthyAt: minutesAgo(6) })).toBe('degraded');
  });

  it('считает узел offline, когда проверка совсем протухла', () => {
    expect(resolveNodeStatus({ enabled: true, lastHealthyAt: minutesAgo(20) })).toBe('offline');
  });
});
