import { describe, expect, it } from 'vitest';

import { slotHolders } from '../device-slots';

const at = (iso: string) => new Date(iso);

describe('slotHolders', () => {
  const devices = [
    { id: 'c', createdAt: at('2026-10-03T00:00:00Z') },
    { id: 'a', createdAt: at('2026-10-01T00:00:00Z') },
    { id: 'b', createdAt: at('2026-10-02T00:00:00Z') }
  ];

  it('keeps the oldest devices within the limit', () => {
    expect(slotHolders({ devices, limit: 2 })).toEqual(new Set(['a', 'b']));
  });

  it('holds every device when the limit covers them', () => {
    expect(slotHolders({ devices, limit: 5 })).toEqual(new Set(['a', 'b', 'c']));
  });

  it('breaks a tie on creation time by id, so the answer never flips between calls', () => {
    const tied = [
      { id: 'y', createdAt: at('2026-10-01T00:00:00Z') },
      { id: 'x', createdAt: at('2026-10-01T00:00:00Z') }
    ];

    expect(slotHolders({ devices: tied, limit: 1 })).toEqual(new Set(['x']));
  });

  it('holds nothing at a zero limit', () => {
    expect(slotHolders({ devices, limit: 0 }).size).toBe(0);
  });
});
