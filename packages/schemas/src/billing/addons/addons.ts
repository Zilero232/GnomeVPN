import { CONFIGS_PER_DEVICE, DEFAULT_CONFIG_LIMIT, DEFAULT_DEVICE_LIMIT, EXTRA_DEVICE_PRICE_RUB, MAX_EXTRA_DEVICES } from './addons.constants';

export const resolveLimits = (extraDevices: number | null | undefined) => {
  const extra = Math.max(0, Math.min(extraDevices ?? 0, MAX_EXTRA_DEVICES));

  return {
    deviceLimit: DEFAULT_DEVICE_LIMIT + extra,
    configLimit: DEFAULT_CONFIG_LIMIT + extra * CONFIGS_PER_DEVICE,
    extraDevices: extra,
    pricePerDeviceRub: EXTRA_DEVICE_PRICE_RUB,
    maxExtraDevices: MAX_EXTRA_DEVICES
  };
};

export const extraDevicesPriceRub = (quantity: number): number => quantity * EXTRA_DEVICE_PRICE_RUB;
