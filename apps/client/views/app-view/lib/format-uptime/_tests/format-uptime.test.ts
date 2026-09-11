import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formatUptime } from '../format-uptime';

const NOW = new Date('2026-03-10T12:00:00.000Z');

const ago = (milliseconds: number) => new Date(NOW.getTime() - milliseconds);

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('formatUptime', () => {
  it('pads a fresh tunnel to a full clock', () => {
    expect(formatUptime(NOW)).toBe('00:00:00');
  });

  it('counts seconds', () => {
    expect(formatUptime(ago(7 * SECOND))).toBe('00:00:07');
  });

  it('counts minutes and seconds', () => {
    expect(formatUptime(ago(9 * MINUTE + 5 * SECOND))).toBe('00:09:05');
  });

  it('counts hours below a day', () => {
    expect(formatUptime(ago(23 * HOUR + 59 * MINUTE + 59 * SECOND))).toBe('23:59:59');
  });

  it('rolls a day into hours rather than restarting the count', () => {
    expect(formatUptime(ago(DAY + HOUR))).toBe('25:00:00');
  });

  it('keeps counting past a hundred hours without truncating', () => {
    expect(formatUptime(ago(5 * DAY + 4 * HOUR))).toBe('124:00:00');
  });

  it('reports a month-long tunnel in hours', () => {
    expect(formatUptime(ago(31 * DAY))).toBe('744:00:00');
  });
});
