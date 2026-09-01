import { describe, expect, it } from 'vitest';

import { extraDevicesPriceRub, resolveLimits } from '../addons';

describe('resolveLimits', () => {
  it('falls back to the base limits for null', () => {
    expect(resolveLimits(null)).toMatchObject({ deviceLimit: 2, configLimit: 5, extraDevices: 0 });
  });

  it('falls back to the base limits for undefined', () => {
    expect(resolveLimits(undefined)).toMatchObject({ deviceLimit: 2, configLimit: 5, extraDevices: 0 });
  });

  it('clamps a negative count to zero', () => {
    expect(resolveLimits(-4)).toMatchObject({ deviceLimit: 2, configLimit: 5, extraDevices: 0 });
  });

  it('caps anything above the maximum', () => {
    expect(resolveLimits(99)).toMatchObject({ deviceLimit: 10, configLimit: 21, extraDevices: 8 });
  });

  it('adds two configs per extra device', () => {
    expect(resolveLimits(3)).toMatchObject({ deviceLimit: 5, configLimit: 11, extraDevices: 3 });
  });

  it('reports the price and the ceiling alongside the limits', () => {
    expect(resolveLimits(1)).toMatchObject({ pricePerDeviceRub: 50, maxExtraDevices: 8 });
  });
});

describe('extraDevicesPriceRub', () => {
  it('charges nothing for no extra devices', () => {
    expect(extraDevicesPriceRub(0)).toBe(0);
  });

  it('charges the per-device price for every device', () => {
    expect(extraDevicesPriceRub(1)).toBe(50);
    expect(extraDevicesPriceRub(4)).toBe(200);
  });
});
