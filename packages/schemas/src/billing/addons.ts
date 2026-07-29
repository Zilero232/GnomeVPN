export const DEFAULT_DEVICE_LIMIT = 2;

export const DEFAULT_CONFIG_LIMIT = 5;

export const MAX_EXTRA_DEVICES = 8;

export const EXTRA_DEVICE_PRICE_RUB = 50;

export const CONFIGS_PER_DEVICE = 2;

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
