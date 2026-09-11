import { describe, expect, it } from 'vitest';

import { extraDevicesPriceRub, resolveLimits } from '../addons';
import { EXTRA_DEVICE_PRICE_RUB } from '../addons.constants';

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
    expect(resolveLimits(1)).toMatchObject({ pricePerDeviceRub: EXTRA_DEVICE_PRICE_RUB, maxExtraDevices: 8 });
  });
});

describe('extraDevicesPriceRub', () => {
  it('grows by one device price for each device added', () => {
    for (const quantity of [0, 1, 2, 7]) {
      expect(extraDevicesPriceRub(quantity + 1) - extraDevicesPriceRub(quantity)).toBe(EXTRA_DEVICE_PRICE_RUB);
    }
  });

  it('charges nothing for no extra devices', () => {
    expect(extraDevicesPriceRub(0)).toBe(0);
  });

  it('charges the per-device price for every device', () => {
    expect(extraDevicesPriceRub(1)).toBe(EXTRA_DEVICE_PRICE_RUB);
    expect(extraDevicesPriceRub(4)).toBe(4 * EXTRA_DEVICE_PRICE_RUB);
  });
});
