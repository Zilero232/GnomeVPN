import type { Device } from '@gnomevpn/schemas';

import { describe, expect, it } from 'vitest';

import { hasIncyWithoutHwid } from '../incy-without-hwid';

const device = (overrides: Partial<Device>): Device => ({
  id: 'd1',
  model: null,
  platform: null,
  osVersion: null,
  app: 'INCY',
  isIdentified: true,
  isOverLimit: false,
  createdAt: '2026-10-01T00:00:00.000Z',
  lastSeenAt: '2026-10-01T00:00:00.000Z',
  ...overrides
});

describe('hasIncyWithoutHwid', () => {
  it('spots INCY that sends no hardware id', () => {
    expect(hasIncyWithoutHwid([device({ isIdentified: false })])).toBe(true);
  });

  it('stays quiet when every INCY sends one', () => {
    expect(hasIncyWithoutHwid([device({})])).toBe(false);
  });

  it('ignores other apps, which never send one', () => {
    expect(hasIncyWithoutHwid([device({ app: 'Hiddify', isIdentified: false })])).toBe(false);
  });
});
