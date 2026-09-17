import { describe, expect, it } from 'vitest';

import { extraDevicesPriceRub, resolveLimits } from '../addons';
import { DEFAULT_DEVICE_LIMIT, EXTRA_DEVICE_PRICE_RUB, MAX_EXTRA_DEVICES } from '../addons.constants';

describe('resolveLimits', () => {
  it('falls back to the base limit when nothing was bought', () => {
    for (const input of [null, undefined, 0]) {
      expect(resolveLimits(input)).toMatchObject({ deviceLimit: DEFAULT_DEVICE_LIMIT, extraDevices: 0 });
    }
  });

  it('clamps a negative count to zero rather than shrinking the limit', () => {
    expect(resolveLimits(-4)).toMatchObject({ deviceLimit: DEFAULT_DEVICE_LIMIT, extraDevices: 0 });
  });

  it('caps anything above the maximum', () => {
    expect(resolveLimits(MAX_EXTRA_DEVICES + 91)).toMatchObject({
      deviceLimit: DEFAULT_DEVICE_LIMIT + MAX_EXTRA_DEVICES,
      extraDevices: MAX_EXTRA_DEVICES
    });
  });

  it('adds one device slot per device bought', () => {
    const bought = 3;

    expect(resolveLimits(bought).deviceLimit).toBe(DEFAULT_DEVICE_LIMIT + bought);
  });

  it('reports the price and the ceiling alongside the limits', () => {
    expect(resolveLimits(1)).toMatchObject({ pricePerDeviceRub: EXTRA_DEVICE_PRICE_RUB, maxExtraDevices: MAX_EXTRA_DEVICES });
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
